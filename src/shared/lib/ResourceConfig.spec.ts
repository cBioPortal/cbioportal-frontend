import { assert } from 'chai';
import {
    getResourceConfig,
    RESOURCE_CUSTOM_CONFIGS,
    ResourceCustomConfig,
} from './ResourceConfig';
import { ResourceDefinition } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';

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
            assert.equal(
                config.customizedDisplayName,
                'Samples with H&E Slides'
            );
            assert.isTrue(config.hidePerPatientColumn);
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
            config.customizedDisplayName = 'mutated';
            assert.deepEqual(
                RESOURCE_CUSTOM_CONFIGS['MSK_HNE'],
                original,
                'RESOURCE_CUSTOM_CONFIGS entry should not be mutated'
            );
        });

        it('customMetaData overrides customizedDisplayName while preserving other fields', () => {
            const config = getResourceConfig(
                makeDefinition({
                    resourceId: 'MSK_HNE',
                    customMetaData: JSON.stringify({
                        customizedDisplayName: 'Override Name',
                    }),
                })
            );
            assert.equal(config.customizedDisplayName, 'Override Name');
            // Other MSK_HNE fields should still be present
            assert.isTrue(config.hidePerPatientColumn);
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

    describe('HE — native WSI viewer', () => {
        let savedUrl: any;

        beforeEach(() => {
            savedUrl = (getServerConfig() as any).msk_wsi_tile_server_url;
        });

        afterEach(() => {
            (getServerConfig() as any).msk_wsi_tile_server_url = savedUrl;
        });

        it('returns customizedDisplayName "Pathology Slides"', () => {
            (getServerConfig() as any).msk_wsi_tile_server_url =
                'https://slides.example.com';
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'HE' })
            );
            assert.equal(config.customizedDisplayName, 'Pathology Slides');
        });

        it('sets nativeViewer to "wsi" when msk_wsi_tile_server_url is configured', () => {
            (getServerConfig() as any).msk_wsi_tile_server_url =
                'https://slides.example.com';
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'HE' })
            );
            assert.equal(config.nativeViewer, 'wsi');
        });

        it('strips nativeViewer when msk_wsi_tile_server_url is null', () => {
            (getServerConfig() as any).msk_wsi_tile_server_url = null;
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'HE' })
            );
            assert.isUndefined(
                config.nativeViewer,
                'nativeViewer should be absent when tile server is not configured'
            );
        });

        it('strips nativeViewer when msk_wsi_tile_server_url is undefined', () => {
            delete (getServerConfig() as any).msk_wsi_tile_server_url;
            const config = getResourceConfig(
                makeDefinition({ resourceId: 'HE' })
            );
            assert.isUndefined(config.nativeViewer);
        });

        it('does not mutate RESOURCE_CUSTOM_CONFIGS["HE"] when stripping nativeViewer', () => {
            (getServerConfig() as any).msk_wsi_tile_server_url = null;
            getResourceConfig(makeDefinition({ resourceId: 'HE' }));
            assert.equal(
                RESOURCE_CUSTOM_CONFIGS['HE'].nativeViewer,
                'wsi',
                'RESOURCE_CUSTOM_CONFIGS entry should not be mutated by the guard'
            );
        });
    });

    it('applies customMetaData on top of empty base config for unknown resourceId', () => {
        const config = getResourceConfig(
            makeDefinition({
                resourceId: 'UNKNOWN',
                customMetaData: JSON.stringify({
                    customizedDisplayName: 'From MetaData',
                    hidePerPatientColumn: true,
                }),
            })
        );
        assert.equal(config.customizedDisplayName, 'From MetaData');
        assert.isTrue(config.hidePerPatientColumn);
    });
});
