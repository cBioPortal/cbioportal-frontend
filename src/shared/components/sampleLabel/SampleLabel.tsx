import * as React from 'react';

export default class SampleLabelSVG extends React.Component<ISampleLabelSVGProps, {}> {
    constructor(props: ISampleLabelSVGProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, customCircleAttributes, x, y } = this.props;
        return (
            <g>
                <circle cx={x} cy={y} r={10} className='sample-label-circle' {...customCircleAttributes} />
                <text x={x} y={y + 5} fill={'white'} fontSize={10} textAnchor={'middle'}>{label}</text>
            </g>
        );
    }
}

export interface ISampleLabelSVGProps {
    label: string;
    // have to be prefixed by data-
    // http://stackoverflow.com/questions/31273093/how-to-add-custom-html-attributes-in-jsx
    customCircleAttributes: Object;
    x: number;
    y: number;
}

export class SampleLabelHTML extends React.Component<ISampleLabelHTMLProps, {}> {
    constructor(props: ISampleLabelHTMLProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, customCircleAttributes } = this.props;

        return (
            <svg width='12' height='12' className='case-label-header'>
                <g transform='translate(6,6)'>
                    <circle r='6' className='sample-label-circle' {...customCircleAttributes} />
                    <text y='4' textAnchor='middle' fontSize='10' fill='white'>{label}</text>
                </g>
            </svg>
        );
    }
}

interface ISampleLabelHTMLProps {
    label: string;
    // have to be prefixed by data-
    // http://stackoverflow.com/questions/31273093/how-to-add-custom-html-attributes-in-jsx
    customCircleAttributes: Object;
}
