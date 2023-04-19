import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Vues } from 'genome-nexus-ts-api-client';
import React from 'react';

export const RevueContent: React.FunctionComponent<{ vue?: Vues }> = props => {
    return props.vue ? (
        <>
            {props.vue.comment}{' '}
            <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${props.vue.pubmedIds[0]}/`} // should be multiple links if have a list of ids? Also need a list of reference text
                rel="noopener noreferrer"
                target="_blank"
            >
                ({props.vue.referenceText})
            </a>
        </>
    ) : (
        <span>NA</span>
    );
};

export function sortValue(vue: Vues | undefined): number {
    let score = 0;

    if (vue) {
        score = 1;
    }

    return score;
}

export const RevueIcon: React.FunctionComponent<{
    isVue?: boolean;
    vue?: Vues;
}> = props => {
    return <span>A</span>;
    // return props.isVue ? (
    //     <DefaultTooltip
    //             placement="bottom"
    //             overlay={
    //                 <span>
    //                     <RevueContent vue={props.vue} /> |
    //                     Source:{' '}
    //                     <a
    //                         href="https://cancerrevue.org"
    //                         target="_blank"
    //                         rel="noopener noreferrer"
    //                     >
    //                         reVUE <i className="fa fa-external-link" />
    //                     </a>
    //                 </span>
    //             }
    //         >
    //             <span>
    //                 <a
    //                     href="https://cancerrevue.org"
    //                     target="_blank"
    //                     rel="noopener noreferrer"
    //                     style={{ textDecoration: 'none' }}
    //                 >
    //                     <img
    //                         src={'../../images/vue_logo.png'}
    //                         alt="reVUE logo"
    //                         width={12}
    //                         style={{ paddingRight: 5, marginTop: -2 }}
    //                     />
    //                 </a>
    //             </span>
    //         </DefaultTooltip>
    // ) : <></>;
};
