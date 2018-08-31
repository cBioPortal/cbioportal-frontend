import * as ClinicalInformationMutationalSignatureTable from './ClinicalInformationMutationalSignatureTable';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import {prepareMutationalSignatureDataForTable} from "./ClinicalInformationMutationalSignatureTable";

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

describe('ClinicalInformationMutationalSignatureTable', () => {

    before(()=>{

    });
    after(()=>{

    });

    it('takes mutational signature sample data and formats it for mutational signature table to render', ()=>{
        let result = prepareMutationalSignatureDataForTable(sampleMutationalSignatureData);

        assert.deepEqual(result, [
            {mutationalSignatureId: 'firstMutationalSignature',
             sampleValues:{
                "firstSample":{
                    value: 1,
                    confidence: 0.9
                },
                "secondSample": {
                    value: 2,
                    confidence: 0.8
                }
             }
             },
            {mutationalSignatureId: 'secondMutationalSignature',
                sampleValues:{
                    "firstSample":{
                        value: 3,
                        confidence: 0.4
                    }
                }

            }
        ]);
    });
});
