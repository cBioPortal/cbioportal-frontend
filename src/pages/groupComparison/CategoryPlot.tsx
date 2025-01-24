import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import MultipleCategoryBarPlot, {
    IMultipleCategoryBarPlotProps,
} from 'shared/components/plots/MultipleCategoryBarPlot';
import MultipleCategoryHeatmap from 'shared/components/plots/MultipleCategoryHeatmap';
import autobind from 'autobind-decorator';
import { OncoprintJS } from 'oncoprintjs';

export type IMultipleCategoryPlotProps = IMultipleCategoryBarPlotProps & {
    type: CategoryPlotType;
    groupToColor?: { [group: string]: string };
    broadcastOncoprintJsRef: (oncoprint: OncoprintJS) => void;
};

export enum CategoryPlotType {
    Bar = 'Bar',
    StackedBar = 'StackedBar',
    PercentageStackedBar = 'PercentageStackedBar',
    Heatmap = 'Heatmap',
}

@observer
export default class CategoryPlot extends React.Component<
    IMultipleCategoryPlotProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    private oncoprintJs: OncoprintJS | null = null;

    @autobind
    private oncoprintJsRef(oncoprint: OncoprintJS) {
        this.oncoprintJs = oncoprint;
        this.props.broadcastOncoprintJsRef(oncoprint);
    }

    render() {
        const isHeatmap = this.props.type === CategoryPlotType.Heatmap;
        return <>{isHeatmap ? this.heatmap : this.barchart}</>;
    }

    @computed get heatmap() {
        return (
            <MultipleCategoryHeatmap
                horzData={this.props.horzData}
                vertData={this.props.vertData}
                axisLabelX={this.props.axisLabelY!}
                barWidth={this.props.barWidth}
                groupToColor={this.props.groupToColor}
                broadcastOncoprintJsRef={this.oncoprintJsRef}
            />
        );
    }

    @computed get barchart() {
        return (
            <MultipleCategoryBarPlot
                svgId={this.props.svgId}
                horzData={this.props.horzData}
                vertData={this.props.vertData}
                horzCategoryOrder={this.props.horzCategoryOrder}
                vertCategoryOrder={this.props.vertCategoryOrder}
                categoryToColor={this.props.categoryToColor}
                barWidth={this.props.barWidth}
                domainPadding={this.props.domainPadding}
                chartBase={this.props.chartBase}
                axisLabelX={this.props.axisLabelX}
                axisLabelY={this.props.axisLabelY}
                legendLocationWidthThreshold={
                    this.props.legendLocationWidthThreshold
                }
                ticksCount={this.props.ticksCount}
                horizontalBars={this.props.horizontalBars}
                percentage={this.props.percentage}
                stacked={this.props.stacked}
                pValue={this.props.pValue}
                qValue={this.props.qValue}
                key={`categoryPlot-${
                    this.props.horizontalBars ? 'horizontal' : 'vertical'
                }`}
            />
        );
    }
}
