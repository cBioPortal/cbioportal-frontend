/**
 * @jest-environment jsdom
 */
import {
    applyClinicalDataRecords,
    applyCnaData,
    applyMutationData,
} from './wsiHierarchyUpdateUtils';
import { Sample, Slide } from './wsiViewerTypes';

function makeSample(): Sample {
    const slide: Slide = {
        slide_key: 'slide-1',
        stain_name: 'H&E',
        stain_group: 'Histology',
        stain_kind: 'hne',
        magnification: '20x',
        file_size_bytes: '1',
        can_serve_tiles: true,
        block_label: 'A1',
        block_number: '1',
    };
    return {
        sample_id: 'S-1',
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [
            {
                part_number: '1',
                part_type: 'Resection',
                part_description: '',
                subspecialty: '',
                blocks: [
                    { block_number: '1', block_label: 'A1', slides: [slide] },
                ],
            },
        ],
    };
}

describe('wsiHierarchyUpdateUtils', () => {
    it('enriches samples in place and keeps the slide resource identities', () => {
        const sample = makeSample();
        const parts = sample.parts;
        const slide = parts[0].blocks[0].slides[0];

        applyClinicalDataRecords(
            [sample],
            [
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'CANCER_TYPE',
                    value: 'Colorectal Cancer',
                },
            ]
        );
        applyMutationData(
            [sample],
            new Map([['S-1', [{ token: 'KRAS p.G12D', vaf: 0.3 }]]]),
            new Map()
        );
        applyCnaData(
            [sample],
            new Map([['S-1', [{ gene: 'ERBB2', cnaValue: 2 }]]])
        );

        expect(sample.cancer_type).toBe('Colorectal Cancer');
        expect(sample.oncogenic_mutations).toBe('KRAS p.G12D');
        expect(sample.cna_alterations).toEqual([
            { gene: 'ERBB2', cnaValue: 2 },
        ]);
        expect(sample.parts).toBe(parts);
        expect(sample.parts[0].blocks[0].slides[0]).toBe(slide);
        expect(slide.slide_key).toBe('slide-1');
    });
});
