import { assert } from 'chai';
import { Gene, StructuralVariantQuery } from 'cbioportal-ts-api-client';
import {
    createStructuralVariantQuery,
    parseOQLQuery,
    uniqueGenesInOQLQuery,
} from './oqlfilter';

describe('unknown upstream structural variant queries', () => {
    for (const query of ['-::RET', '-::RET: DRIVER_SOMATIC']) {
        it(`extracts only the known gene from ${query}`, () => {
            assert.deepEqual(uniqueGenesInOQLQuery(query), ['RET']);
        });

        it(`creates an unassigned upstream gene filter from ${query}`, () => {
            assert.deepEqual(
                createStructuralVariantQuery(parseOQLQuery(query)[0], [
                    { hugoGeneSymbol: 'RET', entrezGeneId: 5979 } as Gene,
                ]),
                {
                    gene1: { specialValue: 'NO_GENE' },
                    gene2: { entrezId: 5979 },
                } as StructuralVariantQuery
            );
        });
    }
});
