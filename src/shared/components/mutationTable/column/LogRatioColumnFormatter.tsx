import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { formatLogOddsRatio } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export function getLogRatioData(
    rowDataByProteinChange: {
        [proteinChange: string]: ComparisonMutationsRow;
    },
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    return rowData.logRatio;
}

export function getLogRatioTextValue(
    rowDataByProteinChange: {
        [proteinChange: string]: ComparisonMutationsRow;
    },
    mutations: Mutation[]
) {
    return formatLogOddsRatio(
        getLogRatioData(rowDataByProteinChange, mutations)
    );
}

export function logRatioRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: ComparisonMutationsRow;
    },
    mutations: Mutation[]
) {
    return (
        <span>{getLogRatioTextValue(rowDataByProteinChange, mutations)}</span>
    );
}
