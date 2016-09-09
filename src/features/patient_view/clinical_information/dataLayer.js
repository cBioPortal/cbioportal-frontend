import * as $ from 'jquery';
import queryString from 'query-string';
import { mockData } from './mockData';
import { zipObject } from 'lodash';
import { getSamples, getPatient } from 'shared/oldAPIWrapper'
import { getTreeNodesFromClinicalData } from './PDXTree'


export default function getClinicalInformationData() {
    let promise = new Promise(function(resolve, reject){

        const qs = queryString.parse(location.search);

        if (qs.cancer_study_id && qs.case_id) {
            let cancerStudyId = qs.cancer_study_id;
            let caseId = qs.case_id;

                Promise.all([mockData, getSamples(cancerStudyId, caseId), getPatient(cancerStudyId, caseId)]).then(result => {
                let [mockData, samples, patient] = result;

                let sampleOrder = samples.map(x => x.id).sort()

                // create object with sample ids as keys and values are objects
                // that have clinical attribute ids as keys (only PDX_PARENT is
                // important for the PDX tree)
                let clinicalDataMap = samples.reduce((map, obj) => {
                    let pdx_parent = obj.clinicalData.find(x => x.id === "PDX_PARENT" && x.value !== "N/A");

                    if (pdx_parent) { 
                        map[obj.id] = {"PDX_PARENT": pdx_parent.value}; 
                    } else { 
                        map[obj.id] = {}
                    }

                    return map;
                }, {})


                let rv = {
                    patient: patient,
                    samples: samples,
                    nodes: getTreeNodesFromClinicalData(clinicalDataMap, sampleOrder)[0]
                }
                resolve(rv);
            });
        } else {
            return resolve(mockData);
        }
    });


    return promise;

}

