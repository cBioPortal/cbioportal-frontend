import * as React from 'react';
import LazyLoadedTableCell from 'shared/lib/LazyLoadedTableCell';
import ClinicalAttributeCache from '../../../cache/ClinicalAttributeCache';
import {
    Mutation,
    ClinicalData,
    ClinicalAttribute,
} from 'cbioportal-ts-api-client';
import { TruncatedText } from 'cbioportal-frontend-commons';

/**
 * @author Rajat Sirohi
 */
export default class ClinicalAttributeColumnFormatter {
    static clinicalAttributeCache = new ClinicalAttributeCache();

    public static getTextValue(
        d: Mutation[],
        attribute: ClinicalAttribute
    ): string {
        const clinicalDatum = this.clinicalAttributeCache.get({
            clinicalAttribute: attribute,
            entityId: attribute.patientAttribute
                ? d[0].patientId
                : d[0].sampleId,
            studyId: d[0].studyId,
        })?.data;
        return clinicalDatum ? clinicalDatum.value : '';
    }

    public static sortBy(
        d: Mutation[],
        attribute: ClinicalAttribute
    ): string | number | null {
        let textValue = this.getTextValue(d, attribute);
        let sortValue =
            attribute.datatype === 'NUMBER' ? +textValue : textValue;

        return textValue === '' ? null : sortValue;
    }

    public static makeRenderFunction(attribute: ClinicalAttribute) {
        return LazyLoadedTableCell(
            (d: Mutation[]) => {
                return this.clinicalAttributeCache.get({
                    clinicalAttribute: attribute,
                    entityId: attribute.patientAttribute
                        ? d[0].patientId
                        : d[0].sampleId,
                    studyId: d[0].studyId,
                });
            },
            (t: ClinicalData) => (
                <TruncatedText
                    maxLength={30}
                    text={t.value || ''}
                    tooltip={<div style={{ maxWidth: 300 }}>{t.value}</div>}
                />
            ),
            'Clinical attribute not available for this sample.'
        );
    }
}
