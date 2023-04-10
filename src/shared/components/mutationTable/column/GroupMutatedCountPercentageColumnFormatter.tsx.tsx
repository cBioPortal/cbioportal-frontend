import * as React from 'react';
import { formatPercentValue } from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class GroupMutatedCountPercentageColumnFormatter {
    public static getMutatedCountData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        groupIndex: number,
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        return !!!groupIndex
            ? rowData.groupAMutatedCount
            : rowData.groupBMutatedCount;
    }

    public static getGroupMutatedCountPercentageTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        groupIndex: number,
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        const mutatedCount = this.getMutatedCountData(
            rowDataByProteinChange,
            groupIndex,
            d
        );
        const percentage = formatPercentValue(
            !!!groupIndex
                ? rowData.groupAMutatedPercentage
                : rowData.groupBMutatedPercentage,
            2
        );

        return `${mutatedCount} (${percentage}%)`;
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        groupIndex: number,
        d: Mutation[]
    ) {
        let content = (
            <div>
                {this.getGroupMutatedCountPercentageTextValue(
                    rowDataByProteinChange,
                    groupIndex,
                    d
                )}
            </div>
        );

        return content;
    }
}
