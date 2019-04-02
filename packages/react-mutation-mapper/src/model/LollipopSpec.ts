export type LollipopSpec = {
    codon:number;
    count:number;
    label?: {
        text: string;
        textAnchor?: string;
        fontSize?: number;
        fontFamily?: string;
    };
    color?:string;
    tooltip?:JSX.Element;
};

export default LollipopSpec;
