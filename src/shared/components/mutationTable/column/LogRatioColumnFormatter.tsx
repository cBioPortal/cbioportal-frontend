import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { formatLogOddsRatio } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class LogRatioColumnFormatter {
    public static getLogRatioData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        return rowData.logRatio;
    }

    public static getLogRatioTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        return formatLogOddsRatio(
            this.getLogRatioData(rowDataByProteinChange, mutations)
        );
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        let content = (
            <span>
                {this.getLogRatioTextValue(rowDataByProteinChange, mutations)}
            </span>
        );

        return content;
    }
}
