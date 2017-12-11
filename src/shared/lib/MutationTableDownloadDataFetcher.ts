import MobxPromise from "mobxpromise";
import {IMobXApplicationLazyDownloadDataFetcher} from "shared/lib/IMobXApplicationLazyDownloadDataFetcher";
import LazyMobXCache from "shared/lib/LazyMobXCache";
import {default as GenomeNexusEnrichmentCache, fetch as fetchGenomeNexusData} from "shared/cache/GenomeNexusEnrichment";
import {default as MutationCountCache, fetch as fetchMutationCountData} from "shared/cache/MutationCountCache";
import {Mutation} from "shared/api/generated/CBioPortalAPI";

export class MutationTableDownloadDataFetcher implements IMobXApplicationLazyDownloadDataFetcher
{
    private allData:any[]|undefined = undefined;

    constructor(private mutationData: MobxPromise<Mutation[]>,
                private genomeNexusEnrichmentCache?: () => GenomeNexusEnrichmentCache,
                private mutationCountCache?: () => MutationCountCache) {
        // TODO labelMobxPromises(this); ?
    }

    public fetchAndCacheAllLazyData(): Promise<any[]>
    {
        if (this.allData) {
            return Promise.resolve(this.allData);
        }

        return new Promise<any[]>((resolve, reject) => {
            const promiseCachePairs = this.availablePromiseCachePairs();

            Promise.all(promiseCachePairs.promises).then((allData: any[]) => {
                this.allData = allData;

                // add data to cache for future use
                for (let i = 0; i < allData.length; i++) {
                    promiseCachePairs.caches[i].addData(allData[i]);
                }

                resolve(allData);
            }).catch(reject);
        });
    }

    private availablePromiseCachePairs(): {promises: Promise<any>[], caches: LazyMobXCache<any, any>[]}
    {
        const promises:Promise<any>[] = [];
        const caches:LazyMobXCache<any, any>[] = [];

        if (this.genomeNexusEnrichmentCache)
        {
            promises.push(this.fetchAllGenomeNexusEnrichmentData());
            caches.push(this.genomeNexusEnrichmentCache());
        }

        if (this.mutationCountCache)
        {
            promises.push(this.fetchAllMutationCountData());
            caches.push(this.mutationCountCache());
        }

        return {promises, caches};
    }

    private async fetchAllGenomeNexusEnrichmentData()
    {
        if (this.mutationData.result)
        {
            return await fetchGenomeNexusData(this.mutationData.result);
        }
        else {
            return undefined;
        }
    }

    private async fetchAllMutationCountData()
    {
        if (this.mutationData.result)
        {
            const queries = this.mutationData.result.map(
                mutation => ({sampleId: mutation.sampleId, molecularProfileId: mutation.molecularProfileId}));

            return await fetchMutationCountData(queries);
        }
        else {
            return undefined;
        }
    }
}