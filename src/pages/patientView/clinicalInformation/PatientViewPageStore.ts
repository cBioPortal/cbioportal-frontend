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

        autorun(
            ()=> {
                if (!this.visibleRows || this.visibleRows.length === 0) {
                    return;
                }
                const sampleToEntrezGeneIds:{ [sampleId:string]:Set<number> } = {};
                for (const mutations of this.visibleRows) {
                    if (mutations && mutations.length > 0) {
                        sampleToEntrezGeneIds[mutations[0].sampleId] = sampleToEntrezGeneIds[mutations[0].sampleId] || new Set();
                        sampleToEntrezGeneIds[mutations[0].sampleId].add(mutations[0].entrezGeneId);
                    }
                }
                this.mrnaExprRankCache.populate(sampleToEntrezGeneIds);
            });

        this.setVisibleRows = this.setVisibleRows.bind(this);
    }

    @observable.ref private visibleRows:Mutation[][] = [];

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
        return new MrnaExprRankCache(this.mrnaRankGeneticProfileId.result);
    }

    @action setVisibleRows(rows:Mutation[][]) {
        this.visibleRows = rows || [];
    }
}
