import * as React from 'react';
import * as _ from 'lodash';
import { ClonalValue } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import ClonalColumnFormatter from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import ASCNCopyNumberElement from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import { ASCNCopyNumberValue } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import { ASCN_BLACK } from 'shared/lib/Colors';
import { getASCNCopyNumberColor } from 'shared/lib/ASCNUtils';

/**
 * @author Avery Wang
 */

// gets value displayed in table cell - "NA" if missing attributes needed for calculation
function getAscnCopyNumberData(
    mutation: Mutation,
    sampleIdToClinicalDataMap:
        | { [sampleId: string]: ClinicalData[] }
        | undefined
) {
    return hasASCNProperty(mutation, 'ascnIntegerCopyNumber')
        ? mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber
        : ASCNCopyNumberValue.NA;
}

// sort by total copy number (since that is the number displayed in the icon
function getAllTotalCopyNumberForMutation(
    data: Mutation[],
    sampleIdToClinicalDataMap: { [key: string]: ClinicalData[] } | undefined,
    sampleIds: string[]
) {
    const sampleToCNA: { [key: string]: string } = _.chain(data)
        .keyBy('sampleId')
        .mapValues(function(mutation) {
            let ascnCopyNumberValue = getAscnCopyNumberData(
                mutation,
                sampleIdToClinicalDataMap
            );
            if (
                ascnCopyNumberValue !== ASCNCopyNumberValue.NA &&
                hasASCNProperty(mutation, 'totalCopyNumber') &&
                getWGD(sampleIdToClinicalDataMap, mutation.sampleId) !==
                    ASCNCopyNumberValue.NA &&
                getASCNCopyNumberColor(ascnCopyNumberValue.toString()) !==
                    ASCN_BLACK
            ) {
                return mutation.alleleSpecificCopyNumber.totalCopyNumber.toString();
            }
            return ASCNCopyNumberValue.NA;
        })
        .value();
    return sampleToCNA;
}

function getSortValue(
    data: Mutation[],
    sampleIdToClinicalDataMap: { [key: string]: ClinicalData[] } | undefined,
    sampleIds: string[]
) {
    const displayValuesBySample: {
        [key: string]: string;
    } = getAllTotalCopyNumberForMutation(
        data,
        sampleIdToClinicalDataMap,
        sampleIds
    );
    const sampleIdsWithValues = sampleIds.filter(
        sampleId => displayValuesBySample[sampleId]
    );
    const displayValuesAsString = sampleIdsWithValues.map(
        (sampleId: string) => {
            return displayValuesBySample[sampleId];
        }
    );
    return displayValuesAsString.join(';');
}

export function getWGD(
    sampleIdToClinicalDataMap:
        | { [sampleId: string]: ClinicalData[] }
        | undefined,
    sampleId: string
) {
    let wgdData = sampleIdToClinicalDataMap
        ? sampleIdToClinicalDataMap[sampleId].filter(
              (cd: ClinicalData) => cd.clinicalAttributeId === 'FACETS_WGD'
          )
        : undefined;
    return wgdData !== undefined && wgdData.length > 0
        ? wgdData[0].value
        : ASCNCopyNumberValue.NA;
}

export const getDefaultASCNCopyNumberColumnDefinition = (
    sampleIds?: string[],
    sampleIdToClinicalDataMap?: { [sampleId: string]: ClinicalData[] },
    sampleManager?: SampleManager | null
) => {
    return {
        name: 'Integer Copy #',
        render: (d: Mutation[]) =>
            ASCNCopyNumberColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleIdToClinicalDataMap,
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            getSortValue(
                d,
                sampleIdToClinicalDataMap,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : []
            ),
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
        sampleIdToClinicalDataMap?: { [sampleId: string]: ClinicalData[] },
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
                : ASCNCopyNumberValue.NA;
            sampleToMinorCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'minorCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.minorCopyNumber.toString()
                : ASCNCopyNumberValue.NA;
            sampleToASCNCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'ascnIntegerCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber.toString()
                : ASCNCopyNumberValue.NA;
        }

        return (
            <>
                {sampleIds.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <ASCNCopyNumberElement
                                sampleId={sampleId}
                                wgdValue={getWGD(
                                    sampleIdToClinicalDataMap,
                                    sampleId
                                )}
                                totalCopyNumberValue={
                                    sampleToTotalCopyNumber[sampleId]
                                        ? sampleToTotalCopyNumber[sampleId]
                                        : ASCNCopyNumberValue.NA
                                }
                                minorCopyNumberValue={
                                    sampleToMinorCopyNumber[sampleId]
                                        ? sampleToMinorCopyNumber[sampleId]
                                        : ASCNCopyNumberValue.NA
                                }
                                ascnCopyNumberValue={
                                    sampleToASCNCopyNumber[sampleId]
                                        ? sampleToASCNCopyNumber[sampleId]
                                        : ASCNCopyNumberValue.NA
                                }
                                sampleManager={sampleManager}
                            />
                        </span>
                    );
                })}
            </>
        );
    }
}
