import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class PValueColumnFormatter {
    public static getPValueData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        return rowData.pValue;
    }

    public static getPValueTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const pValue = this.getPValueData(rowDataByProteinChange, d);
        return toConditionalPrecision(pValue, 3, 0.01);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[]
    ) {
        const pValue = this.getPValueData(rowDataByProteinChange, d);

        let content = (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight:
                        rowDataByProteinChange[d[0].proteinChange].qValue < 0.05
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
