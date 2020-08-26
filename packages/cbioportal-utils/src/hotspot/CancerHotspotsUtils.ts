import * as _ from 'lodash';
import { Hotspot } from 'genome-nexus-ts-api-client';

import { AggregatedHotspots, IHotspotIndex } from '../model/CancerHotspot';
import { RemoteData } from '../model/RemoteData';
import { Mutation } from '../model/Mutation';
import {
    extractGenomicLocation,
    genomicLocationString,
} from '../mutation/MutationUtils';

export function groupCancerHotspotDataByPosition(ptmData: Hotspot[]) {
    return _.groupBy(ptmData, 'proteinPosStart');
}

export function indexHotspotsData(
    hotspotData: RemoteData<AggregatedHotspots[] | undefined>
): IHotspotIndex | undefined {
    if (hotspotData.result) {
        return indexHotspots(hotspotData.result);
    } else {
        return undefined;
    }
}

export function indexHotspots(hotspots: AggregatedHotspots[]): IHotspotIndex {
    const index: IHotspotIndex = {};

    hotspots.forEach((aggregatedHotspots: AggregatedHotspots) => {
        index[
            genomicLocationString(aggregatedHotspots.genomicLocation)
        ] = aggregatedHotspots;
    });

    return index;
}

export function groupHotspotsByMutations(
    mutationsByPosition: { [pos: number]: Mutation[] },
    index: IHotspotIndex,
    filter?: (hotspot: Hotspot) => boolean
): { [pos: number]: Hotspot[] } {
    const hotspotMap: { [pos: number]: Hotspot[] } = {};

    _.keys(mutationsByPosition).forEach(key => {
        const position = Number(key);
        const hotspots = filterHotspotsByMutations(
            mutationsByPosition[position],
            index,
            filter
        );

        if (hotspots.length > 0) {
            hotspotMap[position] = hotspots;
        }
    });

    return hotspotMap;
}

export function filterHotspotsByMutation(
    mutation: Mutation,
    index: IHotspotIndex,
    filter?: (hotspot: Hotspot) => boolean
): Hotspot[] {
    let hotspots: Hotspot[] = [];

    const genomicLocation = extractGenomicLocation(mutation);
    const aggregatedHotspots = genomicLocation
        ? index[genomicLocationString(genomicLocation)]
        : undefined;

    // TODO remove redundant hotspots
    if (aggregatedHotspots) {
        hotspots = aggregatedHotspots.hotspots;
    }

    if (filter) {
        hotspots = hotspots.filter(filter);
    }

    return hotspots;
}

export function filterHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex,
    filter?: (hotspot: Hotspot) => boolean
): Hotspot[] {
    let hotspots: Hotspot[] = [];

    mutations.forEach(mutation => {
        hotspots = hotspots.concat(
            filterHotspotsByMutation(mutation, index, filter)
        );
    });

    return hotspots;
}

export function filterLinearClusterHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex
): Hotspot[] {
    let hotspots: Hotspot[] = [];
    // if mutation type is splice, get splice hotspot, otherwise get recurrent hotspot
    mutations.forEach(mutation => {
        if (
            mutation.mutationType &&
            mutation.mutationType.toLowerCase().includes('splice')
        ) {
            hotspots = hotspots.concat(
                filterHotspotsByMutation(mutation, index, (hotspot: Hotspot) =>
                    hotspot.type.toLowerCase().includes('splice')
                )
            );
        } else {
            hotspots = hotspots.concat(
                filterHotspotsByMutation(
                    mutation,
                    index,
                    (hotspot: Hotspot) =>
                        hotspot.type.toLowerCase().includes('single') ||
                        hotspot.type.toLowerCase().includes('indel')
                )
            );
        }
    });
    return hotspots;
}

export function filter3dHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex
): Hotspot[] {
    return filterHotspotsByMutations(mutations, index, (hotspot: Hotspot) =>
        hotspot.type.toLowerCase().includes('3d')
    );
}

export function isLinearClusterHotspot(
    mutation: Mutation,
    index: IHotspotIndex
): boolean {
    return filterLinearClusterHotspotsByMutations([mutation], index).length > 0;
}

export function is3dHotspot(mutation: Mutation, index: IHotspotIndex): boolean {
    return filter3dHotspotsByMutations([mutation], index).length > 0;
}

export function isHotspot(
    mutation: Mutation,
    index: IHotspotIndex,
    filter?: (hotspot: Hotspot) => boolean
): boolean {
    return filterHotspotsByMutations([mutation], index, filter).length > 0;
}

export function defaultHotspotFilter(hotspot: Hotspot) {
    const type = hotspot.type.toLowerCase();
    return (
        type.includes('single') ||
        type.includes('indel') ||
        type.includes('3d') ||
        type.includes('splice')
    );
}
