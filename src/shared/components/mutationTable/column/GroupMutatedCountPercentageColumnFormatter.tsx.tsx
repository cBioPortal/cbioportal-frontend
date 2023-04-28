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
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        return groupIndex === 0
            ? rowData.groupAMutatedCount
            : rowData.groupBMutatedCount;
    }

    public static getGroupMutatedCountPercentageTextValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        groupIndex: number,
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        const mutatedCount = this.getMutatedCountData(
            rowDataByProteinChange,
            groupIndex,
            mutations
        );
        const percentage = formatPercentValue(
            groupIndex === 0
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
        mutations: Mutation[]
    ) {
        let content = (
            <span>
                {this.getGroupMutatedCountPercentageTextValue(
                    rowDataByProteinChange,
                    groupIndex,
                    mutations
                )}
            </span>
        );

        return content;
    }
}
