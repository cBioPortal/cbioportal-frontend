import {
    buildPathRows,
    buildSampleUrl,
    buildWsiRows,
    stainValue,
} from './wsiMetaUtils';
import {
    configureWsiViewerRuntime,
    resetWsiViewerRuntime,
} from './wsiViewerConfig';
import { MatchLevel, Sample, Slide, TileMetadata } from './wsiViewerTypes';

const slide: Slide = {
    slide_key: 'slide-1',
    stain_name: 'H&E',
    stain_group: 'Histology',
    stain_kind: 'hne',
    magnification: '20x',
    file_size_bytes: '100000000',
    can_serve_tiles: true,
    block_label: 'A1',
    block_number: '1',
};

const sample: Sample = {
    sample_id: 'S-1',
    parts: [],
};

const metadata: TileMetadata = {
    dimensions: { width: 1000, height: 2000 },
    level_dimensions: [
        { width: 1000, height: 2000 },
        { width: 500, height: 1000 },
    ],
    levels: 2,
    max_zoom: 4,
    mpp: { x: 0.25, y: 0.25 },
    objective_power: 40,
    tile_size: 256,
    vendor: 'aperio',
};

function placedSlide(
    matchLevel: MatchLevel,
    overrides: Partial<Slide> = {}
): Slide {
    return {
        ...slide,
        sample_id: 'S-1',
        match_level: matchLevel,
        specimen_key: `${matchLevel}::${slide.slide_key}`,
        ...overrides,
    };
}

describe('buildSampleUrl', () => {
    afterEach(() => resetWsiViewerRuntime());

    it('links root-relative when the host gives no page URL builder', () => {
        expect(buildSampleUrl('study 1', 'S-1', 'P-1')).toBe(
            '/patient?studyId=study%201&caseId=P-1&sampleId=S-1'
        );
    });

    it('links through the host page URL builder, keeping its context path', () => {
        configureWsiViewerRuntime({
            buildApiUrl: path => `/beta/${path}`,
            buildPageUrl: (path, query) =>
                `https://portal.example/beta/${path}?${new URLSearchParams(
                    query
                )}`,
        });

        expect(buildSampleUrl('study-1', 'S-1', 'P-1')).toBe(
            'https://portal.example/beta/patient?studyId=study-1&caseId=P-1&sampleId=S-1'
        );
    });
});

