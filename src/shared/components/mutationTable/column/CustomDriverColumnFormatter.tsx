import * as React from 'react';
import {
    DefaultTooltip,
    getCanonicalMutationType,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    ICategoricalColumn,
    createToolTip,
} from './CategoricalColumnFormatter';
import styles from './mutationType.module.scss';
import { getVariantAnnotation, RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { RevueCell } from 'react-mutation-mapper';
import { getServerConfig } from 'config/config';

/**
 * Mutation Column Formatter.
 */
export default class CustomDriverTypeColumnFormatter {
    // /**
    //  * Determines the display value.
    //  *
    //  * @param data  mutation data.
    //  * @returns {string} value to display within the column.
    //  */
    // public static getDisplayValue(data: Mutation[]): string {
    //     const entry:
    //         | ICategoricalColumn
    //         | undefined = CustomDriverTypeColumnFormatter.getMapEntry(data);

    //     // first, try to find a mapped value
    //     if (entry && entry.displayValue) {
    //         return entry.displayValue;
    //     }
    //     // if no mapped value, then return the text value as is
    //     else {
    //         return CustomDriverTypeColumnFormatter.getTextValue(data);
    //     }
    // }

    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    // public static getClassName(data: Mutation[]): string {
    //     const value:
    //         | ICategoricalColumn
    //         | undefined = CustomDriverTypeColumnFormatter.getMapEntry(data);

    //     if (value && value.className) {
    //         return value.className;
    //     }
    //     // for unmapped values, use the "other" style
    //     else {
    //         return styles.otherMutation;
    //     }
    // }

    // public static getMapEntry(data: Mutation[]) {
    //     const customDriverType = CustomDriverTypeColumnFormatter.getData(data);
    //     // console.log(customDriverType)
    //     if (customDriverType) {
    //         return CustomDriverTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP[
    //             getCanonicalMutationType(customDriverType)
    //         ];
    //     } else {
    //         return undefined;
    //     }
    // }

    public static getData(data: Mutation[]) {
        console.log(data);
        if (data.length > 0) {
            return data[0].driverFilterAnnotation;
        } else {
            return null;
        }
    }

    public static renderFunction(
        mutations: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTypeColumnFormatter.getTextValue(
            mutations
        );
        // const className: string = CustomDriverTypeColumnFormatter.getClassName(
        //     mutations
        // );

        const vue =
            indexedVariantAnnotations?.isComplete &&
            indexedVariantAnnotations?.result &&
            !_.isEmpty(mutations)
                ? getVariantAnnotation(
                      mutations[0],
                      indexedVariantAnnotations.result
                  )?.annotation_summary?.vues
                : undefined;

        // use actual value for tooltip
        const toolTip: string = CustomDriverTypeColumnFormatter.getTextValue(
            mutations
        );
        let content = <span>{text} </span>;

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip.toLowerCase() !== text.toLowerCase()) {
            content = createToolTip(content, toolTip);
        }
        return (
            <span className={styles.mutationTypeCell}>
                {content}
                {getServerConfig().show_revue && vue && (
                    <span className={styles.revueIcon}>
                        <RevueCell vue={vue} />
                    </span>
                )}
            </span>
        );
    }
}
