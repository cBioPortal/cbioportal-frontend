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
import { PlotType, plotTypeOptions } from 'pages/groupComparison/ClinicalData';
import styles from "./frequencyPlotStyles.module.scss";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';

export interface IGeneBarPlotProps {
    data: AlterationEnrichmentRow[];
    groupOrder?: string[]
    isTwoGroupAnalysis?: boolean
}

const SVG_ID = "GroupComparisonGeneFrequencyPlot";

@observer
export default class GeneBarPlot extends React.Component<IGeneBarPlotProps, {}> {

    @observable tooltipModel: any;
    @observable _geneQuery: string | undefined;
    @observable selectedGenes: string[] | undefined;
    @observable plotType: PlotType = PlotType.Bar;

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

    @computed get barPlotData() {
        return getEnrichmentBarPlotData(this.props.data, this.barPlotOrderedGenes);
    }

    @computed get barPlotOrderedGenes() {
        let genes: string[] = [];
        if (!this.selectedGenes) {
            genes = this.defaultOption.value.split(/\s+/g);
        } else {
            genes = this.selectedGenes;
        }
        return genes;
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
    @action
    private onPlotTypeSelect(option: any) {
        this.plotType = option.value
    }

    @computed get selectedPlotType() {
        return plotTypeOptions.find(option => option.value === this.plotType);
    }

    @computed get toolbar() {
        return (
            <div style={{ zIndex: 10, position: "absolute", top: "10px", right: "10px" }}>
                <div className={styles.ChartControls}>
                    <ReactSelect
                        name="gene-frequency-plot-type"
                        placeholder={"Plot Type"}
                        value={this.selectedPlotType}
                        onChange={this.onPlotTypeSelect}
                        options={plotTypeOptions}
                        isClearable={false}
                        isSearchable={false}
                        styles={{
                            container: (provided: any) => ({
                                ...provided,
                                height: 22,
                                minHeight: 22,
                                width: 175
                            }),
                            control: (provided: any) => ({
                                ...provided,
                                height: 22,
                                minHeight: 22
                            }),
                            indicatorsContainer: (provided: any) => ({
                                ...provided,
                                height: 20
                            }),
                            indicatorSeparator: (provided: any) => ({
                                ...provided,
                                margin: 0
                            }),
                            placeholder: (provided: any) => ({
                                ...provided,
                                fontSize: 10
                            }),
                            valueContainer: (provided: any) => ({
                                ...provided,
                                padding: "0px 8px"
                            })
                        }}
                    />
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
                                Select Genes
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
        const isPercentage = this.plotType === PlotType.PercentageStackedBar;
        const isStacked = isPercentage || this.plotType === PlotType.StackedBar;
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
                        percentage={isPercentage}
                        stacked={isStacked}
                        plotData={this.barPlotData}
                        axisStyle={{ tickLabels: { fontSize: 10 } }}
                        horzCategoryOrder={this.barPlotOrderedGenes}
                        vertCategoryOrder={this.props.groupOrder}
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
        queryStr: string,
        status: "pending" | "error" | "complete") {
        if (status === "complete") {
            const foundGenes = _.keyBy(genes.found, gene => gene.hugoGeneSymbol.toUpperCase());
            const queriedGenes = _.map(oql.query, query => query.gene.toUpperCase())
            this.selectedGenesHasError = !_.every(queriedGenes, gene => gene in foundGenes)
            if (!this.selectedGenesHasError) {
                this.genesToPlot = queriedGenes
            }
            this._geneQuery = queryStr
        }
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
