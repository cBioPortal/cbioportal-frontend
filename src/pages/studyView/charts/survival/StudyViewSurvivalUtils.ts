import { PatientSurvival } from '../../../../shared/model/PatientSurvival';
import { IChartContainerProps } from '../ChartContainer';
import { AnalysisGroup } from '../../StudyViewUtils';
import _ from 'lodash';

export function makeSurvivalChartData(
    patientSurvivals: ReadonlyArray<PatientSurvival>,
    analysisGroups: ReadonlyArray<AnalysisGroup>,
    patientToAnalysisGroup: { [uniquePatientKey: string]: string }
) {
    let patientToAnalysisGroups = _.mapValues(patientToAnalysisGroup, group => [
        group,
    ]);

    return {
        patientToAnalysisGroups,
        patientSurvivals,
        analysisGroups,
    };
}

export function makeScatterPlotData() {}
