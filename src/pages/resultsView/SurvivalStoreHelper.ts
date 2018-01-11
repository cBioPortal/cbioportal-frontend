import { Patient, ClinicalData } from "shared/api/generated/CBioPortalAPI";
import { PatientSurvival } from "../../shared/model/PatientSurvival";

export function getPatientSurvivals(survivalClinicalDataGroupByUniquePatientKey: any, patients: Patient[],
    targetUniquePatientKeys: string[], statusAttributeId: string, monthsAttributeId: string,
    statusFilter: (s: string) => boolean): PatientSurvival[] {

    let patientSurvivals: PatientSurvival[] = [];
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce((patientSurvivals: PatientSurvival[], uniquePatientKey: string) => {
            const clinicalData: ClinicalData[] = survivalClinicalDataGroupByUniquePatientKey[uniquePatientKey];
            if (clinicalData) {
                const statusClinicalData: ClinicalData | undefined = clinicalData.find(c => c.clinicalAttributeId === statusAttributeId);
                const monthsClinicalData: ClinicalData | undefined = clinicalData.find(c => c.clinicalAttributeId === monthsAttributeId);
                if (statusClinicalData && monthsClinicalData && statusClinicalData.value != 'NA' &&
                    monthsClinicalData.value != 'NA' && !Number.isNaN(Number(monthsClinicalData.value))) {
                    const patient: Patient = patients.filter(p => p.uniquePatientKey === uniquePatientKey)[0];
                    patientSurvivals.push({
                        patientId: patient.patientId,
                        studyId: patient.studyId,
                        status: statusFilter(statusClinicalData.value),
                        months: parseFloat(monthsClinicalData.value)
                    });
                }
            }
            return patientSurvivals;
        }, []);
    } else {
        return [];
    }
}
