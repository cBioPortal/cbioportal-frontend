import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import { RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    getHgvscColumnData,
    Hgvsc,
    hgvscDownload,
    hgvscSortValue,
} from 'react-mutation-mapper';
import { AnnotationErrorBoundary } from 'cbioportal-frontend-commons';
import { errorIcon } from 'oncokb-frontend-commons';

export default class HgvscColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ) {
        return (
            <span style={{ display: 'inline-block', float: 'right' }}>
                <AnnotationErrorBoundary
                    componentName="Hgvsc"
                    fallback={errorIcon(
                        'HGVSc annotation could not be displayed'
                    )}
                >
                    <Hgvsc
                        mutation={data[0]}
                        indexedVariantAnnotations={indexedVariantAnnotations}
                        selectedTranscriptId={selectedTranscriptId}
                    />
                </AnnotationErrorBoundary>
            </span>
        );
    }

    public static download(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ): string {
        return hgvscDownload(
            getHgvscColumnData(
                data[0],
                indexedVariantAnnotations,
                selectedTranscriptId
            )
        );
    }

    public static getSortValue(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ): number | null {
        return hgvscSortValue(
            getHgvscColumnData(
                data[0],
                indexedVariantAnnotations,
                selectedTranscriptId
            )
        );
    }
}
