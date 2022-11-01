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
    onScaleToggle?: (selectedScale: AxisScale) => void;
    showPercent?: boolean;
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
        return this.props.showPercent ? '%' : '#';
    }

    protected get plotBottomYAxisSymbol() {
        return this.props.showPercent ? '%' : '#';
    }

    protected get plotTopYAxisDefaultMax() {
        return this.props.showPercent ? 0 : 5;
    }

    protected get plotBottomYAxisDefaultMax() {
        return this.props.showPercent ? 0 : 5;
    }

    protected get plotYMaxLabelPostfix() {
        return this.props.showPercent ? '%' : '';
    }

    /**
     * Override the parent method to get custom controls.
     */
    protected get customControls(): JSX.Element | undefined {
        return (
            <PercentToggle
                showPercent={this.props.showPercent}
                onScaleToggle={this.props.onScaleToggle}
            />
        );
    }
}
