/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiNavPanel } from './wsiNavPanel';
import { getWsiSlideAccess } from './wsiAuth';
import * as wsiSlideUtils from './wsiSlideUtils';
import { summarizePathologyPresentationItems } from 'pages/patientView/timeline/pathologyPresentationUtils';
import {
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

jest.mock('./wsiAuth', () => ({
    getWsiSlideAccess: jest.fn(() =>
        Promise.resolve({
            accessToken: 'test-token',
            sourceUrl: 's3://slides/test.svs',
            thumbnail: {
                sourceUrl: 's3://slides/test.jpg',
                width: 128,
                height: 96,
                contentType: 'image/jpeg',
            },
        })
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

const theme = {
    blue: '#2986e2',
    blueLight: '#e8f1fb',
    orange: '#f5a623',
    text: '#333',
    muted: '#737373',
    border: '#ddd',
    navBg: '#fafafa',
};

const sectionTitleStyle: React.CSSProperties = {};

function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        image_id: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
        barcode: 'S-1234567-T01-1-1-1-1',
        block_label: 'A1',
        block_number: '1',
        ...overrides,
    };
}

function makeSample(sampleId: string, slides: Slide[]): Sample {
    return {
        sample_id: sampleId,
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: 'Primary',
        parts: [
            {
                part_number: '1',
                part_designator: 'A',
                part_type: 'Resection',
                part_description: 'Test part',
                subspecialty: 'GI',
                path_dx_title: 'TEST',
                blocks: [
                    {
                        block_number: '1',
                        block_label: 'A1',
                        slides,
                    },
                ],
            },
        ],
    };
}

function makeHierarchy(
    samples: Sample[],
    slideAssociations?: SlideAssociation[]
): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples,
        slide_associations: slideAssociations,
    };
}

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
        mockGetWsiSlideAccess.mockReset();
        mockGetWsiSlideAccess.mockResolvedValue({
            accessToken: 'test-token',
            sourceUrl: 's3://slides/test.svs',
            tileMetadata: {
                dimensions: { width: 100, height: 80 },
                levels: 1,
                level_dimensions: [{ width: 100, height: 80 }],
                max_zoom: 0,
                tile_size: 256,
            },
            thumbnail: {
                sourceUrl: 's3://slides/test.jpg',
                width: 128,
                height: 96,
                contentType: 'image/jpeg',
            },
            imageId: '1000',
            tokenType: 'Bearer',
            expiresIn: 300,
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

    it('derives ordered slides only once per sample render', () => {
        const getOrderedServableSlidesForSampleReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getOrderedServableSlidesForSampleReadOnly'
        );
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
        const slide1 = makeSlide({ image_id: 'slide-1' });
        const slide2 = makeSlide({ image_id: 'slide-2' });
        const sample1 = makeSample('S-1', [slide1]);
        const sample2 = makeSample('S-2', [slide2]);
        const hierarchy = makeHierarchy([sample1, sample2]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={hierarchy}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(
            getOrderedServableSlidesForSampleReadOnlySpy
        ).toHaveBeenCalledTimes(2);

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={hierarchy}
                    dataVersion={0}
                    selectedSlide={slide2}
                    stainFilter="all"
                    onFilterChange={() => {}}
                    onSelectSlide={() => {}}
                    theme={theme}
                    navWidth={252}
                    sectionTitleStyle={sectionTitleStyle}
                />
            );
        });

        expect(
            getOrderedServableSlidesForSampleReadOnlySpy
        ).toHaveBeenCalledTimes(2);
    });

    it('uses the read-only association lookup for navigation filtering', () => {
        const getAssociationsByImageIdReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideAssociationsByImageIdReadOnly'
        );
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            image_id: 'slide-1',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::slide-1',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(getAssociationsByImageIdReadOnlySpy).toHaveBeenCalledTimes(1);
    });

    it('does not re-fire selection when clicking the already selected slide', () => {
        const slide = makeSlide({ image_id: 'selected-slide' });
        const sample = makeSample('S-1', [slide]);
        const onSelectSlide = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={slide}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={onSelectSlide}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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

    it('does not re-fire the active stain filter callback', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const onFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={onFilterChange}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const onMatchFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                onFilterChange={() => {}}
                onMatchFilterChange={onMatchFilterChange}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
            makeSlide({ image_id: 'block-slide' }),
            makeSlide({ image_id: 'part-slide' }),
            makeSlide({ image_id: 'unmatched-slide' }),
        ]);
        const association = (
            imageId: string,
            matchLevel: SlideAssociation['match_level']
        ): SlideAssociation => ({
            image_id: imageId,
            sample_id: matchLevel === 'UNMATCHED' ? null : 'S-1',
            match_level: matchLevel,
            specimen_key: `${matchLevel}::${imageId}`,
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
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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

    it('shows the exact count targeted by a legacy specimen-specific View slides linkout', () => {
        const firstSlide = makeSlide({ image_id: 'block-slide-1' });
        const secondSlide = makeSlide({ image_id: 'block-slide-2' });
        const hierarchy = makeHierarchy(
            [makeSample('S-1', [firstSlide, secondSlide])],
            [
                {
                    image_id: firstSlide.image_id,
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'BLOCK::block-slide-1',
                    part_number: '1',
                    block_number: 'S16-10037/1-3TLN',
                    block_label: '3TLN',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: secondSlide.image_id,
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'BLOCK::block-slide-2',
                    part_number: '1',
                    block_number: 'S16-10037/1-4TLN',
                    block_label: '4TLN',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ]
        );
        const linkout = summarizePathologyPresentationItems([
            {
                date: -20,
                linkout:
                    '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK&specimenKey=block%3A%3A1%3A%3A3',
                matchLevel: 'BLOCK',
                nonServableCount: 0,
                sampleId: 'S-1',
                specimen: 'Part 1 / Block 1',
                subtype: 'H&E',
                timepointSource: 'Procedure date',
                totalCount: 1,
                servableCount: 1,
            },
        ]).linkout!;
        const query = new URL(linkout, 'http://localhost').searchParams;
        const slideIdFilter = wsiSlideUtils.getServableSlideIdsForPathologyFilterReadOnly(
            hierarchy,
            {
                sampleId: query.get('sampleId') || undefined,
                matchLevel: query.get('matchLevel') || undefined,
                specimenKey: query.get('specimenKey') || undefined,
            }
        );

        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={hierarchy}
                dataVersion={0}
                selectedSlide={null}
                slideIdFilter={slideIdFilter}
                stainFilter="all"
                matchFilter="block"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(findButtonText(renderer, 'wsi-filtered-slide-count')).toBe(
            'Showing 1 slide'
        );
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-block-slide-1',
            })
        ).toHaveLength(1);
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-block-slide-2',
            })
        ).toHaveLength(0);
    });

    it('hides unmatched entries without viewable slides', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]),
                    makeSample('UNMATCHED', [
                        makeSlide({
                            image_id: 'unmatched-slide',
                            can_serve_tiles: false,
                        }),
                    ]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(JSON.stringify(renderer.toJSON())).not.toContain('UNMATCHED');
    });

    it('filters slides by their effective match level', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'block-slide' }),
            makeSlide({ image_id: 'part-slide' }),
            makeSlide({ image_id: 'unmatched-slide' }),
        ]);
        const association = (
            imageId: string,
            matchLevel: SlideAssociation['match_level']
        ): SlideAssociation => ({
            image_id: imageId,
            sample_id: matchLevel === 'UNMATCHED' ? null : 'S-1',
            match_level: matchLevel,
            specimen_key: `${matchLevel}::${imageId}`,
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
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="part"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
            makeSlide({ image_id: 'unmatched-slide' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            image_id: 'unmatched-slide',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            specimen_key: 'UNMATCHED::unmatched-slide',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="unmatched"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-unmatched-slide',
            })
        ).toHaveLength(1);
    });

    it('explains when the selected filters have no matching slides', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'part-hne' })]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            image_id: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="hne"
                matchFilter="block"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
            makeSlide({ image_id: 'block-hne' }),
            makeSlide({
                image_id: 'block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                is_hne: false,
                is_ihc: true,
            }),
            makeSlide({ image_id: 'part-hne' }),
            makeSlide({ image_id: 'unmatched-hne' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            image_id: 'block-hne',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'block-ihc',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-ihc',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'unmatched-hne',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            specimen_key: 'UNMATCHED::unmatched-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="hne"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
            makeSlide({ image_id: 'block-hne' }),
            makeSlide({
                image_id: 'block-ihc',
                stain_name: 'IHC',
                stain_group: 'IHC',
                is_hne: false,
                is_ihc: true,
            }),
            makeSlide({ image_id: 'part-hne' }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(
                    [sample],
                    [
                        {
                            image_id: 'block-hne',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'block-ihc',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::block-ihc',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'part-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::part-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="block"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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

    it('uses canonical association slide types for both visible slides and facet counts', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'submitted-hne',
                stain_name: 'SLIDES SUBMITTED',
                stain_group: 'Surgical Submitted',
                is_hne: false,
                is_ihc: false,
            }),
            makeSlide({
                image_id: 'ihc-slide',
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
                            image_id: 'submitted-hne',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'PART::submitted-hne',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                        {
                            image_id: 'ihc-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'BLOCK::ihc-slide',
                            slide_type: 'IHC',
                            can_serve_tiles: true,
                        },
                    ]
                )}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="hne"
                matchFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
        expect(findButtonText(renderer, 'wsi-match-filter-block')).toContain(
            '0'
        );
    });

    it('only expands the first sample by default', () => {
        const sample1 = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const sample2 = makeSample('S-2', [makeSlide({ image_id: 'slide-2' })]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample1, sample2])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
        const slide1 = makeSlide({ image_id: 'slide-1' });
        const slide2 = makeSlide({ image_id: 'slide-2' });
        const sample1 = makeSample('S-1', [slide1]);
        const sample2 = makeSample('S-2', [slide2]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample1, sample2])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={makeHierarchy([sample1, sample2])}
                    dataVersion={1}
                    selectedSlide={slide2}
                    stainFilter="all"
                    onFilterChange={() => {}}
                    onSelectSlide={() => {}}
                    theme={theme}
                    navWidth={252}
                    sectionTitleStyle={sectionTitleStyle}
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

    it('does not render a legacy sample-level timepoint', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'slide-1',
                slide_timepoint_days: -1744,
                slide_timepoint_source: 'Sequencing',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(JSON.stringify(renderer.toJSON())).not.toContain('Seq d-1744');
    });

    it('renders procedure dates normalized to tumor sequencing', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            image_id: 'slide-1',
                            slide_timepoint_days: -63,
                            slide_timepoint_source:
                                'Procedure date relative to tumor sequencing',
                        }),
                    ]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(JSON.stringify(renderer.toJSON())).toContain('Proc d-63');
    });

    it('shows slide-level timepoints on individual slide rows', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'slide-1',
                slide_timepoint_days: -20,
                slide_timepoint_source: 'Procedure date',
            }),
            makeSlide({
                image_id: 'slide-2',
                slide_timepoint_days: -5,
                slide_timepoint_source: 'Procedure date',
            }),
        ]);
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        const text = JSON.stringify(renderer.toJSON());
        expect(text).toContain('Proc d-20');
        expect(text).toContain('Proc d-5');
    });

    it('renders a discrete time slider and filters slides by the selected date', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'slide-early',
                slide_timepoint_days: -20,
                slide_timepoint_source: 'Procedure date',
            }),
            makeSlide({
                image_id: 'slide-late',
                slide_timepoint_days: -5,
                slide_timepoint_source: 'Procedure date',
            }),
        ]);
        const onTimepointChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([sample])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                timepointDays={undefined}
                onFilterChange={() => {}}
                onTimepointChange={onTimepointChange}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        const slider = renderer.root.findByProps({
            'data-testid': 'wsi-timepoint-filter-slider',
        });
        expect(slider.props.max).toBe(2);
        expect(findButtonText(renderer, 'wsi-timepoint-filter-all')).toBe(
            'All'
        );

        act(() => {
            slider.props.onChange({ target: { value: '1' } });
        });
        expect(onTimepointChange).toHaveBeenCalledWith(-20);

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={makeHierarchy([sample])}
                    dataVersion={0}
                    selectedSlide={null}
                    stainFilter="all"
                    timepointDays={-20}
                    onFilterChange={() => {}}
                    onTimepointChange={onTimepointChange}
                    onSelectSlide={() => {}}
                    theme={theme}
                    navWidth={252}
                    sectionTitleStyle={sectionTitleStyle}
                />
            );
        });
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-slide-early',
            })
        ).toHaveLength(1);
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-slide-item-slide-late',
            })
        ).toHaveLength(0);

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-timepoint-filter-all' })
                .props.onClick();
        });
        expect(onTimepointChange).toHaveBeenLastCalledWith(undefined);
    });

    it('omits the time slider when only one dated value is available', () => {
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            image_id: 'dated',
                            slide_timepoint_days: -20,
                            slide_timepoint_source: 'Procedure date',
                        }),
                        makeSlide({ image_id: 'undated' }),
                    ]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-timepoint-filter',
            })
        ).toHaveLength(0);
    });

    it('shows an unavailable selected timepoint with an all-dates action', () => {
        const onTimepointChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            image_id: 'dated',
                            slide_timepoint_days: -5,
                            slide_timepoint_source: 'Procedure date',
                        }),
                    ]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                timepointDays={-20}
                onFilterChange={() => {}}
                onTimepointChange={onTimepointChange}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        expect(JSON.stringify(renderer.toJSON())).toContain(
            'd-20 (unavailable)'
        );
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'wsi-timepoint-filter-slider',
            })
        ).toHaveLength(0);

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-timepoint-filter-all' })
                .props.onClick();
        });
        expect(onTimepointChange).toHaveBeenCalledWith(undefined);
    });

    it('offers an explicit show-all action when route filters are active', () => {
        const onClearFilters = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                showClearFilters={true}
                onFilterChange={() => {}}
                onClearFilters={onClearFilters}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
            />
        );

        act(() => {
            renderer.root
                .findByProps({ 'data-testid': 'wsi-clear-filters' })
                .props.onClick();
        });
        expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('computes facet counts from the patient hierarchy while a linkout scope is active', () => {
        const onFilterChange = jest.fn();
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            image_id: 'hne-slide',
                            is_hne: true,
                            is_ihc: false,
                        }),
                        makeSlide({
                            image_id: 'ihc-slide',
                            stain_name: 'IHC',
                            is_hne: false,
                            is_ihc: true,
                        }),
                    ]),
                ])}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                matchFilter="all"
                linkoutScopeActive={true}
                slideIdFilter={new Set(['hne-slide'])}
                onFilterChange={onFilterChange}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
                makeSlide({ image_id: `slide-${index + 1}` }),
            ])
        );
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(samples)}
                dataVersion={0}
                selectedSlide={null}
                stainFilter="all"
                deferOffscreenSamples={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
                makeSlide({ image_id: `slide-${index + 1}` }),
            ])
        );
        const renderer = TestRenderer.create(
            <WsiNavPanel
                hierarchy={makeHierarchy(samples)}
                dataVersion={0}
                selectedSlide={samples[7].parts[0].blocks[0].slides[0]}
                stainFilter="all"
                deferOffscreenSamples={true}
                onFilterChange={() => {}}
                onSelectSlide={() => {}}
                theme={theme}
                navWidth={252}
                sectionTitleStyle={sectionTitleStyle}
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
