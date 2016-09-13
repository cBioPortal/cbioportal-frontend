import cbioportal_client from 'shared/cbioportal-client';

const API_ROOT = "http://www.cbioportal.org/pdx/api"

/*
 * Rename keys in flat dictionary. Keep old keys if not in keyMap.
 */
function renameKeys(dict, keyMap) {
    return _.reduce(dict, function(newDict, val, oldKey) {
        var newKey = keyMap[oldKey]
        if (newKey) {
            newDict[newKey] = val 
        } else {
            newDict[oldKey] = val 
        }
        return newDict
    }, {})
}

/*
 * Return new dict w/o given keys (only works on flat dicts)
 */
function dropKeys(dict, keys) {
    return _.reduce(dict, function(newDict, val, key) {
        if (keys.indexOf(key) === -1) {
            newDict[key] = val
        }
        return newDict
    }, {})
}

/* Return patient data in new API format */
export function getPatient(studyId, patientId) {
    /* Get data from Old API */
    let promise = new Promise((resolve, reject) => {
        let attributeIds = cbioportal_client.getPatientClinicalAttributes({study_id: [studyId], patient_ids: [patientId]})
                .then((responseJson) => {
                    return responseJson.map(a => a.attr_id).sort()
                });
        let clinicalAttributesPerPatient = attributeIds.then((attributeIds) => {
            if (attributeIds.length > 0) {
                // TODO: fetch clinical attributes for a patient and cancer
                // types
                return cbioportal_client.getPatientClinicalData({study_id: [studyId], patient_ids: [patientId], attribute_ids: attributeIds})
                    .then((responseJson) => {
                        if (responseJson.length > 0) {
                            let rv = Object({
                                id: responseJson[0].patient_id,
                                clinicalData: responseJson.map(a => 
                                                  renameKeys(
                                                      dropKeys(a,
                                                               ["study_id", "patient_id"]), 
                                                              {"attr_id":"id", "attr_val":"value"})
                                              )
                            });
                            resolve(rv);
                        } else {
                            resolve([]);
                        }
                    })
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
    let promise = new Promise((resolve, reject) => {
        let sampleIds = cbioportal_client.getSamplesByPatient({study_id: [studyId], patient_ids: [patientId]})
            .then((responseJson) => {
                return responseJson.map(sample => sample.id).sort();
            });
        let attributeIds = sampleIds.then((sampleIds) => {
            return cbioportal_client.getSampleClinicalAttributes({study_id: [studyId], sample_ids: sampleIds})
                .then((responseJson) => {
                    return responseJson.map(a => a.attr_id).sort()
                });
        });
        let clinicalAttributesPerSample = Promise.all([sampleIds, attributeIds]).then((result) => {
            let [sampleIds, attributeIds] = result;

            return cbioportal_client.getSampleClinicalData({study_id: [studyId], attribute_ids: attributeIds, sample_ids: sampleIds})
                .then((responseJson) => {
                    return responseJson;
                })
        });
        let transformToNewAPI = Promise.all([sampleIds, attributeIds, clinicalAttributesPerSample])
            .then((result) => {
                let [sampleIds, attributeIds, clinicalAttributesPerSample] = result;
                let rv = sampleIds.map(s => Object({
                    id: s,
                    clinicalData: 
                        attributeIds.map(a => 
                            renameKeys(
                                dropKeys(
                                    clinicalAttributesPerSample.find(x => x.attr_id === a && x.sample_id === s) || Object({'attr_id': a, 'attr_val': 'N/A'}),
                                    ["sample_id", "study_id"]),
                                    {"attr_id":"id", "attr_val":"value"}
                            )
                        )
                }))
                resolve(rv);
            });
    });
    return promise;
}
