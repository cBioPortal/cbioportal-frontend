import _ from 'lodash';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

/**
 * Per-resource URL rewrites applied before a resource is framed. These exist to carry viewer
 * state that the external viewer itself does not persist.
 */

/** What a transform is allowed to match on. Any field may be absent. */
export interface IResourceUrlContext {
    resourceId: string;
    url: string;
    resourceDisplayName?: string;
    description?: string;
}

interface IResourceUrlCustomizer {
    test: (resource: IResourceUrlContext) => boolean;
    transformer: (resource: IResourceUrlContext) => string;
}

// Spelling kept as-is: viewers in the field already have state stored under this key.
const MINERVA_STATE_KEY = 'MINVERVA_STATE_KEY';
const MINERVA_GROUP_SUFFIX =
    '#s=0#w=0#g=%GROUP%#m=-1#a=-100_-100#v=1_0.7207_0.5#o=-100_-100_1_1#p=Q';

/**
 * Minerva posts its current URL to the parent as the user changes channel group. Storing the
 * group lets the next Minerva resource open on the same one.
 *
 * Registered at module scope, so the listener is added once per page rather than once per render.
 */
const listenForMinervaState = _.once(() => {
    getBrowserWindow().addEventListener(
        'message',
        (event: any) => {
            const group = event?.data?.href?.match(/g=(\d+)/)?.[1];
            if (!group) {
                return;
            }
            try {
                getBrowserWindow().localStorage.setItem(
                    MINERVA_STATE_KEY,
                    group
                );
            } catch {
                // storage can be unavailable; the group simply does not persist
            }
        },
        false
    );
});

function storedMinervaGroup(): string | null {
    try {
        return getBrowserWindow().localStorage.getItem(MINERVA_STATE_KEY);
    } catch {
        return null;
    }
}

function transformUrlForMinerva(resource: IResourceUrlContext): string {
    listenForMinervaState();
    const group = storedMinervaGroup();
    return group
        ? resource.url + MINERVA_GROUP_SUFFIX.replace('%GROUP%', group)
        : resource.url;
}

export const CUSTOM_URL_TRANSFORMERS: IResourceUrlCustomizer[] = [
    {
        // Live studies identify Minerva by the URL alone (crc_hta11_htan_2021, crc_hta8_htan_2024,
        // crc_orion_2024); the other fields are matched because a curator may name it instead.
        test: resource => {
            const re = /minerva/i;
            return (
                re.test(resource.url) ||
                re.test(resource.resourceId) ||
                re.test(resource.resourceDisplayName || '') ||
                re.test(resource.description || '')
            );
        },
        transformer: transformUrlForMinerva,
    },
];

/** The URL to frame, after any matching transform. A failing transform leaves the URL alone. */
export function applyCustomUrlTransforms(
    resource: IResourceUrlContext,
    url: string
): string {
    let transformed = url;
    try {
        CUSTOM_URL_TRANSFORMERS.forEach(config => {
            if (config.test(resource)) {
                transformed = config.transformer(resource);
            }
        });
    } catch (ex) {
        console.error(ex);
    }
    return transformed;
}
