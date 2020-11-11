import { assert } from 'chai';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import {
    makeGenericAssayOption,
    getGenericAssayMetaPropertyOrDefault,
    COMMON_GENERIC_ASSAY_PROPERTY,
} from './GenericAssayCommonUtils';

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

        it('add plotAxisLabel for plot tab options', () => {
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
                plotAxisLabel: 'name_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity, true),
                expect
            );
        });
    });

    describe('getGenericAssayMetaPropertyOrDefault()', () => {
        it('property exist in meta', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'name_1';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME
                ),
                expect
            );
        });

        it('property not exist in meta, default value not given', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'NA';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME
                ),
                expect
            );
        });

        it('property not exist in meta, default value given', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'default';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                    'default'
                ),
                expect
            );
        });
    });
});
