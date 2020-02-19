import { assert } from 'chai';

import { generateQueryVariantId } from './OncoKbUtils';

describe('OncoKbUtils', () => {
    describe('generateQueryVariantId', () => {
        it('properly generates query variant id when both entrezGeneId and tumor type are valid', () => {
            assert.equal(generateQueryVariantId(451, 'two'), '451_two');
        });

        it('properly generates query variant id when only entrezGeneId is valid', () => {
            assert.equal(generateQueryVariantId(451, null), '451');
        });
    });
});