describe('buildPathRows', () => {
    it.each([
        ['BLOCK', 'Block-matched'],
        ['PART', 'Part-matched'],
    ] as const)('shows %s matching as %s', (matchLevel, expectedValue) => {
        const rows = buildPathRows(
            placedSlide(matchLevel),
            sample,
            'P-1',
            'study-1'
        );

        expect(rows).toContainEqual(
            expect.objectContaining({ label: 'Match', value: expectedValue })
        );
        const match = rows.find(row => row.label === 'Match');
        expect(match?.valueTip).toContain(
            matchLevel === 'BLOCK'
                ? 'same tissue block that was sequenced'
                : 'same part as the sequenced sample'
        );
    });

    it('explains every pathology row with a tooltip', () => {
        const rows = buildPathRows(
            placedSlide('BLOCK', {
                part_number: '6',
                part_description: 'Specimen 6',
                block_label: 'Block 1',
            }),
            sample,
            'P-1',
            'study-1'
        );

        rows.forEach(row => expect(row.labelTip).toBeTruthy());
        expect(rows.find(row => row.label === 'Stain')?.valueTip).toContain(
            'Stain group:'
        );
        expect(rows.find(row => row.label === 'Part')?.valueTip).toBe(
            'Cut from block 1 of part 6'
        );
    });

    it('describes the sample by block only', () => {
        const rows = buildPathRows(
            placedSlide('BLOCK'),
            sample,
            'P-1',
            'study-1'
        );

        const sampleRow = rows.find(row => row.label === 'Sample');
        expect(sampleRow?.labelTip).toBe(
            'Click for cBioPortal sample view — hover for block info'
        );
        expect(sampleRow?.valueTip).toBe('Block: A1');
        rows.forEach(row => {
            expect(`${row.labelTip} ${row.valueTip} ${row.value}`).not.toMatch(
                /Accession|Barcode|Image ID|slide-1/
            );
        });
    });

    it('does not show a matching row for unmatched slides', () => {
        const rows = buildPathRows(
            placedSlide('UNMATCHED'),
            sample,
            'P-1',
            'study-1'
        );

        expect(rows.some(row => row.label === 'Match')).toBe(false);
    });

    it('names the specimen by part and block', () => {
        const rows = buildPathRows(
            placedSlide('BLOCK', {
                part_number: '4',
                block_label: 'A1',
            }),
            sample,
            'P-1',
            'study-1'
        );

        expect(rows).toContainEqual(
            expect.objectContaining({
                label: 'Part',
                value: 'Part 4 / Block A1',
            })
        );
    });

    it('leaves patient, study and cancer type to the page and Clinical section', () => {
        const labels = buildPathRows(
            placedSlide('BLOCK'),
            sample,
            'P-1',
            'study-1'
        ).map(row => row.label);

        [
            'Patient',
            'Study',
            'Cancer type',
            'OncoTree',
            'Primary site',
        ].forEach(label => expect(labels).not.toContain(label));
        expect(labels).toContain('Sample');
    });

    it('shows the anatomical site and no diagnosis title', () => {
        const rows = buildPathRows(
            placedSlide('BLOCK', {
                part_description: 'Colon adenocarcinoma',
            }),
            sample,
            'P-1',
            'study-1'
        );

        expect(rows).toContainEqual(
            expect.objectContaining({
                label: 'Anatomical site',
                value: 'Colon adenocarcinoma',
            })
        );
        expect(rows.some(row => row.label === 'Path Dx')).toBe(false);
    });

    it.each(['Specimen 5', 'Part 5'])(
        'drops a de-identified "%s" part description as an anatomical site',
        partDescription => {
            const rows = buildPathRows(
                placedSlide('BLOCK', { part_description: partDescription }),
                sample,
                'P-1',
                'study-1'
            );

            expect(rows.some(row => row.label === 'Anatomical site')).toBe(
                false
            );
        }
    );

    it('never says "specimen" in the pathology rows', () => {
        const rows = buildPathRows(
            placedSlide('BLOCK', {
                part_number: '6',
                part_description: 'Specimen 6',
                block_label: 'Block 1',
            }),
            sample,
            'P-1',
            'study-1'
        );

        expect(JSON.stringify(rows)).not.toMatch(/specimen/i);
    });
});

describe('buildWsiRows', () => {
    it('shows dimensions, magnification and scanner', () => {
        expect(buildWsiRows(slide, metadata)).toEqual([
            {
                label: 'Dimensions',
                labelTip: 'Width × height at full resolution',
                value: '1,000 × 2,000 px',
                valueTip: 'About 0.3 × 0.5 mm of glass\nFile size 95.4 MB',
            },
            {
                label: 'Magnification',
                labelTip:
                    'Scanner magnification and microns per pixel at full resolution',
                value: '20x · 0.2500 µm/px',
                valueTip:
                    'Each pixel spans 0.2500 µm; 1 mm is about 4,000 pixels',
            },
            {
                label: 'Scanner vendor',
                labelTip: 'Scanner manufacturer recorded in the slide file',
                value: 'aperio',
            },
        ]);
    });

    it('falls back to objective power and omits unavailable optional properties', () => {
        const rows = buildWsiRows(
            { ...slide, magnification: '', file_size_bytes: '' },
            {
                ...metadata,
                mpp: undefined,
                objective_power: 40,
                vendor: undefined,
            }
        );

        expect(rows.map(row => [row.label, row.value])).toEqual([
            ['Dimensions', '1,000 × 2,000 px'],
            ['Magnification', '40×'],
        ]);
        expect(rows[0].valueTip).toBeUndefined();
    });

    it('returns frozen rows', () => {
        const rows = buildWsiRows(slide, metadata);

        expect(Object.isFrozen(rows)).toBe(true);
        expect(Object.isFrozen(rows[0])).toBe(true);
    });
});

describe('stainValue', () => {
    it.each([
        ['H&E', 'H&E', 'H&E'],
        ['H&E', 'HE', 'H&E'],
        ['IHC', 'IHC', 'IHC'],
        ['Other', 'Other', 'Other'],
        ['IHC', '', 'IHC'],
        ['IHC', 'Ki-67', 'IHC — Ki-67'],
        ['Other', 'Trichrome', 'Other — Trichrome'],
    ])('shows group %s with stain %s as %s', (badge, name, expected) => {
        expect(stainValue(badge, name)).toBe(expected);
    });
});
