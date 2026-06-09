import { assert } from 'chai';
import {
    getResourceConfig,
    RESOURCE_CUSTOM_CONFIGS,
    ResourceCustomConfig,
} from './ResourceConfig';
import { ResourceDefinition } from 'cbioportal-ts-api-client';

function makeDefinition(
    overrides: Partial<ResourceDefinition> = {}
): ResourceDefinition {
    return {
        resourceId: 'TEST_RESOURCE',
        displayName: 'Test Resource',
        description: '',
        priority: '1',
        customMetaData: '',
        resourceType: 'PATIENT',
        studyId: 'study1',
        openByDefault: false,
        ...overrides,
    };
}

describe('getResourceConfig', () => {
    it('returns empty config for unknown resourceId', () => {
        const config = getResourceConfig(
            makeDefinition({ resourceId: 'UNKNOWN' })
        );
        assert.deepEqual(config, {});
    });

    it('returns empty config when resourceId is empty string', () => {
        const config = getResourceConfig(makeDefinition({ resourceId: '' }));
        assert.deepEqual(config, {});
    });

    describe('MSK_HNE', () => {
        it('returns the full MSK_HNE config', () => {
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'MSK_HNE' })
            );
            assert.deepEqual(config, RESOURCE_CUSTOM_CONFIGS['MSK_HNE']);
        });

        it('has all expected fields set', () => {
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'MSK_HNE' })
            );
            assert.isTrue(config.hideUrlColumn);
            assert.isTrue(config.openInNewTab);
            assert.equal(
                config.columnNameMapping?.['Type Of Resource'],
                'View'
            );
            assert.isString(config.iframeErrorMessage);
            assert.notEqual(config.iframeErrorMessage, '');
        });

        it('does not mutate the RESOURCE_CUSTOM_CONFIGS entry', () => {
            const original = { ...RESOURCE_CUSTOM_CONFIGS['MSK_HNE'] };
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'MSK_HNE' })
            );
            config.iframeErrorMessage = 'mutated';
            assert.deepEqual(
                RESOURCE_CUSTOM_CONFIGS['MSK_HNE'],
                original,
                'RESOURCE_CUSTOM_CONFIGS entry should not be mutated'
            );
        });

        it('customMetaData overrides columnNameMapping while preserving other fields', () => {
            const config = getResourceConfig(
                makeDefinition({
                    resourceId: 'MSK_HNE',
                    customMetaData: JSON.stringify({
                        columnNameMapping: { 'Type Of Resource': 'Open' },
                    }),
                })
            );
            assert.equal(
                config.columnNameMapping?.['Type Of Resource'],
                'Open'
            );
            assert.isTrue(config.hideUrlColumn);
            assert.isTrue(config.openInNewTab);
        });

        it('customMetaData can override iframeErrorMessage', () => {
            const config = getResourceConfig(
                makeDefinition({
                    resourceId: 'MSK_HNE',
                    customMetaData: JSON.stringify({
                        iframeErrorMessage: 'Custom VPN message',
                    }),
                })
            );
            assert.equal(config.iframeErrorMessage, 'Custom VPN message');
        });

        it('ignores invalid JSON in customMetaData and falls back to base MSK_HNE config', () => {
            const config = getResourceConfig(
                makeDefinition({
                    resourceId: 'MSK_HNE',
                    customMetaData: '{invalid json',
                })
            );
            assert.deepEqual(config, RESOURCE_CUSTOM_CONFIGS['MSK_HNE']);
        });
    });

    it('applies customMetaData on top of empty base config for unknown resourceId', () => {
        const config = getResourceConfig(
            makeDefinition({
                resourceId: 'UNKNOWN',
                customMetaData: JSON.stringify({
                    openInNewTab: true,
                    columnNameMapping: { 'Type Of Resource': 'Launch' },
                }),
            })
        );
        assert.isTrue(config.openInNewTab);
        assert.equal(config.columnNameMapping?.['Type Of Resource'], 'Launch');
    });
});
