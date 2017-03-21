import * as React from 'react';
import {Td} from 'reactable';
import {If} from 'react-if';
import {IColumnFormatterData} from "shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "shared/components/mutationTable/IMutationTableProps";
import CancerHotspots from "shared/components/annotation/CancerHotspots";
import MyCancerGenome from "shared/components/annotation/MyCancerGenome";
import OncoKB from "shared/components/annotation/OncoKB";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {IndicatorQueryResp, EvidenceQueryRes} from "shared/api/generated/OncoKbAPI";
import {generateQueryVariantId} from "shared/lib/OncoKbUtils";
import * as _ from "lodash";

export interface IMyCancerGenome {
    hugoGeneSymbol: string;
    alteration: string;
    cancerType: string;
    linkHTML: string;
}

export interface IOncoKbData {
    indicatorMap: {[id:string]: IndicatorQueryResp};
    evidenceMap: {[id:string]: IEvidence};
    sampleToTumorMap: {[sampleId:string]: string};
}

export interface IHotspotData {
    single: {[s:string]: boolean};
    clustered: {[s:string]: boolean};
}

export interface IMyCancerGenomeData {
    [hugoSymbol:string]: IMyCancerGenome[];
}

export interface IAnnotationColumnProps {
    enableOncoKb: boolean;
    enableMyCancerGenome: boolean;
    enableHotspot: boolean;
    hotspots?: IHotspotData;
    myCancerGenomeData?: IMyCancerGenomeData;
    oncoKbData?: IOncoKbData;
    pmidData?: any;
}

export interface IEvidence {
    id: string;
    gene: any;
    alteration: any[];
    prevalence: any[];
    progImp: any[];
    treatments: {
        sensitivity: any[];
        resistance: any[];
    }; //separated by level type
    trials: any[];
    oncogenic: string;
    oncogenicRefs: string[];
    mutationEffect: any;
    summary: string;
    drugs: {
        sensitivity: {
            current: any[];
            inOtherTumor: any[];
        },
        resistance: any[];
    };
}

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    myCancerGenomeLinks: string[];
    oncoKbIndicator?: IndicatorQueryResp;
    oncoKbEvidence?: IEvidence;
    pmids?: any;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(rowData:Mutation[]|undefined,
                          hotspotsData?:IHotspotData,
                          myCancerGenomeData?:IMyCancerGenomeData,
                          oncoKbData?:IOncoKbData,
                          pmidData?:any)
    {
        let value: IAnnotation;

        if (rowData) {
            const mutations:Mutation[] = rowData;
            const mutation = mutations[0];

            value = {
                oncoKbIndicator: oncoKbData ?
                    AnnotationColumnFormatter.getIndicatorData(mutation, oncoKbData) : undefined,
                oncoKbEvidence: oncoKbData ?
                    AnnotationColumnFormatter.getEvidenceData(mutation, oncoKbData) : undefined,
                pmids: pmidData || {},
                myCancerGenomeLinks: myCancerGenomeData ?
                    AnnotationColumnFormatter.getMyCancerGenomeLinks(mutation, myCancerGenomeData) : [],
                isHotspot: hotspotsData ?
                    CancerHotspots.isHotspot(mutation, hotspotsData.single) : false,
                is3dHotspot: hotspotsData ?
                    CancerHotspots.isHotspot(mutation, hotspotsData.clustered) : false
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

    public static getIndicatorData(mutation:Mutation, oncoKbData:IOncoKbData):IndicatorQueryResp
    {
        const id = generateQueryVariantId(mutation.gene.hugoGeneSymbol,
            mutation.mutationType,
            mutation.proteinChange,
            oncoKbData.sampleToTumorMap[mutation.sampleId]);

        return oncoKbData.indicatorMap[id];
    }

    public static getEvidenceData(mutation:Mutation, oncoKbData:IOncoKbData):IEvidence
    {
        const id = generateQueryVariantId(mutation.gene.hugoGeneSymbol,
            mutation.mutationType,
            mutation.proteinChange,
            oncoKbData.sampleToTumorMap[mutation.sampleId]);

        return oncoKbData.evidenceMap[id];
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
                            hotspotsData?:IHotspotData,
                            myCancerGenomeData?:IMyCancerGenomeData,
                            oncoKbData?:IOncoKbData,
                            pmidData?:any):number[] {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(data, hotspotsData, myCancerGenomeData, oncoKbData, pmidData);
        return _.flatten([
            OncoKB.sortValue(annotationData.oncoKbIndicator),
            MyCancerGenome.sortValue(annotationData.myCancerGenomeLinks),
            CancerHotspots.sortValue(annotationData.isHotspot, annotationData.is3dHotspot)
        ]);
    }

    public static renderFunction(data:Mutation[], columnProps:IAnnotationColumnProps)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getData(
            data, columnProps.hotspots, columnProps.myCancerGenomeData, columnProps.oncoKbData, columnProps.pmidData);

        // TODO if certain data (hotspots, mycancergenome, etc.) is not yet available (i.e. status==fetching),
        // show a loader image!
        return (
            <span>
                <If condition={columnProps.enableOncoKb || false}>
                    <OncoKB
                        indicator={annotation.oncoKbIndicator}
                        evidence={annotation.oncoKbEvidence}
                        pmids={annotation.pmids}
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
                    />
                </If>
            </span>
        );
    }
}
