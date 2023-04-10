import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import {
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers,
} from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import _ from 'lodash';
import { getTwoTailedPValue } from 'shared/lib/FisherExactTestCalculator';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Sample } from 'cbioportal-ts-api-client';
import { countUniqueMutations } from 'shared/lib/MutationUtils';

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    groups: ComparisonGroup[];
    sampleSet: ComplexKeyMap<Sample>;
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({ dataStore, groups, sampleSet }: IFisherExactTwoSidedTestLabelProps) => {
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
        const sampleIdentifiersForGroupA = getSampleIdentifiers([groups[0]]);
        const patientIdentifiersforGroupA = getPatientIdentifiers(
            sampleIdentifiersForGroupA,
            sampleSet
        );
        const sampleIdentifiersForGroupB = getSampleIdentifiers([groups[1]]);
        const patientIdentifiersforGroupB = getPatientIdentifiers(
            sampleIdentifiersForGroupB,
            sampleSet
        );

        const getFisherTestLabel = () => {
            if (dataStore.sortedFilteredSelectedData.length > 0) {
                return 'Fisher Exact Two-Sided Test p-value for selected mutations: ';
            } else if (
                dataStore.sortedFilteredData.length < dataStore.allData.length
            ) {
                return 'Fisher Exact Two-Sided Test p-value for filtered mutations: ';
            }
            return 'Fisher Exact Two-Sided Test p-value for all mutations: ';
        };

        return (
            <div style={{ fontWeight: 'bold' }}>
                {getFisherTestLabel()}
                {toConditionalPrecisionWithMinimum(
                    getTwoTailedPValue(
                        mutationCountForActiveGeneGroupA,
                        patientIdentifiersforGroupA.length -
                            mutationCountForActiveGeneGroupA,
                        mutationCountForActiveGeneGroupB,
                        patientIdentifiersforGroupB.length -
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
