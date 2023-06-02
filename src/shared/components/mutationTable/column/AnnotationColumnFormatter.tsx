import * as React from 'react';
import {
    Annotation,
    AnnotationProps,
    annotationSortValue,
    civicDownload,
    getAnnotationData,
    IAnnotation,
    myCancerGenomeDownload,
} from 'react-mutation-mapper';
import { oncoKbAnnotationDownload } from 'oncokb-frontend-commons';
import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IMyCancerGenomeData,
    IOncoKbData,
    RemoteData,
} from 'cbioportal-utils';
import OncokbPubMedCache from 'shared/cache/PubMedCache';
import { CancerStudy, Mutation } from 'cbioportal-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import AnnotationHeader from './annotation/AnnotationHeader';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

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
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>,
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        resolveTumorType?: (mutation: Mutation) => string
    ): number[] {
        const annotationData: IAnnotation = getAnnotationData(
            mutations ? mutations[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            indexedVariantAnnotations,
            resolveTumorType
        );
        return annotationSortValue(annotationData);
    }

    public static download(
        mutations: Mutation[] | undefined,
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        hotspotData?: RemoteData<IHotspotIndex | undefined>,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>,
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        resolveTumorType?: (mutation: Mutation) => string,
        shouldShowRevue?: boolean
    ) {
        const annotationData: IAnnotation = getAnnotationData(
            mutations ? mutations[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            indexedVariantAnnotations,
            resolveTumorType
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
                        ? `${annotationData.vue.comment},PubmedId:${annotationData.vue.pubmedIds[0]},PredictedEffect:${annotationData.vue.defaultEffect},ExperimentallyValidatedEffect:${annotationData.vue.variantClassification},RevisedProteinEffect:${annotationData.vue.revisedProteinEffect}`
                        : 'no'
                }`
            );
        }
        annotationDownloadContent.push(
            `CIViC: ${civicDownload(annotationData.civicEntry)}`,
            `MyCancerGenome: ${myCancerGenomeDownload(
                annotationData.myCancerGenomeLinks
            )}`,
            `CancerHotspot: ${annotationData.isHotspot ? 'yes' : 'no'}`,
            `3DHotspot: ${annotationData.is3dHotspot ? 'yes' : 'no'}`
        );
        return annotationDownloadContent.join(';');
    }

    public static headerRender(
        name: string,
        width: number,
        mergeOncoKbIcons?: boolean,
        onOncoKbIconToggle?: (mergeIcons: boolean) => void,
        enableRevue?: boolean
    ) {
        return (
            <AnnotationHeader
                name={name}
                width={width}
                mergeOncoKbIcons={mergeOncoKbIcons}
                onOncoKbIconToggle={onOncoKbIconToggle}
                showRevueIcon={enableRevue}
            />
        );
    }

    public static renderFunction(
        mutations: Mutation[],
        columnProps: IAnnotationColumnProps
    ) {
        return (
            <Annotation
                mutation={mutations ? mutations[0] : undefined}
                {...columnProps}
            />
        );
    }
}
