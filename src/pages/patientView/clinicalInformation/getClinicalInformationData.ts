import queryString from "query-string";
import {chain} from "underscore";
import CBioPortalAPI from "shared/api/CBioPortalAPI";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "./Connector";
//import { getTreeNodesFromClinicalData, PDXNode } from './PDXTree';
//import sampleQuery from 'shared/api/mock/Samples_query_patient_P04.json';

export type ClinicalDataBySampleId = {
    id: string;
    clinicalData: Array<ClinicalData>;
};

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>):ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };

    const samples: Array<ClinicalDataBySampleId> = chain(clinicalDataSample)
        .groupBy('id')
        .map((v, k) => ({
            clinicalData: v,
            id: k + '',
        }))
        .value();

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

const tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

export default function getClinicalInformationData():Promise<ClinicalInformationData> {
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