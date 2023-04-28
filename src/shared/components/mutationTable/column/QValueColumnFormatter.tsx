import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';
import { SIGNIFICANT_QVALUE_THRESHOLD } from 'pages/groupComparison/GroupComparisonUtils';

export default class QValueColumnFormatter {
    public static getQValueData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        return rowData.qValue;
    }

    public static getQValueTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const qValue = this.getQValueData(rowDataByProteinChange, mutations);
        return toConditionalPrecision(qValue, 3, 0.01);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const qValue = this.getQValueData(rowDataByProteinChange, mutations);

        let content = (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight:
                        qValue < SIGNIFICANT_QVALUE_THRESHOLD
                            ? 'bold'
                            : 'normal',
                }}
            >
                {toConditionalPrecisionWithMinimum(qValue, 3, 0.01, -10)}
            </span>
        );

        return content;
    }
}
