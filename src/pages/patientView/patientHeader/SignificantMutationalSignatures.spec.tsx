import * as SignificantMutationalSignatures from './SignificantMutationalSignatures';
import {prepareMutationalSignaturesForHeader} from "../../../shared/lib/MutationalSignaturesUtils";
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

const sampleMutationalSignatureData = [
    {sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        value: 1,
        confidence: 0.9,
        numberOfMutationsForSample: 20},
    {sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        value: 2,
        confidence: 0.8,
        numberOfMutationsForSample: 20},
    {sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        value: 3,
        confidence: 0.4,
        numberOfMutationsForSample: 20}
];

const sampleMutationalSignatureMetaData = [
    {
        mutationalSignatureId: "firstMutationalSignature",
        description: "Mutational Signature 1",
        confidenceStatement:  "Signature 1, the aging signature, is detected in this case."
    },
    {
        mutationalSignatureId: "secondMutationalSignature",
        description: "Mutational Signature 2",
        confidenceStatement: "Signature 2, the APOBEC signature, is detected in this case.  This signature often coccurs with signature 13, the other APOBEC signature"
    }
]

describe('SignificantMutationalSignatures', () => {
    it('extracts significant mutational signatures, builds confidence statement, and prepares signatures for ' +
        'header using mutational signature sample data and metadata', ()=>{
        let result = prepareMutationalSignaturesForHeader(sampleMutationalSignatureData, sampleMutationalSignatureMetaData, 'firstSample');

        assert.deepEqual(result, {
                numberOfMutationsForSample: 20,
                confidenceStatement: "Signature 1, the aging signature, is detected in this case.",
                significantSignatures:{
                    "firstMutationalSignature": 1
                }
            }
        );
    });
});