import {
    buildPathRows,
    buildPathRowsReadOnly,
    buildWsiRows,
    buildWsiRowsReadOnly,
    getStainKind,
} from './wsiMetaUtils';
import {
    Sample,
    Slide,
    SlideAssociation,
    TileMetadata,
} from './wsiViewerTypes';

const slide: Slide = {
    image_id: 'slide-1',
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

describe('getStainKind', () => {
    it('prefers resolved flags over conflicting source metadata', () => {
        expect(
            getStainKind({ stain_group: 'IHC', is_hne: true, is_ihc: false })
        ).toBe('hne');
        expect(
            getStainKind({
                stain_group: 'H&E (Initial)',
                is_hne: false,
                is_ihc: true,
            })
        ).toBe('ihc');
    });

    it('keeps explicit Other and unknown metadata distinct', () => {
        expect(
            getStainKind({ slide_type: 'Other', is_hne: false, is_ihc: false })
        ).toBe('other');
        expect(
            getStainKind({ slide_type: 'Unknown', is_hne: false, is_ihc: false })
        ).toBe('unknown');
    });
});

function association(
    matchLevel: SlideAssociation['match_level'],
    specimen: Partial<SlideAssociation> = {}
): SlideAssociation {
    return {
        image_id: slide.image_id,
        sample_id: 'S-1',
        match_level: matchLevel,
        specimen_key: `${matchLevel}::${slide.image_id}`,
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
                block_label: '1',
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

    it('shows the long-form study name while retaining the study link', () => {
        const rows = buildPathRows(
            slide,
            sample,
            'P-1',
            'study_underscore_id',
            association('BLOCK'),
            'Long Form Study Name'
        );

        expect(rows).toContainEqual(
            expect.objectContaining({
                label: 'Study',
                value: 'Long Form Study Name',
                href: '/study/summary?id=study_underscore_id',
            })
        );
    });

    it('reuses the same read-only path rows for the same slide/sample/association context', () => {
        const first = buildPathRowsReadOnly(
            slide,
            sample,
            'P-1',
            'study-1',
            association('BLOCK', {
                part_number: '4',
                block_label: 'A1',
            })
        );
        const second = buildPathRowsReadOnly(
            slide,
            sample,
            'P-1',
            'study-1',
            association('BLOCK', {
                part_number: '4',
                block_label: 'A1',
            })
        );

        expect(second).toBe(first);
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

describe('buildPathRowsReadOnly sample timeline rows', () => {
    const procedureSlide: Slide = {
        ...slide,
        image_id: 'slide-timeline',
        slide_timepoint_days: -242,
        slide_timepoint_source: 'Procedure date',
    };

    function rowValues(rows: ReturnType<typeof buildPathRowsReadOnly>) {
        return rows.map(row => [row.label, row.value]);
    }

    it('shows procedure, acquisition and sequencing days for a matched sample', () => {
        const rows = rowValues(
            buildPathRowsReadOnly(
                { ...procedureSlide },
                sample,
                'P-1',
                undefined,
                undefined,
                undefined,
                { acquisitionDays: -242, sequencingDays: 7 }
            )
        );

        expect(rows).toEqual(
            expect.arrayContaining([
                ['Procedure', 'd-242'],
                ['Acquired', 'd-242'],
                ['Sequenced', 'd+7 (249 d later)'],
            ])
        );
        expect(rows.map(([label]) => label)).not.toContain('Timepoint');
        const labels = rows.map(([label]) => label);
        expect(labels.indexOf('Procedure')).toBeLessThan(
            labels.indexOf('Acquired')
        );
        expect(labels.indexOf('Acquired')).toBeLessThan(
            labels.indexOf('Sequenced')
        );
    });

    it('omits acquisition and sequencing rows when unknown', () => {
        const labels = buildPathRowsReadOnly(
            { ...procedureSlide },
            sample,
            'P-1'
        ).map(row => row.label);

        expect(labels).toContain('Procedure');
        expect(labels).not.toContain('Acquired');
        expect(labels).not.toContain('Sequenced');
    });

    it('shows sequencing without an offset for an undated slide', () => {
        const rows = rowValues(
            buildPathRowsReadOnly(
                { ...slide },
                sample,
                'P-1',
                undefined,
                undefined,
                undefined,
                {
                    sequencingDays: 7,
                }
            )
        );

        expect(rows).toContainEqual(['Sequenced', 'd+7']);
        expect(rows.map(([label]) => label)).not.toContain('Procedure');
    });

    it('keeps the timepoint row for unmatched slides', () => {
        const rows = rowValues(
            buildPathRowsReadOnly(
                { ...procedureSlide },
                { ...sample, sample_id: 'UNMATCHED' },
                'P-1',
                undefined,
                undefined,
                undefined,
                { acquisitionDays: 1, sequencingDays: 7 }
            )
        );

        expect(rows).toContainEqual(['Timepoint', 'Proc d-242']);
        const labels = rows.map(([label]) => label);
        expect(labels).not.toContain('Acquired');
        expect(labels).not.toContain('Sequenced');
    });

    it('rebuilds cached rows when timeline data arrives', () => {
        const cachedSlide = { ...procedureSlide };
        const before = buildPathRowsReadOnly(cachedSlide, sample, 'P-1');
        const after = buildPathRowsReadOnly(
            cachedSlide,
            sample,
            'P-1',
            undefined,
            undefined,
            undefined,
            { sequencingDays: 7 }
        );

        expect(before.map(row => row.label)).not.toContain('Sequenced');
        expect(after.map(row => row.label)).toContain('Sequenced');
    });
});

describe('buildWsiRows', () => {
    it('shows the available image and scanner properties as visible rows', () => {
        expect(buildWsiRows(slide, metadata)).toEqual([
            {
                label: 'Dimensions',
                labelTip: 'Width × height at full resolution',
                value: '1,000 × 2,000 px',
                valueTip: 'About 0.3 × 0.5 mm of glass at 0.2500 µm per pixel',
            },
            {
                label: 'Magnification',
                labelTip: 'Scanner magnification or objective power',
                value: '20x',
                valueTip:
                    'Optical magnification of the scan: 40× is about 0.25 µm per pixel, 20× about 0.5 µm per pixel',
            },
            {
                label: 'MPP',
                labelTip: 'Microns per pixel at full resolution',
                value: '0.2500 µm/px',
                valueTip:
                    'Each pixel spans 0.2500 µm; 1 mm is about 4,000 pixels',
            },
            {
                label: 'Scanner vendor',
                labelTip: 'Scanner manufacturer recorded in the slide file',
                value: 'aperio',
            },
            {
                label: 'Zoom levels',
                labelTip: 'Number of resolution tiers available to the viewer',
                value: '5',
                valueTip:
                    '5 levels, from a whole-slide overview down to full resolution',
            },
            {
                label: 'Tile size',
                labelTip: 'Tile dimensions streamed to the viewer',
                value: '256 px',
                valueTip:
                    'The image is loaded as 256 × 256 px tiles as you pan and zoom',
            },
            {
                label: 'File size',
                labelTip: 'Size of the original scanned slide file',
                value: '95.4 MB',
                valueTip: '100,000,000 bytes',
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
            ['Zoom levels', '5'],
            ['Tile size', '256 px'],
        ]);
    });

    it('returns cloned rows for the same metadata and slide reference', () => {
        const first = buildWsiRows(slide, metadata);
        const second = buildWsiRows(slide, metadata);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('returns cloned rows for an equivalent slide clone with the same metadata', () => {
        const first = buildWsiRows(slide, metadata);
        const second = buildWsiRows({ ...slide }, metadata);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('does not let callers mutate cached sidebar rows', () => {
        const first = buildWsiRows(slide, metadata);
        first[0].value = 'mutated';

        const second = buildWsiRows(slide, metadata);

        expect(second[0].value).toBe('1,000 × 2,000 px');
    });

    it('reuses the same read-only rows for the same metadata and slide reference', () => {
        const first = buildWsiRowsReadOnly(slide, metadata);
        const second = buildWsiRowsReadOnly(slide, metadata);

        expect(second).toBe(first);
    });
});
