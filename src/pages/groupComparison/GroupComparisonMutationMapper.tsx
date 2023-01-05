import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import {
    AxisScale,
    DataFilterType,
    applyDataFilters,
} from 'react-mutation-mapper';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'pages/resultsView/mutation/DriverAnnotationProteinImpactTypeBadgeSelector';
import { ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE } from 'shared/lib/MutationUtils';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
}

@observer
export default class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
    }

    protected get mutationTableComponent() {
        return null;
    }

    protected get plotTopYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotBottomYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotTopYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotBottomYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotYMaxLabelPostfix() {
        return this.props.axisMode === AxisScale.PERCENT ? '%' : '';
    }

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null {
        return (
            <div>
                <div
                    style={{
                        paddingTop: 5,
                        paddingBottom: 5,
                    }}
                >
                    <div style={{ fontWeight: 'bold', paddingBottom: 3 }}>
                        (A){' '}
                        {
                            this.store.dataStore.sortedFilteredGroupedData[0]
                                .group
                        }
                    </div>
                    <DriverAnnotationProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.mutationCountsByProteinImpactTypeForGroup(
                            0
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        onClickSettingMenu={this.props.onClickSettingMenu}
                        annotatedProteinImpactTypeFilter={
                            this.annotatedProteinImpactTypeFilter
                        }
                    />
                    <hr style={{ marginTop: 10, marginBottom: 10 }}></hr>
                    <div style={{ fontWeight: 'bold', paddingBottom: 3 }}>
                        (B){' '}
                        {
                            this.store.dataStore.sortedFilteredGroupedData[1]
                                .group
                        }
                    </div>
                    <DriverAnnotationProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.mutationCountsByProteinImpactTypeForGroup(
                            1
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        onClickSettingMenu={this.props.onClickSettingMenu}
                        annotatedProteinImpactTypeFilter={
                            this.annotatedProteinImpactTypeFilter
                        }
                    />
                </div>
            </div>
        );
    }

    protected mutationsGroupedByProteinImpactTypeForGroup(groupIndex: number) {
        // there are two types of filters (with putative driver, without putative driver)
        const filtersWithoutProteinImpactTypeFilter = this.store.dataStore.dataFilters.filter(
            f =>
                f.type !== DataFilterType.PROTEIN_IMPACT_TYPE &&
                f.type !== ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE
        );

        // apply filters excluding the protein impact type filters
        // this prevents number of unchecked protein impact types from being counted as zero
        let sortedFilteredGroupedData = applyDataFilters(
            this.store.dataStore.sortedFilteredGroupedData[groupIndex].data,
            filtersWithoutProteinImpactTypeFilter,
            this.store.dataStore.applyFilter
        );

        // also apply lazy mobx table search filter
        sortedFilteredGroupedData = sortedFilteredGroupedData.filter(m =>
            (this.store
                .dataStore as MutationMapperDataStore).applyLazyMobXTableFilter(
                m
            )
        );

        return this.groupDataByProteinImpactType(sortedFilteredGroupedData);
    }

    protected mutationCountsByProteinImpactTypeForGroup(
        groupIndex: number
    ): {
        [proteinImpactType: string]: number;
    } {
        const map: { [proteinImpactType: string]: number } = {};

        Object.keys(
            this.mutationsGroupedByProteinImpactTypeForGroup(groupIndex)
        ).forEach(proteinImpactType => {
            const g = this.mutationsGroupedByProteinImpactTypeForGroup(
                groupIndex
            )[proteinImpactType];
            map[g.group] = g.data.length;
        });
        return map;
    }
}
