import * as React from 'react';

export default class SampleLabelSVG extends React.Component<SampleLabelSVGProps, {}>
{
    constructor(props:SampleLabelSVGProps)
    {
        super(props);
        this.render = this.render.bind(this);
    }

    render()
    {
        const { label, color, x, y } = this.props;
        return (
            <g>
                <circle cx={x} cy={y} fill={color} r={10} />
                <text x={x} y={y + 5} fill={'white'} fontSize={10} textAnchor={'middle'}>{label}</text>
            </g>
        );
    }
}

export interface SampleLabelSVGProps
{
    label: string;
    color: string;
    x: number;
    y: number;
}

export class SampleLabelHTML extends React.Component<SampleLabelHTMLProps, {}>
{
    constructor(props:SampleLabelHTMLProps)
    {
        super(props);
        this.render = this.render.bind(this);
    }

    render()
    {
        const { label, color } = this.props;
        return (
            <svg width="12" height="12" className="case-label-header" alt="HCI002T">
                <g transform="translate(6,6)">
                    <circle r="6" fill={color} />
                    <text y="4" textAnchor="middle" fontSize="10" fill="white">{label}</text>
                </g>
            </svg>
        );
    }
}

interface SampleLabelHTMLProps
{
    label: string;
    color: string;
}
