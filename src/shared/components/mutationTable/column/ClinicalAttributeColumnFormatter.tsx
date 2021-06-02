import * as React from 'react';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import {
    TableCellStatusIndicator,
    TableCellStatus,
    TruncatedText,
} from 'cbioportal-frontend-commons';

/**
 * @author Rajat Sirohi
 */
export default class ClinicalAttributeColumnFormatter {
    static sampleToValuesCache: {
        [key: string]: { [key: string]: string };
    } = {};

    public static getTextValue(
        data: Mutation[],
        mutationsTabClinicalData: ClinicalData[],
        isPatientAttribute: boolean,
        clinicalAttributeId: string
    ): string {
        let sample = data[0].sampleId;
        if (
            sample in this.sampleToValuesCache &&
            clinicalAttributeId in this.sampleToValuesCache[sample]
        ) {
            return this.sampleToValuesCache[sample][clinicalAttributeId];
        }

        let clinicalDatum: ClinicalData | undefined;
        if (isPatientAttribute) {
            clinicalDatum = mutationsTabClinicalData.find(
                x =>
                    x.patientId === data[0].patientId &&
                    x.clinicalAttributeId === clinicalAttributeId
            );
        } else {
            clinicalDatum = mutationsTabClinicalData.find(
                x =>
                    x.sampleId === data[0].sampleId &&
                    x.clinicalAttributeId === clinicalAttributeId
            );
        }

        let textValue = clinicalDatum ? clinicalDatum.value : '';

        if (!(sample in this.sampleToValuesCache))
            this.sampleToValuesCache[sample] = {};
        this.sampleToValuesCache[sample][clinicalAttributeId] = textValue;

        return textValue;
    }

    public static sortBy(
        data: Mutation[],
        mutationsTabClinicalData: ClinicalData[],
        isPatientAttribute: boolean,
        clinicalAttributeId: string,
        datatype: string
    ): string | number | null {
        let textValue = this.getTextValue(
            data,
            mutationsTabClinicalData,
            isPatientAttribute,
            clinicalAttributeId
        );
        let sortValue = datatype === 'NUMBER' ? +textValue : textValue;

        return textValue === '' ? null : sortValue;
    }

    public static render(
        data: Mutation[],
        mutationsTabClinicalData: ClinicalData[],
        isPatientAttribute: boolean,
        clinicalAttributeId: string
    ) {
        let textValue = this.getTextValue(
            data,
            mutationsTabClinicalData,
            isPatientAttribute,
            clinicalAttributeId
        );

        if (textValue === '') {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt="Clinical attribute not available for this sample."
                />
            );
        }

        return (
            <TruncatedText
                maxLength={30}
                text={textValue || ''}
                tooltip={<div style={{ maxWidth: 300 }}>{textValue}</div>}
            />
        );
    }
}
