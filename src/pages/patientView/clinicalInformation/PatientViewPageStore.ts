import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {
    ClinicalData, SampleIdentifier,
    GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter
} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import {computed, observable, action, reaction, autorun} from "mobx";
import {keepAlive} from "mobx-utils";
import oncokbClient from "../../../shared/api/oncokbClientInstance";
import {remoteData} from "../../../shared/api/remoteData";
import {IOncoKbData} from "../mutation/column/AnnotationColumnFormatter";
import {generateQueryVariant, generateEvidenceQuery} from "../../../shared/lib/OncoKbUtils";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {labelMobxPromises} from "../../../shared/api/MobxPromise";
import MrnaExprRankCache from './MrnaExprRankCache';
import request from 'superagent';
import AppConfig from 'appConfig';
import CohortVariantCountCache from "./CohortVariantCountCache";
import {EntrezToKeywordList} from "./CohortVariantCountCache";
import {SampleToEntrezListOrNull} from "./SampleGeneCache";
import DiscreteCNACache from "./DiscreteCNACache";

type PageMode = 'patient' | 'sample';

export function groupByEntityId(clinicalDataArray: Array<ClinicalData>)
{
    return _.map(
        _.groupBy(clinicalDataArray, 'entityId'),
        (v:ClinicalData[], k:string):ClinicalDataBySampleId => ({
            clinicalData: v,
            id: k,
        })
    );
}

export async function checkForTissueImage(patientId: string) : Promise<boolean> {

    if (/TCGA/.test(patientId) === false) {
        return false;
    } else {

        let resp = await request.get(`//${AppConfig.tissueImageCheckUrl}${patientId}`);

        let matches = resp.text.match(/<data total_count='([0-9]+)'>/);

        // if the count is greater than 0, there is a slide for this patient
        return ( (!!matches && parseInt(matches[1],10)) > 0 );
    }

}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>):ClinicalInformationData
{
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };
    const samples = groupByEntityId(clinicalDataSample);
    const rv = {
        patient,
        samples,
    };

    return rv;
}

export class PatientViewPageStore
{
    constructor()
    {
        labelMobxPromises(this);

        keepAlive(this, "variantCountCache");
        keepAlive(this, "mrnaExprRankCache");
        keepAlive(this, "discreteCNACache");
    }

    @observable private _patientId = '';
    @computed get patientId():string {
        if (this._patientId)
            return this._patientId;

        return this.derivedPatientId.result;
    }

    @observable studyId = '';

    @observable _sampleId = '';
    @computed get sampleId() {
        return this._sampleId;
    }

    @computed get pageMode(): PageMode {
        return this._sampleId ? 'sample' : 'patient';
    }

    @computed get mutationGeneticProfileId() {
        return `${this.studyId}_mutations`;
    }

    readonly derivedPatientId = remoteData<string>({
        await: () => [this.samples],
        invoke: async () => {
            for (let sample of this.samples.result)
                return sample.patientId;
            return '';
        },
        default: ''
    });

    readonly clinicalDataPatient = remoteData({
        await: () => this.pageMode === 'patient' ? [] : [this.derivedPatientId],
        invoke: async () => {
            if (this.studyId && this.patientId)
                return await client.getAllClinicalDataOfPatientInStudyUsingGET({
                    projection: 'DETAILED',
                    studyId: this.studyId,
                    patientId: this.patientId
                });
            return [];
        },
        default: []
    });

    readonly samples = remoteData(async () => {
        if (this.studyId && this._patientId)
            return await client.getAllSamplesOfPatientInStudyUsingGET({
                studyId: this.studyId,
                patientId: this.patientId
            });

        if (this.studyId && this._sampleId)
            return await client.getSampleInStudyUsingGET({
                studyId: this.studyId,
                sampleId: this.sampleId
            }).then(data => [data]);

        return [];
    }, []);


    readonly cnaSegments = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: this.samples.result.map(sample => ({
                sampleId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
    }, []);

    readonly clinicalDataForSamples = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            identifiers: this.samples.result.map(sample => ({
                entityId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
    }, []);

    readonly clinicalDataGroupedBySample = remoteData({
        await:() => [this.clinicalDataForSamples],
        invoke: async () => groupByEntityId(this.clinicalDataForSamples.result)
    }, []);

    readonly patientViewData = remoteData({
        await: () => [
            this.clinicalDataPatient,
            this.clinicalDataForSamples
        ],
        invoke: async () => transformClinicalInformationToStoreShape(
            this.patientId,
            this.studyId,
            this.clinicalDataPatient.result,
            this.clinicalDataForSamples.result
        )
    },{});

    readonly geneticProfilesInStudy = remoteData(() => {
        return client.getAllGeneticProfilesInStudyUsingGET({
            studyId: this.studyId
        })
    }, []);

    private readonly mrnaRankGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async () => {
            const regex1 = /^.+rna_seq.*_zscores$/; // We prefer profiles that look like this
            const regex2 = /^.*_zscores$/; // If none of the above are available, we'll look for ones like this
            const preferredProfile:(GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                (gp:GeneticProfile) => regex1.test(gp.geneticProfileId.toLowerCase()));

            if (preferredProfile) {
                return preferredProfile.geneticProfileId;
            } else {
                const fallbackProfile:(GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                    (gp:GeneticProfile) => regex2.test(gp.geneticProfileId.toLowerCase()));

                return fallbackProfile ? fallbackProfile.geneticProfileId : null;
            }
        }
    }, null);

