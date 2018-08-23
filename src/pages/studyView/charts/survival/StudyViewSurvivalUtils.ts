import {PatientSurvival} from "../../../../shared/model/PatientSurvival";
import {IChartContainerProps} from "../ChartContainer";
import {SurvivalAnalysisGroup} from "../../StudyViewPageStore";

export const SELECTED_GROUP_VALUE = "Selected";
export const UNSELECTED_GROUP_VALUE = "Unselected";

export function makeSurvivalChartData(
    selectedPatientSurvivals: ReadonlyArray<PatientSurvival>,
    unselectedPatientSurvivals: ReadonlyArray<PatientSurvival>,
    naCasesHiddenInSurvival: boolean,
    survivalAnalysisSettings?: IChartContainerProps["survivalAnalysisSettings"],
    patientToSurvivalAnalysisGroup?: IChartContainerProps["patientToSurvivalAnalysisGroup"]

) {
    let patientSurvivals:PatientSurvival[] = selectedPatientSurvivals.concat(unselectedPatientSurvivals);

    let patientToAnalysisGroup:{[patientKey:string]:string};
    let analysisGroups:ReadonlyArray<SurvivalAnalysisGroup>;
    if (survivalAnalysisSettings && patientToSurvivalAnalysisGroup) {
        // make data for groups
        patientToAnalysisGroup = patientToSurvivalAnalysisGroup.result!;
        analysisGroups = survivalAnalysisSettings.groups;

        // filter out NA data if necessary
        if (naCasesHiddenInSurvival) {
            patientSurvivals = patientSurvivals.filter(s=>patientToAnalysisGroup[s.uniquePatientKey] !== "NA");
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