import _ from 'lodash';
import {
    defaultFilter,
    ExtendedMutationTableColumnType,
    MutationTableColumn,
    NamespaceColumnConfig,
} from 'shared/components/mutationTable/MutationTable';
import { Mutation } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import { createNamespaceColumnName } from 'shared/components/mutationMapper/MutationMapperUtils';
import NumericNamespaceColumnFormatter from 'shared/components/mutationTable/column/NumericNamespaceColumnFormatter';
import CategoricalNamespaceColumnFormatter from 'shared/components/mutationTable/column/CategoricalNamespaceColumnFormatter';

export function createNamespaceColumns(
    namespaceColumnConfig: NamespaceColumnConfig | undefined
): Record<ExtendedMutationTableColumnType, MutationTableColumn> {
    const columns = {} as Record<
        ExtendedMutationTableColumnType,
        MutationTableColumn
    >;
    if (namespaceColumnConfig) {
        _.forIn(namespaceColumnConfig, (namespaceColumnNames, namespaceName) =>
            _.forIn(namespaceColumnNames, (type, namespaceColumnName) => {
                const columnName = createNamespaceColumnName(
                    namespaceName,
                    namespaceColumnName
                );
                const fRender =
                    type === 'number'
                        ? (d: Mutation[]) =>
                              NumericNamespaceColumnFormatter.renderFunction(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              )
                        : (d: Mutation[]) =>
                              CategoricalNamespaceColumnFormatter.renderFunction(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              );
                const fSort =
                    type === 'number'
                        ? (d: Mutation[]) =>
                              NumericNamespaceColumnFormatter.sortValue(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              )
                        : (d: Mutation[]) =>
                              CategoricalNamespaceColumnFormatter.sortValue(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              );

                const fDownload =
                    type === 'number'
                        ? (d: Mutation[]) =>
                              NumericNamespaceColumnFormatter.download(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              )
                        : (d: Mutation[]) =>
                              CategoricalNamespaceColumnFormatter.download(
                                  d,
                                  namespaceName,
                                  namespaceColumnName
                              );
                columns[columnName] = {
                    id: columnName,
                    name: columnName,
                    render: fRender,
                    sortBy: fSort,
                    download: fDownload,
                    filter: (
                        d: Mutation[],
                        filterString: string,
                        filterStringUpper: string
                    ) => defaultFilter(d, columnName, filterStringUpper),
                    visible: !!getServerConfig()
                        .skin_mutation_table_namespace_column_show_by_default,
                    order: 400,
                    align: type === 'number' ? 'right' : 'left',
                };
            })
        );
    }
    return columns;
}
