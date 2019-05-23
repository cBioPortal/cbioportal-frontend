import * as React from 'react';
import { observer } from "mobx-react";
import { observable, action, computed } from 'mobx';
import DownloadControls from 'shared/components/downloadControls/DownloadControls';
import autobind from 'autobind-decorator';
import MultipleCategoryBarPlot from 'shared/components/plots/MultipleCategoryBarPlot';
import ReactSelect from "react-select2";
import GeneSelectionBox, { GeneBoxType } from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import _ from "lodash";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from "shared/api/generated/CBioPortalAPI";
import { getEnrichmentBarPlotData, getGeneListOptions, USER_DEFINED_OPTION, CNA_TO_ALTERATION, AlterationContainerType } from './EnrichmentsUtil';
import styles from "./frequencyPlotStyles.module.scss";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { FormControl } from 'react-bootstrap';
import { GeneReplacement } from 'shared/components/query/QueryStore';

export interface IGeneBarPlotProps {
    data: AlterationEnrichmentRow[];
    groupOrder?: string[];
    isTwoGroupAnalysis?: boolean;
    showCNAInTable?: boolean;
    containerType: AlterationContainerType;
}

const SVG_ID = "GroupComparisonGeneFrequencyPlot";

const DEFAULT_GENES_COUNT = 10;

@observer
export default class GeneBarPlot extends React.Component<IGeneBarPlotProps, {}> {

    @observable tooltipModel: any;
    @observable _geneQuery: string | undefined;
    @observable selectedGenes: string[] | undefined;
    @observable _label: string | undefined;
    @observable isGeneSelectionPopupVisible: boolean | undefined = false;

    @computed get geneListOptions() {
        return getGeneListOptions(this.props.data);
    }

    @computed get defaultOption() {
        return this.geneListOptions.length > 1 ? this.geneListOptions[1] : this.geneListOptions[0];
    }

    @computed get defaultgenes() {
        return this.defaultOption.genes.slice(0, DEFAULT_GENES_COUNT);
    }

    @computed get geneDataSet() {
        return _.keyBy(this.props.data, datum => {
            if (this.props.showCNAInTable) {
                //add copy number alteration type 'amp' or 'del'
                return datum.hugoGeneSymbol + ' ' + CNA_TO_ALTERATION[datum.value!];
            } else {
                return datum.hugoGeneSymbol;
            }
        });
    }

    @computed get barPlotData() {
        return getEnrichmentBarPlotData(this.geneDataSet, this.barPlotOrderedGenes);
    }

    @computed get barPlotOrderedGenes() {
        let genes: string[] = [];
        if (!this.selectedGenes) {
            genes = this.defaultgenes;
        } else {
            genes = this.selectedGenes;
        }
        if (this.props.showCNAInTable) {
            //add copy number alteration type
            genes = _.flatMap(genes, gene => [gene + ' ' + CNA_TO_ALTERATION[2], gene + ' ' + CNA_TO_ALTERATION[-2]]);
        }
        //add significant genes(geneSymbols with *) to the list
        return _.flatMap(genes, gene => [gene + '*', gene]);
    }

