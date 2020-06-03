import { Patient, ClinicalData } from 'cbioportal-ts-api-client';
import { PatientSurvival } from '../../shared/model/PatientSurvival';
import _ from 'lodash';
import { isNullSurvivalClinicalDataValue } from './survival/SurvivalUtil';

export function getPatientSurvivals(
    survivalClinicalDataGroupByUniquePatientKey: {
        [patientKey: string]: ClinicalData[];
    },
    targetUniquePatientKeys: string[],
    statusAttributeId: string,
    monthsAttributeId: string,
    statusFilter: (s: string) => boolean
): PatientSurvival[] {
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce(
            (patientSurvivals: PatientSurvival[], uniquePatientKey: string) => {
                const clinicalData =
                    survivalClinicalDataGroupByUniquePatientKey[
                        uniquePatientKey
                    ];
                if (clinicalData) {
                    const statusClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === statusAttributeId
                    );
                    const monthsClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === monthsAttributeId
                    );
                    if (
                        statusClinicalData &&
                        monthsClinicalData &&
                        !isNullSurvivalClinicalDataValue(
                            statusClinicalData.value
                        ) &&
                        !isNullSurvivalClinicalDataValue(
                            monthsClinicalData.value
                        ) &&
                        !Number.isNaN(Number(monthsClinicalData.value))
                    ) {
                        patientSurvivals.push({
                            uniquePatientKey,
                            patientId: clinicalData[0].patientId,
                            studyId: clinicalData[0].studyId,
                            status: statusFilter(statusClinicalData.value),
                            months: parseFloat(monthsClinicalData.value),
                        });
                    }
                }
                return patientSurvivals;
            },
            []
        );
    } else {
        return [];
    }
}

export function getClinicalDataOfPatientSurvivalStatus(
    survivalClinicalDataGroupByUniquePatientKey: {
        [patientKey: string]: ClinicalData[];
    },
    targetUniquePatientKeys: string[],
    statusAttributeId: string,
    monthsAttributeId: string
): ClinicalData[] {
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce(
            (
                patientSurvivalStatusData: ClinicalData[],
                uniquePatientKey: string
            ) => {
                const clinicalData =
                    survivalClinicalDataGroupByUniquePatientKey[
                        uniquePatientKey
                    ];
                if (clinicalData) {
                    const statusClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === statusAttributeId
                    );
                    const monthsClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === monthsAttributeId
                    );
                    if (
                        statusClinicalData &&
                        monthsClinicalData &&
                        !isNullSurvivalClinicalDataValue(
                            statusClinicalData.value
                        ) &&
                        !isNullSurvivalClinicalDataValue(
                            monthsClinicalData.value
                        ) &&
                        !Number.isNaN(Number(monthsClinicalData.value))
                    ) {
                        patientSurvivalStatusData.push(statusClinicalData);
                    }
                }
                return patientSurvivalStatusData;
            },
            []
        );
    } else {
        return [];
    }
}
