export const molecularProfileTypeToDisplayType:{[s:string]:string} = {
    "COPY_NUMBER_ALTERATION": "Copy Number",
    "MRNA_EXPRESSION": "mRNA",
    "PROTEIN_LEVEL": "Protein Level",
    "METHYLATION": "DNA Methylation"
};

export const molecularProfileTypeDisplayOrder = ["MRNA_EXPRESSION", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL", "METHYLATION"];

export type PlotsData = {
    [uniqueSampleKey:string]:{
        caseId: string, // stable sample id
        cna_anno: string,
        mutation: {
            [hugoSymbol:string]:{
                details: string, // protein code
                type: string // mutation type
            }
        },
        xVal: string, // float representing [WHAT??]
        yVal: string // float representing [WHAT??]
    }
}

/*export function makePlotsData:PlotsData(
) {
}*/