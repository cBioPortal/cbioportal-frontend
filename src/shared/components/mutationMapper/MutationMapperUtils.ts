import { Mutation } from 'cbioportal-ts-api-client';
import { GenomeNexusAPI, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { fetchVariantAnnotationsByMutation } from 'react-mutation-mapper';
import AppConfig from 'appConfig';

export function normalizeMutation<T extends Pick<Mutation, 'chr'>>(
    mutation: T
) {
    return Object.assign({ chromosome: mutation.chr }, mutation);
}

export function normalizeMutations<T extends Pick<Mutation, 'chr'>>(
    mutations: T[]
) {
    return mutations.map(normalizeMutation);
}

export function createVariantAnnotationsByMutationFetcher(
    fields: string[],
    client: GenomeNexusAPI
) {
    return function(queries: Mutation[]): Promise<VariantAnnotation[]> {
        if (queries.length > 0) {
            return fetchVariantAnnotationsByMutation(
                queries,
                fields,
                AppConfig.serverConfig.isoformOverrideSource,
                client
            );
        } else {
            return Promise.resolve([]);
        }
    };
}
