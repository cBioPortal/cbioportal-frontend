import * as React from 'react';
import {
    Annotation,
    AnnotationProps,
    annotationSortValue,
    civicDownload,
    getAnnotationData,
    IAnnotation,
} from 'react-mutation-mapper';
import { oncoKbAnnotationDownload, IOncoKbData } from 'oncokb-frontend-commons';
import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    RemoteData,
} from 'cbioportal-utils';
import OncokbPubMedCache from 'shared/cache/PubMedCache';
import { CancerStudy, Mutation } from 'cbioportal-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import AnnotationHeader from './annotation/AnnotationHeader';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import _ from 'lodash';

export interface IAnnotationColumnProps extends AnnotationProps {
    pubMedCache?: OncokbPubMedCache;
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    uniqueSampleKeyToTumorType?: { [sampleId: string]: string };
}

export default class AnnotationColumnFormatter {
    public static sortValue(
        mutations: Mutation[],
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        hotspotData?: RemoteData<IHotspotIndex | undefined>,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>,
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        resolveTumorType?: (mutation: Mutation) => string,
        resolveEntrezGeneId?: (mutation: Mutation) => number,
        indexedAlphaGenomeAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): number[] {
        const annotationData: IAnnotation = getAnnotationData(
            mutations ? mutations[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            indexedVariantAnnotations,
            resolveTumorType,
            resolveEntrezGeneId,
            indexedAlphaGenomeAnnotations
        );
        return annotationSortValue(annotationData);
    }

    public static download(
        mutations: Mutation[] | undefined,
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        hotspotData?: RemoteData<IHotspotIndex | undefined>,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>,
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        resolveTumorType?: (mutation: Mutation) => string,
        shouldShowRevue?: boolean,
        resolveEntrezGeneId?: (mutation: Mutation) => number,
        indexedAlphaGenomeAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        showAlphaGenomeIcon?: boolean
    ) {
        const annotationData: IAnnotation = getAnnotationData(
            mutations ? mutations[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            indexedVariantAnnotations,
            resolveTumorType,
            resolveEntrezGeneId,
            indexedAlphaGenomeAnnotations
        );

        const annotationDownloadContent = [
            `OncoKB: ${oncoKbAnnotationDownload(
                annotationData.oncoKbIndicator
            )}`,
        ];
        // only add reVUE to download when it's enabled and there are reVUE mutations in the query
        if (shouldShowRevue) {
            annotationDownloadContent.push(
                `reVUE: ${
                    annotationData.vue
                        ? `${
                              annotationData.vue.comment
                          },PubmedId:${annotationData.vue.references
                              .map(reference => reference.pubmedId)
                              .join(';')},PredictedEffect:${
                              annotationData.vue.defaultEffect
                          },ExperimentallyValidatedEffect:${
                              annotationData.vue
                                  .revisedVariantClassificationStandard
                          },RevisedProteinEffect:${
                              annotationData.vue.revisedProteinEffect
                          }`
                        : 'no'
                }`
            );
        }
        annotationDownloadContent.push(
            `CIViC: ${civicDownload(annotationData.civicEntry)}`,
            `CancerHotspot: ${annotationData.isHotspot ? 'yes' : 'no'}`,
            `3DHotspot: ${annotationData.is3dHotspot ? 'yes' : 'no'}`
        );
        if (showAlphaGenomeIcon && annotationData.alphaGenome?.annotation) {
            const alphaGenome = annotationData.alphaGenome.annotation;
            annotationDownloadContent.push(
                `AlphaGenome: ${alphaGenome.hg38_variant} (${alphaGenome.canonical_gene}), ` +
                    `merged_splicing_score=${alphaGenome.merged_splicing_score ?? 'null'}`
            );
        }
        return annotationDownloadContent.join(';');
    }

    public static headerRender(
        name: string,
        width: number,
        mergeOncoKbIcons?: boolean,
        onOncoKbIconToggle?: (mergeIcons: boolean) => void,
        enableRevue?: boolean,
        enableAlphaGenome?: boolean
    ) {
        return (
            <AnnotationHeader
                name={name}
                width={width}
                mergeOncoKbIcons={mergeOncoKbIcons}
                onOncoKbIconToggle={onOncoKbIconToggle}
                showRevueIcon={enableRevue}
                showAlphaGenomeIcon={enableAlphaGenome}
            />
        );
    }

    public static renderFunction(
        mutations: Mutation[],
        columnProps: IAnnotationColumnProps,
        hasMultipleCancerTypes?: boolean
    ) {
        return (
            <Annotation
                mutation={mutations ? mutations[0] : undefined}
                hasMultipleCancerTypes={hasMultipleCancerTypes}
                {...columnProps}
            />
        );
    }
}
