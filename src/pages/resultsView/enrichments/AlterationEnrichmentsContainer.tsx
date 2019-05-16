import * as React from 'react';
import * as _ from "lodash";
import { observer } from "mobx-react";
import numeral from 'numeral';
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import {observable, computed, action} from 'mobx';
import AlterationEnrichmentTable, {AlterationEnrichmentTableColumnType} from 'pages/resultsView/enrichments/AlterationEnrichmentsTable';
import styles from "./styles.module.scss";
import {
    getAlterationScatterData,
    getAlterationRowData,
    getAlterationFrequencyScatterData, AlterationEnrichmentWithQ, getFilteredDataByGroups, getGroupColumns, AlterationContainerType
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import MiniFrequencyScatterChart from "./MiniFrequencyScatterChart";
import FlexAlignedCheckbox from "../../../shared/components/FlexAlignedCheckbox";
import CheckedSelect, {Option} from 'shared/components/checkedSelect/CheckedSelect';
import {MiniOncoprint} from "shared/components/miniOncoprint/MiniOncoprint";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import GeneBarPlot from './GeneBarPlot';

export interface IAlterationEnrichmentContainerProps {
    data: AlterationEnrichmentWithQ[];
    groups:{name:string, description:string, nameOfEnrichmentDirection?:string, count:number}[]
    alteredVsUnalteredMode?:boolean;
    headerName: string;
    store?: ResultsViewPageStore;
    showCNAInTable?:boolean;
    containerType:AlterationContainerType;
}

@observer
export default class AlterationEnrichmentContainer extends React.Component<IAlterationEnrichmentContainerProps, {}> {

    static defaultProps:Partial<IAlterationEnrichmentContainerProps> = {
        showCNAInTable: false,
        alteredVsUnalteredMode: true
    };

    @observable significanceFilter: boolean = false;
    @observable.shallow checkedGenes: string[] = [];
    @observable.shallow selectedGenes: string[]|null;
    @observable.ref highlightedRow:AlterationEnrichmentRow|undefined;

    @observable _enrichedGroups: string[] = this.props.groups.map(group=>group.name);

    @computed get isTwoGroupAnalysis(): boolean {
        return this.props.groups.length == 2;
    }

    //used in 2 groups analysis
    @computed get group1() {
        return this.props.groups[0];
    }

    //used in 2 groups analysis
    @computed get group2() {
        return this.props.groups[1];
    }

    @computed get data(): AlterationEnrichmentRow[] {
        return getAlterationRowData(this.props.data, this.props.store ? this.props.store.hugoGeneSymbols : [], this.isTwoGroupAnalysis, this.group1.name, this.group2.name);
    }

    @computed get filteredData(): AlterationEnrichmentRow[] {
        return getFilteredDataByGroups(this.data, this._enrichedGroups, this.significanceFilter, this.selectedGenes);
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
        //noop
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

    @computed get customColumns() {
        const cols =  getGroupColumns(this.props.groups, this.props.alteredVsUnalteredMode);
        if (this.isTwoGroupAnalysis) {
            cols.push({
                          name: 'Alteration Overlap',
                          headerRender: () => <span>Co-occurrence Pattern</span>,
                          render: (data) => {

                              const groups = _.map(data.groupsSet);

                              const group1 = groups[0];
                              const group2 = groups[1];

                              const totalUniqueSamples = group1.profiledCount + group2.profiledCount;

                              const group1Width = (group1.profiledCount/totalUniqueSamples)*100;
                              const group2Width = 100 - group1Width;
                              const group1Unaltered = ((group1.profiledCount - group1.alteredCount)/ totalUniqueSamples) * 100;
                              const group1Altered = (group1.alteredCount / totalUniqueSamples) * 100;
                              const group2Altered = (group2.alteredCount / totalUniqueSamples) * 100;

                              const alterationLanguage = this.props.showCNAInTable ? 'copy number alterations' : 'mutations'

                              const overlay = ()=>{
                                  return (<div>
                                      <h3>{data.hugoGeneSymbol} {alterationLanguage} in:</h3>
                                      <table className={'table table-striped'}>
                                          <tbody>
                                          <tr>
                                              <td><strong>{group1.name}: </strong></td>
                                              <td>{group1.alteredCount} of {group1.profiledCount} of samples ({numeral(group1.alteredPercentage).format('0.0')}%)</td>
                                          </tr>
                                          <tr>
                                              <td><strong>{group2.name}: </strong></td>
                                              <td>{group2.alteredCount} of {group2.profiledCount} of samples ({numeral(group2.alteredPercentage).format('0.0')}%)
                                              </td>
                                          </tr>
                                          </tbody>

                                      </table>

                                  </div>);
                              };

                              return <DefaultTooltip destroyTooltipOnHide={true}  trigger={['hover']} overlay={overlay}>
                                  <div className={'inlineBlock'} style={{padding:'3px 0'}}>
                                      <MiniOncoprint
                                          group1Width={group1Width}
                                          group2Width={group2Width}
                                          group1Unaltered={group1Unaltered}
                                          group1Altered={group1Altered}
                                          group2Altered={group2Altered}
                                          width={150}
                                      />
                                  </div>
                              </DefaultTooltip>;
                          },
                      });
        }


        return cols;

    }

    @computed get visibleOrderedColumnNames() {
        const columns = [];
        columns.push(AlterationEnrichmentTableColumnType.GENE,
            AlterationEnrichmentTableColumnType.CYTOBAND);
        if (this.props.showCNAInTable) {
            columns.push(AlterationEnrichmentTableColumnType.ALTERATION);
        }
        this.props.groups.forEach(group=>{
            columns.push(group.name);
        })
        if(this.isTwoGroupAnalysis) {
            columns.push('Alteration Overlap');
            columns.push(AlterationEnrichmentTableColumnType.LOG_RATIO);
        }

        columns.push(
        AlterationEnrichmentTableColumnType.P_VALUE,
        AlterationEnrichmentTableColumnType.Q_VALUE);

        if(this.isTwoGroupAnalysis) {
            columns.push(this.props.alteredVsUnalteredMode ? AlterationEnrichmentTableColumnType.TENDENCY : AlterationEnrichmentTableColumnType.ENRICHED);
        }

        return columns;
    }

    @computed get volcanoPlotLabels() {
        if(this.props.groups.length === 2) {
            let label1 = this.props.groups[0].nameOfEnrichmentDirection || this.props.groups[0].name;
            let label2 = this.props.groups[1].nameOfEnrichmentDirection || this.props.groups[1].name;
            return [label2, label1];
        }
        return [];
    }

    @computed get scatterPlotLabels() {
        if(this.props.groups.length === 2) {
            return [this.props.groups[0].name, this.props.groups[1].name];
        }
        return [];
    }

    @computed get selectedGenesSet() {
        return _.keyBy(this.selectedGenes || []);
    }

    @autobind
    @action onChange(values: { value: string }[]) {
        this._enrichedGroups = _.map(values, datum => datum.value);
    }

    @computed get selectedValues() {
        return this._enrichedGroups.map(id => ({ value: id }));
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

        return (
            <div className={styles.Container}>
                <div className={styles.ChartsPanel}>
                    {this.isTwoGroupAnalysis && <MiniScatterChart data={getAlterationScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [])}
                        xAxisLeftLabel={this.volcanoPlotLabels[0]} xAxisRightLabel={this.volcanoPlotLabels[1]} xAxisDomain={15}
                        xAxisTickValues={[-10, 0, 10]}
                        selectedGenesSet={this.selectedGenesSet}
                        onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                        onSelectionCleared={this.onSelectionCleared} />}

                    {this.isTwoGroupAnalysis && <MiniFrequencyScatterChart data={getAlterationFrequencyScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [], this.group1.name, this.group2.name)}
                        xGroupName={this.volcanoPlotLabels[1]} yGroupName={this.volcanoPlotLabels[0]} onGeneNameClick={this.onGeneNameClick}
                        selectedGenesSet={this.selectedGenesSet} onSelection={this.onSelection} onSelectionCleared={this.onSelectionCleared} />}

                    <GeneBarPlot
                        data={this.data}
                        isTwoGroupAnalysis={this.isTwoGroupAnalysis}
                        groupOrder={this.props.groups.map(group => group.name)}
                        showCNAInTable={this.props.showCNAInTable}
                        containerType={this.props.containerType}
                    />
                </div>

                <div>
                    <div>
                        <h3>{this.props.headerName}</h3>
                        {this.props.store && <AddCheckedGenes checkedGenes={this.checkedGenes} store={this.props.store} />}
                    </div>
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
                        <FlexAlignedCheckbox
                            checked={this.significanceFilter}
                            onClick={this.toggleSignificanceFilter}
                            label="Significant only"
                        />
                    </div>
                    <AlterationEnrichmentTable data={this.filteredData} onCheckGene={this.props.store ? this.onCheckGene : undefined}
                                               checkedGenes={this.props.store ? this.checkedGenes : undefined}
                                               dataStore={this.dataStore}
                                               visibleOrderedColumnNames={this.visibleOrderedColumnNames}
                                               customColumns={_.keyBy(this.customColumns,column=>column.name)}
                    />
                </div>
            </div>
        );
    }
}
