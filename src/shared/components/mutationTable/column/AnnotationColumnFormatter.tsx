import * as React from 'react';
import { If } from 'react-if';
import * as _ from 'lodash';
import {
    Civic,
    civicDownload,
    civicSortValue,
    getCivicEntry,
    getMyCancerGenomeLinks,
    HotspotAnnotation,
    hotspotAnnotationSortValue,
    ICivicEntry,
    IMyCancerGenomeData,
    MyCancerGenome,
    myCancerGenomeSortValue,
    myCancerGenomeDownload,
    OncoKB,
    oncoKbAnnotationDownload,
    oncoKbAnnotationSortValue,
} from 'react-mutation-mapper';
import OncokbPubMedCache from 'shared/cache/PubMedCache';
import { IHotspotDataWrapper } from 'shared/model/CancerHotspots';
import { CancerStudy, Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    CancerGene,
    generateQueryVariantId,
    IndicatorQueryResp,
} from 'cbioportal-frontend-commons';
import { is3dHotspot, isRecurrentHotspot } from 'shared/lib/AnnotationUtils';
import {
    ICivicGeneDataWrapper,
    ICivicVariantDataWrapper,
} from 'shared/model/Civic';
import {
    IOncoKbCancerGenesWrapper,
    IOncoKbData,
    IOncoKbDataWrapper,
} from 'cbioportal-frontend-commons';
import { getMobxPromiseGroupStatus } from 'cbioportal-frontend-commons';

