export type FilteredOutAlterations = {
    /**
     * how many alterations are not shown
     */
    notShownAlteredCases: number;
    /**
     * number of genes associated with the hidden alterations
     */
    affectedGenes: number;
};

/**
 * Returns true if the left map contains all genes from the right map with the same number of correspondent alterations.
 * @param leftAlteredCasesPerGene superset candidate
 * @param rightAteredCasesPerGene subset candidate
 */
export function subset(
    leftAlteredCasesPerGene: Map<string, number>,
    rightAteredCasesPerGene: Map<string, number>
): boolean {
    const leftGenes = new Set(leftAlteredCasesPerGene.keys());
    for (const rightGene of rightAteredCasesPerGene.keys()) {
        if (!leftGenes.has(rightGene)) {
            return false;
        }
        if (
            leftAlteredCasesPerGene.get(rightGene)! <
            rightAteredCasesPerGene.get(rightGene)!
        ) {
            return false;
        }
    }
    return true;
}

/**
 * Counts how many alterations missing in how many genes
 * @param leftAlteredCasesPerGene reference
 * @param rightAteredCasesPerGene alterations to count
 */
export function computedFilteredOutAlterations(
    leftAlteredCasesPerGene: Map<string, number>,
    rightAteredCasesPerGene: Map<string, number>
): FilteredOutAlterations {
    const result: FilteredOutAlterations = {
        notShownAlteredCases: 0,
        affectedGenes: 0,
    };
    for (const leftGene of leftAlteredCasesPerGene.keys()) {
        if (!rightAteredCasesPerGene.has(leftGene)) {
            result.notShownAlteredCases += leftAlteredCasesPerGene.get(
                leftGene
            )!;
            result.affectedGenes += 1;
        } else if (
            leftAlteredCasesPerGene.get(leftGene)! >
            rightAteredCasesPerGene.get(leftGene)!
        ) {
            result.notShownAlteredCases +=
                leftAlteredCasesPerGene.get(leftGene)! -
                rightAteredCasesPerGene.get(leftGene)!;
            result.affectedGenes += 1;
        }
    }
    return result;
}

export function filteredOutAlterationsMessage(
    info: FilteredOutAlterations,
    what: string = 'alteration',
    where: string = 'analysis'
) {
    return `${info.notShownAlteredCases} ${what}${
        info.notShownAlteredCases > 1 ? 's' : ''
    } in ${info.affectedGenes} gene${info.affectedGenes > 1 ? 's' : ''} ${
        info.notShownAlteredCases > 1 ? 'are' : 'is'
    } not counted in this ${where}.`;
}
