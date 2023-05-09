import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { ComparisonGroup } from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import _ from 'lodash';
import { getTwoTailedPValue } from 'shared/lib/FisherExactTestCalculator';
import { formatPercentValue } from 'cbioportal-utils';
import intersect from 'fast_array_intersect';
import InfoIcon from 'shared/components/InfoIcon';
import { AlterationOverlapOverlay } from 'shared/components/mutationTable/column/alterationOverlap/AlterationOverlapOverlay';

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    hugoGeneSymbol: string;
    groups: ComparisonGroup[];
    profiledPatientCounts: number[];
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({
        dataStore,
        hugoGeneSymbol,
        groups,
        profiledPatientCounts,
    }: IFisherExactTwoSidedTestLabelProps) => {
        const groupAMutatedCount = _.uniq(
            _.flatten(
                intersect([
                    _.flatten(dataStore.tableData),
                    _.flatten(dataStore.sortedFilteredGroupedData[0].data),
                ])
            ).map(m => m.patientId)
        ).length;

        const groupBMutatedCount = _.uniq(
            _.flatten(
                intersect([
                    _.flatten(dataStore.tableData),
                    _.flatten(dataStore.sortedFilteredGroupedData[1].data),
                ])
            ).map(m => m.patientId)
        ).length;

        const getFisherTestLabel =
            dataStore.sortedFilteredSelectedData.length > 0
                ? 'Fisher Exact Two-Sided Test p-value for selected mutations - '
                : dataStore.sortedFilteredData.length < dataStore.allData.length
                ? 'Fisher Exact Two-Sided Test p-value for filtered mutations - '
                : 'Fisher Exact Two-Sided Test p-value for all mutations - ';

        return (
            <div data-test="fisherTestLabel">
                {getFisherTestLabel}
                {groups[0].nameWithOrdinal}, {`${groupAMutatedCount} patients`}{' '}
                (
                {formatPercentValue(
                    (groupAMutatedCount / profiledPatientCounts[0]) * 100,
                    2
                )}
                %) vs {groups[1].nameWithOrdinal},{' '}
                {`${groupBMutatedCount} patients`} (
                {formatPercentValue(
                    (groupBMutatedCount / profiledPatientCounts[1]) * 100,
                    2
                )}
                %):{' '}
                {toConditionalPrecisionWithMinimum(
                    getTwoTailedPValue(
                        groupAMutatedCount,
                        profiledPatientCounts[0] - groupAMutatedCount,
                        groupBMutatedCount,
                        profiledPatientCounts[1] - groupBMutatedCount
                    ),
                    3,
                    0.01,
                    -10
                )}
                <InfoIcon
                    divStyle={{ display: 'inline-block', marginLeft: 6 }}
                    tooltip={
                        <>
                            <AlterationOverlapOverlay
                                groupAMutatedCount={groupAMutatedCount}
                                groupBMutatedCount={groupBMutatedCount}
                                hugoGeneSymbol={hugoGeneSymbol}
                                profiledPatientCounts={profiledPatientCounts}
                                groups={groups}
                            />
                            <span>
                                {`${
                                    _.filter(
                                        dataStore.tableDataGroupedByPatients,
                                        d => d.length > 1
                                    ).length
                                } ${
                                    _.filter(
                                        dataStore.tableDataGroupedByPatients,
                                        d => d.length > 1
                                    ).length == 1
                                        ? 'patient has'
                                        : 'patients have'
                                } more than one mutation in ${hugoGeneSymbol}`}
                            </span>
                        </>
                    }
                />
            </div>
        );
    }
);
