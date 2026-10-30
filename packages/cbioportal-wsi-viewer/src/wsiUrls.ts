import { WsiSlideSource } from './wsiViewerTypes';

export const WSI_THUMBNAIL_WIDTH = 128;
export const WSI_THUMBNAIL_HEIGHT = 96;

/** The portal's resource table rows endpoint, which lists slide rows. */
export function buildWsiResourceRowsApiUrl(
    buildApiUrl: (path: string) => string
): string {
    return buildApiUrl('api/resource-table/query/fetch');
}

function encodeQuery(params: Array<[string, string | number]>): string {
    return params
        .map(
            ([name, value]) =>
                `${encodeURIComponent(name)}=${encodeURIComponent(
                    String(value)
                )}`
        )
        .join('&');
}

/**
 * The query naming a slide on the tile server: the study (which the portal in
 * front of the tile server checks the session cookie against), the slide's
 * opaque key and its sealed source. Never the source image id.
 */
export function buildWsiSlideQuery(
    studyId: string,
    source: Pick<WsiSlideSource, 'servingKey' | 'sealedSource'>
): string {
    return encodeQuery([
        ['studyId', studyId],
        ['key', source.servingKey],
        ['enc', source.sealedSource],
    ]);
}

/** One tile's URL: `{tileServerBase}/tiles/zxy/{z}/{x}/{y}?{slide query}`. */
export function buildWsiTileUrl(
    tileServerBase: string,
    slideQuery: string,
    level: number,
    x: number,
    y: number
): string {
    return `${tileServerBase.replace(
        /\/$/,
        ''
    )}/tiles/zxy/${level}/${x}/${y}?${slideQuery}`;
}

/** Build a slide thumbnail URL from the tile-server base URL. */
export function buildWsiThumbnailUrl(
    tileServerBase: string,
    studyId: string,
    source: Pick<WsiSlideSource, 'servingKey' | 'sealedSource'>,
    width = WSI_THUMBNAIL_WIDTH,
    height = WSI_THUMBNAIL_HEIGHT
): string {
    const baseUrl =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.href;
    const parsed = new URL(tileServerBase, baseUrl);
    const path = `${parsed.pathname.replace(/\/$/, '')}/thumbnails`;
    const url = new URL(path, parsed.origin);
    url.search = `?${buildWsiSlideQuery(studyId, source)}&${encodeQuery([
        ['width', Math.max(1, Math.round(width))],
        ['height', Math.max(1, Math.round(height))],
    ])}`;
    return url.toString();
}
