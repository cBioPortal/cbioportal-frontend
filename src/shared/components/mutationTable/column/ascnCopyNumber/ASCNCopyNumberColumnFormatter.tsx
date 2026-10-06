import * as React from 'react';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import ASCNCopyNumberElement from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import ColumnLegend from 'shared/components/mutationTable/ColumnLegend';
import { ASCNCopyNumberValueEnum } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import {
    CLINICAL_ATTRIBUTE_ID_ENUM,
    MUTATION_DATA_FIELD_ENUM,
} from 'shared/constants';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from 'oncokb-frontend-commons';
import styles from 'shared/components/mutationTable/column/ascnCopyNumber/ascnCopyNumber.module.scss';

/**
 * @author Avery Wang
 */

// total copy number, the number shown in the icon
export function getTotalCopyNumber(mutation: Mutation): number | null {
    return hasASCNProperty(mutation, 'totalCopyNumber')
        ? mutation.alleleSpecificCopyNumber.totalCopyNumber
        : null;
}

export function getWGD(
    sampleIdToClinicalDataMap:
        | { [sampleId: string]: ClinicalData[] }
        | undefined,
    sampleId: string
) {
    const clinicalData =
        sampleIdToClinicalDataMap && sampleId in sampleIdToClinicalDataMap
            ? sampleIdToClinicalDataMap[sampleId]
            : [];
    const wgdData = clinicalData.find(
        (cd: ClinicalData) =>
            cd.clinicalAttributeId === CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD
    );
    if (wgdData !== undefined) {
        return wgdData.value;
    }
    const facetsWgdData = clinicalData.find(
        (cd: ClinicalData) =>
            cd.clinicalAttributeId === CLINICAL_ATTRIBUTE_ID_ENUM.FACETS_WGD
    );
    if (facetsWgdData !== undefined) {
        switch (facetsWgdData.value.toUpperCase()) {
            case 'TRUE':
                return ASCNCopyNumberValueEnum.WGD;
            case 'FALSE':
                return 'no WGD';
        }
    }
    return ASCNCopyNumberValueEnum.NA;
}

export const ASCNCopyNumberColumnLegend: React.FunctionComponent = () => (
    <ColumnLegend
        description={
            <span>
                Total integer copy number at the mutated locus from
                allele-specific copy number analysis. A <b>WGD</b> tag marks a
                sample with whole genome doubling. Hover over a value for the
                allele-specific call (e.g. CNLOH) and the minor copy number.
            </span>
        }
    />
);

export const getDefaultASCNCopyNumberColumnDefinition = (
    sampleIds?: string[],
    sampleIdToClinicalDataMap?:
        | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
        | undefined,
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.ASCN_COPY_NUM,
        tooltip: <ASCNCopyNumberColumnLegend />,
        render: (d: Mutation[]) =>
            ASCNCopyNumberColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleIdToClinicalDataMap,
                sampleManager
            ),
        sortBy: (d: Mutation[]) => d.map(getTotalCopyNumber),
        visible: false,
    };
};

export default class ASCNCopyNumberColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"Clonal" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleIdToClinicalDataMap?:
            | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
            | undefined,
        sampleManager?: SampleManager | null
    ) {
        const sampleToTotalCopyNumber: { [key: string]: string } = {};
        const sampleToMinorCopyNumber: { [key: string]: string } = {};
        const sampleToASCNCopyNumber: { [key: string]: string } = {};

        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
            sampleToMinorCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'minorCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.minorCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
            sampleToASCNCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                MUTATION_DATA_FIELD_ENUM.ASCN_INTEGER_COPY_NUMBER
            )
                ? mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
        }
        if (
            sampleIdToClinicalDataMap === undefined ||
            sampleIdToClinicalDataMap.isError
        ) {
            return errorIcon('Error fetching data');
        } else if (sampleIdToClinicalDataMap.isComplete) {
            return (
                <span
                    data-test="ascn-copy-number-cell"
                    className={styles.slots}
                >
                    {sampleIds.map((sampleId: string) => {
                        const wgdValue = getWGD(
                            sampleIdToClinicalDataMap.result,
                            sampleId
                        );
                        return (
                            <span
                                key={sampleId}
                                className={
                                    wgdValue === ASCNCopyNumberValueEnum.WGD
                                        ? styles.totalCopyNumberSlotWithWgd
                                        : styles.totalCopyNumberSlot
                                }
                            >
                                <ASCNCopyNumberElement
                                    sampleId={sampleId}
                                    wgdValue={wgdValue}
                                    totalCopyNumberValue={
                                        sampleToTotalCopyNumber[sampleId]
                                            ? sampleToTotalCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    minorCopyNumberValue={
                                        sampleToMinorCopyNumber[sampleId]
                                            ? sampleToMinorCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    ascnCopyNumberValue={
                                        sampleToASCNCopyNumber[sampleId]
                                            ? sampleToASCNCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    sampleManager={sampleManager}
                                />
                            </span>
                        );
                    })}
                </span>
            );
        } else {
            return loaderIcon('pull-left');
        }
    }
}
