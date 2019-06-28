import * as React from "react";

export type Tick = {
    position:number;
    label?:string;
};

type SVGAxisProps = {
    x:number;
    y:number;
    length:number;
    ticks:Tick[];
    tickLength:number;
    rangeLower:number;
    rangeUpper:number;
    vertical?:boolean;
    label?:string;
};

export default class SVGAxis extends React.Component<SVGAxisProps, {}> {
    private positionToAxisPosition(position:number) {
        return (position/(this.props.rangeUpper - this.props.rangeLower))*this.props.length;
    }

    private get ticks() {
        return this.props.ticks.map(tick=>{
            const axisPosition = this.positionToAxisPosition(tick.position);
            const x1 = this.props.vertical ? this.props.x : (this.props.x + axisPosition);
            const y1 = this.props.vertical ? (this.props.y + this.props.length - axisPosition) : this.props.y;
            const x2 = this.props.vertical ? (this.props.x - this.props.tickLength) : (this.props.x + axisPosition);
            const y2 = this.props.vertical ? (this.props.y + this.props.length - axisPosition) : (this.props.y + this.props.tickLength);
            const labelPadding = 3;

            let label = null;
            if (tick.label) {
                if (this.props.vertical) {
                    label = (
                        <text
                            textAnchor="end"
                            style={{
                                fontSize:"10px",
                                fontFamily:"arial"
                            }}
                            dx={-1*labelPadding}
                            dy="0.4em"
                            x={x2}
                            y={y2}
                        >
                            {tick.label}
                        </text>
                    );
                } else {
                    label = (
                        <text
                            textAnchor="middle"
                            style={{
                                fontSize:"10px",
                                fontFamily:"arial"
                            }}
                            x={x2}
                            y={y2}
                            dy="1em"
                        >
                            {tick.label}
                        </text>
                    );
                }
            }
            return (
                <g key={axisPosition}>
                    <line
                        stroke="rgb(170,170,170)"
                        strokeWidth="1"
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                    />
                    {label}
                </g>
            );
        });
    }

    private get label() {
        if (this.props.label) {
            let x:number;
            let y:number;
            let transform:string;
            if (this.props.vertical) {
                x = this.props.x - this.props.tickLength - 30;
                y = this.props.y + (this.props.length / 2);
                transform = `rotate(270,${x},${y})`;
            } else {
                x = this.props.x + (this.props.length / 2);
                y = this.props.y + this.props.tickLength + 5;
                transform = "";
            }
            return (
                <text
                    textAnchor="middle"
                    style={{
                        fontFamily: "arial",
                        fontSize: "12px",
                        fontWeight: "normal"
                    }}
                    fill="#2E3436"
                    x={x}
                    y={y}
                    transform={transform}
                >
                    {this.props.label}
                </text>
            );
        } else {
            return null;
        }
    }

    render() {
        const x2 = this.props.vertical ? this.props.x : (this.props.x + this.props.length);
        const y2 = this.props.vertical ? (this.props.y + this.props.length) : this.props.y;
        return (
            <g>
                <line
                    stroke="rgb(170,170,170)"
                    strokeWidth="1"
                    x1={this.props.x}
                    y1={this.props.y}
                    x2={x2}
                    y2={y2}
                />
                {this.ticks}
                {this.label}
            </g>
        );
    }
}