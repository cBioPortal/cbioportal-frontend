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
    Pathogenicity,
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

type SignalValueProps = SignalProps & {
    significantDigits?: number;
};

export function getSignalData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >,
    mutationType?: typeof Pathogenicity[keyof typeof Pathogenicity] // mutationType could be "germline", "somatic", or "undefined" which means both
): IExtendedSignalMutation[] {
    let signalData: IExtendedSignalMutation[] = [];
    const variantAnnotation = indexedVariantAnnotations
        ? getVariantAnnotation(mutation, indexedVariantAnnotations.result)
        : undefined;
    if (
        variantAnnotation &&
        variantAnnotation.signalAnnotation &&
        variantAnnotation.signalAnnotation.annotation &&
        variantAnnotation.signalAnnotation.annotation.length > 0
    ) {
        console.log(variantAnnotation.signalAnnotation.annotation);
        // if mutation is somatic OR germline, get annotation depands on mutationType
        if (variantAnnotation.signalAnnotation.annotation.length === 1) {
            if (
                (mutationType === Pathogenicity.GERMLINE &&
                    variantAnnotation.signalAnnotation.annotation[0].mutationStatus.includes(
                        'germline'
                    )) ||
                (mutationType === Pathogenicity.SOMATIC &&
                    variantAnnotation.signalAnnotation.annotation[0].mutationStatus.includes(
                        'somatic'
                    ))
            ) {
                signalData = extendMutations([
                    variantAnnotation.signalAnnotation.annotation[0],
                ]);
            }
        }
        // if mutation is both somatic AND germline, get annotation for both or depands on mutationType
        else {
            // if mutationType is undefined, get annotation for both somatic and germline
            if (mutationType === undefined) {
                signalData = extendMutations(
                    variantAnnotation.signalAnnotation.annotation
                );
            }
            variantAnnotation.signalAnnotation.annotation.forEach(
                annotation => {
                    if (
                        mutationType === Pathogenicity.GERMLINE &&
                        annotation.mutationStatus.includes('germline')
                    ) {
                        signalData = extendMutations([annotation]);
                    } else if (
                        mutationType === Pathogenicity.SOMATIC &&
                        annotation.mutationStatus.includes('somatic')
                    ) {
                        signalData = extendMutations([annotation]);
                    }
                }
            );
        }
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

export function getSignalValue(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >,
    mutationType?: typeof Pathogenicity[keyof typeof Pathogenicity],
    significantDigits?: number
) {
    const signalData = getSignalData(
        mutation,
        indexedVariantAnnotations,
        mutationType
    )[0];
    console.log(signalData);

    if (signalData && signalData.tumorTypeDecomposition) {
        return formatNumberValueInSignificantDigits(
            signalData.germlineFrequency,
            significantDigits || 2
        );
    } else {
        return null;
    }
}

export const SignalTable: React.FunctionComponent<SignalValueProps> = props => {
    const signalData = getSignalData(
        props.mutation,
        props.indexedVariantAnnotations,
        Pathogenicity.GERMLINE
    )[0];
    if (
        getSignalValue(
            props.mutation,
            props.indexedVariantAnnotations,
            Pathogenicity.GERMLINE
        ) !== null
    ) {
        return (
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
                        FrequencyTableColumnEnum.TUMOR_TYPE
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MUTATION_STATUS
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.SAMPLE_COUNT
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.VARIANT_COUNT
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.PREVALENCE_FREQUENCY
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.BIALLELIC_RATIO
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_TMB
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MSI_SCORE
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_LST
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH
                    ],
                ]}
            />
        );
    } else {
        return null;
    }
};

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
                const signalValue = getSignalValue(
                    this.props.mutation,
                    this.props.indexedVariantAnnotations,
                    Pathogenicity.GERMLINE
                );
                if (signalValue !== null) {
                    content = (
                        <DefaultTooltip
                            placement="top"
                            overlayStyle={{
                                width: 800,
                            }}
                            overlay={
                                <SignalTable
                                    mutation={this.props.mutation}
                                    indexedVariantAnnotations={
                                        this.props.indexedVariantAnnotations
                                    }
                                />
                            }
                        >
                            <span>{signalValue}</span>
                        </DefaultTooltip>
                    );
                }
            }

            return content;
        } else {
            return <div />;
        }
    }
}
