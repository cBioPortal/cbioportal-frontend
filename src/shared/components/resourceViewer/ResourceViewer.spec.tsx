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
        location: { protocol: 'https:', reload: () => undefined },
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
        patientStableId: 'P-1',
        sampleStableId: 'S-1',
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
    });

    it('frames the row at the given index', async () => {
        renderViewer({ index: 1 });
        await waitFor(() => assert.isAbove(iframeProps.length, 0));
        assert.equal(iframeProps[0].url, 'https://example.com/2.html');
    });

    it('names a patient-level item by its patient, not by its scope', () => {
        // toResourceTableRows fills sampleId with "Patient-level" when a row has no sample.
        renderViewer({
            rows: [
                row({
                    sampleId: 'Patient-level',
                    sampleStableId: undefined,
                    patientStableId: 'TCGA-4Z-AA7M',
                }),
            ],
        });
        assert.equal(
            screen.getByTestId('ResourceViewerCaption').textContent,
            'TCGA-4Z-AA7M | 1 of 1'
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

        // Every resource takes the same path: frame at once, check the host, and replace the
        // frame with a message if the host does not answer. Only the message differs.
        [
            ['no configured message', {}],
            ['its own message', { iframeErrorMessage: VPN_MESSAGE }],
        ].forEach(([name, props]) => {
            it(`frames before the check finishes, for a resource with ${name}`, async () => {
                let settle: (v?: any) => void = () => undefined;
                (global as any).fetch = jest.fn(
                    () => new Promise(resolve => (settle = resolve))
                );

                renderViewer(props as any);

                assert.isNotNull(screen.queryByTestId('iframe-loader'));
                assert.isNull(screen.queryByTestId('loading-indicator'));
                assert.equal((global as any).fetch.mock.calls.length, 1);
                settle();
            });
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

        it('offers the link out in the warning, where no frame is drawn', async () => {
            // The frame normally carries the link; without one the user would have no way out.
            (global as any).fetch = jest.fn(() =>
                Promise.reject(new Error('unreachable'))
            );

            renderViewer({ index: 1 });

            await waitFor(() =>
                assert.isNotNull(
                    screen.queryByTestId('ResourceViewerWarningLink')
                )
            );
            assert.equal(
                screen
                    .getByTestId('ResourceViewerWarningLink')
                    .getAttribute('href'),
                'https://example.com/2.html'
            );
            assert.lengthOf(screen.getAllByText(/Open in new window/), 1);
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
            // The frame draws Open in new window itself, as in the other framed views.
            assert.isNull(screen.queryByText(/Open in new window/));
        });
    });
});
