import * as React from 'react';
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
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

/**
 * Mutation Column Formatter.
 */
export default class CustomDriverTypeColumnFormatter {
    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: Mutation[]) {
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
        >,
        isPutativeDriver?: (mutation: Partial<AnnotatedMutation>) => boolean
    ) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTypeColumnFormatter.getTextValue(
            mutations
        );

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

        let content;
        if (isPutativeDriver !== undefined && isPutativeDriver(mutations[0])) {
            content = (
                <span>
                    <strong>{text}</strong>
                </span>
            );
        } else {
            content = <span>{text} </span>;
        }

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
