/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import WsiPatientViewRoute from './WsiPatientViewRoute';

const mockServerConfig: Record<string, unknown> = {};
const mockEntryPoint = jest.fn((_props: Record<string, unknown>) => null);
const mockGetClinicalEvents = jest.fn();
const mockFetchHierarchy = jest.fn();

jest.mock('shared/api/cbioportalInternalClientInstance', () => ({
    __esModule: true,
    default: {
        getAllClinicalEventsOfPatientInStudyUsingGET: (params: unknown) =>
            mockGetClinicalEvents(params),
    },
}));

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

jest.mock('shared/components/wsiViewer/wsiAppConfig', () => ({
    AppWsiViewer: (props: Record<string, unknown>) => mockEntryPoint(props),
    wsiAuthScope: () => 'anonymousUser',
}));

jest.mock('cbioportal-wsi-viewer', () => ({
    ...jest.requireActual('cbioportal-wsi-viewer'),
    fetchWsiPatientHierarchy: (...args: unknown[]) =>
        mockFetchHierarchy(...args),
}));

function hierarchy(...sampleIds: string[]) {
    return { samples: sampleIds.map(sample_id => ({ sample_id })) };
}

function lastViewerProps() {
    return mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0];
}

/** A promise with its resolve function, for out-of-order responses. */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

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
        mockGetClinicalEvents.mockReset();
        // Pending by default so synchronous tests see no late state update.
        mockGetClinicalEvents.mockReturnValue(new Promise(() => {}));
        mockFetchHierarchy.mockReset();
        mockFetchHierarchy.mockResolvedValue(hierarchy('S-1', 'UNMATCHED'));
        mockServerConfig.wsi_tile_server_url = '/wsi';
    });

    it('passes the slideKey link parameter as the requested slide', () => {
        renderRoute('?studyId=study-1&slideKey=0123456789ab');

        expect(mockEntryPoint).toHaveBeenCalledTimes(1);
        expect(mockEntryPoint.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                patientId: 'P-1',
                studyId: 'study-1',
                requestedSlideKey: '0123456789ab',
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
        const rendered = renderRoute('?slideKey=0123456789ab');

        expect(mockEntryPoint).not.toHaveBeenCalled();
        expect(
            rendered.root.findByProps({
                'data-testid': 'wsi-route-unavailable',
            })
        ).toBeTruthy();
    });

    it('fetches clinical events and passes them to the viewer', async () => {
        const events = [{ eventType: 'Sequencing', attributes: [] }];
        mockGetClinicalEvents.mockResolvedValue(events);

        await act(async () => {
            renderRoute('?studyId=study-1', 'P-7');
        });

        expect(mockFetchHierarchy).toHaveBeenCalledWith(
            'study-1',
            'P-7',
            'anonymousUser'
        );
        expect(mockGetClinicalEvents).toHaveBeenCalledWith({
            studyId: 'study-1',
            patientId: 'P-7',
            projection: 'DETAILED',
        });
        expect(lastViewerProps().clinicalEvents).toBe(events);
    });

    it('does not fetch clinical events when no slide has a sequenced sample', async () => {
        mockFetchHierarchy.mockResolvedValue(hierarchy('UNMATCHED'));

        await act(async () => {
            renderRoute('?studyId=study-1');
        });

        expect(mockGetClinicalEvents).not.toHaveBeenCalled();
        expect(lastViewerProps().clinicalEvents).toBeUndefined();
    });

    it('renders the viewer without clinical events when the fetch fails', async () => {
        const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
        const failure = new Error('unavailable');
        mockGetClinicalEvents.mockRejectedValue(failure);

        await act(async () => {
            renderRoute('?studyId=study-1&slideKey=0123456789ab');
        });

        expect(mockGetClinicalEvents).toHaveBeenCalledTimes(1);
        expect(lastViewerProps()).toEqual(
            expect.objectContaining({
                studyId: 'study-1',
                requestedSlideKey: '0123456789ab',
            })
        );
        expect(lastViewerProps().clinicalEvents).toBeUndefined();
        expect(debug).toHaveBeenCalledWith(expect.any(String), failure);
        debug.mockRestore();
    });

    it('logs a failed slide lookup and fetches no clinical events', async () => {
        const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
        mockFetchHierarchy.mockRejectedValue(new Error('no slides'));

        await act(async () => {
            renderRoute('?studyId=study-1');
        });

        expect(mockGetClinicalEvents).not.toHaveBeenCalled();
        expect(lastViewerProps().clinicalEvents).toBeUndefined();
        expect(debug).toHaveBeenCalledTimes(1);
        debug.mockRestore();
    });

    it("ignores an earlier patient's events that arrive after a patient change", async () => {
        const first = deferred<unknown[]>();
        const second = deferred<unknown[]>();
        mockGetClinicalEvents
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const firstEvents = [{ eventType: 'Sequencing', patientId: 'P-1' }];
        const secondEvents = [{ eventType: 'Sequencing', patientId: 'P-2' }];

        let rendered!: TestRenderer.ReactTestRenderer;
        await act(async () => {
            rendered = renderRoute('?studyId=study-1', 'P-1');
        });
        await act(async () => {
            rendered.update(
                <WsiPatientViewRoute
                    match={{ params: { patientId: 'P-2' } }}
                    location={{ search: '?studyId=study-1' }}
                />
            );
        });
        expect(mockGetClinicalEvents).toHaveBeenCalledTimes(2);

        await act(async () => {
            second.resolve(secondEvents);
        });
        await act(async () => {
            first.resolve(firstEvents);
        });

        expect(lastViewerProps().patientId).toBe('P-2');
        expect(lastViewerProps().clinicalEvents).toBe(secondEvents);
    });

    it('does not fetch clinical events without a study', () => {
        renderRoute('?slideKey=0123456789ab');

        expect(mockFetchHierarchy).not.toHaveBeenCalled();
        expect(mockGetClinicalEvents).not.toHaveBeenCalled();
    });
});
