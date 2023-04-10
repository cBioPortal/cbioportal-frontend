import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class QValueColumnFormatter {
    public static getQValueData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        return rowData.qValue;
    }

    public static getQValueTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const qValue = this.getQValueData(rowDataByProteinChange, d);
        return toConditionalPrecision(qValue, 3, 0.01);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const qValue = this.getQValueData(rowDataByProteinChange, d);

        let content = (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight: qValue < 0.05 ? 'bold' : 'normal',
                }}
            >
                {toConditionalPrecisionWithMinimum(qValue, 3, 0.01, -10)}
            </span>
        );

        return content;
    }
}
