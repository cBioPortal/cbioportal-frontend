import * as React from 'react';
import {
    VictoryBar,
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryTooltip,
} from 'victory';
import { action, computed } from 'mobx';
import { observer } from 'mobx-react';
import WindowStore from 'shared/components/window/WindowStore';

import _ from 'lodash';
import { IMutationalCounts } from 'shared/model/MutationalSignature';
import {
    getColorsForSignatures,
    ColorMapProps,
    colorMap,
    IColorDataBar,
    IColorLegend,
    getLegendEntriesBarChart,
    getxScalePoint,
    LegendLabelsType,
    DrawRectInfo,
    LabelInfo,
    getLengthLabelEntries,
    createLegendLabelObjects,
    formatLegendObjectsForRectangles,
    getCenterPositionLabelEntries,
} from './MutationalSignatureBarChartUtils';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';

export interface IMutationalBarChartProps {
    signature: string;
    width: number;
    height: number;
    refStatus: boolean;
    svgId: string;
    svgRef?: (svgContainer: SVGElement | null) => void;
    data: IMutationalCounts[];
    version: string;
    sample: string;
    label: string;
}

const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
theme.legend.style.data = {
    type: 'square',
    size: 5,
    strokeWidth: 0,
    stroke: 'black',
};

@observer
export default class MutationalBarChart extends React.Component<
    IMutationalBarChartProps,
    {}
