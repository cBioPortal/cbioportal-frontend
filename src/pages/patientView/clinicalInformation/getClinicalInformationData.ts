import queryString from 'query-string';
import { chain } from 'underscore';
import CBioPortalAPI from "shared/api/CBioPortalAPI";
//import { getTreeNodesFromClinicalData } from './PDXTree';
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
//import sampleQuery from 'shared/api/mock/Samples_query_patient_P04.json';


type TODO = any;

export interface ClinicalDataBySampleId {
    id: string;
    clinicalData: Array<ClinicalData>;
};

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>) {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient.map((x: ClinicalData) => ({ id: x.attrId, clinicalAttribute: x.clinicalAttribute, value: x.attrValue }))
    };

    // group them into dictionary of arrays by sampleid
    // then map that dictionary to an array in which
    // const samples = chain(clinicalDataSample)
    //     .groupBy('id')
    //     .map((v: Array<ClinicalDataSummary> , k: string) => ({
    //         id: k,
    //         clinicalData: v.map((x: TODO) => ({
    //             id: x.attrId,
    //             clinicalAttribute: x.clinicalAttribute,
    //             value: x.attrValue
    //         }))
    //     }))
    //     .value();





    const samples: Array<ClinicalDataBySampleId> = chain(clinicalDataSample)
        .groupBy('id')
        .map((v: Array<ClinicalData> , k: string) => ({
            clinicalData: v,
            id: k,
        }))
        .value();

    // const sampleOrder = samples.map((x: TODO) => x.id).sort();
    //
    // // create object with sample ids as keys and values are objects
    // // that have clinical attribute ids as keys (only PDX_PARENT is
    // // important for the PDX tree)
    // const clinicalDataMap = samples.reduce((map, obj: any) => {
    //     const pdxParent = obj.clinicalData.find((x: TODO) => x.id === 'PDX_PARENT' && x.value !== 'N/A');
    //
    //     if (pdxParent) {
    //         // eslint-disable-next-line
    //         map[obj.id] = { PDX_PARENT: pdxParent.value };
    //     } else {
    //         // eslint-disable-next-line
    //         map[obj.id] = {};
    //     }
    //
    //     return map;
    // }, {});

    const rv = {
        patient,
        samples,
        //nodes: getTreeNodesFromClinicalData(clinicalDataMap, sampleOrder)[0],
    };

    return rv;
}

var tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);


export default function getClinicalInformationData() {
    const promise = new Promise((resolve, reject) => {
        const qs = queryString.parse(location.search);

        if (qs.cancer_study_id && qs.case_id) {
            const studyId: string = qs.cancer_study_id;
            const patientId: string = qs.case_id;

            const samplesOfPatient = tsClient.getAllSamplesOfPatientInStudyUsingGET({
                studyId,
                patientId
            });

            const clinicalDataPatient = tsClient.getAllClinicalDataOfPatientInStudyUsingGET({
                projection: 'DETAILED',
                studyId,
                patientId
            });

            const clinicalDataSample = samplesOfPatient.then(samples =>
                tsClient.fetchClinicalDataUsingPOST({
                    clinicalDataType: 'SAMPLE',
                    identifiers: samples.map(x => (
                    { id: x.stableId, studyId: 'lgg_ucsf_2014' }
                    )),
                    projection: 'DETAILED',
                })
            );

            Promise.all([clinicalDataPatient, clinicalDataSample]).then((result) => {
                resolve(transformClinicalInformationToStoreShape(patientId,
                    studyId,
                    result[0],
                    result[1]));
            }, reject);
        } else {
            reject();
        }
    });

    return promise;
}