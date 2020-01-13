import * as _ from 'lodash';
import CivicDataFetcher from '../store/CivicDataFetcher';
import {
    ICivicEntry,
    ICivicGene,
    ICivicGeneData,
    ICivicVariant,
    ICivicVariantData,
} from '../model/Civic';
import { Mutation } from '../model/Mutation';

export type MutationSpec = {
    gene: { hugoGeneSymbol: string };
    proteinChange: string;
};

const civicClient = new CivicDataFetcher();

export enum CivicAlterationType {
    AMPLIFICATION = 'AMPLIFICATION',
    DELETION = 'DELETION',
}

export const CIVIC_NA_VALUE = 'NA';

/**
 * Asynchronously adds the given variant from a gene to the variant map specified.
 */
function lookupCivicVariantAndAddToMap(
    variantMap: ICivicVariant,
    variantId: number,
    variantName: string,
    geneSymbol: string,
    geneId: number
): Promise<void> {
    return civicClient
        .getVariant(variantId, variantName, geneId)
        .then((result: ICivicVariantData) => {
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
export function getCivicGenes(entrezGeneIds: number[]): Promise<ICivicGene> {
    // Assemble a list of promises, each of which will retrieve a batch of genes
    let promises: Array<Promise<Array<ICivicGeneData>>> = [];

    // To prevent the request from growing too large, we send it off in multiple chunks
    const chunkedIds: number[][] = _.chunk(_.uniq(entrezGeneIds), 400);

    chunkedIds.forEach(entrezGeneIds =>
        promises.push(civicClient.getCivicGenesBatch(entrezGeneIds.join(',')))
    );

    // We're waiting for all promises to finish, then return civicGenes
    return Promise.all(promises).then((responses: ICivicGeneData[][]) => {
        return responses.reduce(
            (
                acc: { [name: string]: ICivicGeneData },
                civicGenes: ICivicGeneData[]
            ) => {
                civicGenes.forEach(
                    civicGene => (acc[civicGene.name] = civicGene)
                );
                return acc;
            },
            {}
        );
    });
}

/**
 * Asynchronously retrieve a map with Civic information from the mutationSpecs given for all genes in civicGenes.
 * If no mutationSpecs are given, then return the Civic information of all the CNA variants of the genes in civicGenes.
 */
export function getCivicVariants(
    civicGenes: ICivicGene,
    mutationSpecs?: Array<MutationSpec>
): Promise<ICivicVariant> {
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
                    if (
                        !calledVariants.has(geneEntry.variants[proteinChange])
                    ) {
                        //Avoid calling the same variant
                        calledVariants.add(geneEntry.variants[proteinChange]);
                        promises.push(
                            lookupCivicVariantAndAddToMap(
                                civicVariants,
                                geneEntry.variants[proteinChange],
                                proteinChange,
                                geneSymbol,
                                geneEntry.id
                            )
                        );
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
                    if (
                        variantName == CivicAlterationType.AMPLIFICATION ||
                        variantName == CivicAlterationType.DELETION
                    ) {
                        promises.push(
                            lookupCivicVariantAndAddToMap(
                                civicVariants,
                                geneVariants[variantName],
                                variantName,
                                geneName,
                                geneEntry.id
                            )
                        );
                    }
                }
            }
        }
    }

    // We're explicitly waiting for all promises to finish (done or fail).
    // We are wrapping them in another promise separately, to make sure we also
    // wait in case one of the promises fails and the other is still busy.
    return Promise.all(promises).then(() => civicVariants);
}

/**
 * Build a Civic Entry with the data given.
 */
export function buildCivicEntry(
    geneEntry: ICivicGeneData,
    geneVariants: { [name: string]: ICivicVariantData }
) {
    return {
        name: geneEntry.name,
        description: geneEntry.description,
        url: geneEntry.url,
        variants: geneVariants,
    };
}

/**
 * Returns an ICivicEntry if the civicGenes and civicVariants have information about the gene and the mutation (variant) specified. Otherwise it returns null.
 */
export function getCivicEntry(
    mutation: Mutation,
    civicGenes: ICivicGene,
    civicVariants: ICivicVariant
): ICivicEntry | null {
    let geneSymbol: string = mutation.gene ? mutation.gene.hugoGeneSymbol : '';
    let civicEntry = null;
    //Only search for matching Civic variants if the gene mutation exists in the Civic API
    if (
        civicGenes[geneSymbol] &&
        civicVariants[geneSymbol] &&
        civicVariants[geneSymbol][mutation.proteinChange]
    ) {
        let geneVariants: { [name: string]: ICivicVariantData } = {
            [mutation.proteinChange]:
                civicVariants[geneSymbol][mutation.proteinChange],
        };
        let geneEntry: ICivicGeneData = civicGenes[geneSymbol];
        civicEntry = buildCivicEntry(geneEntry, geneVariants);
    }

    return civicEntry;
}

export function fetchCivicGenes(
    mutations: Partial<Mutation>[],
    getEntrezGeneId: (mutation: Partial<Mutation>) => number
): Promise<ICivicGene> {
    if (mutations.length === 0) {
        return Promise.resolve({});
    }

    const entrezGeneSymbols = _.uniq(
        mutations.map(mutation => getEntrezGeneId(mutation))
    );

    return getCivicGenes(entrezGeneSymbols);
}

export function fetchCivicVariants(
    civicGenes: ICivicGene,
    mutations: Partial<Mutation>[]
): Promise<ICivicVariant> {
    let civicVariants: Promise<ICivicVariant>;

    if (mutations.length > 0) {
        civicVariants = getCivicVariants(
            civicGenes,
            mutations as MutationSpec[]
        );
    } else if (!_.isEmpty(civicGenes)) {
        civicVariants = getCivicVariants(civicGenes);
    } else {
        civicVariants = Promise.resolve({});
    }

    return civicVariants;
}
