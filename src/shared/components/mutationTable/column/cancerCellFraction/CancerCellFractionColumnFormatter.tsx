import * as React from 'react';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import CancerCellFractionElement from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionElement';

/**
 * @author Avery Wang
 */

function getCancerCellFractionValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'ccfMCopies')
        ? mutation.alleleSpecificCopyNumber.ccfMCopies.toFixed(2)
        : '';
}

export const getDefaultCancerCellFractionColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager
) => {
    return {
        name: 'CCF',
        tooltip: <span>Cancer Cell Fraction</span>,
        render: (d: Mutation[]) =>
            CancerCellFractionColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) => d.map(m => +getCancerCellFractionValue(m)),
        download: (d: Mutation[]) =>
            CancerCellFractionColumnFormatter.getCancerCellFractionDownload(d),
    };
};

export default class CancerCellFractionColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"CancerCellFraction" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleManager?: SampleManager
    ) {
        const sampleToCCFValue: { [key: string]: string } = {};
        for (const mutation of data) {
            sampleToCCFValue[mutation.sampleId] = hasASCNProperty(
                mutation,
                'ccfMCopies'
            )
                ? mutation.alleleSpecificCopyNumber.ccfMCopies.toString()
                : 'NA';
        }
        return (
            <span>
                <CancerCellFractionElement
                    sampleIds={sampleIds}
                    sampleToCCFValue={sampleToCCFValue}
                    sampleManager={sampleManager}
                />
            </span>
        );
    }

    public static getCancerCellFractionDownload(
        mutations: Mutation[]
    ): string[] {
        return mutations.map(mutation => getCancerCellFractionValue(mutation));
    }
}
