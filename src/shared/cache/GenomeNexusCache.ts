import genomeNexusClient from "shared/api/genomeNexusClientInstance";
import {generateMutationAssessorQuery} from "shared/lib/GenomeNexusUtils";
import {MutationAssessor} from "shared/model/GenomeNexus";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {default as SimpleCache, ICache} from "shared/lib/SimpleCache";

export default class GenomeNexusCache extends SimpleCache<MutationAssessor, Mutation>
{
    constructor()
    {
        super();
    }

    protected async fetch(queryVariant: Mutation)
    {
        const cache: ICache<MutationAssessor> = {};

        try {
            const lookup:MutationAssessor[] = await genomeNexusClient.postMutationAssessorAnnotation(
                { variants: [generateMutationAssessorQuery(queryVariant)] }
            ); // returns list of one mutation assessor object

            let responseObj:MutationAssessor = lookup[0];

            // if (responseObj) {

                cache[queryVariant.entrezGeneId.toString()] = {
                    status: "complete",
                    data: responseObj
                }
            // }

            this.putData(cache);
        }
        catch (err) {
        	cache[queryVariant.entrezGeneId] = {
        		status: "error"
        	};

        	this.putData(cache);
        }
    }
}