import { ChartMeta, SpecialChartsUniqueKeyEnum } from './StudyViewUtils';

export function doesChartHaveComparisonGroupsLimit(chartMeta: ChartMeta) {
    return chartMeta.uniqueKey !== SpecialChartsUniqueKeyEnum.CANCER_STUDIES;
}
