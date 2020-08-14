import React from 'react';

const SHEET_HEIGHT_OVER_WIDTH = 0.68;

function renderCenteredSheet(width:number, y:number, fill:string, strokeWidth=0) {
    const left = -width/2;
    const right = width/2;
    const top = SHEET_HEIGHT_OVER_WIDTH * left;
    const bottom = SHEET_HEIGHT_OVER_WIDTH * right;

    return (
        <path
            d={`M ${left} ${y} L 0 ${y + top} L ${right} ${y} L 0 ${y + bottom} L ${left} ${y} Z`}
            strokeWidth={strokeWidth}
            stroke={fill}
            fill={fill}
        />
    );
}

function renderMaskedSheet(width:number, y:number, fill:string) {
    const maskProportion = 0.81;
    const height = SHEET_HEIGHT_OVER_WIDTH * width;
    return (
        <>
            {renderCenteredSheet(width, y, fill)}
            <g style={{
                transform:`translate(0, -${(1-maskProportion) * height/2}px)`
            }}>
                {renderCenteredSheet(maskProportion * width, y, "#fff", 0.3)}
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
            {renderMaskedSheet(width, y + width/4.5, fills[0])}
            {renderMaskedSheet(width, y, fills[1])}
            {renderCenteredSheet(width, y - width/4.5, fills[2])}
        </g>
    )
}
