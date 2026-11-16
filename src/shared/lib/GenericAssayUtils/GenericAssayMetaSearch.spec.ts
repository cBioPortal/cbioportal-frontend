jest.mock('shared/api/cbioportalClientInstance', () => ({
    getClient: jest.fn(),
}));

import { assert } from 'chai';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import {
    compareGenericAssayStableIds,
    doesGenericAssayMetaMatchSearchTerm,
    fetchGenericAssayMetaPageByProfileIds,
} from './GenericAssayCommonUtils';

function meta(
    stableId: string,
    name?: string,
    description?: string
): GenericAssayMeta {
    return {
        stableId,
        entityType: 'GENERIC_ASSAY',
        genericEntityMetaProperties: {
            ...(name ? { NAME: name } : {}),
            ...(description ? { DESCRIPTION: description } : {}),
        },
    } as GenericAssayMeta;
}

describe('compareGenericAssayStableIds', () => {
    it('orders by leading number, then by stable id', () => {
        assert.deepEqual(
            ['b', '10-x', 'a', '2-y', '17-AAG'].sort(
                compareGenericAssayStableIds
            ),
            ['a', 'b', '2-y', '10-x', '17-AAG']
        );
    });
});

describe('doesGenericAssayMetaMatchSearchTerm', () => {
    const entity = meta('cg01302245', 'TP53AIP1', 'TSS1500');

    it('matches a trimmed, case-insensitive substring of id, name or description', () => {
        assert.isTrue(doesGenericAssayMetaMatchSearchTerm(entity, ' tp53 '));
        assert.isTrue(doesGenericAssayMetaMatchSearchTerm(entity, '1302'));
        assert.isTrue(doesGenericAssayMetaMatchSearchTerm(entity, 'tss15'));
        assert.isTrue(doesGenericAssayMetaMatchSearchTerm(entity, ''));
        assert.isFalse(doesGenericAssayMetaMatchSearchTerm(entity, 'BRCA'));
    });
});

describe('fetchGenericAssayMetaPageByProfileIds', () => {
    function mockResponse(body: GenericAssayMeta[], totalCount?: string) {
        (getClient as jest.Mock).mockReturnValue({
            fetchGenericAssayMetaUsingPOSTWithHttpInfo: () =>
                Promise.resolve({
                    body,
                    header:
                        totalCount === undefined
                            ? {}
                            : { 'total-count': totalCount },
                }),
        });
    }

    it('uses the total-count header', async () => {
        mockResponse([meta('a')], '42');
        const page = await fetchGenericAssayMetaPageByProfileIds(
            ['profile'],
            'a',
            1,
            0
        );
        assert.equal(page.totalItems, 42);
        assert.deepEqual(
            page.items.map(m => m.stableId),
            ['a']
        );
    });

    it('filters and pages on the client when the backend does not', async () => {
        mockResponse([
            meta('a1', 'TP53'),
            meta('a2'),
            meta('a3', 'TP53'),
            meta('a4', 'TP53'),
        ]);
        const page = await fetchGenericAssayMetaPageByProfileIds(
            ['profile'],
            'tp53',
            2,
            0
        );
        assert.equal(page.totalItems, 3);
        assert.deepEqual(
            page.items.map(m => m.stableId),
            ['a1', 'a3']
        );
    });
});
