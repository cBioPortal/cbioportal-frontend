import { assert } from 'chai';

import { isGermlineMutation, isSomaticMutation } from './SignalMutationUtils';

describe('SignalMutationUtils', () => {
    describe('missing fields in the Genome Nexus response', () => {
        it('treats a mutation without a mutationStatus as neither germline nor somatic', () => {
            const mutation = { hugoGeneSymbol: 'BRCA1' } as any;

            assert.isFalse(isGermlineMutation(mutation));
            assert.isFalse(isSomaticMutation(mutation));
        });

        it('still resolves the status when the field is populated', () => {
            assert.isTrue(
                isGermlineMutation({ mutationStatus: 'germline' } as any)
            );
            assert.isTrue(
                isSomaticMutation({ mutationStatus: 'Somatic' } as any)
            );
            assert.isFalse(
                isGermlineMutation({ mutationStatus: 'somatic' } as any)
            );
        });
    });
});
