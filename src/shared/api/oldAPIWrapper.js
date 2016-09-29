/* eslint-disable */

import cbioportal_client from 'shared/api/cbioportal-client';
import { renameKeys, dropKeys } from 'shared/lib/ObjectManipulation';

/* Return patient data in new API format */
export function getPatient(studyId, patientId) {
    /* Get data from Old API */
    const promise = new Promise((resolve, reject) => {
        const attributeIds = cbioportal_client.getPatientClinicalAttributes({ study_id: [studyId], patient_ids: [patientId] })
                .then((responseJson) => {
                    return responseJson.map(a => a.attr_id).sort();
                });
        const clinicalAttributesPerPatient = attributeIds.then((attributeIds) => {
            if (attributeIds.length > 0) {
                // TODO: fetch clinical attributes for a patient and cancer
                // types
                return cbioportal_client.getPatientClinicalData({ study_id: [studyId], patient_ids: [patientId], attribute_ids: attributeIds })
                    .then((responseJson) => {
                        if (responseJson.length > 0) {
                            const rv = Object({
                                id: responseJson[0].patient_id,
                                clinicalData: responseJson.map(a =>
                                                  renameKeys(
                                                      dropKeys(a,
                                                               ['study_id', 'patient_id']),
                                                              { 'attr_id': 'id', 'attr_val': 'value' })
                                              ),
                            });
                            resolve(rv);
                        } else {
                            resolve([]);
                        }
                    });
            } else {
                resolve([]);
            }
        });
    });
    return promise;
}

/* Return sample data in new API format */
export function getSamples(studyId, patientId) {
    /* Get data from old API */
    const promise = new Promise((resolve, reject) => {
        const sampleIds = cbioportal_client.getSamplesByPatient({ study_id: [studyId], patient_ids: [patientId] })
            .then((responseJson) => {
                return responseJson.map(sample => sample.id).sort();
            });
        const attributeIds = sampleIds.then((sampleIds) => {
            return cbioportal_client.getSampleClinicalAttributes({ study_id: [studyId], sample_ids: sampleIds })
                .then((responseJson) => {
                    return responseJson.map(a => a.attr_id).sort();
                });
        });
        const clinicalAttributesPerSample = Promise.all([sampleIds, attributeIds]).then((result) => {
            let [sampleIds, attributeIds] = result;

            return cbioportal_client.getSampleClinicalData({ study_id: [studyId], attribute_ids: attributeIds, sample_ids: sampleIds })
                .then((responseJson) => {
                    return responseJson;
                });
        });
        const transformToNewAPI = Promise.all([sampleIds, attributeIds, clinicalAttributesPerSample])
            .then((result) => {
                let [sampleIds, attributeIds, clinicalAttributesPerSample] = result;
                const rv = sampleIds.map(s => Object({
                    id: s,
                    clinicalData:
                        attributeIds.map(a =>
                            renameKeys(
                                dropKeys(
                                    clinicalAttributesPerSample.find(x => x.attr_id === a && x.sample_id === s) || Object({ 'attr_id': a, 'attr_val': 'N/A' }),
                                    ['sample_id', 'study_id']),
                                    { 'attr_id': 'id', 'attr_val': 'value' }
                            )
                        ),
                }));
                resolve(rv);
            });
    });
    return promise;
}
