import * as React from 'react';
import { computed } from 'mobx';

export interface ILinearGradientProps {
    id: string;
    colors: string[];
    // TODO orientation: string;
}

export class LinearGradient extends React.Component<ILinearGradientProps> {
    @computed
    public get gradientStopPoints() {
        const gradientStopPoints = [];
        const colors = this.props.colors;

        for (let i = 0; i < colors.length; i++) {
            gradientStopPoints.push(
                <stop
                    offset={`${((i / colors.length) * 100).toFixed(0)}%`}
                    stopColor={colors[i]}
                />
            );
        }

        return gradientStopPoints;
    }

    public render() {
        return (
            <linearGradient
                id={this.props.id}
                key={this.props.id}
                gradientTransform="rotate(90)"
            >
                {this.gradientStopPoints}
            </linearGradient>
        );
    }
}

export default LinearGradient;
