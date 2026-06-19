import * as React from 'react';

// OncoKB oncogenic-mark blue (oncokb-styles oncogenic.svg)
const ONCOKB_BLUE = '#0968c3';
const ONCOGENE_COLOR = '#c0504d'; // activating / gain-of-function
const TSG_COLOR = '#0968c3'; // loss-of-function
const BOTH_COLOR = '#8e44ad'; // oncogene + tumor suppressor
const NEUTRAL_COLOR = '#808080'; // cancer gene, no oncogene/TSG role

// Pick the bullseye color by OncoKB gene role. When no role flags are passed
// (e.g. the generic filter label), use the OncoKB brand blue.
function bullseyeColor(
    isOncogene?: boolean,
    isTumorSuppressorGene?: boolean
): string {
    if (isOncogene === undefined && isTumorSuppressorGene === undefined) {
        return ONCOKB_BLUE;
    }
    if (isOncogene && isTumorSuppressorGene) {
        return BOTH_COLOR;
    }
    if (isOncogene) {
        return ONCOGENE_COLOR;
    }
    if (isTumorSuppressorGene) {
        return TSG_COLOR;
    }
    return NEUTRAL_COLOR;
}

export const OncoKbCancerGeneIcon: React.FunctionComponent<{
    hugoGeneSymbol?: string;
    isOncogene?: boolean;
    isTumorSuppressorGene?: boolean;
}> = ({ hugoGeneSymbol, isOncogene, isTumorSuppressorGene }) => {
    const color = bullseyeColor(isOncogene, isTumorSuppressorGene);
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            style={{ cursor: 'default' }}
            data-test="oncokb-cancer-gene-icon"
            aria-label={
                hugoGeneSymbol
                    ? `${hugoGeneSymbol} is in the OncoKB Cancer Gene List`
                    : 'OncoKB Cancer Gene List'
            }
        >
            <g transform="translate(8 8)">
                <circle r="7" fill="none" strokeWidth="2" stroke={color} />
                <circle r="4" fill="none" strokeWidth="2" stroke={color} />
                <circle r="2" fill={color} />
            </g>
        </svg>
    );
};
