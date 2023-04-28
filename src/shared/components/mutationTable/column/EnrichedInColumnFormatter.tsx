import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    ComparisonGroup,
    SIGNIFICANT_QVALUE_THRESHOLD,
} from 'pages/groupComparison/GroupComparisonUtils';
import styles from 'pages/resultsView/enrichments/styles.module.scss';
import classNames from 'classnames';
import _ from 'lodash';
import { getTextColor } from 'pages/groupComparison/OverlapUtils';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class EnrichedInColumnFormatter {
    public static getEnrichedInData(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        return rowData.enrichedGroup;
    }

    public static getFilterValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[],
        filterStringUpper: string
    ): boolean {
        return this.getEnrichedInData(rowDataByProteinChange, mutations)
            .toUpperCase()
            .includes(filterStringUpper);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        mutations: Mutation[],
        groups: ComparisonGroup[]
    ) {
        const rowData = rowDataByProteinChange[mutations[0].proteinChange];

        const nameToGroup = _.keyBy(groups, g => g.nameWithOrdinal);
        const significant = rowData.qValue < SIGNIFICANT_QVALUE_THRESHOLD;
        const groupColor =
            significant && groups
                ? nameToGroup[
                      this.getEnrichedInData(rowDataByProteinChange, mutations)
                  ].color
                : undefined;
        let content = (
            <div
                className={classNames(styles.Tendency, {
                    [styles.Significant]: significant,
                    [styles.ColoredBackground]: !!groupColor,
                })}
                style={{
                    backgroundColor: groupColor,
                    color: groupColor && getTextColor(groupColor),
                }}
            >
                {this.getEnrichedInData(rowDataByProteinChange, mutations)}
            </div>
        );

        return content;
    }
}
