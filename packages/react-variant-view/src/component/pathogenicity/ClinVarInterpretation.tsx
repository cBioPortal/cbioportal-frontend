import * as React from 'react';
import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed, makeObservable } from 'mobx';
import { Clinvar } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface IClinVarInterpretationProps {
    clinVar: Clinvar | undefined;
}

@observer
class ClinVarInterpretation extends React.Component<
    IClinVarInterpretationProps
> {
    constructor(props: IClinVarInterpretationProps) {
        super(props);
        makeObservable(this);
    }

    @computed get clinvarTooltip() {
        const clinvarUrl = this.props.clinVar
            ? `https://www.ncbi.nlm.nih.gov/clinvar/variation/${this.props.clinVar.clinvarId}/`
            : `https://www.ncbi.nlm.nih.gov/clinvar/`;
        return (
            <DefaultTooltip
                placement="top"
                overlay={<span>ClinVar Interpretation</span>}
            >
                <a href={clinvarUrl} target="_blank" rel="noopener noreferrer">
                    ClinVar Interpretation
                </a>
            </DefaultTooltip>
        );
    }

    @computed get clinvarData() {
        const clinvarUrl = this.props.clinVar
            ? `https://www.ncbi.nlm.nih.gov/clinvar/variation/${this.props.clinVar.clinvarId}/`
            : `https://www.ncbi.nlm.nih.gov/clinvar/`;
        if (this.props.clinVar) {
            if (
                this.props.clinVar.clinicalSignificance &&
                this.props.clinVar.conflictingClinicalSignificance
            ) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={clinvarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={featureTableStyle['data-with-link']}
                        >
                            {`${this.props.clinVar.clinicalSignificance} (${this.props.clinVar.conflictingClinicalSignificance})`}
                        </a>
                    </div>
                );
            } else if (this.props.clinVar.clinicalSignificance) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={clinvarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={featureTableStyle['data-with-link']}
                        >
                            {this.props.clinVar.clinicalSignificance}
                        </a>
                    </div>
                );
            }
        }

        return <div>N/A</div>;
    }

    public render() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.clinvarTooltip}
                </div>
                {this.clinvarData}
            </div>
        );
    }
}

export default ClinVarInterpretation;
