import LazyCache from 'shared/api/LazyCache';
import {VariantCount, VariantCountIdentifier} from "../../../shared/api/CBioPortalAPIInternal";
import {IVariantCountData} from "../mutation/column/CohortColumnFormatter";
import {Mutation} from "../../../shared/api/CBioPortalAPI";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";

export default class VariantCountCache extends LazyCache {
    protected async populateCache(rowMutations:Mutation[][], mutationGeneticProfileId:string) {
        const cache = this._cache;
        const variantCountIdentifiers:VariantCountIdentifier[] = [];
        // Figure out what we need to fetch
        const toQuery:{ [entrezGeneId:string]:{ [keyword:string]:boolean}} = {};
        for (const mutations of rowMutations) {
            if (mutations.length > 0) {
                let entrezGeneId = mutations[0].entrezGeneId;
                let keyword = mutations[0].keyword;
                if (keyword) {
                    if (!cache.geneData
                        || !cache.geneData[entrezGeneId]
                        || !cache.geneData[entrezGeneId].numberOfSamplesWithKeyword
                        || !cache.geneData[entrezGeneId].numberOfSamplesWithKeyword.hasOwnProperty(keyword)) {
                        toQuery[entrezGeneId] = toQuery[entrezGeneId] || {};
                        toQuery[entrezGeneId][keyword] = true;
                    }
                } else {
                    if (!cache.geneData
                        || !cache.geneData[entrezGeneId]) {
                        toQuery[entrezGeneId] = toQuery[entrezGeneId] || {};
                    }
                }
            }
        }
        // Set it up for fetching
        for (const entrezGeneId in toQuery) {
            if (toQuery.hasOwnProperty(entrezGeneId)) {
                const entrezGeneIdInt = parseInt(entrezGeneId, 10);
                let keywords = Object.keys(toQuery[entrezGeneId]);
                if (keywords.length === 0) {
                    variantCountIdentifiers.push({
                        entrezGeneId: entrezGeneIdInt
                    } as VariantCountIdentifier);
                } else {
                    for (const keyword of keywords) {
                        variantCountIdentifiers.push({
                            entrezGeneId: entrezGeneIdInt,
                            keyword: keyword
                        });
                    }
                }
            }
        }

        // Fetch
        let variantCounts:VariantCount[];
        if (variantCountIdentifiers.length > 0) {
            try {
                variantCounts = await internalClient.fetchVariantCountsUsingPOST({
                    geneticProfileId: mutationGeneticProfileId,
                    variantCountIdentifiers
                });
            } catch (err) {
                return false;
            }
        } else {
            variantCounts = [];
        }

        // Populate
        let changeMade;
        if (variantCounts.length > 0) {
            cache.numberOfSamples = variantCounts[0].numberOfSamples;
            cache.geneData = cache.geneData || {};
            for (const variantCount of variantCounts) {
                let entrezGeneId = variantCount.entrezGeneId;
                cache.geneData[entrezGeneId] = cache.geneData[entrezGeneId] || {};
                cache.geneData[entrezGeneId].numberOfSamplesWithKeyword =
                    cache.geneData[entrezGeneId].numberOfSamplesWithKeyword || {};
            }
            for (const variantCount of variantCounts) {
                let geneData = cache.geneData[variantCount.entrezGeneId];
                geneData.numberOfSamplesWithMutationInGene = variantCount.numberOfSamplesWithMutationInGene;
                if (typeof variantCount.keyword !== "undefined") {
                    geneData.numberOfSamplesWithKeyword[variantCount.keyword] =
                        variantCount.numberOfSamplesWithKeyword;
                }
            }
            changeMade = true;
        } else {
            changeMade = false;
        }
        return changeMade;
    }

}