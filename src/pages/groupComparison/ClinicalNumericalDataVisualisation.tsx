import BoxScatterPlot, {
    IBaseBoxScatterPlotPoint,
    IBoxScatterPlotData,
    IBoxScatterPlotProps,
    toBoxPlotData,
    toDataDescriptive,
} from 'shared/components/plots/BoxScatterPlot';
import { IBoxScatterPlotPoint } from 'shared/components/plots/PlotsTabUtils';
import React from 'react';
import ReactDOM from 'react-dom';
import { computed, makeObservable } from 'mobx';
import { BoxModel } from 'shared/components/plots/BoxScatterPlot';

import {
    DescriptiveDataTable,
    SummaryStatisticsTable,
} from './SummaryStatisticsTable';

export enum ClinicalNumericalVisualisationType {
    Plot = 'Plot',
    Table = 'Table',
}

export class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {
    render() {
        const { data, boxPlotTooltip } = this.props;
        console.log('Props Data:', this.props.data);

        if (!data || data.length === 0) {
            return <g />; // Return an empty <g> element if there's no data
        }

        return (
            <g>
                {/* Render existing chart elements */}
                {super.render()}

                {/* Dynamically render X-Axis labels with tooltips */}
                {data.map((d, index) => (
                    <text
                        key={index}
                        x={index * 100} // Adjust position dynamically
                        y={300} // Y position for X-axis labels
                        style={{
                            cursor:
                                d.label === 'Altered group'
                                    ? 'pointer'
                                    : 'default',
                        }}
                    >
                        {d.label === 'Altered group' && boxPlotTooltip && (
                            <title>
                                Tooltip for {d.label}{' '}
                                {/* Replace with dynamic tooltip content */}
                            </title>
                        )}
                    </text>
                ))}
            </g>
        );
    }

    transformDataForSummaryStatisticsTable(data: any[]): BoxModel[] {
        return data.map(item => ({
            max: item._max || item.max || 0,
            q3: item._q3 || item.q3 || 0,
            median: item._median || item.median || 0,
            q1: item._q1 || item.q1 || 0,
            min: item._min || item.min || 0,
        }));
    }

    componentDidMount() {
        const rawData = this.props.data || []; // Ensure rawData is an array
        const labels = rawData.map((d: any) => d.label || 'Unknown'); // Fallback for missing labels

        // Transform data using toBoxPlotData
        const transformedData = toBoxPlotData(
            rawData,
            undefined, // Optional filter
            undefined, // Optional exclude limit values
            undefined // Optional logScale
        );

        console.log('Transformed Data for Tooltip:', transformedData);

        // Select only the first entry from transformedData
        const filteredData =
            transformedData.length > 0 ? [transformedData[0]] : [];
        const filteredLabels = labels.length > 0 ? [labels[0]] : []; // Match label for the first entry

        console.log('Filtered Data for Tooltip:', filteredData);
        console.log('Filtered Labels for Tooltip:', filteredLabels);

        // Pass filtered data and labels to the tooltip function
        if (filteredData.length > 0 && filteredLabels.length > 0) {
            this.attachTooltipToAlteredGroup(filteredData, filteredLabels);
        } else {
            console.warn('No valid data or labels provided for tooltips.');
        }
    }

    attachTooltipToAlteredGroup(data: BoxModel[], labels: string[]) {
        const alteredGroupElement = Array.from(
            document.querySelectorAll('tspan')
        ).find(el => el.textContent === 'Altered group');

        if (alteredGroupElement) {
            let tooltipDiv = document.getElementById('tooltip-container');
            if (!tooltipDiv) {
                tooltipDiv = document.createElement('div');
                tooltipDiv.id = 'tooltip-container';
                tooltipDiv.style.position = 'absolute';
                tooltipDiv.style.backgroundColor = 'white';
                tooltipDiv.style.padding = '10px';
                tooltipDiv.style.zIndex = '1000';
                tooltipDiv.style.fontSize = '11px';
                tooltipDiv.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.2)';
                tooltipDiv.style.borderRadius = '4px';
                tooltipDiv.style.display = 'none';
                document.body.appendChild(tooltipDiv);
            }

            // Render SummaryStatisticsTable with transformed data
            ReactDOM.render(
                <div style={{ textAlign: 'left' }}>
                    <SummaryStatisticsTable data={data} labels={labels} />
                </div>,
                tooltipDiv
            );

            const showTooltip = (e: MouseEvent) => {
                if (!tooltipDiv) return;
                const boundingRect = alteredGroupElement.getBoundingClientRect();
                tooltipDiv.style.top = `${boundingRect.top +
                    window.scrollY -
                    tooltipDiv.offsetHeight -
                    10}px`;
                tooltipDiv.style.left = `${boundingRect.left +
                    boundingRect.width / 2 -
                    tooltipDiv.offsetWidth / 2}px`;
                tooltipDiv.style.display = 'block';
            };

            const hideTooltip = () => {
                if (!tooltipDiv) return;
                tooltipDiv.style.display = 'none';
            };

            alteredGroupElement.addEventListener('mouseenter', showTooltip);
            alteredGroupElement.addEventListener('mouseleave', hideTooltip);
            (alteredGroupElement as SVGTSpanElement).style.cursor = 'default';
        } else {
            console.warn('Could not find "Altered group" element in the DOM.');
        }
    }
}

export type ClinicalNumericalDataVisualisationProps = IBoxScatterPlotProps<
    IBoxScatterPlotPoint
> & {
    type: ClinicalNumericalVisualisationType;
    pValue: number | null;
    qValue: number | null;
};

export class ClinicalNumericalDataVisualisation extends React.Component<
    ClinicalNumericalDataVisualisationProps
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    render() {
        const isTable =
            this.props.type === ClinicalNumericalVisualisationType.Table;
        return <>{isTable ? this.table : this.plot}</>;
    }

    @computed get table() {
        const groupStats = toBoxPlotData(
            this.props.data,
            this.props.boxCalculationFilter,
            this.props.excludeLimitValuesFromBoxPlot,
            this.props.logScale
        );
        const dataDescription = toDataDescriptive(
            this.props.data,
            this.props.logScale
        );
        const groupLabels = this.props.data.map(d => d.label);
        return (
            <DescriptiveDataTable
                dataBoxplot={groupStats}
                labels={groupLabels}
                descriptiveData={dataDescription}
            />
        );
    }

    @computed get plot() {
        return (
            <PlotsTabBoxPlot
                svgId={this.props.svgId}
                domainPadding={this.props.domainPadding}
                boxWidth={this.props.boxWidth}
                axisLabelX={this.props.axisLabelX}
                axisLabelY={this.props.axisLabelY}
                data={this.props.data}
                chartBase={this.props.chartBase}
                scatterPlotTooltip={this.props.scatterPlotTooltip}
                boxPlotTooltip={this.props.boxPlotTooltip}
                horizontal={this.props.horizontal}
                logScale={this.props.logScale}
                size={this.props.size}
                fill={this.props.fill}
                stroke={this.props.stroke}
                strokeOpacity={this.props.strokeOpacity}
                symbol={this.props.symbol}
                useLogSpaceTicks={this.props.useLogSpaceTicks}
                legendLocationWidthThreshold={
                    this.props.legendLocationWidthThreshold
                }
                pValue={this.props.pValue}
                qValue={this.props.qValue}
            />
        );
    }
}
