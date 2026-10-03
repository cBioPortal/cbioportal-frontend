import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import ClonalElement, {
    ClonalCircle,
} from 'shared/components/mutationTable/column/clonal/ClonalElement';
import ColumnLegend from 'shared/components/mutationTable/ColumnLegend';

/**
 * @author Avery Wang
 */

export enum ClonalValue {
    CLONAL = 'CLONAL',
    SUBCLONAL = 'SUBCLONAL',
    INDETERMINATE = 'INDETERMINATE',
    NA = 'NA',
}

export function getClonalValue(mutation: Mutation): ClonalValue {
    let textValue: ClonalValue = ClonalValue.NA;
    if (hasASCNProperty(mutation, 'clonal')) {
        textValue =
            mutation.alleleSpecificCopyNumber.clonal in ClonalValue
                ? (ClonalValue as any)[mutation.alleleSpecificCopyNumber.clonal] // needs the cast to prevent typescript error
                : ClonalValue.NA;
    }
    return textValue;
}

export const ClonalColumnLegend: React.FunctionComponent = () => (
    <ColumnLegend
        description={
            <span>
                Clonality of the mutation, inferred from its cancer cell
                fraction (CCF) as estimated by allele-specific copy number
                (ASCN) analysis.
            </span>
        }
        categories={[
            {
                value: ClonalValue.CLONAL,
                label: 'Clonal',
                description:
                    'Estimated to be present in all or nearly all cancer cells',
                swatch: <ClonalCircle clonalValue={ClonalValue.CLONAL} />,
            },
            {
                value: ClonalValue.SUBCLONAL,
                label: 'Subclonal',
                description:
                    'Estimated to be present in only a subset of cancer cells',
                swatch: <ClonalCircle clonalValue={ClonalValue.SUBCLONAL} />,
            },
            {
                value: ClonalValue.INDETERMINATE,
                label: 'Indeterminate',
                description: 'Clonality could not be confidently determined',
                swatch: (
                    <ClonalCircle clonalValue={ClonalValue.INDETERMINATE} />
                ),
            },
            {
                value: ClonalValue.NA,
                label: 'NA',
                description:
                    'ASCN analysis was not performed or data is unavailable',
                swatch: <ClonalCircle clonalValue={ClonalValue.NA} />,
            },
        ]}
    />
);

export const getDefaultClonalColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.CLONAL,
        tooltip: <ClonalColumnLegend />,
        render: (d: Mutation[]) =>
            ClonalColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            d.map(m =>
                hasASCNProperty(m, 'ccfExpectedCopiesUpper')
                    ? m.alleleSpecificCopyNumber.ccfExpectedCopiesUpper
                    : null
            ),
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
                'ccfExpectedCopies'
            )
                ? mutation.alleleSpecificCopyNumber.ccfExpectedCopies.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? 'INDETERMINATE'
                : 'NA';
        }

        return (
            <span data-test="clonal-cell">
                {sampleIds.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <ClonalElement
                                sampleId={sampleId}
                                clonalValue={
                                    sampleToValue[sampleId]
                                        ? sampleToValue[sampleId]
                                        : ClonalValue.NA
                                }
                                ccfExpectedCopies={
                                    sampleToCCF[sampleId]
                                        ? sampleToCCF[sampleId]
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

    public static getClonalDownload(mutations: Mutation[]): string[] {
        return mutations.map(mutation => getClonalValue(mutation));
    }
}
