import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import TrackCircle from './TrackCircle';
import TrackRect from './TrackRect';

type TrackItemProps = {
    x: number;
    y: number;
    dim1?: number; // radius or width
    dim2?: number; // hoverRadius or height
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackItemSpec;
};

export type TrackItemSpec = {
    startCodon: number;
    endCodon?: number;
    label?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackItem extends React.Component<
    TrackItemProps,
    TrackItemSpec
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        dim1: 2.8,
        dim2: 5,
    };

    @observable public isHovered = false;

    @computed public get hitRectangle() {
        const hoverRadius =
            this.props.dim2 || TrackCircle.defaultProps.hoverRadius;

        return {
            x: this.props.x - hoverRadius + (this.props.hitZoneXOffset || 0),
            y: this.props.y,
            width: hoverRadius * 2,
            height: hoverRadius * 2,
        };
    }

    public render() {
        if (this.props.spec.endCodon === undefined) {
            return (
                <TrackCircle
                    isHovered={this.isHovered}
                    radius={this.props.dim1}
                    hoverRadius={this.props.dim2}
                    {...this.props}
                />
            );
        } else {
            return <TrackRect width={this.props.dim1} {...this.props} />;
        }
    }
}
