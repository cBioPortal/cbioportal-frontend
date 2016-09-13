import React from 'react';

export default class SampleLabelSVG extends React.Component {
    constructor(props) {
        super(props);
        this.render = this.render.bind(this);
    }

    render() {
        const { label, color, x, y } = this.props;
        return (<g>
             <circle cx={x} cy={y} fill={color} r={10} />
             <text x={x} y={y + 5} fill={'white'} fontSize={10} textAnchor={'middle'}>{label}</text>
           </g>);
    }
}

SampleLabelSVG.propTypes = {
    label: React.PropTypes.string.isRequired,
    color: React.PropTypes.string.isRequired,
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
};

export class SampleLabelHTML extends React.Component {
    constructor(props) {
        super(props);
        this.render = this.render.bind(this);
    }

    render() {
        const { label, color } = this.props;
        return (<svg width="12" height="12" className="case-label-header" alt="HCI002T">
                    <g transform="translate(6,6)">
                        <circle r="6" fill={color}></circle>
                        <text y="4" textAnchor="middle" fontSize="10" fill="white">{label}</text>
                    </g>
                </svg>)
    }
}

SampleLabelHTML.propTypes = {
    label: React.PropTypes.string.isRequired,
    color: React.PropTypes.string.isRequired,
};
