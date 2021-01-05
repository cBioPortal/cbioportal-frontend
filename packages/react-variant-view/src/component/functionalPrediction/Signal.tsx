import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed } from 'mobx';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    IExtendedSignalMutation,
    extendMutations,
    isGermlineMutation,
    isPathogenicMutation,
    isSomaticMutation,
    SignalMutationStatus,
} from 'cbioportal-utils';
import { signalLogoInTable } from '../featureTable/SignalLogo';

interface ISignalProps {
    variantAnnotation?: VariantAnnotation;
}

@observer
class Signal extends React.Component<ISignalProps> {
    @computed get mutationStatusData() {
        let content: string[] = [];
        if (
            this.props.variantAnnotation &&
            this.props.variantAnnotation.signalAnnotation
        ) {
            const extendedSignalMutation = extendMutations(
                this.props.variantAnnotation.signalAnnotation.annotation
            );
            _.forEach(extendedSignalMutation, mutation => {
                if (!isSomaticMutation(mutation)) {
                    content.push(this.mutationStatusAccessor(mutation));
                }
            });
        }
        return content.length > 0 ? content.join(', ') : 'N/A';
    }

    private mutationStatusAccessor(mutation: IExtendedSignalMutation) {
        // don't return somatic
        if (isGermlineMutation(mutation)) {
            if (isPathogenicMutation(mutation)) {
                return SignalMutationStatus.PATHOGENIC_GERMLINE;
            } else {
                return SignalMutationStatus.BENIGN_GERMLINE;
            }
        }
        return 'Unknown';
    }

    private penetranceTooltip() {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        Pathogenicity prediction by the classifier described in
                        Srinivasan et al.
                    </span>
                }
            >
                <span
                    className={featureTableStyle['data-source-without-linkout']}
                >
                    SIGNAL
                </span>
            </DefaultTooltip>
        );
    }

    public render() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.penetranceTooltip()}
                    {signalLogoInTable}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {this.mutationStatusData}
                </div>
            </div>
        );
    }
}

export default Signal;
