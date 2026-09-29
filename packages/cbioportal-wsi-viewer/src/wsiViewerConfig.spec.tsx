/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render } from '@testing-library/react';
import {
    configureWsiViewerRuntime,
    getWsiViewerRuntime,
    resetWsiViewerRuntime,
    WsiViewerConfig,
} from './wsiViewerConfig';
import {
    hashUrlState,
    WsiHashState,
    WsiUrlStateAdapter,
    writeSelectedSlideState,
} from './wsiViewStateUtils';
import {
    clearWsiSlideAccess,
    getWsiSessionStorage,
    getWsiSlideAccess,
    registerWsiResourceAccessTarget,
} from './wsiAuth';
import WsiViewer from './WsiViewerEntry';

const mockWsiViewer = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('./WSIViewer', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => mockWsiViewer(props),
}));

function makeConfig(overrides: Partial<WsiViewerConfig> = {}): WsiViewerConfig {
    return {
        buildApiUrl: (path: string) => `https://portal.example/beta/${path}`,
        authEnabled: false,
        authScope: 'user-a',
        showDownload: true,
        ...overrides,
    };
}

function makeMemoryUrlState(): WsiUrlStateAdapter & {
    state: WsiHashState | null;
    writes: WsiHashState[];
} {
    const adapter = {
        state: null as WsiHashState | null,
        writes: [] as WsiHashState[],
        read: () => adapter.state,
        write: (state: WsiHashState) => {
            adapter.state = state;
            adapter.writes.push(state);
            return `https://host.example/view?slide=${state.slideId}`;
        },
        clear: () => {
            adapter.state = null;
        },
        currentUrl: () => 'https://host.example/view',
        subscribe: () => () => undefined,
    };
    return adapter;
}

describe('WSI viewer runtime', () => {
    afterEach(() => {
        resetWsiViewerRuntime();
        clearWsiSlideAccess();
        window.sessionStorage.clear();
        window.history.replaceState(null, '', '/');
    });

    it('defaults to the #wsi: hash and requires a configured API URL builder', () => {
        const runtime = getWsiViewerRuntime();

        expect(runtime.urlState).toBe(hashUrlState);
        expect(runtime.authEnabled).toBe(false);
        expect(runtime.osdPrefixUrl).toBeUndefined();
        expect(() => runtime.buildApiUrl('api/x')).toThrow(
            'WSI viewer API URLs are not configured'
        );
    });

    it('requests slide access through the configured URL builder and fetch', async () => {
        const fetchImpl = (jest.fn(async () => ({
            ok: false,
            status: 403,
        })) as unknown) as typeof fetch;
        configureWsiViewerRuntime(makeConfig({ fetchImpl }));
        registerWsiResourceAccessTarget('study-1', 'slide-1', {
            patientId: 'patient 1',
            resourceId: 'WSI_SAMPLE',
            resourceDataId: '42',
        });

        await expect(
            getWsiSlideAccess('study-1', 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI authorization failed (403)');
        expect(
            fetchImpl
        ).toHaveBeenCalledWith(
            'https://portal.example/beta/api/wsi/v2/resources/study-1/patient%201/WSI_SAMPLE/42/access',
            { credentials: 'same-origin', cache: 'no-store' }
        );
    });

    it('keeps protected responses out of sessionStorage when auth is enabled', () => {
        window.sessionStorage.setItem('wsi-metadata-cache-x', '{}');
        window.sessionStorage.setItem('unrelated', '1');

        configureWsiViewerRuntime(makeConfig({ authEnabled: false }));
        expect(getWsiSessionStorage()).toBe(window.sessionStorage);

        configureWsiViewerRuntime(makeConfig({ authEnabled: true }));
        expect(getWsiSessionStorage()).toBeNull();
        expect(
            window.sessionStorage.getItem('wsi-metadata-cache-x')
        ).toBeNull();
        expect(window.sessionStorage.getItem('unrelated')).toBe('1');
    });
});

describe('hashUrlState', () => {
    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('writes, reads and clears the #wsi: hash', () => {
        const href = hashUrlState.write({
            slideId: 'slide 1',
            x: 10.4,
            y: 20.6,
            z: 1.5,
        });

        expect(window.location.hash).toBe(
            '#wsi:slide=slide%201&x=10&y=21&z=1.500000'
        );
        expect(href).toBe(window.location.href);
        expect(hashUrlState.currentUrl()).toBe(window.location.href);
        expect(hashUrlState.read()).toEqual({
            slideId: 'slide 1',
            x: 10,
            y: 21,
            z: 1.5,
        });

        hashUrlState.write({ slideId: 'slide-2' });
        expect(window.location.hash).toBe('#wsi:slide=slide-2');

        hashUrlState.clear();
        expect(window.location.hash).toBe('');
        expect(hashUrlState.read()).toBeNull();
    });

    it('notifies subscribers of hash navigation until unsubscribed', () => {
        const listener = jest.fn();
        const unsubscribe = hashUrlState.subscribe(listener);

        window.dispatchEvent(new HashChangeEvent('hashchange'));
        unsubscribe();
        window.dispatchEvent(new HashChangeEvent('hashchange'));

        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe('writeSelectedSlideState', () => {
    it('keeps the stored viewport and skips writes for the selected slide', () => {
        const urlState = makeMemoryUrlState();
        urlState.state = { slideId: 'slide-1', x: 1, y: 2, z: 3 };

        expect(writeSelectedSlideState(urlState, 'slide-1')).toBe(
            'https://host.example/view'
        );
        expect(urlState.writes).toEqual([]);

        expect(writeSelectedSlideState(urlState, 'slide-2')).toBe(
            'https://host.example/view?slide=slide-2'
        );
        expect(urlState.writes).toEqual([
            { slideId: 'slide-2', x: 1, y: 2, z: 3 },
        ]);
    });
});

describe('WsiViewer', () => {
    afterEach(() => {
        resetWsiViewerRuntime();
        mockWsiViewer.mockClear();
    });

    it('installs the host services and passes the viewer settings', () => {
        const urlState = makeMemoryUrlState();
        const fetchImpl = (jest.fn() as unknown) as typeof fetch;
        const renderLoading = () => 'loading';

        render(
            <WsiViewer
                config={makeConfig({
                    authEnabled: true,
                    osdPrefixUrl: '/osd/',
                    urlState,
                    fetchImpl,
                    renderLoading,
                })}
                patientId="P 1"
                studyId="study/1"
                tileServerUrl="https://tiles.example"
                height={600}
            />
        );

        expect(getWsiViewerRuntime()).toEqual(
            expect.objectContaining({
                authEnabled: true,
                osdPrefixUrl: '/osd/',
                urlState,
                fetchImpl,
            })
        );
        expect(mockWsiViewer).toHaveBeenCalledWith(
            expect.objectContaining({
                hierarchyUrl:
                    'https://portal.example/beta/api/wsi/v2/hierarchy/study%2F1/P%201',
                authScope: 'user-a',
                showDownload: true,
                renderLoading,
                tileServerUrl: 'https://tiles.example',
                patientId: 'P 1',
                studyId: 'study/1',
            })
        );
    });
});
