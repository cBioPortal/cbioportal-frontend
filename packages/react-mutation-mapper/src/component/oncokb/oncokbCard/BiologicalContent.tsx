import React from 'react';
import { Citations } from 'oncokb-ts-api-client';

import { ICache } from '../../../model/SimpleCache';
import { EvidenceReferenceContent } from './EvidenceReferenceContent';

export const BiologicalContent: React.FunctionComponent<{
    biologicalSummary: string;
    mutationEffectCitations: Citations;
    pmidData: ICache;
}> = props => {
    return (
        <EvidenceReferenceContent
            description={props.biologicalSummary}
            citations={props.mutationEffectCitations}
            pmidData={props.pmidData}
            noInfoDisclaimer={'Mutation effect information is not available.'}
        />
    );
};
