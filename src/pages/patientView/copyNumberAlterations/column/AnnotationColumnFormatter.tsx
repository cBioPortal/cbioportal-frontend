import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {
    IAnnotation, IAnnotationColumnProps, default as DefaultAnnotationColumnFormatter
} from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import {IOncoKbData} from "shared/model/OncoKB";
import OncoKB from "shared/components/annotation/OncoKB";
import {generateQueryVariantId, generateQueryVariant} from "shared/lib/OncoKbUtils";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(copyNumberData:DiscreteCopyNumberData[]|undefined,
                          oncoKbData?:IOncoKbData)
    {
        let value: IAnnotation;

        if (copyNumberData) {
            value = {
                oncoKbIndicator: oncoKbData ?
                    AnnotationColumnFormatter.getIndicatorData(copyNumberData, oncoKbData) : undefined,
                myCancerGenomeLinks: [],
                isHotspot: false,
                is3dHotspot: false
            };
        }
        else {
            value = {
                myCancerGenomeLinks: [],
                isHotspot: false,
                is3dHotspot: false
            };
        }

        return value;
    }

    public static getIndicatorData(copyNumberData:DiscreteCopyNumberData[], oncoKbData:IOncoKbData): IndicatorQueryResp|null
    {
        if (oncoKbData.sampleToTumorMap === null || oncoKbData.indicatorMap === null) {
            return null;
        }

        const id = generateQueryVariantId(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.sampleToTumorMap[copyNumberData[0].sampleId],
            getAlterationString(copyNumberData[0].alteration));

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceQuery(copyNumberData:DiscreteCopyNumberData[], oncoKbData:IOncoKbData): Query|null
    {
        // return null in case sampleToTumorMap is null
        return oncoKbData.sampleToTumorMap ? generateQueryVariant(copyNumberData[0].gene.entrezGeneId,
            oncoKbData.sampleToTumorMap[copyNumberData[0].sampleId],
            getAlterationString(copyNumberData[0].alteration)
        ) : null;
    }

    public static sortValue(data:DiscreteCopyNumberData[],
                            oncoKbData?:IOncoKbData):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, oncoKbData);

        return OncoKB.sortValue(annotationData.oncoKbIndicator);
    }

    public static renderFunction(data:DiscreteCopyNumberData[], columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(data, columnProps.oncoKbData);

        let evidenceQuery:Query|undefined;

        if (columnProps.oncoKbData) {
            evidenceQuery = this.getEvidenceQuery(data, columnProps.oncoKbData) || undefined;
        }

        return DefaultAnnotationColumnFormatter.mainContent(annotation,
            columnProps,
            columnProps.oncoKbEvidenceCache,
            evidenceQuery,
            columnProps.pubMedCache);
    }
}
