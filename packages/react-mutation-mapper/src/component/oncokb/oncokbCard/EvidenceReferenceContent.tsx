import React from 'react';
import { If, Then, Else } from 'react-if';
import { Citations } from 'oncokb-ts-api-client';

import SummaryWithRefs from '../SummaryWithRefs';
import ReferenceList from '../ReferenceList';
import { ICache } from '../../../model/SimpleCache';

export const EvidenceReferenceContent: React.FunctionComponent<{
    description?: string;
    citations?: Citations;
    noInfoDisclaimer?: string;
    pmidData?: ICache;
}> = props => {
    return (
        <If condition={!!props.description}>
            <Then>
                <SummaryWithRefs
                    content={props.description}
                    type={'tooltip'}
                    pmidData={props.pmidData!}
                />
            </Then>
            <Else>
                <If
                    condition={
                        props.citations != undefined &&
                        (props.citations.abstracts.length > 0 ||
                            props.citations.pmids.length > 0)
                    }
                >
                    <Then>
                        <ReferenceList
                            pmidData={props.pmidData}
                            pmids={props.citations!.pmids.map(pmid =>
                                Number(pmid)
                            )}
                            abstracts={props.citations!.abstracts}
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
