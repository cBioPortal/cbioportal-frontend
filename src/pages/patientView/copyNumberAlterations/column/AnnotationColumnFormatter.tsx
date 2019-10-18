import * as React from 'react';
import * as _ from "lodash";
import {oncoKbAnnotationSortValue} from "react-mutation-mapper";
import {CancerStudy, DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {
    IAnnotation, IAnnotationColumnProps, default as DefaultAnnotationColumnFormatter
} from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import {IOncoKbCancerGenesWrapper, IOncoKbData, IOncoKbDataWrapper} from "shared/model/OncoKB";
import Civic from "shared/components/annotation/Civic";
import {generateQueryVariant} from "shared/lib/OncoKbUtils";
import {generateQueryVariantId} from "public-lib/lib/OncoKbUtils";
import {CancerGene, IndicatorQueryResp, Query} from "public-lib/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {ICivicVariant, ICivicGene, ICivicEntry, ICivicVariantData, ICivicGeneData, ICivicGeneDataWrapper, ICivicVariantDataWrapper} from "shared/model/Civic.ts";
import {buildCivicEntry, getCivicCNAVariants} from "shared/lib/CivicUtils";

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(copyNumberData:DiscreteCopyNumberData[]|undefined,
                          oncoKbCancerGenes? :IOncoKbCancerGenesWrapper,
                          oncoKbData?: IOncoKbDataWrapper,
                          civicGenes?: ICivicGeneDataWrapper,
                          civicVariants?: ICivicVariantDataWrapper,
                          studyIdToStudy?: {[studyId:string]:CancerStudy})
    {
        let value: IAnnotation;

        if (copyNumberData)
        {
            let oncoKbIndicator: IndicatorQueryResp|undefined = undefined;
            let oncoKbStatus:IAnnotation["oncoKbStatus"] = "complete";
            let hugoGeneSymbol = copyNumberData[0].gene.hugoGeneSymbol;

            let oncoKbGeneExist = false;
            let isOncoKbCancerGene = false;
            if( oncoKbCancerGenes && !(oncoKbCancerGenes instanceof Error)) {
                oncoKbGeneExist = _.find(oncoKbCancerGenes.result, (gene: CancerGene) => gene.oncokbAnnotated && gene.entrezGeneId === copyNumberData[0].entrezGeneId) !== undefined;
                isOncoKbCancerGene = _.find(oncoKbCancerGenes.result, (gene: CancerGene) => gene.entrezGeneId === copyNumberData[0].entrezGeneId) !== undefined;
            }

            // oncoKbData may exist but it might be an instance of Error, in that case we flag the status as error
            if (oncoKbData && oncoKbData.result instanceof Error) {
                oncoKbStatus = "error";
            }
            else if (oncoKbGeneExist) {
                // actually, oncoKbData.result shouldn't be an instance of Error in this case (we already check it above),
                // but we need to check it again in order to avoid TS errors/warnings
                if (oncoKbData &&
                    oncoKbData.result &&
                    !(oncoKbData.result instanceof Error) &&
                    oncoKbData.status === "complete")
                {
                    oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(copyNumberData, oncoKbData.result, studyIdToStudy);
                }
                oncoKbStatus = oncoKbData ? oncoKbData.status : "pending";
            }


            value = {
                hugoGeneSymbol,
                oncoKbStatus,
                oncoKbIndicator,
                oncoKbGeneExist,
                isOncoKbCancerGene,
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
        //geneEntry must exists, and only return data for genes with variants or it has a description provided by the Civic API
        if (geneEntry && (!_.isEmpty(geneVariants) || geneEntry.description !== "")) {
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

    public static getIndicatorData(copyNumberData:DiscreteCopyNumberData[], oncoKbData:IOncoKbData, studyIdToStudy?: {[studyId:string]:CancerStudy}): IndicatorQueryResp|undefined
    {
        if (oncoKbData.uniqueSampleKeyToTumorType === null || oncoKbData.indicatorMap === null) {
            return undefined;
        }

        const id = generateQueryVariantId(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.uniqueSampleKeyToTumorType[copyNumberData[0].uniqueSampleKey],
            getAlterationString(copyNumberData[0].alteration));

        if (oncoKbData.indicatorMap[id]) {
            let indicator = oncoKbData.indicatorMap[id];
            if (indicator.query.tumorType === null && studyIdToStudy) {
                const studyMetaData = studyIdToStudy[copyNumberData[0].studyId];
                if (studyMetaData.cancerTypeId !== "mixed") {           
                    indicator.query.tumorType = studyMetaData.cancerType.name;
                }
            }
            return indicator;
        } else {
            return undefined;
        }
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
                            oncoKbCancerGenes? :IOncoKbCancerGenesWrapper,
                            oncoKbData?: IOncoKbDataWrapper,
                            civicGenes?: ICivicGeneDataWrapper,
                            civicVariants?: ICivicVariantDataWrapper):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, oncoKbCancerGenes, oncoKbData, civicGenes, civicVariants);

        return _.flatten([oncoKbAnnotationSortValue(annotationData.oncoKbIndicator), Civic.sortValue(annotationData.civicEntry), annotationData.isOncoKbCancerGene ? 1 : 0]);
    }

    public static renderFunction(data:DiscreteCopyNumberData[], columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(data, columnProps.oncoKbCancerGenes, columnProps.oncoKbData, columnProps.civicGenes, columnProps.civicVariants, columnProps.studyIdToStudy);

        let evidenceQuery:Query|undefined;

        if (columnProps.oncoKbData &&
            columnProps.oncoKbData.result &&
            !(columnProps.oncoKbData.result instanceof Error))
        {
            evidenceQuery = this.getEvidenceQuery(data, columnProps.oncoKbData.result);
        }

        return DefaultAnnotationColumnFormatter.mainContent(annotation,
            columnProps,
            columnProps.oncoKbEvidenceCache,
            evidenceQuery,
            columnProps.pubMedCache);
    }
}
