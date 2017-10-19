import * as _ from 'lodash';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {VariantAnnotation} from "shared/api/generated/GenomeNexusAPI";
import {MutationAssessor} from 'shared/api/generated/GenomeNexusAPIInternal';

export function generateGenomeNexusQuery(data:Mutation)
{
    let hgvs:string = "";
    if (data.mutationType === "Missense_Mutation" 
            && data.variantAllele.length === 1)
    {
        hgvs += data.gene.chromosome + ":g." + data.startPosition;
        hgvs += data.referenceAllele + ">" + data.variantAllele;
    }
    return hgvs;
}
