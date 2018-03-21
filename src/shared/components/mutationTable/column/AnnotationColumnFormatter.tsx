import * as React from 'react';
import {If} from 'react-if';
import * as _ from "lodash";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import CancerHotspots from "shared/components/annotation/CancerHotspots";
import MyCancerGenome from "shared/components/annotation/MyCancerGenome";
import OncoKB from "shared/components/annotation/OncoKB";
import Civic from "shared/components/annotation/Civic";
import {IOncoKbData, IOncoKbDataWrapper} from "shared/model/OncoKB";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotDataWrapper} from "shared/model/CancerHotspots";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {generateQueryVariantId, generateQueryVariant} from "shared/lib/OncoKbUtils";
import {is3dHotspot, isRecurrentHotspot} from "shared/lib/AnnotationUtils";
import {ICivicVariant, ICivicGene, ICivicEntry, ICivicVariantData, ICivicGeneData, ICivicGeneDataWrapper, ICivicVariantDataWrapper} from "shared/model/Civic.ts";
import {buildCivicEntry} from "shared/lib/CivicUtils";

export interface IAnnotationColumnProps {
    enableOncoKb: boolean;
    enableMyCancerGenome: boolean;
    enableHotspot: boolean;
    enableCivic: boolean;
    hotspotData?: IHotspotDataWrapper;
    myCancerGenomeData?: IMyCancerGenomeData;
    oncoKbData?: IOncoKbDataWrapper;
    oncoKbEvidenceCache?: OncoKbEvidenceCache;
    oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean};
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
    civicGenes?: ICivicGeneDataWrapper;
    civicVariants?: ICivicVariantDataWrapper;
}

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    hotspotStatus: "pending" | "error" | "complete";
    myCancerGenomeLinks: string[];
    oncoKbIndicator?: IndicatorQueryResp;
    oncoKbStatus: "pending" | "error" | "complete";
    oncoKbGeneExist:boolean;
    civicEntry?: ICivicEntry | null;
    civicStatus: "pending" | "error" | "complete";
    hasCivicVariants: boolean;
    hugoGeneSymbol:string;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static get DEFAULT_ANNOTATION_DATA(): IAnnotation
    {
        return {
            oncoKbStatus: "complete",
            oncoKbGeneExist: false,
            myCancerGenomeLinks: [],
            isHotspot: false,
            is3dHotspot: false,
            hotspotStatus: "complete",
            hasCivicVariants: true,
            hugoGeneSymbol: '',
            civicStatus: "complete"
        };
    }

    public static getData(rowData:Mutation[]|undefined,
                          oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                          hotspotData?:IHotspotDataWrapper,
                          myCancerGenomeData?:IMyCancerGenomeData,
                          oncoKbData?:IOncoKbDataWrapper,
                          civicGenes?:ICivicGeneDataWrapper,
                          civicVariants?:ICivicVariantDataWrapper)
    {
        let value: Partial<IAnnotation>;

        if (rowData) {
            const mutation = rowData[0];

            let oncoKbIndicator: IndicatorQueryResp|undefined;
            let hugoGeneSymbol = mutation.gene.hugoGeneSymbol;

            const oncoKbGeneExist = !!oncoKbAnnotatedGenes[mutation.entrezGeneId];

            value = {
                hugoGeneSymbol,
                oncoKbGeneExist,
                civicEntry: civicGenes && civicGenes.result && civicVariants && civicVariants.result ?
                    AnnotationColumnFormatter.getCivicEntry(mutation, civicGenes.result, civicVariants.result) : undefined,
                civicStatus: civicGenes && civicGenes.status && civicVariants && civicVariants.status ?
                        AnnotationColumnFormatter.getCivicStatus(civicGenes.status, civicVariants.status) : "pending",
                hasCivicVariants: true,
                myCancerGenomeLinks: myCancerGenomeData ?
                    AnnotationColumnFormatter.getMyCancerGenomeLinks(mutation, myCancerGenomeData) : [],
                isHotspot: hotspotData && hotspotData.result && hotspotData.status === "complete" ?
                    isRecurrentHotspot(mutation, hotspotData.result) : false,
                is3dHotspot: hotspotData && hotspotData.result && hotspotData.status === "complete" ?
                    is3dHotspot(mutation, hotspotData.result) : false,
                hotspotStatus: hotspotData ? hotspotData.status : "pending"
            };
            if (oncoKbGeneExist) {
                if (oncoKbData && oncoKbData.result && oncoKbData.status === "complete") {
                    oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(mutation, oncoKbData.result);
                }

                value = {
                    ...value,
                    oncoKbStatus: oncoKbData ? oncoKbData.status : "pending",
                    oncoKbIndicator,
                };
            } else {
                value = {
                    ...value,
                    oncoKbStatus: "complete",
                    oncoKbIndicator: undefined
                };
            }
        }
        else {
            value = AnnotationColumnFormatter.DEFAULT_ANNOTATION_DATA;
        }

        return value as IAnnotation;
    }

    /**
     * Returns an ICivicEntry if the civicGenes and civicVariants have information about the gene and the mutation (variant) specified. Otherwise it returns null.
     */
    public static getCivicEntry(mutation:Mutation, civicGenes:ICivicGene, civicVariants:ICivicVariant): ICivicEntry | null
    {
        let geneSymbol: string = mutation.gene.hugoGeneSymbol;
        let civicEntry = null;
        //Only search for matching Civic variants if the gene mutation exists in the Civic API
        if (civicVariants[geneSymbol] && civicVariants[geneSymbol][mutation.proteinChange]) {
            let geneVariants: {[name: string]: ICivicVariantData} = {[mutation.proteinChange]: civicVariants[geneSymbol][mutation.proteinChange]};
            let geneEntry: ICivicGeneData = civicGenes[geneSymbol];
            civicEntry = buildCivicEntry(geneEntry, geneVariants);
        }

        return civicEntry;
    }
    
    public static getCivicStatus(civicGenesStatus:"pending" | "error" | "complete",
                                 civicVariantsStatus:"pending" | "error" | "complete"): "pending" | "error" | "complete"
    {
        if (civicGenesStatus === "error" || civicVariantsStatus === "error") {
            return "error";
        }
        if (civicGenesStatus === "complete" && civicVariantsStatus === "complete") {
            return "complete";
        }

        return "pending";
    }

    public static getIndicatorData(mutation:Mutation, oncoKbData:IOncoKbData): IndicatorQueryResp|undefined
    {
        if (oncoKbData.uniqueSampleKeyToTumorType === null || oncoKbData.indicatorMap === null) {
            return undefined;
        }

        const id = generateQueryVariantId(mutation.gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType[mutation.uniqueSampleKey],
            mutation.proteinChange,
            mutation.mutationType);

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceQuery(mutation:Mutation, oncoKbData:IOncoKbData): Query|undefined
    {
        // return null in case sampleToTumorMap is null
        return oncoKbData.uniqueSampleKeyToTumorType ? generateQueryVariant(mutation.gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType[mutation.uniqueSampleKey],
            mutation.proteinChange,
            mutation.mutationType,
            mutation.proteinPosStart,
            mutation.proteinPosEnd
        ) : undefined;
    }

    public static getMyCancerGenomeLinks(mutation:Mutation, myCancerGenomeData: IMyCancerGenomeData):string[] {
        const myCancerGenomes:IMyCancerGenome[]|null = myCancerGenomeData[mutation.gene.hugoGeneSymbol];
        let links:string[] = [];

        if (myCancerGenomes) {
            // further filtering required by alteration field
            links = AnnotationColumnFormatter.filterByAlteration(mutation, myCancerGenomes).map(
                (myCancerGenome:IMyCancerGenome) => myCancerGenome.linkHTML);
        }

        return links;
    }

    // TODO for now ignoring anything but protein change position, this needs to be improved!
    public static filterByAlteration(mutation:Mutation, myCancerGenomes:IMyCancerGenome[]):IMyCancerGenome[]
    {
        return myCancerGenomes.filter((myCancerGenome:IMyCancerGenome) => {
            const proteinChangeRegExp:RegExp = /^[A-Za-z][0-9]+[A-Za-z]/;
            const numericalRegExp:RegExp = /[0-9]+/;

            const matched = myCancerGenome.alteration.trim().match(proteinChangeRegExp);

            if (matched && mutation.proteinChange)
            {
                const mutationPos = mutation.proteinChange.match(numericalRegExp);
                const alterationPos = myCancerGenome.alteration.match(numericalRegExp);

                return (mutationPos && alterationPos && mutationPos[0] === alterationPos[0]);
            }

            return false;
        });
    }

    public static sortValue(data:Mutation[],
                            oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                            hotspotData?: IHotspotDataWrapper,
                            myCancerGenomeData?:IMyCancerGenomeData,
                            oncoKbData?: IOncoKbDataWrapper,
                            civicGenes?: ICivicGeneDataWrapper,
                            civicVariants?: ICivicVariantDataWrapper):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(
            data, oncoKbAnnotatedGenes, hotspotData, myCancerGenomeData, oncoKbData, civicGenes, civicVariants);

        return _.flatten([
            OncoKB.sortValue(annotationData.oncoKbIndicator),
            Civic.sortValue(annotationData.civicEntry),
            MyCancerGenome.sortValue(annotationData.myCancerGenomeLinks),
            CancerHotspots.sortValue(annotationData.isHotspot, annotationData.is3dHotspot)
        ]);
    }

    public static download(data:Mutation[]|undefined,
                           oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                           hotspotData?:IHotspotDataWrapper,
                           myCancerGenomeData?:IMyCancerGenomeData,
                           oncoKbData?:IOncoKbDataWrapper,
                           civicGenes?:ICivicGeneDataWrapper,
                           civicVariants?:ICivicVariantDataWrapper)
    {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(
            data, oncoKbAnnotatedGenes, hotspotData, myCancerGenomeData, oncoKbData, civicGenes, civicVariants);

        return [
            `OncoKB: ${OncoKB.download(annotationData.oncoKbIndicator)}`,
            `CIViC: ${Civic.download(annotationData.civicEntry)}`,
            `MyCancerGenome: ${MyCancerGenome.download(annotationData.myCancerGenomeLinks)}`,
            `CancerHotspot: ${annotationData.isHotspot ? 'yes' : 'no'}`,
            `3DHotspot: ${annotationData.is3dHotspot ? 'yes' : 'no'}`,
        ].join(";");
    }

    public static renderFunction(data:Mutation[], columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(
            data,
            columnProps.oncoKbAnnotatedGenes,
            columnProps.hotspotData,
            columnProps.myCancerGenomeData,
            columnProps.oncoKbData,
            columnProps.civicGenes,
            columnProps.civicVariants);

        let evidenceQuery:Query|undefined;

        if (columnProps.oncoKbData && columnProps.oncoKbData.result) {
            evidenceQuery = this.getEvidenceQuery(data[0], columnProps.oncoKbData.result);
        }

        return AnnotationColumnFormatter.mainContent(annotation,
            columnProps,
            columnProps.oncoKbEvidenceCache,
            evidenceQuery,
            columnProps.pubMedCache);
    }

    public static mainContent(annotation:IAnnotation,
                              columnProps:IAnnotationColumnProps,
                              evidenceCache?: OncoKbEvidenceCache,
                              evidenceQuery?: Query,
                              pubMedCache?:OncokbPubMedCache)
    {
        return (
            <span style={{display:'inline-block', minWidth:100}}>
                <If condition={columnProps.enableOncoKb || false}>
                    <OncoKB
                        hugoGeneSymbol={annotation.hugoGeneSymbol}
                        geneNotExist={!annotation.oncoKbGeneExist}
                        status={annotation.oncoKbStatus}
                        indicator={annotation.oncoKbIndicator}
                        evidenceCache={evidenceCache}
                        evidenceQuery={evidenceQuery}
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
                    <CancerHotspots
                        isHotspot={annotation.isHotspot}
                        is3dHotspot={annotation.is3dHotspot}
                        status={annotation.hotspotStatus}
                    />
                </If>
            </span>
        );
    }
}
