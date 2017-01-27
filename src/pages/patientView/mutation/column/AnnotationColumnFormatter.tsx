import * as React from 'react';
import {Td} from 'reactable';
import Tooltip from 'rc-tooltip';
import * as _ from 'lodash';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";
import styles from "./style/annotation.module.scss";

export interface IHotspotData {
    single: {[s:string]: boolean};
    clustered: {[s:string]: boolean};
}

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    myCancerGenome: string[];
}

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(data:IColumnFormatterData<MutationTableRowData>, hotspotsData?:IHotspotData)
    {
        let annotation;

        if (data.columnData) {
            annotation = data.columnData;
        }
        else {
            annotation = AnnotationColumnFormatter.getDataFromRow(data.rowData, hotspotsData);
        }

        return annotation;
    }

    public static getDataFromRow(rowData:MutationTableRowData|undefined, hotspotsData?:IHotspotData)
    {
        let value: any;

        if (rowData) {
            const mutations:Mutation[] = rowData;

            value = {
                myCancerGenome: [], // TODO need to get it from external service ["link a", "link b", "link c"]
                isHotspot: hotspotsData ?
                    AnnotationColumnFormatter.isHotspot(mutations[0], hotspotsData.single) : false,
                is3dHotspot: hotspotsData ?
                    AnnotationColumnFormatter.isHotspot(mutations[0], hotspotsData.clustered) : false
            };
        }
        else {
            value = null;
        }

        return value;
    }

    public static sortFunction(a:IAnnotation, b:IAnnotation):number
    {
        // TODO we have hotspot annotation only, so our array has one value for now
        const aValue:number[] = [AnnotationColumnFormatter.hotspotSortValue(a)];
        const bValue:number[] = [AnnotationColumnFormatter.hotspotSortValue(b)];

        let diff = 0;

        // compare aValue[0] with bValue[0], if equal compare aValue[1] with bValue[1], and so on...
        for (let i = 0; i < aValue.length; i++)
        {
            diff = aValue[i] - bValue[i];

            // once the tie is broken, we are done
            if (diff !== 0) {
                break;
            }
        }

        return diff;
    }

    public static hotspotSortValue(annotation:IAnnotation):number // annotation:Annotation
    {
        let score:number = 0;

        if (annotation.isHotspot) {
            score += 1;
        }

        if (annotation.is3dHotspot) {
            score += 0.5;
        }

        return score;
    }

    // TODO if certain data (hotspots, mycancergenome, etc. is not yet available, show a loader image!)
    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getDataFromRow(data.rowData, columnProps.hotspots);

        const hotspotContent:JSX.Element|null = AnnotationColumnFormatter.hotspotContent(
            columnProps.showHotspot, annotation.isHotspot, annotation.is3dHotspot);
        const myCancerGenomeContent:JSX.Element|null = AnnotationColumnFormatter.myCancerGenomeContent(
            annotation.myCancerGenome, columnProps.enableMyCancerGenome);
        const oncoKbContent:JSX.Element|null = AnnotationColumnFormatter.oncoKbContent();

        // TODO if data is not yet fetched, just return a generic column with loader image
        return (
            <Td key={data.name} column={data.name} value={annotation}>
                <span>
                    {oncoKbContent || ""}
                    {myCancerGenomeContent || ""}
                    {hotspotContent || ""}
                </span>
            </Td>
        );
    }

    public static hotspotContent(showHotspot:boolean, isHotspot:boolean, is3dHotspot:boolean)
    {
        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
        let hotspotContent:JSX.Element|null = null;

        if (showHotspot && (isHotspot || is3dHotspot))
        {
            const hotspotsImgWidth:number = 14;
            let hotspotsImgHeight:number = 14;
            let hotspotsImgSrc = require("./images/cancer-hotspots.svg");

            // if it is a 3D hotspot but not a recurrent hotspot, show the 3D hotspot icon
            if (!isHotspot)
            {
                hotspotsImgSrc = require("./images/3d-hotspots.svg");
                hotspotsImgHeight = 18;
            }

            const hotspotTooltipContent = AnnotationColumnFormatter.hotspotInfo(isHotspot, is3dHotspot);

            hotspotContent = (
                <Tooltip overlay={hotspotTooltipContent} placement="rightTop" arrowContent={arrowContent}>
                    <span className='annotation-item chang_hotspot'>
                        <img width={hotspotsImgWidth} height={hotspotsImgHeight} src={hotspotsImgSrc} alt='Recurrent Hotspot Symbol' />
                    </span>
                </Tooltip>
            );
        }

        return hotspotContent;
    }

    public static oncoKbContent()
    {
        // return (
        //     <span className={`${styles["annotation-item"]} oncokb oncokb_alteration oncogenic`}>
        //         <img className='oncokb oncogenic' width="14" height="14" src="images/ajax-loader.gif" alt='loading' />
        //     </span>
        // )

        return null;
    }

    public static myCancerGenomeContent(myCancerGenome:string[], enable:boolean)
    {
        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
        let myCancerGenomeContent:JSX.Element|null = null;

        if (enable && myCancerGenome.length > 0)
        {
            const mcgTooltipContent = AnnotationColumnFormatter.myCancerGenomeLinks(myCancerGenome);

            myCancerGenomeContent = (
                <Tooltip overlay={mcgTooltipContent} placement="rightTop" arrowContent={arrowContent}>
                    <span className={`${styles["annotation-item"]} mcg`}>
                        <img width='14' height='14' src={require("./images/mcg_logo.png")} alt='My Cancer Genome Symbol' />
                    </span>
                </Tooltip>
            );
        }

        return myCancerGenomeContent;
    }

    public static myCancerGenomeLinks(myCancerGenome:string[])
    {
        const links:any[] = [];

        _.each(myCancerGenome, function(link:string){
            links.push(
                <li>{link}</li>
            );
        });

        return (
            <span>
                <b>My Cancer Genome links:</b>
                <br/>
                <ul style={{"list-style-position": "inside;padding-left:0;"}}>
                    {links}
                </ul>
            </span>
        );
    }

    public static isHotspot(mutation:Mutation, map:{[key:string]: boolean}):boolean
    {
        let key:string = mutation.gene.hugoGeneSymbol + "_" + mutation.proteinPosStart;

        if (mutation.proteinPosEnd &&
            (mutation.proteinPosEnd !== mutation.proteinPosStart))
        {
            key = key + "_" + mutation.proteinPosEnd;
        }

        return map[key] || false;
    }

    public static hotspotInfo(isHotspot:boolean, is3dHotspot:boolean)
    {
        return (
            <span className={styles["hotspot-info"]}>
                {AnnotationColumnFormatter.title(isHotspot, is3dHotspot)}
                <br/>
                {AnnotationColumnFormatter.publication(isHotspot, is3dHotspot)}
                <br/><br/>
                {AnnotationColumnFormatter.link(isHotspot, is3dHotspot)}
            </span>
        );
    }

    public static title(isHotspot:boolean, is3dHotspot:boolean)
    {
        const recurrentHotspot = isHotspot ? (<b>Recurrent Hotspot</b>) : "";
        const maybeAnd = isHotspot && is3dHotspot ? "and" : "";
        const clusteredHotspot = is3dHotspot ? (<b>3D Clustered Hotspot</b>) : "";

        return (
            <span>
                {recurrentHotspot} {maybeAnd} {clusteredHotspot}
            </span>
        );
    }

    public static publication(isHotspot:boolean, is3dHotspot:boolean)
    {
        const recurrentHotspot = isHotspot ? "a recurrent hotspot (statistically significant)" : "";
        const maybeAnd = isHotspot && is3dHotspot ? "and" : "";
        const clusteredHotspot = is3dHotspot ? "a 3D clustered hotspot" : "";

        const recurrentPublication = isHotspot ? (
            <a href="http://www.ncbi.nlm.nih.gov/pubmed/26619011" target="_blank">
                Chang et al., Nat Biotechnol, 2016
            </a>
        ) : "";

        const clusteredPublication = is3dHotspot ? (
            <a href="http://genomemedicine.biomedcentral.com/articles/10.1186/s13073-016-0393-x" target="_blank">
                Gao et al., Genome Medicine, 2017
            </a>
        ) : "";

        return (
            <span>
                This mutated amino acid was identified as {recurrentHotspot} {maybeAnd} {clusteredHotspot} in a
                population-scale cohort of tumor samples of various cancer types using methodology based in part
                on {recurrentPublication} {maybeAnd} {clusteredPublication}.
            </span>
        );
    }

    public static link(isHotspot:boolean, is3dHotspot:boolean)
    {
        const recurrentLink = isHotspot ? (
            <a href="http://cancerhotspots.org/" target="_blank">
                http://cancerhotspots.org/
            </a>
        ) : "";

        const maybeAnd = isHotspot && is3dHotspot ? "and" : "";

        const clusteredLink = is3dHotspot ? (
            <a href="http://3dhotspots.org/" target="_blank">
                http://3dhotspots.org/
            </a>
        ) : "";

        return (
            <span>
                Explore all mutations at {recurrentLink} {maybeAnd} {clusteredLink}.
            </span>
        );
    }

}
