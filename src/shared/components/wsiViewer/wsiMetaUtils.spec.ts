import {
    buildPathRows,
    buildPathRowsReadOnly,
    buildSeqRows,
    buildSeqRowsReadOnly,
    buildWsiRows,
    buildWsiRowsReadOnly,
} from './wsiMetaUtils';
import { Sample, Slide, SlideAssociation, TileMetadata } from './wsiViewerTypes';

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
};

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

describe('buildSeqRows', () => {
    it('returns cloned rows for the same sample and url', () => {
        const enrichedSample = {
            ...sample,
            tumor_purity: '65',
            tmb_score: '7.1',
        } as Sample;

        const first = buildSeqRows(enrichedSample, '/patient?sampleId=S-1');
        const second = buildSeqRows(enrichedSample, '/patient?sampleId=S-1');

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('reuses the same read-only seq rows for the same sample and url', () => {
        const enrichedSample = {
            ...sample,
            tumor_purity: '65',
            tmb_score: '7.1',
        } as Sample;

        const first = buildSeqRowsReadOnly(
            enrichedSample,
            '/patient?sampleId=S-1'
        );
        const second = buildSeqRowsReadOnly(
            enrichedSample,
            '/patient?sampleId=S-1'
        );

        expect(second).toBe(first);
    });
});

describe('buildWsiRows', () => {
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
