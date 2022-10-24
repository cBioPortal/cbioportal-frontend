import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import { AxisScale } from './AxisScaleSwitch';
import autobind from 'autobind-decorator';
import { PercentToggle } from './PercentToggle';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
    onScaleToggle?: (showPercent: boolean) => void;
}

@observer
export default class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    @observable public showPercent = true;
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
        makeObservable(this);
        if (props.onInit) {
            props.onInit(this);
        }
    }

    protected get mutationTableComponent() {
        return null;
    }

    protected get plotTopYAxisSymbol() {
        return this.showPercent ? '%' : '#';
    }

    protected get plotBottomYAxisSymbol() {
        return this.showPercent ? '%' : '#';
    }

    protected get plotTopYAxisDefaultMax() {
        return this.showPercent ? 0 : 5;
    }

    protected get plotBottomYAxisDefaultMax() {
        return this.showPercent ? 0 : 5;
    }

    protected get plotYMaxLabelPostfix() {
        return this.showPercent ? '%' : '';
    }

    @action.bound
    private onScaleToggle(selectedScale: AxisScale) {
        this.lollipopPlotControlsConfig.yMaxInput = undefined;
        this.lollipopPlotControlsConfig.bottomYMaxInput = undefined;

        this.showPercent = selectedScale === AxisScale.PERCENT;

        if (this.props.onScaleToggle) {
            this.props.onScaleToggle(this.showPercent);
        }
    }

    /**
     * Override the parent method to get custom controls.
     */
    protected get customControls(): JSX.Element | undefined {
        return (
            <PercentToggle
                showPercent={this.showPercent}
                onScaleToggle={this.onScaleToggle}
            />
        );
    }
}
