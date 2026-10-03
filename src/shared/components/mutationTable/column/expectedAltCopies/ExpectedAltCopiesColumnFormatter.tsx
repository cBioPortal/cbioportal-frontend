import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import ExpectedAltCopiesElement from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesElement';
import { RESPONSE_VALUE_NA } from 'shared/constants';
import ColumnLegend from 'shared/components/mutationTable/ColumnLegend';
import styles from 'shared/components/mutationTable/column/ascnCopyNumber/ascnCopyNumber.module.scss';

/**
 * @author Avery Wang
 */

export function getExpectedAltCopiesValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'totalCopyNumber') &&
        hasASCNProperty(mutation, 'expectedAltCopies')
        ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString() +
              '/' +
              mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
        : '';
}

// number of mutant copies, the value shown in the cell
export function getExpectedAltCopies(mutation: Mutation): number | null {
    return hasASCNProperty(mutation, 'expectedAltCopies')
        ? mutation.alleleSpecificCopyNumber.expectedAltCopies
        : null;
}

export const getDefaultExpectedAltCopiesColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.EXPECTED_ALT_COPIES,
        tooltip: (
            <ColumnLegend
                description={
                    <span>
                        Best guess for the integer number of copies of the
                        mutant allele, from allele-specific copy number
                        analysis. Hover over a value for the total copy number
                        at the locus, which is also shown in the Total Integer
                        Copy # column.
                    </span>
                }
            />
        ),
        render: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) => d.map(getExpectedAltCopies),
        download: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.getExpectedAltCopiesDownload(d),
        visible: false,
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

        // only signify NA (no FACETS analysis done) if ASCN METHOD not set
        // else indicate indeterminte
        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? 'INDETERMINATE'
                : RESPONSE_VALUE_NA;
            sampleToExpectedAltCopies[mutation.sampleId] = hasASCNProperty(
                mutation,
                'expectedAltCopies'
            )
                ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? 'INDETERMINATE'
                : RESPONSE_VALUE_NA;
        }

        return (
            <span data-test="eac-cell" className={styles.slots}>
                {sampleIds.map((sampleId: string) => {
                    return (
                        <span
                            key={sampleId}
                            className={styles.mutantCopiesSlot}
                        >
                            <ExpectedAltCopiesElement
                                sampleId={sampleId}
                                totalCopyNumberValue={
                                    sampleToTotalCopyNumber[sampleId]
                                        ? sampleToTotalCopyNumber[sampleId]
                                        : 'NA'
                                }
                                expectedAltCopiesValue={
                                    sampleToExpectedAltCopies[sampleId]
                                        ? sampleToExpectedAltCopies[sampleId]
                                        : 'NA'
                                }
                                sampleManager={sampleManager}
                            />
                        </span>
                    );
                })}
            </span>
        );
    }

    public static getExpectedAltCopiesDownload(
        mutations: Mutation[]
    ): string[] {
        return mutations.map(mutation => getExpectedAltCopiesValue(mutation));
    }
}
