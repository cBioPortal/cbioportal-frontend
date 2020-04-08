import { Hotspot } from 'genome-nexus-ts-api-client';
import { IHotspotIndex, isHotspot } from 'react-mutation-mapper';

import { CosmicMutation } from 'cbioportal-ts-api-client';
import { ICosmicData } from 'shared/model/Cosmic';
import { Mutation } from 'cbioportal-ts-api-client';
import { normalizeMutation } from '../components/mutationMapper/MutationMapperUtils';

/**
 * Utility functions related to annotation data.
 *
 * @author Selcuk Onur Sumer
 */

export function keywordToCosmic(
    cosmicMutations: CosmicMutation[]
): ICosmicData {
    // key: keyword
    // value: CosmicMutation[]
    const map: ICosmicData = {};

    // create a map for a faster lookup
    cosmicMutations.forEach((cosmic: CosmicMutation) => {
        if (!(cosmic.keyword in map)) {
            map[cosmic.keyword] = [];
        }

        map[cosmic.keyword].push(cosmic);
    });

    return map;
}

export function recurrentHotspotFilter(hotspot: Hotspot) {
    // only single and indel mutations are regular hotspots
    return (
        hotspot.type.toLowerCase().includes('single') ||
        hotspot.type.toLowerCase().includes('indel')
    );
}

export function isRecurrentHotspot(
    mutation: Mutation,
    index: IHotspotIndex
): boolean {
    return isHotspot(
        normalizeMutation(mutation),
        index,
        recurrentHotspotFilter
    );
}

export function is3dHotspot(mutation: Mutation, index: IHotspotIndex): boolean {
    return isHotspot(normalizeMutation(mutation), index, hotspot =>
        hotspot.type.toLowerCase().includes('3d')
    );
}
