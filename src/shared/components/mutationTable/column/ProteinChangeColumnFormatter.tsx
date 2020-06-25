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
import {
    getProteinChangeData,
    shouldShowWarningForProteinChangeDifference,
} from 'shared/lib/ProteinChangeUtils';

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
            return getProteinChangeData(
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
                ? shouldShowWarningForProteinChangeDifference(
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
}
