import {
    DefaultTooltip,
    pluralize,
    TruncatedText,
} from 'cbioportal-frontend-commons';
import {
    Clinvar,
    MyVariantInfo,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import * as React from 'react';

export type ClinVarSummaryProps = {
    clinvar?: Clinvar;
};

const NoClinVarData = () => {
    return (
        <DefaultTooltip
            placement="topLeft"
            overlay={<span>Variant has no ClinVar data.</span>}
        >
            <span
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden',
                }}
            >
                &nbsp;
            </span>
        </DefaultTooltip>
    );
};

const ClinVarSummary = (props: ClinVarSummaryProps) => {
    if (!props.clinvar) {
        return <NoClinVarData />;
    } else {
        const clinVarId = props.clinvar.clinvarId;
        const clinVarLink = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinVarId}/`;
        const clinicalSignificance = props.clinvar.clinicalSignificance;
        const conflictingClinicalSignificance =
            props.clinvar.conflictingClinicalSignificance;
        return (
            <TruncatedText
                maxLength={30}
                text={clinicalSignificance}
                addTooltip="always"
                tooltip={
                    <div style={{ maxWidth: 300 }}>
                        {conflictingClinicalSignificance && (
                            <div>{conflictingClinicalSignificance}</div>
                        )}
                        <div>
                            (ClinVar ID:{' '}
                            <a href={clinVarLink} target="_blank">
                                {clinVarId}
                            </a>
                            )
                        </div>
                    </div>
                }
            />
        );
    }
};

export default ClinVarSummary;
