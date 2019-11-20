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
    getAlterationFrequencyScatterData, AlterationEnrichmentWithQ, getAlterationEnrichmentColumns, AlterationContainerType, getFilteredData
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import AddCheckedGenes from 'pages/resultsView/enrichments/AddCheckedGenes';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import MiniFrequencyScatterChart from "./MiniFrequencyScatterChart";
import CheckedSelect from 'public-lib/components/checkedSelect/CheckedSelect';
import {Option} from 'public-lib/components/checkedSelect/CheckedSelectUtils'
import {MiniOncoprint} from "shared/components/miniOncoprint/MiniOncoprint";
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import GeneBarPlot from './GeneBarPlot';
import WindowStore from "shared/components/window/WindowStore";
import './styles.scss';
import ReactSelect from "react-select";

export interface IAlterationEnrichmentContainerProps {
    data: AlterationEnrichmentWithQ[];
    groups:{
        name:string,
        description:string,
        nameOfEnrichmentDirection?:string,
        count:number,
        color?:string
    }[]
    alteredVsUnalteredMode?:boolean;
    headerName: string;
    store?: ResultsViewPageStore;
    showCNAInTable?:boolean;
    containerType:AlterationContainerType;
    patientLevelEnrichments:boolean;
    onSetPatientLevelEnrichments:(patientLevel:boolean)=>void;
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

