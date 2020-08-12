import { assert } from 'chai';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { makeGenericAssayOption } from './GenericAssayCommonUtils';

describe('GenericAssayCommonUtils', () => {
    describe('makeGenericAssayOption()', () => {
        it('Includes entity_stable_id and description when present and unique', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1): desc_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides description when same as entity_stable_id', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'id_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1)',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides entity_stable_id when same as name', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'id_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'id_1: desc_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides name and description when same as entity_stable_id', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'id_1',
                    DESCRIPTION: 'id_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'id_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });
    });
});
