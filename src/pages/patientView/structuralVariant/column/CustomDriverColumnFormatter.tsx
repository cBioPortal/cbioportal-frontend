import * as React from 'react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedStructuralVariant } from 'shared/model/AnnotatedMutation';

/**
 * Discrete Copy Number Formatter.
 */
export default class CustomDriverTypeColumnFormatter {
    public static getTextValue(data: StructuralVariant[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: StructuralVariant[]) {
        if (data.length > 0) {
            if (
                data[0].driverFilterAnn === null ||
                data[0].driverFilterAnn === ''
            ) {
                return data[0].driverFilter;
            }
            return data[0].driverFilterAnn;
        } else {
            return null;
        }
    }

    public static renderFunction(cnaData: StructuralVariant[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTypeColumnFormatter.getTextValue(
            cnaData
        );

        // use actual value for tooltip
        const toolTip: string = CustomDriverTypeColumnFormatter.getTextValue(
            cnaData
        );

        let content;
        if (
            cnaData[0] !== undefined &&
            (cnaData[0] as AnnotatedStructuralVariant).putativeDriver
        ) {
            content = (
                <span>
                    <strong>{text}</strong>
                </span>
            );
        } else {
            content = <span>{text}</span>;
        }

        return <span>{content}</span>;
    }
}
