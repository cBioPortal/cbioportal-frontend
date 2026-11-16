import _ from 'lodash';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';

/**
 * Per-resource URL rewrites applied before a resource is framed, to carry viewer state that the
 * external viewer does not persist itself.
 */

type ResourceUrlCustomizer = {
    test: (row: IResourceTableRow) => boolean;
    transformer: (row: IResourceTableRow) => string;
};

// Spelling kept as-is: viewers in the field already have state stored under this key.
const MINERVA_STATE_KEY = 'MINVERVA_STATE_KEY';

// Minerva posts its URL to the parent as the user changes channel group; storing the group lets
// the next Minerva resource open on the same one. Registered once per page, not once per render.
const listenForMinervaState = _.once(() => {
    getBrowserWindow().addEventListener(
        'message',
        (event: any) => {
            const group = event?.data?.href?.match(/g=(\d+)/)?.[1];
            if (group) {
                getBrowserWindow().localStorage.setItem(
                    MINERVA_STATE_KEY,
                    group
                );
            }
        },
        false
    );
});

function transformUrlForMinerva(row: IResourceTableRow) {
    listenForMinervaState();
    const group = getBrowserWindow().localStorage.getItem(MINERVA_STATE_KEY);
    return group
        ? row.url +
              `#s=0#w=0#g=${group}#m=-1#a=-100_-100#v=1_0.7207_0.5#o=-100_-100_1_1#p=Q`
        : row.url;
}

export const CUSTOM_URL_TRANSFORMERS: ResourceUrlCustomizer[] = [
    {
        // Live studies identify Minerva by the URL alone; a curator may name it instead.
        test: row => {
            const re = /minerva/i;
            return (
                re.test(row.url) ||
                re.test(row.resourceId) ||
                re.test(row.resourceType) ||
                re.test(row.description)
            );
        },
        transformer: transformUrlForMinerva,
    },
];

/** The URL to frame, after any matching transform. A failing transform leaves the URL alone. */
export function applyCustomUrlTransforms(
    row: IResourceTableRow,
    url: string
): string {
    let transformed = url;
    try {
        CUSTOM_URL_TRANSFORMERS.forEach(config => {
            if (config.test(row)) {
                transformed = config.transformer(row);
            }
        });
    } catch (ex) {
        console.error(ex);
    }
    return transformed;
}
