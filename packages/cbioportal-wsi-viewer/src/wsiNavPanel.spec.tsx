/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiNavPanel } from './wsiNavPanel';
import { getWsiSlideSource } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import {
    scheduleThumbnailRequest,
    THUMBNAIL_REQUEST_CONCURRENCY,
} from './thumbnailRequestLimiter';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    makeHierarchy,
    makeSample,
    makeSlide,
    makeTileMetadata,
} from './wsiTestFixtures';
import { MatchLevel, PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

jest.mock('./wsiAuth', () => ({
    ...jest.requireActual('./wsiAuth'),
    getWsiSlideSource: jest.fn(),
}));

const mockGetWsiSlideSource = getWsiSlideSource as jest.MockedFunction<
    typeof getWsiSlideSource
>;

function mockSlideSources() {
    mockGetWsiSlideSource.mockImplementation((_studyId, slideKey) => ({
        slideKey,
        servingKey: slideKey,
        sealedSource: `sealed-${slideKey}`,
        tileMetadata: makeTileMetadata(),
    }));
}
mockSlideSources();

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
    URL,
    'createObjectURL'
);
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
    URL,
    'revokeObjectURL'
);

const navContext = {
    tileServerBase: 'https://tiles.example.com',
    studyId: 'study-1',
    authScope: 'user-a',
};

function findButtonText(
    renderer: TestRenderer.ReactTestRenderer,
    testId: string
): string {
    return flattenRenderedText(
        renderer.root.findByProps({ 'data-testid': testId })
    );
}

function hasTestId(
    renderer: TestRenderer.ReactTestRenderer,
    testId: string
): boolean {
    return renderer.root.findAllByProps({ 'data-testid': testId }).length > 0;
}

function flattenRenderedText(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(flattenRenderedText).join('');
    }
    if (value && typeof value === 'object' && 'children' in value) {
        return flattenRenderedText((value as { children?: unknown }).children);
    }
    return '';
}

function placedSlide(slideKey: string, matchLevel: MatchLevel): Slide {
    return makeSlide({
        slide_key: slideKey,
        sample_id: matchLevel === 'UNMATCHED' ? null : 'S-1',
        match_level: matchLevel,
        specimen_key: `${matchLevel}::${slideKey}`,
    });
}

