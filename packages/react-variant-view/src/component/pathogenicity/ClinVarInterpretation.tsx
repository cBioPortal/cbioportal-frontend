import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed } from 'mobx';
import { ClinVar } from 'genome-nexus-ts-api-client';
import { Button } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

interface IClinVarInterpretationProps {
    clinVar: ClinVar | undefined;
}

enum ClinVarOrigin {
    GERMLINE = 'germline',
    SOMATIC = 'somatic',
}

type rcvDisplayData = {
    name: string;
    content: string;
};

@observer
class ClinVarInterpretation extends React.Component<
    IClinVarInterpretationProps
> {
    @computed get rcvCountMap() {
        if (this.props.clinVar) {
            const clinVar = this.props.clinVar;
            const filteredRcv = clinVar.rcv.filter(
                rcv =>
                    rcv.origin === ClinVarOrigin.GERMLINE ||
                    rcv.origin === ClinVarOrigin.SOMATIC
            );
            const rcvMap = _.groupBy(filteredRcv, d => d.origin);
            const rcvCountMap = _.mapValues(rcvMap, rcvs =>
                _.countBy(rcvs, rcv => rcv.clinicalSignificance)
            );
            return rcvCountMap;
        }
        return undefined;
    }

    @computed get rcvDisplayData() {
        if (this.rcvCountMap) {
            return _.map(
                Object.entries(this.rcvCountMap),
                ([origin, clinicalSignificanceCountMap]) => {
                    return {
                        name: origin,
                        content: _.join(
                            _.map(
                                Object.entries(clinicalSignificanceCountMap),
                                ([clinicalSignificance, count]) => {
                                    return `${clinicalSignificance} (${count} evidences)`;
                                }
                            ),
                            ', '
                        ),
                    };
                }
            );
        }
        return undefined;
    }

    @computed get clinVarContent() {
        // first map by origin, then count evidence number for each origin group
        return this.rcvDisplayData ? (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.clinVarTooltip()}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {_.map(this.rcvDisplayData, (d: rcvDisplayData) => {
                        return (
                            <div key={d.name}>
                                <strong>{`${_.upperFirst(d.name)}: `}</strong>
                                {d.content}
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.clinVarTooltip()}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    <div>N/A</div>
                </div>
            </div>
        );
    }

    private clinVarTooltip() {
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
    }

    public render() {
        return this.clinVarContent;
    }
}

export default ClinVarInterpretation;
