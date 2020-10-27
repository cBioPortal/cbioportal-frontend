import * as ClinicalInformationMutationalSignatureTable from './ClinicalInformationMutationalSignatureTable';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { prepareMutationalSignatureDataForTable } from './ClinicalInformationMutationalSignatureTable';
import { IMutationalSignature } from 'shared/model/MutationalSignature';

const sampleMutationalSignatureMeta = [
    {
        mutationalSignatureId: 'firstMutationalSignature',
        name: 'Mutational Signature 1',
        description: 'Mutational Signature 1',
        url: 'url 1',
        category: 'category 1',
        confidenceStatement:
            'Signature 1, the aging signature, is detected in this case.',
    },
    {
        mutationalSignatureId: 'secondMutationalSignature',
        name: 'Mutational Signature 2',
        description: 'Mutational Signature 2',
        url: 'url 2',
        category: 'category 2',
        confidenceStatement:
            'Signature 2, the APOBEC signature, is detected in this case.  This signature often coccurs with signature 13, the other APOBEC signature',
    },
];

const sampleMutationalSignatureData = [
    {
        sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        version: 'v2',
        value: 1,
        confidence: 0.9,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[0],
    } as IMutationalSignature,
    {
        sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        version: 'v2',
        value: 2,
        confidence: 0.8,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[0],
    } as IMutationalSignature,
    {
        sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        version: 'v2',
        value: 3,
        confidence: 0.4,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[1],
    } as IMutationalSignature,
];

describe('ClinicalInformationMutationalSignatureTable', () => {
    it('takes mutational signature sample data and formats it for mutational signature table to render', () => {
        let result = prepareMutationalSignatureDataForTable(
            sampleMutationalSignatureData
        );

        assert.deepEqual(result, [
            {
                name: 'Mutational Signature 1',
                sampleValues: {
                    firstSample: {
                        value: 1,
                        confidence: 0.9,
                    },
                    secondSample: {
                        value: 2,
                        confidence: 0.8,
                    },
                },
            },
            {
                name: 'Mutational Signature 2',
                sampleValues: {
                    firstSample: {
                        value: 3,
                        confidence: 0.4,
                    },
                },
            },
        ]);
    });
});
