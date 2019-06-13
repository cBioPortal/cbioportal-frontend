import {Gene} from "./Gene";

export type Mutation = {
    gene?: Gene;
    chromosome?: string;
    startPosition?: number;
    endPosition?: number;
    referenceAllele?: string;
    variantAllele?: string;
    proteinChange: string;
    aminoAcidChange?: string;
    variantType?: string;
    proteinPosEnd?: number;
    proteinPosStart: number;
    mutationType?: string;
};
