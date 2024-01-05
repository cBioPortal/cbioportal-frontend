import * as React from 'react';
import { DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';

/**
 * Discrete Copy Number Formatter.
 */
export default class CustomDriverTypeColumnFormatter {
    public static getTextValue(data: DiscreteCopyNumberData[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: DiscreteCopyNumberData[]) {
        if (data.length > 0) {
            if (
                data[0].driverFilterAnnotation === null ||
                data[0].driverFilterAnnotation === ''
            ) {
                return data[0].driverFilter;
            }
            return data[0].driverFilterAnnotation;
        } else {
            return null;
        }
    }

    public static renderFunction(cnaData: DiscreteCopyNumberData[]) {
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
            ((cnaData[0] as unknown) as AnnotatedNumericGeneMolecularData)
                .putativeDriver
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
