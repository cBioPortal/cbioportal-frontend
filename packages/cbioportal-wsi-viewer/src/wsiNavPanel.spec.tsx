/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiNavPanel } from './wsiNavPanel';
import { getWsiSlideAccess } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    makeHierarchy,
    makeSample,
    makeSlide,
    makeTileMetadata,
} from './wsiTestFixtures';
import {
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

jest.mock('./wsiAuth', () => ({
    getWsiSlideAccess: jest.fn(() =>
        Promise.resolve({ accessToken: 'test-token' })
    ),
}));

const mockGetWsiSlideAccess = getWsiSlideAccess as jest.MockedFunction<
    typeof getWsiSlideAccess
>;

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

describe('WsiNavPanel', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        clearWsiThumbnailFetchCache();
        mockGetWsiSlideAccess.mockReset();
        mockGetWsiSlideAccess.mockResolvedValue({
            accessToken: 'test-token',
            tileMetadata: makeTileMetadata(),
            slideKey: '1000',
            expiresIn: 300,
            expiresAt: Date.now() + 300_000,
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
        const key = '0123456789abcdef0123456789abcdef';
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
        const visible = [
            item.props.title,
            item.props['aria-label'],
            flattenRenderedText(item.props.children),
        ].join('\n');
        expect(visible).not.toContain(key);
        expect(visible).not.toMatch(/Barcode|Image ID|Section:|Accession/);
        expect(item.props.title).toContain('Stain: H&E');
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

    it('uses the read-only association lookup for navigation filtering', () => {
        const getAssociationsBySlideKeyReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideAssociationsBySlideKeyReadOnly'
        );
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);

        TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'slide-1',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::slide-1',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(getAssociationsBySlideKeyReadOnlySpy).toHaveBeenCalledTimes(1);
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

    it('does not re-fire the active stain filter callback', () => {
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);
        const onFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={onFilterChange}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        const allButton = renderer.root
            .findAllByType('button')
            .find(button => button.children.includes('All'))!;

        act(() => {
            allButton.props.onClick();
        });

        expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('does not re-fire the active match filter callback', () => {
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);
        const onMatchFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onMatchFilterChange={onMatchFilterChange}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-match-filter-all' })
                .props.onClick();
        });

        expect(onMatchFilterChange).not.toHaveBeenCalled();
    });

    it('shows match badges only for block- and part-matched slides', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'block-slide' }),
            makeSlide({ slide_key: 'part-slide' }),
            makeSlide({ slide_key: 'unmatched-slide' }),
        ]);
        const association = (
            slideKey: string,
            matchLevel: SlideAssociation['match_level']
        ): SlideAssociation => ({
            slide_key: slideKey,
            sample_id: matchLevel === 'UNMATCHED' ? null : 'S-1',
            match_level: matchLevel,
            specimen_key: `${matchLevel}::${slideKey}`,
            slide_type: 'H&E',
            can_serve_tiles: true,
        });
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        association('block-slide', 'BLOCK'),
                        association('part-slide', 'PART'),
                        association('unmatched-slide', 'UNMATCHED'),
                    ]
                )}
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
        ).toEqual(['Block']);
        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-slide-match-badge-part-slide',
            }).children
        ).toEqual(['Part']);
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
            makeSlide({ slide_key: 'block-slide' }),
            makeSlide({ slide_key: 'part-slide' }),
            makeSlide({ slide_key: 'unmatched-slide' }),
        ]);
        const association = (
            slideKey: string,
            matchLevel: SlideAssociation['match_level']
        ): SlideAssociation => ({
            slide_key: slideKey,
            sample_id: matchLevel === 'UNMATCHED' ? null : 'S-1',
            match_level: matchLevel,
            specimen_key: `${matchLevel}::${slideKey}`,
            slide_type: 'H&E',
            can_serve_tiles: true,
        });
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        association('block-slide', 'BLOCK'),
                        association('part-slide', 'PART'),
                        association('unmatched-slide', 'UNMATCHED'),
                    ]
                )}
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
            makeSlide({ slide_key: 'unmatched-slide' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'unmatched-slide',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            specimen_key: 'UNMATCHED::unmatched-slide',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
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
        expect(emptyStateText(makeHierarchy([], []))).toBe(
            'No pathology slides for this patient'
        );
    });

    it('says so when none of the patient slides can be viewed', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'not-scanned', can_serve_tiles: false }),
        ]);
        expect(
            emptyStateText(
                makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'not-scanned',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::not-scanned',
                            slide_type: 'H&E',
                            can_serve_tiles: false,
                        },
                    ]
                )
            )
        ).toBe('No viewable pathology slides for this patient');
    });

    it('explains when the selected filters have no matching slides', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'part-hne' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
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
            makeSlide({ slide_key: 'block-hne' }),
            makeSlide({
                slide_key: 'block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                is_hne: false,
                is_ihc: true,
            }),
            makeSlide({ slide_key: 'part-hne' }),
            makeSlide({ slide_key: 'unmatched-hne' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'block-hne',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'block-ihc',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-ihc',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'unmatched-hne',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            specimen_key: 'UNMATCHED::unmatched-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
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
        ).toBe('Showing 3 slides');
    });

    it('updates stain filter counts when the match filter changes', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'block-hne' }),
            makeSlide({
                slide_key: 'block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                is_hne: false,
                is_ihc: true,
            }),
            makeSlide({ slide_key: 'part-hne' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'block-hne',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'block-ihc',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-ihc',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
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
                stain_name: 'Other',
                stain_group: 'Other',
                slide_type: 'Other',
                is_hne: false,
                is_ihc: false,
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'other-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::other-slide',
                            slide_type: 'Other',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(findButtonText(renderer, 'wsi-stain-filter-hne')).toContain('0');
        expect(findButtonText(renderer, 'wsi-stain-filter-ihc')).toContain('0');
        expect(findButtonText(renderer, 'wsi-stain-filter-other')).toContain(
            '1'
        );
        expect(findButtonText(renderer, 'wsi-stain-filter-unknown')).toContain(
            '0'
        );
        expect(findButtonText(renderer, 'wsi-filtered-slide-count')).toBe(
            'Showing 1 slide'
        );
    });

    it('classifies by the resolved stain flags, not the source stain group, for slides and facet counts', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'submitted-hne',
                stain_name: 'SLIDES SUBMITTED',
                stain_group: 'Surgical Submitted',
                slide_type: 'H&E',
                is_hne: true,
                is_ihc: false,
            }),
            makeSlide({
                slide_key: 'ihc-slide',
                stain_name: 'PD-L1',
                stain_group: 'IHC',
                is_hne: false,
                is_ihc: true,
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'submitted-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::submitted-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            slide_key: 'ihc-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::ihc-slide',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                    ]
                )}
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
        expect(findButtonText(renderer, 'wsi-match-filter-part')).toContain(
            '1'
        );
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-match-filter-block',
            })
        ).toHaveLength(0);
    });

    it('does not count unknown associations as known Other', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                slide_key: 'unknown-slide',
                is_hne: false,
                is_ihc: false,
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            slide_key: 'unknown-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::unknown-slide',
                            slide_type: 'Unknown',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                {...navContext}
            />
        );

        expect(findButtonText(renderer, 'wsi-stain-filter-other')).toContain(
            '0'
        );
        expect(findButtonText(renderer, 'wsi-stain-filter-unknown')).toContain(
            '1'
        );
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
        ).toContain('Showing 1 slide');

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

    it('computes facet counts from the patient hierarchy while a linkout scope is active', () => {
        const onFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            slide_key: 'hne-slide',
                            is_hne: true,
                            is_ihc: false,
                        }),
                        makeSlide({
                            slide_key: 'ihc-slide',
                            stain_name: 'IHC',
                            is_hne: false,
                            is_ihc: true,
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
                .findByProps({ 'data-testid': 'wsi-stain-filter-all' })
                .props.onClick();
        });
        expect(onFilterChange).toHaveBeenCalledWith('all');
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
