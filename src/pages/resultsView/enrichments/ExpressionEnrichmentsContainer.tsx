import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable, computed, action } from 'mobx';
import ExpressionEnrichmentTable, { ExpressionEnrichmentTableColumnType } from 'pages/resultsView/enrichments/ExpressionEnrichmentsTable';
import styles from "./styles.module.scss";
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import {
    ExpressionEnrichmentWithQ,
    getExpressionRowData,
    getExpressionScatterData,
    getExpressionEnrichmentColumns,
    getFilteredData
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import MiniBoxPlot from 'pages/resultsView/enrichments/MiniBoxPlot';
import * as _ from "lodash";
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import CheckedSelect from 'public-lib/components/checkedSelect/CheckedSelect';
import { Option } from 'public-lib/components/checkedSelect/CheckedSelectUtils';
import EllipsisTextTooltip from "public-lib/components/ellipsisTextTooltip/EllipsisTextTooltip";

export interface IExpressionEnrichmentContainerProps {
    data: ExpressionEnrichmentWithQ[];
    selectedProfile: MolecularProfile;
    groups: {
        name: string,
        description: string,
        nameOfEnrichmentDirection?: string,
        count: number,
        color?: string
    }[]
    alteredVsUnalteredMode?: boolean;
    store?: ResultsViewPageStore;
}

@observer
export default class ExpressionEnrichmentContainer extends React.Component<IExpressionEnrichmentContainerProps, {}> {

    static defaultProps: Partial<IExpressionEnrichmentContainerProps> = {
        alteredVsUnalteredMode: true
    };

    @observable overExpressedFilter: boolean = true;
    @observable underExpressedFilter: boolean = true;
    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable clickedGeneHugo: string;
    @observable clickedGeneEntrez: number;
    @observable.ref selectedGenes: string[] | null;
    @observable.ref highlightedRow: ExpressionEnrichmentRow | undefined;
    @observable.ref _expressedGroups: string[] = this.props.groups.map(group => group.name);

    @computed get data(): ExpressionEnrichmentRow[] {
        return getExpressionRowData(this.props.data, this.props.store ? this.props.store.hugoGeneSymbols : [], this.props.groups);
    }

    @computed get filteredData(): ExpressionEnrichmentRow[] {
        return getFilteredData(this.data, this._expressedGroups, this.significanceFilter,
            this.selectedGenes);
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
        () => {
            return this.filteredData;
        },
        () => {
            return this.highlightedRow;
        },
        (c: ExpressionEnrichmentRow) => {
            this.highlightedRow = c;
        }
    );

    //used in 2 groups analysis
    @computed get group1() {
        return this.props.groups[0];
    }

    //used in 2 groups analysis
    @computed get group2() {
        return this.props.groups[1];
    }

    @computed get group1CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Over-expressed";
        } else {
            return <span style={{display:"flex", alignItems:"center"}}>Enriched in&nbsp;<EllipsisTextTooltip text={this.group1.name!}/></span>;
        }
    }

    @computed get group2CheckboxLabel() {
        if (this.props.alteredVsUnalteredMode) {
            return "Under-expressed";
        } else {
            return <span style={{display:"flex", alignItems:"center"}}>Enriched in&nbsp;<EllipsisTextTooltip text={this.group2.name!}/></span>;
        }
    }

    @computed get selectedGenesSet() {
        return _.keyBy(this.selectedGenes || []);
    }

    @computed get isTwoGroupAnalysis(): boolean {
        return this.props.groups.length == 2;
    }

    @computed get customColumns() {
        return getExpressionEnrichmentColumns(this.props.groups, this.props.alteredVsUnalteredMode);
    }

    @computed get visibleOrderedColumnNames() {
        const columns = [];
        columns.push(ExpressionEnrichmentTableColumnType.GENE,
            ExpressionEnrichmentTableColumnType.CYTOBAND);

        this.props.groups.forEach(group => {
            columns.push(group.name + " mean");
        });

        this.props.groups.forEach(group => {
            columns.push(group.name + " standard deviation");
        });

        if (this.isTwoGroupAnalysis) {
            columns.push(ExpressionEnrichmentTableColumnType.LOG_RATIO);
        }

        columns.push(
            ExpressionEnrichmentTableColumnType.P_VALUE,
            ExpressionEnrichmentTableColumnType.Q_VALUE);

        if (this.isTwoGroupAnalysis && this.props.alteredVsUnalteredMode) {
            columns.push(ExpressionEnrichmentTableColumnType.TENDENCY);
        } else {
            columns.push(ExpressionEnrichmentTableColumnType.EXPRESSED)
        }

        return columns;
    }

    @autobind
    @action onChange(values: { value: string }[]) {
        this._expressedGroups = _.map(values, datum => datum.value);
    }

    @computed get selectedValues() {
        return this._expressedGroups.map(id => ({ value: id }));
    }

    @computed get options(): Option[] {
        return _.map(this.props.groups, group => {
            return {
                label: group.nameOfEnrichmentDirection ? group.nameOfEnrichmentDirection : group.name,
                value: group.name
            }
        });
    }

    public render() {

        if (this.props.data.length === 0) {
            return <div className={'alert alert-info'}>No data/result available</div>;
        }

        const data: any[] = getExpressionScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : []);
        const maxData: any = _.maxBy(data, (d) => {
            return Math.ceil(Math.abs(d.x));
        });

        let selectedGeneQValue: number = 0;
        if (this.clickedGeneHugo) {
            selectedGeneQValue = this.props.data.filter(d => d.hugoGeneSymbol === this.clickedGeneHugo)[0].qValue;
        }

        return (
            <div className={styles.Container}>

                {this.isTwoGroupAnalysis &&
                    <div className={styles.ChartsPanel}>
                        <MiniScatterChart
                            data={data}
                            selectedGenesSet={this.selectedGenesSet}
                            xAxisLeftLabel={this.group2.nameOfEnrichmentDirection || this.group2.name}
                            xAxisRightLabel={this.group1.nameOfEnrichmentDirection || this.group1.name}
                            xAxisDomain={Math.ceil(Math.abs(maxData.x))}
                            xAxisTickValues={null}
                            onGeneNameClick={this.onGeneNameClick}
                            onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared} />
                        {this.props.store &&
                            <MiniBoxPlot
                                selectedGeneHugo={this.clickedGeneHugo}
                                selectedGeneEntrez={this.clickedGeneEntrez}
                                selectedProfile={this.props.selectedProfile}
                                queryGenes={this.props.store.hugoGeneSymbols}
                                selectedGeneQValue={selectedGeneQValue}
                                store={this.props.store} />
                        }
                    </div>
                }

                <div className={styles.TableContainer}>
                    <div>
                        <h3>{this.props.selectedProfile.name}</h3>
                        {this.props.store && <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />}
                    </div>
                    <hr style={{ marginTop: 0, marginBottom: 5, borderWidth: 2 }} />
                    <div className={styles.Checkboxes}>
                        <div style={{ width: 250, marginRight: 7 }} >
                            <CheckedSelect
                                name={"enrichedGroupsSelector"}
                                placeholder={"Select enriched groups"}
                                onChange={this.onChange}
                                options={this.options}
                                value={this.selectedValues}
                            />
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
                    <ExpressionEnrichmentTable
                        data={this.filteredData}
                        onCheckGene={this.props.store ? this.onCheckGene : undefined}
                        onGeneNameClick={this.props.store ? this.onGeneNameClick : undefined}
                        dataStore={this.dataStore}
                        mutexTendency={this.props.alteredVsUnalteredMode}
                        checkedGenes={this.props.store ? this.checkedGenes : undefined}
                        visibleOrderedColumnNames={this.visibleOrderedColumnNames}
                        customColumns={_.keyBy(this.customColumns, column => column.uniqueName || column.name)}
                    />
                </div>
            </div>
        );
    }
}
