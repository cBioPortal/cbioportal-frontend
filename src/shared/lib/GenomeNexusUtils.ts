import {Mutation} from "shared/api/generated/CBioPortalAPI";

export function generateGenomeNexusQuery(data:Mutation)
{
    let hgvs:string = "";

    if (data.mutationType === "Missense_Mutation" &&
        data.variantAllele &&
        data.variantAllele.length === 1)
    {
        hgvs += data.gene.chromosome + ":g." + data.startPosition;
        hgvs += data.referenceAllele + ">" + data.variantAllele;
    }

    return hgvs;
}
