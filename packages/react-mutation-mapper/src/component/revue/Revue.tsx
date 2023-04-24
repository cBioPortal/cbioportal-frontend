import React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Vues } from 'genome-nexus-ts-api-client';
import annotationStyles from '../column/annotation.module.scss';

export const RevueContent: React.FunctionComponent<{ vue?: Vues }> = props => {
    return props.vue ? (
        <>
            {props.vue.comment}{' '}
            <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${props.vue.pubmedIds[0]}/`}
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
    return vue ? 1 : 0;
}

export const Revue: React.FunctionComponent<{
    isVue?: boolean;
    vue?: Vues;
}> = props => {
    return props.isVue ? (
        <DefaultTooltip
            placement="bottom"
            overlay={
                <span>
                    <RevueContent vue={props.vue} /> | Source:{' '}
                    <a
                        href="https://cancerrevue.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        reVUE <i className="fa fa-external-link" />
                    </a>
                </span>
            }
        >
            <span
                className={`${annotationStyles['annotation-item']}`}
                style={{ display: 'inline-flex' }}
            >
                <a
                    href="https://cancerrevue.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                >
                    <img
                        src={'../../images/vue_logo.png'}
                        alt="reVUE logo"
                        width={14}
                        height={14}
                    />
                </a>
            </span>
        </DefaultTooltip>
    ) : (
        <span className={`${annotationStyles['annotation-item']}`} />
    );
};
