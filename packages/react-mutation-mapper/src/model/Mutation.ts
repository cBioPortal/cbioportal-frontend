export type Mutation = {
    chromosome?: string;
    startPosition?: number;
    endPosition?: number;
    referenceAllele?: string;
    variantAllele?: string;
    proteinChange: string;
    proteinPosEnd?: number;
    proteinPosStart: number;
    mutationType?: string;
};
