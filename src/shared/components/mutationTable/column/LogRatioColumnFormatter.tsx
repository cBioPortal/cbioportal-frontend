import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { formatLogOddsRatio } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class LogRatioColumnFormatter {
    public static getLogRatioData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        return rowData.logRatio;
    }

    public static getLogRatioTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        return formatLogOddsRatio(
            this.getLogRatioData(rowDataByProteinChange, d)
        );
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        let content = (
            <div>{this.getLogRatioTextValue(rowDataByProteinChange, d)}</div>
        );

        return content;
    }
}
