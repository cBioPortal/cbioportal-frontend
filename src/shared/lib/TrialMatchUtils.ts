import * as _ from 'lodash';
import {ITrialMatchGene, ITrialMatchGeneData} from "shared/model/TrialMatch.ts";
import trialMatchClient from "shared/api/trialMatchClientInstance";

type MutationSpec = {gene:{hugoGeneSymbol: string}, proteinChange: string};


/**
 * Asynchronously return a map with Civic information from the genes given.
 */
export function getTrialMatchGenes(geneSymbols: Array<string>): Promise<ITrialMatchGene> {

    let trialMatchGenes: ITrialMatchGene = {};

    // Assemble a list of promises, each of which will retrieve a batch of genes
    let promises: Array<Promise<Array<ITrialMatchGeneData>>> = [];
    let ids: Array<String> = [];
    geneSymbols.forEach(function(geneSymbol: string) {
        //Encode "/" characters
        geneSymbol = geneSymbol.replace(/\//g,'%2F');
        // Check if we already have it in the cache
        if (trialMatchGenes.hasOwnProperty(geneSymbol)) {
            return;
        }

        // Add the symbol to the list
        ids.push(geneSymbol);

        // To prevent the request from growing too large, we send it off
        // when it reaches this limit and start a new one
        if (ids.length >= 400) {
            let requestIds = ids.join();
            promises.push(trialMatchClient.getTrialMatchGenesBatch(requestIds));
            ids = [];
        }
    });
    if (ids.length > 0) {
        let requestIds = ids.join();
        promises.push(trialMatchClient.getTrialMatchGenesBatch(requestIds));
    }

    // We're waiting for all promises to finish, then return civicGenes
    return Promise.all(promises).then(function(responses) {
        for (const res in responses) {
            let arrayTrialMatchGenes: ITrialMatchGeneData[] = responses[res];
            arrayTrialMatchGenes.forEach((trialMatchGene) => {
                trialMatchGenes[trialMatchGene.name] = trialMatchGene;
            });
        }
    }).then(function() {
        return trialMatchGenes;
    });
}