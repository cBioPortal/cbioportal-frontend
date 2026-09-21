import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import { OncoKbCard } from './OncoKbCard';
import { OncoKbCardDataType } from '../model/OncoKB';

const TUMOR_TYPE = 'Breast Invasive Ductal Carcinoma';

function cardTitleText(props: {
    isGermline?: boolean;
    proteinChange?: string;
    cDnaChange?: string;
    alteration: string;
}) {
    const { container } = render(
        <OncoKbCard
            type={OncoKbCardDataType.TXS}
            hugoSymbol={'BRCA1'}
            geneNotExist={false}
            isCancerGene={true}
            usingPublicOncoKbInstance={false}
            isGermline={props.isGermline}
            cDnaChange={props.cDnaChange}
            proteinChange={props.proteinChange}
            indicator={
                ({
                    query: {
                        hugoSymbol: 'BRCA1',
                        alteration: props.alteration,
                        tumorType: TUMOR_TYPE,
                    },
                    geneExist: true,
                    variantExist: false,
                    geneSummary: '',
                    variantSummary: '',
                    tumorTypeSummary: '',
                    mutationEffect: {
                        knownEffect: 'Unknown',
                        description: '',
                        citations: { abstracts: [], pmids: [] },
                    },
                    treatments: [],
                    diagnosticImplications: [],
                    prognosticImplications: [],
                } as unknown) as any
            }
        />
    );
    // The title's first line: the alteration, without the cancer type subtitle.
    return container
        .querySelector('[data-test="oncokb-card-title"] > div')!
        .textContent!.replace('Germline', '')
        .trim();
}

describe('OncoKbCard', () => {
    // The germline endpoint answers with the cDNA change in query.alteration,
    // but a germline structural variant has no cDNA change: its alteration is
    // the same label the protein change already carries, so showing both
    // rendered "BRCA1 intragenic · BRCA1 intragenic".
    it('does not repeat a germline structural variant alteration', () => {
        assert.equal(
            cardTitleText({
                isGermline: true,
                proteinChange: 'BRCA1 intragenic',
                alteration: 'BRCA1 intragenic',
            }),
            'BRCA1 intragenic'
        );
    });

    it('shows the cDNA change of a germline mutation', () => {
        assert.equal(
            cardTitleText({
                isGermline: true,
                proteinChange: 'Q1756fs',
                alteration: 'BRCA1:c.5266dupC',
            }),
            'BRCA1 c.5266dupC · (p.Q1756fs)'
        );
    });
});
