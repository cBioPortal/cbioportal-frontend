import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {computed, observable, action} from 'mobx';
import styles from "./styles.module.scss";
import {
    ClinicalDataIntervalFilterValue,
    CopyNumberGeneFilterElement
} from 'shared/api/generated/CBioPortalAPIInternal';
import {ChartMeta, UniqueKey, StudyViewFilterWithSampleIdentifierFilters} from 'pages/studyView/StudyViewPageStore';
import {
    FILTER_CONTENT_COLOR,
    FILTER_TITLE_COLOR,
    getCNAColorByAlteration, getHugoSymbolByEntrezGeneId,
    intervalFiltersDisplayValue,
    isFiltered, MUTATED_GENE_COLOR, NA_COLOR
} from 'pages/studyView/StudyViewUtils';
import {PillTag} from "../../shared/components/PillTag/PillTag";
import {GroupLogic} from "./filters/groupLogic/GroupLogic";
import {Gene} from "../../shared/api/generated/CBioPortalAPI";
import classnames from 'classnames';
import MobxPromise from 'mobxpromise';
import {remoteData} from "../../shared/api/remoteData";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    attributesMetaSet: { [id: string]: ChartMeta };
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    updateClinicalDataIntervalFilter: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    removeGeneFilter: (entrezGeneId: number) => void;
    removeCNAGeneFilter: (filter: CopyNumberGeneFilterElement) => void;
    clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => void;
    clearAllFilters: () => void
}


@observer
export default class UserSelections extends React.Component<IUserSelectionsProps, {}> {
    @observable hugoSymbolsMap = observable.map<string>();
    @observable promiseGroup = observable.map<MobxPromise<void>>()

    private getPromiseGroupId(entrezGeneIds:number[]) {
        return entrezGeneIds.sort().join(',');
    }

    @action updateGroupPromise() {
        if(this.props.filter.mutatedGenes !== undefined || this.props.filter.cnaGenes !== undefined){
            let genes:number[][] = [];

            if(!_.isEmpty(this.props.filter.mutatedGenes)) {
                genes = genes.concat(this.props.filter.mutatedGenes.map(group => group.entrezGeneIds));
            }

            if(!_.isEmpty(this.props.filter.cnaGenes)) {
                genes = genes.concat(this.props.filter.cnaGenes.map(group => group.alterations.map(alteration => alteration.entrezGeneId)));
            }

            _.each(genes, group => {
                let id = this.getPromiseGroupId(group);
                if(!this.promiseGroup.has(id)) {
                    this.promiseGroup.set(id, remoteData({
                        invoke: async () => {
                            if (this.props.filter.mutatedGenes !== undefined) {
                                await Promise.all(_.filter(group, item => !this.hugoSymbolsMap.has(item.toString()))
                                    .map(entrezGeneId => getHugoSymbolByEntrezGeneId(entrezGeneId)
                                        .then(gene => this.hugoSymbolsMap.set(entrezGeneId.toString(), gene))));
                            }
                        }
                    }))
                }
            })
        }
    }

    componentWillReceiveProps() {
        this.updateGroupPromise();
    }

    constructor(props: IUserSelectionsProps) {
        super(props);
    }

    @computed get showFilters() {
        return isFiltered(this.props.filter)
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
                                        backgroundColor={FILTER_CONTENT_COLOR}
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
                                backgroundColor={FILTER_CONTENT_COLOR}
                                onDelete={() => this.props.updateClinicalDataIntervalFilter(chartMeta, [])}
                            />
                        ]}
                        operation={':'}
                        group={false}/></div>
                );
            }
            return acc;
        }, components);

        // Mutated Genes table
        let chartMeta = this.props.attributesMetaSet[UniqueKey.MUTATED_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.mutatedGenes)) {
            components.push(<div className={styles.parentGroupLogic}><GroupLogic
                components={this.props.filter.mutatedGenes.map(filter => {
                    let promise = this.promiseGroup.get(this.getPromiseGroupId(filter.entrezGeneIds));
                    if(promise === undefined){
                        return <span></span>;
                    }else if(promise.isPending) {
                        return <LoadingIndicator isLoading={true}/>
                    }else {
                        return <GroupLogic
                            components={filter.entrezGeneIds.map((entrezGene, index) => {
                                const hugoSymbol = this.hugoSymbolsMap.get(entrezGene.toString());
                                return <PillTag
                                    content={hugoSymbol === undefined ? `Entrez Gene ID: ${entrezGene}` : hugoSymbol}
                                    backgroundColor={MUTATED_GENE_COLOR}
                                    onDelete={() => this.props.removeGeneFilter(entrezGene)}
                                />
                            })}
                            operation="or"
                            group={filter.entrezGeneIds.length > 1}
                        />
                    }
                })} operation={"and"} group={false}/></div>);
        }

        // CNA table files
        chartMeta = this.props.attributesMetaSet[UniqueKey.CNA_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.cnaGenes)) {
            components.push(<div className={styles.parentGroupLogic}><GroupLogic
                components={this.props.filter.cnaGenes.map(filter => {
                    let promise = this.promiseGroup.get(this.getPromiseGroupId(filter.alterations.map(alteration => alteration.entrezGeneId)));
                    if(promise === undefined){
                        return <span></span>;
                    }else if(promise.isPending) {
                        return <LoadingIndicator isLoading={true}/>
                    }else {
                        return <GroupLogic
                            components={filter.alterations.map((filter, index) => {
                                const hugoSymbol = this.hugoSymbolsMap.get(filter.entrezGeneId.toString());
                                let tagColor = getCNAColorByAlteration(filter.alteration);
                                tagColor = tagColor === undefined ? NA_COLOR : tagColor;
                                return <PillTag
                                    content={hugoSymbol === undefined ? `Entrez Gene ID: ${filter.entrezGeneId}` : hugoSymbol}
                                    backgroundColor={tagColor}
                                    onDelete={() => this.props.removeCNAGeneFilter(filter)}
                                />
                            })}
                            operation="or"
                            group={filter.alterations.length > 1}
                        />
                    }
                })} operation={"and"} group={false}/></div>);
        }

        // Select IDs by Case Selector, Scatter Plot
        _.reduce((this.props.filter.sampleIdentifiersSet || []), (acc, sampleIdentifiers, chartUniqKey) => {
            const chartMeta = this.props.attributesMetaSet[chartUniqKey];
            if (chartMeta) {
                let customChartName = chartMeta.uniqueKey === UniqueKey.SELECT_CASES_BY_IDS ? 'IDs' : chartMeta.displayName;
                acc.push(<div className={styles.parentGroupLogic}><PillTag
                    content={`Selected ${sampleIdentifiers.length} samples by ${customChartName}`}
                    backgroundColor={FILTER_TITLE_COLOR}
                    onDelete={() => this.props.clearChartSampleIdentifierFilter(chartMeta)}
                /></div>);
            }
            return acc;
        }, components);
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