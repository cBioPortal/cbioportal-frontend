import * as React from 'react';
import * as _ from "lodash";
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import {observable, computed, action} from 'mobx';
import AlterationEnrichmentTable, {AlterationEnrichmentTableColumnType} from 'pages/resultsView/enrichments/AlterationEnrichmentsTable';
import { AlterationEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import styles from "./styles.module.scss";
import {
    getAlterationScatterData,
    getFilteredData,
    getAlterationRowData,
    AlterationEnrichmentWithQ, getAlterationFrequencyScatterData
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import MiniBarChart from 'pages/resultsView/enrichments/MiniBarChart';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import MiniFrequencyScatterChart from "./MiniFrequencyScatterChart";
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import FlexAlignedCheckbox from "../../../shared/components/FlexAlignedCheckbox";

export interface IAlterationEnrichmentContainerProps {
    data: AlterationEnrichmentWithQ[];
    totalGroup1Count: number;
    totalGroup2Count: number;
    group1Name?:string;
    group2Name?:string;
    group1Description?:string;
    group2Description?:string;
    alteredVsUnalteredMode?:boolean;
    headerName: string;
    selectedProfile:MolecularProfile;
    store?: ResultsViewPageStore;
    alterationType?: string;
    showCNAInTable?:boolean;
}

enum ChartType {
    VOLCANO, FREQUENCY
}

@observer
export default class AlterationEnrichmentContainer extends React.Component<IAlterationEnrichmentContainerProps, {}> {

    static defaultProps:Partial<IAlterationEnrichmentContainerProps> = {
        group1Name: "altered group",
        group2Name: "unaltered group",
        alterationType: "a mutation",
        showCNAInTable: false,
        alteredVsUnalteredMode: true
    };

    @computed get group1Description() {
        return this.props.group1Description ||
            `that have alterations in the query gene(s) that also have ${this.props.alterationType!} in the listed gene.`;
    }

    @computed get group2Description() {
        return this.props.group2Description ||
            `that do not have alterations in the query gene(s) that have ${this.props.alterationType!} in the listed gene.`;
    }

    @observable chartType:ChartType = ChartType.VOLCANO;
    @observable mutualExclusivityFilter: boolean = true;
    @observable coOccurenceFilter: boolean = true;
    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable clickedGene: string;
    @observable.ref selectedGenes: string[]|null;
    @observable.ref highlightedRow:AlterationEnrichmentRow|undefined;

    @computed get data(): AlterationEnrichmentRow[] {
        return getAlterationRowData(this.props.data, this.props.store ? this.props.store.hugoGeneSymbols : []);
    }

    @computed get filteredData(): AlterationEnrichmentRow[] {
        return getFilteredData(this.data, this.mutualExclusivityFilter, this.coOccurenceFilter,
            this.significanceFilter, this.selectedGenes);
    }

    @computed get clickedGeneStats(): [number, number, number, number] {

        const clickedAlterationEnrichment: AlterationEnrichment = _.find(this.props.data, ['hugoGeneSymbol', this.clickedGene])!;

        return [this.props.totalGroup1Count - clickedAlterationEnrichment.set1CountSummary.alteredCount,
            clickedAlterationEnrichment.set1CountSummary.alteredCount,
            clickedAlterationEnrichment.set2CountSummary.alteredCount,
            this.props.totalGroup2Count - clickedAlterationEnrichment.set2CountSummary.alteredCount];
    }

    @autobind
    private toggleMutualExclusivityFilter() {
        this.mutualExclusivityFilter = !this.mutualExclusivityFilter;
    }

    @autobind
    private toggleCoOccurenceFilter() {
        this.coOccurenceFilter = !this.coOccurenceFilter;
    }

    @autobind
    private toggleSignificanceFilter() {
        this.significanceFilter = !this.significanceFilter;
    }

    @autobind
    private onCheckGene(hugoGeneSymbol: string) {

        const index = this.checkedGenes.indexOf(hugoGeneSymbol);
        if (index !== -1) {
            this.checkedGenes.splice(index, 1);
        } else {
            this.checkedGenes.push(hugoGeneSymbol);
        }
    }

    @autobind
    private toggleChart() {
        if (this.chartType === ChartType.VOLCANO) {
            this.chartType = ChartType.FREQUENCY;
        } else {
            this.chartType = ChartType.VOLCANO;
        }
    }

    @autobind
    private onGeneNameClick(hugoGeneSymbol: string) {
        this.clickedGene = hugoGeneSymbol;
    }

    @autobind
    @action private onSelection(hugoGeneSymbols: string[]) {
        this.selectedGenes = hugoGeneSymbols;
    }

    @autobind
    @action private onSelectionCleared() {
        this.selectedGenes = null;
    }

    private dataStore = new EnrichmentsTableDataStore(
        ()=>{
            return this.filteredData;
        },
        ()=>{
            return this.highlightedRow;
        },
        (c:AlterationEnrichmentRow)=>{
            this.highlightedRow = c;
        }
    );

    @computed get columns() {
        const columns = [];
        columns.push(AlterationEnrichmentTableColumnType.GENE,
            AlterationEnrichmentTableColumnType.CYTOBAND);
        if (this.props.showCNAInTable) {
            columns.push(AlterationEnrichmentTableColumnType.ALTERATION);
        }
        columns.push(AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP1,
        AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP2,
        AlterationEnrichmentTableColumnType.LOG_RATIO,
        AlterationEnrichmentTableColumnType.P_VALUE,
        AlterationEnrichmentTableColumnType.Q_VALUE,
        AlterationEnrichmentTableColumnType.TENDENCY);

        return columns;
    }

    @computed get volcanoPlotLabels() {
        if (this.props.alteredVsUnalteredMode) {
            return ["Mutual exclusivity", "Co-occurrence"];
        } else {
            return [this.props.group2Name!, this.props.group1Name!];
        }
    }

    @computed get group1CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Co-occurrence";
        } else {
            return <span style={{display:"flex", alignItems:"center"}}>Enriched in&nbsp;<EllipsisTextTooltip text={this.props.group1Name!} shownWidth={100}/></span>;
        }
    }

    @computed get group2CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Mutual exclusivity";
        } else {
            return <span style={{display:"flex", alignItems:"center"}}>Enriched in&nbsp;<EllipsisTextTooltip text={this.props.group2Name!} shownWidth={100}/></span>;
        }
    }

    @computed get selectedGenesSet() {
        return _.keyBy(this.selectedGenes || []);
    }

    public render() {

        if (this.props.data.length === 0) {
            return <div className={'alert alert-info'}>No data/result available</div>;
        }

        return (
            <div className={styles.Container}>
                <div className={styles.LeftColumn}>
                    {this.chartType === ChartType.VOLCANO && (
                        <MiniScatterChart data={getAlterationScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [])}
                                          xAxisLeftLabel={this.volcanoPlotLabels[0]} xAxisRightLabel={this.volcanoPlotLabels[1]} xAxisDomain={15}
                                          xAxisTickValues={[-10, 0, 10]}
                                          selectedGenesSet={this.selectedGenesSet}
                                          onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                                          onSelectionCleared={this.onSelectionCleared}/>
                    )}
                    {this.chartType === ChartType.FREQUENCY && (
                        <MiniFrequencyScatterChart data={getAlterationFrequencyScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [])}
                                                   xGroupName={this.props.group1Name!} yGroupName={this.props.group2Name!} onGeneNameClick={this.onGeneNameClick}
                                                   selectedGenesSet={this.selectedGenesSet} onSelection={this.onSelection} onSelectionCleared={this.onSelectionCleared}/>
                    )}
                    <button
                        className="btn btn-sm btn-default"
                        onClick={this.toggleChart}
                        style={{
                            position:"absolute",
                            top:10,
                            left:10
                        }}
                    >
                        {this.chartType === ChartType.VOLCANO ? "Show Frequency Plot" : "Show Volcano Plot"}
                    </button>
                    {this.props.store && <MiniBarChart totalAlteredCount={this.props.totalGroup1Count} totalUnalteredCount={this.props.totalGroup2Count}
                                                       selectedGene={this.clickedGene} selectedGeneStats={this.clickedGene ? this.clickedGeneStats : null} />}
                </div>
                <div className={styles.TableContainer}>
                    <div>
                        <h3>{this.props.headerName}</h3>
                        {this.props.store && <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />}
                    </div>
                    <hr style={{ marginTop: 0, marginBottom: 5, borderWidth: 2 }} />
                    <div className={styles.Checkboxes}>
                        <FlexAlignedCheckbox
                            checked={this.coOccurenceFilter}
                            onClick={this.toggleCoOccurenceFilter}
                            label={this.group1CheckboxLabel}
                        />
                        <FlexAlignedCheckbox
                            checked={this.mutualExclusivityFilter}
                            onClick={this.toggleMutualExclusivityFilter}
                            label={this.group2CheckboxLabel}
                        />
                        <FlexAlignedCheckbox
                            checked={this.significanceFilter}
                            onClick={this.toggleSignificanceFilter}
                            label="Significant only"
                        />
                    </div>
                    <AlterationEnrichmentTable data={this.filteredData} onCheckGene={this.props.store ? this.onCheckGene : undefined}
                                               onGeneNameClick={this.props.store ? this.onGeneNameClick : undefined} alterationType={this.props.alterationType!} dataStore={this.dataStore}
                                               group1Name={this.props.group1Name!} group2Name={this.props.group2Name!}
                                               group1Description={this.group1Description}
                                               group2Description={this.group2Description}
                                               mutexTendency={this.props.alteredVsUnalteredMode}
                                               columns={this.columns}
                    />
                </div>
            </div>
        );
    }
}
