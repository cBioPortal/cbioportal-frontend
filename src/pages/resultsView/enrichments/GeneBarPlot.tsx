import * as React from 'react';
import { observer } from "mobx-react";
import { observable, action, computed } from 'mobx';
import DownloadControls from 'shared/components/downloadControls/DownloadControls';
import autobind from 'autobind-decorator';
import MultipleCategoryBarPlot from 'shared/components/plots/MultipleCategoryBarPlot';
import ScrollBar from 'shared/components/Scrollbar/ScrollBar';
import ReactSelect from "react-select2";
import GeneSelectionBox, { GeneBoxType } from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import _ from "lodash";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from "shared/api/generated/CBioPortalAPI";
import { getEnrichmentBarPlotData, getGeneListOptions, USER_DEFINED_OPTION } from './EnrichmentsUtil';
import styles from "./frequencyPlotStyles.module.scss";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';

export interface IGeneBarPlotProps {
    data: AlterationEnrichmentRow[];
    groupOrder?: string[];
    isTwoGroupAnalysis?: boolean;
}

const SVG_ID = "GroupComparisonGeneFrequencyPlot";

@observer
export default class GeneBarPlot extends React.Component<IGeneBarPlotProps, {}> {

    @observable tooltipModel: any;
    @observable _geneQuery: string | undefined;
    @observable selectedGenes: string[] | undefined;

    private scrollPane: HTMLDivElement;

    @autobind
    private getScrollPane() {
        return this.scrollPane;
    }

    @computed get geneListOptions() {
        return getGeneListOptions(this.props.data);
    }

    @computed get defaultOption() {
        return this.geneListOptions.length > 1 ? this.geneListOptions[1] : this.geneListOptions[0];
    }

    @computed get geneDataSet() {
        return _.keyBy(this.props.data, datum => datum.hugoGeneSymbol);
    }

    @computed get barPlotData() {
        return getEnrichmentBarPlotData(this.geneDataSet, this.barPlotOrderedGenes);
    }

    @computed get barPlotOrderedGenes() {
        let genes: string[] = [];
        if (!this.selectedGenes) {
            genes = this.defaultOption.value.split(/\s+/g);
        } else {
            genes = this.selectedGenes;
        }
        //add significant genes(geneSymbols with *) to the list
        return _.flatMap(genes, gene => [gene + '*', gene]);
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
    }

    @computed get geneQuery() {
        return this._geneQuery === undefined ? this.defaultOption.value : this._geneQuery;
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private getTooltip(datum: any) {
        let geneSymbol = datum.majorCategory as string;
        // get rid of a trailing *
        geneSymbol = geneSymbol.replace(/\*$/,"");
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
            <strong>{geneSymbol} Mutation Frequency </strong><br />
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

    @computed get toolbar() {
        return (
            <div style={{ zIndex: 10, position: "absolute", top: "10px", right: "10px" }}>
                <div className={styles.ChartControls}>
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={false}
                        overlay={
                            <GenesSelection
                                options={this.geneListOptions}
                                selectedValue={this.geneQuery}
                                onSelectedGenesChange={(value, genes) => {
                                    this._geneQuery = value;
                                    this.selectedGenes = genes;
                                }} />

                        }
                        placement="bottomLeft"
                    >
                        <div>
                            <button className="btn btn-default btn-xs" >
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

    public render() {
        let width: number | undefined;
        if (this.props.isTwoGroupAnalysis) {
            width = 600;
        }
        return (
            <div data-test="ClinicalTabPlotDiv" className="borderedChart" style={{ width, overflow: "hidden" }}>
                <ScrollBar style={{ top: -5 }} getScrollEl={this.getScrollPane} />
                {this.toolbar}
                <div ref={this.assignScrollPaneRef} style={{ position: "relative", display: "inline-block" }}>
                    <MultipleCategoryBarPlot
                        svgId={SVG_ID}
                        barWidth={this.props.isTwoGroupAnalysis ? 10 : 20}
                        domainPadding={this.props.isTwoGroupAnalysis ? 10 : 20}
                        chartBase={300}
                        axisLabelX="Genes"
                        axisLabelY="Group"
                        legendLocationWidthThreshold={800}
                        ticksCount={6}
                        horizontalBars={false}
                        percentage={false}
                        stacked={false}
                        plotData={this.barPlotData}
                        axisStyle={{ tickLabels: { fontSize: 10 } }}
                        horzCategoryOrder={this.barPlotOrderedGenes}
                        vertCategoryOrder={this.props.groupOrder}
                        countAxisLabel="percentages"
                        tooltip={this.getTooltip}
                    />
                </div>
            </div>
        );
    }
}

interface IGeneSelectionProps {
    options: { label: string, value: string }[];
    selectedValue: string
    onSelectedGenesChange: (value: string, orderedGenes: string[]) => void
}

@observer
class GenesSelection extends React.Component<IGeneSelectionProps, {}> {

    @observable _geneQuery: string | undefined;
    @observable selectedGenes: string[] | undefined;
    @observable selectedGenesHasError = false;
    private genesToPlot: string[] = [];

    @computed get selectedGeneListOption() {
        if (this.selectedGenes === undefined && this._geneQuery === undefined) {
            return this.props.options.find(opt => opt.value == this.props.selectedValue);
        }
        return this.props.options.find(opt => opt.value == this._geneQuery) || USER_DEFINED_OPTION;
    }

    @computed get geneQuery() {
        return this._geneQuery === undefined ? this.props.selectedValue : this._geneQuery;
    }

    @autobind
    @action
    private onChangeGeneInput(
        oql: { query: SingleGeneQuery[], error?: any },
        genes: { found: Gene[]; suggestions: any; },
        queryStr: string
    ) {
        const foundGenes = _.keyBy(genes.found, gene => gene.hugoGeneSymbol.toUpperCase());
        const queriedGenes = _.map(oql.query, query => query.gene.toUpperCase())
        this.selectedGenesHasError = !_.every(queriedGenes, gene => gene in foundGenes)
        if (!this.selectedGenesHasError) {
            this.genesToPlot = queriedGenes
        }
        this._geneQuery = queryStr
    }

    @computed get addGenesButtonDisabled() {
        return this.props.selectedValue === this._geneQuery || this.selectedGenesHasError || _.isEmpty(this._geneQuery)
    }

    public render() {
        return (
            <div style={{ width: 300 }}>
                {
                    this.props.options.length > 0 && <ReactSelect
                        value={this.selectedGeneListOption}
                        options={this.props.options}
                        onChange={(option: any) => this._geneQuery = option ? option.value : ''}
                        isClearable={false}
                        isSearchable={false}
                    />
                }
                <br />
                <GeneSelectionBox
                    inputGeneQuery={this.geneQuery}
                    callback={this.onChangeGeneInput}
                    location={GeneBoxType.ONCOPRINT_HEATMAP}
                />
                <button
                    key="addGenestoBarPlot"
                    className="btn btn-sm btn-default"
                    onClick={() => {
                        this.selectedGenes = this.genesToPlot;
                        this.props.onSelectedGenesChange(this._geneQuery!, this.genesToPlot);
                    }}
                    disabled={this.addGenesButtonDisabled}
                >Submit</button>
            </div>
        );
    }
}
