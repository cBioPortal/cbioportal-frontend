import * as React from 'react';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

// Resolve any CSS color (named like "MediumSeaGreen" or hex) to the value a
// canvas 2d context's fillStyle normalizes it to. Unlike reading a detached
// element's style.color back (which doesn't resolve named colors without a
// document-attached getComputedStyle call), canvas parses and normalizes the
// color immediately on assignment.
const colorHexCache: { [color: string]: string } = {};
function toHex(color: string): string {
    if (colorHexCache[color] !== undefined) {
        return colorHexCache[color];
    }
    let hex = color;
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            hex = ctx.fillStyle;
        }
    } catch (e) {
        // ignore; fall back below
    }
    colorHexCache[color] = hex;
    return hex;
}

// Extract 0-255 r/g/b from either "#rrggbb" or "rgb(a)(r, g, b[, a])" —
// the two formats a canvas 2d context's fillStyle can normalize to.
function parseRgb(color: string): [number, number, number] | undefined {
    const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
    if (hexMatch) {
        return [
            parseInt(hexMatch[1], 16),
            parseInt(hexMatch[2], 16),
            parseInt(hexMatch[3], 16),
        ];
    }
    const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color);
    if (rgbMatch) {
        return [
            parseInt(rgbMatch[1], 10),
            parseInt(rgbMatch[2], 10),
            parseInt(rgbMatch[3], 10),
        ];
    }
    return undefined;
}

// Pick black/white text for legibility on an arbitrary fill color.
function contrastingTextColor(fill: string): string {
    const rgb = parseRgb(toHex(fill));
    if (!rgb) {
        return '#ffffff';
    }
    const [r, g, b] = rgb;
    // perceived luminance (0-255)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? '#000000' : '#ffffff';
}

export const OncoTree2GenesIcon: React.FunctionComponent<{
    color?: string;
}> = ({ color }) => {
    const fill = color || ONCOTREE_BLUE;
    return (
        <svg
            width="11"
            height="11"
            data-test="o2gl-gene-icon"
            role="img"
            aria-label="OncoTree2Genes-LLM gene"
            focusable="false"
        >
            <circle
                cx="5.5"
                cy="5.5"
                r="4.5"
                fill={fill}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="1"
            />
            <text
                x="5.5"
                y="9"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="Arial, Helvetica, sans-serif"
                fill={contrastingTextColor(fill)}
            >
                T
            </text>
        </svg>
    );
};
