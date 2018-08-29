import {PatientSurvival} from "../../../../shared/model/PatientSurvival";
import {IChartContainerProps} from "../ChartContainer";
import {SurvivalAnalysisGroup} from "../../StudyViewPageStore";
import _ from "lodash";

export const SELECTED_GROUP_VALUE = "Selected";
export const UNSELECTED_GROUP_VALUE = "Unselected";

export function makeSurvivalChartData(
    selectedPatientSurvivals: ReadonlyArray<PatientSurvival>,
    unselectedPatientSurvivals: ReadonlyArray<PatientSurvival>,
    naPatientsHiddenInSurvival: boolean,
    patientKeysWithNAInSelectedClinicalData?:IChartContainerProps["patientKeysWithNAInSelectedClinicalData"],
    survivalAnalysisSettings?: IChartContainerProps["survivalAnalysisSettings"],
    patientToSurvivalAnalysisGroup?: IChartContainerProps["patientToSurvivalAnalysisGroup"]

) {
    let patientSurvivals:PatientSurvival[] = selectedPatientSurvivals.concat(unselectedPatientSurvivals);

    let patientToAnalysisGroup:{[patientKey:string]:string};
    let analysisGroups:ReadonlyArray<SurvivalAnalysisGroup>;

    let clinicalNAPatientKeysMap:{[patientKey:string]:string} = {};

    if (naPatientsHiddenInSurvival && patientKeysWithNAInSelectedClinicalData && patientKeysWithNAInSelectedClinicalData.isComplete) {
        clinicalNAPatientKeysMap = _.keyBy(patientKeysWithNAInSelectedClinicalData.result);
    }

    if (survivalAnalysisSettings && patientToSurvivalAnalysisGroup) {
        // make data for groups if survival analysis groups given
        patientToAnalysisGroup = patientToSurvivalAnalysisGroup.result!;
        analysisGroups = survivalAnalysisSettings.groups;

        // filter out NA data if necessary
        if (naPatientsHiddenInSurvival) {
            patientSurvivals = patientSurvivals.filter(s=>{
                return (patientToAnalysisGroup[s.uniquePatientKey] !== "NA") && !(s.uniquePatientKey in clinicalNAPatientKeysMap);
            });
        }
    } else {
        // otherwise, make data for selected vs unselected
        patientToAnalysisGroup = {};
        for (const s of selectedPatientSurvivals) {
            patientToAnalysisGroup[s.uniquePatientKey] = SELECTED_GROUP_VALUE;
        }
        for (const s of unselectedPatientSurvivals) {
            patientToAnalysisGroup[s.uniquePatientKey] = UNSELECTED_GROUP_VALUE;
        }
        analysisGroups = [{
            value: SELECTED_GROUP_VALUE,
            color: "red",
            legendText: "Selected patients"
        },{
            value: UNSELECTED_GROUP_VALUE,
            color: "blue",
            legendText: "Unselected patients"
        }];
    }
    return {
        patientToAnalysisGroup, patientSurvivals, analysisGroups
    };
}