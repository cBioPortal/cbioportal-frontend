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
import {ICivicVariant, ICivicGene, ICivicEntry, ICivicVariantData, ICivicGeneData} from "shared/model/Civic.ts";
import {buildCivicEntry} from "shared/lib/CivicUtils";

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(copyNumberData:DiscreteCopyNumberData[]|undefined,
                          geneticProfileIdToStudyId:{[geneticProfileId:string]:string},
                          oncoKbData?: IOncoKbDataWrapper,
                          civicGenes?: ICivicGene,
                          civicVariants?: ICivicVariant)
    {
        let value: IAnnotation;

        if (copyNumberData)
        {
            let oncoKbIndicator: IndicatorQueryResp|undefined;

            if (oncoKbData && oncoKbData.result && oncoKbData.status === "complete") {
                oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(copyNumberData, geneticProfileIdToStudyId, oncoKbData.result);
            }

            value = {
                oncoKbStatus: oncoKbData ? oncoKbData.status : "pending",
                oncoKbIndicator,
                civicEntry: civicGenes && civicVariants ?
                    AnnotationColumnFormatter.getCivicEntry(copyNumberData, civicGenes, civicVariants) : undefined,
                hasCivicVariants: civicGenes && civicVariants ?
                    AnnotationColumnFormatter.hasCivicVariants(copyNumberData, civicGenes, civicVariants) : true,
                myCancerGenomeLinks: [],
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
    public static getCivicEntry(copyNumberData:DiscreteCopyNumberData[], civicGenes:ICivicGene, civicVariants:ICivicVariant): ICivicEntry | null
    {
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants: {[name: string]: ICivicVariantData} = civicVariants[geneSymbol];
        let geneEntry: ICivicGeneData = civicGenes[geneSymbol];
        let civicEntry = null;
        //Only return data for genes with variants or it has a description provided by the Civic API
        if (geneVariants || (geneEntry && geneEntry.description !== "")) {
            civicEntry = buildCivicEntry(geneEntry, geneVariants);
        }

        return civicEntry;
    }

    public static hasCivicVariants (copyNumberData:DiscreteCopyNumberData[], civicGenes:ICivicGene, civicVariants:ICivicVariant): boolean
    {
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants: {[name: string]: ICivicVariantData} = civicVariants[geneSymbol];
        let geneEntry: ICivicGeneData = civicGenes[geneSymbol];

        if (geneEntry && !geneVariants) {
            return false;
        }

        return true;
    }

    public static getIndicatorData(copyNumberData:DiscreteCopyNumberData[], geneticProfileIdToStudyId:{[geneticProfileId:string]:string}, oncoKbData:IOncoKbData): IndicatorQueryResp|undefined
    {
        if (oncoKbData.studyToSampleToTumorType === null || oncoKbData.indicatorMap === null) {
            return undefined;
        }

        const studyId = geneticProfileIdToStudyId[copyNumberData[0].geneticProfileId];
        const id = generateQueryVariantId(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.studyToSampleToTumorType[studyId][copyNumberData[0].sampleId],
            getAlterationString(copyNumberData[0].alteration));

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceQuery(copyNumberData:DiscreteCopyNumberData[], geneticProfileIdToStudyId:{[geneticProfileId:string]:string}, oncoKbData:IOncoKbData): Query|undefined
    {
        const studyId = geneticProfileIdToStudyId[copyNumberData[0].geneticProfileId];
        // return null in case sampleToTumorMap is null
        return oncoKbData.studyToSampleToTumorType ? generateQueryVariant(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.studyToSampleToTumorType[studyId][copyNumberData[0].sampleId],
            getAlterationString(copyNumberData[0].alteration)
        ) : undefined;
    }

    public static sortValue(data:DiscreteCopyNumberData[],
                            geneticProfileIdToStudyId:{[geneticProfileId:string]:string},
                            oncoKbData?: IOncoKbDataWrapper,
                            civicGenes?: ICivicGene,
                            civicVariants?: ICivicVariant):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, geneticProfileIdToStudyId, oncoKbData, civicGenes, civicVariants);

        return _.flatten([OncoKB.sortValue(annotationData.oncoKbIndicator),
                         Civic.sortValue(annotationData.civicEntry)]);
    }

    public static renderFunction(data:DiscreteCopyNumberData[], geneticProfileIdToStudyId:{[geneticProfileId:string]:string}, columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(data, geneticProfileIdToStudyId, columnProps.oncoKbData, columnProps.civicGenes, columnProps.civicVariants);

        let evidenceQuery:Query|undefined;

        if (columnProps.oncoKbData && columnProps.oncoKbData.result) {
            evidenceQuery = this.getEvidenceQuery(data, geneticProfileIdToStudyId, columnProps.oncoKbData.result);
        }

        return DefaultAnnotationColumnFormatter.mainContent(annotation,
            columnProps,
            columnProps.oncoKbEvidenceCache,
            evidenceQuery,
            columnProps.pubMedCache);
    }
}
