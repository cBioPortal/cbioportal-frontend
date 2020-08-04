import _ from 'lodash';

import { GenomicLocation } from 'genome-nexus-ts-api-client';
import { Mutation } from '../model/Mutation';

export function countMutationsByProteinChange(
    mutations: Mutation[]
): { proteinChange: string; count: number }[] {
    const mutationsByProteinChange = _.groupBy(mutations, 'proteinChange');
    const mutationCountsByProteinChange = _.map(
        mutationsByProteinChange,
        mutations => ({
            proteinChange: mutations[0].proteinChange,
            count: mutations.length,
        })
    );

    // order by count descending, and then protein change ascending
    return _.orderBy(
        mutationCountsByProteinChange,
        ['count', 'proteinChange'],
        ['desc', 'asc']
    );
}

export function groupMutationsByProteinStartPos(
    mutations: Mutation[]
): { [pos: number]: Mutation[] } {
    const map: { [pos: number]: Mutation[] } = {};

    for (const mutation of mutations) {
        const codon = mutation.proteinPosStart;

        if (codon !== undefined && codon !== null) {
            map[codon] = map[codon] || [];
            map[codon].push(mutation);
        }
    }

    return map;
}

export function extractGenomicLocation(
    mutation: Partial<Mutation & { chr: string }>
) {
    // TODO workaround for cbioportal API mutation type,
    //  add a custom getChromosome(mutation: Mutation) function?
    const chromosome = mutation.chromosome || mutation.chr;

    if (
        chromosome &&
        mutation.startPosition &&
        mutation.endPosition &&
        mutation.referenceAllele &&
        mutation.variantAllele
    ) {
        return {
            chromosome: chromosome.replace('chr', ''),
            start: mutation.startPosition,
            end: mutation.endPosition,
            referenceAllele: mutation.referenceAllele,
            variantAllele: mutation.variantAllele,
        };
    } else {
        return undefined;
    }
}

export function genomicLocationString(genomicLocation: GenomicLocation) {
    return `${genomicLocation.chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

export function uniqueGenomicLocations(
    mutations: Partial<Mutation>[]
): GenomicLocation[] {
    const genomicLocationMap: { [key: string]: GenomicLocation } = {};

    mutations.map((mutation: Partial<Mutation>) => {
        const genomicLocation:
            | GenomicLocation
            | undefined = extractGenomicLocation(mutation);

        if (genomicLocation) {
            genomicLocationMap[
                genomicLocationString(genomicLocation)
            ] = genomicLocation;
        }
    });

    return _.values(genomicLocationMap);
}

export function normalizeChromosome(chromosome: string) {
    switch (chromosome) {
        case '23': {
            return 'X';
        }
        case '24': {
            return 'Y';
        }
        default: {
            return chromosome;
        }
    }
}
