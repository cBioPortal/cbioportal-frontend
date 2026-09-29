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

    it('passes the imageId link parameter as the requested slide', () => {
        renderRoute('?studyId=study-1&imageId=slide-2');

        expect(mockEntryPoint).toHaveBeenCalledTimes(1);
        expect(mockEntryPoint.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                patientId: 'P-1',
                studyId: 'study-1',
                requestedImageId: 'slide-2',
                tileServerUrl: '/wsi',
            })
        );
    });

    it('decodes an encoded imageId', () => {
        renderRoute(
            `?studyId=study%201&imageId=${encodeURIComponent(
                'slide id/2 #x&y'
            )}`
        );

        expect(mockEntryPoint.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                studyId: 'study 1',
                requestedImageId: 'slide id/2 #x&y',
            })
        );
    });

    it('omits the requested slide when no imageId is given', () => {
        renderRoute('?studyId=study-1&imageId=');

        expect(
            mockEntryPoint.mock.calls[0][0].requestedImageId
        ).toBeUndefined();
    });

    it('passes an unknown imageId through for the viewer to resolve', () => {
        renderRoute('?studyId=study-1&imageId=does-not-exist');

        expect(mockEntryPoint.mock.calls[0][0].requestedImageId).toBe(
            'does-not-exist'
        );
    });

    it('reports unavailable configuration without a study', () => {
        const rendered = renderRoute('?imageId=slide-2');

        expect(mockEntryPoint).not.toHaveBeenCalled();
        expect(
            rendered.root.findByProps({
                'data-testid': 'wsi-route-unavailable',
            })
        ).toBeTruthy();
    });
});
