import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

type TrackRectProps = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackRectSpec;
};

export type TrackRectSpec = {
    startCodon: number;
    endCodon?: number;
    label?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackRect extends React.Component<TrackRectProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        width: 50,
        height: 10,
    };

    public render() {
        return (
            <g>
                <rect
                    stroke="#BABDB6"
                    strokeWidth="0.5"
                    fill={this.props.spec.color}
                    width={this.props.width}
                    height={this.props.height}
                    x={this.props.x}
                    y={this.props.y}
                />
            </g>
        );
    }
}
