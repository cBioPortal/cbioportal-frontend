import NumericNamespaceColumnFormatter, {
    WithNamespace,
} from './NumericNamespaceColumnFormatter';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import CategoricalNamespaceColumnFormatter from './CategoricalNamespaceColumnFormatter';
import { NamespaceColumnConfig } from './NamespaceColumnConfig';
import { createNamespaceColumnName } from './createNamespaceColumnName';

export function createNamespaceColumns<T extends WithNamespace>(
    namespaceColumnConfig?: NamespaceColumnConfig | undefined
) {
    const columns = {} as Record<string, Column<T[]>>;

    if (!namespaceColumnConfig) {
        return columns;
    }

    _.forIn(namespaceColumnConfig, (namespaceColumnNames, namespaceName) =>
        _.forIn(namespaceColumnNames, (type, namespaceColumnName) => {
            const columnName = createNamespaceColumnName(
                namespaceName,
                namespaceColumnName
            );
            const fRender =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.renderFunction(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
                          CategoricalNamespaceColumnFormatter.renderFunction(
                              d,
                              namespaceName,
                              namespaceColumnName
                          );
            const fSort =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.sortValue(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
                          CategoricalNamespaceColumnFormatter.sortValue(
                              d,
                              namespaceName,
                              namespaceColumnName
                          );

            const fDownload =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.download(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
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
                align: type === 'number' ? 'right' : 'left',
            };
        })
    );
    return columns;
}
