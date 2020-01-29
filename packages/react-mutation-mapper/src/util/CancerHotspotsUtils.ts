import * as _ from 'lodash';
import MobxPromise from 'mobxpromise';

import {
    AggregatedHotspots,
    Hotspot,
    IHotspotIndex,
} from '../model/CancerHotspot';
import { Mutation } from '../model/Mutation';
import { extractGenomicLocation, genomicLocationString } from './MutationUtils';

export function groupCancerHotspotDataByPosition(ptmData: Hotspot[]) {
    return _.groupBy(ptmData, 'proteinPosStart');
}

export function indexHotspotsData(
    hotspotData: MobxPromise<AggregatedHotspots[]>
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

export function filterHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex,
    filter?: (hotspot: Hotspot) => boolean
): Hotspot[] {
    let hotspots: Hotspot[] = [];

    mutations.forEach(mutation => {
        const genomicLocation = extractGenomicLocation(mutation);
        const aggregatedHotspots = genomicLocation
            ? index[genomicLocationString(genomicLocation)]
            : undefined;

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

export function filterRecurrentHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex
): Hotspot[] {
    return filterHotspotsByMutations(
        mutations,
        index,
        (hotspot: Hotspot) =>
            hotspot.type.toLowerCase().includes('single') ||
            hotspot.type.toLowerCase().includes('indel')
    );
}

export function filter3dHotspotsByMutations(
    mutations: Mutation[],
    index: IHotspotIndex
): Hotspot[] {
    return filterHotspotsByMutations(mutations, index, (hotspot: Hotspot) =>
        hotspot.type.toLowerCase().includes('3d')
    );
}

export function isRecurrentHotspot(
    mutation: Mutation,
    index: IHotspotIndex
): boolean {
    return filterRecurrentHotspotsByMutations([mutation], index).length > 0;
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
        type.includes('single') || type.includes('indel') || type.includes('3d')
    );
}