    @computed get geneQuery() {
        return this._geneQuery === undefined ? this.defaultgenes.join(' ') : this._geneQuery;
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private getTooltip(datum: any) {
        let geneSymbol = datum.majorCategory as string;
        // get rid of a trailing *
        geneSymbol = geneSymbol.replace(/\*$/, "");
        let geneData = this.geneDataSet[geneSymbol];
        //use groupOrder inorder of sorted groups
        let groupRows = _.map(this.props.groupOrder, groupName => {
            const group = geneData.groupsSet[groupName];
            let style: any = {};
            //bold row corresponding to highlighed bar
            if (datum.minorCategory === group.name) {
                style = { fontWeight: "bold" };
            }
            return (<tr style={style}>
                <td>{group.name}</td>
                <td>{group.alteredPercentage.toFixed(2)}% ({group.alteredCount}/{group.profiledCount})</td>
            </tr>)
        })

        return (<div>
            <strong>{geneSymbol} {this.yAxislabel}</strong><br />
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th scope="col">Group</th>
                        <th scope="col">Percentage Altered</th>
                    </tr>
                </thead>
                <tbody>
                    {groupRows}
                </tbody>

            </table>
            <strong>p-Value</strong>: {toConditionalPrecision(geneData.pValue, 3, 0.01)}<br />
            <strong>q-Value</strong>: {toConditionalPrecision(geneData.qValue, 3, 0.01)}
        </div>)
    }

    @computed get label() {
        const label = this._label || this.defaultOption.label;
        return `Showing ${label.charAt(0).toLowerCase()}${label.substring(1)}`;
    }

    @computed get toolbar() {
        return (
            <div style={{ zIndex: 10, position: "absolute", top: "10px", right: "10px" }}>
                <div className={styles.ChartControls}>
                    <strong>{this.label}</strong>
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={false}
                        visible={this.isGeneSelectionPopupVisible}
                        onVisibleChange={(visible) => {
                            this.isGeneSelectionPopupVisible = visible;
                        }}
                        overlay={
                            <GenesSelection
                                options={this.geneListOptions}
                                selectedValue={this.geneQuery}
                                onSelectedGenesChange={(value, genes, label) => {
                                    this._geneQuery = value;
                                    this.selectedGenes = genes;
                                    this._label = label;
                                    this.isGeneSelectionPopupVisible = false;
                                }}
                                defaultNumberOfGenes={DEFAULT_GENES_COUNT} />
                        }
                        placement="bottomLeft"
                    >
                        <div>
                            <button className="btn btn-default btn-xs">
                                Select genes
                            </button>
                        </div>
                    </DefaultTooltip>
                    <DownloadControls
                        getSvg={this.getSvg}
                        filename={SVG_ID}
                        dontFade={true}
                        collapse={true}
                    />
                </div>
            </div>
        );
    }

    @computed private get yAxislabel() {
        return this.props.containerType === AlterationContainerType.MUTATION ? 'Mutation frequency' : 'Copy-number alteration frequency';
    }

    public render() {
        return (
            <div data-test="ClinicalTabPlotDiv" className="borderedChart" style={{ overflow: 'auto', overflowY: 'hidden', flexGrow: 1 }}>
                {this.toolbar}
                <div style={{ position: this.props.isTwoGroupAnalysis ? 'absolute' : 'static' }}>
                    <MultipleCategoryBarPlot
                        svgId={SVG_ID}
                        barWidth={this.props.isTwoGroupAnalysis ? 10 : 20}
                        domainPadding={this.props.isTwoGroupAnalysis ? 10 : 20}
                        chartBase={300}
                        legendLocationWidthThreshold={800}
                        ticksCount={6}
                        horizontalBars={false}
                        percentage={false}
                        stacked={false}
                        plotData={this.barPlotData}
                        axisStyle={{ tickLabels: { fontSize: 10 } }}
                        horzCategoryOrder={this.barPlotOrderedGenes}
                        vertCategoryOrder={this.props.groupOrder}
                        countAxisLabel={`${this.yAxislabel} (%)`}
                        tooltip={this.getTooltip}
                    />
                </div>
            </div>
        );
    }
}

interface IGeneSelectionProps {
    options: { label: string, genes: string[] }[];
    selectedValue: string;
    onSelectedGenesChange: (value: string, orderedGenes: string[], label: string) => void;
    defaultNumberOfGenes: number;
    maxNumberOfGenes?: number;
}

@observer
class GenesSelection extends React.Component<IGeneSelectionProps, {}> {

    static defaultProps: Partial<IGeneSelectionProps> = {
        maxNumberOfGenes: 100
    };

    @observable _geneQuery: string | undefined;
    @observable selectedGenes: string[] | undefined;
    @observable selectedGenesHasError = false;
    @observable private numberOfGenes = this.props.defaultNumberOfGenes;
    @observable private _selectedGeneListOption: {
        label: string;
        value: string;
        genes: string[];
    } | undefined
    private genesToPlot: string[] = [];

    @computed get geneListOptions() {
        return _.map(this.props.options, option => {
            return {
                ...option,
                value: option.genes.join(" ")
            }
        });
    }

    @computed get selectedGeneListOption() {
        if (this._selectedGeneListOption === undefined) {
            return this.geneListOptions.find(opt => opt.value.startsWith(this.props.selectedValue));
        }
        return this._selectedGeneListOption;
    }

    @computed get isCustomGeneSelection() {
        return this.selectedGeneListOption === undefined || this.selectedGeneListOption.label === USER_DEFINED_OPTION.label;
    }

