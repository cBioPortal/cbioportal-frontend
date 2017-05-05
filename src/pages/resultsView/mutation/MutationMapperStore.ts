import {
    Mutation, MutationFilter, Gene, ClinicalData
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable} from "mobx";
import {remoteData} from "shared/api/remoteData";
import {labelMobxPromises, MobxPromise} from "mobxpromise";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotData} from "shared/model/CancerHotspots";
import {
    indexHotspotData, fetchHotspotsData, fetchCosmicData, fetchOncoKbData,
    fetchMutationData, generateSampleIdToTumorTypeMap, generateDataQueryFilter,
    ONCOKB_DEFAULT
} from "shared/lib/StoreUtils";

export class MutationMapperStore {

    constructor(hugoGeneSymbol:string,
                mutationGeneticProfileId: MobxPromise<string>,
                sampleIds: MobxPromise<string[]>,
                clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                sampleListId: string|null)
    {
        this.hugoGeneSymbol = hugoGeneSymbol;
        this.mutationGeneticProfileId = mutationGeneticProfileId;
        this.sampleIds = sampleIds;
        this.clinicalDataForSamples = clinicalDataForSamples;
        this.sampleListId = sampleListId;

        labelMobxPromises(this);
    }

    @observable protected sampleListId: string|null = null;
    @observable protected hugoGeneSymbol: string;

    protected mutationGeneticProfileId: MobxPromise<string>;
    protected clinicalDataForSamples: MobxPromise<ClinicalData[]>;
    protected sampleIds: MobxPromise<string[]>;

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

    readonly gene = remoteData(async () => {
        if (this.hugoGeneSymbol) {
            let genes = await client.fetchGenesUsingPOST({
                geneIds: [this.hugoGeneSymbol],
                geneIdType: "HUGO_GENE_SYMBOL"
            });

            if (genes.length > 0) {
                return genes[0];
            }
        }

        return undefined;
    });

    readonly mutationData = remoteData({
        await: () => [
            this.gene
        ],
        invoke: async () => {
            if (this.gene.result)
            {
                const mutationFilter = {
                    ...this.dataQueryFilter,
                    entrezGeneIds: [this.gene.result.entrezGeneId]
                } as MutationFilter;

                return fetchMutationData(mutationFilter, this.mutationGeneticProfileId.result);
            }
            else {
                return [];
            }
        }
    }, []);

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData
        ],
        invoke: async () => fetchOncoKbData(this.sampleIdToTumorType, this.mutationData)
    }, ONCOKB_DEFAULT);

    @computed get dataQueryFilter() {
        return generateDataQueryFilter(this.sampleListId, this.sampleIds.result);
    }

    @computed get processedMutationData(): Mutation[][] {
        // just convert Mutation[] to Mutation[][]
        return (this.mutationData.result || []).map((mutation:Mutation) => [mutation]);
    }

    @computed get indexedHotspotData(): IHotspotData|undefined {
        return indexHotspotData(this.hotspotData);
    }

    @computed get sampleIdToTumorType(): {[sampleId: string]: string} {
        return generateSampleIdToTumorTypeMap(this.clinicalDataForSamples);
    }
}
