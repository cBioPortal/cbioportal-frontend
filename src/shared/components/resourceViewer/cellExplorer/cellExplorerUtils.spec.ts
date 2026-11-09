import { assert } from 'chai';
import {
    colorByFor,
    idMappingFor,
    isCellExplorerResource,
    mappedAttributesFor,
    mappedColumnsFor,
    zarrIdsFor,
} from './cellExplorerUtils';

describe('cellExplorerUtils', () => {
    it('recognizes Cell Explorer resources by their id', () => {
        assert.isTrue(isCellExplorerResource({ resourceId: 'CELL_EXPLORER' }));
        assert.isFalse(isCellExplorerResource({ resourceId: 'HE' }));
    });

    describe('colorByFor', () => {
        it('colors by a category', () => {
            assert.deepEqual(
                colorByFor({ color_by_category: 'author_cell_type' }),
                { type: 'category', value: 'author_cell_type' }
            );
        });

        it('colors by a gene', () => {
            assert.deepEqual(colorByFor({ color_by_gene: 'EPCAM' }), {
                type: 'gene',
                value: 'EPCAM',
            });
        });

        it('prefers the category when both are given', () => {
            assert.equal(
                colorByFor({
                    color_by_category: 'author_cell_type',
                    color_by_gene: 'EPCAM',
                })!.type,
                'category'
            );
        });

        it('leaves the coloring to the viewer otherwise', () => {
            assert.isUndefined(colorByFor({}));
        });
    });

    describe('idMappingFor', () => {
        it('needs a zarr ID column and an attribute', () => {
            assert.isUndefined(idMappingFor({}));
            assert.isUndefined(idMappingFor({ zarr_id_column: 'donor_id' }));
            assert.isUndefined(
                idMappingFor({ cbioportal_patient_id_attribute: 'PATIENT_ID' })
            );
        });

        it('matches patients', () => {
            assert.deepEqual(
                idMappingFor({
                    zarr_id_column: 'donor_id',
                    cbioportal_patient_id_attribute: 'PATIENT_DISPLAY_NAME',
                }),
                {
                    zarrColumn: 'donor_id',
                    level: 'patient',
                    attribute: 'PATIENT_DISPLAY_NAME',
                }
            );
        });

        it('prefers samples when both are given', () => {
            assert.equal(
                idMappingFor({
                    zarr_id_column: 'Sample ID',
                    cbioportal_sample_id_attribute: 'H5AD_SAMPLE_ID',
                    cbioportal_patient_id_attribute: 'PATIENT_ID',
                })!.level,
                'sample'
            );
        });
    });

    describe('zarrIdsFor', () => {
        const selection = [
            { studyId: 's1', sampleId: 'P1-T1', patientId: 'P1' },
            { studyId: 's1', sampleId: 'P1-T2', patientId: 'P1' },
            { studyId: 's1', sampleId: 'P2-T1', patientId: 'P2' },
            { studyId: 's2', sampleId: 'P3-T1', patientId: 'P3' },
        ];

        it('uses the patient IDs of the study, once each', () => {
            assert.deepEqual(
                zarrIdsFor(
                    {
                        zarrColumn: 'donor_id',
                        level: 'patient',
                        attribute: 'PATIENT_ID',
                    },
                    's1',
                    selection
                ),
                ['P1', 'P2']
            );
        });

        it('uses the sample IDs', () => {
            assert.deepEqual(
                zarrIdsFor(
                    {
                        zarrColumn: 'sample',
                        level: 'sample',
                        attribute: 'SAMPLE_ID',
                    },
                    's1',
                    selection
                ),
                ['P1-T1', 'P1-T2', 'P2-T1']
            );
        });

        it('translates through an attribute, leaving out those without a value', () => {
            assert.deepEqual(
                zarrIdsFor(
                    {
                        zarrColumn: 'Sample ID',
                        level: 'sample',
                        attribute: 'H5AD_SAMPLE_ID',
                    },
                    's1',
                    selection,
                    new Map([
                        ['P1-T1', 'KG1P'],
                        ['P2-T1', 'KG2P'],
                    ])
                ),
                ['KG1P', 'KG2P']
            );
        });
    });

    describe('mappedAttributesFor', () => {
        it('splits the comma-separated attributes', () => {
            assert.deepEqual(
                mappedAttributesFor({
                    cbioportal_mapped_attributes: 'STAGE_DX, SEX,',
                }),
                ['STAGE_DX', 'SEX']
            );
            assert.deepEqual(mappedAttributesFor({}), []);
        });
    });

    describe('mappedColumnsFor', () => {
        const sampleType = {
            displayName: 'Sample Type',
            patientAttribute: false,
            data: [
                { sampleId: 'P1-T1', patientId: 'P1', value: 'Primary' },
                { sampleId: 'P1-T2', patientId: 'P1', value: 'Metastasis' },
                { sampleId: 'P2-T1', patientId: 'P2', value: 'Primary' },
            ],
        };
        const stage = {
            displayName: 'Stage',
            patientAttribute: true,
            data: [
                { sampleId: '', patientId: 'P1', value: 'IV' },
                { sampleId: '', patientId: 'P2', value: 'II' },
            ],
        };

        it('maps sample zarr IDs to sample and patient values', () => {
            assert.deepEqual(
                mappedColumnsFor(
                    {
                        zarrColumn: 'Sample ID',
                        level: 'sample',
                        attribute: 'H5AD_SAMPLE_ID',
                    },
                    [
                        { zarrId: 'KG1P', sampleId: 'P1-T1', patientId: 'P1' },
                        { zarrId: 'KG1M', sampleId: 'P1-T2', patientId: 'P1' },
                    ],
                    [sampleType, stage]
                ),
                [
                    {
                        label: 'Sample Type (cBioPortal)',
                        sourceColumn: 'Sample ID',
                        mapping: { KG1P: 'Primary', KG1M: 'Metastasis' },
                    },
                    {
                        label: 'Stage (cBioPortal)',
                        sourceColumn: 'Sample ID',
                        mapping: { KG1P: 'IV', KG1M: 'IV' },
                    },
                ]
            );
        });

        it("joins a patient's sample values", () => {
            assert.deepEqual(
                mappedColumnsFor(
                    {
                        zarrColumn: 'donor_id',
                        level: 'patient',
                        attribute: 'PATIENT_ID',
                    },
                    [
                        { zarrId: 'P1', patientId: 'P1' },
                        { zarrId: 'P2', patientId: 'P2' },
                        { zarrId: 'P3', patientId: 'P3' },
                    ],
                    [sampleType]
                )[0].mapping,
                { P1: 'Metastasis, Primary', P2: 'Primary' }
            );
        });
    });
});
