import queryString from 'query-string';
import { chain } from 'underscore';

import clientPromise from 'shared/api';
import { getTreeNodesFromClinicalData } from './PDXTree';
import sampleQuery from 'shared/api/mock/Samples_query_patient_P04.json';


/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId, studyId, clinicalDataPatient, clinicalDataSample) {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient.map(x => ({ id: x.attrId, clinicalAttribute: x.clinicalAttribute, value: x.attrValue }))
    };

    const samples = chain(clinicalDataSample)
        .groupBy('id')
        .map((v, k) => ({
            id: k,
            clinicalData: v.map(x => ({
                id: x.attrId,
                clinicalAttribute: x.clinicalAttribute,
                value: x.attrValue
            }))
        }))
        .value();

    const sampleOrder = samples.map(x => x.id).sort();

    // create object with sample ids as keys and values are objects
    // that have clinical attribute ids as keys (only PDX_PARENT is
    // important for the PDX tree)
    const clinicalDataMap = samples.reduce((map, obj) => {
        const pdxParent = obj.clinicalData.find(x => x.id === 'PDX_PARENT' && x.value !== 'N/A');

        if (pdxParent) {
            // eslint-disable-next-line
            map[obj.id] = { PDX_PARENT: pdxParent.value };
        } else {
            // eslint-disable-next-line
            map[obj.id] = {};
        }

        return map;
    }, {});

    const rv = {
        patient,
        samples,
        nodes: getTreeNodesFromClinicalData(clinicalDataMap, sampleOrder)[0],
    };

    return rv;
}


export default function getClinicalInformationData() {
    const promise = new Promise((resolve, reject) => {
        const qs = queryString.parse(location.search);

        if (qs.cancer_study_id && qs.case_id) {
            const studyId = qs.cancer_study_id;
            const patientId = qs.case_id;

            clientPromise.then((client) => {
                const samplesOfPatient = client.Samples.getAllSamplesOfPatientInStudyUsingGET({
                    studyId,
                    patientId
                });
                const clinicalDataPatient = client['Clinical Data'].getAllClinicalDataOfPatientInStudyUsingGET({
                    projection: 'DETAILED',
                    studyId,
                    patientId
                });
                const clinicalDataSample = samplesOfPatient.then(samples =>
                    client['Clinical Data'].fetchClinicalDataUsingPOST({
                        projection: 'DETAILED',
                        clinicalDataType: 'SAMPLE',
                        identifiers: samples.obj.map(x => (
                            { id: x.stableId, studyId: 'lgg_ucsf_2014' }
                        ))
                    })
                );
                Promise.all([clinicalDataPatient, clinicalDataSample]).then((result) => {
                    resolve(transformClinicalInformationToStoreShape(patientId,
                                                                     studyId,
                                                                     result[0].obj,
                                                                     result[1].obj));
                }, reject);
            });
        } else {
            reject();
        }
    });

    return promise;
}