export interface IAnnotationColumnProps {
    enableOncoKb: boolean;
    enableMyCancerGenome: boolean;
    enableHotspot: boolean;
    enableCivic: boolean;
    hotspotData?: IHotspotDataWrapper;
    myCancerGenomeData?: IMyCancerGenomeData;
    oncoKbData?: IOncoKbDataWrapper;
    oncoKbCancerGenes?: IOncoKbCancerGenesWrapper;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?: string;
    civicGenes?: ICivicGeneDataWrapper;
    civicVariants?: ICivicVariantDataWrapper;
    studyIdToStudy?: { [studyId: string]: CancerStudy };
}

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    hotspotStatus: 'pending' | 'error' | 'complete';
    myCancerGenomeLinks: string[];
    oncoKbIndicator?: IndicatorQueryResp;
    oncoKbStatus: 'pending' | 'error' | 'complete';
    oncoKbGeneExist: boolean;
    isOncoKbCancerGene: boolean;
    civicEntry?: ICivicEntry | null;
    civicStatus: 'pending' | 'error' | 'complete';
    hasCivicVariants: boolean;
    hugoGeneSymbol: string;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter {
    public static get DEFAULT_ANNOTATION_DATA(): IAnnotation {
        return {
            oncoKbStatus: 'complete',
            oncoKbGeneExist: false,
            isOncoKbCancerGene: false,
            myCancerGenomeLinks: [],
            isHotspot: false,
            is3dHotspot: false,
            hotspotStatus: 'complete',
            hasCivicVariants: true,
            hugoGeneSymbol: '',
            civicStatus: 'complete',
        };
    }

    // TODO after refactoring MyCancerGenome, replace this function with
    //  the function 'getAnnotationData' from
    //  react-mutation-mapper -> src/component/column/Annotation.tsx
    public static getData(
        rowData: Mutation[] | undefined,
        oncoKbCancerGenes?: IOncoKbCancerGenesWrapper,
        hotspotData?: IHotspotDataWrapper,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: IOncoKbDataWrapper,
        civicGenes?: ICivicGeneDataWrapper,
        civicVariants?: ICivicVariantDataWrapper,
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ) {
        let value: Partial<IAnnotation>;

        if (rowData) {
            const mutation = rowData[0];

            let oncoKbIndicator: IndicatorQueryResp | undefined;
            let hugoGeneSymbol = mutation.gene.hugoGeneSymbol;

            let oncoKbGeneExist = false;
            let isOncoKbCancerGene = false;
            if (oncoKbCancerGenes && !(oncoKbCancerGenes instanceof Error)) {
                oncoKbGeneExist =
                    _.find(
                        oncoKbCancerGenes.result,
                        (gene: CancerGene) =>
                            gene.oncokbAnnotated &&
                            gene.entrezGeneId === mutation.entrezGeneId
                    ) !== undefined;
                isOncoKbCancerGene =
                    _.find(
                        oncoKbCancerGenes.result,
                        (gene: CancerGene) =>
                            gene.entrezGeneId === mutation.entrezGeneId
                    ) !== undefined;
            }

            value = {
                hugoGeneSymbol,
                oncoKbGeneExist,
                isOncoKbCancerGene,
                civicEntry:
                    civicGenes &&
                    civicGenes.result &&
                    civicVariants &&
                    civicVariants.result
                        ? getCivicEntry(
                              mutation,
                              civicGenes.result,
                              civicVariants.result
                          )
                        : undefined,
                civicStatus:
                    civicGenes &&
                    civicGenes.status &&
                    civicVariants &&
                    civicVariants.status
                        ? getMobxPromiseGroupStatus(civicGenes, civicVariants)
                        : 'pending',
                hasCivicVariants: true,
                myCancerGenomeLinks: myCancerGenomeData
                    ? getMyCancerGenomeLinks(mutation, myCancerGenomeData)
                    : [],
                isHotspot:
                    hotspotData &&
                    hotspotData.result &&
                    hotspotData.status === 'complete'
                        ? isRecurrentHotspot(mutation, hotspotData.result)
                        : false,
                is3dHotspot:
                    hotspotData &&
                    hotspotData.result &&
                    hotspotData.status === 'complete'
                        ? is3dHotspot(mutation, hotspotData.result)
                        : false,
                hotspotStatus: hotspotData ? hotspotData.status : 'pending',
            };

            // oncoKbData may exist but it might be an instance of Error, in that case we flag the status as error
            if (oncoKbData && oncoKbData.result instanceof Error) {
                value = {
                    ...value,
                    oncoKbStatus: 'error',
                    oncoKbIndicator: undefined,
                };
            } else if (oncoKbGeneExist) {
                // actually, oncoKbData.result shouldn't be an instance of Error in this case (we already check it above),
                // but we need to check it again in order to avoid TS errors/warnings
                if (
                    oncoKbData &&
                    oncoKbData.result &&
                    !(oncoKbData.result instanceof Error) &&
                    oncoKbData.status === 'complete'
                ) {
                    oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(
                        mutation,
                        oncoKbData.result,
                        studyIdToStudy
                    );
                }

                value = {
                    ...value,
                    oncoKbStatus: oncoKbData ? oncoKbData.status : 'pending',
                    oncoKbIndicator,
                };
            } else {
                value = {
                    ...value,
                    oncoKbStatus: 'complete',
                    oncoKbIndicator: undefined,
                };
            }
        } else {
            value = AnnotationColumnFormatter.DEFAULT_ANNOTATION_DATA;
        }

        return value as IAnnotation;
    }

    public static getIndicatorData(
        mutation: Mutation,
        oncoKbData: IOncoKbData,
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ): IndicatorQueryResp | undefined {
        if (
            oncoKbData.uniqueSampleKeyToTumorType === null ||
            oncoKbData.indicatorMap === null
        ) {
            return undefined;
        }

        const id = generateQueryVariantId(
            mutation.gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType![mutation.uniqueSampleKey],
            mutation.proteinChange,
            mutation.mutationType
        );

        const indicator = oncoKbData.indicatorMap[id];

        if (indicator && indicator.query.tumorType === null && studyIdToStudy) {
            const studyMetaData = studyIdToStudy[mutation.studyId];
            if (studyMetaData.cancerTypeId !== 'mixed') {
                indicator.query.tumorType = studyMetaData.cancerType.name;
            }
        }

        return indicator;
    }

    public static sortValue(
        data: Mutation[],
        oncoKbCancerGenes?: IOncoKbCancerGenesWrapper,
        hotspotData?: IHotspotDataWrapper,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: IOncoKbDataWrapper,
        civicGenes?: ICivicGeneDataWrapper,
        civicVariants?: ICivicVariantDataWrapper
    ): number[] {
        const annotationData: IAnnotation = AnnotationColumnFormatter.getData(
            data,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            civicGenes,
            civicVariants
        );

        return _.flatten([
            oncoKbAnnotationSortValue(annotationData.oncoKbIndicator),
            civicSortValue(annotationData.civicEntry),
            myCancerGenomeSortValue(annotationData.myCancerGenomeLinks),
            hotspotAnnotationSortValue(
                annotationData.isHotspot,
                annotationData.is3dHotspot
            ),
            annotationData.isOncoKbCancerGene ? 1 : 0,
        ]);
    }

    public static download(
        data: Mutation[] | undefined,
        oncoKbCancerGenes?: IOncoKbCancerGenesWrapper,
        hotspotData?: IHotspotDataWrapper,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: IOncoKbDataWrapper,
        civicGenes?: ICivicGeneDataWrapper,
        civicVariants?: ICivicVariantDataWrapper
    ) {
        const annotationData: IAnnotation = AnnotationColumnFormatter.getData(
            data,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            civicGenes,
            civicVariants
        );

        return [
            `OncoKB: ${oncoKbAnnotationDownload(
                annotationData.oncoKbIndicator
            )}`,
            `CIViC: ${civicDownload(annotationData.civicEntry)}`,
            `MyCancerGenome: ${myCancerGenomeDownload(
                annotationData.myCancerGenomeLinks
            )}`,
            `CancerHotspot: ${annotationData.isHotspot ? 'yes' : 'no'}`,
            `3DHotspot: ${annotationData.is3dHotspot ? 'yes' : 'no'}`,
        ].join(';');
    }

    public static renderFunction(
        data: Mutation[],
        columnProps: IAnnotationColumnProps
    ) {
        const annotation: IAnnotation = AnnotationColumnFormatter.getData(
            data,
            columnProps.oncoKbCancerGenes,
            columnProps.hotspotData,
            columnProps.myCancerGenomeData,
            columnProps.oncoKbData,
            columnProps.civicGenes,
            columnProps.civicVariants,
            columnProps.studyIdToStudy
        );

        // TODO after refactoring MyCancerGenome, instead of mainContent function use the component from
        //  react-mutation-mapper -> src/component/column/Annotation.tsx
        return AnnotationColumnFormatter.mainContent(
            annotation,
            columnProps,
            columnProps.pubMedCache
        );
    }

    public static mainContent(
        annotation: IAnnotation,
        columnProps: IAnnotationColumnProps,
        pubMedCache?: OncokbPubMedCache
    ) {
        return (
            <span style={{ display: 'flex', minWidth: 100 }}>
                <If condition={columnProps.enableOncoKb || false}>
                    <OncoKB
                        hugoGeneSymbol={annotation.hugoGeneSymbol}
                        geneNotExist={!annotation.oncoKbGeneExist}
                        isCancerGene={annotation.isOncoKbCancerGene}
                        status={annotation.oncoKbStatus}
                        indicator={annotation.oncoKbIndicator}
                        pubMedCache={pubMedCache}
                        userEmailAddress={columnProps.userEmailAddress}
                    />
                </If>
                <If condition={columnProps.enableCivic || false}>
                    <Civic
                        civicEntry={annotation.civicEntry}
                        civicStatus={annotation.civicStatus}
                        hasCivicVariants={annotation.hasCivicVariants}
                    />
                </If>
                <If condition={columnProps.enableMyCancerGenome || false}>
                    <MyCancerGenome
                        linksHTML={annotation.myCancerGenomeLinks}
                    />
                </If>
                <If condition={columnProps.enableHotspot || false}>
                    <HotspotAnnotation
                        isHotspot={annotation.isHotspot}
                        is3dHotspot={annotation.is3dHotspot}
                        status={annotation.hotspotStatus}
                    />
                </If>
            </span>
        );
    }
}
