import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import {computed, observable} from "../../../../node_modules/mobx/lib/mobx";
import ObservablePromise from "../../../shared/api/ObservablePromise";

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

    @computed get clinicalDataPatient()
    {
        return new ObservablePromise(client.getAllClinicalDataOfPatientInStudyUsingGET({
            projection: 'DETAILED',
            studyId: this.studyId,
            patientId: this.patientId
        }));
    }

    @computed get samplesOfPatient()
    {
        return new ObservablePromise(client.getAllSamplesOfPatientInStudyUsingGET({
            studyId: this.studyId,
            patientId: this.patientId
        }));
    }

    @computed get clinicalDataSample()
    {
        return new ObservablePromise(async () => {
            let samplesOfPatient = await this.samplesOfPatient.promise;
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: 'SAMPLE',
                identifiers: samplesOfPatient.map(sample => ({
                    entityId: sample.sampleId,
                    studyId: this.studyId
                })),
                projection: 'DETAILED',
            });
        });
    }

    @computed get patientViewData()
    {
        //TODO - find a way to prevent then() from occurring after observable was disposed
        return new ObservablePromise(
            Promise.all([
                this.clinicalDataPatient.promise,
                this.clinicalDataSample.promise
            ]).then(
                () => transformClinicalInformationToStoreShape(
                    this.patientId,
                    this.studyId,
                    this.clinicalDataPatient.result || [],
                    this.clinicalDataSample.result || []
                )
            )
        );
    }

}