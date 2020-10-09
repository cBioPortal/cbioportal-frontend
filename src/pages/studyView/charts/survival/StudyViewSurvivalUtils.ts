import { PatientSurvival } from '../../../../shared/model/PatientSurvival';
import { IChartContainerProps } from '../ChartContainer';
import { AnalysisGroup } from '../../StudyViewUtils';
import _ from 'lodash';
import { logRankTest } from 'pages/resultsView/survival/logRankTest';

export function makeSurvivalChartData(
    patientSurvivals: ReadonlyArray<PatientSurvival>,
    analysisGroups: ReadonlyArray<AnalysisGroup>,
    patientToAnalysisGroup: { [uniquePatientKey: string]: string }
) {
    let patientToAnalysisGroups = _.mapValues(patientToAnalysisGroup, group => [
        group,
    ]);

    const groupedSurvivals = _.reduce(
        patientSurvivals,
        (map, nextSurv) => {
            if (nextSurv.uniquePatientKey in patientToAnalysisGroups) {
                // only include this data if theres an analysis group (curve) to put it in
                const groups =
                    patientToAnalysisGroups[nextSurv.uniquePatientKey];
                groups.forEach(group => {
                    map[group] = map[group] || [];
                    map[group].push(nextSurv);
                });
            }
            return map;
        },
        {} as { [groupValue: string]: PatientSurvival[] }
    );

    const sortedGroupedSurvivals = _.mapValues(groupedSurvivals, survivals =>
        survivals.sort((a, b) => a.months - b.months)
    );
    let pValue = null;
    if (analysisGroups.length > 1) {
        pValue = logRankTest(
            ...analysisGroups.map(
                group => sortedGroupedSurvivals[group.value] || []
            )
        );
    }

    return {
        patientToAnalysisGroups,
        analysisGroups,
        sortedGroupedSurvivals,
        pValue,
    };
}

export function makeScatterPlotData() {}
