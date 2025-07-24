import { Exon } from 'genome-nexus-ts-api-client';
import { StructuralVariant } from 'cbioportal-ts-api-client';

export type StructuralVariantExt = StructuralVariant & {
    [index: string]: any;
    exons?: Exon[];
    label?: string;
    //added AARON  (these are requested by code)
};