> {
    constructor(props: IMutationalBarChartProps) {
        super(props);
    }

    @computed get xTickLabels(): string[] {
        return getColorsForSignatures(this.props.data).map(item => item.label);
    }

    @computed get yAxisDomain(): number[] {
        const maxValue = this.props.data.reduce(
            (previous: IMutationalCounts, current: IMutationalCounts) => {
                return current.value > previous.value ? current : previous;
            }
        );
        const minValue = this.props.data.reduce(
            (previous: IMutationalCounts, current: IMutationalCounts) => {
                return current.value < previous.value ? current : previous;
            }
        );
        return [minValue.value, maxValue.value + 0.1 * maxValue.value];
    }

    @computed get getGroupedData() {
        if (this.props.data[0].mutationalSignatureLabel != '') {
            return _.groupBy(getColorsForSignatures(this.props.data), 'group');
        } else {
            return this.props.data;
        }
    }
    @computed get getMutationalSignaturesGroupLabels(): string[] {
        return Object.keys(this.getGroupedData);
    }

    @computed get formatLegendTopAxisPoints() {
        const labelObjects = getColorsForSignatures(this.props.data).map(
            entry => ({
                group: entry.group,
                label: entry.label,
                color: entry.colorValue,
                subcategory: entry.subcategory,
            })
        );
        const legendObjects = getLegendEntriesBarChart(labelObjects);
        const lengthLegendObjects = getCenterPositionLabelEntries(
            legendObjects
        );
        const legendOjbectsToAdd = createLegendLabelObjects(
            lengthLegendObjects,
            legendObjects,
            this.getMutationalSignaturesGroupLabels
        );
        const centerOfBoxes = this.formatColorBoxLegend;
        const xScale = getxScalePoint(
            labelObjects,
            60,
            WindowStore.size.width - 90
        );
        return legendOjbectsToAdd.map((item, i) => {
            return (
                <VictoryLabel
                    x={
                        this.props.version != 'ID'
                            ? centerOfBoxes[i].props.x +
                              0.5 * centerOfBoxes[i].props.width
                            : xScale(item.value)
                    }
                    y={8}
                    width={this.props.width}
                    text={item.group}
                    style={{ fontSize: '13px', padding: 5 }}
                    textAnchor={'middle'}
                />
            );
        });
    }

    @computed get formatColorBoxLegend() {
        const legendLabels = getColorsForSignatures(this.props.data).map(
            entry => ({
                group: entry.group,
                label: entry.label,
                color: entry.colorValue,
                subcategory: entry.subcategory,
            })
        );
        const xScale = getxScalePoint(
            legendLabels,
            60,
            WindowStore.size.width - 90
        );
        const legendEntries = getLegendEntriesBarChart(legendLabels);
        const lengthLegendObjects = getLengthLabelEntries(legendEntries);
        const legendInfoBoxes = formatLegendObjectsForRectangles(
            lengthLegendObjects,
            legendEntries,
            this.getMutationalSignaturesGroupLabels,
            this.props.version
        );
        const legendRectsChart: JSX.Element[] = [];
        legendInfoBoxes.forEach((item: DrawRectInfo) => {
            legendRectsChart.push(
                <rect
                    x={xScale(item.start)! - 1}
                    y={15}
                    fill={item.color}
                    width={
                        xScale(item.end)! - xScale(item.start)! > 0
                            ? xScale(item.end)! - xScale(item.start)!
                            : 6
                    }
                    height="15"
                />
            );
        });
        return legendRectsChart;
    }

    @computed get getSubLabelsLegend() {
        const groupedData = _.groupBy(
            getColorsForSignatures(this.props.data),
            g => g.group
        );
        const legendLabels = getColorsForSignatures(this.props.data).map(
            entry => ({
                group: entry.group,
                label: entry.label,
                color: entry.colorValue,
                subcategory: entry.subcategory,
                value: entry.label,
            })
        );
        const uniqueSubLabels = legendLabels.filter(
            (value, index, self) =>
                index ===
                self.findIndex(
                    t =>
                        t.group === value.group &&
                        t.subcategory === value.subcategory
                )
        );

        const centerOfBoxes = this.formatColorBoxLegend;
        const subLabelsForBoxes = formatLegendObjectsForRectangles(
            [uniqueSubLabels.length],
            uniqueSubLabels,
            uniqueSubLabels.map(item => item.subcategory!),
            this.props.version
        );
        const legendLabelsChart: JSX.Element[] = [];
        subLabelsForBoxes.forEach((item: LabelInfo, i: number) => {
            legendLabelsChart.push(
                <VictoryLabel
                    x={
                        centerOfBoxes[i].props.x +
                        0.5 * centerOfBoxes[i].props.width
                    }
                    y={37}
                    width={this.props.width}
                    text={item.category}
                    style={{ fontSize: '10px' }}
                    textAnchor={'middle'}
                />
            );
        });
        return legendLabelsChart;
    }

    @action getLabelsForTooltip(data: IMutationalCounts[]): string[] {
        return getColorsForSignatures(data).map(item => item.label);
    }

    public render() {
        return (
            <div style={{ paddingTop: '10' }}>
                <svg
                    height={400}
                    width={WindowStore.size.width - 50}
                    xmlns="http://www.w3.org/2000/svg"
                    ref={this.props.svgRef}
                >
                    {this.formatLegendTopAxisPoints}
                    {this.formatColorBoxLegend}
                    {this.props.version == 'ID' && this.getSubLabelsLegend}
                    <g width={800}>
                        <VictoryChart
                            domainPadding={5}
                            standalone={false}
                            width={WindowStore.size.width - 50}
                            height={300}
                        >
                            <VictoryAxis
                                dependentAxis
                                label={this.props.label}
                                heigth={this.props.height}
                                domain={this.yAxisDomain}
                                style={{
                                    axis: { strokeWidth: 1 },
                                    axisLabel: {
                                        fontSize: '13px',
                                        padding:
                                            this.props.label ==
                                            'Mutational count (value)'
                                                ? 40
                                                : 35,
                                        letterSpacing: 'normal',
                                        fontFamily: 'Arial, Helvetica',
                                    },
                                    ticks: { size: 5, stroke: 'black' },
                                    tickLabels: {
                                        fontSize: '12px',
                                        padding: 2,
                                    },
                                    grid: {
                                        stroke: 'lightgrey',
                                        strokeWidth: 0.3,
                                        strokeDasharray: 10,
                                    },
                                }}
                                standalone={false}
                            />
                            <VictoryBar
                                barRatio={1.5}
                                barWidth={3}
                                width={this.props.width}
                                labels={this.getLabelsForTooltip(
                                    this.props.data
                                )}
                                labelComponent={
                                    <VictoryTooltip
                                        style={{ fontSize: '8px' }}
                                        cornerRadius={3}
                                        pointerLength={0}
                                        flyoutStyle={{
                                            stroke: '#bacdd8',
                                            strokeWidth: 1,
                                            fill: 'white',
                                        }}
                                    />
                                }
                                data={getColorsForSignatures(this.props.data)}
                                x="label"
                                y="value"
                                style={{
                                    data: {
                                        fill: (d: IColorDataBar) =>
                                            d.colorValue,
                                    },
                                }}
                                alignment="start"
                                standalone={false}
                            />
                            <VictoryAxis
                                tickValues={this.xTickLabels}
                                width={this.props.width}
                                style={{
                                    axisLabel: {
                                        fontSize: '10px',
                                        padding: 20,
                                    },
                                    tickLabels: {
                                        fontSize: '11',
                                        padding:
                                            this.xTickLabels[0].length > 6
                                                ? 55
                                                : 40,
                                        angle: 270,
                                        textAnchor: 'start',
                                        verticalAnchor: 'middle',
                                    },
                                    axis: { strokeWidth: 1 },
                                    grid: { stroke: 0 },
                                }}
                                standalone={false}
                            />
                        </VictoryChart>
                    </g>
                </svg>
            </div>
        );
    }
}
