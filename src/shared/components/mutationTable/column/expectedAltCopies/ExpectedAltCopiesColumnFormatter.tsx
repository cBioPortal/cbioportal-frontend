import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import ExpectedAltCopiesElement from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesElement';
import { RESPONSE_VALUE_NA } from 'shared/constants';

/**
 * @author Avery Wang
 */

function getSampleIdToExpectedAltCopiesMap(
    data: Mutation[]
): { [key: string]: string } {
    const sampleToValue: { [key: string]: string } = {};
    for (const mutation of data) {
        const value: string = getExpectedAltCopiesValue(mutation);
        if (value.length > 0) {
            sampleToValue[mutation.sampleId] = value;
        }
    }
    return sampleToValue;
}

export function getDisplayValueAsString(
    data: Mutation[],
    sampleIds: string[]
): string {
    const displayValuesBySample: {
        [key: string]: string;
    } = getSampleIdToExpectedAltCopiesMap(data);
    const sampleIdsWithValues = sampleIds.filter(
        sampleId => displayValuesBySample[sampleId]
    );
    const displayValuesAsString = sampleIdsWithValues.map(
        (sampleId: string) => {
            return displayValuesBySample[sampleId];
        }
    );
    return displayValuesAsString.join('; ');
}

function getExpectedAltCopiesValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'totalCopyNumber') &&
        hasASCNProperty(mutation, 'expectedAltCopies')
        ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString() +
              '/' +
              mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
        : '';
}

export const getDefaultExpectedAltCopiesColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: 'Expected Alt Copies',
        tooltip: <span>Best Guess for Expected Alt Copies / Total Copies</span>,
        render: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            getDisplayValueAsString(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : []
            ),
        download: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.getExpectedAltCopiesDownload(d),
    };
};

export default class ExpectedAltCopiesColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"Clonal" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleManager?: SampleManager | null
    ) {
        const sampleToTotalCopyNumber: { [key: string]: string } = {};
        const sampleToExpectedAltCopies: { [key: string]: string } = {};
        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : RESPONSE_VALUE_NA;
            sampleToExpectedAltCopies[mutation.sampleId] = hasASCNProperty(
                mutation,
                'expectedAltCopies'
            )
                ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString()
                : RESPONSE_VALUE_NA;
        }

        // exclude samples with invalid count value (undefined || emtpy || lte 0)
        const samplesWithValue = sampleIds.filter(
            sampleId =>
                sampleToTotalCopyNumber[sampleId] &&
                sampleToExpectedAltCopies[sampleId] &&
                sampleToTotalCopyNumber[sampleId] !== RESPONSE_VALUE_NA &&
                sampleToExpectedAltCopies[sampleId] !== RESPONSE_VALUE_NA
        );

        return (
            <>
                {samplesWithValue.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <ExpectedAltCopiesElement
                                sampleId={sampleId}
                                totalCopyNumberValue={
                                    sampleToTotalCopyNumber[sampleId]
                                }
                                expectedAltCopiesValue={
                                    sampleToExpectedAltCopies[sampleId]
                                }
                                sampleManager={sampleManager}
                            />
                            {index !== samplesWithValue.length - 1 ? ';' : ''}
                        </span>
                    );
                })}
            </>
        );
    }

    public static getExpectedAltCopiesDownload(
        mutations: Mutation[]
    ): string[] {
        return mutations.map(mutation => getExpectedAltCopiesValue(mutation));
    }
}
