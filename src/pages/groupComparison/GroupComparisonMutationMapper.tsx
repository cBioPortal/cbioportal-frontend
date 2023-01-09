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
    groupDataByGroupFilters,
} from 'react-mutation-mapper';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'pages/resultsView/mutation/DriverAnnotationProteinImpactTypeBadgeSelector';
import { ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE } from 'shared/lib/MutationUtils';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import _ from 'lodash';

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
        let sortedFilteredGroupedData = this
            .sortedFilteredDataWithoutProteinImpactTypeFilter;

        // group the filtered data by comparison group
        sortedFilteredGroupedData = groupDataByGroupFilters(
            this.store.dataStore.groupFilters,
            sortedFilteredGroupedData,
            this.store.dataStore.applyFilter
        );

        return this.groupDataByProteinImpactType(
            sortedFilteredGroupedData[groupIndex].data
        );
    }

    protected mutationCountsByProteinImpactTypeForGroup(
        groupIndex: number
    ): {
        [proteinImpactType: string]: number;
    } {
        const map: { [proteinImpactType: string]: number } = {};

        _.forIn(
            this.mutationsGroupedByProteinImpactTypeForGroup(groupIndex),
            (v, k) => {
                map[v.group] = v.data.length;
            }
        );
        return map;
    }
}
