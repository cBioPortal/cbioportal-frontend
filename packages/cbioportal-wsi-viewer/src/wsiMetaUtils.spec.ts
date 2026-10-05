import { buildPathRows, buildWsiRows } from './wsiMetaUtils';
import {
    Sample,
    Slide,
    SlideAssociation,
    TileMetadata,
} from './wsiViewerTypes';

const slide: Slide = {
    slide_key: 'slide-1',
    stain_name: 'H&E',
    stain_group: 'Histology',
    is_hne: true,
    is_ihc: false,
    magnification: '20x',
    file_size_bytes: '100000000',
    can_serve_tiles: true,
    block_label: 'A1',
    block_number: '1',
};

const sample: Sample = {
    sample_id: 'S-1',
    cancer_type: '',
    cancer_type_detailed: '',
    oncotree_code: '',
    primary_site: '',
    sample_type: 'Primary',
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

function association(
    matchLevel: SlideAssociation['match_level'],
    specimen: Partial<SlideAssociation> = {}
): SlideAssociation {
    return {
        slide_key: slide.slide_key,
        sample_id: 'S-1',
        match_level: matchLevel,
        specimen_key: `${matchLevel}::${slide.slide_key}`,
        slide_type: 'H&E',
        can_serve_tiles: true,
        ...specimen,
    };
}

describe('buildPathRows', () => {
    it.each([
        ['BLOCK', 'Block-matched'],
        ['PART', 'Part-matched'],
    ] as const)('shows %s matching as %s', (matchLevel, expectedValue) => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study-1',
            association(matchLevel)
        );

        expect(rows).toContainEqual(
            expect.objectContaining({ label: 'Match', value: expectedValue })
        );
        const match = rows.find(row => row.label === 'Match');
        expect(match?.valueTip).toContain(
            matchLevel === 'BLOCK'
                ? 'same tissue block that was sequenced'
                : 'same specimen part as the sequenced sample'
        );
    });

    it('explains every pathology row with a tooltip', () => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study-1',
            association('BLOCK', {
                part_number: '6',
                part_description: 'Specimen 6',
                block_label: 'Block 1',
            })
        );

        rows.forEach(row => expect(row.labelTip).toBeTruthy());
        expect(rows.find(row => row.label === 'Stain')?.valueTip).toContain(
            'Stain group:'
        );
        expect(rows.find(row => row.label === 'Specimen')?.valueTip).toBe(
            'Cut from block 1 of specimen part 6 (Specimen 6)'
        );
    });

    it('describes the sample by block and type only', () => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study-1',
            association('BLOCK')
        );

        const sampleRow = rows.find(row => row.label === 'Sample');
        expect(sampleRow?.labelTip).toBe(
            'Click for cBioPortal sample view — hover for block/type info'
        );
        expect(sampleRow?.valueTip).toBe('Block: A1\nType: Primary');
        rows.forEach(row => {
            expect(`${row.labelTip} ${row.valueTip} ${row.value}`).not.toMatch(
                /Accession|Barcode|Image ID|slide-1/
            );
        });
    });

    it('does not show a matching row for unmatched slides', () => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study-1',
            association('UNMATCHED')
        );

        expect(rows.some(row => row.label === 'Match')).toBe(false);
    });

    it('uses the timeline specimen format', () => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study-1',
            association('BLOCK', {
                part_number: '4',
                block_label: 'A1',
            })
        );

        expect(rows).toContainEqual(
            expect.objectContaining({
                label: 'Specimen',
                value: 'Part 4 / Block A1',
            })
        );
    });

    it('leaves patient, study and cancer type to the page and Clinical section', () => {
        const labels = buildPathRows(
            slide,
            {
                ...sample,
                cancer_type: 'Melanoma',
                cancer_type_detailed: 'Cutaneous Melanoma',
                oncotree_code: 'SKCM',
                primary_site: 'Skin',
            },
            'P-1',
            'study-1',
            association('BLOCK')
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

    it('hides Path Dx when it duplicates the anatomical site text', () => {
        const rows = buildPathRows(
            {
                ...slide,
                part_description: 'Colon adenocarcinoma',
                path_dx_title: 'COLON ADENOCARCINOMA',
            },
            sample,
            'P-1',
            'study-1',
            association('BLOCK')
        );

        expect(rows).toContainEqual(
            expect.objectContaining({
                label: 'Anatomical site',
                value: 'Colon adenocarcinoma',
            })
        );
        expect(rows.some(row => row.label === 'Path Dx')).toBe(false);
    });
});

describe('buildPathRows timeline row', () => {
    const procedureSlide: Slide = {
        ...slide,
        slide_key: 'slide-timeline',
        slide_timepoint_days: -242,
        slide_timepoint_source: 'Procedure date',
    };

    function timeline(rows: ReturnType<typeof buildPathRows>) {
        return rows.find(row => row.label === 'Timeline')?.value;
    }

    it('shows the procedure day', () => {
        expect(
            timeline(buildPathRows({ ...procedureSlide }, sample, 'P-1'))
        ).toBe('Procedure d-242');
    });

    it('falls back to the sequencing report date', () => {
        expect(
            timeline(
                buildPathRows(
                    { ...slide },
                    { ...sample, sequencing_date: '2021-03-04' },
                    'P-1'
                )
            )
        ).toBe('sequenced 2021-03-04');
    });

    it('has no timeline row without any timing', () => {
        expect(timeline(buildPathRows({ ...slide }, sample, 'P-1'))).toBe(
            undefined
        );
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
