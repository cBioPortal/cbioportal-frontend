import BoxScatterPlot, {
    IBoxScatterPlotProps,
    toBoxPlotData,
} from 'shared/components/plots/BoxScatterPlot';
import { IBoxScatterPlotPoint } from 'shared/components/plots/PlotsTabUtils';
import React from 'react';
import { computed, makeObservable } from 'mobx';
import { SummaryStatisticsTable } from './SummaryStatisticsTable';

export enum ClinicalNumericalVisualisationType {
    Plot = 'Plot',
    Table = 'Table',
}

export class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

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
        const groupLabels = this.props.data.map(d => d.label);
        return (
            <SummaryStatisticsTable data={groupStats} labels={groupLabels} />
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
