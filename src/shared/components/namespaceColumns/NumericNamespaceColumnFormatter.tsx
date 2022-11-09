import * as React from 'react';
import _ from 'lodash';
import generalStyles from 'shared/components/mutationTable/column/styles.module.scss';

export type WithNamespace = {
    namespaceColumns: {};
};

/**
 * @author Pim van Nierop
 */
export default class NumericNamespaceColumnFormatter {
    public static getData(
        data: WithNamespace[],
        namespaceName: any,
        namespaceColumnName: any
    ): number | null {
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
    ): number | null {
        return NumericNamespaceColumnFormatter.getData(
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
        const value = NumericNamespaceColumnFormatter.getData(
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
        const download = NumericNamespaceColumnFormatter.getData(
            data,
            namespaceName,
            namespaceColumnName
        );
        return <div className={generalStyles['integer-data']}>{download}</div>;
    }
}
