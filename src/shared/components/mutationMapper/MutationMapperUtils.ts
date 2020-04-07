import { Mutation } from 'cbioportal-ts-api-client';

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
