/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiNavPanel } from './wsiNavPanel';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

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
        const getAssociationsByImageIdSpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideAssociationsByImageId'
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
        expect(getAssociationsByImageIdSpy).not.toHaveBeenCalled();
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
