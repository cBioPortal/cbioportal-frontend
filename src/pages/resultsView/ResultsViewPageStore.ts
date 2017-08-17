import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    findGeneticProfileIdDiscrete, fetchMyCancerGenomeData,
    fetchDiscreteCNAData, findMutationGeneticProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalDataInStudy, generateDataQueryFilter, makeStudyToCancerTypeMap,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData
} from "shared/lib/StoreUtils";
import {MutationMapperStore} from "./mutation/MutationMapperStore";
import AppConfig from "appConfig";
import * as _ from 'lodash';
import { IMPACT_GERMLINE_TESTING_CONSENT } from "shared/constants";

export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        addErrorHandler((error:any) => {
            this.ajaxErrors.push(error);
        });
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable studyId: string = '';
    @observable sampleListId: string|null = null;
    @observable hugoGeneSymbols: string[]|null = null;
    @observable sampleList: string[]|null = null;

    readonly mutationGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async () => findMutationGeneticProfileId(this.geneticProfilesInStudy, this.studyId)
    });

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    protected mutationMapperStores: {[hugoGeneSymbol: string]: MutationMapperStore} = {};

    public getMutationMapperStore(hugoGeneSymbol:string): MutationMapperStore|undefined
    {
        if (this.mutationMapperStores[hugoGeneSymbol]) {
            return this.mutationMapperStores[hugoGeneSymbol];
        }
        else if (!this.hugoGeneSymbols || !this.hugoGeneSymbols.find((gene:string) => gene === hugoGeneSymbol)) {
            return undefined;
        }
        else {
            const store = new MutationMapperStore(AppConfig,
                hugoGeneSymbol,
                this.mutationGeneticProfileId,
                this.sampleIds,
                this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.samplesWithoutCancerTypeClinicalData,
                this.sampleListId,
                this.patientIds,
                this.mskImpactGermlineConsentedPatientIds);

            this.mutationMapperStores[hugoGeneSymbol] = store;

            return store;
        }
    }

    readonly sampleIds = remoteData(async () => {
        // first priority: user provided custom sample list
        if (this.sampleList) {
            // cannot return an observable array directly, need to create a copy
            return this.sampleList.map(sampleId => sampleId);
        }
        // if no custom sample list try to fetch sample ids from the API
        else if (this.sampleListId) {
            return await client.getAllSampleIdsInSampleListUsingGET({
                sampleListId: this.sampleListId
            });
        }

        return [];
    }, []);

    readonly clinicalDataForSamples = remoteData({
        await: () => [
            this.sampleIds
        ],
        invoke: () => {
            const clinicalDataSingleStudyFilter = {attributeIds: ["CANCER_TYPE", "CANCER_TYPE_DETAILED"], ids: this.sampleIds.result};
            return fetchClinicalDataInStudy(this.studyId, clinicalDataSingleStudyFilter, 'SAMPLE')
        }
    }, []);

    readonly mskImpactGermlineConsentedPatientIds = remoteData({
        await: () => [this.patientIds],
        invoke: async () => {
            const clinicalDataSingleStudyFilter = {
                attributeIds: [IMPACT_GERMLINE_TESTING_CONSENT],
                ids: this.patientIds.result
            };
            const clinicalDataResponse = await fetchClinicalDataInStudy(
                this.studyId, clinicalDataSingleStudyFilter, 'PATIENT'
            );
            if (clinicalDataResponse) {
                return _.uniq(clinicalDataResponse.map(
                    (cd:ClinicalData) => cd.entityId)
                );
            } else {
                return [];
            }
        },
    }, []);

    readonly samples = remoteData({
        await: () => [
            this.sampleIds
        ],
        invoke: async () => fetchSamples(this.sampleIds, this.studyId)
    }, []);

    readonly samplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.sampleIds,
            this.clinicalDataForSamples
        ],
        invoke: async () => fetchSamplesWithoutCancerTypeClinicalData(this.sampleIds, this.studyId, this.clinicalDataForSamples)
    }, []);

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: async () => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
    }, []);

    readonly patientIds = remoteData({
        await: () => [this.samples],
        invoke: async () => {
            return _.chain(this.samples.result).map('patientId').uniq().value();
        },
    }, []);

    readonly studies = remoteData({
        invoke: async()=>([await client.getStudyUsingGET({studyId: this.studyId})])
    }, []);

    @computed get studyToCancerType() {
        return makeStudyToCancerTypeMap(this.studies.result);
    }

    readonly geneticProfilesInStudy = remoteData(() => {
        return client.getAllGeneticProfilesInStudyUsingGET({
            studyId: this.studyId
        });
    }, []);

    readonly geneticProfileIdDiscrete = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async () => {
            return findGeneticProfileIdDiscrete(this.geneticProfilesInStudy);
        }
    });

    readonly discreteCNAData = remoteData({
        await: () => [
            this.geneticProfileIdDiscrete,
            this.dataQueryFilter
        ],
        invoke: async () => {
            const filter = this.dataQueryFilter.result as DiscreteCopyNumberFilter;
            return fetchDiscreteCNAData(filter, this.geneticProfileIdDiscrete);
        },
        onResult: (result:DiscreteCopyNumberData[]) => {
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    readonly dataQueryFilter = remoteData({
        await: () => [
            this.sampleIds
        ],
        invoke: async () => generateDataQueryFilter(this.sampleListId, this.sampleIds.result)
    });

    @computed get mergedDiscreteCNAData():DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.geneticProfileIdDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache(this.studyId);
    }

    @cached get mutationCountCache() {
        return new MutationCountCache(this.mutationGeneticProfileId.result);
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
