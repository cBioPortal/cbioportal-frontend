/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
    AppWsiViewer,
    buildWsiViewerConfig,
    isPortalWsiAuthEnabled,
} from './wsiAppConfig';

const mockServerConfig: Record<string, unknown> = {};
const mockWsiViewer = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: (path: string) =>
        `https://portal.example/beta/${path}`,
}));

jest.mock('cbioportal-wsi-viewer/viewer', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => mockWsiViewer(props),
}));

describe('buildWsiViewerConfig', () => {
    beforeEach(() => {
        Object.keys(mockServerConfig).forEach(
            key => delete mockServerConfig[key]
        );
        mockServerConfig.skin_hide_download_controls = 'show';
    });

    it('builds portal API URLs and the viewer settings', () => {
        const config = buildWsiViewerConfig('user-a');

        expect(config.buildApiUrl('api/wsi/v2/hierarchy/s/p')).toBe(
            'https://portal.example/beta/api/wsi/v2/hierarchy/s/p'
        );
        expect(config).toEqual(
            expect.objectContaining({
                authEnabled: false,
                authScope: 'user-a',
                showDownload: true,
                osdPrefixUrl: '/reactapp/osd-images/',
            })
        );
        expect(config.renderLoading).toBeDefined();
    });

    it('scopes caches by the display name or the anonymous user without a user name', () => {
        mockServerConfig.user_display_name = 'display-user';
        expect(buildWsiViewerConfig().authScope).toBe('display-user');

        delete mockServerConfig.user_display_name;
        expect(buildWsiViewerConfig().authScope).toBe('anonymousUser');
    });

    it('hides the download control unless downloads are shown', () => {
        mockServerConfig.skin_hide_download_controls = 'hide';
        expect(buildWsiViewerConfig().showDownload).toBe(false);
    });

    it('enables WSI auth for SAML portals and the explicit opt-in', () => {
        mockServerConfig.authenticationMethod = 'SAML';
        expect(isPortalWsiAuthEnabled()).toBe(true);
        mockServerConfig.authenticationMethod = 'saml_plus_basic';
        expect(isPortalWsiAuthEnabled()).toBe(true);
        mockServerConfig.authenticationMethod = 'false';
        expect(isPortalWsiAuthEnabled()).toBe(false);
        mockServerConfig.msk_wsi_authentication_enabled = true;
        expect(isPortalWsiAuthEnabled()).toBe(true);
    });
});

describe('AppWsiViewer', () => {
    it('loads the package viewer with the portal configuration', async () => {
        mockServerConfig.user_display_name = 'display-user';

        await act(async () => {
            render(
                <AppWsiViewer
                    userName="user-a"
                    patientId="P-1"
                    studyId="study-1"
                    tileServerUrl="/wsi"
                    height={600}
                />
            );
        });

        expect(screen.queryByTestId('wsi-viewer-loading')).toBeNull();
        expect(mockWsiViewer).toHaveBeenLastCalledWith(
            expect.objectContaining({
                patientId: 'P-1',
                studyId: 'study-1',
                tileServerUrl: '/wsi',
                height: 600,
                config: expect.objectContaining({ authScope: 'user-a' }),
            })
        );
    });
});
