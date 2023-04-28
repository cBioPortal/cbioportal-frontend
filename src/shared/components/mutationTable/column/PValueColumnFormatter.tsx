import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';
import { SIGNIFICANT_QVALUE_THRESHOLD } from 'pages/groupComparison/GroupComparisonUtils';

export default class PValueColumnFormatter {
    public static getPValueData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        return rowData.pValue;
    }

    public static getPValueTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const pValue = this.getPValueData(rowDataByProteinChange, mutations);
        return toConditionalPrecision(pValue, 3, 0.01);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const pValue = this.getPValueData(rowDataByProteinChange, mutations);

        let content = (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight:
                        rowDataByProteinChange[mutations[0].proteinChange]
                            .qValue < SIGNIFICANT_QVALUE_THRESHOLD
                            ? 'bold'
                            : 'normal',
                }}
            >
                {toConditionalPrecisionWithMinimum(pValue, 3, 0.01, -10)}
            </span>
        );

        return content;
    }
}
