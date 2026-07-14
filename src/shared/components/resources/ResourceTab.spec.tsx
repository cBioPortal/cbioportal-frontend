jest.mock('shared/components/iframeLoader/IFrameLoader', () => {
    const React = require('react');

    return function MockIFrameLoader() {
        return <div data-testid="iframe-loader" />;
    };
});

jest.mock('shared/components/loadingIndicator/LoadingIndicator', () => {
    const React = require('react');

    return function MockLoadingIndicator(props: { isLoading: boolean }) {
        return props.isLoading ? <div data-testid="loading-indicator" /> : null;
    };
});

jest.mock('shared/components/wsiViewer/WSIViewer', () => {
    const React = require('react');

    return function MockWSIViewer() {
        return <div data-testid="wsi-viewer" />;
    };
});

const mockWarmInitialWsiSlide = jest.fn().mockResolvedValue(undefined);

jest.mock('shared/components/wsiViewer/wsiViewerWarmup', () => ({
    warmInitialWsiSlide: (...args: unknown[]) =>
        mockWarmInitialWsiSlide(...args),
}));

const mockReload = jest.fn();

jest.mock('cbioportal-frontend-commons', () => {
    const actual = jest.requireActual('cbioportal-frontend-commons');

    return {
        ...actual,
        WindowWrapper: class WindowWrapper {
            size = { height: 900, width: 1200 };
        },
        getBrowserWindow: () => ({
            location: {
                protocol: 'https:',
                reload: mockReload,
            },
        }),
    };
});

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ResourceData, ResourceDefinition } from 'cbioportal-ts-api-client';
import * as ResourceConfigModule from 'shared/lib/ResourceConfig';
import ResourceTab, { IResourceTabProps } from './ResourceTab';

const VPN_WARNING_MESSAGE =
    'This resource requires VPN access. Please connect to VPN and refresh the page.';

function makeDefinition(
    overrides: Partial<ResourceDefinition> = {}
): ResourceDefinition {
    return {
        customMetaData: '',
        description: '',
        displayName: 'H&E Slide',
        openByDefault: false,
        priority: '1',
        resourceId: 'MSK_HNE',
        resourceType: 'PATIENT',
        studyId: 'study1',
        ...overrides,
    };
}

function makeResourceData(overrides: Partial<ResourceData> = {}): ResourceData {
    return {
        patientId: 'PATIENT_1',
        resourceDefinition: makeDefinition(),
        resourceId: 'MSK_HNE',
        sampleId: 'SAMPLE_1',
        studyId: 'study1',
        uniquePatientKey: 'PATIENT_1',
        uniqueSampleKey: 'SAMPLE_1',
        url: 'https://example.org/resource.png',
        ...overrides,
    };
}

function makeProps(
    overrides: Partial<IResourceTabProps> = {}
): IResourceTabProps {
    return {
        resourceDisplayName: 'H&E Slide',
        resourceData: [makeResourceData()],
        urlWrapper: {
            setResourceUrl: jest.fn(),
            query: {},
        },
        ...overrides,
    };
}

describe('ResourceTab', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('renders the iframe when the accessibility check succeeds', async () => {
        global.fetch = jest.fn().mockResolvedValue({}) as typeof fetch;

        render(<ResourceTab {...makeProps()} />);

        await waitFor(() =>
            expect(screen.getByTestId('iframe-loader')).toBeTruthy()
        );
        expect(screen.queryByText(VPN_WARNING_MESSAGE)).toBeNull();
    });

    it('shows the configured warning when the accessibility check fails', async () => {
        global.fetch = jest
            .fn()
            .mockRejectedValue(new Error('VPN blocked')) as typeof fetch;

        render(<ResourceTab {...makeProps()} />);

        await waitFor(() =>
            expect(screen.getByText(VPN_WARNING_MESSAGE)).toBeTruthy()
        );
        expect(screen.queryByTestId('iframe-loader')).toBeNull();
    });

    it('warms the native WSI viewer path for resource tabs', async () => {
        jest.spyOn(ResourceConfigModule, 'getResourceConfig').mockReturnValue({
            nativeViewer: 'wsi',
        });

        render(
            <ResourceTab
                {...makeProps({
                    resourceData: [
                        makeResourceData({
                            url: 'https://tiles.example.org/patient/PATIENT_1',
                        }),
                    ],
                })}
            />
        );

        await waitFor(() =>
            expect(mockWarmInitialWsiSlide).toHaveBeenCalledWith({
                tileServerUrl: 'https://tiles.example.org',
                hierarchyUrl:
                    'https://tiles.example.org/patient/PATIENT_1',
                preferredSlideId: undefined,
                stainFilter: 'all',
            })
        );
        expect(screen.getByTestId('wsi-viewer')).toBeTruthy();
    });
});
