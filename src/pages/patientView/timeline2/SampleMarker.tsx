import React from 'react';

const SampleMarker: React.FunctionComponent<{
    color: string;
    label: string;
}> = function({ color, label }) {
    return (
        <svg width="15" height="15">
            <circle cx="7.5" cy="7.5" r="7" fill={color} />
            <text
                x="50%"
                y="50%"
                text-anchor="middle"
                fill="white"
                font-size="10px"
                font-family="Arial"
                dy=".3em"
            >
                {label}
            </text>
        </svg>
    );
};

export default SampleMarker;
