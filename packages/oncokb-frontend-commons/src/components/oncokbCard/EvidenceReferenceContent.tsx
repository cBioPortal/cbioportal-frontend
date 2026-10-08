import React from 'react';
import { If, Then, Else } from 'react-if';
import { Citations } from 'oncokb-ts-api-client';

import SummaryWithRefs from '../SummaryWithRefs';
import { ReferenceList } from '../ReferenceList';

export const EvidenceReferenceContent: React.FunctionComponent<{
    description?: string;
    citations?: Citations;
    noInfoDisclaimer?: string;
}> = props => {
    // JSX builds the props of every branch below before If picks one, so the
    // citation arrays are resolved up front rather than read off a citations
    // object that is optional, or that OncoKB can return without either array.
    const abstracts = props.citations?.abstracts || [];
    const pmids = props.citations?.pmids || [];

    return (
        <If condition={!!props.description}>
            <Then>
                <SummaryWithRefs content={props.description} type={'tooltip'} />
            </Then>
            <Else>
                <If condition={abstracts.length > 0 || pmids.length > 0}>
                    <Then>
                        <ReferenceList
                            pmids={pmids.map(pmid => Number(pmid))}
                            abstracts={abstracts}
                        />
                    </Then>
                    <Else>
                        {props.noInfoDisclaimer
                            ? props.noInfoDisclaimer
                            : 'Information is not available.'}
                    </Else>
                </If>
            </Else>
        </If>
    );
};
