import * as React from 'react';
import {Td} from 'reactable';
import {If} from 'react-if';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import CancerHotspots from "../../../../shared/components/annotation/CancerHotspots";
import MyCancerGenome from "../../../../shared/components/annotation/MyCancerGenome";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";

export interface IMyCancerGenome {
    "hugoGeneSymbol": string;
    "alteration": string;
    "cancerType": string;
    "linkHTML": string;
}

export interface IHotspotData {
    single: {[s:string]: boolean};
    clustered: {[s:string]: boolean};
}

export interface IMyCancerGenomeData {
    [hugoSymbol:string]: IMyCancerGenome[];
}

export interface IAnnotation {
    isHotspot: boolean;
    is3dHotspot: boolean;
    myCancerGenomeLinks: string[];
}

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter
{
    public static getData(data:IColumnFormatterData<MutationTableRowData>,
                          hotspotsData?:IHotspotData,
                          myCancerGenomeData?:IMyCancerGenomeData)
    {
        let annotation;

        if (data.columnData) {
            annotation = data.columnData;
        }
        else {
            annotation = AnnotationColumnFormatter.getDataFromRow(data.rowData, hotspotsData, myCancerGenomeData);
        }

        return annotation;
    }

    public static getDataFromRow(rowData:MutationTableRowData|undefined,
                                 hotspotsData?:IHotspotData,
                                 myCancerGenomeData?:IMyCancerGenomeData)
    {
        let value: any;

        if (rowData) {
            const mutations:Mutation[] = rowData;
            const mutation = mutations[0];

            value = {
                myCancerGenomeLinks: myCancerGenomeData ?
                    AnnotationColumnFormatter.getMyCancerGenomeLinks(mutation, myCancerGenomeData) : [],
                isHotspot: hotspotsData ?
                    CancerHotspots.isHotspot(mutation, hotspotsData.single) : false,
                is3dHotspot: hotspotsData ?
                    CancerHotspots.isHotspot(mutation, hotspotsData.clustered) : false
            };
        }
        else {
            value = null;
        }

        return value;
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

    public static sortFunction(a:IAnnotation, b:IAnnotation):number
    {
        // TODO add oncoKb value to the beginning of the array when it is ready!
        const aValue:number[] = [
            MyCancerGenome.sortValue(a.myCancerGenomeLinks),
            CancerHotspots.sortValue(a.isHotspot, a.is3dHotspot)
        ];
        const bValue:number[] = [
            MyCancerGenome.sortValue(b.myCancerGenomeLinks),
            CancerHotspots.sortValue(b.isHotspot, b.is3dHotspot)
        ];

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

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        const annotation:IAnnotation = AnnotationColumnFormatter.getDataFromRow(
            data.rowData, columnProps.hotspots, columnProps.myCancerGenomeData);

        // TODO if certain data (hotspots, mycancergenome, etc.) is not yet available (i.e. status==fetching),
        // show a loader image!
        return (
            <Td key={data.name} column={data.name} value={annotation}>
                <span>
                    <If condition={columnProps.enableOncoKb || false}>
                        {/* TODO <OncoKB></OncoKB>*/}
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
            </Td>
        );
    }

    // TODO move this to OncoKB component!
    public static oncoKbContent()
    {
        // return (
        //     <span className={`${styles["annotation-item"]} oncokb oncokb_alteration oncogenic`}>
        //         <img className='oncokb oncogenic' width="14" height="14" src="images/ajax-loader.gif" alt='loading' />
        //     </span>
        // )

        return null;
    }

}
