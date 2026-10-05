/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { action } from 'mobx';
import TestRenderer, { act } from 'react-test-renderer';
import WSIViewer, {
    WSI_METADATA_COLLAPSED_KEY,
    WSI_NAV_COLLAPSED_KEY,
} from './WSIViewer';

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: jest.fn(),
    hasPreloadedOpenSeadragon: () => false,
}));

const hierarchy = {
    patient_id: 'P-1',
    samples: [
        {
            sample_id: 'S-1',
            sample_type: 'Primary',
            parts: [
                {
                    part_number: '1',
                    blocks: [
                        {
                            block_number: '1',
                            block_label: 'A1',
                            slides: [
                                {
                                    slide_key: 'slide-a',
                                    stain_name: 'H&E',
                                    stain_group: 'H&E',
                                    is_hne: true,
                                    is_ihc: false,
                                    can_serve_tiles: true,
                                    block_label: 'A1',
                                    block_number: '1',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

function makeViewer(extraProps: Record<string, unknown> = {}) {
    const instance = new (WSIViewer as any)({
        tileServerUrl: 'https://tiles.example.com',
        hierarchyUrl: '/api/wsi/v2/hierarchy/study/P-1',
        patientId: 'P-1',
        height: 500,
        ...extraProps,
    });
    instance.controller.forceResize = jest.fn();
    action(() => {
        instance.hierarchy = hierarchy;
        instance.loading = false;
    })();
    return instance;
}

function byTestId(instance: any, testId: string) {
    return TestRenderer.create(instance.render()).root.findAll(
        (node: any) => node.props['data-testid'] === testId
    );
}

describe('WSIViewer hideable panels', () => {
    beforeEach(() => {
        window.localStorage.clear();
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (callback: FrameRequestCallback) => {
                callback(0);
                return 0;
            }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shows both panels with hide buttons by default', () => {
        const viewer = makeViewer();
        expect(byTestId(viewer, 'wsi-nav-hide').length).toBeGreaterThan(0);
        expect(byTestId(viewer, 'wsi-metadata-hide').length).toBeGreaterThan(0);
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(0);
        expect(byTestId(viewer, 'wsi-metadata-rail')).toHaveLength(0);
    });

    it('hides and restores the slide list, remembering the choice', () => {
        const viewer = makeViewer();
        act(() => viewer.hideNav());

        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(1);
        expect(byTestId(viewer, 'wsi-nav-hide')).toHaveLength(0);
        expect(window.localStorage.getItem(WSI_NAV_COLLAPSED_KEY)).toBe('1');
        expect(viewer.controller.forceResize).toHaveBeenCalled();
        // A new viewer, such as the next patient, opens with the list hidden.
        expect(byTestId(makeViewer(), 'wsi-nav-rail')).toHaveLength(1);

        act(() => viewer.showNav());
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(0);
        expect(window.localStorage.getItem(WSI_NAV_COLLAPSED_KEY)).toBeNull();
    });

    it('hides the details sidebar and its resize handle', () => {
        const viewer = makeViewer();
        act(() => viewer.hideMetadata());

        expect(byTestId(viewer, 'wsi-metadata-rail')).toHaveLength(1);
        expect(byTestId(viewer, 'wsi-metadata-sidebar')).toHaveLength(0);
        expect(byTestId(viewer, 'wsi-metadata-resize-handle')).toHaveLength(0);
        expect(window.localStorage.getItem(WSI_METADATA_COLLAPSED_KEY)).toBe(
            '1'
        );
        expect(viewer.controller.forceResize).toHaveBeenCalled();
    });

    it('renders expanded when browser storage is blocked', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        const viewer = makeViewer();
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(0);

        act(() => viewer.hideNav());
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(1);
    });

    it('follows the host when the hidden state is controlled', () => {
        window.localStorage.setItem(WSI_NAV_COLLAPSED_KEY, '1');
        const onNavCollapsedChange = jest.fn();
        const viewer = makeViewer({
            navCollapsed: false,
            onNavCollapsedChange,
        });
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(0);

        act(() => viewer.hideNav());
        expect(onNavCollapsedChange).toHaveBeenCalledWith(true);
        // The host decides; the stored choice is not touched.
        expect(byTestId(viewer, 'wsi-nav-rail')).toHaveLength(0);
        expect(window.localStorage.getItem(WSI_NAV_COLLAPSED_KEY)).toBe('1');
    });
});
