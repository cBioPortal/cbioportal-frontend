import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import {computed, observable} from "../../../../node_modules/mobx/lib/mobx";
import {remoteData} from "../../../shared/api/remoteData";

export function groupByEntityId(clinicalDataArray: Array<ClinicalData>)
{
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
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>):ClinicalInformationData
{
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };
    const samples = groupByEntityId(clinicalDataSample);
    const rv = {
        patient,
        samples,
    };

    return rv;
}

export class PatientViewPageStore {

    @observable patientId = '';

    @observable studyId = '';

    readonly clinicalDataPatient = remoteData(() => {
        return client.getAllClinicalDataOfPatientInStudyUsingGET({
            projection: 'DETAILED',
            studyId: this.studyId,
            patientId: this.patientId
        });
    }, []);

    readonly samplesOfPatient = remoteData(() => {
        return client.getAllSamplesOfPatientInStudyUsingGET({
            studyId: this.studyId,
            patientId: this.patientId
        });
    }, []);

    readonly clinicalDataSample = remoteData({
        await: () => [
            this.samplesOfPatient
        ],
        invoke: () => client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            identifiers: this.samplesOfPatient.result.map(sample => ({
                entityId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        }),
        default: []
    });

    readonly patientViewData = remoteData({
        await: () => [
            this.clinicalDataPatient,
            this.clinicalDataSample
        ],
        invoke: () => transformClinicalInformationToStoreShape(
            this.patientId,
            this.studyId,
            this.clinicalDataPatient.result,
            this.clinicalDataSample.result
        )
    });
}
