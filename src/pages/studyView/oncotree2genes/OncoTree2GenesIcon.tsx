import * as React from 'react';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

// Resolve any CSS color (named like "MediumSeaGreen" or hex) to #rrggbb.
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

// Pick black/white text for legibility on an arbitrary fill color.
function contrastingTextColor(fill: string): string {
    const hex = toHex(fill);
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) {
        return '#ffffff';
    }
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    // perceived luminance (0-255)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? '#000000' : '#ffffff';
}

export const OncoTree2GenesIcon: React.FunctionComponent<{
    color?: string;
}> = ({ color }) => {
    const fill = color || ONCOTREE_BLUE;
    return (
        <svg width="11" height="11" data-test="o2gl-gene-icon">
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
