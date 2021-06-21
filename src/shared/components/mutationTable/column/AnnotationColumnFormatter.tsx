import * as React from 'react';
import {
    Annotation,
    AnnotationProps,
    annotationSortValue,
    civicDownload,
    getAnnotationData,
    IAnnotation,
    myCancerGenomeDownload,
    oncoKbAnnotationDownload,
} from 'react-mutation-mapper';
import {
    ICivicGene,
    ICivicVariant,
    IHotspotIndex,
    IMyCancerGenomeData,
    IOncoKbData,
    RemoteData,
} from 'cbioportal-utils';
import OncokbPubMedCache from 'shared/cache/PubMedCache';
import { CancerStudy, Mutation } from 'cbioportal-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import AnnotationHeaderTooltipCard, {
    AnnotationSources,
    cancerHotspotsData,
    civicData,
    myCancerGenomeData,
    sourceTooltipInfo,
} from './annotation/AnnotationHeaderTooltipCard';
import OncokbLegendContent from './annotation/OncokbLegendContent';

export interface IAnnotationColumnProps extends AnnotationProps {
    pubMedCache?: OncokbPubMedCache;
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    uniqueSampleKeyToTumorType?: { [sampleId: string]: string };
}

export default class AnnotationColumnFormatter {
    public static sortValue(
        data: Mutation[],
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        hotspotData?: RemoteData<IHotspotIndex | undefined>,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGene | undefined>,
        civicVariants?: RemoteData<ICivicVariant | undefined>,
        resolveTumorType?: (mutation: Mutation) => string
    ): number[] {
        const annotationData: IAnnotation = getAnnotationData(
            data ? data[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            resolveTumorType
        );

        return annotationSortValue(annotationData);
    }

    public static download(
        data: Mutation[] | undefined,
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        hotspotData?: RemoteData<IHotspotIndex | undefined>,
        myCancerGenomeData?: IMyCancerGenomeData,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        civicGenes?: RemoteData<ICivicGene | undefined>,
        civicVariants?: RemoteData<ICivicVariant | undefined>,
        resolveTumorType?: (mutation: Mutation) => string
    ) {
        const annotationData: IAnnotation = getAnnotationData(
            data ? data[0] : undefined,
            oncoKbCancerGenes,
            hotspotData,
            myCancerGenomeData,
            oncoKbData,
            usingPublicOncoKbInstance,
            civicGenes,
            civicVariants,
            resolveTumorType
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

    public static headerRender(name: string) {
        return (
            <span>
                {name}
                <br />
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <AnnotationHeaderTooltipCard
                            InfoProps={
                                sourceTooltipInfo[AnnotationSources.ONCOKB]
                            }
                            legendDescriptions={civicData}
                            overrideContent={<OncokbLegendContent />}
                        />
                    }
                >
                    <img
                        src={require('../../../../../src/rootImages/oncokb-oncogenic-1.svg')}
                        style={{
                            height: 16,
                            width: 16,
                            marginLeft: 5,
                            marginBottom: 0,
                        }}
                    />
                </DefaultTooltip>
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <AnnotationHeaderTooltipCard
                            InfoProps={
                                sourceTooltipInfo[AnnotationSources.CIVIC]
                            }
                            legendDescriptions={civicData}
                        />
                    }
                >
                    <img
                        src={require('../../../../../src/rootImages/civic-logo.png')}
                        style={{ height: 14, width: 14, marginLeft: 6 }}
                    />
                </DefaultTooltip>
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <AnnotationHeaderTooltipCard
                            InfoProps={
                                sourceTooltipInfo[
                                    AnnotationSources.MY_CANCER_GENOME
                                ]
                            }
                            legendDescriptions={myCancerGenomeData}
                        />
                    }
                >
                    <img
                        src={require('../../../../../src/rootImages/mcg_logo.png')}
                        style={{ height: 14, width: 14, marginLeft: 8 }}
                    />
                </DefaultTooltip>
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <AnnotationHeaderTooltipCard
                            InfoProps={
                                sourceTooltipInfo[
                                    AnnotationSources.CANCER_HOTSPOTS
                                ]
                            }
                            legendDescriptions={cancerHotspotsData}
                        />
                    }
                >
                    <img
                        src={require('../../../../../src/rootImages/cancer-hotspots.svg')}
                        style={{ height: 14, width: 14, marginLeft: 7 }}
                    />
                </DefaultTooltip>
            </span>
        );
    }

    public static renderFunction(
        data: Mutation[],
        columnProps: IAnnotationColumnProps
    ) {
        return (
            <Annotation
                mutation={data ? data[0] : undefined}
                {...columnProps}
            />
        );
    }
}
