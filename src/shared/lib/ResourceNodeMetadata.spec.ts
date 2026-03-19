import { assert } from 'chai';
import {
    extractMetadataKeys,
    aggregateMetadataCounts,
} from './ResourceNodeMetadata';
import { ResourceNodeRow } from './ResourceNodeTypes';

const SAMPLE_ROWS: ResourceNodeRow[] = [
    {
        patientId: 'P001',
        sampleId: 'S001',
        resourceId: 'pathology',
        url: 'https://v/1',
        displayName: 'H&E',
        type: 'H_AND_E',
        metadata: { site: 'colon', stain_type: 'H_AND_E' },
    },
    {
        patientId: 'P001',
        sampleId: 'S001',
        resourceId: 'pathology',
        url: 'https://v/2',
        displayName: 'IHC',
        type: 'IHC',
        metadata: { site: 'colon', stain_type: 'IHC', marker: 'CD3' },
    },
    {
        patientId: 'P002',
        sampleId: 'S002',
        resourceId: 'pathology',
        url: 'https://v/3',
        displayName: 'H&E',
        type: 'H_AND_E',
        metadata: { site: 'liver', stain_type: 'H_AND_E' },
    },
];

describe('ResourceNodeMetadata', () => {
    describe('extractMetadataKeys', () => {
        it('returns all unique metadata keys across rows', () => {
            const keys = extractMetadataKeys(SAMPLE_ROWS);
            assert.sameMembers(keys, ['site', 'stain_type', 'marker']);
        });

        it('returns empty array for rows without metadata', () => {
            const rows: ResourceNodeRow[] = [
                {
                    patientId: 'P',
                    sampleId: 'S',
                    resourceId: 'r',
                    url: 'u',
                    displayName: 'x',
                },
            ];
            const keys = extractMetadataKeys(rows);
            assert.deepEqual(keys, []);
        });
    });

    describe('aggregateMetadataCounts', () => {
        it('counts occurrences of each value per key', () => {
            const counts = aggregateMetadataCounts(SAMPLE_ROWS);
            const site = counts.get('site')!;
            assert.equal(site.length, 2);
            assert.deepEqual(
                site.find(v => v.value === 'colon'),
                { value: 'colon', count: 2 }
            );
            assert.deepEqual(
                site.find(v => v.value === 'liver'),
                { value: 'liver', count: 1 }
            );
        });

        it('handles keys present in only some rows', () => {
            const counts = aggregateMetadataCounts(SAMPLE_ROWS);
            const marker = counts.get('marker')!;
            assert.equal(marker.length, 1);
            assert.deepEqual(marker[0], { value: 'CD3', count: 1 });
        });

        it('returns empty map for rows without metadata', () => {
            const rows: ResourceNodeRow[] = [
                {
                    patientId: 'P',
                    sampleId: 'S',
                    resourceId: 'r',
                    url: 'u',
                    displayName: 'x',
                },
            ];
            const counts = aggregateMetadataCounts(rows);
            assert.equal(counts.size, 0);
        });
    });
});