    readonly discreteCNAData = remoteData({

        await: () => [
            this.geneticProfilesInStudy,
            this.samples
        ],
        invoke: async () => {

            const sampleIds = this.samples.result.map((sample) => sample.sampleId);

            if (this.geneticProfileIdDiscrete.isComplete && this.geneticProfileIdDiscrete.result) {
                return await client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                    projection: 'DETAILED',
                    discreteCopyNumberFilter: {sampleIds: sampleIds} as DiscreteCopyNumberFilter,
                    geneticProfileId: this.geneticProfileIdDiscrete.result
                });
            } else {
                return [];
            }

        }

    },[]);

    readonly clinicalEvents = remoteData({

        await:() => [
           this.patientViewData
        ],
        invoke: async () => {

            return await client.getAllClinicalEventsOfPatientInStudyUsingGET({
                studyId:this.studyId, patientId:this.patientId, projection:'DETAILED'
            })

        }

    }, []);

    readonly geneticProfileIdDiscrete = remoteData({

        await: () => [
           this.geneticProfilesInStudy
        ],
        invoke: async () => {
            const profile = this.geneticProfilesInStudy.result.find((profile: GeneticProfile)=> {
                return profile.datatype === 'DISCRETE';
            });
            return profile ? profile.geneticProfileId : undefined;
        }

    });


    readonly hasTissueImageIFrameUrl = remoteData({
        await: () => [
            this.derivedPatientId
        ],
        invoke: async () => {

            return checkForTissueImage(this.patientId);

        }
    }, false);

    readonly mutationData = remoteData({
        await: () => [
            this.samples
        ],
        invoke: async () => {
            const geneticProfileId = this.mutationGeneticProfileId;
            if (geneticProfileId) {
                return await client.fetchMutationsInGeneticProfileUsingPOST({
                    geneticProfileId: geneticProfileId,
                    sampleIds: this.samples.result.map((sample:Sample) => sample.sampleId),
                    projection: "DETAILED"
                });
            } else {
                return [];
            }
    }}, []);

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            // generate sample id to cancer type mapping
            const generateSampleToTumorMap = function(data:ClinicalData[]) {
                const map:{[sampleId:string]: string} = {};

                _.each(data, function(clinicalData) {
                    if (clinicalData.clinicalAttributeId === "CANCER_TYPE") {
                        map[clinicalData.entityId] = clinicalData.value;
                    }
                });

                return map;
            };

            // generate query id to indicator map
            const generateIdToIndicatorMap = function(data:IndicatorQueryResp[]) {
                const map:{[id:string]: IndicatorQueryResp} = {};

                _.each(data, function(indicator) {
                    map[indicator.query.id] = indicator;
                });

                return map;
            };

            const sampleIdToTumorType = generateSampleToTumorMap(this.clinicalDataForSamples.result);

            const queryVariants = _.uniqBy(_.map(this.mutationData.result, function(mutation:Mutation) {
                return generateQueryVariant(mutation.gene.hugoGeneSymbol,
                    mutation.mutationType,
                    mutation.proteinChange,
                    mutation.proteinPosStart,
                    mutation.proteinPosEnd,
                    sampleIdToTumorType[mutation.sampleId]);
            }), "id");

            return new Promise((resolve, reject) => {
                const oncokbSearchPromise = oncokbClient.searchPostUsingPOST(
                    {body: generateEvidenceQuery(queryVariants)});

                // TODO return type is not correct for the auto-generated API!
                // generated return type is Array<IndicatorQueryResp>,
                // but the actual return type is {meta: {} data: Array<IndicatorQueryResp>}
                // that's why here we need to force data type to be any and get actual data by data.data
                oncokbSearchPromise.then((data:any) => {
                    const oncoKbData:IOncoKbData = {
                        sampleToTumorMap: sampleIdToTumorType,
                        indicatorMap: generateIdToIndicatorMap(data.data)
                    };

                    resolve(oncoKbData);
                });

                oncokbSearchPromise.catch(() => reject());
            });
        }
    }, {sampleToTumorMap: {}, indicatorMap: {}});

    @computed get mergedMutationData():Mutation[][] {
        let idToMutations:{[key:string]: Array<Mutation>} = {};
        let mutationId:string;
        let MutationId:(m:Mutation)=>string = (m:Mutation)=>{
            return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele].join("_");
        }

        for (const mutation of this.mutationData.result) {
            mutationId = MutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }

        return Object.keys(idToMutations).map(id => idToMutations[id]);
    }

    @action("SetSampleId") setSampleId(newId: string) {
        if (newId)
            this._patientId = '';
        this._sampleId = newId;
    }

    @action("SetPatientId") setPatientId(newId: string) {
        if (newId)
            this._sampleId = '';
        this._patientId = newId;
    }

    @computed get mrnaExprRankCache() {
        return new MrnaExprRankCache(this.samples.result.map((s:Sample)=>s.sampleId),
                                    this.mrnaRankGeneticProfileId.result);
    }

    @computed get variantCountCache() {
        return new CohortVariantCountCache(this.mutationGeneticProfileId);
    }

    @computed get discreteCNACache() {
        return new DiscreteCNACache(this.samples.result.map((s:Sample)=>s.sampleId),
                                    this.geneticProfileIdDiscrete.result);
    }

    @action requestAllVariantCountData() {
        const entrezToKeywordList:EntrezToKeywordList = {};
        for (const mutations of this.mergedMutationData) {
            if (mutations.length > 0) {
                const entrez = mutations[0].entrezGeneId;
                entrezToKeywordList[entrez] = entrezToKeywordList[entrez] || [];
                const kw = mutations[0].keyword;
                if (kw) {
                    entrezToKeywordList[entrez].push(kw);
                }
            }
        }
        this.variantCountCache.populate(entrezToKeywordList);
    }

    @action requestAllDiscreteCNAData() {
        const sampleToNull:SampleToEntrezListOrNull = {};
        for (const sample of this.samples.result) {
            sampleToNull[sample.sampleId] = null;
        }
        this.discreteCNACache.populate(sampleToNull);
    }

}
