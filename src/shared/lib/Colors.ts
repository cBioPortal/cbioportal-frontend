import * as _ from 'lodash';

// Default grey
export const BLACK = '#000000';
export const LIGHT_GREY = '#D3D3D3';
export const DEFAULT_GREY = '#BEBEBE';
export const DARK_GREY = '#A9A9A9';

// icon colors
export const ICON_FILTER_ON = BLACK;
export const ICON_FILTER_OFF = DEFAULT_GREY;

// Mutation colors
export const MUT_COLOR_MISSENSE = '#008000';
export const MUT_COLOR_MISSENSE_PASSENGER = '#53D400';
export const MUT_COLOR_INFRAME = '#993404';
export const MUT_COLOR_INFRAME_PASSENGER = '#a68028';
export const MUT_COLOR_TRUNC = BLACK;
export const MUT_COLOR_TRUNC_PASSENGER = '#708090';
export const STRUCTURAL_VARIANT_COLOR = '#8B00C9';
export const MUT_COLOR_PROMOTER = '#00B7CE';
export const MUT_COLOR_OTHER = '#cf58bc'; //'#cfb537';

export const MRNA_COLOR_HIGH = '#ff9999';
export const MRNA_COLOR_LOW = '#6699cc';
export const MUT_COLOR_GERMLINE = '#FFFFFF';

export const PROT_COLOR_HIGH = '#ff3df8';
export const PROT_COLOR_LOW = '#00E1FF';

export const CNA_COLOR_AMP = '#ff0000';
export const CNA_COLOR_GAIN = '#ffb6c1';
export const CNA_COLOR_HETLOSS = '#8fd8d8';
export const CNA_COLOR_HOMDEL = '#0000ff';

export const DEFAULT_NA_COLOR = LIGHT_GREY;
export const DEFAULT_UNKNOWN_COLOR = DARK_GREY;

// clinical value colors
// Original version
// const CLI_YES_COLOR = "#109618";
// const CLI_NO_COLOR = "#DC3912";

// Colorblind safe version. http://colorbrewer2.org/#type=qualitative&scheme=Dark2&n=3
export const CLI_YES_COLOR = '#1b9e77';
export const CLI_NO_COLOR = '#d95f02';

export const CLI_FEMALE_COLOR = '#E0699E';
export const CLI_MALE_COLOR = '#2986E2';

export let RESERVED_CLINICAL_VALUE_COLORS: { [value: string]: string } = {
    true: CLI_YES_COLOR,
    yes: CLI_YES_COLOR,
    positive: CLI_YES_COLOR,
    'disease free': CLI_YES_COLOR,
    'tumor free': CLI_YES_COLOR,
    living: CLI_YES_COLOR,
    alive: CLI_YES_COLOR,
    'not progressed': CLI_YES_COLOR,

    false: CLI_NO_COLOR,
    no: CLI_NO_COLOR,
    negative: CLI_NO_COLOR,
    recurred: CLI_NO_COLOR,
    progressed: CLI_NO_COLOR,
    'recurred/progressed': CLI_NO_COLOR,
    'with tumor': CLI_NO_COLOR,
    deceased: CLI_NO_COLOR,

    female: CLI_FEMALE_COLOR,
    f: CLI_FEMALE_COLOR,

    male: CLI_MALE_COLOR,
    m: CLI_MALE_COLOR,

    other: DEFAULT_UNKNOWN_COLOR,

    unknown: DEFAULT_NA_COLOR,
    na: DEFAULT_NA_COLOR,

    missense: MUT_COLOR_MISSENSE,
    inframe: MUT_COLOR_INFRAME,
    truncating: MUT_COLOR_TRUNC,
    fusion: STRUCTURAL_VARIANT_COLOR,
    promoter: MUT_COLOR_PROMOTER,
    // OTHER: MUT_COLOR_OTHER,
    'wild type': DEFAULT_GREY,
    amplification: CNA_COLOR_AMP,
    gain: CNA_COLOR_GAIN,
    diploid: DEFAULT_GREY,
    'shallow deletion': CNA_COLOR_HETLOSS,
    'deep deletion': CNA_COLOR_HOMDEL,
};

_.forEach(RESERVED_CLINICAL_VALUE_COLORS, (color, key) => {
    // expand reservedValue entries to handle other case possibilities. eg expand TRUE to True and true
    RESERVED_CLINICAL_VALUE_COLORS[key.toLowerCase()] = color;
    RESERVED_CLINICAL_VALUE_COLORS[key.toUpperCase()] = color;

    const withoutSpace = key.replace(/\s/g, '');
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace] = color;
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace.toLowerCase()] = color;
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace.toUpperCase()] = color;

    RESERVED_CLINICAL_VALUE_COLORS[
        key[0].toUpperCase() + key.slice(1).toLowerCase()
    ] = color;
    RESERVED_CLINICAL_VALUE_COLORS[
        key
            .split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    ] = color;
});

export function getClinicalValueColor(value: string): string | undefined {
    return RESERVED_CLINICAL_VALUE_COLORS[
        value.replace(/\s/g, '').toLowerCase()
    ];
}
