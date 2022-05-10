import _ from "lodash";

// TODO duplicate of extractRGBA in (oncoprintshapetovertexes.ts)
export default function extractrgba(str:string|[number, number, number, number]) {
    let ret = [0, 0, 0, 1];
    if (_.isArray(str) && str.length === 4) {
        str = `rgba(${str.join(",")})`;
    }
    if (str[0] === "#") {
        // hex, convert to rgba
        const r = parseInt(str[1] + str[2], 16);
        const g = parseInt(str[3] + str[4], 16);
        const b = parseInt(str[5] + str[6], 16);
        str = 'rgba('+r+','+g+','+b+',1)';
    }
    const match = str.match(/^[\s]*rgba\([\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/);
    if (match && match.length === 5) {
        ret = [parseFloat(match[1]) / 255,
            parseFloat(match[2]) / 255,
            parseFloat(match[3]) / 255,
            parseFloat(match[4])];
    }
    return ret;
};
