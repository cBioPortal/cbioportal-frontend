import { Clinvar, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod, Mutation, RemoteData } from 'cbioportal-utils';
import ClinVarSummary from '../clinvar/ClinVarSummary';
import { getClinVarData } from './ClinVarHelper';
import { errorIcon, loaderIcon } from '../StatusHelpers';

type ClinVarProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
};

export function download(clinvar?: Clinvar): string {
    const clinicalSignificance = clinvar?.clinicalSignificance;
    const conflictingClinicalSignificance =
        clinvar?.conflictingClinicalSignificance;
    if (clinicalSignificance && conflictingClinicalSignificance) {
        return (
            clinicalSignificance + '(' + conflictingClinicalSignificance + ')'
        );
    } else if (clinicalSignificance) {
        return clinicalSignificance;
    } else {
        return '';
    }
}

export function sortValue(clinvar?: Clinvar): string | null {
    if (clinvar && clinvar.clinicalSignificance) {
        return clinvar.clinicalSignificance;
    } else {
        return null;
    }
}

export function clinVarSortMethod(a: Clinvar, b: Clinvar) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class ClinVar extends React.Component<ClinVarProps, {}> {
    public render() {
        if (this.props.indexedVariantAnnotations) {
            let content;
            const status = this.props.indexedVariantAnnotations.status;
            if (status === 'pending') {
                content = loaderIcon();
            } else if (status === 'error') {
                content = errorIcon('Error fetching Genome Nexus annotation');
            } else {
                const clinvarData = getClinVarData(
                    this.props.mutation,
                    this.props.indexedVariantAnnotations
                );
                content = <ClinVarSummary clinvar={clinvarData} />;
            }
            return content;
        } else {
            return <div />;
        }
    }
}
