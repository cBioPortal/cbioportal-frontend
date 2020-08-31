import React from 'react';

const HEIGHT_OVER_WIDTH = 0.52

function renderCenteredSheet(width:number, y:number, fill:string) {
    return (
        <ellipse
            cx={0}
            cy={y}
            rx={width/2}
            ry={HEIGHT_OVER_WIDTH * width/2}
            fill={fill}
        />
    );
}

function renderMaskedSheet(width:number, y:number, fill:string) {
    return (
        <>
            {renderCenteredSheet(width, y, fill)}
            <g transform={`translate(0 -1)`}>
                {renderCenteredSheet(width, y, "#fff")}
            </g>
        </>
    );
}

export function renderStack(width:number, y:number, fills:string|string[]) {
    fills = ([] as string[]).concat(fills);

    // ensure 3 fills
    if (fills.length === 1) {
        fills = [fills[0], fills[0], fills[0]];
    } else if (fills.length === 2) {
        fills = [fills[0], fills[1], fills[0]];
    }

    return (
        <g>
            {renderMaskedSheet(width, y + width/4, fills[0])}
            {renderMaskedSheet(width, y, fills[1])}
            {renderCenteredSheet(width, y - width/4, fills[2])}
        </g>
    )
}
