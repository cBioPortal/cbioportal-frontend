import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import { EvidenceReferenceContent } from './EvidenceReferenceContent';

describe('EvidenceReferenceContent', () => {
    describe('missing fields in the OncoKB response', () => {
        it('renders the description when citations are omitted', () => {
            const { container } = render(
                <EvidenceReferenceContent description={'Known oncogenic.'} />
            );

            assert.include(container.textContent || '', 'Known oncogenic.');
        });

        it('renders the disclaimer when citations have no arrays', () => {
            const { container } = render(
                <EvidenceReferenceContent
                    citations={{} as any}
                    noInfoDisclaimer={'Information is not available.'}
                />
            );

            assert.include(
                container.textContent || '',
                'Information is not available.'
            );
        });

        it('still lists references when the citations are populated', () => {
            const { container } = render(
                <EvidenceReferenceContent
                    citations={{
                        abstracts: [
                            {
                                abstract: 'Abstract title',
                                link: 'https://example.org',
                            },
                        ],
                        pmids: [],
                    }}
                    noInfoDisclaimer={'Information is not available.'}
                />
            );

            assert.notInclude(
                container.textContent || '',
                'Information is not available.'
            );
        });
    });
});
