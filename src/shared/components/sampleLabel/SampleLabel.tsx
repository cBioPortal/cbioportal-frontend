import * as React from 'react';

export default class SampleLabelSVG extends React.Component<ISampleLabelSVGProps, {}> {
    constructor(props: ISampleLabelSVGProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, color, x, y } = this.props;
        return (
            <g>
                <circle cx={x} cy={y} fill={color} r={10} />
                <text x={x} y={y + 5} fill={'white'} fontSize={10} textAnchor={'middle'}>{label}</text>
            </g>
        );
    }
}

export interface ISampleLabelSVGProps {
    label: string;
    color: string;
    x: number;
    y: number;
}

export class SampleLabelHTML extends React.Component<ISampleLabelHTMLProps, {}> {
    constructor(props: ISampleLabelHTMLProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, color, fillOpacity, iconSize } = this.props;
        const halfIconSize = Math.round(iconSize/2);
        const fontSize = Math.round(iconSize*10/12);
        const y = Math.round(iconSize/3);
        return (
            <svg width={iconSize} height={iconSize} className='case-label-header'>
                <g transform={`translate(${halfIconSize},${halfIconSize})`}>
                    <circle r={halfIconSize} fill={color} fillOpacity={fillOpacity} />
                    <text y={y} textAnchor='middle' fontSize={fontSize} fill='white'>{label}</text>
                </g>
            </svg>
        );
    }
}

interface ISampleLabelHTMLProps {
    label: string;
    color: string;
    fillOpacity: number;
    iconSize: number;
}
