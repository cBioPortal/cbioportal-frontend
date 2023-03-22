import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { formatLogOddsRatio } from 'shared/lib/FormatUtils';

export default class LogRatioColumnFormatter {
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

    public static getProfiledPatientCountData(
        mutationCountsByProteinChangeForGroup:
            | {
                  [groupIndex: string]: number;
              }
            | undefined,
        groupIndex: number
    ) {
        if (mutationCountsByProteinChangeForGroup) {
            return mutationCountsByProteinChangeForGroup[groupIndex];
        } else {
            return 0;
        }
    }

    public static getLogRatioData(
        mutationCountsByProteinChangeForGroup:
            | ((
                  groupIndex: number
              ) => {
                  [proteinChange: string]: number;
              })
            | undefined,
        profiledPatientCounts: { [groupIndex: number]: number } | undefined,
        data: Mutation[]
    ) {
        const mutatedCount0 = this.getMutatedCountData(
            mutationCountsByProteinChangeForGroup?.(0),
            data
        );
        const profiledPatientCount0 = this.getProfiledPatientCountData(
            profiledPatientCounts,
            0
        );
        const percentage0 = !!mutatedCount0
            ? (mutatedCount0 / profiledPatientCount0) * 100
            : 0;

        const mutatedCount1 = this.getMutatedCountData(
            mutationCountsByProteinChangeForGroup?.(1),
            data
        );
        const profiledPatientCount1 = this.getProfiledPatientCountData(
            profiledPatientCounts,
            1
        );
        const percentage1 = !!mutatedCount1
            ? (mutatedCount1 / profiledPatientCount1) * 100
            : 0;

        const logRatio = Math.log2(percentage0 / percentage1);
        return logRatio;
    }

    public static getLogRatioTextValue(
        mutationCountsByProteinChangeForGroup:
            | ((
                  groupIndex: number
              ) => {
                  [proteinChange: string]: number;
              })
            | undefined,
        profiledPatientCounts: { [groupIndex: number]: number } | undefined,
        data: Mutation[]
    ) {
        return formatLogOddsRatio(
            this.getLogRatioData(
                mutationCountsByProteinChangeForGroup,
                profiledPatientCounts,
                data
            )
        );
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
        data: Mutation[]
    ) {
        let content = (
            <div>
                {this.getLogRatioTextValue(
                    mutationCountsByProteinChangeForGroup,
                    profiledPatientCounts,
                    data
                )}
            </div>
        );

        return content;
    }
}
