/**
 * A tiny, hand-built sprite atlas for shape-encoding points on the embedding
 * plot (driver-vs-VUS status). Built as an inline SVG data URL rather than a
 * real image file, so there's no binary asset to check in or build-pipeline
 * step to wire up - the browser decodes it like any other image.
 *
 * Each icon is drawn as an opaque black shape on a transparent background.
 * The actual fill color doesn't matter: every entry in SHAPE_ICON_MAPPING
 * sets `mask: true`, which tells deck.gl's IconLayer to discard the icon's
 * own color entirely and tint it using whatever getColor returns per point -
 * the same color-by logic already driving ScatterplotLayer's getFillColor
 * today. Only the shape's alpha (opaque vs. transparent) matters.
 *
 * Layout: one 96x32 strip, three 32x32 cells laid out left to right.
 */
export const SHAPE_ICON_ATLAS =
    'data:image/svg+xml;base64,' +
    'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDk2IDMyIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iYmxhY2siLz4KICA8cG9seWdvbiBwb2ludHM9IjQ4LDQgNjAsMjcgMzYsMjciIGZpbGw9ImJsYWNrIi8+CiAgPHBvbHlnb24gcG9pbnRzPSI4MCw0IDkzLDE2IDgwLDI4IDY3LDE2IiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K';

/**
 * Maps a shape name (as set on EmbeddingPoint.shape) to its position within
 * SHAPE_ICON_ATLAS. 'circle' covers every point where shape is undefined -
 * i.e. no shape-by attribute selected, or no value for that point.
 */
export const SHAPE_ICON_MAPPING: {
    [shapeName: string]: {
        x: number;
        y: number;
        width: number;
        height: number;
        mask: boolean;
    };
} = {
    circle: { x: 0, y: 0, width: 32, height: 32, mask: true },
    triangle: { x: 32, y: 0, width: 32, height: 32, mask: true },
    diamond: { x: 64, y: 0, width: 32, height: 32, mask: true },
};
