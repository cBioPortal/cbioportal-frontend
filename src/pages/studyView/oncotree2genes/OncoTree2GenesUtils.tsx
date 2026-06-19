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

export function getOncoTree2GenesGeneOverlay(hugoGeneSymbol: string) {
    return (
        <span style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ marginRight: 5, marginTop: 1, flexShrink: 0 }}>
                <OncoTree2GenesIcon />
            </span>
            <span>
                {hugoGeneSymbol} is associated with this cancer type by the{' '}
                {getOncoTree2GenesLinkout()} dataset.
            </span>
        </span>
    );
}
