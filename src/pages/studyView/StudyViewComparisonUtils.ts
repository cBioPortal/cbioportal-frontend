import {
    ChartMeta,
    ChartType,
    SpecialChartsUniqueKeyEnum,
} from './StudyViewUtils';
import { SampleIdentifier } from 'cbioportal-ts-api-client';
import { getGroupParameters } from 'pages/groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { LoadingPhase } from 'pages/groupComparison/GroupComparisonLoading';
import comparisonClient from 'shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import { ChartTypeEnum } from 'pages/studyView/StudyViewConfig';
import { getGeneFromUniqueKey } from './TableUtils';

export function doesChartHaveComparisonGroupsLimit(chartMeta: ChartMeta) {
    return chartMeta.uniqueKey !== SpecialChartsUniqueKeyEnum.CANCER_STUDIES;
}

export async function createAlteredGeneComparisonSession<
    D extends SampleIdentifier
>(
    chartMeta: ChartMeta,
    origin: string[],
    alterationsByGene: { [hugoGeneSymbol: string]: D[] },
    statusCallback: (phase: LoadingPhase) => void
) {
    const groups = _.map(alterationsByGene, (data, gene) => {
        const sampleIdentifiers = _.uniqBy(
            data,
            d => `${d.sampleId}_${d.studyId}`
        ).map(d => ({ studyId: d.studyId, sampleId: d.sampleId }));
        return getGroupParameters(gene, sampleIdentifiers, origin);
    });
    statusCallback(LoadingPhase.CREATING_SESSION);
    // create session and get id
    const { id } = await comparisonClient.addComparisonSession({
        groups,
        origin,
        clinicalAttributeName: chartMeta.displayName,
    });
    return id;
}

export function getHugoGeneSymbols(
    chartType: ChartType,
    selectedRowsKeys: string[]
) {
    switch (chartType) {
        case ChartTypeEnum.CNA_GENES_TABLE:
            return _.uniq(selectedRowsKeys.map(getGeneFromUniqueKey));
            break;
        default:
            return selectedRowsKeys;
    }
}
