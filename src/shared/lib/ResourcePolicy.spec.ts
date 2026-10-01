import { assert } from 'chai';
import { getServerConfig } from 'config/config';
import {
    isWsiResourceId,
    isWsiTileServerConfigured,
    shouldHideLegacyHeResource,
    shouldHideLegacyHeResourceTab,
} from './ResourcePolicy';

describe('legacy H&E resource policy', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).msk_wsi_tile_server_url;
        (getServerConfig() as any).msk_wsi_tile_server_url =
            'https://slides.example.com';
    });

    afterEach(() => {
        (getServerConfig() as any).msk_wsi_tile_server_url = savedTileServerUrl;
    });

    it('returns false for an empty tile server URL', () => {
        (getServerConfig() as any).msk_wsi_tile_server_url = '';
        assert.isFalse(isWsiTileServerConfigured());
    });

    it('returns true for a non-empty tile server URL', () => {
        assert.isTrue(isWsiTileServerConfigured());
    });

    it('hides legacy H&E resource tabs when the native viewer is configured', () => {
        assert.isTrue(shouldHideLegacyHeResourceTab('HE'));
        assert.isTrue(shouldHideLegacyHeResourceTab('MSK_HNE'));
        assert.isFalse(shouldHideLegacyHeResourceTab('OTHER'));
    });

    it('hides legacy H&E resources by id only', () => {
        assert.isTrue(shouldHideLegacyHeResource({ resourceId: 'MSK_HNE' }));
        assert.isTrue(
            shouldHideLegacyHeResource({
                resourceDefinition: { resourceId: 'HE' } as any,
            })
        );
        assert.isFalse(
            shouldHideLegacyHeResource({
                resourceDefinition: {
                    resourceId: 'OTHER',
                    displayName: 'H&E Slides',
                } as any,
            })
        );
    });

    it('keeps legacy H&E resources visible when no tile server is configured', () => {
        (getServerConfig() as any).msk_wsi_tile_server_url = '';
        assert.isFalse(shouldHideLegacyHeResourceTab('MSK_HNE'));
        assert.isFalse(shouldHideLegacyHeResource({ resourceId: 'MSK_HNE' }));
    });

    it('recognises the whole-slide image resource ids', () => {
        assert.isTrue(isWsiResourceId('WSI_SAMPLE'));
        assert.isTrue(isWsiResourceId('WSI_PATIENT'));
        assert.isFalse(isWsiResourceId('HE'));
        assert.isFalse(isWsiResourceId(undefined));
    });
});
