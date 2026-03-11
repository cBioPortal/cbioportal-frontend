import _ from 'lodash';
import {
    ASCN_AMP,
    ASCN_GAIN,
    ASCN_LIGHTGREY,
    ASCN_HETLOSS,
    ASCN_HOMDEL,
    ASCN_BLACK,
    ASCN_WHITE,
} from 'shared/lib/Colors';

// Call table: keyed by "wgd,majorCN,minorCN" → lowercase call name.
// Mirrors ASCNCallTable in ASCNCopyNumberElement but lives here (as string
// literals) so non-React utility files can use it without a circular
// dependency (ASCNCopyNumberElement imports from this file).
const ASCN_CALL_TABLE: { [key: string]: string } = {
    'no WGD,0,0': 'homdel',
    'no WGD,1,0': 'hetloss',
    'no WGD,2,0': 'cnloh',
    'no WGD,3,0': 'cnloh & gain',
    'no WGD,4,0': 'cnloh & gain',
    'no WGD,5,0': 'amp (loh)',
    'no WGD,6,0': 'amp (loh)',
    'no WGD,1,1': 'diploid',
    'no WGD,2,1': 'gain',
    'no WGD,3,1': 'gain',
    'no WGD,4,1': 'amp',
    'no WGD,5,1': 'amp',
    'no WGD,6,1': 'amp',
    'no WGD,2,2': 'tetraploid',
    'no WGD,3,2': 'amp',
    'no WGD,4,2': 'amp',
    'no WGD,5,2': 'amp',
    'no WGD,6,2': 'amp',
    'no WGD,3,3': 'amp (balanced)',
    'no WGD,4,3': 'amp',
    'no WGD,5,3': 'amp',
    'no WGD,6,3': 'amp',
    'WGD,0,0': 'homdel',
    'WGD,1,0': 'loss before & after',
    'WGD,2,0': 'loss before',
    'WGD,3,0': 'cnloh before & loss',
    'WGD,4,0': 'cnloh before',
    'WGD,5,0': 'cnloh before & gain',
    'WGD,6,0': 'amp (loh)',
    'WGD,1,1': 'double loss after',
    'WGD,2,1': 'loss after',
    'WGD,3,1': 'cnloh after',
    'WGD,4,1': 'loss & gain',
    'WGD,5,1': 'amp',
    'WGD,6,1': 'amp',
    'WGD,2,2': 'tetraploid',
    'WGD,3,2': 'gain',
    'WGD,4,2': 'amp',
    'WGD,5,2': 'amp',
    'WGD,6,2': 'amp',
    'WGD,3,3': 'amp (balanced)',
    'WGD,4,3': 'amp',
    'WGD,5,3': 'amp',
    'WGD,6,3': 'amp',
};

export function getASCNCopyNumberCall(
    wgdValue: string,
    totalCopyNumberValue: string,
    minorCopyNumberValue: string
): string {
    const majorCopyNumberValue = (
        Number(totalCopyNumberValue) - Number(minorCopyNumberValue)
    ).toString();
    const key = [wgdValue, majorCopyNumberValue, minorCopyNumberValue].join(
        ','
    );
    return ASCN_CALL_TABLE[key] ?? 'na';
}

// Color inside the rectangle
export function getASCNCopyNumberColor(
    ASCNCopyNumberValueEnum: string
): string {
    switch (ASCNCopyNumberValueEnum) {
        case '2':
            return ASCN_AMP;
        case '1':
            return ASCN_GAIN;
        case '0':
            return ASCN_WHITE;
        case '-1':
            return ASCN_HETLOSS;
        case '-2':
            return ASCN_HOMDEL;
        case 'INDETERMINATE':
            return ASCN_LIGHTGREY;
        default:
            return ASCN_BLACK;
    }
}

// Border color
export function getASCNCopyNumberStrokeColor(
    ASCNCopyNumberValueEnum: string
): string {
    switch (ASCNCopyNumberValueEnum) {
        case '2':
            return ASCN_AMP;
        case '1':
            return ASCN_GAIN;
        case '0':
            return ASCN_LIGHTGREY;
        case '-1':
            return ASCN_HETLOSS;
        case '-2':
            return ASCN_HOMDEL;
        case 'INDETERMINATE':
            return 'ASCN_LIGHTGREY';
        default:
            return ASCN_BLACK;
    }
}

