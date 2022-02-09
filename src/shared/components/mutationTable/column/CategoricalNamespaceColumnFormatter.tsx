import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import _ from 'lodash';

/**
 * @author Pim van Nierop
 */
export default class CategoricalNamespaceColumnFormatter {
    public static getData(
        data: Mutation[],
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
        data: Mutation[],
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
        data: Mutation[],
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
        data: Mutation[],
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
