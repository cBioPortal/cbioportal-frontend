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

    describe('the dictionary', () => {
        it('does not hand out a reference a caller can mutate', () => {
            RESOURCE_CUSTOM_CONFIGS['TEST_RES'] = { openInNewTab: true };
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'TEST_RES' })
            );
            config.openInNewTab = false;
            assert.isTrue(
                RESOURCE_CUSTOM_CONFIGS['TEST_RES'].openInNewTab,
                'the dictionary entry should not be mutated'
            );
            delete RESOURCE_CUSTOM_CONFIGS['TEST_RES'];
        });

        it('returns an empty config for an unknown resource id', () => {
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'NOT_CONFIGURED' })
            );
            assert.deepEqual(config, {});
        });
    });
});
