export enum LollipopPlacement {
    TOP,
    BOTTOM,
}

export type LollipopSpec = {
    codon: number;
    count: number;
    group?: string;
    placement?: LollipopPlacement;
    label?: {
        text: string;
        textAnchor?: string;
        fontSize?: number;
        fontFamily?: string;
    };
    color?: string;
    tooltip?: JSX.Element;
};
