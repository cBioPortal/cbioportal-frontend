import _ from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';

import { IHotspotIndex } from '../../model/CancerHotspot';
import { MobxCache } from '../../model/MobxCache';
import { Mutation } from '../../model/Mutation';
import { RemoteData } from '../../model/RemoteData';
import {
    CancerGene,
    IndicatorQueryResp,
    IOncoKbData,
} from '../../model/OncoKb';
import { SimpleCache } from '../../model/SimpleCache';
import {
    is3dHotspot,
    isRecurrentHotspot,
} from '../../util/CancerHotspotsUtils';
import { getEvidenceQuery, getIndicatorData } from '../../util/OncoKbUtils';
import { defaultArraySortMethod } from '../../util/ReactTableUtils';
import OncoKB, { sortValue as oncoKbSortValue } from '../oncokb/OncoKB';
import HotspotAnnotation, {
    sortValue as hotspotSortValue,
} from './HotspotAnnotation';

export type AnnotationProps = {
    mutation: Mutation;
    enableOncoKb: boolean;
    // enableMyCancerGenome: boolean;
    enableHotspot: boolean;
    // enableCivic: boolean;
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    oncoKbEvidenceCache?: SimpleCache;
    pubMedCache?: MobxCache;
    resolveEntrezGeneId?: (mutation: Mutation) => number;
    resolveTumorType?: (mutation: Mutation) => string;
    // myCancerGenomeData?: IMyCancerGenomeData;
    // civicGenes?: ICivicGeneDataWrapper;
    // civicVariants?: ICivicVariantDataWrapper;
    // studyIdToStudy?: {[studyId:string]:CancerStudy};
    userEmailAddress?: string;
};

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    hotspotStatus: 'pending' | 'error' | 'complete';
    oncoKbIndicator?: IndicatorQueryResp;
    oncoKbStatus: 'pending' | 'error' | 'complete';
    oncoKbGeneExist: boolean;
    isOncoKbCancerGene: boolean;
    // myCancerGenomeLinks: string[];
    // civicEntry?: ICivicEntry | null;
    // civicStatus: "pending" | "error" | "complete";
    // hasCivicVariants: boolean;
    hugoGeneSymbol: string;
}

const DEFAULT_ANNOTATION_DATA: IAnnotation = {
    oncoKbStatus: 'complete',
    oncoKbGeneExist: false,
    isOncoKbCancerGene: false,
    isHotspot: false,
    is3dHotspot: false,
    hotspotStatus: 'complete',
    hugoGeneSymbol: '',
    // hasCivicVariants: true,
    // myCancerGenomeLinks: [],
    // civicStatus: "complete"
};

function getDefaultEntrezGeneId(mutation: Mutation): number {
    return (mutation.gene && mutation.gene.entrezGeneId) || 0;
}

function getDefaultTumorType(): string {
    return 'Unknown';
}

function getDefaultEvidenceQuery(
    mutation: Mutation,
    resolveEntrezGeneId: (
        mutation: Mutation
    ) => number = getDefaultEntrezGeneId,
    resolveTumorType: (mutation: Mutation) => string = getDefaultTumorType
) {
    return getEvidenceQuery(mutation, resolveEntrezGeneId, resolveTumorType);
}

