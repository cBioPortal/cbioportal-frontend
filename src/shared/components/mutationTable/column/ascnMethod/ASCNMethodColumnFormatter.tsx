import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import { MutationTableColumnType } from '../../MutationTable';
import ColumnLegend from 'shared/components/mutationTable/ColumnLegend';

/**
 * @author Avery Wang
 */

export function getASCNMethodValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'ascnMethod')
        ? mutation.alleleSpecificCopyNumber.ascnMethod
        : '';
}

export const getDefaultASCNMethodColumnDefinition = () => {
    return {
        name: MutationTableColumnType.ASCN_METHOD,
        tooltip: (
            <ColumnLegend
                description={
                    <span>
                        Method used for allele-specific copy number (ASCN)
                        analysis, e.g. FACETS.
                    </span>
                }
            />
        ),
        render: (d: Mutation[]) => (
            <>
                <span>{getASCNMethodValue(d[0])}</span>
            </>
        ),
        sortBy: (d: Mutation[]) => getASCNMethodValue(d[0]),
        download: (d: Mutation[]) =>
            d.map(mutation => getASCNMethodValue(mutation)),
        visible: false,
    };
};
