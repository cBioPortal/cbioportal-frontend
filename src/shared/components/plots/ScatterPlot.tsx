import _ from 'lodash';
import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import bind from 'bind-decorator';
import { computed, observable } from 'mobx';
import CBIOPORTAL_VICTORY_THEME, {
    baseLabelStyles,
    legendLabelStyles,
} from '../../theme/cBioPoralTheme';
import Timer = NodeJS.Timer;
import {
    VictoryChart,
    VictoryAxis,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
    VictoryLine,
} from 'victory';
import jStat from 'jStat';
import ScatterPlotTooltip from './ScatterPlotTooltip';
import { tickFormatNumeral } from './TickUtils';
import {
    computeCorrelationPValue,
    makeScatterPlotSizeFunction,
    separateScatterDataByAppearance,
    dataPointIsLimited,
    LegendDataWithId,
    getLegendDataHeight,
    getBottomLegendHeight,
    getMaxLegendLabelWidth,
    getLegendItemsPerRow,
} from './PlotUtils';
import { clamp, toConditionalPrecision } from '../../lib/NumberUtils';
import { getRegressionComputations } from './ScatterPlotUtils';
import {
    IAxisLogScaleParams,
    IPlotSampleData,
} from 'pages/resultsView/plots/PlotsTabUtils';
import ifNotDefined from '../../lib/ifNotDefined';
import {
    getTextHeight,
    getTextWidth,
    wrapText,
} from 'cbioportal-frontend-commons';
import LegendDataComponent from './LegendDataComponent';
import LegendLabelComponent from './LegendLabelComponent';

export interface IBaseScatterPlotData {
    x: number;
    y: number;
}

