import * as React from 'react';
import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed, makeObservable } from 'mobx';
import { Clinvar } from 'genome-nexus-ts-api-client';
import { Button } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface IClinVarInterpretationProps {
    clinVar: Clinvar | undefined;
}

const ClinVarTooltip = () => {
    return (
        <DefaultTooltip
            placement="top"
            overlay={<span>ClinVar Interpretation</span>}
        >
            <Button bsStyle="link" className="btn-sm p-0">
                ClinVar Interpretation
            </Button>
        </DefaultTooltip>
    );
};

@observer
class ClinVarInterpretation extends React.Component<
    IClinVarInterpretationProps
> {
    constructor(props: IClinVarInterpretationProps) {
        super(props);
        makeObservable(this);
    }

    @computed get clinvarData() {
        if (this.props.clinVar) {
            if (
                this.props.clinVar.clinicalSignificance &&
                this.props.clinVar.conflictingClinicalSignificance
            ) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        {`${this.props.clinVar.clinicalSignificance} (${this.props.clinVar.conflictingClinicalSignificance})`}
                    </div>
                );
            } else if (this.props.clinVar.clinicalSignificance) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        {this.props.clinVar.clinicalSignificance}
                    </div>
                );
            }
        }

        return <div>N/A</div>;
    }

    @computed get clinVarContent() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    <ClinVarTooltip />
                </div>
                {this.clinvarData}
            </div>
        );
    }

    public render() {
        return this.clinVarContent;
    }
}

export default ClinVarInterpretation;
