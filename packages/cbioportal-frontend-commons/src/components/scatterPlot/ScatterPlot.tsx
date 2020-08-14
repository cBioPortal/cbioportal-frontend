import autobind from 'autobind-decorator';
import _ from 'lodash';
import { computed, observable } from 'mobx';
import { Observer, observer } from 'mobx-react';
import * as React from 'react';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLegend,
    VictoryScatter,
} from 'victory';

import {
    calcPlotBottomPadding,
    calcPlotDiagonalPadding,
    calcPlotLeftPadding,
} from '../../lib/PlotUtils';
import { default as VictorySelectionContainerWithLegend } from '../victory/VictorySelectionContainerWithLegend';
import GradientLegend, {
    TITLE_DX,
    TITLE_DY,
} from '../gradientLegend/GradientLegend';
import LinearGradient from '../gradientLegend/LinearGradient';
import ScatterPlotTooltip from './ScatterPlotTooltip';
import { ScatterPlotTooltipHelper } from './ScatterPlotTooltipHelper';

export interface IScatterPlotDatum {
    x: string;
    y: string;
    datum: any;
}

export interface IScatterPlotProps {
    data: IScatterPlotDatum[];
    width: number;
    height: number;
    domainPadding?: number;
    legendPadding?: number;
    legendFontSize?: number;
    plotPadding?: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    gradientLegendProps?: {
        colors: string[];
        title: string;
        width: number;
        height: number;
        min: number;
        max: number;
    };
    discreteLegendProps?: {
        title: string | string[];
        data: {
            name: string;
            symbol?: {
                fill?: string;
                type?: string;
                size?: number;
            };
            labels?: {
                fill?: string;
                fontSize?: number;
            };
        }[];
    };
    axisLabelTiltAngle?: number;
    disableSelection?: boolean;
    xCategoriesCompare?: (a: string, b: string) => number;
    yCategoriesCompare?: (a: string, b: string) => number;
    theme: {
        axis: {
            style: {
                tickLabels: {
                    fontFamily: string;
                    fontSize: number;
                };
            };
        };
    };
    tooltip?: (d: IScatterPlotDatum) => JSX.Element;
    plotStyle?: any;
    containerStyle?: React.CSSProperties;
    dataComponentSize?: number | ((d: IScatterPlotDatum) => number);
    dataComponentSymbol?: string | ((d: IScatterPlotDatum) => string);
}

const GRADIENT_ID = 'scatterPlotLinearGradient';

@observer
export class ScatterPlot extends React.Component<IScatterPlotProps, {}> {
    public static defaultProps: Partial<IScatterPlotProps> = {
        axisLabelTiltAngle: 50,
        disableSelection: true,
        domainPadding: 15,
        legendPadding: 20,
        legendFontSize: 11,
        gradientLegendProps: {
            title: 'Legend',
            colors: ['#000', '#FFF'],
            width: 10,
            height: 200,
            min: 0,
            max: 1,
        },
        // existing padding calculation is not perfect,
        // additional constant padding needed to prevent text truncation
        plotPadding: {
            left: 20,
            right: 40,
            top: 20,
            bottom: 20,
        },
    };

    @observable.ref private container: HTMLDivElement;
    private tooltipHelper: ScatterPlotTooltipHelper = new ScatterPlotTooltipHelper();

    get mouseEvents() {
        return this.tooltipHelper.mouseEvents;
    }

    get tooltipModel() {
        return this.tooltipHelper.tooltipModel;
    }

    get pointHovered() {
        return this.tooltipHelper.pointHovered;
    }

    @computed
    get xCategories(): string[] {
        return _.uniq(this.props.data.map(d => d.x)).sort(
            this.props.xCategoriesCompare
        );
    }

    @computed
    get yCategories(): string[] {
        return _.uniq(this.props.data.map(d => d.y)).sort(
            this.props.yCategoriesCompare
        );
    }

    @computed
    get bottomPadding(): number {
        return (
            calcPlotBottomPadding(
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.xCategories,
                this.props.axisLabelTiltAngle
            ) + this.props.plotPadding!.bottom
        );
    }

    @computed
    get leftPadding(): number {
        return (
            calcPlotLeftPadding(
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.yCategories
            ) + this.props.plotPadding!.left
        );
    }

