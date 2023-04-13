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

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    groups: ComparisonGroup[];
    groupToProfiledPatientCounts: {
        [groupUid: string]: number;
    };
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({
        dataStore,
        groups,
        groupToProfiledPatientCounts,
    }: IFisherExactTwoSidedTestLabelProps) => {
        const mutationCountForActiveGeneGroupA = countUniqueMutations(
            _.intersection(
                _.flatten(dataStore.tableData),
                _.flatten(dataStore.sortedFilteredGroupedData[0].data)
            )
        );
        const mutationCountForActiveGeneGroupB = countUniqueMutations(
            _.intersection(
                _.flatten(dataStore.tableData),
                _.flatten(dataStore.sortedFilteredGroupedData[1].data)
            )
        );

        const getFisherTestLabel = () => {
            if (dataStore.sortedFilteredSelectedData.length > 0) {
                return 'Fisher Exact Two-Sided Test p-value for selected mutations - ';
            } else if (
                dataStore.sortedFilteredData.length < dataStore.allData.length
            ) {
                return 'Fisher Exact Two-Sided Test p-value for filtered mutations - ';
            }
            return 'Fisher Exact Two-Sided Test p-value for all mutations - ';
        };

        return (
            <div style={{ fontWeight: 'bold' }}>
                {getFisherTestLabel()}
                {groups[0].nameWithOrdinal}, {mutationCountForActiveGeneGroupA}{' '}
                (
                {formatPercentValue(
                    (mutationCountForActiveGeneGroupA /
                        groupToProfiledPatientCounts[0]) *
                        100,
                    2
                )}
                %) vs {groups[1].nameWithOrdinal},{' '}
                {mutationCountForActiveGeneGroupB} (
                {formatPercentValue(
                    (mutationCountForActiveGeneGroupB /
                        groupToProfiledPatientCounts[1]) *
                        100,
                    2
                )}
                %):{' '}
                {toConditionalPrecisionWithMinimum(
                    getTwoTailedPValue(
                        mutationCountForActiveGeneGroupA,
                        groupToProfiledPatientCounts[0] -
                            mutationCountForActiveGeneGroupA,
                        mutationCountForActiveGeneGroupB,
                        groupToProfiledPatientCounts[1] -
                            mutationCountForActiveGeneGroupB
                    ),
                    3,
                    0.01,
                    -10
                )}
            </div>
        );
    }
);
