import * as React from 'react';
import { OncoTree2GenesIcon } from 'pages/studyView/oncotree2genes/OncoTree2GenesIcon';

const ONCOTREE2GENES_URL =
    'https://github.com/SuhasiniLulla/OncoTree2Genes-LLM';

export function getOncoTree2GenesLinkout() {
    return (
        <a href={ONCOTREE2GENES_URL} target="_blank">
            OncoTree2Genes-LLM
        </a>
    );
}

export function getOncoTree2GenesGeneOverlay(
    hugoGeneSymbol: string,
    oncotreeCodes?: string[],
    iconColor?: string
) {
    const codes = oncotreeCodes || [];
    let cancerTypeText: React.ReactNode;
    if (codes.length === 1) {
        cancerTypeText = <>cancer type {codes[0]}</>;
    } else if (codes.length > 1) {
        cancerTypeText = <>{codes.length} cancer types in this cohort</>;
    } else {
        cancerTypeText = <>this cancer type</>;
    }
    return (
        <span style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ marginRight: 5, marginTop: 1, flexShrink: 0 }}>
                <OncoTree2GenesIcon color={iconColor} />
            </span>
            <span>
                {hugoGeneSymbol} is associated with {cancerTypeText} by the{' '}
                {getOncoTree2GenesLinkout()} dataset.
            </span>
        </span>
    );
}