export function getAnnotationData(
    mutation?: Mutation,
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
    hotspotData?: RemoteData<IHotspotIndex | undefined>,
    // myCancerGenomeData?:IMyCancerGenomeData,
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
    // civicGenes?:ICivicGeneDataWrapper,
    // civicVariants?:ICivicVariantDataWrapper,
    // studyIdToStudy?: {[studyId:string]:CancerStudy},
    resolveTumorType: (mutation: Mutation) => string = getDefaultTumorType,
    resolveEntrezGeneId: (mutation: Mutation) => number = getDefaultEntrezGeneId
): IAnnotation {
    let value: Partial<IAnnotation>;

    if (mutation) {
        const entrezGeneId = resolveEntrezGeneId(mutation);

        let oncoKbIndicator: IndicatorQueryResp | undefined;
        const hugoGeneSymbol = mutation.gene
            ? mutation.gene.hugoGeneSymbol
            : undefined;

        let oncoKbGeneExist = false;
        let isOncoKbCancerGene = false;
        if (oncoKbCancerGenes && !(oncoKbCancerGenes.result instanceof Error)) {
            oncoKbGeneExist =
                _.find(
                    oncoKbCancerGenes.result,
                    (gene: CancerGene) =>
                        gene.oncokbAnnotated &&
                        gene.entrezGeneId === entrezGeneId
                ) !== undefined;
            isOncoKbCancerGene =
                _.find(
                    oncoKbCancerGenes.result,
                    (gene: CancerGene) => gene.entrezGeneId === entrezGeneId
                ) !== undefined;
        }

        value = {
            hugoGeneSymbol,
            oncoKbGeneExist,
            isOncoKbCancerGene,
            // civicEntry: civicGenes && civicGenes.result && civicVariants && civicVariants.result ?
            //     AnnotationColumnFormatter.getCivicEntry(mutation, civicGenes.result, civicVariants.result) : undefined,
            // civicStatus: civicGenes && civicGenes.status && civicVariants && civicVariants.status ?
            //     AnnotationColumnFormatter.getCivicStatus(civicGenes.status, civicVariants.status) : "pending",
            // hasCivicVariants: true,
            // myCancerGenomeLinks: myCancerGenomeData ?
            //     AnnotationColumnFormatter.getMyCancerGenomeLinks(mutation, myCancerGenomeData) : [],
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
                oncoKbIndicator = getIndicatorData(
                    mutation,
                    oncoKbData.result,
                    resolveTumorType,
                    resolveEntrezGeneId
                );

                // TODO this is required for cbioportal, we should probably do this in a custom resolveTumorType method
                // if (indicator && indicator.query.tumorType === null && studyIdToStudy) {
                //     const studyMetaData = studyIdToStudy[mutation.studyId];
                //     if (studyMetaData.cancerTypeId !== "mixed") {
                //         indicator.query.tumorType = studyMetaData.cancerType.name;
                //     }
                // }
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
        value = DEFAULT_ANNOTATION_DATA;
    }

    return value as IAnnotation;
}

export function annotationSortMethod(a: IAnnotation, b: IAnnotation) {
    return defaultArraySortMethod(sortValue(a), sortValue(b));
}

export function sortValue(annotation: IAnnotation): number[] {
    return _.flatten([
        oncoKbSortValue(annotation.oncoKbIndicator),
        // Civic.sortValue(annotationData.civicEntry),
        // MyCancerGenome.sortValue(annotationData.myCancerGenomeLinks),
        hotspotSortValue(annotation.isHotspot, annotation.is3dHotspot),
        annotation.isOncoKbCancerGene ? 1 : 0,
    ]);
}

@observer
export default class Annotation extends React.Component<AnnotationProps, {}> {
    public render() {
        const annotation = this.getAnnotationData(this.props);
        const evidenceQuery = getDefaultEvidenceQuery(
            this.props.mutation,
            this.props.resolveEntrezGeneId,
            this.props.resolveTumorType
        );

        return (
            <span style={{ display: 'flex', minWidth: 100 }}>
                {this.props.enableOncoKb && (
                    <OncoKB
                        hugoGeneSymbol={annotation.hugoGeneSymbol}
                        geneNotExist={!annotation.oncoKbGeneExist}
                        isCancerGene={annotation.isOncoKbCancerGene}
                        status={annotation.oncoKbStatus}
                        indicator={annotation.oncoKbIndicator}
                        evidenceCache={this.props.oncoKbEvidenceCache}
                        evidenceQuery={evidenceQuery as any} // TODO as Query
                        pubMedCache={this.props.pubMedCache}
                        userEmailAddress={this.props.userEmailAddress}
                    />
                )}
                {
                    //   this.props.enableCivic &&
                    //   <Civic
                    //       civicEntry={annotation.civicEntry}
                    //       civicStatus={annotation.civicStatus}
                    //       hasCivicVariants={annotation.hasCivicVariants}
                    //   />
                }
                {
                    //    this.props.enableMyCancerGenome &&
                    //    <MyCancerGenome
                    //        linksHTML={annotation.myCancerGenomeLinks}
                    //    />
                }
                {this.props.enableHotspot && (
                    <HotspotAnnotation
                        isHotspot={annotation.isHotspot}
                        is3dHotspot={annotation.is3dHotspot}
                        status={annotation.hotspotStatus}
                    />
                )}
            </span>
        );
    }

    private getAnnotationData(props: AnnotationProps) {
        const {
            mutation,
            oncoKbCancerGenes,
            hotspotData,
            oncoKbData,
            resolveEntrezGeneId,
            resolveTumorType,
        } = props;

        return getAnnotationData(
            mutation,
            oncoKbCancerGenes,
            hotspotData,
            oncoKbData,
            resolveTumorType,
            resolveEntrezGeneId
        );
    }
}
