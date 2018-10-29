import { assert } from 'chai';
import { getPatientSurvivals } from "./SurvivalStoreHelper";
import { Patient } from "shared/api/generated/CBioPortalAPI";

const exampleClinicalData = {
    "1": [
        {
            "clinicalAttributeId": "OS_MONTHS",
            "value": "0",
            "patientId":"patient_1",
            "studyId":"study_1",
            "uniquePatientKey": "1"
        },
        {
            "clinicalAttributeId": "OS_STATUS",
            "value": "DECEASED",
            "patientId":"patient_1",
            "studyId":"study_1",
            "uniquePatientKey": "1"
        }
    ],
    "2": [
        {
            "clinicalAttributeId": "OS_STATUS",
            "value": "LIVING",
            "patientId":"patient_2",
            "studyId":"study_1",
            "uniquePatientKey": "2"
        }
    ],
    "3": [
        {
            "clinicalAttributeId": "OS_MONTHS",
            "value": "5.23",
            "patientId":"patient_3",
            "studyId":"study_1",
            "uniquePatientKey": "3"
        },
        {
            "clinicalAttributeId": "OS_STATUS",
            "value": "NA",
            "patientId":"patient_3",
            "studyId":"study_1",
            "uniquePatientKey": "3"
        }
    ],
    "4": [
        {
            "clinicalAttributeId": "OS_MONTHS",
            "value": "0.2",
            "patientId":"patient_4",
            "studyId":"study_1",
            "uniquePatientKey": "4"
        },
        {
            "clinicalAttributeId": "OS_STATUS",
            "value": "LIVING",
            "patientId":"patient_4",
            "studyId":"study_1",
            "uniquePatientKey": "4"
        }
    ],
    "5": [
        {
            "clinicalAttributeId": "OS_MONTHS",
            "value": "#VALUE!",
            "patientId":"patient_5",
            "studyId":"study_1",
            "uniquePatientKey": "5"
        },
        {
            "clinicalAttributeId": "OS_STATUS",
            "value": "LIVING",
            "patientId":"patient_5",
            "studyId":"study_1",
            "uniquePatientKey": "5"
        }
    ]
};

const exampleTargetKeys = ["1", "2", "3", "5"];

describe("SurvivalStoreHelper", () => {
    describe("#getPatientSurvivals()", () => {
        it("returns empty list for empty clinical data", () => {
            assert.deepEqual(getPatientSurvivals({}, [], "OS_STATUS", "OS_MONTHS", s => s === 'DECEASED'), []);
        });

        it("returns correct result for example data", () => {
            assert.deepEqual(getPatientSurvivals(exampleClinicalData, exampleTargetKeys,
                 "OS_STATUS", "OS_MONTHS", s => s === 'DECEASED'), [
                    {
                        patientId: "patient_1",
                        uniquePatientKey: "1",
                        studyId: "study_1",
                        months: 0,
                        status: true
                    }
                ]);
        });
    });
});
