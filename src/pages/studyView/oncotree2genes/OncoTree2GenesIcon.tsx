import * as React from 'react';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

// No own tooltip: the explanation is folded into the shared gene-cell tooltip
// (see getOncoTree2GenesGeneOverlay) so hovering the cell shows a single tooltip.
export const OncoTree2GenesIcon: React.FunctionComponent<{}> = () => (
    <svg width="11" height="11" data-test="o2gl-gene-icon">
        <circle cx="5.5" cy="5.5" r="5" fill={ONCOTREE_BLUE} />
        <text
            x="5.5"
            y="8.6"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fontFamily="Arial, Helvetica, sans-serif"
            fill="#ffffff"
        >
            T
        </text>
    </svg>
);
