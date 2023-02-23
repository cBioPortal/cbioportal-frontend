import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import {
    AxisScale,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    groupDataByGroupFilters,
    ProteinImpactTypeBadgeSelector,
} from 'react-mutation-mapper';
import _ from 'lodash';
import { ComparisonGroup } from './GroupComparisonUtils';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'shared/components/mutationMapper/DriverAnnotationProteinImpactTypeBadgeSelector';
import { IAnnotationFilterSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';
import { ProteinImpactWithoutVusMutationType } from 'cbioportal-frontend-commons';
import styles from './styles.module.scss';

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

    protected legendColorCodes = (
        <div style={{ maxWidth: 700, marginTop: 5 }}>
            <strong style={{ color: '#2153AA' }}>Color Codes</strong>
            <p>
                Mutation diagram circles are colored with respect to the
                corresponding mutation types. In case of different mutation
                types at a single position, color of the circle is determined
                with respect to the most frequent mutation type.
            </p>
            <br />
            <div>
                Mutation types and corresponding color codes are as follows:
                <ul>
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseColor,
                            }}
                        >
                            Missense Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseVusColor,
                                }}
                            >
                                Missense Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingColor,
                            }}
                        >
                            Truncating Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                        : Nonsense, Nonstop, Frameshift deletion, Frameshift
                        insertion, Splice site
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingVusColor,
                                }}
                            >
                                Truncating Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                            : Nonsense, Nonstop, Frameshift deletion, Frameshift
                            insertion, Splice site
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeColor,
                            }}
                        >
                            Inframe Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                        : Inframe deletion, Inframe insertion
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeVusColor,
                                }}
                            >
                                Inframe Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                            : Inframe deletion, Inframe insertion
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceColor,
                            }}
                        >
                            Splice Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceVusColor,
                                }}
                            >
                                Splice Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherColor,
                            }}
                        >
                            Other Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                        : All other types of mutations
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherVusColor,
                                }}
                            >
                                Other Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                            : All other types of mutations
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );

    protected get view3dButton(): JSX.Element | null {
        return null;
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
                            ProteinImpactWithoutVusMutationType.FUSION,
                        ]}
                        groupIndex={groupIndex}
                        groupNameWithOrdinal={
                            this.props.groups[groupIndex].nameWithOrdinal
                        }
                    />
                ) : (
                    <ProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.mutationCountsByProteinImpactTypeForGroup(
                            groupIndex
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        excludedProteinTypes={[
                            ProteinImpactWithoutVusMutationType.FUSION,
                        ]}
                        groupIndex={groupIndex}
                        groupNameWithOrdinal={
                            this.props.groups[groupIndex].nameWithOrdinal
                        }
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
            <>
                <div
                    className={styles['settingsMenuButton']}
                    style={
                        this.props.isPutativeDriver
                            ? { position: 'absolute' }
                            : {}
                    }
                >
                    <SettingsMenuButton
                        store={this.props.annotationFilterSettings}
                        disableInfoIcon={true}
                        showOnckbAnnotationControls={true}
                        showFilterControls={false}
                        showExcludeUnprofiledSamplesControl={false}
                        inFilterPanel={true}
                    />
                </div>
                <div
                    style={
                        this.props.isPutativeDriver
                            ? { paddingTop: 5, paddingBottom: 5 }
                            : { paddingTop: 15, paddingBottom: 15 }
                    }
                >
                    <div>
                        {this.proteinImpactTypeBadgeSelectorForGroup(
                            0,
                            !!this.props.isPutativeDriver
                        )}
                        <hr
                            style={
                                this.props.isPutativeDriver
                                    ? {
                                          marginTop: 10,
                                          marginBottom: 10,
                                          height: 1,
                                          backgroundColor: 'black',
                                          border: 'none',
                                          color: 'black',
                                      }
                                    : {
                                          marginTop: 15,
                                          marginBottom: 15,
                                          height: 1,
                                          backgroundColor: 'black',
                                          border: 'none',
                                          color: 'black',
                                      }
                            }
                        ></hr>
                        {this.proteinImpactTypeBadgeSelectorForGroup(
                            1,
                            !!this.props.isPutativeDriver
                        )}
                    </div>
                </div>
            </>
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
