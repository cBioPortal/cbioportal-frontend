import { Mutation } from 'cbioportal-ts-api-client';
import { GenomeNexusAPI, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { fetchVariantAnnotationsByMutation } from 'react-mutation-mapper';
import { getServerConfig } from 'config/config';
import _ from 'lodash';
import { NamespaceColumnConfig } from 'shared/components/mutationTable/MutationTable';

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
                getServerConfig().isoformOverrideSource,
                client
            );
        } else {
            return Promise.resolve([]);
        }
    };
}

export function buildNamespaceColumnConfig(
    mutations: Mutation[]
): NamespaceColumnConfig {
    if (!mutations) {
        return {};
    }
    const namespaceConfig: NamespaceColumnConfig = {};
    const nameSpaces = _.flatMap(mutations, m => _.keys(m.namespaceColumns));
    nameSpaces.forEach(nameSpace => {
        let columnCollapse: any = {};
        _(mutations)
            .map(m => _.get(m.namespaceColumns, nameSpace))
            .forEach(column => _.mergeWith(columnCollapse, column, fMerge));
        columnCollapse = _.mapValues(columnCollapse, (values: any[]) => {
            return !values.some(_.isString) ? 'number' : 'string';
        });
        namespaceConfig[nameSpace] = columnCollapse;
    });
    return namespaceConfig;
}

export function createNamespaceColumnName(
    namespaceName: string,
    namespaceColumnName: string
) {
    return namespaceName + ' ' + _.capitalize(namespaceColumnName);
}

export function extractColumnNames(config: NamespaceColumnConfig): string[] {
    return _.flatMap(config, (namespaceCol, namespaceName) =>
        _.keys(namespaceCol).map(namespaceColumnName =>
            createNamespaceColumnName(
                namespaceName.toString(),
                namespaceColumnName
            )
        )
    );
}

function fMerge(refObject: any, addedObject: any) {
    if (_.isArray(refObject)) {
        return refObject.concat(addedObject);
    } else {
        return [addedObject];
    }
}