describe('WsiNavPanel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        clearWsiThumbnailFetchCache();
        mockGetWsiSlideSource.mockReset();
        mockSlideSources();
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({
                'X-Thumbnail-Status': 'ok',
                'Content-Type': 'image/jpeg',
            }),
            blob: async () => new Blob(['thumbnail'], { type: 'image/jpeg' }),
        } as Response) as typeof fetch;
        if (originalCreateObjectUrl) {
            Object.defineProperty(
                URL,
                'createObjectURL',
                originalCreateObjectUrl
            );
        } else {
            Reflect.deleteProperty(URL, 'createObjectURL');
        }
        if (originalRevokeObjectUrl) {
            Object.defineProperty(
                URL,
                'revokeObjectURL',
                originalRevokeObjectUrl
            );
        } else {
            Reflect.deleteProperty(URL, 'revokeObjectURL');
        }
        jest.useRealTimers();
    });

    it('never shows the slide key, a barcode or an image ID in a slide item', () => {
        const key = '0123456789ab';
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: key, block_label: '' }),
        ]);

        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const item = renderer.root.findByProps({
            'data-testid': `wsi-slide-item-${key}`,
        });
        // The item's tooltip, which lists its details.
        const tooltip = renderer.root
            .findAllByType(DefaultTooltip)
            .find(
                node =>
                    node.findAll(
                        child =>
                            child.props['data-testid'] ===
                            `wsi-slide-item-${key}`
                    ).length
            )!;
        const tooltipText = flattenRenderedText(
            TestRenderer.create(tooltip.props.overlay).toJSON()
        );
        const visible = [
            tooltipText,
            item.props['aria-label'],
            flattenRenderedText(item.props.children),
        ].join('\n');
        expect(visible).not.toContain(key);
        expect(visible).not.toMatch(/Barcode|Image ID|Section:|Accession/);
        expect(tooltipText).toContain('Stain: H&E');
    });

    it('draws no stain color bar on a slide item', () => {
        const key = '0123456789ab';
        const sample = makeSample('S-1', [makeSlide({ slide_key: key })]);

        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const item = renderer.root.findByProps({
            'data-testid': `wsi-slide-item-${key}`,
        });
        const borders = item
            .findAll(node => typeof node.type === 'string')
            .map(node => node.props.style?.borderLeft)
            .filter(Boolean);
        expect(borders).toEqual([]);
    });

    it("shows the host's label beside each sample", () => {
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                renderSampleLabel={sampleId => (
                    <span data-testid={`label-${sampleId}`}>1</span>
                )}
                {...navContext}
            />
        );

        expect(
            renderer.root.findAllByProps({ 'data-testid': 'label-S-1' })
        ).toHaveLength(1);
    });

    it('derives ordered slides only once per sample render', () => {
        const getOrderedServableSlidesForSampleReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getOrderedServableSlidesForSampleReadOnly'
        );
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);

        TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            getOrderedServableSlidesForSampleReadOnlySpy
        ).toHaveBeenCalledTimes(1);
    });

    it('does not re-derive filtered sample slides when only the selected slide changes', () => {
        const getOrderedServableSlidesForSampleReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getOrderedServableSlidesForSampleReadOnly'
        );
        const slide1 = makeSlide({ slide_key: 'slide-1' });
        const slide2 = makeSlide({ slide_key: 'slide-2' });
        const sample1 = makeSample('S-1', [slide1]);
        const sample2 = makeSample('S-2', [slide2]);
        const hierarchy = makeHierarchy([sample1, sample2]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={hierarchy}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            getOrderedServableSlidesForSampleReadOnlySpy
        ).toHaveBeenCalledTimes(2);

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={hierarchy}
                    selectedSlide={slide2}
                    stainFilter="all"
                    onFilterChange={() => {}}
                    onSelectSlide={() => {}}
                    {...navContext}
                />
            );
        });

        expect(
            getOrderedServableSlidesForSampleReadOnlySpy
        ).toHaveBeenCalledTimes(2);
    });

    it('does not re-fire selection when clicking the already selected slide', () => {
        const slide = makeSlide({ slide_key: 'selected-slide' });
        const sample = makeSample('S-1', [slide]);
        const onSelectSlide = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={slide}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={onSelectSlide}
                {...navContext}
            />
        );

        act(() => {
            renderer.root
                .findByProps({
                    'data-testid': 'wsi-slide-item-selected-slide',
                })
                .props.onClick();
        });

        expect(onSelectSlide).not.toHaveBeenCalled();
    });

    it('supports keyboard activation for a viewable slide', () => {
        const slide = makeSlide({ slide_key: 'keyboard-slide' });
        const sample = makeSample('S-1', [slide]);
        const onSelectSlide = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={onSelectSlide}
                {...navContext}
            />
        );
        const slideNode = renderer.root.findByProps({
            'data-testid': 'wsi-slide-item-keyboard-slide',
        });

        act(() => {
            slideNode.props.onKeyDown({
                key: 'Enter',
                preventDefault: () => {},
            });
        });
        act(() => {
            slideNode.props.onKeyDown({
                key: ' ',
                preventDefault: () => {},
            });
        });

        expect(onSelectSlide).toHaveBeenCalledTimes(2);
        expect(onSelectSlide).toHaveBeenLastCalledWith(slide, sample);
    });

    it('does not toggle a sample when Enter originates from a nested link', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'nested-link-slide' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const sampleHeader = renderer.root.findByProps({
            'aria-label': 'S-1 slides',
        });
        const preventDefault = jest.fn();
        const target = {};
        const currentTarget = {};

        act(() => {
            sampleHeader.props.onKeyDown({
                key: 'Enter',
                target,
                currentTarget,
                preventDefault,
            });
        });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(sampleHeader.props['aria-expanded']).toBe(true);
    });

    it('clears the stain filter when the active stain chip is clicked again', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'hne-slide', stain_kind: 'hne' }),
            makeSlide({
                slide_key: 'ihc-slide',
                stain_name: 'IHC',
                stain_kind: 'ihc',
            }),
        ]);
        const onFilterChange = jest.fn();
        const panel = (stainFilter: 'all' | 'hne') => (
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter={stainFilter}
                onFilterChange={onFilterChange}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const renderer = TestRenderer.create(panel('all'));

        expect(hasTestId(renderer, 'wsi-stain-filter-all')).toBe(false);
        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-stain-filter-hne' })
                .props.onClick();
        });
        expect(onFilterChange).toHaveBeenLastCalledWith('hne');

        act(() => {
            renderer.update(panel('hne'));
        });
        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-stain-filter-hne' })
                .props.onClick();
        });
        expect(onFilterChange).toHaveBeenLastCalledWith('all');
    });

    it('clears the match filter when the active match chip is clicked again', () => {
        const sample = makeSample('S-1', [
            placedSlide('block-slide', 'BLOCK'),
            placedSlide('part-slide', 'PART'),
        ]);
        const onMatchFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="part"
                onFilterChange={() => {}}
                onMatchFilterChange={onMatchFilterChange}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(hasTestId(renderer, 'wsi-match-filter-all')).toBe(false);
        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-match-filter-part' })
                .props.onClick();
        });
        expect(onMatchFilterChange).toHaveBeenCalledWith('all');
    });

    it('keeps the stain chips when the match filter leaves only one stain', () => {
        // As for a patient whose unmatched slides are all H&E.
        const sample = makeSample('S-1', [
            placedSlide('hne-unmatched', 'UNMATCHED'),
            placedSlide('hne-block', 'BLOCK'),
            {
                ...placedSlide('ihc-block', 'BLOCK'),
                stain_name: 'IHC',
                stain_kind: 'ihc',
            },
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="unmatched"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(hasTestId(renderer, 'wsi-stain-filter-row')).toBe(true);
        expect(findButtonText(renderer, 'wsi-stain-filter-hne')).toContain('1');
        expect(
            renderer.root.findByProps({ 'data-testid': 'wsi-stain-filter-ihc' })
                .props.disabled
        ).toBe(true);
    });

    it('keeps the match chips when the stain filter empties a level', () => {
        // As for a patient whose IHC slides are all block-matched.
        const sample = makeSample('S-1', [
            placedSlide('hne-unmatched', 'UNMATCHED'),
            {
                ...placedSlide('ihc-block', 'BLOCK'),
                stain_name: 'IHC',
                stain_kind: 'ihc',
            },
        ]);
        const panel = (stainFilter: 'all' | 'ihc') => (
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter={stainFilter}
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const renderer = TestRenderer.create(panel('ihc'));

        const unmatched = renderer.root.findByProps({
            'data-testid': 'wsi-match-filter-unmatched',
        });
        expect(unmatched.props.disabled).toBe(true);
        expect(findButtonText(renderer, 'wsi-match-filter-block')).toContain(
            '1'
        );

        act(() => {
            renderer.update(panel('all'));
        });
        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-match-filter-unmatched',
            }).props.disabled
        ).toBe(false);
    });

    it('hides a filter whose slides all share one value', () => {
        const sample = makeSample('S-1', [
            placedSlide('part-1', 'PART'),
            placedSlide('part-2', 'PART'),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(hasTestId(renderer, 'wsi-stain-filter-row')).toBe(false);
        expect(hasTestId(renderer, 'wsi-match-filter-row')).toBe(false);
    });

    it('leaves out the filter area when there is nothing to show in it', () => {
        const sample = makeSample('S-1', [
            placedSlide('part-1', 'PART'),
            placedSlide('part-2', 'PART'),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(hasTestId(renderer, 'wsi-stain-filter-row')).toBe(false);
        expect(hasTestId(renderer, 'wsi-match-filter-row')).toBe(false);
        expect(hasTestId(renderer, 'wsi-filtered-slide-count')).toBe(false);
        // No empty bar under the header: nothing but the header precedes the list.
        expect(
            renderer.root.findAll(
                (node: any) =>
                    node.type === 'div' &&
                    node.props.style?.padding === '4px 12px 8px'
            )
        ).toHaveLength(0);
    });

    it('shows match badges only for block- and part-matched slides', () => {
        const sample = makeSample('S-1', [
            placedSlide('block-slide', 'BLOCK'),
            placedSlide('part-slide', 'PART'),
            placedSlide('unmatched-slide', 'UNMATCHED'),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-slide-match-badge-block-slide',
            }).children
        ).toEqual(['Block match']);
        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-slide-match-badge-part-slide',
            }).children
        ).toEqual(['Part match']);
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-match-badge-unmatched-slide',
            })
        ).toHaveLength(0);
    });

    it('hides unmatched entries without viewable slides', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]),
                    makeSample('UNMATCHED', [
                        makeSlide({
                            slide_key: 'unmatched-slide',
                            can_serve_tiles: false,
                        }),
                    ]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(JSON.stringify(renderer.toJSON())).not.toContain('UNMATCHED');
    });

    it('filters slides by their effective match level', () => {
        const sample = makeSample('S-1', [
            placedSlide('block-slide', 'BLOCK'),
            placedSlide('part-slide', 'PART'),
            placedSlide('unmatched-slide', 'UNMATCHED'),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="part"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const items = renderer.root.findAll(node =>
            node.props['data-testid']?.startsWith('wsi-slide-item-')
        );
        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-part-slide',
        ]);
    });

    it('filters to unmatched slides when requested', () => {
        const sample = makeSample('UNMATCHED', [
            makeSlide({
                slide_key: 'unmatched-slide',
                sample_id: null,
                match_level: 'UNMATCHED',
                specimen_key: 'UNMATCHED::unmatched-slide',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="unmatched"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-unmatched-slide',
            })
        ).toHaveLength(1);
    });

    function emptyStateText(hierarchy: any) {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={hierarchy}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        return renderer.root
            .findByProps({ 'data-testid': 'wsi-filtered-slide-count' })
            .children.join('');
    }

    it('says so when the patient has no pathology slides', () => {
        expect(emptyStateText(makeHierarchy([]))).toBe(
            'No pathology slides for this patient'
        );
    });

    it('says so when none of the patient slides can be viewed', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'not-scanned',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::not-scanned',
                can_serve_tiles: false,
            }),
        ]);
        expect(emptyStateText(makeHierarchy([sample]))).toBe(
            'No viewable pathology slides for this patient'
        );
    });

    it('explains when the selected filters have no matching slides', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'part-hne',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::part-hne',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="hne"
                matchFilter="block"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root
                .findByProps({
                    'data-testid': 'wsi-filtered-slide-count',
                })
                .children.join('')
        ).toBe('No slides match these filters');
    });

    it('updates match filter counts when the stain filter changes', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'block-hne',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::block-hne',
            }),
            makeSlide({
                slide_key: 'block-ihc',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                stain_kind: 'ihc',
            }),
            makeSlide({
                slide_key: 'part-hne',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::part-hne',
            }),
            makeSlide({
                slide_key: 'unmatched-hne',
                sample_id: null,
                match_level: 'UNMATCHED',
                specimen_key: 'UNMATCHED::unmatched-hne',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="hne"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(findButtonText(renderer, 'wsi-match-filter-block')).toContain(
            '1'
        );
        expect(findButtonText(renderer, 'wsi-match-filter-part')).toContain(
            '1'
        );
        expect(
            findButtonText(renderer, 'wsi-match-filter-unmatched')
        ).toContain('1');
        expect(
            renderer.root
                .findByProps({
                    'data-testid': 'wsi-filtered-slide-count',
                })
                .children.join('')
        ).toBe('Showing 3 of 4 slides');
    });

    it('updates stain filter counts when the match filter changes', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'block-hne',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::block-hne',
            }),
            makeSlide({
                slide_key: 'block-ihc',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                stain_kind: 'ihc',
            }),
            makeSlide({
                slide_key: 'part-hne',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::part-hne',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="block"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const buttons = renderer.root.findAllByType('button');
        const hneButton = buttons.find(button =>
            flattenRenderedText(button).includes('H&E')
        );
        const ihcButton = buttons.find(button =>
            flattenRenderedText(button).includes('IHC')
        );

        expect(hneButton).toBeDefined();
        expect(ihcButton).toBeDefined();
        expect(flattenRenderedText(hneButton)).toContain('1');
        expect(flattenRenderedText(ihcButton)).toContain('1');
    });

    it('does not count Other slides as IHC', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'other-slide',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::other-slide',
                stain_name: 'Other',
                stain_group: 'Other',
                stain_kind: 'other',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        // A single Other slide leaves no stain to choose between.
        expect(hasTestId(renderer, 'wsi-stain-filter-row')).toBe(false);
        // Nothing is filtered, so there is no count to show.
        expect(hasTestId(renderer, 'wsi-filtered-slide-count')).toBe(false);
    });

    it('classifies by the resolved stain flags, not the source stain group, for slides and facet counts', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'submitted-hne',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::submitted-hne',
                stain_name: 'SLIDES SUBMITTED',
                stain_group: 'Surgical Submitted',
                stain_kind: 'hne',
            }),
            makeSlide({
                slide_key: 'ihc-slide',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::ihc-slide',
                stain_name: 'PD-L1',
                stain_group: 'IHC',
                stain_kind: 'ihc',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="hne"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-submitted-hne',
            })
        ).toHaveLength(1);
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-ihc-slide',
            })
        ).toHaveLength(0);
        expect(findButtonText(renderer, 'wsi-stain-filter-hne')).toContain('1');
        expect(findButtonText(renderer, 'wsi-stain-filter-ihc')).toContain('1');
        // Among H&E slides only Part matches remain; the patient's Block
        // slide keeps its chip, disabled.
        expect(findButtonText(renderer, 'wsi-match-filter-part')).toContain(
            '1'
        );
        const block = renderer.root.findByProps({
            'data-testid': 'wsi-match-filter-block',
        });
        expect(findButtonText(renderer, 'wsi-match-filter-block')).toContain(
            '0'
        );
        expect(block.props.disabled).toBe(true);
    });

    it('does not count unknown slides as known Other', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'unknown-slide',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::unknown-slide',
                stain_kind: 'unknown',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(hasTestId(renderer, 'wsi-stain-filter-other')).toBe(false);
        expect(hasTestId(renderer, 'wsi-stain-filter-row')).toBe(false);
    });

    it('lets the sample with the selected slide be collapsed', () => {
        const slideA = makeSlide({ slide_key: 'slide-a' });
        const slideB = makeSlide({ slide_key: 'slide-b' });
        const sample = makeSample('S-1', [slideA, slideB]);
        const panel = (selected: Slide) => (
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={selected}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const renderer = TestRenderer.create(panel(slideA));
        const toggle = () =>
            renderer.root.findByProps({ 'aria-label': 'S-1 slides' });

        act(() => toggle().props.onClick());
        expect(toggle().props['aria-expanded']).toBe(false);
        expect(hasTestId(renderer, 'wsi-slide-item-slide-a')).toBe(false);

        // Selecting another slide of the sample opens it again.
        act(() => renderer.update(panel(slideB)));
        expect(toggle().props['aria-expanded']).toBe(true);
    });

    it('reopens a collapsed sample when its slide is selected again', () => {
        const slideA = makeSlide({ slide_key: 'slide-a', sample_id: 'S-1' });
        const slideC = makeSlide({ slide_key: 'slide-c', sample_id: 'S-2' });
        const samples = [
            makeSample('S-1', [slideA]),
            makeSample('S-2', [slideC]),
        ];
        const panel = (selected: Slide) => (
            <WsiNavPanel
                hierarchy={makeHierarchy(samples)}
                selectedSlide={selected}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const renderer = TestRenderer.create(panel(slideA));
        const s1 = () =>
            renderer.root.findByProps({ 'aria-label': 'S-1 slides' });

        act(() => s1().props.onClick());
        expect(s1().props['aria-expanded']).toBe(false);

        // Select a slide elsewhere, then go Back to the first one.
        act(() => renderer.update(panel(slideC)));
        expect(s1().props['aria-expanded']).toBe(false);
        act(() => renderer.update(panel(slideA)));
        expect(s1().props['aria-expanded']).toBe(true);
    });

    it('only expands the first sample by default', () => {
        const sample1 = makeSample('S-1', [
            makeSlide({ slide_key: 'slide-1' }),
        ]);
        const sample2 = makeSample('S-2', [
            makeSlide({ slide_key: 'slide-2' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample1, sample2])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const items = renderer.root.findAll(node =>
            node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
        ]);
    });

    it('auto-expands the sample containing the selected slide', () => {
        const slide1 = makeSlide({ slide_key: 'slide-1' });
        const slide2 = makeSlide({ slide_key: 'slide-2' });
        const sample1 = makeSample('S-1', [slide1]);
        const sample2 = makeSample('S-2', [slide2]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample1, sample2])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={makeHierarchy([sample1, sample2])}
                    selectedSlide={slide2}
                    stainFilter="all"
                    onFilterChange={() => {}}
                    onSelectSlide={() => {}}
                    {...navContext}
                />
            );
        });

        const items = renderer.root.findAll(node =>
            node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
            'wsi-slide-item-slide-2',
        ]);
    });

    it('offers an explicit show-all action when route filters are active', () => {
        const onClearFilters = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                showClearFilters={true}
                onFilterChange={() => {}}
                onClearFilters={onClearFilters}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-clear-filters' })
                .props.onClick();
        });
        expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('shows the linked sample scope and widens it to all slides', () => {
        const onClearFilters = jest.fn();
        const panel = (scoped: boolean) => (
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]),
                    makeSample('S-2', [makeSlide({ slide_key: 'slide-2' })]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                sampleIdFilter="S-1"
                linkoutScopeActive={scoped}
                showClearFilters={true}
                onFilterChange={() => {}}
                onClearFilters={onClearFilters}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const renderer = TestRenderer.create(panel(true));

        const chip = renderer.root.findByProps({
            'data-testid': 'wsi-sample-scope',
        });
        expect(flattenRenderedText(chip.children)).toContain('Sample S-1');
        expect(
            flattenRenderedText(
                renderer.root.findByProps({
                    'data-testid': 'wsi-filtered-slide-count',
                }).children
            )
        ).toContain('Showing 1 of 2 slides');

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-sample-scope-clear' })
                .props.onClick();
        });
        expect(onClearFilters).toHaveBeenCalledTimes(1);

        act(() => {
            renderer.update(panel(false));
        });
        expect(
            renderer.root.findAllByProps({ 'data-testid': 'wsi-sample-scope' })
        ).toHaveLength(0);
    });

    it('says when the scoped sample has no viewable slides', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-2', [makeSlide({ slide_key: 'slide-2' })]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                sampleIdFilter="S-1"
                linkoutScopeActive={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            flattenRenderedText(
                renderer.root.findByProps({
                    'data-testid': 'wsi-filtered-slide-count',
                }).children
            )
        ).toContain('No viewable slides for sample S-1');
    });

    it('leaves the sample chip to the host but keeps the sample scope', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]),
                    makeSample('S-2', [makeSlide({ slide_key: 'slide-2' })]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                sampleIdFilter="S-1"
                linkoutScopeActive={true}
                hostOwnsSampleScope={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root.findAllByProps({ 'data-testid': 'wsi-sample-scope' })
        ).toHaveLength(0);
        expect(
            flattenRenderedText(
                renderer.root.findByProps({
                    'data-testid': 'wsi-filtered-slide-count',
                }).children
            )
        ).toContain('Showing 1 of 2 slides');
    });

    it("counts a host-owned sample's slides on the filter chips", () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            slide_key: 'hne-1',
                            stain_kind: 'hne',
                            match_level: 'BLOCK',
                        }),
                        makeSlide({
                            slide_key: 'ihc-1',
                            stain_name: 'IHC',
                            stain_kind: 'ihc',
                            match_level: 'PART',
                        }),
                    ]),
                    makeSample('S-2', [
                        makeSlide({
                            slide_key: 'hne-2',
                            stain_kind: 'hne',
                            match_level: 'PART',
                        }),
                        makeSlide({
                            slide_key: 'hne-3',
                            stain_kind: 'hne',
                            match_level: 'PART',
                        }),
                        makeSlide({
                            slide_key: 'ihc-2',
                            stain_name: 'IHC',
                            stain_kind: 'ihc',
                            match_level: 'BLOCK',
                        }),
                    ]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                sampleIdFilter="S-1"
                linkoutScopeActive={true}
                hostOwnsSampleScope={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );
        const chipCount = (testId: string) =>
            flattenRenderedText(
                renderer.root.findByProps({ 'data-testid': testId }).children
            );

        expect(chipCount('wsi-stain-filter-hne')).toContain('(1)');
        expect(chipCount('wsi-stain-filter-ihc')).toContain('(1)');
        // The patient has 3 Part and 2 Block slides; the sample 1 of each.
        expect(chipCount('wsi-match-filter-part')).toContain('(1)');
        expect(chipCount('wsi-match-filter-block')).toContain('(1)');
    });

    it('offers "Clear filters", not "Show all slides", within a host-owned sample', () => {
        const label = (hostOwnsSampleScope: boolean) =>
            flattenRenderedText(
                TestRenderer.create(
                    <WsiNavPanel
                        hierarchy={makeHierarchy([
                            makeSample('S-1', [
                                makeSlide({ slide_key: 'slide-1' }),
                            ]),
                            makeSample('S-2', [
                                makeSlide({ slide_key: 'slide-2' }),
                            ]),
                        ])}
                        selectedSlide={null}
                        stainFilter="hne"
                        sampleIdFilter="S-1"
                        linkoutScopeActive={true}
                        hostOwnsSampleScope={hostOwnsSampleScope}
                        showClearFilters={true}
                        onFilterChange={() => {}}
                        onSelectSlide={() => {}}
                        {...navContext}
                    />
                ).root.findByProps({ 'data-testid': 'wsi-clear-filters' })
                    .children
            );

        expect(label(true)).toBe('Clear filters');
        expect(label(false)).toBe('Show all slides');
    });

    it('computes facet counts from the patient hierarchy while a linkout scope is active', () => {
        const onFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            slide_key: 'hne-slide',
                            stain_kind: 'hne',
                        }),
                        makeSlide({
                            slide_key: 'ihc-slide',
                            stain_name: 'IHC',
                            stain_kind: 'ihc',
                        }),
                    ]),
                ])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                linkoutScopeActive={true}
                slideIdFilter={new Set(['hne-slide'])}
                onFilterChange={onFilterChange}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(
            renderer.root
                .findByProps({ 'data-testid': 'wsi-stain-filter-ihc' })
                .findAllByType('span')
                .some(span => span.children.join('') === '(1)')
        ).toBe(true);

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-stain-filter-ihc' })
                .props.onClick();
        });
        expect(onFilterChange).toHaveBeenCalledWith('ihc');
    });

    it('names each thumbnail by its slide key and sealed source, once a slot frees', async () => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: jest.fn(() => 'blob:thumbnail'),
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: jest.fn(),
        });
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({
                'X-Thumbnail-Status': 'ok',
                'Content-Type': 'image/jpeg',
            }),
            blob: async () => new Blob(['thumbnail'], { type: 'image/jpeg' }),
        } as Response) as typeof fetch;
        // Fill every thumbnail slot until the test releases them.
        let releaseSlots: () => void = () => {};
        const slotsReleased = new Promise<void>(resolve => {
            releaseSlots = resolve;
        });
        const blockers = Array.from(
            { length: THUMBNAIL_REQUEST_CONCURRENCY },
            () =>
                scheduleThumbnailRequest(
                    () => slotsReleased,
                    new AbortController().signal
                )
        );
        const tileServerBase = 'https://slot-tiles.example.com';
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'slide-1' }),
            makeSlide({ slide_key: 'slide-2' }),
        ]);

        let renderer!: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <WsiNavPanel
                    hierarchy={makeHierarchy([sample])}
                    selectedSlide={null}
                    stainFilter="all"
                    onFilterChange={() => {}}
                    onSelectSlide={() => {}}
                    {...navContext}
                    tileServerBase={tileServerBase}
                    studyId="slot-study"
                />
            );
        });
        const thumbnailRequests = () =>
            (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
                String(url).startsWith(tileServerBase)
            );

        expect(thumbnailRequests()).toHaveLength(0);

        await act(async () => {
            releaseSlots();
            await Promise.all(blockers);
        });

        const requested = thumbnailRequests().map(
            ([url]) => new URL(String(url))
        );
        expect(requested.map(url => url.searchParams.get('key'))).toEqual([
            'slide-1',
            'slide-2',
        ]);
        requested.forEach(url => {
            expect(url.searchParams.get('studyId')).toBe('slot-study');
            expect(url.searchParams.get('enc')).toBe(
                `sealed-${url.searchParams.get('key')}`
            );
            expect(url.searchParams.has('tw')).toBe(false);
            expect(url.searchParams.has('th')).toBe(false);
        });
        thumbnailRequests().forEach(([, init]) =>
            expect(init.headers).toBeUndefined()
        );
        renderer.unmount();
    });

    it('defers offscreen samples until the initial tiles are ready', () => {
        const samples = Array.from({ length: 8 }, (_, index) =>
            makeSample(`S-${index + 1}`, [
                makeSlide({ slide_key: `slide-${index + 1}` }),
            ])
        );
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(samples)}
                selectedSlide={null}
                stainFilter="all"
                deferOffscreenSamples={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const items = renderer.root.findAll(node =>
            node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
        ]);
        expect(
            renderer.root
                .findAllByType('div')
                .some(node =>
                    String(node.children?.join('')).includes(
                        'Loading 2 more samples...'
                    )
                )
        ).toBe(true);
    });

    it('keeps the selected sample visible while offscreen samples are deferred', () => {
        const samples = Array.from({ length: 8 }, (_, index) =>
            makeSample(`S-${index + 1}`, [
                makeSlide({ slide_key: `slide-${index + 1}` }),
            ])
        );
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(samples)}
                selectedSlide={samples[7].parts[0].blocks[0].slides[0]}
                stainFilter="all"
                deferOffscreenSamples={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const items = renderer.root.findAll(node =>
            node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
            'wsi-slide-item-slide-8',
        ]);
    });
});
