import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import { PercentToggle, AxisScale } from 'react-mutation-mapper';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
    onScaleToggle?: (selectedScale: AxisScale) => void;
    axisMode?: AxisScale;
}

@observer
export default class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
    }

    protected get mutationTableComponent() {
        return null;
    }

    protected get plotTopYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotBottomYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotTopYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotBottomYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotYMaxLabelPostfix() {
        return this.props.axisMode === AxisScale.PERCENT ? '%' : '';
    }

    /**
     * Override the parent method to get custom controls.
     */
    protected get customControls(): JSX.Element | undefined {
        return (
            <PercentToggle
                axisMode={this.props.axisMode}
                onScaleToggle={this.props.onScaleToggle}
            />
        );
    }
}
