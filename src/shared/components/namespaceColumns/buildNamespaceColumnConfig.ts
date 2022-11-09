import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';
import _ from 'lodash';
import { WithNamespace } from 'shared/components/namespaceColumns/NumericNamespaceColumnFormatter';

export function buildNamespaceColumnConfig(
    mutations: WithNamespace[]
): NamespaceColumnConfig {
    if (!mutations) {
        return {};
    }
    const columnTypes: any = {};
    mutations.forEach(m => {
        _.forIn(m.namespaceColumns, (columns, namespace) => {
            _.forIn(columns, (value, columnName) => {
                if (columnTypes[namespace] === undefined) {
                    columnTypes[namespace] = {};
                }
                if (columnTypes[namespace][columnName] === undefined) {
                    columnTypes[namespace][columnName] = 'number';
                }
                if (
                    _.isString(value) &&
                    columnTypes[namespace][columnName] === 'number'
                ) {
                    columnTypes[namespace][columnName] = 'string';
                }
            });
        });
    });
    return columnTypes;
}
