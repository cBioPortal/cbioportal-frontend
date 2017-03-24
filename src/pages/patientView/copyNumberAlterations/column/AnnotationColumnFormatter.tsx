import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {
    IOncoKbData, IAnnotation, IAnnotationColumnProps, IEvidence, default as DefaultAnnotationColumnFormatter
} from "../../mutation/column/AnnotationColumnFormatter";
import OncoKB from "shared/components/annotation/OncoKB";
import {generateQueryVariantId} from "shared/lib/OncoKbUtils";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(copyNumberData:DiscreteCopyNumberData|undefined,
                          oncoKbData?:IOncoKbData,
                          pmidData?:any)
    {
        let value: IAnnotation;

        if (copyNumberData) {
            value = {
                oncoKbIndicator: oncoKbData ?
                    AnnotationColumnFormatter.getIndicatorData(copyNumberData, oncoKbData) : undefined,
                oncoKbEvidence: oncoKbData ?
                    AnnotationColumnFormatter.getEvidenceData(copyNumberData, oncoKbData) : undefined,
                pmids: pmidData || {},
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

    public static getIndicatorData(copyNumberData:DiscreteCopyNumberData, oncoKbData:IOncoKbData):IndicatorQueryResp
    {
        const id = generateQueryVariantId(copyNumberData.gene.hugoGeneSymbol,
            oncoKbData.sampleToTumorMap[copyNumberData.sampleId],
            getAlterationString(copyNumberData.alteration));

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceData(copyNumberData:DiscreteCopyNumberData, oncoKbData:IOncoKbData):IEvidence
    {
        const id = generateQueryVariantId(copyNumberData.gene.hugoGeneSymbol,
            oncoKbData.sampleToTumorMap[copyNumberData.sampleId],
            getAlterationString(copyNumberData.alteration));

        return oncoKbData.evidenceMap[id];
    }

    public static sortValue(data:DiscreteCopyNumberData,
                            oncoKbData?:IOncoKbData,
                            pmidData?:any):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, oncoKbData, pmidData);

        return OncoKB.sortValue(annotationData.oncoKbIndicator);
    }

    public static renderFunction(data:DiscreteCopyNumberData, columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(
            data, columnProps.oncoKbData, columnProps.pmidData);

        return DefaultAnnotationColumnFormatter.mainContent(annotation, columnProps);
    }
}
