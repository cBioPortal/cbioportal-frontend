import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { ComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
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
        d: Mutation[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        return rowData.enrichedGroup;
    }

    public static getFilterValue(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[],
        filterStringUpper: string
    ): boolean {
        return this.getEnrichedInData(rowDataByProteinChange, d)
            .toUpperCase()
            .includes(filterStringUpper);
    }

    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[],
        groups: ComparisonGroup[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        const nameToGroup = _.keyBy(groups, g => g.name);
        const significant = rowData.qValue < 0.05;
        const groupColor =
            significant && groups
                ? nameToGroup[
                      this.getEnrichedInData(rowDataByProteinChange, d).slice(4)
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
                {this.getEnrichedInData(rowDataByProteinChange, d)}
            </div>
        );

        return content;
    }
}
