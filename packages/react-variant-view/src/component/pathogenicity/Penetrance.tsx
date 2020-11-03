import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed } from 'mobx';
import { SignalAnnotation } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { signalLogoInTable } from '../featureTable/SignalLogo';

interface IPenetranceProps {
    signalAnnotation?: SignalAnnotation;
}

@observer
class Penetrance extends React.Component<IPenetranceProps> {
    @computed get penetranceData() {
        if (
            this.props.signalAnnotation &&
            this.props.signalAnnotation.annotation
        ) {
            const penetrances = _.chain(this.props.signalAnnotation.annotation)
                .map(annotation => annotation.penetrance)
                .filter(penetrance => penetrance !== undefined)
                .uniq()
                .value();
            if (penetrances.length > 0) {
                return penetrances.join(', ') + ' penetrance';
            }
        }
        return 'N/A';
    }

    @computed get penetranceContent() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.penetranceTooltip()}
                    {signalLogoInTable}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    <div>{this.penetranceData}</div>
                </div>
            </div>
        );
    }

    private penetranceTooltip() {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        Proportion of individuals with pathogenic variants in a
                        <br />
                        given gene that develop cancer over their lifetime.
                    </span>
                }
            >
                <span
                    className={featureTableStyle['data-source-without-linkout']}
                >
                    Penetrance
                </span>
            </DefaultTooltip>
        );
    }

    public render() {
        return this.penetranceContent;
    }
}

export default Penetrance;
