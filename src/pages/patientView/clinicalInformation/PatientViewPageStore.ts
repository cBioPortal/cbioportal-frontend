import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {
    ClinicalData, SampleIdentifier,
    GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter
} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import {computed, observable, action, reaction, autorun} from "../../../../node_modules/mobx/lib/mobx";
import {remoteData} from "../../../shared/api/remoteData";
import {labelMobxPromises} from "../../../shared/api/MobxPromise";
import MrnaExprRankCache from './MrnaExprRankCache';
import DiscreteCNACache from './DiscreteCNACache';
import {default as CohortVariantCountCache, EntrezToKeywordList} from './CohortVariantCountCache';
import {SampleToEntrezListOrNull} from './SampleGeneCache';

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

        reaction(() => {
                    if (this.allDiscreteCNADataRequested) {
                        return [this.samples.result, this.discreteCNACache];
                    } else {
                        return [];
                    }
            },
            () => {
                if (this.allDiscreteCNADataRequested) {
                    this.discreteCNACache.populate(this.samples.result.reduce(
                        (arg:SampleToEntrezListOrNull, next:Sample) => {
                            arg[next.sampleId] = null;
                            return arg;
                        }, {}));
                }
            });

        reaction(() => {
                if (this.allVariantCountDataRequested) {
                    return [this.mutationData.result, this.cohortVariantCountCache];
                } else {
                    return [];
                }
            },
            () => {
                if (this.allVariantCountDataRequested) {
                    const querySet:{ [entrezGeneId:string]:{[s:string]:boolean}} = {};
                    for (const mutation of this.mutationData.result) {
                        querySet[mutation.entrezGeneId] = querySet[mutation.entrezGeneId] || {};
                        if (mutation.keyword) {
                            querySet[mutation.entrezGeneId][mutation.keyword] = true;
                        }
                    }
                    const query:EntrezToKeywordList = {};
                    for (const entrezGeneId of Object.keys(querySet)) {
                        query[parseInt(entrezGeneId, 10)] = Object.keys(querySet[entrezGeneId]);
                    }
                    this.cohortVariantCountCache.populate(query);
                }
            });
    }

    private _visibleMutations:Mutation[][] = [];

    @observable private allDiscreteCNADataRequested = false;
    @observable private allVariantCountDataRequested = false;
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
        console.log("here",this.studyId);
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
    
    @computed get discreteCNACache() {
        return new DiscreteCNACache(this.samples.result.map((s:Sample)=>s.sampleId),
                                    this.geneticProfileIdDiscrete.result);
    }

    @computed get cohortVariantCountCache() {
        return new CohortVariantCountCache(this.mutationGeneticProfileId);
    }

    private populateCachesForVisibleMutations() {
        if (!this.visibleMutations || this.visibleMutations.length === 0) {
            return;
        }
        const sampleToEntrezGeneIdsSet:{ [sampleId:string]:Set<number> } = {};
        const entrezToKeywordSet: { [entrezGeneId:number]:{[s:string]:boolean} } = {};
        for (const mutations of this.visibleMutations) {
            if (mutations && mutations.length > 0) {
                sampleToEntrezGeneIdsSet[mutations[0].sampleId] = sampleToEntrezGeneIdsSet[mutations[0].sampleId] || new Set();
                sampleToEntrezGeneIdsSet[mutations[0].sampleId].add(mutations[0].entrezGeneId);
                entrezToKeywordSet[mutations[0].entrezGeneId] = entrezToKeywordSet[mutations[0].entrezGeneId] || new Set();
                if (mutations[0].keyword) {
                    entrezToKeywordSet[mutations[0].entrezGeneId][mutations[0].keyword] = true;
                }
            }
        }
        const sampleToEntrezList:{ [sampleId:string]:number[]} = {};
        for (const sampleId of Object.keys(sampleToEntrezGeneIdsSet)) {
            sampleToEntrezList[sampleId] = Array.from(sampleToEntrezGeneIdsSet[sampleId]);
        }
        const entrezToKeywordList:{ [entrezGeneId:number]:string[] } = {};
        for (const entrez of Object.keys(entrezToKeywordSet)) {
            entrezToKeywordList[parseInt(entrez, 10)] = Object.keys(entrezToKeywordSet[parseInt(entrez, 10)]);
        }
        this.mrnaExprRankCache.populate(sampleToEntrezList);
        this.discreteCNACache.populate(sampleToEntrezList);
        this.cohortVariantCountCache.populate(entrezToKeywordList);
    }

    public get visibleMutations() {
        return this._visibleMutations;
    }

    public set visibleMutations(val:Mutation[][]) {
        /*if (_.isEqual(val, this._visibleMutations)) {
            return;
        }*/
        this._visibleMutations = val;

        this.populateCachesForVisibleMutations();
    }

    @action requestAllDiscreteCNAData() {
        this.allDiscreteCNADataRequested = true;
    }

    @action requestAllVariantCountData() {
        this.allVariantCountDataRequested = true;
    }
}
