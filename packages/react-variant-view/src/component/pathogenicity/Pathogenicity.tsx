import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import { ClinVar, SignalAnnotation } from 'genome-nexus-ts-api-client';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import Oncokb from './Oncokb';
import ClinVarInterpretation from './ClinVarInterpretation';
import Penetrance from './Penetrance';
import MSKExpertReview from './MSKExpertReview';

interface IPathogenicityProps {
    clinVar?: ClinVar;
    oncokb?: IndicatorQueryResp;
    signalAnnotation?: SignalAnnotation;
    isCanonicalTranscriptSelected: boolean;
}

@observer
class Pathogenicity extends React.Component<IPathogenicityProps> {
    public render() {
        return (
            <div>
                <Penetrance signalAnnotation={this.props.signalAnnotation} />
                <ClinVarInterpretation clinVar={this.props.clinVar} />
                <Oncokb
                    oncokb={this.props.oncokb}
                    isCanonicalTranscriptSelected={
                        this.props.isCanonicalTranscriptSelected
                    }
                />
            </div>
        );
    }
}

export default Pathogenicity;
