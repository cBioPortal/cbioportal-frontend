import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import styles from "./styles.module.scss";
import {ClinicalDataFilterValue, CopyNumberGeneFilterElement} from 'shared/api/generated/CBioPortalAPIInternal';
import {UniqueKey, DataType} from 'pages/studyView/StudyViewUtils';
import {
    ChartMeta,
    getCNAColorByAlteration, getPatientIdentifiers,
    getSelectedGroupNames,
    intervalFiltersDisplayValue, StudyViewFilterWithSampleIdentifierFilters
} from 'pages/studyView/StudyViewUtils';
import {PillTag} from "../../shared/components/PillTag/PillTag";
import {GroupLogic} from "./filters/groupLogic/GroupLogic";
import classnames from 'classnames';
import {STUDY_VIEW_CONFIG} from "./StudyViewConfig";
import {DEFAULT_NA_COLOR, MUT_COLOR_FUSION, MUT_COLOR_MISSENSE} from "shared/lib/Colors";
import {
    caseCounts,
    getSampleIdentifiers,
    StudyViewComparisonGroup
} from "../groupComparison/GroupComparisonUtils";

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    customChartsFilter: {[key:string]:string[]};
    numberOfSelectedSamplesInCustomSelection: number;
    comparisonGroupSelection:StudyViewComparisonGroup[];
    attributesMetaSet: { [id: string]: ChartMeta };
    updateClinicalDataFilterByValues: (chartMeta: ChartMeta, values: ClinicalDataFilterValue[]) => void;
    updateCustomChartFilter: (chartMeta: ChartMeta, values: string[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    removeMutatedGeneFilter: (hugoGeneSymbol: string) => void;
    removeFusionGeneFilter: (hugoGeneSymbol: string) => void;
    removeCNAGeneFilter: (filter: CopyNumberGeneFilterElement) => void;
    removeWithMutationDataFilter: () => void;
    removeWithCNADataFilter: () => void;
    removeCustomSelectionFilter: () => void,
    removeComparisonGroupSelectionFilter: ()=>void,
    clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => void;
    clearAllFilters: () => void
    clinicalAttributeIdToDataType: {[key:string]:string};
}


@observer
export default class UserSelections extends React.Component<IUserSelectionsProps, {}> {

    @computed
    get showFilters() {
        //return isFiltered(this.props.filter)
        return this.allComponents.length > 0;
    }

    @computed
    get allComponents() {
        let components = [] as JSX.Element[];

        // Show the filter for the custom selection
        if (this.props.numberOfSelectedSamplesInCustomSelection > 0) {
            components.push(<div className={styles.parentGroupLogic}>
                <GroupLogic
                    components={[
                        <span className={styles.filterClinicalAttrName}>Custom Selection</span>,
                        <PillTag
                            content={`${this.props.numberOfSelectedSamplesInCustomSelection} sample${this.props.numberOfSelectedSamplesInCustomSelection > 1 ? 's' : ''}`}
                            backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                            onDelete={() => this.props.removeCustomSelectionFilter()}
                        />
                    ]}
                    operation={':'}
                    group={false}/></div>);
        }

        // Show the filter for the comparison group selection
        if (this.props.comparisonGroupSelection.length > 0) {
            const numSamples = getSampleIdentifiers(this.props.comparisonGroupSelection).length;
            const numPatients = getPatientIdentifiers(this.props.comparisonGroupSelection).length;
            components.push(<div className={styles.parentGroupLogic}>
                <GroupLogic
                    components={[
                        <span className={styles.filterClinicalAttrName}>{getSelectedGroupNames(this.props.comparisonGroupSelection)}</span>,
                        <PillTag
                            content={caseCounts(numSamples, numPatients)}
                            backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                            onDelete={() => this.props.removeComparisonGroupSelectionFilter()}
                        />
                    ]}
                    operation={':'}
                    group={false}/></div>);
        }

        _.reduce((this.props.filter.clinicalDataFilters || []), (acc, clinicalDataFilter) => {
            const chartMeta = this.props.attributesMetaSet[clinicalDataFilter.attributeId];
            if (chartMeta) {
                const dataType = this.props.clinicalAttributeIdToDataType[clinicalDataFilter.attributeId];
                if(dataType === DataType.STRING) {
                    // Pie chart filter
                    acc.push(
                        <div className={styles.parentGroupLogic}>
                            <GroupLogic
                                components={[
                                    <span className={styles.filterClinicalAttrName}>{chartMeta.displayName}</span>,
                                    <GroupLogic
                                        components={clinicalDataFilter.values.map(clinicalDataFilterValue => {
                                            return <PillTag
                                                content={clinicalDataFilterValue.value}
                                                backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                                                onDelete={() => this.props.updateClinicalDataFilterByValues(chartMeta,
                                                    _.remove(clinicalDataFilter.values, value => value.value !== clinicalDataFilterValue.value))}
                                            />
                                        })}
                                        operation={'or'}
                                        group={false}
                                    />
                                ]}
                                operation={':'}
                                group={false}
                            />
                        </div>
                    );
                } else {
                     // Bar chart filter
                    acc.push(
                        <div className={styles.parentGroupLogic}>
                            <GroupLogic
                                components={[
                                    <span className={styles.filterClinicalAttrName}>{chartMeta.displayName}</span>,
                                    <PillTag
                                        content={intervalFiltersDisplayValue(clinicalDataFilter.values)}
                                        backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                                        onDelete={() => this.props.updateClinicalDataFilterByValues(chartMeta, [])}
                                    />
                                ]}
                                operation={':'}
                                group={false}
                            />
                        </div>
                    );
                }
            }
            return acc;
        }, components);

        // All custom charts
        if(!_.isEmpty(this.props.customChartsFilter)) {
            _.reduce((this.props.customChartsFilter), (acc, content:string[], key:string) => {
                const chartMeta = this.props.attributesMetaSet[key];
                if (chartMeta) {
                    acc.push(
                        <div className={styles.parentGroupLogic}>
                            <GroupLogic
                                components={[
                                    <span className={styles.filterClinicalAttrName}>{chartMeta.displayName}</span>,
                                    <GroupLogic components={content.map(label => {
                                        return <PillTag
                                            content={label}
                                            backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                                            onDelete={() => this.props.updateCustomChartFilter(chartMeta, _.remove(content, value => value !== label))}
                                        />
                                    })} operation={'or'} group={false}/>
                                ]}
                                operation={':'}
                                group={false}/>
                        </div>
                    );
                }
                return acc;
            }, components);
        }

        // Mutated Genes table
        let chartMeta = this.props.attributesMetaSet[UniqueKey.MUTATED_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.mutatedGenes)) {
            components.push(<div className={styles.parentGroupLogic}><GroupLogic
                components={this.props.filter.mutatedGenes.map(filter => {
                    return <GroupLogic
                        components={filter.hugoGeneSymbols.map(hugoGeneSymbol => {
                            return <PillTag
                                content={hugoGeneSymbol}
                                backgroundColor={MUT_COLOR_MISSENSE}
                                onDelete={() => this.props.removeMutatedGeneFilter(hugoGeneSymbol)}
                            />
                        })}
                        operation="or"
                        group={filter.hugoGeneSymbols.length > 1}
                    />
                })} operation={"and"} group={false}/></div>);
        }

        // Fusion Genes table
        chartMeta = this.props.attributesMetaSet[UniqueKey.FUSION_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.fusionGenes)) {
            components.push(<div className={styles.parentGroupLogic}><GroupLogic
                components={this.props.filter.fusionGenes.map(filter => {
                    return <GroupLogic
                        components={filter.hugoGeneSymbols.map(hugoGeneSymbol => {
                            return <PillTag
                                content={hugoGeneSymbol}
                                backgroundColor={MUT_COLOR_FUSION}
                                onDelete={() => this.props.removeFusionGeneFilter(hugoGeneSymbol)}
                            />
                        })}
                        operation="or"
                        group={filter.hugoGeneSymbols.length > 1}
                    />
                })} operation={"and"} group={false}/></div>);
        }

        // CNA table files
        chartMeta = this.props.attributesMetaSet[UniqueKey.CNA_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.cnaGenes)) {
            components.push(<div className={styles.parentGroupLogic}><GroupLogic
                components={this.props.filter.cnaGenes.map(filter => {
                    return <GroupLogic
                        components={filter.alterations.map(filter => {
                            let tagColor = getCNAColorByAlteration(filter.alteration);
                            tagColor = tagColor === undefined ? DEFAULT_NA_COLOR : tagColor;
                            return <PillTag
                                content={filter.hugoGeneSymbol}
                                backgroundColor={tagColor}
                                onDelete={() => this.props.removeCNAGeneFilter(filter)}
                            />
                        })}
                        operation="or"
                        group={filter.alterations.length > 1}
                    />
                })} operation={"and"} group={false}/></div>);
        }

        return components;
    }

    render() {
        if (this.showFilters) {
            return (
                <div className={classnames(styles.userSelections, 'userSelections')}>
                    {this.allComponents}
                    <button
                        data-test="clear-all-filters"
                        className={classnames('btn btn-default btn-sm', styles.summaryHeaderBtn, styles.summaryClearAllBtn)}
                        onClick={this.props.clearAllFilters}>Clear All Filters
                    </button>
                </div>
            );
        } else {
            return null;
        }
    }
}