import queryString from 'query-string';
import { mockData } from './mockData';
import { zipObject } from 'lodash';
import { getSamples, getPatient } from 'shared/api/oldAPIWrapper';
import { getTreeNodesFromClinicalData } from './PDXTree';


export default function getClinicalInformationData() {
    const promise = new Promise((resolve, reject) => {
        const qs = queryString.parse(location.search);

        if (qs.cancer_study_id && qs.case_id) {
            const cancerStudyId = qs.cancer_study_id;
            const caseId = qs.case_id;

            Promise.all([mockData, getSamples(cancerStudyId, caseId), getPatient(cancerStudyId, caseId)]).then(result => {
                let [mockData, samples, patient] = result;

                const sampleOrder = samples.map(x => x.id).sort();

                // create object with sample ids as keys and values are objects
                // that have clinical attribute ids as keys (only PDX_PARENT is
                // important for the PDX tree)
                const clinicalDataMap = samples.reduce((map, obj) => {
                    const pdx_parent = obj.clinicalData.find(x => x.id === 'PDX_PARENT' && x.value !== 'N/A');

                    if (pdx_parent) {
                        map[obj.id] = { 'PDX_PARENT': pdx_parent.value };
                    } else {
                        map[obj.id] = {};
                    }

                    return map;
                }, {});


                const rv = {
                    patient,
                    samples,
                    nodes: getTreeNodesFromClinicalData(clinicalDataMap, sampleOrder)[0],
                };
                resolve(rv);
            });
        } else {
            return resolve(mockData);
        }
    });


    return promise;
}

