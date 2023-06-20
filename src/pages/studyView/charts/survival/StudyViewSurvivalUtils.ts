import { PatientSurvival } from '../../../../shared/model/PatientSurvival';
import { IChartContainerProps } from '../ChartContainer';
import { AnalysisGroup } from '../../StudyViewUtils';
import _ from 'lodash';
import { logRankTest } from 'pages/resultsView/survival/logRankTest';
import { sortPatientSurvivals } from 'pages/resultsView/survival/SurvivalUtil';

export function makeSurvivalChartData(
    patientSurvivals: ReadonlyArray<PatientSurvival>,
    analysisGroups: ReadonlyArray<AnalysisGroup>,
    patientToAnalysisGroup: {
        [uniquePatientKey: string]: string;
    },
    attributeId: string
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
        sortPatientSurvivals(survivals)
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
        attributeId,
    };
}

export function makeScatterPlotData() {}

export function isSurvivalAttributeId(attributeId: string) {
    return attributeId.includes('_MONTHS') || attributeId.includes('_STATUS');
}

export function isSurvivalChart(chartUniqueKey: string) {
    return chartUniqueKey.includes('_SURVIVAL');
}

export function getAllowedSurvivalClinicalDataFilterId(chartUniqueKey: string) {
    const prefix = chartUniqueKey.substring(
        0,
        chartUniqueKey.indexOf('_SURVIVAL')
    );
    return `${prefix}_MONTHS`;
}

export function getSurvivalChartMetaId(attributeId: string) {
    const survivalClinicalDataType = attributeId.includes('_MONTHS')
        ? '_MONTHS'
        : '_STATUS';
    const prefix = attributeId.substring(
        0,
        attributeId.indexOf(survivalClinicalDataType)
    );
    return `${prefix}_SURVIVAL`;
}
