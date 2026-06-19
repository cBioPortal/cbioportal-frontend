import * as React from 'react';
import LetterIcon from 'shared/components/cohort/LetterIcon';

const ONCOTREE2GENES_URL =
    'https://github.com/SuhasiniLulla/OncoTree2Genes-LLM';

// OncoTree brand blue (https://oncotree.info)
const ONCOTREE_BLUE = '#2e6db4';

export const OncoTree2GenesIcon: React.FunctionComponent<{
    hugoGeneSymbol: string;
}> = ({ hugoGeneSymbol }) => {
    const tooltip = () => (
        <div>
            <b>{hugoGeneSymbol}</b> is associated with this cancer type by the
            <br />
            <a href={ONCOTREE2GENES_URL} target="_blank">
                OncoTree2Genes-LLM
            </a>{' '}
            dataset.
        </div>
    );
    return (
        <span style={{ cursor: 'default' }} data-test="o2gl-gene-icon">
            <LetterIcon
                text="O"
                tooltip={tooltip}
                circleFill={ONCOTREE_BLUE}
                stroke={ONCOTREE_BLUE}
                textFill="#ffffff"
                fontSize={7}
            />
        </span>
    );
};
