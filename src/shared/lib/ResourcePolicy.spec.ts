import { assert } from 'chai';
import { getServerConfig } from 'config/config';
import { isWsiTileServerConfigured } from './ResourcePolicy';

describe('isWsiTileServerConfigured', () => {
    let savedUrl: any;

    beforeEach(() => {
        savedUrl = (getServerConfig() as any).msk_wsi_tile_server_url;
    });

    afterEach(() => {
        (getServerConfig() as any).msk_wsi_tile_server_url = savedUrl;
    });

    it('returns false for an empty tile server URL', () => {
        (getServerConfig() as any).msk_wsi_tile_server_url = '';
        assert.isFalse(isWsiTileServerConfigured());
    });

    it('returns true for a non-empty tile server URL', () => {
        (getServerConfig() as any).msk_wsi_tile_server_url =
            'https://slides.example.com';
        assert.isTrue(isWsiTileServerConfigured());
    });
});
