import * as _ from 'lodash';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {MutationAssessor} from "shared/api/generated/GenomeNexusAPI";

export function generateMutationAssessorQuery(data:Mutation)
{
    let hgvs:string = "";
    if (data.mutationType === "Missense_Mutation" 
            && data.variantAllele.length == 1)
    {
        hgvs += data.gene.chromosome + ":g." + data.startPosition;
        hgvs += data.referenceAllele + ">" + data.variantAllele;
    }
    return hgvs;
}

// transforms Mutation[] to array of genome nexus formatted queries 
export function generateMutationAssessorQueries(data:Mutation[])
{
    let genomeNexusQueries:string[] = [];
    
    for (var i in data)
    {    
        // only queries single-substitution missense mutations
        if (data[i].mutationType === "Missense_Mutation" 
        	&& data[i].variantAllele.length == 1)
        {
        	let hgvs:string = "";
            hgvs += data[i].gene.chromosome + ":g." + data[i].startPosition;
            hgvs += data[i].referenceAllele + ">" + data[i].variantAllele;
            genomeNexusQueries.push(hgvs);
        }        
    }
    
    return genomeNexusQueries;
}

// creates map of entrezGeneId key to mutation assessor object response
export function toMutationAssessorMap(data:Mutation[], response:MutationAssessor[])
{
	const responseMap:{[geneId:string]: MutationAssessor} = {};

    _.each(response, function(mutationAssessor) {
        responseMap[mutationAssessor.variant] = mutationAssessor;
    });

    const map:{[geneId:string]: MutationAssessor} = {};

    _.each(data, function(mutation) {
    	if (mutation.mutationType === "Missense_Mutation") {
    		let hgvs:string = mutation.gene.chromosome + ":g." + mutation.startPosition +
    			mutation.referenceAllele + ">" + mutation.variantAllele;
    		map[mutation.entrezGeneId] = responseMap[hgvs];
    	}
        else {
            map[mutation.entrezGeneId] = undefined;
        }
    });

    return map;
}