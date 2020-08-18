import { CosmicMutation } from 'cbioportal-ts-api-client';
import { ICosmicData } from 'shared/model/Cosmic';

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
