import MobxPromise from "mobxpromise";
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

export function isHotspot(mutation: Mutation, index: IHotspotIndex, filter?: (hotspot: Hotspot) => boolean): boolean
{
    const genomicLocation = extractGenomicLocation(mutation);
    const aggregatedHotspots = genomicLocation ? index[genomicLocationString(genomicLocation)] : undefined;

    let hotspots = aggregatedHotspots ? aggregatedHotspots.hotspots : [];
    if (filter) {
        hotspots = hotspots.filter(filter);
    }

    return hotspots.length > 0;
}

