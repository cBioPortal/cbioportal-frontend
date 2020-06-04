import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import ClonalElement from 'shared/components/mutationTable/column/clonal/ClonalElement';

/**
 * @author Avery Wang
 */

export enum ClonalValue {
    YES = 'yes',
    NO = 'no',
    NA = 'NA',
}

function getClonalValue(mutation: Mutation): ClonalValue {
    let textValue: ClonalValue = ClonalValue.NA;
    if (hasASCNProperty(mutation, 'clonal')) {
        textValue = mutation.alleleSpecificCopyNumber.clonal
            ? ClonalValue.YES
            : ClonalValue.NO;
    }
    return textValue;
}

export const getDefaultClonalColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: 'Clonal',
        tooltip: <span>FACETS Clonal</span>,
        render: (d: Mutation[]) =>
            ClonalColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            d.map(m => m.alleleSpecificCopyNumber.ccfMCopiesUpper),
        download: (d: Mutation[]) => ClonalColumnFormatter.getClonalDownload(d),
    };
};

export default class ClonalColumnFormatter {
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
        const sampleToValue: { [key: string]: string } = {};
        const sampleToCCF: { [key: string]: string } = {};
        for (const mutation of data) {
            sampleToValue[mutation.sampleId] = getClonalValue(mutation);
        }

        for (const mutation of data) {
            // check must be done because members without values will not be returned in the backend response
            sampleToCCF[mutation.sampleId] = hasASCNProperty(
                mutation,
                'ccfMCopies'
            )
                ? mutation.alleleSpecificCopyNumber.ccfMCopies.toString()
                : 'NA';
        }

        return (
            <>
                {sampleIds.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <ClonalElement
                                sampleId={sampleId}
                                clonalValue={sampleToValue[sampleId]}
                                ccfMCopies={sampleToCCF[sampleId]}
                                sampleManager={sampleManager}
                            />
                        </span>
                    );
                })}
            </>
        );
    }

    public static getClonalDownload(mutations: Mutation[]): string[] {
        return mutations.map(mutation => getClonalValue(mutation));
    }
}
