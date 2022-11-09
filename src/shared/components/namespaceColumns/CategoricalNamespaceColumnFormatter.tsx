import * as React from 'react';
import _ from 'lodash';
import { WithNamespace } from './NumericNamespaceColumnFormatter';

/**
 * @author Pim van Nierop
 */
export default class CategoricalNamespaceColumnFormatter {
    public static getData(
        data: WithNamespace[],
        namespaceName: any,
        namespaceColumnName: any
    ): string | null {
        if (data) {
            const namespaces = data[0].namespaceColumns;
            const namespace = _.get(namespaces, namespaceName, undefined);
            return namespace
                ? _.get(namespace, namespaceColumnName, null)
                : null;
        }
        return null;
    }

    public static sortValue(
        data: WithNamespace[],
        namespaceName: string,
        namespaceColumnName: string
    ): string | null {
        return CategoricalNamespaceColumnFormatter.getData(
            data,
            namespaceName,
            namespaceColumnName
        );
    }

    public static download(
        data: WithNamespace[],
        namespaceName: string,
        namespaceColumnName: string
    ): string {
        const value = CategoricalNamespaceColumnFormatter.getData(
            data,
            namespaceName,
            namespaceColumnName
        );
        return value ? value.toString() : '';
    }

    public static renderFunction(
        data: WithNamespace[],
        namespaceName: string,
        namespaceColumnName: string
    ) {
        const download = CategoricalNamespaceColumnFormatter.getData(
            data,
            namespaceName,
            namespaceColumnName
        );
        return <div>{download}</div>;
    }
}
