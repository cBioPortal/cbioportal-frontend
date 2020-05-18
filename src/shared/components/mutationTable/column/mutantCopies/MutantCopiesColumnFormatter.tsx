import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import MutantCopiesElement from 'shared/components/mutationTable/column/mutantCopies/MutantCopiesElement';
import { RV_NA } from 'shared/constants';

/**
 * @author Avery Wang
 */

function getSampleIdToMutantCopiesMap(
    data: Mutation[]
): { [key: string]: string } {
    const sampleToValue: { [key: string]: string } = {};
    for (const mutation of data) {
        const value: string = getMutantCopiesValue(mutation);
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
    } = getSampleIdToMutantCopiesMap(data);
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

function getMutantCopiesValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'totalCopyNumber') &&
        hasASCNProperty(mutation, 'mutantCopies')
        ? mutation.alleleSpecificCopyNumber.mutantCopies.toString() +
              '/' +
              mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
        : '';
}

export const getDefaultMutantCopiesColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: 'Mutant Copies',
        tooltip: (
            <span>FACETS Best Guess for Mutant Copies / Total Copies</span>
        ),
        render: (d: Mutation[]) =>
            MutantCopiesColumnFormatter.renderFunction(
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
            MutantCopiesColumnFormatter.getMutantCopiesDownload(d),
    };
};

export default class MutantCopiesColumnFormatter {
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
        const sampleToMutantCopies: { [key: string]: string } = {};
        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : RV_NA;
            sampleToMutantCopies[mutation.sampleId] = hasASCNProperty(
                mutation,
                'mutantCopies'
            )
                ? mutation.alleleSpecificCopyNumber.mutantCopies.toString()
                : RV_NA;
        }

        // exclude samples with invalid count value (undefined || emtpy || lte 0)
        const samplesWithValue = sampleIds.filter(
            sampleId =>
                sampleToTotalCopyNumber[sampleId] &&
                sampleToMutantCopies[sampleId] &&
                sampleToTotalCopyNumber[sampleId] !== RV_NA &&
                sampleToMutantCopies[sampleId] !== RV_NA
        );

        return (
            <>
                {samplesWithValue.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <MutantCopiesElement
                                sampleId={sampleId}
                                totalCopyNumberValue={
                                    sampleToTotalCopyNumber[sampleId]
                                }
                                mutantCopiesValue={
                                    sampleToMutantCopies[sampleId]
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

    public static getMutantCopiesDownload(mutations: Mutation[]): string[] {
        return mutations.map(mutation => getMutantCopiesValue(mutation));
    }
}
