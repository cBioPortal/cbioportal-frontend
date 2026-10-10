/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
    AppWsiViewer,
    buildWsiViewerConfig,
    wsiAuthScope,
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

jest.mock('./wsiClinicalRows', () => ({
    useWsiClinicalRows: () => [{ label: 'Sex', value: 'Female' }],
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

    it('builds portal API URLs and the host services', () => {
        const config = buildWsiViewerConfig();

        expect(config.buildApiUrl('api/wsi/v2/hierarchy/s/p')).toBe(
            'https://portal.example/beta/api/wsi/v2/hierarchy/s/p'
        );
        expect(config.osdPrefixUrl).toBe('/reactapp/osd-images/');
    });

    it('scopes caches by the user, the display name or the anonymous user', () => {
        mockServerConfig.user_display_name = 'display-user';
        expect(wsiAuthScope('user-a')).toBe('user-a');
        expect(wsiAuthScope()).toBe('display-user');

        delete mockServerConfig.user_display_name;
        expect(wsiAuthScope()).toBe('anonymousUser');
    });
});

describe('AppWsiViewer', () => {
    beforeEach(() => mockWsiViewer.mockClear());

    it('hides the download control unless downloads are shown', async () => {
        mockServerConfig.skin_hide_download_controls = 'hide';

        await act(async () => {
            render(
                <AppWsiViewer
                    patientId="P-1"
                    studyId="study-1"
                    tileServerUrl="/wsi"
                    height={600}
                />
            );
        });

        expect(mockWsiViewer).toHaveBeenLastCalledWith(
            expect.objectContaining({ showDownload: false })
        );
    });

    it('loads the package viewer with the portal settings', async () => {
        mockServerConfig.skin_hide_download_controls = 'show';
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
                authScope: 'user-a',
                showDownload: true,
                renderLoading: expect.any(Function),
                clinicalRows: [{ label: 'Sex', value: 'Female' }],
            })
        );
    });
});
