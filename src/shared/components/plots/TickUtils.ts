import _ from "lodash";
import measureText from "measure-text";
import numeral from "numeral";

function getTickTextWidth(label:string) {
    return measureText({text: label, fontFamily: "Arial, Helvetica", fontSize: "12px", lineHeight: 1}).width.value;
}

function splitTickByWidth(str:string, maxWidth:number) {
    const ret:string[] = [];
    let index = 0;
    let chunk = "";
    while (index < str.length) {
        chunk += str[index];
        if (getTickTextWidth(chunk) >= maxWidth) {
            ret.push(chunk);
            chunk = "";
        }
        index += 1;
    }
    if (chunk.length) {
        ret.push(chunk);
    }
    return ret;
}

export function wrapTick(label:string, maxWidth:number):string[] {
    if (getTickTextWidth(label) <= maxWidth) {
        return [label];
    } else {
        // label too big, need to wrap to fit
        let words = label.split(/\s+/g); // first split words, for nicer breaks if possible
        // next split chunks of max width
        words = _.flatten(words.map(word=>splitTickByWidth(word, maxWidth)));
        let currentLine = "";
        const ret:string[] = [];
        for (const word of words) {
            if (getTickTextWidth(word) >= maxWidth) {
                if (currentLine.length) {
                    ret.push(currentLine);
                }
                ret.push(word);
                currentLine = "";
            } else if (getTickTextWidth(currentLine + word) >= maxWidth) {
                if (currentLine.length) {
                    ret.push(currentLine);
                }
                currentLine = word;
            } else {
                currentLine += word;
            }
        }
        if (currentLine.length) {
            ret.push(currentLine);
        }
        return ret;
    }
}

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

export function tickFormatNumeral(val:number, values:number[], transform?:(t:number)=>number) {
    // transform is, e.g., log
    if (transform) {
        val = transform(val);
        values = values.map(transform);
    }
    if (val >= 1000) {
        return numeral(val).format(getUniqueFormatThousands(values));
    } else {
        return numeral(val).format(getUniqueFormatLessThanThousands(values));
    }
}