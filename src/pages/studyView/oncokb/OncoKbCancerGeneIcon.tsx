import * as React from 'react';

const ONCOKB_ICON = require('oncokb-styles/dist/images/oncogenic.svg');

// No own tooltip: the gene cell already shows an OncoKB Cancer Gene List
// tooltip for cancer genes, so a second one here would be redundant.
export const OncoKbCancerGeneIcon: React.FunctionComponent<{
    hugoGeneSymbol: string;
}> = ({ hugoGeneSymbol }) => (
    <img
        src={ONCOKB_ICON}
        alt={`${hugoGeneSymbol} is in the OncoKB Cancer Gene List`}
        style={{ height: 12, width: 12, cursor: 'default' }}
        data-test="oncokb-cancer-gene-icon"
    />
);