    @computed
    get rightPadding(): number {
        return (
            calcPlotDiagonalPadding(
                _.last(this.xCategories) || '',
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.props.axisLabelTiltAngle
                    ? 90 - this.props.axisLabelTiltAngle
                    : undefined
            ) + this.props.plotPadding!.right
        );
    }

    @computed
    get padding() {
        return {
            left: this.leftPadding,
            right: this.rightPadding,
            top: this.props.plotPadding!.top,
            bottom: this.bottomPadding,
        };
    }

    @computed
    get gradient() {
        return (
            <LinearGradient
                id={GRADIENT_ID}
                colors={this.props.gradientLegendProps!.colors}
            />
        );
    }

    @computed
    get gradientLegend() {
        const {
            title,
            width,
            height,
            min,
            max,
        } = this.props.gradientLegendProps!;

        const x =
            this.props.width - this.padding.right + this.props.legendPadding!;
        const y = this.padding.top;

        return (
            <GradientLegend
                gradientId={GRADIENT_ID}
                x={x}
                y={y}
                title={title}
                width={width}
                height={height}
                min={min}
                max={max}
                fontSize={this.props.legendFontSize}
            />
        );
    }

    @computed
    get discreteLegend() {
        const x =
            this.props.width - this.padding.right + this.props.legendPadding!;
        const y =
            this.padding.top +
            this.props.gradientLegendProps!.height +
            this.props.legendPadding! -
            TITLE_DY;

        return this.props.discreteLegendProps ? (
            <VictoryLegend
                x={x}
                y={y}
                titleComponent={<VictoryLabel dx={TITLE_DX} />}
                centerTitle={true}
                orientation="vertical"
                rowGutter={-5}
                symbolSpacer={5}
                title={this.props.discreteLegendProps.title}
                style={{
                    title: {
                        fontSize: this.props.legendFontSize,
                        padding: 0,
                    },
                }}
                data={this.props.discreteLegendProps.data.map(d => {
                    // set default legend font size if not provided
                    const labels = d.labels || {};
                    const fontSize =
                        labels.fontSize || this.props.legendFontSize;

                    return {
                        ...d,
                        labels: {
                            ...labels,
                            fontSize,
                        },
                    };
                })}
            />
        ) : null;
    }

    get dataWithTooltip() {
        return this.props.tooltip
            ? this.props.data.map(d => ({
                  ...d,
                  label: this.props.tooltip!(d),
              }))
            : this.props.data;
        // return this.props.tooltip ? this.props.data.map(d => ({...d, label: d.datum})): this.props.data;
        // return this.props.tooltip ? this.props.data.map(d => ({...d, label: "d.datum"})): this.props.data;
    }

    public render() {
        return (
            <>
                <Observer>{this.getChart}</Observer>
                {this.tooltip}
            </>
        );
    }

    private get tooltip() {
        return this.container && this.tooltipModel && this.props.tooltip ? (
            <ScatterPlotTooltip
                container={this.container}
                targetHovered={this.pointHovered}
                targetCoords={{
                    x: this.tooltipModel.x,
                    y: this.tooltipModel.y,
                }}
                overlay={this.props.tooltip(this.tooltipModel.datum)}
            />
        ) : null;
    }

    @autobind
    private getChart() {
        return (
            <VictoryChart
                containerComponent={
                    <VictorySelectionContainerWithLegend
                        containerRef={this.containerRef}
                        disable={this.props.disableSelection}
                        legend={this.gradientLegend}
                        gradient={this.gradient}
                    />
                }
                style={{
                    parent: {
                        ...this.props.containerStyle,
                        width: this.props.width,
                        height: this.props.height,
                    },
                }}
                height={this.props.height}
                width={this.props.width}
                theme={this.props.theme}
                padding={this.padding}
                domainPadding={this.props.domainPadding}
            >
                {this.discreteLegend}
                <VictoryAxis
                    style={{
                        tickLabels: {
                            angle: this.props.axisLabelTiltAngle,
                            verticalAnchor: 'start',
                            textAnchor: 'start',
                        },
                    }}
                    crossAxis={true}
                />
                <VictoryAxis dependentAxis={true} crossAxis={true} />
                <VictoryScatter
                    events={this.mouseEvents}
                    categories={{
                        x: this.xCategories,
                        y: this.yCategories,
                    }}
                    data={this.props.data}
                    style={this.props.plotStyle}
                    size={this.props.dataComponentSize}
                    symbol={this.props.dataComponentSymbol}
                />
            </VictoryChart>
        );
    }

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }
}

export default ScatterPlot;
