import * as React from 'react';
import { formatPercentValue } from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';

export default class GroupMutatedCountPercentageColumnFormatter {
    public static sortBy(
        mutationCountsByProteinChangeForGroup:
            | ((
                  groupIndex: number
              ) => {
                  [proteinChange: string]: number;
              })
            | undefined,
        groupIndex: number,
        d: Mutation[]
    ): number | null {
        let ret: number | null = null;
        if (mutationCountsByProteinChangeForGroup) {
            ret = this.getMutatedCountData(
                mutationCountsByProteinChangeForGroup(groupIndex),
                d
            );
        } else {
            ret = null;
        }
        return ret;
    }

    public static getMutatedCountData(
        mutationCountsByProteinChange:
            | {
                  [proteinChange: string]: number;
              }
            | undefined,
        data: Mutation[]
    ) {
        if (
            data.length > 0 &&
            mutationCountsByProteinChange &&
            mutationCountsByProteinChange[data[0].proteinChange]
        ) {
            return mutationCountsByProteinChange[data[0].proteinChange];
        } else {
            return 0;
        }
    }

    public static getGroupMutatedCountPercentageTextValue(
        mutationCountsByProteinChangeForGroup:
            | ((
                  groupIndex: number
              ) => {
                  [proteinChange: string]: number;
              })
            | undefined,
        profiledPatientCounts: { [groupIndex: number]: number } | undefined,
        groupIndex: number,
        data: Mutation[]
    ) {
        const mutatedCount = this.getMutatedCountData(
            mutationCountsByProteinChangeForGroup?.(groupIndex),
            data
        );
        const profiledPatientCount = profiledPatientCounts
            ? profiledPatientCounts[groupIndex]
            : 0;

        const percentage = formatPercentValue(
            (mutatedCount / profiledPatientCount) * 100,
            2
        );

        return `${mutatedCount} (${percentage}%)`;
    }

    public static renderFunction(
        mutationCountsByProteinChangeForGroup:
            | ((
                  groupIndex: number
              ) => {
                  [proteinChange: string]: number;
              })
            | undefined,
        profiledPatientCounts: { [groupIndex: number]: number } | undefined,
        groupIndex: number,
        data: Mutation[]
    ) {
        let content = (
            <div>
                {this.getGroupMutatedCountPercentageTextValue(
                    mutationCountsByProteinChangeForGroup,
                    profiledPatientCounts,
                    groupIndex,
                    data
                )}
            </div>
        );

        return content;
    }
}
