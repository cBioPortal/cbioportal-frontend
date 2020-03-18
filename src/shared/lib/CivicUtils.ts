import { MobxPromise } from 'mobxpromise';
import {
    CivicAlterationType,
    fetchCivicGenes as fetchDefaultCivicGenes,
    fetchCivicVariants as fetchDefaultCivicVariants,
    getCivicGenes,
    ICivicGene,
    ICivicVariant,
    ICivicVariantData,
} from 'react-mutation-mapper';

import {
    DiscreteCopyNumberData,
    Mutation,
} from 'shared/api/generated/CBioPortalAPI';
import { concatMutationData } from './StoreUtils';

export function getCivicCNAVariants(
    copyNumberData: DiscreteCopyNumberData[],
    geneSymbol: string,
    civicVariants: ICivicVariant
): { [name: string]: ICivicVariantData } {
    let geneVariants: { [name: string]: ICivicVariantData } = {};
    if (copyNumberData[0].alteration === 2) {
        for (let alteration in civicVariants[geneSymbol]) {
            if (alteration === CivicAlterationType.AMPLIFICATION) {
                geneVariants = {
                    [geneSymbol]: civicVariants[geneSymbol][alteration],
                };
            }
        }
    } else if (copyNumberData[0].alteration === -2) {
        for (let alteration in civicVariants[geneSymbol]) {
            if (alteration === CivicAlterationType.DELETION) {
                geneVariants = {
                    [geneSymbol]: civicVariants[geneSymbol][alteration],
                };
            }
        }
    }
    return geneVariants;
}

export function fetchCivicGenes(
    mutationData?: MobxPromise<Mutation[]>,
    uncalledMutationData?: MobxPromise<Mutation[]>
) {
    const mutationDataResult = concatMutationData(
        mutationData,
        uncalledMutationData
    );

    return fetchDefaultCivicGenes(
        mutationDataResult,
        (m: Mutation) => m.gene.entrezGeneId
    );
}

export function fetchCivicVariants(
    civicGenes: ICivicGene,
    mutationData?: MobxPromise<Mutation[]>,
    uncalledMutationData?: MobxPromise<Mutation[]>
) {
    const mutationDataResult = concatMutationData(
        mutationData,
        uncalledMutationData
    );

    return fetchDefaultCivicVariants(civicGenes, mutationDataResult);
}

export function fetchCnaCivicGenes(
    discreteCNAData: MobxPromise<DiscreteCopyNumberData[]>
): Promise<ICivicGene> {
    if (discreteCNAData.result && discreteCNAData.result.length > 0) {
        let entrezGeneSymbols: Set<number> = new Set([]);

        discreteCNAData.result.forEach(function(cna: DiscreteCopyNumberData) {
            entrezGeneSymbols.add(cna.gene.entrezGeneId);
        });

        let querySymbols: Array<number> = Array.from(entrezGeneSymbols);

        return getCivicGenes(querySymbols);
    } else {
        return Promise.resolve({});
    }
}
