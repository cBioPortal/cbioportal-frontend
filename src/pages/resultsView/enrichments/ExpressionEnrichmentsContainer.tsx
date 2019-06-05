import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable, computed } from 'mobx';
import ExpressionEnrichmentTable from 'pages/resultsView/enrichments/ExpressionEnrichmentsTable';
import { ExpressionEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import styles from "./styles.module.scss";
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import {
    ExpressionEnrichmentWithQ,
    getExpressionRowData,
    getExpressionScatterData,
    getFilteredData
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import MiniBoxPlot from 'pages/resultsView/enrichments/MiniBoxPlot';
import * as _ from "lodash";
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import FlexAlignedCheckbox from "../../../shared/components/FlexAlignedCheckbox";
import classNames from 'classnames';

export interface IExpressionEnrichmentContainerProps {
    data: ExpressionEnrichmentWithQ[];
    selectedProfile: MolecularProfile;
    group1Name?:string;
    group2Name?:string;
    group1Description?:string;
    group2Description?:string;
    group1Color?:string;
    group2Color?:string;
    alteredVsUnalteredMode?:boolean;
    store?: ResultsViewPageStore;
}

@observer
export default class ExpressionEnrichmentContainer extends React.Component<IExpressionEnrichmentContainerProps, {}> {

    static defaultProps:Partial<IExpressionEnrichmentContainerProps> = {
        group1Name: "Altered group",
        group2Name: "Unaltered group",
        group1Description: "samples that have alterations in the query gene(s).",
        group2Description: "samples that do not have alterations in the query gene(s).",
        alteredVsUnalteredMode:true
    };

    @observable overExpressedFilter: boolean = true;
    @observable underExpressedFilter: boolean = true;
    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable clickedGeneHugo: string;
    @observable clickedGeneEntrez: number;
    @observable.ref selectedGenes: string[]|null;
    @observable.ref highlightedRow:ExpressionEnrichmentRow|undefined;

    @computed get data(): ExpressionEnrichmentRow[] {
        return getExpressionRowData(this.props.data, this.props.store ? this.props.store.hugoGeneSymbols : []);
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

    @computed get volcanoPlotLabels() {
        if (this.props.alteredVsUnalteredMode) {
            return ["Under-expressed", "Over-expressed"];
        } else {
            return [this.props.group2Name!, this.props.group1Name!];
        }
    }

    @computed get group1CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Over-expressed";
        } else {
            return <span style={{display:"flex", alignItems:"center"}}>Enriched in&nbsp;<EllipsisTextTooltip text={this.props.group1Name!} shownWidth={100}/></span>;
        }
    }

    @computed get group2CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Under-expressed";
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

        const data: any[] = getExpressionScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : []);
        const maxData:any = _.maxBy(data, (d) => {
            return Math.ceil(Math.abs(d.x));
        });

        let selectedGeneQValue: number = 0;
        if (this.clickedGeneHugo) {
            selectedGeneQValue = this.props.data.filter(d => d.hugoGeneSymbol === this.clickedGeneHugo)[0].qValue;
        }

        return (
            <div className={styles.Container}>

                <div className={styles.ChartsPanel}>
                    <MiniScatterChart data={data}
                                      selectedGenesSet={this.selectedGenesSet}
                                      xAxisLeftLabel={this.volcanoPlotLabels[0]} xAxisRightLabel={this.volcanoPlotLabels[1]} xAxisDomain={Math.ceil(Math.abs(maxData.x))}
                                      xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                                      onSelectionCleared={this.onSelectionCleared}/>
                    { this.props.store && <MiniBoxPlot selectedGeneHugo={this.clickedGeneHugo} selectedGeneEntrez={this.clickedGeneEntrez}
                                                       selectedProfile={this.props.selectedProfile} queryGenes={this.props.store.hugoGeneSymbols}
                                                       selectedGeneQValue={selectedGeneQValue} store={this.props.store}/>}
                </div>

                <div className={styles.TableContainer}>
                    <div>
                        <h3>{this.props.selectedProfile.name}</h3>
                        { this.props.store && <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />}
                    </div>
                    <hr style={{ marginTop: 0, marginBottom: 5, borderWidth: 2 }} />
                    <div className={styles.Checkboxes}>
                        <div className={styles.FlexCheckbox}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.overExpressedFilter}
                                    onClick={this.toggleOverExpressedFilter}
                                />
                                {this.group1CheckboxLabel}
                            </label>
                        </div>
                        <div className={styles.FlexCheckbox}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.underExpressedFilter}
                                    onClick={this.toggleUnderExpressedFilter}
                                />
                                {this.group2CheckboxLabel}
                            </label>
                        </div>
                        <div className={styles.FlexCheckbox}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.significanceFilter}
                                    onClick={this.toggleSignificanceFilter}
                                />
                                Significant only
                            </label>
                        </div>
                    </div>
                    <ExpressionEnrichmentTable data={this.filteredData} onCheckGene={this.props.store ? this.onCheckGene : undefined}
                                               onGeneNameClick={this.props.store ? this.onGeneNameClick : undefined} dataStore={this.dataStore} group1Name={this.props.group1Name!} group2Name={this.props.group2Name!}
                                               mutexTendency={this.props.alteredVsUnalteredMode}
                                               group1Description={this.props.group1Description!}
                                               group2Description={this.props.group2Description!}
                                               group1Color={this.props.group1Color}
                                               group2Color={this.props.group2Color}
                                               checkedGenes={this.props.store ? this.checkedGenes : undefined}
                    />
                </div>



            </div>
        );
    }
}
