import {
    Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter, Gene, CancerStudy
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PmidCache from "shared/cache/PmidCache";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotData} from "shared/model/CancerHotspots";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    indexHotspotData, fetchHotspotsData, mergeMutations, ONCOKB_DEFAULT,
    fetchCosmicData, fetchOncoKbData, findGeneticProfileIdDiscrete, fetchMyCancerGenomeData, fetchMutationData,
    fetchDiscreteCNAData, generateSampleIdToTumorTypeMap, findMutationGeneticProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalData, generateDataQueryFilter, makeStudyToCancerTypeMap
} from "shared/lib/StoreUtils";
import {MutationMapperStore} from "./mutation/MutationMapperStore";

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
            const store = new MutationMapperStore(hugoGeneSymbol,
                this.mutationGeneticProfileId,
                this.sampleIds,
                this.clinicalDataForSamples,
                this.sampleListId);

            this.mutationMapperStores[hugoGeneSymbol] = store;

            return store;
        }
    }

    readonly sampleIds = remoteData(async () => {
        // first priority: user provided custom sample list
        if (this.sampleList) {
            return this.sampleList;
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
        invoke: () => fetchClinicalData(this.studyId, this.sampleIds.result)
    }, []);

    readonly samples = remoteData({
        await: () => [
            this.sampleIds
        ],
        invoke: async () => fetchSamples(this.sampleIds, this.studyId)
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
            this.sampleIds
        ],
        invoke: async () => {
            const filter = this.dataQueryFilter as DiscreteCopyNumberFilter;
            return fetchDiscreteCNAData(filter, this.geneticProfileIdDiscrete);
        },
        onResult: (result:DiscreteCopyNumberData[]) => {
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    @computed get dataQueryFilter() {
        return generateDataQueryFilter(this.sampleListId, this.sampleIds.result);
    }

    @computed get mergedDiscreteCNAData():DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pmidCache() {
        return new PmidCache();
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
