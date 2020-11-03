import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed } from 'mobx';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    extendMutations,
    isGermlineMutation,
    isSomaticMutation,
} from '../../util/MutationDataUtils';
import { Pathogenicity } from '../../util/Constants';
import { signalLogoInTable } from '../featureTable/SignalLogo';

interface ICancerPatientPopulationProps {
    variantAnnotation?: VariantAnnotation;
}

export const PathogenicityNameHelper = {
    [Pathogenicity.SOMATIC]: {
        title: 'Somatic',
        description:
            'Percent of cancer patients with this mutation detected in somatic tumor sample.',
    },
    [Pathogenicity.GERMLINE]: {
        title: 'Germline',
        description:
            'Percent of cancer patients with this mutation detected in germline DNA.',
    },
    [Pathogenicity.BIALLELIC]: {
        title: 'Biallelic',
        description:
            'Percent of pathogenic germline carriers with somatic biallelic inactivation in the corresponding tumor sample.',
    },
};

@observer
class CancerPatientPopulation extends React.Component<
    ICancerPatientPopulationProps
> {
    @computed get frequenciesContent() {
        let contentMap: Map<string, JSX.Element> = new Map();
        let content: JSX.Element[] = [];
        if (
            this.props.variantAnnotation &&
            this.props.variantAnnotation.signalAnnotation &&
            this.props.variantAnnotation.signalAnnotation.annotation.length > 0
        ) {
            const signalMutaiton = extendMutations(
                this.props.variantAnnotation.signalAnnotation.annotation
            );
            _.forEach(signalMutaiton, mutation => {
                if (isGermlineMutation(mutation)) {
                    contentMap.set(
                        Pathogenicity.GERMLINE,
                        this.percentageContent(
                            Pathogenicity.GERMLINE,
                            this.fixDisplayValue(mutation.germlineFrequency)
                        )
                    );

                    const germline = contentMap.get(Pathogenicity.GERMLINE);

                    if (mutation.ratioBiallelicPathogenic && germline) {
                        contentMap.set(
                            Pathogenicity.GERMLINE,
                            this.percentageContent(
                                Pathogenicity.GERMLINE,
                                this.fixDisplayValue(
                                    mutation.germlineFrequency
                                ),
                                <span>
                                    {` (`}
                                    <DefaultTooltip
                                        placement="top"
                                        overlay={
                                            <span>
                                                {
                                                    PathogenicityNameHelper[
                                                        Pathogenicity.BIALLELIC
                                                    ].description
                                                }
                                            </span>
                                        }
                                    >
                                        <span
                                            className={
                                                featureTableStyle[
                                                    'data-source-without-linkout'
                                                ]
                                            }
                                        >
                                            {
                                                PathogenicityNameHelper[
                                                    Pathogenicity.BIALLELIC
                                                ].title
                                            }
                                        </span>
                                    </DefaultTooltip>
                                    {signalLogoInTable}
                                    {`: `}
                                    {this.fixDisplayValue(
                                        mutation.ratioBiallelicPathogenic
                                    )}
                                    {`%)`}
                                </span>
                            )
                        );
                    }
                } else if (isSomaticMutation(mutation)) {
                    contentMap.set(
                        Pathogenicity.SOMATIC,
                        this.percentageContent(
                            Pathogenicity.SOMATIC,
                            this.fixDisplayValue(mutation.somaticFrequency)
                        )
                    );
                }
            });

            // show germline on the top
            if (contentMap.get(Pathogenicity.GERMLINE)) {
                content.push(contentMap.get(Pathogenicity.GERMLINE)!);
            }
            if (contentMap.get(Pathogenicity.SOMATIC)) {
                content.push(contentMap.get(Pathogenicity.SOMATIC)!);
            }
        }
        if (content.length === 0) {
            content.push(
                <div key={'cancer-patient-prevalence-no-data'}>
                    No data available
                </div>
            );
        }
        return content;
    }

    // duplicate of FrequencyCell.tsx mainContent()
    private fixDisplayValue(value: number | null) {
        const fractionDigits = 1;
        const fixed =
            value === null ? '-' : (value * 100).toFixed(fractionDigits);
        let displayValue = fixed;

        // if the actual value is not zero but the display value is like 0.00, then show instead < 0.01
        if (value !== null && value !== 0 && Number(fixed) === 0) {
            displayValue = `< ${1 / Math.pow(10, fractionDigits)}`;
        }
        return displayValue;
    }

    private percentageContent(
        category: Pathogenicity,
        value: string,
        children?: JSX.Element
    ) {
        return (
            <div
                className={featureTableStyle['feature-table-layout']}
                key={`percentage-${value}`}
            >
                <div className={featureTableStyle['data-source']}>
                    <DefaultTooltip
                        placement="top"
                        overlay={
                            <span>
                                {PathogenicityNameHelper[category].description}
                            </span>
                        }
                    >
                        <span
                            className={
                                featureTableStyle['data-source-without-linkout']
                            }
                        >
                            {PathogenicityNameHelper[category].title}
                        </span>
                    </DefaultTooltip>
                    {signalLogoInTable}
                </div>
                <div
                    className={featureTableStyle['data-with-link']}
                    key={`percentage-${value}`}
                >
                    {value}
                    {`%`}
                    {children}
                </div>
            </div>
        );
    }

    public render() {
        return this.frequenciesContent;
    }
}

export default CancerPatientPopulation;
