import {
    Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter, Gene
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
import {
    indexHotspotData, fetchHotspotsData, mergeMutations, ONCOKB_DEFAULT,
    fetchCosmicData, fetchOncoKbData, findGeneticProfileIdDiscrete, fetchMyCancerGenomeData, fetchMutationData,
    fetchDiscreteCNAData, generateSampleIdToTumorTypeMap, findMutationGeneticProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalData
} from "shared/lib/StoreUtils";

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
        invoke: async() => findMutationGeneticProfileId(this.geneticProfilesInStudy, this.studyId)
    });

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData)
    });


    readonly hotspotData = remoteData({
        await: ()=> [
            this.mutationData
        ],
        invoke: async () => {
            return fetchHotspotsData(this.mutationData);
        },
        onError: () => {
            // fail silently
        }
    });

    readonly sampleIds = remoteData(async() => {
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
        invoke: async() => fetchSamples(this.sampleIds, this.studyId)
    }, []);

    readonly genes = remoteData(async() => {
        if (this.hugoGeneSymbols) {
            return await client.fetchGenesUsingPOST({
                // an observable array (hugoGeneSymbols) is incompatible with an API call,
                // we need to convert it to a regular array before the request
                geneIds: this.hugoGeneSymbols.slice(0),
                geneIdType: "HUGO_GENE_SYMBOL"
            });
        }

        return [];
    }, []);

    readonly mutationData = remoteData({
        await: () => [
            this.sampleIds,
            this.genes
        ],
        invoke: async() => {
            const mutationFilter = {
                ...this.apiDataFilter,
                entrezGeneIds: this.genes.result.map((gene: Gene) => gene.entrezGeneId)
            } as MutationFilter;

            return fetchMutationData(mutationFilter, this.mutationGeneticProfileId.result);
        }
    }, []);

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData
        ],
        invoke: async() => fetchOncoKbData(this.sampleIdToTumorType, this.mutationData)
    }, ONCOKB_DEFAULT);

    readonly geneticProfilesInStudy = remoteData(() => {
        return client.getAllGeneticProfilesInStudyUsingGET({
            studyId: this.studyId
        })
    }, []);

    readonly geneticProfileIdDiscrete = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async() => {
            return findGeneticProfileIdDiscrete(this.geneticProfilesInStudy);
        }
    });

    readonly discreteCNAData = remoteData({
        await: () => [
            this.geneticProfileIdDiscrete,
            this.sampleIds
        ],
        invoke: async() => {
            const filter = this.apiDataFilter as DiscreteCopyNumberFilter;
            return fetchDiscreteCNAData(filter, this.geneticProfileIdDiscrete);
        },
        onResult: (result:DiscreteCopyNumberData[])=>{
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    @computed get apiDataFilter() {
        let filter: {
            sampleIds?: string[],
            sampleListId?: string
        } = {};

        if (this.sampleListId) {
            filter = {
                sampleListId: this.sampleListId
            };
        }
        else if (this.sampleIds.result) {
            filter = {
                sampleIds: this.sampleIds.result
            };
        }

        return filter;
    }

    @computed get mergedDiscreteCNAData():DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    @computed get mergedMutationData(): Mutation[][] {
        // TODO do not perform any merge for now, just convert Mutation[] to Mutation[][]
        //return mergeMutations(this.mutationData);
        return (this.mutationData.result || []).map((mutation:Mutation) => [mutation]);
    }

    @computed get indexedHotspotData(): IHotspotData|undefined
    {
        return indexHotspotData(this.hotspotData);
    }

    @computed get sampleIdToTumorType(): {[sampleId: string]: string} {
        return generateSampleIdToTumorTypeMap(this.clinicalDataForSamples);
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

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