    @observable.ref _enrichedGroups: string[] = this.props.groups.map(group=>group.name);

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
        return getAlterationRowData(this.props.data, this.props.store ? this.props.store.hugoGeneSymbols : [], this.props.groups);
    }

    @computed get filteredData(): AlterationEnrichmentRow[] {
        return getFilteredData(this.data, this._enrichedGroups, this.significanceFilter, this.selectedGenes);
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
        const cols =  getAlterationEnrichmentColumns(this.props.groups, this.props.alteredVsUnalteredMode);
        if (this.isTwoGroupAnalysis) {
            cols.push({
            name: 'Alteration Overlap',
            headerRender: () => <span>Co-occurrence Pattern</span>,
            render: (data) => {
                if (data.pValue === undefined) {
                    return <span>-</span>
                }
                const groups = _.map(data.groupsSet);
                const queriedGroup1 = this.props.groups[0];
                const queriedGroup2 = this.props.groups[1];
                  // we want to order groups according to order in prop.groups
                  const group1 = groups.find((group)=>group.name===this.props.groups[0].name)!;
                  const group2 = groups.find((group)=>group.name===this.props.groups[1].name)!;

                  if (!group1 || !group2) {
                      throw("No matching groups in Alteration Overlap Cell");
                  }

                const totalQueriedCases = queriedGroup1.count + queriedGroup2.count;
                const group1Width = (queriedGroup1.count / totalQueriedCases) * 100;
                const group2Width = 100 - group1Width;
                const group1Unprofiled = ((queriedGroup1.count - group1.profiledCount) / totalQueriedCases) * 100;
                const group1Unaltered = ((group1.profiledCount - group1.alteredCount) / totalQueriedCases) * 100;
                const group2Unprofiled = ((queriedGroup2.count - group2.profiledCount) / totalQueriedCases) * 100;
                const group1Altered = (group1.alteredCount / totalQueriedCases) * 100;
                const group2Altered = (group2.alteredCount / totalQueriedCases) * 100;

                const alterationLanguage = this.props.showCNAInTable ? 'copy number alterations' : 'mutations'

                const overlay = ()=>{
                    return (<div>
                        <h3>{data.hugoGeneSymbol} {alterationLanguage} in:</h3>
                        <table className={'table table-striped'}>
                            <tbody>
                            <tr>
                                <td><strong>{group1.name}: </strong></td>
                                <td>{group1.alteredCount} of {group1.profiledCount} of profiled {this.props.patientLevelEnrichments ? "patients" : "samples"} ({numeral(group1.alteredPercentage).format('0.0')}%)</td>
                            </tr>
                            <tr>
                                <td><strong>{group2.name}: </strong></td>
                                <td>{group2.alteredCount} of {group2.profiledCount} of profiled {this.props.patientLevelEnrichments ? "patients" : "samples"} ({numeral(group2.alteredPercentage).format('0.0')}%)
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
                              group1Unprofiled={group1Unprofiled}
                              group2Unprofiled={group2Unprofiled}
                              group1Color={this.props.groups[0].color}
                              group2Color={this.props.groups[1].color}
                              width={150}
                          />
                      </div>
                  </DefaultTooltip>;
            },
            tooltip:
                <table>
                    <tr>
                        <td>Upper row</td>
                        <td>: {this.props.patientLevelEnrichments ? "Patients" : "Samples"} colored according to group.</td>
                    </tr>
                    <tr>
                        <td>Lower row</td>
                        <td>: {this.props.patientLevelEnrichments ? "Patients" : "Samples"} with {this.props.showCNAInTable ? 'the listed alteration' : 'a mutation'} in the listed gene are highlighted.</td>
                    </tr>
                </table>,
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
        } else {
            columns.push(AlterationEnrichmentTableColumnType.MOST_ENRICHED)
        }

        return columns;
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

    @computed private get genePlotMaxWidth() {
        //820 include width of two scatter plots
        return WindowStore.size.width - (this.isTwoGroupAnalysis ? 820 : 40);
    }

    @computed private get categoryToColor() {
        return _.reduce(this.props.groups, (acc, next) => {
            if (next.color) {
                acc[next.name] = next.color;
            }
            return acc;
        }, {} as { [id: string]: string });
    }

    public render() {
        if (this.props.data.length === 0) {
            return <div className={'alert alert-info'}>No data/result available</div>;
        }

        return (
            <div className={styles.Container}>
                <div className={styles.ChartsPanel} style={{maxWidth:WindowStore.size.width-60}}>
                    {this.isTwoGroupAnalysis &&
                        <MiniScatterChart
                            data={getAlterationScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [])}
                            xAxisLeftLabel={this.group2.nameOfEnrichmentDirection || this.group2.name}
                            xAxisRightLabel={this.group1.nameOfEnrichmentDirection || this.group1.name}
                            xAxisDomain={15}
                            xAxisTickValues={[-10, 0, 10]}
                            selectedGenesSet={this.selectedGenesSet}
                            onGeneNameClick={this.onGeneNameClick}
                            onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}
                        />
                    }

                    {this.isTwoGroupAnalysis &&
                        <MiniFrequencyScatterChart
                            data={getAlterationFrequencyScatterData(this.data, this.props.store ? this.props.store.hugoGeneSymbols : [], this.group1.name, this.group2.name)}
                            xGroupName={this.group1.name}
                            yGroupName={this.group2.name}
                            onGeneNameClick={this.onGeneNameClick}
                            selectedGenesSet={this.selectedGenesSet}
                            onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}
                        />
                    }

                    <div style={{ maxWidth: this.genePlotMaxWidth }}>
                        <GeneBarPlot
                            data={this.data}
                            isTwoGroupAnalysis={this.isTwoGroupAnalysis}
                            groupOrder={this.props.groups.map(group => group.name)}
                            showCNAInTable={this.props.showCNAInTable}
                            containerType={this.props.containerType}
                            categoryToColor={this.categoryToColor}
                            dataStore={this.dataStore}
                        />
                    </div>
                </div>

                <div>
                    <div>
                        <h3>{this.props.headerName}</h3>
                        {this.props.store && <AddCheckedGenes checkedGenes={this.checkedGenes}/>}
                    </div>
                    <div className={styles.Checkboxes}>
                        <div style={{ width: 250, marginRight: 7 }} >
                            <ReactSelect
                                name="select enrichments level: sample or patient"
                                onChange={(option:any|null)=>{
                                    if (option) {
                                        this.props.onSetPatientLevelEnrichments(option.value);
                                    }
                                }}
                                options={[
                                    { label: "Patient-level enrichments", value: true},
                                    { label: "Sample-level enrichments", value: false}
                                ]}
                                clearable={false}
                                searchable={false}
                                value={{ label: this.props.patientLevelEnrichments ? "Patient-level enrichments" : "Sample-level enrichments", value: this.props.patientLevelEnrichments}}
                                styles={{
                                    control: (provided:any)=>({
                                        ...provided,
                                        height:36,
                                        minHeight:36,
                                        border: "1px solid rgb(204,204,204)"
                                    }),
                                    menu: (provided:any)=>({
                                        ...provided,
                                        maxHeight: 400
                                    }),
                                    menuList: (provided:any)=>({
                                        ...provided,
                                        maxHeight:400
                                    }),
                                    placeholder:(provided:any)=>({
                                        ...provided,
                                        color: "#000000"
                                    }),
                                    dropdownIndicator:(provided:any)=>({
                                        ...provided,
                                        color:"#000000"
                                    }),
                                    option:(provided:any, state:any)=>{
                                        return {
                                            ...provided,
                                            cursor:"pointer",
                                        };
                                    }
                                }}
                                theme={(theme:any)=>({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        neutral80:"black",
                                        //primary: theme.colors.primary50
                                    },
                                })}
                            />
                        </div>
                        <div style={{ width: 250, marginRight: 7 }} >
                            <CheckedSelect
                                name={"enrichedGroupsSelector"}
                                placeholder={"Select enriched groups"}
                                onChange={this.onChange}
                                options={this.options}
                                value={this.selectedValues}
                                height={36}
                            />
                        </div>
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.significanceFilter}
                                onClick={this.toggleSignificanceFilter}
                                data-test="SwapAxes"
                            />Significant only
                        </label>

                    </div>
                    <AlterationEnrichmentTable key={this.props.patientLevelEnrichments.toString()}
                                                data={this.filteredData} onCheckGene={this.props.store ? this.onCheckGene : undefined}
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
