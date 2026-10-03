/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import WsiPatientViewRoute from './WsiPatientViewRoute';

const mockServerConfig: Record<string, unknown> = {};
const mockEntryPoint = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

jest.mock('shared/components/wsiViewer/wsiAppConfig', () => ({
    AppWsiViewer: (props: Record<string, unknown>) => mockEntryPoint(props),
}));

function renderRoute(search: string, patientId = 'P-1') {
    return TestRenderer.create(
        <WsiPatientViewRoute
            match={{ params: { patientId } }}
            location={{ search }}
        />
    );
}

describe('WsiPatientViewRoute', () => {
    beforeEach(() => {
        mockEntryPoint.mockClear();
        mockServerConfig.msk_wsi_tile_server_url = '/wsi';
    });

    it('passes the slideKey link parameter as the requested slide', () => {
        renderRoute(
            '?studyId=study-1&slideKey=0123456789abcdef0123456789abcdef'
        );

        expect(mockEntryPoint).toHaveBeenCalledTimes(1);
        expect(mockEntryPoint.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                patientId: 'P-1',
                studyId: 'study-1',
                requestedSlideKey: '0123456789abcdef0123456789abcdef',
                tileServerUrl: '/wsi',
            })
        );
    });

    it('decodes an encoded slideKey', () => {
        renderRoute(
            `?studyId=study%201&slideKey=${encodeURIComponent(
                'slide id/2 #x&y'
            )}`
        );

        expect(mockEntryPoint.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                studyId: 'study 1',
                requestedSlideKey: 'slide id/2 #x&y',
            })
        );
    });

    it('omits the requested slide when no slideKey is given', () => {
        renderRoute('?studyId=study-1&slideKey=');

        expect(
            mockEntryPoint.mock.calls[0][0].requestedSlideKey
        ).toBeUndefined();
    });

    it('passes an unknown slideKey through for the viewer to resolve', () => {
        renderRoute('?studyId=study-1&slideKey=does-not-exist');

        expect(mockEntryPoint.mock.calls[0][0].requestedSlideKey).toBe(
            'does-not-exist'
        );
    });

    it('ignores a legacy imageId link parameter', () => {
        renderRoute('?studyId=study-1&imageId=slide-2');

        expect(
            mockEntryPoint.mock.calls[0][0].requestedSlideKey
        ).toBeUndefined();
        expect(JSON.stringify(mockEntryPoint.mock.calls[0][0])).not.toContain(
            'slide-2'
        );
    });

    it('reports unavailable configuration without a study', () => {
        const rendered = renderRoute(
            '?slideKey=0123456789abcdef0123456789abcdef'
        );

        expect(mockEntryPoint).not.toHaveBeenCalled();
        expect(
            rendered.root.findByProps({
                'data-testid': 'wsi-route-unavailable',
            })
        ).toBeTruthy();
    });
});
