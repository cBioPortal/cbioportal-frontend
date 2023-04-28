import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { ComparisonGroup } from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import _ from 'lodash';
import { getTwoTailedPValue } from 'shared/lib/FisherExactTestCalculator';
import { countUniqueMutations } from 'shared/lib/MutationUtils';
import { formatPercentValue } from 'cbioportal-utils';
import intersect from 'fast_array_intersect';

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    groups: ComparisonGroup[];
    profiledPatientCounts: number[];
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({
        dataStore,
        groups,
        profiledPatientCounts,
    }: IFisherExactTwoSidedTestLabelProps) => {
        const mutationCountForActiveGeneGroupA = countUniqueMutations(
            intersect([
                _.flatten(dataStore.tableData),
                _.flatten(dataStore.sortedFilteredGroupedData[0].data),
            ])
        );
        const mutationCountForActiveGeneGroupB = countUniqueMutations(
            intersect([
                _.flatten(dataStore.tableData),
                _.flatten(dataStore.sortedFilteredGroupedData[1].data),
            ])
        );

        const getFisherTestLabel =
            dataStore.sortedFilteredSelectedData.length > 0
                ? 'Fisher Exact Two-Sided Test p-value for selected mutations - '
                : dataStore.sortedFilteredData.length < dataStore.allData.length
                ? 'Fisher Exact Two-Sided Test p-value for filtered mutations - '
                : 'Fisher Exact Two-Sided Test p-value for all mutations - ';

        return (
            <div>
                <strong>
                    {getFisherTestLabel}
                    {groups[0].nameWithOrdinal},{' '}
                    {mutationCountForActiveGeneGroupA} (
                    {formatPercentValue(
                        (mutationCountForActiveGeneGroupA /
                            profiledPatientCounts[0]) *
                            100,
                        2
                    )}
                    %) vs {groups[1].nameWithOrdinal},{' '}
                    {mutationCountForActiveGeneGroupB} (
                    {formatPercentValue(
                        (mutationCountForActiveGeneGroupB /
                            profiledPatientCounts[1]) *
                            100,
                        2
                    )}
                    %):{' '}
                    {toConditionalPrecisionWithMinimum(
                        getTwoTailedPValue(
                            mutationCountForActiveGeneGroupA,
                            profiledPatientCounts[0] -
                                mutationCountForActiveGeneGroupA,
                            mutationCountForActiveGeneGroupB,
                            profiledPatientCounts[1] -
                                mutationCountForActiveGeneGroupB
                        ),
                        3,
                        0.01,
                        -10
                    )}
                </strong>
            </div>
        );
    }
);
