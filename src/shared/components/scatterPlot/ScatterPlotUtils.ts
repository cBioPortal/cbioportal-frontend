export const VictoryAxisStyle = {
    ticks:{
        size: 4,
        stroke: "black"
    },
    tickLabels:{
        padding: 2,
        fill: "black"
    },
    grid:{
        opacity: 0
    },
    axis:{
        stroke: "black",
        strokeWidth: 1
    }
};

export function pixelsToDataLength(
    targetPixels:number,
    domain:number[],
    pixelSideLength:number
) {
    return targetPixels*((domain[1]-domain[0])/pixelSideLength);
}

export function dataLengthToPixels(
    dataLength:number,
    domain:number[],
    pixelSideLength:number
) {
    return dataLength*(pixelSideLength/(domain[1]-domain[0]));
}