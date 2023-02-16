import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import {
    AxisScale,
    groupDataByGroupFilters,
    ProteinImpactTypeBadgeSelector,
} from 'react-mutation-mapper';
import _ from 'lodash';
import { ComparisonGroup } from './GroupComparisonUtils';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'shared/components/mutationMapper/DriverAnnotationProteinImpactTypeBadgeSelector';
import { IAnnotationFilterSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';
import { ProteinImpactType } from 'cbioportal-frontend-commons';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
    axisMode?: AxisScale;
    onScaleToggle?: (selectedScale: AxisScale) => void;
    groups: ComparisonGroup[];
    annotationFilterSettings: IAnnotationFilterSettings;
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

    protected proteinImpactTypeBadgeSelectorForGroup(
        groupIndex: number,
        driversAnnotated: boolean
    ): JSX.Element {
        return (
            <>
                {driversAnnotated ? (
                    <DriverAnnotationProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.mutationCountsByProteinImpactTypeForGroup(
                            groupIndex
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        annotatedProteinImpactTypeFilter={
                            this.annotatedProteinImpactTypeFilter
                        }
                        disableAnnotationSettings={true}
                        excludedProteinTypes={[
                            ProteinImpactType.FUSION,
                            ProteinImpactType.FUSION_PUTATIVE_DRIVER,
                            ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE,
                        ]}
                    />
                ) : (
                    <ProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.mutationCountsByProteinImpactTypeForGroup(
                            groupIndex
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        excludedProteinTypes={[ProteinImpactType.FUSION]}
                    />
                )}
            </>
        );
    }

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null {
        return (
            <div
                style={
                    this.props.isPutativeDriver
                        ? { paddingTop: 5, paddingBottom: 5 }
                        : { paddingTop: 5, paddingBottom: 15 }
                }
            >
                <div>
                    <SettingsMenuButton
                        store={this.props.annotationFilterSettings}
                        disableInfoIcon={true}
                        showOnckbAnnotationControls={true}
                        showFilterControls={false}
                        showExcludeUnprofiledSamplesControl={false}
                        inFilterPanel={true}
                    />
                    Annotation settings
                </div>
                <div
                    style={
                        this.props.isPutativeDriver
                            ? {
                                  paddingTop: 20,
                              }
                            : {
                                  paddingTop: 92,
                              }
                    }
                >
                    {this.proteinImpactTypeBadgeSelectorForGroup(
                        0,
                        !!this.props.isPutativeDriver
                    )}
                    <hr
                        style={
                            this.props.isPutativeDriver
                                ? {
                                      marginTop: 2,
                                      marginBottom: 2,
                                  }
                                : {
                                      marginTop: 15,
                                      marginBottom: 15,
                                  }
                        }
                    ></hr>
                    {this.proteinImpactTypeBadgeSelectorForGroup(
                        1,
                        !!this.props.isPutativeDriver
                    )}
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
