import LazyCache from 'shared/api/LazyCache';
import * as _ from 'lodash';
import {MrnaPercentile} from "../../../shared/api/CBioPortalAPIInternal";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";

export default class MrnaExprRankCache extends LazyCache {

    protected async populateCache(sampleToEntrezGeneIds:{ [sampleId:string]:Set<number> }, mrnaRankGeneticProfileId:string|null):Promise<boolean> {
        const cache = this._cache;
        // See which we need to fetch, and set "pending" for those data
        const toQuery:{ [sampleId:string]:number[]} = {};
        _.forEach(sampleToEntrezGeneIds, (entrezGeneIds:number[], sampleId:string) => {
            cache[sampleId] = cache[sampleId] || {};
            for (const entrezGeneId of entrezGeneIds) {
                if (!cache[sampleId].hasOwnProperty(entrezGeneId)) {
                    toQuery[sampleId] = toQuery[sampleId] || [];
                    toQuery[sampleId].push(entrezGeneId);
                    cache[sampleId][entrezGeneId] = { status:"pending" };
                }
            }
        });
        // Fetch that data
        try {
            const allMrnaPercentiles:MrnaPercentile[][] = await Promise.all(Object.keys(toQuery).map((sampleId:string) =>
                new Promise<MrnaPercentile[]>(async (sampleResolve, sampleReject) => {
                    const entrezGeneIds = toQuery[sampleId];
                    if (mrnaRankGeneticProfileId === null) {
                        sampleReject();
                    } else {
                        try {
                            sampleResolve(await internalClient.fetchMrnaPercentileUsingPOST({
                                geneticProfileId:mrnaRankGeneticProfileId,
                                sampleId,
                                entrezGeneIds
                            }));
                        } catch(err) {
                            sampleReject();
                        }
                    }
                })
            ));

            const mrnaPercentiles: MrnaPercentile[]
                = allMrnaPercentiles.reduce((arr:MrnaPercentile[], next:MrnaPercentile[])=>arr.concat(next));
            const haveData:{ [sampleId:string]: { [entrezGeneId: string]:boolean}} = {};
            for (const mrnaPercentile of mrnaPercentiles) {
                // Add data
                cache[mrnaPercentile.sampleId] || {};
                cache[mrnaPercentile.sampleId][mrnaPercentile.entrezGeneId] = {
                    status: "available",
                    percentile: mrnaPercentile.percentile,
                    zScore: mrnaPercentile.zScore
                };
                // As we go through, keep track of which we have data for
                haveData[mrnaPercentile.sampleId] = haveData[mrnaPercentile.sampleId] || {};
                haveData[mrnaPercentile.sampleId][mrnaPercentile.entrezGeneId] = true;
            }
            // Go through and mark those we don't have data for as unavailable
            for (const sampleId in toQuery) {
                if (toQuery.hasOwnProperty(sampleId)) {
                    for (const entrezGeneId of toQuery[sampleId]) {
                        if (!haveData[sampleId] || !haveData[sampleId][entrezGeneId]) {
                            cache[sampleId][entrezGeneId] = { status: "not available" };
                        }
                    }
                }
            }
            return (mrnaPercentiles.length > 0);
        } catch(err) {
            // Delete all the pending statuses for what we queried
            for (const sampleId in toQuery) {
                if (toQuery.hasOwnProperty(sampleId)) {
                    for (const entrezGeneId of toQuery[sampleId]) {
                        delete cache[sampleId][entrezGeneId];
                    }
                }
            }
            return false;
        }
    }

}