import * as React from 'react';
import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed, makeObservable } from 'mobx';
import { ClinVar } from 'genome-nexus-ts-api-client';
import { Button } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    ClinVarRcvInterpretation,
    getRcvCountMap,
    getRcvData,
} from 'react-mutation-mapper';

export interface IClinVarInterpretationProps {
    clinVar: ClinVar | undefined;
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

    @computed get rcvCountMap() {
        if (this.props.clinVar) {
            return getRcvCountMap(this.props.clinVar);
        }

        return undefined;
    }

    @computed get rcvDisplayData() {
        if (this.rcvCountMap) {
            return getRcvData(this.rcvCountMap);
        }
        return undefined;
    }

    @computed get clinVarContent() {
        return this.rcvDisplayData ? (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    <ClinVarTooltip />
                </div>
                <ClinVarRcvInterpretation
                    className={featureTableStyle['data-with-link']}
                    rcvData={this.rcvDisplayData}
                />
            </div>
        ) : (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    <ClinVarTooltip />
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    <div>N/A</div>
                </div>
            </div>
        );
    }

    public render() {
        return this.clinVarContent;
    }
}

export default ClinVarInterpretation;
