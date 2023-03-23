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
    groupDataByGroupFilters,
    onFilterOptionSelect,
    ProteinImpactTypeBadgeSelector,
} from 'react-mutation-mapper';
import _ from 'lodash';
import { ComparisonGroup } from './GroupComparisonUtils';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'shared/components/mutationMapper/DriverAnnotationProteinImpactTypeBadgeSelector';
import { IAnnotationFilterSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';
import styles from './styles.module.scss';
import { LegendColorCodes } from 'shared/components/mutationMapper/LegendColorCodes';
import { ProteinImpactWithoutVusMutationType } from 'cbioportal-frontend-commons';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import GroupComparisonMutationTable from './GroupComparisonMutationTable';
import MutationMapperDataStore, {
    MUTATION_STATUS_FILTER_ID,
} from 'shared/components/mutationMapper/MutationMapperDataStore';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import autobind from 'autobind-decorator';
import { Sample } from 'cbioportal-ts-api-client';
import { FisherExactTwoSidedTestLabel } from './FisherExactTwoSidedTestLabel';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
    axisMode?: AxisScale;
    onScaleToggle?: (selectedScale: AxisScale) => void;
    groups: ComparisonGroup[];
    annotationFilterSettings: IAnnotationFilterSettings;
    groupToProfiledPatients: {
        [groupUid: string]: string[];
    };
    samples?: Sample[];
}

@observer
export default class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
    }

    protected legendColorCodes = (
        <LegendColorCodes
            isPutativeDriver={this.props.isPutativeDriver}
            hideFusions={true}
        />
    );

    protected get view3dButton(): JSX.Element | null {
        return null;
    }

    protected getTableData = () => {
        let dataStore = this.props.store.dataStore as MutationMapperDataStore;
        if (dataStore.sortedFilteredSelectedData.length) {
            return _.values(
                _.groupBy(
                    _.flatten(dataStore.sortedFilteredSelectedData),
                    d => d.proteinChange
                )
            );
        } else {
            return _.values(
                _.groupBy(
                    _.flatten(dataStore.sortedFilteredData),
                    d => d.proteinChange
                )
            );
        }
    };

    protected formatPaginationStatusText = (text: string) => {
        let dataStore = this.props.store.dataStore as MutationMapperDataStore;
        const mutationsLabel =
            _.flatten(dataStore.tableData).length === 1
                ? 'Mutation'
                : 'Mutations';

        return text.includes('Mutations')
            ? text.replace(
                  'Mutations',
                  `Protein Changes with ${mutationsLabel}`
              )
            : text.replace('Mutation', `Protein Change with ${mutationsLabel}`);
    };

    protected get mutationTableComponent() {
        let dataStore = this.props.store.dataStore as MutationMapperDataStore;
        dataStore.setTableData(this.getTableData);
        return (
            <GroupComparisonMutationTable
                uniqueSampleKeyToTumorType={
                    this.props.store.uniqueSampleKeyToTumorType
                }
                oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                pubMedCache={this.props.pubMedCache}
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                dataStore={dataStore}
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.store.downloadDataFetcher}
                myCancerGenomeData={this.props.store.myCancerGenomeData}
                hotspotData={this.props.store.indexedHotspotData}
                indexedVariantAnnotations={
                    this.props.store.indexedVariantAnnotations
                }
                indexedMyVariantInfoAnnotations={
                    this.props.store.indexedMyVariantInfoAnnotations
                }
                oncoKbData={this.props.store.oncoKbData}
                usingPublicOncoKbInstance={
                    this.props.store.usingPublicOncoKbInstance
                }
                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                onOncoKbIconToggle={this.props.onOncoKbIconToggle}
                civicGenes={this.props.store.civicGenes}
                civicVariants={this.props.store.civicVariants}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableGenomeNexus}
                enableHotspot={this.props.enableHotspot}
                enableMyCancerGenome={this.props.enableMyCancerGenome}
                enableCivic={this.props.enableCivic}
                generateGenomeNexusHgvsgUrl={
                    this.props.generateGenomeNexusHgvsgUrl
                }
                isCanonicalTranscript={this.props.store.isCanonicalTranscript}
                selectedTranscriptId={this.props.store.activeTranscript.result}
                columnVisibility={this.props.columnVisibility}
                storeColumnVisibility={this.props.storeColumnVisibility}
                namespaceColumns={this.props.store.namespaceColumnConfig}
                columns={this.columns}
                mutationCountsByProteinChangeForGroup={
                    this.mutationCountsByProteinChangeForGroup
                }
                profiledPatientCountsByGroup={this.profiledPatientCountsByGroup}
                groups={this.props.groups}
                formatPaginationStatusText={this.formatPaginationStatusText}
                showTotalMutationCountsInCountHeader={true}
            />
        );
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.props.store.namespaceColumnConfig
        );
        return _.concat(
            GroupComparisonMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
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
                        height={148}
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
                        height={108}
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
                    className={styles.settingsMenuButton}
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

    @autobind
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

    @autobind
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

    @action.bound
    protected onMutationStatusSelect(
        selectedMutationStatusIds: string[],
        allValuesSelected: boolean
    ) {
        onFilterOptionSelect(
            selectedMutationStatusIds,
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.MUTATION_STATUS,
            MUTATION_STATUS_FILTER_ID
        );
    }

    @computed get mutationStatusFilter() {
        return this.store.dataStore.dataFilters.find(
            f => f.id === MUTATION_STATUS_FILTER_ID
        );
    }

    @autobind
    protected mutationsGroupedByProteinChangeForGroup(groupIndex: number) {
        let sortedFilteredGroupedData = this
            .sortedFilteredDataWithoutProteinImpactTypeFilter;

        // group the filtered data by comparison group
        sortedFilteredGroupedData = groupDataByGroupFilters(
            this.store.dataStore.groupFilters,
            sortedFilteredGroupedData,
            this.store.dataStore.applyFilter
        );

        let proteinChanges = _(sortedFilteredGroupedData[groupIndex].data)
            .map((d: { proteinChange: any }[]) => d[0].proteinChange)
            .uniq()
            .value();

        const filters = proteinChanges.map(value => ({
            group: value,
            filter: {
                type: DataFilterType.PROTEIN_CHANGE,
                values: [value],
            },
        }));

        let groupedData = groupDataByGroupFilters(
            filters,
            sortedFilteredGroupedData[groupIndex].data,
            this.store.dataStore.applyFilter
        );

        return _.keyBy(groupedData, d => d.group);
    }

    @autobind
    protected mutationCountsByProteinChangeForGroup(
        groupIndex: number
    ): {
        [proteinChange: string]: number;
    } {
        const map: { [proteinChange: string]: number } = {};

        _.forIn(
            this.mutationsGroupedByProteinChangeForGroup(groupIndex),
            (v, k) => {
                const uniqueMutations = _.uniqBy(v.data, d => d[0].patientId);
                map[v.group] = uniqueMutations.length;
            }
        );

        return map;
    }

    @computed get profiledPatientCountsByGroup(): {
        [groupIndex: number]: number;
    } {
        const map: { [groupIndex: string]: number } = {};
        _.forIn(this.props.groupToProfiledPatients, (p, i) => {
            map[Object.keys(this.props.groupToProfiledPatients).indexOf(i)] =
                p.length;
        });
        return map;
    }

    protected get fisherExactTwoSidedTestLabel(): JSX.Element | null {
        return (
            <FisherExactTwoSidedTestLabel
                dataStore={
                    this.props.store.dataStore as MutationMapperDataStore
                }
                groups={this.props.groups}
                maxSize={1000}
            />
        );
    }
}
