import { assert } from 'chai';
import {
    colorByFor,
    idMappingFor,
    isCellExplorerResource,
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
});
