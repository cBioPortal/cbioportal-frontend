import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { AxisScale, AxisScaleSwitch } from './AxisScaleSwitch';

interface IPercentToggleProps {
    showPercent?: boolean;
    onScaleToggle?: (selectedScale: AxisScale) => void;
}

// @observer
export class PercentToggle extends React.Component<IPercentToggleProps, {}> {
    constructor(props: IPercentToggleProps) {
        super(props);
    }

    public render() {
        return (
            <div
                className="small"
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <span style={{ marginLeft: 10, marginRight: 10 }}>
                    Y-Axis:{' '}
                </span>
                <AxisScaleSwitch
                    selectedScale={
                        this.props.showPercent
                            ? AxisScale.PERCENT
                            : AxisScale.COUNT
                    }
                    onChange={this.props.onScaleToggle}
                />
            </div>
        );
    }
}
