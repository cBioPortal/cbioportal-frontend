import * as _ from 'lodash';
import {ICivicGene, ICivicGeneData, ICivicVariant, ICivicVariantData} from "shared/model/Civic.ts";
import civicClient from "shared/api/civicClientInstance";

type MutationSpec = {gene:{hugoGeneSymbol: string}, proteinChange: string};

/**
 * Asynchronously adds the given variant from a gene to the variant map specified.
 */
function addCivicVariant(variantMap: ICivicVariant, variantId: number, variantName: string, geneSymbol: string, geneId: number): Promise<void> {
    return civicClient.getVariant(variantId, variantName, geneId)
    .then(function(result: ICivicVariantData) {
        if (result) {
            if (!variantMap[geneSymbol]) {
                variantMap[geneSymbol] = {};
            }
            variantMap[geneSymbol][variantName] = result;
        }
    });
}

/**
 * Asynchronously return a map with Civic information from the genes given.
 */
export function getCivicGenes(geneSymbols: Array<string>): Promise<ICivicGene> {
    
    let civicGenes: ICivicGene = {};

    // Assemble a list of promises, each of which will retrieve a batch of genes
    let promises: Array<Promise<Array<ICivicGeneData>>> = [];
    let ids: Array<String> = [];
    geneSymbols.forEach(function(geneSymbol: string) {
        //Encode "/" characters
        geneSymbol = geneSymbol.replace(/\//g,'%2F');
        // Check if we already have it in the cache
        if (civicGenes.hasOwnProperty(geneSymbol)) {
            return;
        }

        // Add the symbol to the list
        ids.push(geneSymbol);

        // To prevent the request from growing too large, we send it off
        // when it reaches this limit and start a new one
        if (ids.length >= 400) {
            let requestIds = ids.join();
            promises.push(civicClient.getCivicGenesBatch(requestIds));
            ids = [];
        }
    });
    if (ids.length > 0) {
        let requestIds = ids.join();
        promises.push(civicClient.getCivicGenesBatch(requestIds));
    }

    // We're waiting for all promises to finish, then return civicGenes
    return Promise.all(promises).then(function(responses) {
        for (let res in responses) {
            let arrayCivicGenes: Array<ICivicGeneData> = responses[res];
            arrayCivicGenes.forEach((civicGene) => {
                civicGenes[civicGene.name] = civicGene;
            });
        }
    }).then(function() {
        return civicGenes;
    });
}
    
/**
 * Asynchronously retrieve a map with Civic information from the mutationSpecs given for all genes in civicGenes.
 * If no mutationSpecs are given, then return the Civic information of all the CNA variants of the genes in civicGenes.
 */
export function getCivicVariants(civicGenes: ICivicGene, mutationSpecs?: Array<MutationSpec>): Promise<ICivicVariant> {

    let civicVariants: ICivicVariant = {};
    let promises: Array<Promise<void>> = [];
    
    if (mutationSpecs) {
        let calledVariants: Set<number> = new Set([]);
        for (let mutation of mutationSpecs) {
            let geneSymbol = mutation.gene.hugoGeneSymbol;
            let geneEntry = civicGenes[geneSymbol];
            let proteinChanges = [mutation.proteinChange];
            // Match any other variants after splitting the name on + or /
            let split = mutation.proteinChange.split(/[+\/]/);
            proteinChanges.push(split[0]);
            for (let proteinChange of proteinChanges) {
                if (geneEntry && geneEntry.variants[proteinChange]) {
                    if (!calledVariants.has(geneEntry.variants[proteinChange])) { //Avoid calling the same variant
                        calledVariants.add(geneEntry.variants[proteinChange]);
                        promises.push(addCivicVariant(civicVariants,
                                                      geneEntry.variants[proteinChange],
                                                      proteinChange,
                                                      geneSymbol,
                                                      geneEntry.id));
                    }
                }
            }
        }
    } else {
        for (let geneName in civicGenes) {
            let geneEntry = civicGenes[geneName];
            let geneVariants = geneEntry.variants;
            if (!_.isEmpty(geneVariants)) {
                for (let variantName in geneVariants) {
                    // Only retrieve CNA variants
                    if (variantName == 'AMPLIFICATION' || variantName == 'DELETION') {
                        promises.push(addCivicVariant(civicVariants,
                                                      geneVariants[variantName],
                                                      variantName,
                                                      geneName,
                                                      geneEntry.id));
                    }
                }
            }
        }
    }

    // We're explicitly waiting for all promises to finish (done or fail).
    // We are wrapping them in another promise separately, to make sure we also 
    // wait in case one of the promises fails and the other is still busy.
    return Promise.all(promises).then(function() {
        return civicVariants;
    });
}

/**
 * Build a Civic Entry with the data given.
 */
export function buildCivicEntry(geneEntry: ICivicGeneData, geneVariants: {[name: string]: ICivicVariantData}) {
    return {
        name: geneEntry.name,
        description: geneEntry.description,
        url: geneEntry.url,
        variants: geneVariants
    };
}
