import * as React from 'react';
import {
    calcProteinChangeSortValue,
    extractGenomicLocation,
    genomicLocationString,
} from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import TruncatedText from 'shared/components/TruncatedText';
import MutationStatusColumnFormatter from './MutationStatusColumnFormatter';
import styles from './proteinChange.module.scss';
import {
    findMatchingAnnotatedMutation,
    indexMutationsByGenomicLocation,
} from 'shared/lib/MutationUtils';
import MutationTypeColumnFormatter from './MutationTypeColumnFormatter';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export default class ProteinChangeColumnFormatter {
    public static getSortValue(
        d: Mutation[],
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ): number | null {
        return calcProteinChangeSortValue(
            ProteinChangeColumnFormatter.getTextValue(
                d,
                indexedAnnotatedMutationsByGenomicLocation,
                isCanonicalTranscript
            )
        );
    }

    public static getTextValue(
        data: Mutation[],
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ): string {
        let textValue: string = '';
        const dataValue = ProteinChangeColumnFormatter.getData(
            data,
            indexedAnnotatedMutationsByGenomicLocation,
            isCanonicalTranscript
        );

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getFilterValue(
        data: Mutation[],
        filterString: string,
        filterStringUpper: string,
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ): boolean {
        let filterValue = ProteinChangeColumnFormatter.getDisplayValue(
            data,
            indexedAnnotatedMutationsByGenomicLocation,
            isCanonicalTranscript
        );
        const mutationStatus:
            | string
            | null = MutationStatusColumnFormatter.getData(data);

        if (
            mutationStatus &&
            mutationStatus.toLowerCase().includes('germline')
        ) {
            filterValue = `${filterValue}${mutationStatus}`;
        }

        return filterValue.toUpperCase().indexOf(filterStringUpper) > -1;
    }

    public static getDisplayValue(
        data: Mutation[],
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ): string {
        // same as text value
        return ProteinChangeColumnFormatter.getTextValue(
            data,
            indexedAnnotatedMutationsByGenomicLocation,
            isCanonicalTranscript
        );
    }

    public static getData(
        data: Mutation[],
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ) {
        if (data.length > 0) {
            return ProteinChangeColumnFormatter.getProteinChangeData(
                data[0],
                indexedAnnotatedMutationsByGenomicLocation,
                isCanonicalTranscript
            );
        } else {
            return null;
        }
    }

    public static renderWithMutationStatus(
        data: Mutation[],
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean,
        indexedVariantAnnotations?: {
            [genomicLocation: string]: VariantAnnotation;
        }
    ) {
        // use text as display value
        const text: string = ProteinChangeColumnFormatter.getDisplayValue(
            data,
            indexedAnnotatedMutationsByGenomicLocation,
            isCanonicalTranscript
        );
        const shouldShowWarning =
            data.length > 0
                ? ProteinChangeColumnFormatter.shouldShowWarningForDataDifference(
                      data[0],
                      indexedAnnotatedMutationsByGenomicLocation,
                      indexedVariantAnnotations
                  )
                : false;

        const mutationStatus:
            | string
            | null = MutationStatusColumnFormatter.getData(data);

        let content = (
            <span>
                <TruncatedText
                    text={text}
                    tooltip={<span>{text}</span>}
                    className={styles.proteinChange}
                    maxLength={40}
                />
                {shouldShowWarning && (
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        placement="top"
                        overlay={
                            <div>
                                No Genome Nexus response for this mutation,
                                please double check your data
                            </div>
                        }
                    >
                        <i className="fa fa-exclamation-triangle text-warning"></i>
                    </DefaultTooltip>
                )}
            </span>
        );

        // add a germline indicator next to protein change if it is a germline mutation!
        if (
            mutationStatus &&
            mutationStatus.toLowerCase().indexOf('germline') > -1
        ) {
            content = (
                <span>
                    {content}
                    <span className={styles.germline}>Germline</span>
                </span>
            );
        }

        return content;
    }

    private static getProteinChangeData(
        originalMutation: Mutation,
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        isCanonicalTranscript?: boolean
    ) {
        // non-canonical
        if (isCanonicalTranscript === false) {
            const annotatedMutation = indexedAnnotatedMutationsByGenomicLocation
                ? findMatchingAnnotatedMutation(
                      originalMutation,
                      indexedAnnotatedMutationsByGenomicLocation
                  )
                : undefined;
            if (annotatedMutation) {
                // non-canonical, GN has data, but data is empty, show empty
                if (annotatedMutation.proteinChange.length === 0) {
                    return '';
                }
                // non-canonical, GN has data, show GN annotated result
                return annotatedMutation.proteinChange;
            }
            // non-canonical and GN doesn't have data, show data from database
        }
        // canonical, show database result
        return originalMutation.proteinChange;
    }

    private static shouldShowWarningForDataDifference(
        originalMutation: Mutation,
        indexedAnnotatedMutationsByGenomicLocation?: {
            [genomicLocation: string]: Mutation;
        },
        indexedVariantAnnotations?: {
            [genomicLocation: string]: VariantAnnotation;
        }
    ): boolean {
        // get mutation type from MutationTypeColumnFormatter (need to check if the mutation is Fusion)
        const mutationType = MutationTypeColumnFormatter.getDisplayValue([
            originalMutation,
        ]);
        const genomicLocation = extractGenomicLocation(originalMutation);
        const annotatedMutation =
            genomicLocation && indexedVariantAnnotations
                ? indexedVariantAnnotations[
                      genomicLocationString(genomicLocation)
                  ]
                : undefined;
        // check if indexedAnnotatedMutationsByGenomicLocation exists (only results view with enabled transcript dropdown will pass indexedAnnotatedMutationsByGenomicLocation)
        if (indexedAnnotatedMutationsByGenomicLocation !== undefined) {
            // check if current mutation is annotated by genome nexus successfully
            if (annotatedMutation) {
                // GN has data, do not show warning
                return false;
            } else {
                // don't add warning to fusion mutations
                return mutationType !== 'Fusion';
            }
        } else {
            return false;
        }
    }
}
