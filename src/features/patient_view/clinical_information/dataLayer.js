import * as $ from 'jquery';
import queryString from 'query-string';
import mockData from './mockData';

export default function getClinicalInformationData(){

    let promise = new Promise(function(resolve, reject){

        const QueryString = queryString.parse(location.search);

        //console.log(parsed);




        // if (QueryString.cancer_study_id && QueryString.case_id) {
        //     fetch(`http://localhost:8080/api/samples?study_id=${QueryString.cancer_study_id}&patient_ids=${QueryString.case_id}`)
        //         .then((response) => response.json())
        //         .then((responseJson) => {
        //             let sampleIds = responseJson.map((sample) => { return sample.id }).sort()
        //             fetch(`http://localhost:8080/api/clinicaldata/samples?study_id=${QueryString.cancer_study_id}&attribute_ids=PDX_PARENT&sample_ids=${sampleIds}`)
        //                 .then((response) => response.json())
        //                 .then((responseJson) => {
        //                     let clinicalDataMap = _.zipObject(responseJson.map((x) => { return x.sample_id }),
        //                         responseJson.map((sample) => {
        //                             return {"PDX_PARENT": sample.attr_val}
        //                         })
        //                     )
        //                     // Add samples without a PDX_PARENT
        //                     for (let i=0; i < sampleIds.length; i++) {
        //                         if (!(sampleIds[i] in clinicalDataMap)) {
        //                             clinicalDataMap[sampleIds[i]] = {}
        //                         }
        //                     }
        //                     //store.dispatch({ type: 'ADD_TREE', nodes: getTreeNodesFromClinicalData(clinicalDataMap, sampleIds)[0] })
        //
        //                     resolve({ clinicalDataMap, sampleIds });
        //
        //                 })
        //         })
        // } else {

        resolve(mockData);

        //}

    });


    return promise;

}

