const mockReload = jest.fn();
const iframeProps: any[] = [];

jest.mock('shared/components/iframeLoader/IFrameLoader', () => {
    const React = require('react');
    return function MockIFrameLoader(props: any) {
        iframeProps.push(props);
        return <div data-testid="iframe-loader" />;
    };
});

jest.mock('shared/components/loadingIndicator/LoadingIndicator', () => {
    const React = require('react');
    return function MockLoadingIndicator(props: { isLoading: boolean }) {
        return props.isLoading ? <div data-testid="loading-indicator" /> : null;
    };
});

// Partial, so the component can keep importing anything else from the package.
jest.mock('cbioportal-frontend-commons', () => ({
    ...jest.requireActual('cbioportal-frontend-commons'),
    getBrowserWindow: () => ({
        location: { protocol: 'https:', reload: mockReload },
        localStorage: { getItem: () => null, setItem: () => undefined },
        addEventListener: () => undefined,
    }),
}));

import * as React from 'react';
import { assert } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';
import ResourceViewer from './ResourceViewer';

const VPN_MESSAGE = 'This resource requires VPN access.';

function row(overrides: Partial<IResourceTableRow> = {}): IResourceTableRow {
    return {
        key: overrides.url || 'k',
        studyId: 'study',
        patientId: 'P-1',
        sampleId: 'S-1',
        resourceType: 'Slide Microscopy',
        resourceScope: 'SAMPLE',
        resourceId: 'SLIDE',
        description: '',
        url: 'https://example.com/a.html',
        metadata: {},
        ...overrides,
    } as IResourceTableRow;
}

const rows = [
    row({ url: 'https://example.com/1.html', key: '1' }),
    row({ url: 'https://example.com/2.html', key: '2' }),
    row({ url: 'https://example.com/3.html', key: '3' }),
];

function renderViewer(props: Partial<any> = {}) {
    const onIndexChange = jest.fn();
    const utils = render(
        <ResourceViewer
            rows={rows}
            index={0}
            onIndexChange={onIndexChange}
            resourceDisplayName="Slide Microscopy"
            {...props}
        />
    );
    return { ...utils, onIndexChange };
}

describe('ResourceViewer', () => {
    beforeEach(() => {
        iframeProps.length = 0;
        mockReload.mockReset();
    });

    it('frames the row at the given index', async () => {
        renderViewer({ index: 1 });
        await waitFor(() => assert.isAbove(iframeProps.length, 0));
        assert.equal(iframeProps[0].url, 'https://example.com/2.html');
    });

    it('clamps an index past the end rather than rendering nothing', async () => {
        renderViewer({ index: 99 });
        await waitFor(() => assert.isAbove(iframeProps.length, 0));
        assert.equal(iframeProps[0].url, 'https://example.com/3.html');
        assert.include(
            screen.getByTestId('ResourceViewerCaption').textContent || '',
            '3 of 3'
        );
    });

    it('counts from one in the caption', () => {
        renderViewer({ index: 0 });
        assert.include(
            screen.getByTestId('ResourceViewerCaption').textContent || '',
            '1 of 3'
        );
    });

    it('steps forward and back through the rows', () => {
        const { onIndexChange } = renderViewer({ index: 1 });
        screen.getByTestId('ResourceViewerNext').click();
        assert.deepEqual(onIndexChange.mock.calls[0], [2]);
        screen.getByTestId('ResourceViewerPrev').click();
        assert.deepEqual(onIndexChange.mock.calls[1], [0]);
    });

    it('does not step past either end', () => {
        const first = renderViewer({ index: 0 });
        screen.getByTestId('ResourceViewerPrev').click();
        assert.equal(first.onIndexChange.mock.calls.length, 0);
        first.unmount();

        const last = renderViewer({ index: 2 });
        screen.getByTestId('ResourceViewerNext').click();
        assert.equal(last.onIndexChange.mock.calls.length, 0);
    });

    it('hides the chevrons for a single row', () => {
        renderViewer({ rows: [rows[0]] });
        assert.isNull(screen.queryByTestId('ResourceViewerNext'));
        assert.isNull(screen.queryByTestId('ResourceViewerPrev'));
    });

    it('always offers the link out, because a framed host can still refuse', () => {
        renderViewer({ index: 1 });
        assert.equal(
            screen
                .getByTestId('ResourceViewerOpenInNewWindow')
                .getAttribute('href'),
            'https://example.com/2.html'
        );
    });

    it('renders a PDF through the Google viewer', async () => {
        renderViewer({
            rows: [row({ url: 'https://example.com/report.pdf' })],
        });
        await waitFor(() => assert.isAbove(iframeProps.length, 0));
        assert.include(iframeProps[0].url, 'docs.google.com/viewerng/viewer');
        assert.include(iframeProps[0].url, 'https://example.com/report.pdf');
    });

    it('offers the link instead of a frame for http on an https portal', () => {
        renderViewer({ rows: [row({ url: 'http://insecure.example.com/a' })] });
        assert.isNull(screen.queryByTestId('iframe-loader'));
        assert.include(
            screen.getByText(/can't show this URL in the portal/).textContent ||
                '',
            'link below'
        );
    });

    it('renders nothing when there are no rows', () => {
        const { container } = renderViewer({ rows: [] });
        assert.isNull(container.querySelector('[data-test="ResourceViewer"]'));
    });

    describe('reachability check', () => {
        const originalFetch = (global as any).fetch;
        afterEach(() => {
            (global as any).fetch = originalFetch;
        });

        it('frames immediately for a resource with no configured message', async () => {
            // The check still runs, but nothing waits for it: making every resource pay a round
            // trip before anything appears would be worse than a brief frame.
            let settle: (v?: any) => void = () => undefined;
            (global as any).fetch = jest.fn(
                () => new Promise(resolve => (settle = resolve))
            );

            renderViewer();

            await waitFor(() =>
                assert.isNotNull(screen.queryByTestId('iframe-loader'))
            );
            settle();
        });

        it('waits for the check when the resource names its own message', async () => {
            // A resource known to be gated should not flash a broken frame first.
            let settle: (v?: any) => void = () => undefined;
            (global as any).fetch = jest.fn(
                () => new Promise(resolve => (settle = resolve))
            );

            renderViewer({ iframeErrorMessage: VPN_MESSAGE });

            assert.isNull(screen.queryByTestId('iframe-loader'));
            assert.isNotNull(screen.queryByTestId('loading-indicator'));
            settle();
        });

        it('shows a general message when an unnamed resource cannot be reached', async () => {
            (global as any).fetch = jest.fn(() =>
                Promise.reject(new Error('unreachable'))
            );

            renderViewer();

            await waitFor(() =>
                assert.isNotNull(screen.queryByText(/could not be reached/))
            );
            assert.isNull(screen.queryByTestId('iframe-loader'));
        });

        it('prefers the resource own message over the general one', async () => {
            (global as any).fetch = jest.fn(() =>
                Promise.reject(new Error('unreachable'))
            );

            renderViewer({ iframeErrorMessage: VPN_MESSAGE });

            await waitFor(() =>
                assert.isNotNull(screen.queryByText(VPN_MESSAGE))
            );
            assert.isNull(screen.queryByTestId('iframe-loader'));
        });

        it('frames the resource when the host answers', async () => {
            (global as any).fetch = jest.fn(() => Promise.resolve({} as any));

            renderViewer({ iframeErrorMessage: VPN_MESSAGE });

            await waitFor(() =>
                assert.isNotNull(screen.queryByTestId('iframe-loader'))
            );
            assert.isNull(screen.queryByText(VPN_MESSAGE));
        });
    });
});
