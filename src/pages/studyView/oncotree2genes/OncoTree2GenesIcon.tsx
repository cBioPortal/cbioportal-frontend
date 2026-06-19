import * as React from 'react';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

// No own tooltip: the explanation is folded into the shared gene-cell tooltip
// (see getOncoTree2GenesGeneOverlay) so hovering the cell shows a single tooltip.
export const OncoTree2GenesIcon: React.FunctionComponent<{}> = () => (
    <svg width="13" height="13" data-test="o2gl-gene-icon">
        <circle cx="6.5" cy="6.5" r="6" fill={ONCOTREE_BLUE} />
        <text
            x="6.5"
            y="10"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fontFamily="Arial, Helvetica, sans-serif"
            fill="#ffffff"
        >
            T
        </text>
    </svg>
);
