import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

type TrackCircleProps = {
    x: number;
    y: number;
    radius?: number;
    hoverRadius?: number;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackItemSpec;
};

export type TrackItemSpec = {
    codon: number;
    label?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackCircle extends React.Component<TrackCircleProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        radius: 2.8,
        hoverRadius: 5,
    };

    @observable public isHovered = false;

    @computed get circleRadius() {
        return this.isHovered ? this.props.hoverRadius : this.props.radius;
    }

    @computed public get hitRectangle() {
        const hoverRadius =
            this.props.hoverRadius || TrackCircle.defaultProps.hoverRadius;

        return {
            x: this.props.x - hoverRadius + (this.props.hitZoneXOffset || 0),
            y: this.props.y,
            width: hoverRadius * 2,
            height: hoverRadius * 2,
        };
    }

    public render() {
        return (
            <g>
                <circle
                    stroke="#BABDB6"
                    strokeWidth="0.5"
                    fill={this.props.spec.color}
                    r={this.circleRadius}
                    cx={this.props.x}
                    cy={this.props.y}
                />
                <circle
                    className={this.props.hitZoneClassName}
                    r={this.props.hoverRadius}
                    cx={this.props.x}
                    cy={this.props.y}
                    cursor="pointer"
                    style={{ opacity: 0 }}
                />
            </g>
        );
    }
}
