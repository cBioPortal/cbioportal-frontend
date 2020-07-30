import React from 'react';

const SampleMarker: React.FunctionComponent<{
    color: string;
    label: string;
    y: number;
}> = function({ color, label, y }) {
    return (
        <g transform={`translate(0 ${y})`}>
            <circle cx="0" cy="0" r="7" fill={color} />
            <text
                x="0"
                y="0"
                text-anchor="middle"
                fill="white"
                font-size="10px"
                font-family="Arial"
                dy=".3em"
            >
                {label}
            </text>
        </g>
    );
};

export default SampleMarker;
