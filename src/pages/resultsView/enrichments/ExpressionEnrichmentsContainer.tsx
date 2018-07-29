import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable, computed } from 'mobx';
import ExpressionEnrichmentTable from 'pages/resultsView/enrichments/ExpressionEnrichmentsTable';
import { ExpressionEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import styles from "./styles.module.scss";
import { Button, FormControl, FormGroup, Form, ControlLabel, Checkbox } from 'react-bootstrap';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import { getExpressionRowData, getExpressionScatterData, getFilteredData } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import MiniBoxPlot from 'pages/resultsView/enrichments/MiniBoxPlot';
import * as _ from "lodash";
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';

export interface IExpressionEnrichmentContainerProps {
    data: ExpressionEnrichment[];
    selectedProfile: MolecularProfile;
    store: ResultsViewPageStore;
}

@observer
export default class ExpressionEnrichmentContainer extends React.Component<IExpressionEnrichmentContainerProps, {}> {

    @observable overExpressedFilter: boolean = true;
    @observable underExpressedFilter: boolean = true;
    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable clickedGeneHugo: string;
    @observable clickedGeneEntrez: number;
    @observable selectedGenes: string[]|null;
    @observable.ref highlightedRow:ExpressionEnrichmentRow|undefined;

    @computed get data(): ExpressionEnrichmentRow[] {
        return getExpressionRowData(this.props.data, this.props.store.hugoGeneSymbols);
    }

    @computed get filteredData(): ExpressionEnrichmentRow[] {
        return getFilteredData(this.data, this.underExpressedFilter, this.overExpressedFilter, this.significanceFilter, 
            this.selectedGenes);
    }

    @autobind
    private toggleOverExpressedFilter() {
        this.overExpressedFilter = !this.overExpressedFilter;
    }

    @autobind
    private toggleUnderExpressedFilter() {
        this.underExpressedFilter = !this.underExpressedFilter;
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
    private onGeneNameClick(hugoGeneSymbol: string, entrezGeneId: number) {
        this.clickedGeneHugo = hugoGeneSymbol;
        this.clickedGeneEntrez = entrezGeneId;
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
        (c:ExpressionEnrichmentRow)=>{
            this.highlightedRow = c;
        }
    );

    public render() {

        if (this.props.data.length === 0) {
            return <div>No data/result available</div>;
        }

        const data: any[] = getExpressionScatterData(this.data, this.props.store.hugoGeneSymbols);
        const maxData:any = _.maxBy(data, (d) => {
            return Math.ceil(Math.abs(d.x));
        });

        let selectedGeneQValue: number = 0;
        if (this.clickedGeneHugo) {
            selectedGeneQValue = this.props.data.filter(d => d.hugoGeneSymbol === this.clickedGeneHugo)[0].qValue;
        }

        return (
            <div className={styles.Container}>
                <div className={styles.LeftColumn}>
                    <MiniScatterChart data={data} 
                        xAxisLeftLabel="Under-expressed" xAxisRightLabel="Over-expressed" xAxisDomain={Math.ceil(Math.abs(maxData.x))} 
                        xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection} 
                        onSelectionCleared={this.onSelectionCleared}/>
                    <MiniBoxPlot selectedGeneHugo={this.clickedGeneHugo} selectedGeneEntrez={this.clickedGeneEntrez} 
                        selectedProfile={this.props.selectedProfile} queryGenes={this.props.store.hugoGeneSymbols} 
                        selectedGeneQValue={selectedGeneQValue} store={this.props.store}/>
                </div>
                <div className={styles.TableContainer}>
                    <div>
                        <h3>{this.props.selectedProfile.name}</h3>
                        <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />
                    </div>
                    <hr style={{ marginTop: 0, marginBottom: 5, borderWidth: 2 }} />
                    <div className={styles.Checkboxes}>
                        <Checkbox checked={this.overExpressedFilter}
                            onChange={this.toggleOverExpressedFilter}>
                            Over-expressed
                        </Checkbox>
                        <Checkbox checked={this.underExpressedFilter}
                            onChange={this.toggleUnderExpressedFilter}>
                            Under-expressed
                        </Checkbox>
                        <Checkbox checked={this.significanceFilter}
                            onChange={this.toggleSignificanceFilter}>
                            Significant only
                        </Checkbox>
                    </div>
                    <ExpressionEnrichmentTable data={this.filteredData} onCheckGene={this.onCheckGene} onGeneNameClick={this.onGeneNameClick}
                        dataStore={this.dataStore}/>
                </div>
            </div>
        );
    }
}
