import numeral from "numeral";

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

export function tickFormat(val:number) {
    if (val >= 1000) {
        return numeral(val).format('0a');
    } else {
        return numeral(val).format('0.[00]');
    }
}