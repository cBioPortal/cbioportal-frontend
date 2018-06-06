import numeral from "numeral";
import _ from "lodash";

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

function zeroes(times:number) {
    let ret = "";
    for (let i=0; i<times; i++) {
        ret += "0";
    }
    return ret;
}

function getUniqueFormat(values:number[], formatFn:(precision:number)=>string) {
    let precision = 0;
    let format = "";
    while (precision < 3) {
        format = formatFn(precision);
        const uniqueValues = _.uniq(values.map(v=>numeral(v).format(format)));
        if (uniqueValues.length === values.length) {
            //unique!
            break;
        }
        precision++;
    }
    return format;
}

export function getUniqueFormatThousands(values:number[]) {
    values = values.filter(v=>Math.abs(v) >= 1000);
    return getUniqueFormat(values, precision=>`0.[${zeroes(precision)}]a`);
}

export function getUniqueFormatLessThanThousands(values:number[]) {
    values = values.filter(v=>Math.abs(v) < 1000);
    return getUniqueFormat(values, precision=>`0.[${zeroes(precision)}]`);
}

export function tickFormat(val:number, values:number[]) {
    if (val >= 1000) {
        return numeral(val).format(getUniqueFormatThousands(values));
    } else {
        return numeral(val).format(getUniqueFormatLessThanThousands(values));
    }
}