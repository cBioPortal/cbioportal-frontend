import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    extendMutations,
    getVariantAnnotation,
    IExtendedSignalMutation,
    Mutation,
    RemoteData,
    formatNumberValueInSignificantDigits,
    defaultSortMethod,
    generateTumorTypeDecomposition,
} from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    MutationTumorTypeFrequencyTable,
    FrequencyTableColumnEnum,
    DefaultTooltip,
    FREQUENCY_COLUMNS_DEFINITION,
} from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { errorIcon, loaderIcon } from '../StatusHelpers';
type SignalProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
};

export function getSignalData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >
): IExtendedSignalMutation {
    let signalData = {} as IExtendedSignalMutation;
    const variantAnnotation = indexedVariantAnnotations
        ? getVariantAnnotation(mutation, indexedVariantAnnotations.result)
        : undefined;
    if (
        variantAnnotation &&
        variantAnnotation.signalAnnotation &&
        variantAnnotation.signalAnnotation.annotation &&
        variantAnnotation.signalAnnotation.annotation.length > 0
    ) {
        variantAnnotation.signalAnnotation.annotation.forEach(annotation => {
            // only have one germline annotation
            if (annotation.mutationStatus.includes('germline')) {
                signalData = extendMutations([annotation])[0];
            }
        });
    }
    return signalData;
}
export function signalSortMethod(
    a: IExtendedSignalMutation,
    b: IExtendedSignalMutation
) {
    return defaultSortMethod(getSortValue(a), getSortValue(b));
}
export function getSortValue(
    signalData: IExtendedSignalMutation
): number | null {
    return signalData.germlineFrequency || null;
}

export function download(signalData: IExtendedSignalMutation): string {
    return signalData.germlineFrequency != null
        ? `${formatNumberValueInSignificantDigits(
              signalData.germlineFrequency,
              2
          )}`
        : '';
}

@observer
export default class Signal extends React.Component<SignalProps, {}> {
    public render() {
        if (this.props.indexedVariantAnnotations) {
            let content;
            const status = this.props.indexedVariantAnnotations.status;
            if (status === 'pending') {
                content = loaderIcon();
            } else if (status === 'error') {
                content = errorIcon('Error fetching Genome Nexus annotation');
            } else {
                content = <div />;
                const signalData = getSignalData(
                    this.props.mutation,
                    this.props.indexedVariantAnnotations
                );
                if (signalData.tumorTypeDecomposition) {
                    // prevalenceFrequency will be 0 if frequency is 0, otherwise show frequency as number with 2 significant digits
                    const prevalenceFrequency = formatNumberValueInSignificantDigits(
                        signalData.germlineFrequency,
                        2
                    );
                    if (prevalenceFrequency !== null) {
                        content = (
                            <DefaultTooltip
                                placement="top"
                                overlayStyle={{
                                    width: 800,
                                }}
                                overlay={
                                    <MutationTumorTypeFrequencyTable
                                        data={generateTumorTypeDecomposition(
                                            signalData,
                                            signalData.countsByTumorType,
                                            signalData.biallelicCountsByTumorType,
                                            signalData.qcPassCountsByTumorType,
                                            signalData.statsByTumorType
                                        )}
                                        columns={[
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .TUMOR_TYPE
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MUTATION_STATUS
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .SAMPLE_COUNT
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .VARIANT_COUNT
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .PREVALENCE_FREQUENCY
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .BIALLELIC_RATIO
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MEDIAN_AGE_AT_DX
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MEDIAN_TMB
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MSI_SCORE
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MEDIAN_HRD_LST
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MEDIAN_HRD_NTELOMERIC_AI
                                            ],
                                            FREQUENCY_COLUMNS_DEFINITION[
                                                FrequencyTableColumnEnum
                                                    .MEDIAN_HRD_FRACTION_LOH
                                            ],
                                        ]}
                                    />
                                }
                            >
                                <span>{prevalenceFrequency}</span>
                            </DefaultTooltip>
                        );
                    }
                }
            }

            return content;
        } else {
            return <div />;
        }
    }
}
