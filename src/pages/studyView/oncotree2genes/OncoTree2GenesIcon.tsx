import * as React from 'react';
import { hexToRGBA } from 'shared/lib/Colors';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

// Pick black/white text for legibility on an arbitrary fill color.
function contrastingTextColor(fill: string): string {
    try {
        const [r, g, b] = hexToRGBA(fill);
        // perceived luminance (0-255)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 150 ? '#000000' : '#ffffff';
    } catch (e) {
        return '#ffffff';
    }
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
