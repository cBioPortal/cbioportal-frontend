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
        } else {
            return undefined;
        }
    }

    @computed get clinVarContent() {
        // first map by origin, then count evidence number for each origin group
        return this.rcvCountMap ? (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.clinVarTooltip()}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {_.map(
                        Object.entries(this.rcvCountMap),
                        ([origin, clinicalSignificanceCountMap]) => {
                            return (
                                <div key={origin}>
                                    <strong>{`${_.upperFirst(
                                        origin
                                    )}: `}</strong>
                                    {_.join(
                                        _.map(
                                            Object.entries(
                                                clinicalSignificanceCountMap
                                            ),
                                            ([clinicalSignificance, count]) => {
                                                return `${clinicalSignificance} (${count} evidences)`;
                                            }
                                        ),
                                        ', '
                                    )}
                                </div>
                            );
                        }
                    )}
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
