import {
    ExtendedMutationTableColumnType,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import { getServerConfig } from 'config/config';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
export function adjustVisibility(
    tableColumns: Record<string, Column<any>>,
    namespaceColumns: string[],
    visibleColumnsProperty: string,
    showNamespaceColumns: boolean
) {
    if (!visibleColumnsProperty) {
        return;
    }
    const visibleColumns = visibleColumnsProperty.split(',');
    Object.keys(tableColumns).forEach(column => {
        if (visibleColumns.includes(column)) {
            tableColumns[column].visible = true;
        } else {
            // If not specified by name, only show the column when it is a namespace column and
            // the skin_mutation_table_namespace_column_show_by_default is 'true'.
            const isVisible =
                namespaceColumns.includes(column) && showNamespaceColumns;
            tableColumns[column].visible = isVisible;
        }
    });
}
