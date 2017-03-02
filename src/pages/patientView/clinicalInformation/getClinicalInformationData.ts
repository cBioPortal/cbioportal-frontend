import * as queryString from "query-string";
import * as _ from 'lodash';
import CBioPortalAPI from "../../../shared/api/generated/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {ClinicalData} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
//import { getTreeNodesFromClinicalData, PDXNode } from './PDXTree';
//import sampleQuery from 'shared/api/mock/Samples_query_patient_P04.json';

export function groupByEntityId(clinicalDataArray: Array<ClinicalData>) {

    return _.map(
        _.groupBy(clinicalDataArray, 'entityId'),
        (v:ClinicalData[], k:string):ClinicalDataBySampleId => ({
            clinicalData: v,
            id: k,
        })
    );

}


/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>):ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };

    const samples = groupByEntityId(clinicalDataSample);

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

export default async function getClinicalInformationData():Promise<ClinicalInformationData> {
    const qs = queryString.parse(location.search);

    const studyId = qs['cancer_study_id'] + '';
    const patientId = qs['case_id'] + '';

    if (!studyId || !patientId)
        throw new Error("cancer_study_id and case_id are required page query parameters");

    const clinicalDataPatientPromise = tsClient.getAllClinicalDataOfPatientInStudyUsingGET({
        projection: 'DETAILED',
        studyId,
        patientId
    });

    const samplesOfPatient = await tsClient.getAllSamplesOfPatientInStudyUsingGET({
        studyId,
        patientId
    });

    const clinicalDataSample = await tsClient.fetchClinicalDataUsingPOST({
        clinicalDataType: 'SAMPLE',
        identifiers: samplesOfPatient.map(sample => ({
            entityId: sample.sampleId,
            studyId
        })),
        projection: 'DETAILED',
    });

    return transformClinicalInformationToStoreShape(
        patientId,
        studyId,
        await clinicalDataPatientPromise,
        clinicalDataSample
    );
}
