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

/**
 * The tile-server base URL with exactly one trailing slash. Tile and
 * thumbnail paths are appended to it, so `/wsi` and `/wsi/` both serve
 * `/wsi/tiles/…`. A relative base stays relative, resolved by the browser
 * against the page.
 */
export function normalizeWsiTileServerBase(tileServerUrl: string): string {
    return `${tileServerUrl.replace(/\/+$/, '')}/`;
}

function tileServerRequestUrl(
    tileServerBase: string,
    path: string,
    query: string
): string {
    return `${normalizeWsiTileServerBase(tileServerBase)}${path}?${query}`;
}

/** One tile's URL: `{tileServerBase}/tiles/zxy/{z}/{x}/{y}?{slide query}`. */
export function buildWsiTileUrl(
    tileServerBase: string,
    slideQuery: string,
    level: number,
    x: number,
    y: number
): string {
    return tileServerRequestUrl(
        tileServerBase,
        `tiles/zxy/${level}/${x}/${y}`,
        slideQuery
    );
}

/**
 * A slide thumbnail's URL: `{tileServerBase}/thumbnails?{slide
 * query}&width=…&height=…`, at most `width`×`height`.
 */
export function buildWsiThumbnailUrl(
    tileServerBase: string,
    studyId: string,
    source: Pick<WsiSlideSource, 'servingKey' | 'sealedSource'>,
    width = WSI_THUMBNAIL_WIDTH,
    height = WSI_THUMBNAIL_HEIGHT
): string {
    return tileServerRequestUrl(
        tileServerBase,
        'thumbnails',
        `${buildWsiSlideQuery(studyId, source)}&${encodeQuery([
            ['width', Math.max(1, Math.round(width))],
            ['height', Math.max(1, Math.round(height))],
        ])}`
    );
}

const reportedCrossOriginTileServers = new Set<string>();

/**
 * Whether the tile server is same-origin with the page. Tile and thumbnail
 * requests rely on the portal session cookie, which a cross-origin tile
 * server does not get, so a cross-origin one is reported once with
 * `console.error`.
 */
export function checkWsiTileServerOrigin(tileServerUrl: string): boolean {
    if (typeof window === 'undefined' || !window.location) return true;
    let origin: string;
    try {
        origin = new URL(tileServerUrl, window.location.href).origin;
    } catch (_) {
        return true;
    }
    if (origin === window.location.origin) return true;
    if (!reportedCrossOriginTileServers.has(origin)) {
        reportedCrossOriginTileServers.add(origin);
        // eslint-disable-next-line no-console
        console.error(
            `[WSIViewer] The tile server (${origin}) is not same-origin with the portal (${window.location.origin}). ` +
                'Tile and thumbnail requests need the portal session cookie, so serve the tile server from the portal host, e.g. under /wsi.'
        );
    }
    return false;
}