export interface IScatterPlotProps<D extends IBaseScatterPlotData> {
    svgId?: string;
    title?: string;
    data: D[];
    chartWidth: number;
    chartHeight: number;
    highlight?: (d: D) => boolean;
    fill?: string | ((d: D) => string);
    stroke?: string | ((d: D) => string);
    size?:
        | number
        | ((d: D, active: boolean, isHighlighted?: boolean) => number);
    fillOpacity?: number | ((d: D) => number);
    strokeOpacity?: number | ((d: D) => number);
    strokeWidth?: number | ((d: D) => number);
    zIndexSortBy?: ((d: D) => any)[]; // second argument to _.sortBy
    symbol?: string | ((d: D) => string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    tooltip?: (d: D) => JSX.Element;
    legendData?: LegendDataWithId<D>[];
    correlation?: {
        pearson: number;
        spearman: number;
    };
    showRegressionLine?: boolean;
    logX?: IAxisLogScaleParams | undefined;
    logY?: IAxisLogScaleParams | undefined;
    excludeLimitValuesFromCorrelation?: boolean; // if true, data points that are beyond threshold (e.g., '>8', have a `xThresholdType` or `yThresholdType` attribute) are not included in caluculation of the corr. efficient
    useLogSpaceTicks?: boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    axisLabelX?: string;
    axisLabelY?: string;
    fontFamily?: string;
    legendTitle?: string | string[];
}
// constants related to the gutter
const GUTTER_TEXT_STYLE = {
    fontFamily: baseLabelStyles.fontFamily,
    fontSize: baseLabelStyles.fontSize,
};
const LEGEND_COLUMN_PADDING = 45;
const CORRELATION_INFO_Y = 100; // experimentally determined
const REGRESSION_STROKE = '#c43a31';
const REGRESSION_STROKE_WIDTH = 2;
const REGRESSION_EQUATION_Y = CORRELATION_INFO_Y + 95; // 95 ~= correlation height
const LEGEND_TEXT_WIDTH = 107; // experimentally determined

const DEFAULT_FONT_FAMILY = 'Verdana,Arial,sans-serif';
const RIGHT_GUTTER = 120; // room for correlation info and legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 50;
const LEFT_PADDING = 25;

@observer
export default class ScatterPlot<
    D extends IBaseScatterPlotData
> extends React.Component<IScatterPlotProps<D>, {}> {
    @observable.ref tooltipModel: any | null = null;
    @observable pointHovered: boolean = false;
    private mouseEvents: any = this.makeMouseEvents();

    @observable.ref private container: HTMLDivElement;

    @bind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    private makeMouseEvents() {
        let disappearTimeout: Timer | null = null;
        const disappearDelayMs = 250;

        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    this.tooltipModel = props;
                                    this.pointHovered = true;

                                    if (disappearTimeout !== null) {
                                        clearTimeout(disappearTimeout);
                                        disappearTimeout = null;
                                    }

                                    return { active: true };
                                },
                            },
                        ];
                    },
                    onMouseOut: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    if (disappearTimeout !== null) {
                                        clearTimeout(disappearTimeout);
                                    }

                                    disappearTimeout = setTimeout(() => {
                                        this.pointHovered = false;
                                    }, disappearDelayMs);

                                    return { active: false };
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    @computed get fontFamily() {
        return this.props.fontFamily || DEFAULT_FONT_FAMILY;
    }

    private get title() {
        if (this.props.title) {
            const text = wrapText(
                this.props.title,
                this.props.chartWidth,
                this.fontFamily,
                '14px'
            );
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: this.fontFamily,
                        textAnchor: 'middle',
                    }}
                    x={this.props.chartWidth / 2}
                    y="1.2em"
                    text={text}
                />
            );
        } else {
            return null;
        }
    }

    @computed get sideLegendX() {
        return this.props.chartWidth - 20;
    }

    @computed get sideLegendY() {
        const correlationInfo = 90;
        const regressionEqation = 45;

        if (this.props.showRegressionLine) {
            return CORRELATION_INFO_Y + correlationInfo + regressionEqation;
        } else {
            return CORRELATION_INFO_Y + correlationInfo;
        }
    }

    @computed get legendLocation() {
        if (this.props.legendData && this.props.legendData.length > 7) {
            return 'bottom';
        } else {
            return 'right';
        }
    }

    @computed get bottomLegendHeight() {
        if (
            !this.props.legendData ||
            !this.props.legendData.length ||
            this.legendLocation !== 'bottom'
        ) {
            return 0;
        } else {
            return getBottomLegendHeight(
                this.legendItemsPerRow,
                this.props.legendData,
                this.props.legendTitle
            );
        }
    }

    @computed get maxLegendLabelWidth() {
        if (this.props.legendData) {
            return getMaxLegendLabelWidth(this.props.legendData);
        }

        return 0;
    }

    @computed get legendItemsPerRow() {
        return getLegendItemsPerRow(
            this.maxLegendLabelWidth,
            this.svgWidth,
            LEGEND_COLUMN_PADDING,
            this.props.legendTitle
        );
    }

    private get legend() {
        if (this.props.legendData && this.props.legendData.length) {
            let legendData = this.props.legendData;
            if (this.legendLocation === 'bottom') {
                // if legend is at bottom then flatten labels
                legendData = legendData.map(x => {
                    let { name, ...rest } = x;
                    if (Array.isArray(name)) {
                        name = (name as string[]).join(' '); // flatten labels by joining with space
                    }
                    return {
                        name,
                        ...rest,
                    };
                });
            }
            const orientation =
                this.legendLocation === 'right' ? 'vertical' : 'horizontal';

            return (
                <VictoryLegend
                    dataComponent={
                        <LegendDataComponent orientation={orientation} />
                    }
                    labelComponent={
                        <LegendLabelComponent orientation={orientation} />
                    }
                    events={[
                        {
                            childName: 'all',
                            target: ['data', 'labels'],
                            eventHandlers: {
                                onClick: () => [
                                    {
                                        target: 'data',
                                        mutation: (props: any) => {
                                            const datum: LegendDataWithId<D> =
                                                props.data[props.index];
                                            if (datum.highlighting) {
                                                datum.highlighting.onClick(
                                                    datum
                                                );
                                            }
                                        },
                                    },
                                ],
                            },
                        },
                    ]}
                    orientation={orientation}
                    itemsPerRow={
                        this.legendLocation === 'right'
                            ? undefined
                            : this.legendItemsPerRow
                    }
                    rowGutter={this.legendLocation === 'right' ? undefined : -5}
                    gutter={
                        this.legendLocation === 'right'
                            ? undefined
                            : LEGEND_COLUMN_PADDING
                    }
                    data={legendData}
                    x={this.legendLocation === 'right' ? this.sideLegendX : 0}
                    y={
                        this.legendLocation === 'right'
                            ? this.sideLegendY
                            : this.svgHeight - this.bottomLegendHeight
                    }
                    title={this.props.legendTitle}
                    titleOrientation={
                        this.legendLocation === 'right' ? 'top' : 'left'
                    }
                    style={{
                        title: {
                            fontSize: 15,
                            fontWeight: 'bold',
                        },
                    }}
                    titleComponent={
                        <VictoryLabel
                            dx={this.legendLocation === 'right' ? 0 : -10}
                        />
                    }
                />
            );
        } else {
            return null;
        }
    }

    private get correlationInfo() {
        const x = this.sideLegendX;
        return (
            <g>
                <VictoryLabel
                    x={x + LEGEND_TEXT_WIDTH}
                    y={CORRELATION_INFO_Y}
                    textAnchor="end"
                    text={`Spearman: ${this.spearmanCorr.toFixed(2)}`}
                    style={GUTTER_TEXT_STYLE}
                />
                {this.spearmanPval !== null && (
                    <VictoryLabel
                        x={x + LEGEND_TEXT_WIDTH}
                        y={CORRELATION_INFO_Y}
                        textAnchor="end"
                        dy="2"
                        text={`(p = ${toConditionalPrecision(
                            this.spearmanPval,
                            3,
                            0.01
                        )})`}
                        style={GUTTER_TEXT_STYLE}
                    />
                )}
                <VictoryLabel
                    x={x + LEGEND_TEXT_WIDTH}
                    y={CORRELATION_INFO_Y}
                    textAnchor="end"
                    dy="5"
                    text={`Pearson: ${this.pearsonCorr.toFixed(2)}`}
                    style={GUTTER_TEXT_STYLE}
                />
                {this.pearsonPval !== null && (
                    <VictoryLabel
                        x={x + LEGEND_TEXT_WIDTH}
                        y={CORRELATION_INFO_Y}
                        textAnchor="end"
                        dy="7"
                        text={`(p = ${toConditionalPrecision(
                            this.pearsonPval,
                            3,
                            0.01
                        )})`}
                        style={GUTTER_TEXT_STYLE}
                    />
                )}
            </g>
        );
    }

    private get regressionLineEquation(): JSX.Element | null {
        if (!this.props.showRegressionLine) {
            return null;
        }

        const equation = this.regressionLineComputations.string;
        const r2 = `R² = ${this.regressionLineComputations.r2}`;
        const legendPadding = 10;
        const lineLength = 10;
        const linePadding = 7;

        return (
            <g>
                <line
                    stroke={REGRESSION_STROKE}
                    strokeWidth={REGRESSION_STROKE_WIDTH}
                    x1={this.sideLegendX + legendPadding}
                    y1={REGRESSION_EQUATION_Y}
                    x2={this.sideLegendX + legendPadding + lineLength}
                    y2={REGRESSION_EQUATION_Y}
                    dy="0"
                />
                <VictoryLabel
                    x={
                        this.sideLegendX +
                        legendPadding +
                        lineLength +
                        linePadding
                    }
                    y={REGRESSION_EQUATION_Y}
                    dy="0"
                    textAnchor="start"
                    text={equation}
                    style={GUTTER_TEXT_STYLE}
                />
                <VictoryLabel
                    x={
                        this.sideLegendX +
                        legendPadding +
                        lineLength +
                        linePadding
                    }
                    y={REGRESSION_EQUATION_Y}
                    dy="2"
                    textAnchor="start"
                    text={r2}
                    style={GUTTER_TEXT_STYLE}
                />
            </g>
        );
    }

    @computed get splitData() {
        // when limit values are shown in the legend, exclude
        // these points from calculations of correlation coefficients
        const data = this.props.excludeLimitValuesFromCorrelation
            ? _.filter(
                  this.props.data,
                  (d: IPlotSampleData) => !dataPointIsLimited(d)
              )
            : this.props.data;

        const x = [];
        const y = [];
        for (const d of data) {
            x.push(d.x);
            y.push(d.y);
        }
        return { x, y };
    }

    @computed get plotDomain() {
        // data extremes
        const max = {
            x: Number.NEGATIVE_INFINITY,
            y: Number.NEGATIVE_INFINITY,
        };
        const min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY,
        };
        for (const d of this.props.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        if (this.props.logX) {
            min.x = this.props.logX.fLogScale(min.x, 0);
            max.x = this.props.logX.fLogScale(max.x, 0);
        }
        if (this.props.logY) {
            min.y = this.props.logY.fLogScale(min.y, 0);
            max.y = this.props.logY.fLogScale(max.y, 0);
        }
        return {
            x: [min.x, max.x],
            y: [min.y, max.y],
        };
    }

    @computed get pearsonCorr() {
        if (this.props.correlation) {
            return this.props.correlation.pearson;
        } else {
            let x = this.splitData.x;
            let y = this.splitData.y;
            if (this.props.logX) {
                x = x.map(d => this.props.logX!.fLogScale(d, 0));
            }
            if (this.props.logY) {
                y = y.map(d => this.props.logY!.fLogScale(d, 0));
            }
            return jStat.corrcoeff(x, y);
        }
    }

    @computed get spearmanCorr() {
        if (this.props.correlation) {
            return this.props.correlation.spearman;
        } else {
            // spearman is invariant to monotonic increasing transformations, so we dont need to check about log
            return jStat.spearmancoeff(this.splitData.x, this.splitData.y);
        }
    }

    @computed get spearmanPval() {
        return computeCorrelationPValue(
            this.spearmanCorr,
            this.splitData.x.length
        );
    }

    @computed get pearsonPval() {
        return computeCorrelationPValue(
            this.pearsonCorr,
            this.splitData.x.length
        );
    }

    @computed get rightPadding() {
        if (
            this.props.legendData &&
            this.props.legendData.length > 0 &&
            this.legendLocation === 'right'
        ) {
            // make room for legend
            return Math.max(RIGHT_GUTTER, this.maxLegendLabelWidth + 50); // + 50 makes room for circle and padding
        } else {
            return RIGHT_GUTTER;
        }
    }

    @computed get svgWidth() {
        return LEFT_PADDING + this.props.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        return this.props.chartHeight + this.bottomLegendHeight;
    }

    @bind
    private x(d: D) {
        if (this.props.logX) {
            return this.props.logX!.fLogScale(d.x, 0);
        } else {
            return d.x;
        }
    }

    @bind
    private y(d: D) {
        if (this.props.logY) {
            return this.props.logY!.fLogScale(d.y, 0);
        } else {
            return d.y;
        }
    }

    @computed get size() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return makeScatterPlotSizeFunction(highlight, size);
    }

    private tickFormat(
        t: number,
        ticks: number[],
        logScaleFunc: IAxisLogScaleParams | undefined
    ) {
        if (logScaleFunc && !this.props.useLogSpaceTicks) {
            t = logScaleFunc.fInvLogScale(t);
            ticks = ticks.map(x => logScaleFunc.fInvLogScale(x));
        }
        return tickFormatNumeral(t, ticks);
    }

    @bind
    private tickFormatX(t: number, i: number, ticks: number[]) {
        return this.tickFormat(t, ticks, this.props.logX);
    }

    @bind
    private tickFormatY(t: number, i: number, ticks: number[]) {
        return this.tickFormat(t, ticks, this.props.logY);
    }

    @computed get data() {
        return separateScatterDataByAppearance(
            this.props.data,
            ifNotDefined(this.props.fill, '0x000000'),
            ifNotDefined(this.props.stroke, '0x000000'),
            ifNotDefined(this.props.strokeWidth, 0),
            ifNotDefined(this.props.strokeOpacity, 1),
            ifNotDefined(this.props.fillOpacity, 1),
            ifNotDefined(this.props.symbol, 'circle'),
            this.props.zIndexSortBy
        );
    }

    @computed private get regressionLineComputations() {
        const data = this.props.data.map(
            d => [this.x(d), this.y(d)] as [number, number]
        );
        return getRegressionComputations(data);
    }

    private get regressionLine() {
        // when limit values are shown in the legend, exclude
        // these points from calculation of regression line
        const regressionData: D[] = this.props.excludeLimitValuesFromCorrelation
            ? _.filter(
                  this.props.data,
                  (d: IPlotSampleData) => !dataPointIsLimited(d)
              )
            : this.props.data;

        if (this.props.showRegressionLine && regressionData.length >= 2) {
            const regressionLineComputations = this.regressionLineComputations;
            const y = (x: number) => regressionLineComputations.predict(x)[1];
            const labelX = 0.7;
            const xPoints = [
                this.plotDomain.x[0],
                this.plotDomain.x[0] * (1 - labelX) +
                    this.plotDomain.x[1] * labelX,
                this.plotDomain.x[1],
            ];
            const data: any[] = xPoints.map(x => ({ x, y: y(x), label: '' }));
            return [
                <VictoryLine
                    style={{
                        data: {
                            stroke: REGRESSION_STROKE,
                            strokeWidth: REGRESSION_STROKE_WIDTH,
                        },
                        labels: {
                            fontSize: 15,
                            fill: '#000000',
                            stroke: '#ffffff',
                            strokeWidth: 6,
                            fontWeight: 'bold',
                            paintOrder: 'stroke',
                        },
                    }}
                    data={data}
                    labelComponent={<VictoryLabel lineHeight={1.3} />}
                />,
            ];
        } else {
            return null;
        }
    }

    @bind
    private getChart() {
        return (
            <div
                ref={this.containerRef}
                style={{ width: this.svgWidth, height: this.svgHeight }}
            >
                <svg
                    id={this.props.svgId || ''}
                    style={{
                        width: this.svgWidth,
                        height: this.svgHeight,
                        pointerEvents: 'all',
                    }}
                    height={this.svgHeight}
                    width={this.svgWidth}
                    role="img"
                    viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                >
                    <g transform={`translate(${LEFT_PADDING},0)`}>
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            width={this.props.chartWidth}
                            height={this.props.chartHeight}
                            standalone={false}
                            domainPadding={PLOT_DATA_PADDING_PIXELS}
                            singleQuadrantDomainPadding={false}
                        >
                            {this.title}
                            {this.legend}
                            <VictoryAxis
                                domain={this.plotDomain.x}
                                orientation="bottom"
                                offsetY={50}
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                tickFormat={this.tickFormatX}
                                axisLabelComponent={<VictoryLabel dy={25} />}
                                label={this.props.axisLabelX}
                            />
                            <VictoryAxis
                                domain={this.plotDomain.y}
                                offsetX={50}
                                orientation="left"
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                tickFormat={this.tickFormatY}
                                dependentAxis={true}
                                axisLabelComponent={<VictoryLabel dy={-35} />}
                                label={this.props.axisLabelY}
                            />
                            {this.data.map(dataWithAppearance => (
                                <VictoryScatter
                                    key={`${dataWithAppearance.fill},${dataWithAppearance.stroke},${dataWithAppearance.strokeWidth},${dataWithAppearance.strokeOpacity},${dataWithAppearance.fillOpacity},${dataWithAppearance.symbol}`}
                                    style={{
                                        data: {
                                            fill: dataWithAppearance.fill,
                                            stroke: dataWithAppearance.stroke,
                                            strokeWidth:
                                                dataWithAppearance.strokeWidth,
                                            strokeOpacity:
                                                dataWithAppearance.strokeOpacity,
                                            fillOpacity:
                                                dataWithAppearance.fillOpacity,
                                        },
                                    }}
                                    size={this.size}
                                    symbol={dataWithAppearance.symbol}
                                    data={dataWithAppearance.data}
                                    events={this.mouseEvents}
                                    x={this.x}
                                    y={this.y}
                                />
                            ))}
                            {this.regressionLine}
                        </VictoryChart>
                        {this.correlationInfo}
                        {this.regressionLineEquation}
                    </g>
                </svg>
            </div>
        );
    }

    render() {
        if (!this.props.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{
                            x: this.tooltipModel.x + LEFT_PADDING,
                            y: this.tooltipModel.y,
                        }}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}
