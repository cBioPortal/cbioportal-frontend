import * as React from 'react';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';

/**
 * @author Avery Wang
 */

function getASCNMethodValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'ascnMethod')
        ? mutation.alleleSpecificCopyNumber.ascnMethod
        : '';
}

export const getDefaultASCNMethodColumnDefinition = () => {
    return {
        name: 'ASCN Method',
        tooltip: <span>Allele Specific Copy Number Method</span>,
        render: (d: Mutation[]) => (
            <>
                <span>{getASCNMethodValue(d[0])}</span>
            </>
        ),
        sortBy: (d: Mutation[]) => getASCNMethodValue(d[0]),
        download: (d: Mutation[]) =>
            d.map(mutation => getASCNMethodValue(mutation)),
    };
};
