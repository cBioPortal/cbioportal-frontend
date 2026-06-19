import * as React from 'react';

const ONCOTREE2GENES_URL =
    'https://github.com/SuhasiniLulla/OncoTree2Genes-LLM';

export function getOncoTree2GenesLinkout() {
    return (
        <a href={ONCOTREE2GENES_URL} target="_blank">
            OncoTree2Genes-LLM
        </a>
    );
}
