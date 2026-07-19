import { assert } from 'chai';
import sinon from 'sinon';
import SampleManager from './SampleManager';
import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import {
    checkNonProfiledGenesExist,
    createMutationalCountsObjects,
    getSamplesProfiledStatus,
    retrieveMutationalSignatureMap,
} from './PatientViewPageUtils';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import * as sampleProfiledUtils from 'shared/lib/isSampleProfiled';

describe('PatientViewPageUtils', () => {
    describe('checkNonProfiledGenesExist()', () => {
        const sampleIds = ['sampleA', 'sampleB'];
        const entrezGeneIds = [1, 2, 3];

        const stub = sinon.stub(
            TumorColumnFormatter,
            'getProfiledSamplesForGene'
        );

        afterAll(() => {
            stub.restore();
        });

        it('returns false when all samples have been profiled', () => {
            const allSamplesProfiled = {
                sampleA: true,
                sampleB: true,
            };

            stub.returns(allSamplesProfiled);
            assert.isFalse(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });

        it('returns true when a sample has not been not profiled', () => {
            const oneSampleNotProfiled = {
                sampleA: true,
                sampleB: false,
            };

            stub.returns(oneSampleNotProfiled);
            assert.isTrue(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });
    });

    describe('retrieveMutationalSignatureMap()', () => {
        it('returns true if result is equal to the ground truth output', () => {
            const genericAssayMetaData = [
                {
                    entityType: 'GENERIC_ASSAY',
                    genericEntityMetaProperties: { NAME: '1:Del:C:0' },
                    stableId: 'mutational_signatures_matrix_1_Del_C_0',
                },
                {
                    entityType: 'GENERIC_ASSAY',
                    genericEntityMetaProperties: { NAME: '1:Del:C:1' },
                    stableId: 'mutational_signatures_matrix_1_Del_C_1',
                },
            ];

            const output = [
                {
                    name: '1:Del:C:0',
                    signatureClass: '',
                    signatureLabel: '',
                    stableId: 'mutational_signatures_matrix_1_Del_C_0',
                },
                {
                    name: '1:Del:C:1',
                    signatureClass: '',
                    signatureLabel: '',
                    stableId: 'mutational_signatures_matrix_1_Del_C_1',
                },
            ];

            const result = retrieveMutationalSignatureMap(genericAssayMetaData);
            assert.deepEqual(result, output);
        });
    });

    describe('getSamplesProfiledStatus()', () => {
        it('collects non-profiled sample ids and boolean flags', () => {
            const stub = sinon.stub(
                sampleProfiledUtils,
                'isSampleProfiledInProfile'
            );
            stub.onCall(0).returns(true);
            stub.onCall(1).returns(false);
            stub.onCall(2).returns(false);

            const result = getSamplesProfiledStatus(
                ['S-1', 'S-2', 'S-3'],
                {} as any,
                'profile'
            );

            assert.deepEqual(result, {
                noneProfiled: false,
                someProfiled: true,
                notProfiledIds: ['S-2', 'S-3'],
            });

            stub.restore();
        });
    });

    describe('createMutationalCountsObjects()', () => {
        it('uses the mapped signature label when available and falls back to the stable id suffix', () => {
            const result = createMutationalCountsObjects(
                [
                    {
                        patientId: 'P-1',
                        sampleId: 'S-1',
                        studyId: 'study',
                        uniquePatientKey: 'patient-key',
                        uniqueSampleKey: 'sample-key-1',
                        molecularProfileId:
                            'mutational_signatures_profile_v3.4',
                        value: '1.5',
                        stableId: 'mutational_signatures_matrix_sig_a',
                    },
                    {
                        patientId: 'P-1',
                        sampleId: 'S-2',
                        studyId: 'study',
                        uniquePatientKey: 'patient-key',
                        uniqueSampleKey: 'sample-key-2',
                        molecularProfileId:
                            'mutational_signatures_profile_v3.4',
                        value: '2.5',
                        stableId: 'mutational_signatures_matrix_sig_b',
                    },
                ],
                [
                    {
                        stableId: 'mutational_signatures_matrix_sig_a',
                        signatureLabel: '',
                        signatureClass: '',
                        name: 'Signature A',
                    },
                ]
            );

            assert.deepEqual(result, [
                {
                    patientId: 'P-1',
                    sampleId: 'S-1',
                    studyId: 'study',
                    uniquePatientKey: 'patient-key',
                    uniqueSampleKey: 'sample-key-1',
                    version: 'v3.4',
                    value: 1.5,
                    mutationalSignatureLabel: 'Signature A',
                },
                {
                    patientId: 'P-1',
                    sampleId: 'S-2',
                    studyId: 'study',
                    uniquePatientKey: 'patient-key',
                    uniqueSampleKey: 'sample-key-2',
                    version: 'v3.4',
                    value: 2.5,
                    mutationalSignatureLabel: 'sig_b',
                },
            ]);
        });
    });
});
