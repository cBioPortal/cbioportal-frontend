import { hashString } from './hashString';

const colors = [
    '#3366cc',
    '#dc3912',
    '#ff9900',
    '#109618',
    '#990099',
    '#0099c6',
    '#dd4477',
    '#5f9e00',
    '#b82e2e',
    '#316395',
    '#994499',
    '#209f8f',
    '#93930e',
    '#6633cc',
    '#df6f00',
    '#8b0707',
    '#651067',
    '#329262',
    '#5574a6',
    '#3b3eac',
    '#b77322',
    '#1ba322',
    '#b91383',
    '#f4359e',
    '#9c5935',
    '#809700',
    '#2a778d',
    '#668d1c',
    '#a58c00',
    '#0c5922',
    '#743411',
]; // Source: D3

export function getColor(str: string) {
    return colors[Math.abs(hashString(str)) % colors.length];
}
