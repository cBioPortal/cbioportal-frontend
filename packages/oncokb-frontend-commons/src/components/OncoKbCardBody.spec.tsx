import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import { OncoKbCardDataType } from '../model/OncoKB';
import { OncoKbCardBody } from './OncoKbCardBody';

function renderCardBody(type: OncoKbCardDataType, indicator: any) {
    return render(
        <OncoKbCardBody
            type={type}
            geneNotExist={false}
            isCancerGene={true}
            hugoSymbol={'BRAF'}
            indicator={indicator}
            usingPublicOncoKbInstance={false}
        />
    );
}

describe('OncoKbCardBody', () => {
    describe('missing fields in the OncoKB response', () => {
        // an indicator with its nested objects and arrays removed
        const sparseIndicator = {
            geneExist: true,
            variantExist: true,
            oncogenic: 'Oncogenic',
            geneSummary: 'BRAF gene summary.',
            variantSummary: 'BRAF V600E variant summary.',
        };

        [
            OncoKbCardDataType.BIOLOGICAL,
            OncoKbCardDataType.TXS,
            OncoKbCardDataType.TXR,
            OncoKbCardDataType.DX,
            OncoKbCardDataType.PX,
        ].forEach(type => {
            it(`renders the ${OncoKbCardDataType[type]} card without the nested fields`, () => {
                const { container } = renderCardBody(type, sparseIndicator);

                assert.include(
                    container.textContent || '',
                    'BRAF gene summary.'
                );
            });
        });

        it('still shows the known effect when mutationEffect is populated', () => {
            const { container } = renderCardBody(
                OncoKbCardDataType.BIOLOGICAL,
                {
                    ...sparseIndicator,
                    query: { alteration: 'V600E', germline: false },
                    mutationEffect: {
                        knownEffect: 'Gain-of-function',
                        description: 'Activating mutation.',
                        citations: { abstracts: [], pmids: [] },
                    },
                }
            );

            assert.include(container.textContent || '', 'Gain-of-function');
        });
    });
});
