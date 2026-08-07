import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import {
    clearWsiAccessToken,
    fetchWsi,
    getWsiAccessToken,
    isWsiAuthEnabled,
} from './wsiAuth';

const mockServerConfig = { authenticationMethod: 'saml' };

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: jest.fn(() => '/api/wsi/access-token'),
}));

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

describe('WSI access capability', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        clearWsiAccessToken();
        mockServerConfig.authenticationMethod = 'saml';
        delete (mockServerConfig as any).msk_wsi_authentication_enabled;
        global.fetch = jest.fn() as typeof fetch;
        global.Headers = (class {
            private values = new Map<string, string>();
            constructor(init?: Record<string, string>) {
                Object.entries(init ?? {}).forEach(([key, value]) =>
                    this.values.set(key.toLowerCase(), value)
                );
            }
            set(key: string, value: string) {
                this.values.set(key.toLowerCase(), value);
            }
            get(key: string) {
                return this.values.get(key.toLowerCase()) ?? null;
            }
        } as unknown) as typeof Headers;
    });

    it('enables WSI auth for saml-backed portals', () => {
        expect(isWsiAuthEnabled()).toBe(true);
    });

    it('enables WSI auth for explicit override config', () => {
        mockServerConfig.authenticationMethod = 'false';
        (mockServerConfig as any).msk_wsi_authentication_enabled = true;
        expect(isWsiAuthEnabled()).toBe(true);
    });

    it('requests and caches the short-lived capability', async () => {
        const response = {
            ok: true,
            json: async () => ({ access_token: 'token', expires_in: 300 }),
        } as Response;
        jest.spyOn(global, 'fetch').mockResolvedValue(response);

        await expect(getWsiAccessToken('coad_msk_2025')).resolves.toBe('token');
        await expect(getWsiAccessToken('coad_msk_2025')).resolves.toBe('token');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
            'studyId=coad_msk_2025'
        );
    });

    it('adds the bearer capability to WSI requests', async () => {
        jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'token', expires_in: 300 }),
            } as Response)
            .mockResolvedValueOnce({ ok: true } as Response);

        await fetchWsi('/wsi/tiles/1/zxy/0/0/0?studyId=coad_msk_2025');
        const request = (global.fetch as jest.Mock).mock.calls[1];
        expect(request[1].headers.get('Authorization')).toBe('Bearer token');
    });
});
