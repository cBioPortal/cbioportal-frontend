import * as React from 'react';
import * as _ from "lodash";
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable, computed } from 'mobx';
import AlterationEnrichmentTable from 'pages/resultsView/enrichments/AlterationEnrichmentsTable';
import { AlterationEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import styles from "./styles.module.scss";
import { getAlterationScatterData, getFilteredData, getAlterationRowData } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { Checkbox, Button, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import MiniBarChart from 'pages/resultsView/enrichments/MiniBarChart';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';

export interface IAlterationEnrichmentContainerProps {
    data: AlterationEnrichment[];
    totalAlteredCount: number;
    totalUnalteredCount: number;
    headerName: string;
    store: ResultsViewPageStore;
    alterationType: string;
}

@observer
export default class AlterationEnrichmentContainer extends React.Component<IAlterationEnrichmentContainerProps, {}> {

    @observable mutualExclusivityFilter: boolean = true;
    @observable coOccurenceFilter: boolean = true;
    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable clickedGene: string;
    @observable selectedGenes: string[]|null;
    @observable.ref highlightedRow:AlterationEnrichmentRow|undefined;

    @computed get data(): AlterationEnrichmentRow[] {
        return getAlterationRowData(this.props.data, this.props.totalAlteredCount, this.props.totalUnalteredCount,
            this.props.store.hugoGeneSymbols);
    }

    @computed get filteredData(): AlterationEnrichmentRow[] {
        return getFilteredData(this.data, this.mutualExclusivityFilter, this.coOccurenceFilter,
            this.significanceFilter, this.selectedGenes);
    }

    @computed get clickedGeneStats(): [number, number, number, number] {

        const clickedAlterationEnrichment: AlterationEnrichment = _.find(this.props.data, ['hugoGeneSymbol', this.clickedGene])!;

        return [this.props.totalAlteredCount - clickedAlterationEnrichment.alteredCount, 
            clickedAlterationEnrichment.alteredCount, 
            clickedAlterationEnrichment.unalteredCount, 
            this.props.totalUnalteredCount - clickedAlterationEnrichment.unalteredCount];
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
    private onGeneNameClick(hugoGeneSymbol: string) {
        this.clickedGene = hugoGeneSymbol;
    }

    @autobind
    private onSelection(hugoGeneSymbols: string[]) {
        this.selectedGenes = hugoGeneSymbols;
    }

    @autobind
    private onSelectionCleared() {
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

    public render() {

        if (this.props.data.length === 0) {
            return <div>No data/result available</div>;
        }
        
        return (
            <div className={styles.Container}>
                <div className={styles.LeftColumn}>
                    <MiniScatterChart data={getAlterationScatterData(this.data, this.props.store.hugoGeneSymbols)} 
                        xAxisLeftLabel="Mutual exclusivity" xAxisRightLabel="Co-occurrence" xAxisDomain={15} 
                        xAxisTickValues={[-10, 0, 10]}  onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection} 
                        onSelectionCleared={this.onSelectionCleared}/>
                    <MiniBarChart totalAlteredCount={this.props.totalAlteredCount} totalUnalteredCount={this.props.totalUnalteredCount}
                        selectedGene={this.clickedGene} selectedGeneStats={this.clickedGene ? this.clickedGeneStats : null} />
                </div>
                <div className={styles.TableContainer}>
                    <div>
                        <h3>{this.props.headerName}</h3>
                        <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />
                    </div>
                    <hr style={{ marginTop: 0, marginBottom: 5, borderWidth: 2 }} />
                    <div className={styles.Checkboxes}>
                        <Checkbox checked={this.coOccurenceFilter}
                            onChange={this.toggleCoOccurenceFilter}>
                            Co-occurrence
                        </Checkbox>
                        <Checkbox checked={this.mutualExclusivityFilter}
                            onChange={this.toggleMutualExclusivityFilter}>
                            Mutual exclusivity
                        </Checkbox>
                        <Checkbox checked={this.significanceFilter}
                            onChange={this.toggleSignificanceFilter}>
                            Significant only
                        </Checkbox>
                    </div>
                    <AlterationEnrichmentTable data={this.filteredData} onCheckGene={this.onCheckGene} 
                        onGeneNameClick={this.onGeneNameClick} alterationType={this.props.alterationType} dataStore={this.dataStore}/>
                </div>
            </div>
        );
    }
}