    @computed get geneQuery() {
        return this._geneQuery === undefined ? this.props.selectedValue : this._geneQuery;
    }

    @autobind
    @action
    private onChangeGeneInput(
        oql: { query: SingleGeneQuery[], error?: any },
        genes: { found: Gene[]; suggestions: GeneReplacement[]; },
        queryStr: string
    ) {
        const foundGenes = _.keyBy(genes.found, gene => gene.hugoGeneSymbol.toUpperCase());
        const queriedGenes = _.map(oql.query, query => query.gene.toUpperCase())
        if (!_.isEmpty(foundGenes) || !_.isEmpty(genes.suggestions)) {
            this.selectedGenesHasError = !_.every(queriedGenes, gene => gene in foundGenes);
        }
        if (!this.selectedGenesHasError) {
            this.genesToPlot = queriedGenes
        }
        if (this.geneQuery !== queryStr) {
            this._selectedGeneListOption = {
                ...USER_DEFINED_OPTION,
                value: ''
            }
        }
        this._geneQuery = queryStr;
    }

    @computed get addGenesButtonDisabled() {
        return this.props.selectedValue === this._geneQuery || this.selectedGenesHasError || _.isEmpty(this._geneQuery)
    }

    @autobind
    @action
    private onGeneListOptionChange(option: any) {
        this._selectedGeneListOption = option
        if (option.value !== '') {
            this._geneQuery = option.genes.slice(0, this.numberOfGenes).join(' ');
        } else {
            this._geneQuery = '';
        }
    }

    @autobind
    @action
    private handleTotalInputChange(e: any) {
        const newCount: number = e.target.value.replace(/[^0-9]/g, '');
        if (newCount <= this.props.maxNumberOfGenes!) {
            this.numberOfGenes = newCount;
        }
    }

    @autobind
    @action
    private handleTotalInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.numberOfGenes)) {
                this.numberOfGenes = 0;
                return;
            }
            //removes leading 0s
            this.numberOfGenes = Number(this.numberOfGenes);
            if (this.selectedGeneListOption) {
                let genes = this.selectedGeneListOption.genes;
                if (genes.length > 0) {
                    this._geneQuery = genes.slice(0, this.numberOfGenes).join(' ');
                }
            }
        }
    }

    @autobind
    @action
    private onBlur() {
        if (isNaN(this.numberOfGenes)) {
            this.numberOfGenes = 0;
            return;
        }
        //removes leading 0s
        this.numberOfGenes = Number(this.numberOfGenes);
        if (this.selectedGeneListOption) {
            let genes = this.selectedGeneListOption.genes;
            if (genes.length > 0) {
                this._geneQuery = genes.slice(0, this.numberOfGenes).join(' ');
            }
        }
    }

    public render() {
        return (
            <div style={{ width: 300 }}>
                {
                    this.props.options.length > 0 && <ReactSelect
                        value={this.selectedGeneListOption}
                        options={this.geneListOptions}
                        onChange={this.onGeneListOptionChange}
                        isClearable={false}
                        isSearchable={false}
                    />
                }
                {!this.isCustomGeneSelection && <div>
                    <br />
                    <div style={{ display: "table-row" }}>
                        <label style={{ display: "table-cell", whiteSpace: "nowrap" }}>Number of Genes (max. {this.props.maxNumberOfGenes}): &nbsp;</label>
                        <FormControl
                            type="text"
                            value={this.numberOfGenes}
                            onChange={this.handleTotalInputChange}
                            onKeyPress={this.handleTotalInputKeyPress}
                            onBlur={this.onBlur} />
                    </div>
                </div>}
                <div>
                    <br />
                    <GeneSelectionBox
                        inputGeneQuery={this.geneQuery}
                        validateInputGeneQuery={false}
                        callback={this.onChangeGeneInput}
                        location={GeneBoxType.ONCOPRINT_HEATMAP}
                    />
                    <button
                        key="addGenestoBarPlot"
                        className="btn btn-sm btn-default"
                        onClick={() => {
                            this.selectedGenes = this.genesToPlot;
                            this.props.onSelectedGenesChange(this._geneQuery!, this.genesToPlot, this.selectedGeneListOption!.label);
                        }}
                        disabled={this.addGenesButtonDisabled}
                    >Submit</button>
                </div>

            </div>
        );
    }
}
