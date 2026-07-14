/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiNavPanel } from './wsiNavPanel';
import { PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

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

function makeHierarchy(samples: Sample[]): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples,
    };
}

describe('WsiNavPanel', () => {
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

        const items = renderer.root.findAll(
            node => node.props['data-testid']?.startsWith('wsi-slide-item-')
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

        const items = renderer.root.findAll(
            node => node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
            'wsi-slide-item-slide-2',
        ]);
    });

    it('rerenders sample metadata when enrichment updates mutate the sample in place', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
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

        expect(
            renderer.root.findAllByType('div').some(node =>
                String(node.children?.join('')).includes('Timepoint:')
            )
        ).toBe(false);

        sample.sample_timepoint_days = -42;
        sample.sample_timepoint_source = 'Sample acquisition';

        act(() => {
            renderer.update(
                <WsiNavPanel
                    hierarchy={makeHierarchy([sample])}
                    dataVersion={1}
                    selectedSlide={null}
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
            renderer.root.findAllByType('div').some(node =>
                String(node.children?.join('')).includes('Timepoint: Acq d-42')
            )
        ).toBe(true);
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

        const items = renderer.root.findAll(
            node => node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
        ]);
        expect(
            renderer.root.findAllByType('div').some(node =>
                String(node.children?.join('')).includes('Loading 2 more samples...')
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

        const items = renderer.root.findAll(
            node => node.props['data-testid']?.startsWith('wsi-slide-item-')
        );

        expect(items.map(item => item.props['data-testid'])).toEqual([
            'wsi-slide-item-slide-1',
            'wsi-slide-item-slide-8',
        ]);
    });
});
