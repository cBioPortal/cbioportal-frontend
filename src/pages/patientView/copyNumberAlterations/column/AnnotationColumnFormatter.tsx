import * as React from 'react';
import * as _ from "lodash";
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {
    IAnnotation, IAnnotationColumnProps, default as DefaultAnnotationColumnFormatter
} from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import {IOncoKbData, IOncoKbDataWrapper} from "shared/model/OncoKB";
import OncoKB from "shared/components/annotation/OncoKB";
import Civic from "shared/components/annotation/Civic";
import {generateQueryVariantId, generateQueryVariant} from "shared/lib/OncoKbUtils";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {ICivicVariant, ICivicGene, ICivicEntry, ICivicVariantData, ICivicGeneData, ICivicGeneDataWrapper, ICivicVariantDataWrapper} from "shared/model/Civic.ts";
import {buildCivicEntry, getCivicCNAVariants} from "shared/lib/CivicUtils";

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(copyNumberData:DiscreteCopyNumberData[]|undefined,
                          oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                          oncoKbData?: IOncoKbDataWrapper,
                          civicGenes?: ICivicGeneDataWrapper,
                          civicVariants?: ICivicVariantDataWrapper)
    {
        let value: IAnnotation;

        if (copyNumberData)
        {
            let oncoKbIndicator: IndicatorQueryResp|undefined = undefined;
            let oncoKbStatus:IAnnotation["oncoKbStatus"] = "complete";
            let hugoGeneSymbol = copyNumberData[0].gene.hugoGeneSymbol;
            const oncoKbGeneExist = !!oncoKbAnnotatedGenes[copyNumberData[0].entrezGeneId];

            if (oncoKbGeneExist) {
                if (oncoKbData && oncoKbData.result && oncoKbData.status === "complete") {
                    oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(copyNumberData, oncoKbData.result);
                }
                oncoKbStatus = oncoKbData ? oncoKbData.status : "pending";
            }


            value = {
                hugoGeneSymbol,
                oncoKbStatus,
                oncoKbIndicator,
                oncoKbGeneExist,
                civicEntry: civicGenes && civicGenes.result && civicVariants && civicVariants.result?
                    AnnotationColumnFormatter.getCivicEntry(copyNumberData, civicGenes.result, civicVariants.result) : undefined,
                civicStatus: civicGenes && civicGenes.status && civicVariants && civicVariants.status ?
                        AnnotationColumnFormatter.getCivicStatus(civicGenes.status, civicVariants.status) : "pending",
                hasCivicVariants: civicGenes && civicGenes.result && civicVariants && civicVariants.result ?
                    AnnotationColumnFormatter.hasCivicVariants(copyNumberData, civicGenes.result, civicVariants.result) : true,
                myCancerGenomeLinks: [],
                hotspotStatus: "complete",
                isHotspot: false,
                is3dHotspot: false
            };
        }
        else {
            value = DefaultAnnotationColumnFormatter.DEFAULT_ANNOTATION_DATA;
        }

        return value;
    }

   /**
    * Returns an ICivicEntry if the civicGenes and civicVariants have information about the gene and the mutation (variant) specified. Otherwise it returns
    * an empty object.
    */
    public static getCivicEntry(copyNumberData:DiscreteCopyNumberData[], civicGenes:ICivicGene, 
                                civicVariants:ICivicVariant): ICivicEntry | null
    {
        let civicEntry = null;
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants:{[name: string]: ICivicVariantData} = getCivicCNAVariants(copyNumberData, geneSymbol, civicVariants);
        let geneEntry: ICivicGeneData = civicGenes[geneSymbol];
        //Only return data for genes with variants or it has a description provided by the Civic API
        if (!_.isEmpty(geneVariants) || geneEntry && geneEntry.description !== "") {
            civicEntry = buildCivicEntry(geneEntry, geneVariants);
        }

        return civicEntry;
    }
    
    public static getCivicStatus(civicGenesStatus:"pending" | "error" | "complete", civicVariantsStatus:"pending" | "error" | "complete"): "pending" | "error" | "complete"
    {
    if (civicGenesStatus === "error" || civicVariantsStatus === "error") {
        return "error";
    }
    if (civicGenesStatus === "complete" && civicVariantsStatus === "complete") {
        return "complete";
    }
    
    return "pending";
    }

    public static hasCivicVariants (copyNumberData:DiscreteCopyNumberData[], civicGenes:ICivicGene, civicVariants:ICivicVariant): boolean
    {
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants:{[name: string]: ICivicVariantData} = getCivicCNAVariants(copyNumberData, geneSymbol, civicVariants);
        let geneEntry: ICivicGeneData = civicGenes[geneSymbol];

        if (geneEntry && _.isEmpty(geneVariants)) {
            return false;
        }

        return true;
    }

    public static getIndicatorData(copyNumberData:DiscreteCopyNumberData[], oncoKbData:IOncoKbData): IndicatorQueryResp|undefined
    {
        if (oncoKbData.uniqueSampleKeyToTumorType === null || oncoKbData.indicatorMap === null) {
            return undefined;
        }

        const id = generateQueryVariantId(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType[copyNumberData[0].uniqueSampleKey],
            getAlterationString(copyNumberData[0].alteration));

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceQuery(copyNumberData:DiscreteCopyNumberData[], oncoKbData:IOncoKbData): Query|undefined
    {
        // return null in case sampleToTumorMap is null
        return oncoKbData.uniqueSampleKeyToTumorType ? generateQueryVariant(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType[copyNumberData[0].uniqueSampleKey],
            getAlterationString(copyNumberData[0].alteration)
        ) : undefined;
    }

    public static sortValue(data:DiscreteCopyNumberData[],
                            oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                            oncoKbData?: IOncoKbDataWrapper,
                            civicGenes?: ICivicGeneDataWrapper,
                            civicVariants?: ICivicVariantDataWrapper):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, oncoKbAnnotatedGenes, oncoKbData, civicGenes, civicVariants);

        return _.flatten([OncoKB.sortValue(annotationData.oncoKbIndicator),
                         Civic.sortValue(annotationData.civicEntry)]);
    }

    public static renderFunction(data:DiscreteCopyNumberData[], columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(data, columnProps.oncoKbAnnotatedGenes, columnProps.oncoKbData, columnProps.civicGenes, columnProps.civicVariants);

        let evidenceQuery:Query|undefined;

        if (columnProps.oncoKbData && columnProps.oncoKbData.result) {
            evidenceQuery = this.getEvidenceQuery(data, columnProps.oncoKbData.result);
        }

        return DefaultAnnotationColumnFormatter.mainContent(annotation,
            columnProps,
            columnProps.oncoKbEvidenceCache,
            evidenceQuery,
            columnProps.pubMedCache);
    }
}
