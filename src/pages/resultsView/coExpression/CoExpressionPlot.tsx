import * as React from "react";
import {
    VictoryAxis,
    VictoryChart,
    VictoryContainer,
    VictoryLabel,
    VictoryLegend,
    VictoryScatter,
    VictoryTheme,
    VictoryTooltip
} from "victory";
import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {action, computed, observable} from "mobx";
import {observer, Observer} from "mobx-react";
import {MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";
import {AlterationTypeConstants} from "../ResultsViewPageStore";
import SvgSaver from "svgsaver";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import {getSampleViewUrl} from "../../../shared/api/urls";
import "./styles.scss";
import {bind} from "bind-decorator";
import ScatterPlot from "../../../shared/components/plots/ScatterPlot";
import Timer = NodeJS.Timer;
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";
import {axisLabel, isNotProfiled} from "./CoExpressionPlotUtils";
import _ from "lodash";

type GeneId = { hugoGeneSymbol:string, entrezGeneId: number, cytoband:string};

export interface ICoExpressionPlotProps {
    xAxisGene:GeneId;
    yAxisGene:GeneId;
    data:CoExpressionPlotData[];
    coExpression:CoExpression;
    molecularProfile:MolecularProfile;

    height:number;
    width:number;

    showLogScaleControls?:boolean;
    showMutationControls?:boolean;
    showMutations?:boolean;
    logScale?:boolean;
    handlers:{
        onClickShowMutations?:()=>void,
        onClickLogScale?:()=>void,
    }
}


export type CoExpressionPlotData = {
    x:number,
    y:number,
    mutationsX:string,
    mutationsY:string,
    profiledX:boolean,
    profiledY:boolean,
    studyId:string,
    sampleId:string
};

class CoExpressionScatterPlot extends ScatterPlot<CoExpressionPlotData>{}

const NO_MUT_STROKE = "#0174df";
const NO_MUT_FILL = "#58acfa";
const X_MUT_STROKE = "#886A08";
const X_MUT_FILL = "#DBA901";
const Y_MUT_STROKE = "#F7819F";
const Y_MUT_FILL = "#F5A9F2";
const BOTH_MUT_STROKE = "#B40404";
const BOTH_MUT_FILL = "#FF0000";
const NOT_PROFILED_STROKE = "#d3d3d3";
const NOT_PROFILED_FILL = "#ffffff";

function noop() {};

const SVG_ID = "coexpression-plot-svg";

@observer
export default class CoExpressionPlot extends React.Component<ICoExpressionPlotProps, {}> {

    @bind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @computed get stroke() {
        if (this.props.showMutations) {
            return (d:{mutationsX:string, mutationsY:string, profiledX:boolean, profiledY:boolean})=>{
                if (isNotProfiled(d)) {
                    return NOT_PROFILED_STROKE;
                } else if (d.mutationsX && d.mutationsY) {
                    return BOTH_MUT_STROKE;
                } else if (!d.mutationsX && !d.mutationsY) {
                    return NO_MUT_STROKE;
                } else if (d.mutationsX) {
                    return X_MUT_STROKE;
                } else {
                    return Y_MUT_STROKE;
                }
            };
        } else {
            return NO_MUT_STROKE;
        }
    }

    @computed get fill() {
        if (this.props.showMutations) {
            return (d:{mutationsX:string, mutationsY:string, profiledX:boolean, profiledY:boolean})=>{
                if (isNotProfiled(d)) {
                    return NOT_PROFILED_FILL;
                } else if (d.mutationsX && d.mutationsY) {
                    return BOTH_MUT_FILL;
                } else if (!d.mutationsX && !d.mutationsY) {
                    return NO_MUT_FILL;
                } else if (d.mutationsX) {
                    return X_MUT_FILL;
                } else {
                    return Y_MUT_FILL;
                }
            };
        } else {
            return NO_MUT_FILL;
        }
    }

    @computed get mutationLegendElements() {
        if (!this.props.showMutations) {
            return [];
        }
        let hasBoth = false;
        let hasX = false;
        let hasY = false;
        let hasNone = false;
        let hasNotProfiled = false;
        for (const d of this.data) {
            if (isNotProfiled(d)) {
                hasNotProfiled = true;
            }
            if (d.mutationsX && d.mutationsY) {
                hasBoth = true;
            } else if (!d.mutationsX && !d.mutationsY) {
                hasNone = true;
            } else if (d.mutationsX) {
                hasX = true;
            } else {
                hasY = true;
            }
        }

        const ret = [];
        if (hasX) {
            ret.push({
                name: [this.props.xAxisGene.hugoGeneSymbol, "mutated"],
                symbol: { fill: X_MUT_FILL, stroke: X_MUT_STROKE }
            });
        }
        if (hasY) {
            ret.push({
                name: [this.props.yAxisGene.hugoGeneSymbol, "mutated"],
                symbol: { fill: Y_MUT_FILL, stroke: Y_MUT_STROKE }
            });
        }
        if (hasBoth) {
            ret.push({
                name: `Both mutated`,
                symbol: { fill: BOTH_MUT_FILL, stroke: BOTH_MUT_STROKE }
            });
        }
        if (hasNone) {
            ret.push({
                name: `Neither mutated`,
                symbol: { fill: NO_MUT_FILL, stroke: NO_MUT_STROKE }
            });
        }
        if (hasNotProfiled) {
            ret.push({
                name: "Not profiled for mutations",
                symbol: { fill: NOT_PROFILED_FILL, stroke: NOT_PROFILED_STROKE }
            });
        }
        return ret;
    }

    @computed get data() {
        // sort in order to set z index in plot
        // order: both mutated, one mutated, neither mutated, not profiled
        return _.sortBy(this.props.data, d=>{
            if (d.mutationsX && d.mutationsY) {
                return 3;
            } else if (d.mutationsX || d.mutationsY) {
                return 2;
            } else if (!isNotProfiled(d)) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    private get title() {
        return `${this.props.molecularProfile.name}: ${this.props.xAxisGene.hugoGeneSymbol} vs. ${this.props.yAxisGene.hugoGeneSymbol}`;
    }

    @computed get axisLabelX() {
        return axisLabel(this.props.xAxisGene, !!this.props.logScale);
    }

    @computed get axisLabelY() {
        return axisLabel(this.props.yAxisGene, !!this.props.logScale);
    }

    @bind
    private plot() {
        if (!this.data.length) {
            return <span>No data to plot.</span>;
        }
        return (
            <CoExpressionScatterPlot
                svgId={SVG_ID}
                title={this.title}
                data={this.data}
                chartWidth={this.props.width}
                chartHeight={this.props.height}
                stroke={this.stroke}
                fill={this.fill}
                strokeWidth={1.2}
                legendData={this.mutationLegendElements}
                correlation={{
                    pearson: this.props.coExpression.pearsonsCorrelation,
                    spearman: this.props.coExpression.spearmansCorrelation
                }}
                logX={this.props.logScale}
                logY={this.props.logScale}
                useLogSpaceTicks={true}
                axisLabelX={this.axisLabelX}
                axisLabelY={this.axisLabelY}
                tooltip={this.tooltip}
                fontFamily="Arial,Helvetica"
            />
        );
    }

    @bind
    private toolbar() {
        return (
            <div style={{textAlign:"center", position:"relative"}}>
                <div style={{display:"inline-block"}}>
                    {this.props.showMutationControls && (
                        <div className="checkbox coexpression-plot-toolbar-elt"><label>
                            <input
                                type="checkbox"
                                checked={this.props.showMutations}
                                onClick={this.props.handlers.onClickShowMutations || noop}
                                data-test="ShowMutations"
                            />Show Mutations
                        </label></div>
                    )}
                    {this.props.showLogScaleControls && (
                        <div className="coexpression-plot-toolbar-elt">
                            <div className="checkbox coexpression-plot-toolbar-elt"><label>
                                <input
                                    type="checkbox"
                                    checked={this.props.logScale}
                                    onClick={this.props.handlers.onClickLogScale || noop}
                                    data-test="logScale"
                                />Log Scale
                            </label></div>
                        </div>
                    )}
                </div>

                <DownloadControls
                    getSvg={this.getSvg}
                    filename="coexpression"
                    dontFade={true}
                    collapse={true}
                    style={{position:"absolute", top:0, right:0}}
                />

            </div>
        );
    }

    @bind
    private tooltip(d:CoExpressionPlotData) {
        return (
            <div>
                <div>
                    <span>Sample ID: </span>
                    <a href={getSampleViewUrl(d.studyId, d.sampleId)}>
                        {d.sampleId}
                    </a>
                </div>
                <div>
                    <span>
                        {this.props.xAxisGene.hugoGeneSymbol}:&nbsp;
                        <b>{d.x.toFixed(2)}</b>
                    </span>
                </div>
                <div>
                    <span>
                        {this.props.yAxisGene.hugoGeneSymbol}:&nbsp;
                        <b>{d.y.toFixed(2)}</b>
                    </span>
                </div>
                {d.mutationsX && (
                    <div>
                        <span>
                            {this.props.xAxisGene.hugoGeneSymbol} Mutation:&nbsp;
                            <b>{d.mutationsX}</b>
                        </span>
                    </div>
                )}
                {d.mutationsY && (
                    <div>
                        <span>
                            {this.props.yAxisGene.hugoGeneSymbol} Mutation:&nbsp;
                            <b>{d.mutationsY}</b>
                        </span>
                    </div>
                )}
            </div>
        );
    }

    render() {
        return (
            <div className="borderedChart" data-test="CoExpressionPlot">
                <Observer>
                    {this.toolbar}
                </Observer>
                <Observer>
                    {this.plot}
                </Observer>
            </div>
        );
    }
}