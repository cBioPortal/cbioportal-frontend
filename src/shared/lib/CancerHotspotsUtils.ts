import MobxPromise from "mobxpromise";
import * as _ from "lodash";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {
    default as GenomeNexusAPIInternal, AggregatedHotspots, GenomicLocation, Hotspot
} from "shared/api/generated/GenomeNexusAPIInternal";
import genomeNexusInternalClient from "shared/api/genomeNexusInternalClientInstance";
import {concatMutationData} from "./StoreUtils";
import {extractGenomicLocation, genomicLocationString, uniqueGenomicLocations} from "./MutationUtils";
import {IHotspotIndex} from "shared/model/CancerHotspots";

export async function fetchHotspotsData(mutationData: MobxPromise<Mutation[]>,
                                        uncalledMutationData?: MobxPromise<Mutation[]>,
                                        client: GenomeNexusAPIInternal = genomeNexusInternalClient)
{
    const mutationDataResult = filterMutationsOnNonHotspotGenes(concatMutationData(mutationData, uncalledMutationData));

    if (mutationDataResult.length === 0) {
        return [];
    }

    const genomicLocations: GenomicLocation[] = uniqueGenomicLocations(mutationDataResult);

    return await client.fetchHotspotAnnotationByGenomicLocationPOST({genomicLocations: genomicLocations});
}

export function filterMutationsOnNonHotspotGenes(mutationData: Mutation[]) {
    const hotspotGenes = require("shared/static-data/hotspotGenes.json");
    return mutationData.filter(
        (m:Mutation) => !m.gene.hugoGeneSymbol || hotspotGenes.includes(m.gene.hugoGeneSymbol)
    );
}

export function indexHotspotsData(hotspotData: MobxPromise<AggregatedHotspots[]>): IHotspotIndex|undefined
{
    if (hotspotData.result) {
        return indexHotspots(hotspotData.result);
    }
    else {
        return undefined;
    }
}

export function indexHotspots(hotspots: AggregatedHotspots[]): IHotspotIndex
{
    const index:IHotspotIndex = {};

    hotspots.forEach((aggregatedHotspots: AggregatedHotspots) => {
        index[genomicLocationString(aggregatedHotspots.genomicLocation)] = aggregatedHotspots;
    });

    return index;
}

export function groupHotspotsByMutations(mutationsByPosition: {[pos: number]: Mutation[]},
                                         index: IHotspotIndex,
                                         filter?: (hotspot: Hotspot) => boolean): {[pos: number]: Hotspot[]}
{
    const hotspotMap: {[pos: number]: Hotspot[]} = {};

    _.keys(mutationsByPosition).forEach(key => {
        const position = Number(key);
        const hotspots = filterHotspotsByMutations(mutationsByPosition[position], index, filter);

        if (hotspots.length > 0) {
            hotspotMap[position] = hotspots;
        }
    });

    return hotspotMap;
}

export function filterHotspotsByMutations(mutations: Mutation[],
                                          index: IHotspotIndex,
                                          filter?: (hotspot: Hotspot) => boolean): Hotspot[]
{
    let hotspots: Hotspot[] = [];

    mutations.forEach(mutation => {
        const genomicLocation = extractGenomicLocation(mutation);
        const aggregatedHotspots = genomicLocation ? index[genomicLocationString(genomicLocation)] : undefined;

        // TODO remove redundant hotspots
        if (aggregatedHotspots) {
            hotspots = hotspots.concat(aggregatedHotspots.hotspots);
        }
    });

    if (filter) {
        hotspots = hotspots.filter(filter);
    }

    return hotspots;
}

export function filterRecurrentHotspotsByMutations(mutations: Mutation[],
                                                   index: IHotspotIndex): Hotspot[]
{
    return filterHotspotsByMutations(mutations, index, (hotspot: Hotspot) =>
        hotspot.type.toLowerCase().includes("single") || hotspot.type.toLowerCase().includes("indel")
    );
}

export function filter3dHotspotsByMutations(mutations: Mutation[],
                                            index: IHotspotIndex): Hotspot[]
{
    return filterHotspotsByMutations(mutations, index, (hotspot: Hotspot) =>
        hotspot.type.toLowerCase().includes("3d")
    );
}


export function isHotspot(mutation: Mutation, index: IHotspotIndex, filter?: (hotspot: Hotspot) => boolean): boolean
{
    return filterHotspotsByMutations([mutation], index, filter).length > 0;
}

export function defaultHotspotFilter(hotspot: Hotspot)  {
    const type = hotspot.type.toLowerCase();
    return type.includes("single") || type.includes("indel") || type.includes("3d");
}

