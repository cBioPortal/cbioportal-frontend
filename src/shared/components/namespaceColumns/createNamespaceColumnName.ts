import _ from 'lodash';

export function createNamespaceColumnName(
    namespaceName: string,
    namespaceColumnName: string
) {
    return namespaceName + ' ' + _.capitalize(namespaceColumnName);
}
