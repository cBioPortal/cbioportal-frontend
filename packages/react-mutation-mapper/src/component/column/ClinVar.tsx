import {
    Clinvar,
    MyVariantInfo,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod, Mutation, RemoteData } from 'cbioportal-utils';
import ClinVarSummary from '../clinvar/ClinVarSummary';
import {
    MyVariantInfoProps,
    renderMyVariantInfoContent,
} from './MyVariantInfoHelper';
import { getClinVarData } from './ClinVarHelper';

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

export default class ClinVar extends React.Component<ClinVarProps, {}> {
    get clinvar() {
        return getClinVarData(
            this.props.mutation,
            this.props.indexedVariantAnnotations
        );
    }

    public render() {
        return <ClinVarSummary clinvar={this.clinvar} />;
    }
}
