import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import styles from "./styles.module.scss";
import {ClinicalDataIntervalFilterValue, CopyNumberGeneFilterElement} from 'shared/api/generated/CBioPortalAPIInternal';
import {ChartMeta, StudyViewFilterWithSampleIdentifierFilters, UniqueKey} from 'pages/studyView/StudyViewPageStore';
import {getCNAColorByAlteration, intervalFiltersDisplayValue} from 'pages/studyView/StudyViewUtils';
import {PillTag} from "../../shared/components/PillTag/PillTag";
import {GroupLogic} from "./filters/groupLogic/GroupLogic";
import classnames from 'classnames';
import {STUDY_VIEW_CONFIG} from "./StudyViewConfig";

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    customChartsFilter: {[key:string]:string[]};
    getSelectedGene: (entrezGeneId: number) => string|undefined;
    attributesMetaSet: { [id: string]: ChartMeta };
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    updateClinicalDataIntervalFilter: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => void;
    updateCustomChartFilter: (chartMeta: ChartMeta, values: string[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    removeGeneFilter: (entrezGeneId: number) => void;
    removeCNAGeneFilter: (filter: CopyNumberGeneFilterElement) => void;
    resetMutationCountVsCNAFilter: () => void;
    removeWithMutationDataFilter: () => void;
    removeWithCNADataFilter: () => void;
    clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => void;
    clearAllFilters: () => void
}


@observer
export default class UserSelections extends React.Component<IUserSelectionsProps, {}> {

    constructor(props: IUserSelectionsProps) {
        super(props);
    }

    @computed
    get showFilters() {
        //return isFiltered(this.props.filter)
        return this.allComponents.length > 0;
    }

    @computed
    get allComponents() {
        let components = [] as JSX.Element[];

        // Pie chart filters
        _.reduce((this.props.filter.clinicalDataEqualityFilters || []), (acc, clinicalDataEqualityFilter) => {
            const chartMeta = this.props.attributesMetaSet[clinicalDataEqualityFilter.clinicalDataType + '_' + clinicalDataEqualityFilter.attributeId];
            if (chartMeta) {
                acc.push(
                    <div className={styles.parentGroupLogic}>
                        <GroupLogic
                            components={[
                                <span className={styles.filterClinicalAttrName}>{chartMeta.displayName}</span>,
                                <GroupLogic components={clinicalDataEqualityFilter.values.map(label => {
                                    return <PillTag
                                        content={label}
                                        backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                                        onDelete={() => this.props.updateClinicalDataEqualityFilter(chartMeta, _.remove(clinicalDataEqualityFilter.values, value => value !== label))}
                                    />
                                })} operation={'or'} group={false}/>
                            ]}
                            operation={':'}
                            group={false}/></div>
                );
            }
            return acc;
        }, components);

        // Bar chart filters
        _.reduce((this.props.filter.clinicalDataIntervalFilters || []), (acc, clinicalDataIntervalFilter) => {
            const chartMeta = this.props.attributesMetaSet[clinicalDataIntervalFilter.clinicalDataType + '_' + clinicalDataIntervalFilter.attributeId];
            if (chartMeta) {
                acc.push(
                    <div className={styles.parentGroupLogic}><GroupLogic
                        components={[
                            <span className={styles.filterClinicalAttrName}>{chartMeta.displayName}</span>,
                            <PillTag
                                content={intervalFiltersDisplayValue(clinicalDataIntervalFilter.values)}
                                backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                                onDelete={() => this.props.updateClinicalDataIntervalFilter(chartMeta, [])}
                            />
                        ]}
                        operation={':'}
                        group={false}/></div>
                );
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
                                group={false}/></div>
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
                        components={filter.entrezGeneIds.map(entrezGene => {
                            const hugoGeneSymbol = this.props.getSelectedGene(entrezGene);
                            return <PillTag
                                content={hugoGeneSymbol === undefined ? `Entrez Gene ID: ${entrezGene}` : hugoGeneSymbol}
                                backgroundColor={STUDY_VIEW_CONFIG.colors.mutatedGene}
                                onDelete={() => this.props.removeGeneFilter(entrezGene)}
                            />
                        })}
                        operation="or"
                        group={filter.entrezGeneIds.length > 1}
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
                            const hugoGeneSymbol = this.props.getSelectedGene(filter.entrezGeneId);
                            let tagColor = getCNAColorByAlteration(filter.alteration);
                            tagColor = tagColor === undefined ? STUDY_VIEW_CONFIG.colors.na : tagColor;
                            return <PillTag
                                content={hugoGeneSymbol === undefined ? `Entrez Gene ID: ${filter.entrezGeneId}` : hugoGeneSymbol}
                                backgroundColor={tagColor}
                                onDelete={() => this.props.removeCNAGeneFilter(filter)}
                            />
                        })}
                        operation="or"
                        group={filter.alterations.length > 1}
                    />
                })} operation={"and"} group={false}/></div>);
        }

        // Mutation count vs FGA
        if (this.props.filter.mutationCountVsCNASelection) {
            const region = this.props.filter.mutationCountVsCNASelection;
            components.push(
                <div className={styles.parentGroupLogic}><GroupLogic
                    components={[
                        <span className={styles.filterClinicalAttrName}>Mutation Count vs FGA</span>,
                        <PillTag
                            content={`${Math.floor(region.yStart)} ≤ Mutation Count < ${Math.ceil(region.yEnd)} and ${region.xStart.toFixed(2)} ≤ FGA < ${region.xEnd.toFixed(2)}`}
                            backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent}
                            onDelete={this.props.resetMutationCountVsCNAFilter}
                        />
                    ]}
                    operation={':'}
                    group={false}/></div>
            );
        }

        if (this.props.filter.withMutationData) {
            components.push(
                <div className={styles.parentGroupLogic}><PillTag
                    content={`Samples with mutation data`}
                    backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterTitle}
                    onDelete={this.props.removeWithMutationDataFilter}
                /></div>
            );
        }

        if (this.props.filter.withCNAData) {
            components.push(
                <div className={styles.parentGroupLogic}><PillTag
                    content={`Samples with CNA data`}
                    backgroundColor={STUDY_VIEW_CONFIG.colors.theme.clinicalFilterTitle}
                    onDelete={this.props.removeWithCNADataFilter}
                /></div>
            );
        }
        return components;
    }

    render() {
        if (this.showFilters) {
            return (
                <div className={styles.userSelections}>
                    {this.allComponents}
                    <button
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