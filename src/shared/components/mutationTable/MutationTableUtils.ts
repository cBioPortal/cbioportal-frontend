import {
    defaultFilter,
    ExtendedMutationTableColumnType,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import { Mutation } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import { createNamespaceColumns } from 'shared/components/namespaceColumns/createNamespaceColumns';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';

export function createMutationNamespaceColumns(
    namespaceColumnConfig: NamespaceColumnConfig | undefined
): Record<ExtendedMutationTableColumnType, MutationTableColumn> {
    const columns: Record<
        ExtendedMutationTableColumnType,
        MutationTableColumn
    > = createNamespaceColumns<Mutation>(namespaceColumnConfig);

    for (const key in columns) {
        const column = columns[key];
        column.filter = (
            d: Mutation[],
            filterString: string,
            filterStringUpper: string
        ) => defaultFilter(d, key, filterStringUpper);
        column.visible = !!getServerConfig()
            .skin_mutation_table_namespace_column_show_by_default;
        column.order = 400;
    }
    return columns;
}
