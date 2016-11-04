import expect from 'expect';

import exampleState from './mock/exampleState.json';
// get private function using rewire
import { __RewireAPI__ as getClinicalInformationDataModuleRewireAPI } from './getClinicalInformationData';
const transformClinicalInformationToStoreShape = getClinicalInformationDataModuleRewireAPI.__get__('transformClinicalInformationToStoreShape');

import clinicalDataPatient from 'shared/api/mock/ClinicalDataPatient.json';
import clinicalDataSample from 'shared/api/mock/ClinicalDataSample.json';


describe('getClinicalInformationData functions', () => {
    it('should convert clinical data from API to state data', () => {
        const patientId = 'P04';
        const studyId = 'lgg_ucsf_2014';

        const rv = transformClinicalInformationToStoreShape(patientId, studyId, clinicalDataPatient, clinicalDataSample);

        expect(rv.patient.clinicalData).toEqual(exampleState.patient.clinicalData);
        expect(rv.samples[0].clinicalData).toEqual(exampleState.samples[0].clinicalData);
    });
});
