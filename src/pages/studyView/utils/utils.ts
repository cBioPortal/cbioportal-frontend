import { GeneFilterQuery, StudyViewFilter } from 'cbioportal-ts-api-client';

export function ensureBackwardCompatibilityOfFilters(
    filters: Partial<StudyViewFilter>
) {
    if (filters.geneFilters && filters.geneFilters.length) {
        filters.geneFilters.forEach(f => {
            f.geneQueries = f.geneQueries.map(arr => {
                return arr.map(inner => {
                    if (typeof inner === 'string') {
                        const fixed: GeneFilterQuery = {
                            hugoGeneSymbol: inner,
                            entrezGeneId: 0,
                            alterations: [],
                            includeDriver: true,
                            includeVUS: true,
                            includeUnknownOncogenicity: true,
                            tiersBooleanMap: {},
                            includeUnknownTier: true,
                            includeGermline: true,
                            includeSomatic: true,
                            includeUnknownStatus: true,
                        };
                        return fixed;
                    } else {
                        return inner;
                    }
                });
            });
        });
    }

    return filters;
}