export function getASCNCopyNumberTextColor(
    ASCNCopyNumberValueEnum: string
): string {
    return ASCNCopyNumberValueEnum === '0' ? ASCN_BLACK : ASCN_WHITE;
}

// Segment colors keyed by lowercase call name (matching ASCN_CALL_TABLE values).
// Reds/oranges = gains, blues/purples = losses, neutral = diploid/tetraploid.
export const ASCN_CALL_SEGMENT_COLORS: { [call: string]: string } = {
    amp: '#CC0000',
    'amp (loh)': '#CC4125',
    'amp (balanced)': '#990000',
    gain: '#E6B8A2',
    'cnloh & gain': '#BF9000',
    'loss & gain': '#E06666',
    diploid: '#FFFFFF',
    tetraploid: '#D9D9D9',
    cnloh: '#9FC5E8',
    'cnloh after': '#D5A6BD',
    'cnloh before': '#674EA7',
    'cnloh before & loss': '#8E7CC3',
    'cnloh before & gain': '#C9A0DC',
    hetloss: '#4472C4',
    'loss after': '#6FA8DC',
    'loss before': '#3D85C8',
    'loss before & after': '#CFE2F3',
    'double loss after': '#1A237E',
    homdel: '#0000CD',
};

export function getASCNCallSegmentColor(ascnCall: string): string {
    return ASCN_CALL_SEGMENT_COLORS[ascnCall] || ASCN_LIGHTGREY;
}

// Colors for ASCN copy number calls on the oncoprint.
// Based on (totalCopyNumber, minorCopyNumber) per the call table in the spec.
// Returns a hex color string, or null if no allele-specific data available.
export const ASCN_ONCOPRINT_CN_COLORS = {
    BLUE: '#0000CD', // HOMDEL (tcn=0, minor=0)
    LIGHT_BLUE: '#87CEEB', // HETLOSS (tcn=1) or CNLOH (tcn=2, minor=0)
    LIGHT_PURPLE: '#DDA0DD', // CNLOH at higher TCN (tcn=3–4, minor=0)
    PURPLE: '#9370DB', // AMP with LOH (tcn≥5, minor=0)
    WHITE: '#FFFFFF', // DIPLOID (tcn=2, minor=1)
    PINK: '#FFB6C1', // GAIN (tcn=3–4, minor=1)
    RED: '#CC0000', // AMP or TETRAPLOID (high tcn or balanced)
};

export function getOncoPrintASCNCNColor(
    totalCopyNumber: number,
    minorCopyNumber: number | undefined | null
): string | null {
    if (minorCopyNumber === undefined || minorCopyNumber === null) {
        return null; // NA — no allele-specific data
    }
    if (minorCopyNumber === 0) {
        if (totalCopyNumber === 0) return ASCN_ONCOPRINT_CN_COLORS.BLUE;
        if (totalCopyNumber === 1) return ASCN_ONCOPRINT_CN_COLORS.LIGHT_BLUE;
        if (totalCopyNumber === 2) return ASCN_ONCOPRINT_CN_COLORS.LIGHT_BLUE;
        if (totalCopyNumber <= 4) return ASCN_ONCOPRINT_CN_COLORS.LIGHT_PURPLE;
        return ASCN_ONCOPRINT_CN_COLORS.PURPLE; // tcn≥5 with minor=0 → AMP/LOH
    }
    if (minorCopyNumber === 1) {
        if (totalCopyNumber === 2) return ASCN_ONCOPRINT_CN_COLORS.WHITE;
        if (totalCopyNumber <= 4) return ASCN_ONCOPRINT_CN_COLORS.PINK;
        return ASCN_ONCOPRINT_CN_COLORS.RED; // tcn≥5 with minor=1 → AMP
    }
    // minorCopyNumber >= 2 → always AMP/TETRAPLOID → RED
    return ASCN_ONCOPRINT_CN_COLORS.RED;
}
