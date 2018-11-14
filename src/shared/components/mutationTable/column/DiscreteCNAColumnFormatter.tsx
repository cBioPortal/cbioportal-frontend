import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    DiscreteCNACacheDataType,
    default as DiscreteCNACache
} from "shared/cache/DiscreteCNACache";
import {MolecularProfile, Mutation, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";

export default class DiscreteCNAColumnFormatter {

    private static altToFilterString:{[a:number]:string} = {
        "2": "amp",
        "1": "gain",
        "0": "diploid",
        "-1": "shallowdel",
        "-2": "deepdel"
    };

    private static getFacetsCNAData(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined) {
        const sampleId:string = data[0].sampleId;
        const tcn = data[0].totalCopyNumber;
        const lcn = data[0].minorCopyNumber;
        const mcn:number = tcn - lcn;
        let wgd = null;
        if (sampleIdToClinicalDataMap) {
            const wgdData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_WGD");
            if (wgdData !== undefined && wgdData.length > 0) {
                wgd = wgdData[0].value;
            }
        }
        if (tcn === -1 || lcn === -1 || wgd === null) {
            return "NA";
        }
        return DiscreteCNAColumnFormatter.getFacetsCall(mcn, lcn, wgd);
    }

    private static getFacetsCall(mcn:number, lcn:number, wgd:string) {
        let facetsCall = null;
        if (wgd === "no WGD" && mcn === 0 && lcn === 0) {
            facetsCall = "Homdel";
        } else if (wgd === "no WGD" && mcn === 1 && lcn === 0) {
            facetsCall = "Hetloss";
        } else if (wgd === "no WGD" && mcn === 2 && lcn === 0) {
            facetsCall = "CNLOH";
        } else if (wgd === "no WGD" && mcn === 3 && lcn === 0) {
            facetsCall = "CNLOH & Gain";
        } else if (wgd === "no WGD" && mcn === 4 && lcn === 0) {
            facetsCall = "CNLOH & Gain";
        } else if (wgd === "no WGD" && mcn === 5 && lcn === 0) {
            facetsCall = "Amp (LOH)";
        } else if (wgd === "no WGD" && mcn === 6 && lcn === 0) {
            facetsCall = "Amp (LOH)";
        } else if (wgd === "no WGD" && mcn === 1 && lcn === 1) {
            facetsCall = "Diploid";
        } else if (wgd === "no WGD" && mcn === 2 && lcn === 1) {
            facetsCall = "Gain";
        } else if (wgd === "no WGD" && mcn === 3 && lcn === 1) {
            facetsCall = "Gain";
        } else if (wgd === "no WGD" && mcn === 4 && lcn === 1) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 5 && lcn === 1) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 6 && lcn === 1) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 2 && lcn === 2) {
            facetsCall = "Tetraploid";
        } else if (wgd === "no WGD" && mcn === 3 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 4 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 5 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 6 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 3 && lcn === 3) {
            facetsCall = "Amp (Balanced)";
        } else if (wgd === "no WGD" && mcn === 4 && lcn === 3) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 5 && lcn === 3) {
            facetsCall = "Amp";
        } else if (wgd === "no WGD" && mcn === 6 && lcn === 3) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 0 && lcn === 0) {
            facetsCall = "HOMDEL";
        } else if (wgd === "WGD" && mcn === 1 && lcn === 0) {
            facetsCall = "Loss Before & After";
        } else if (wgd === "WGD" && mcn === 2 && lcn === 0) {
            facetsCall = "Loss Before";
        } else if (wgd === "WGD" && mcn === 3 && lcn === 0) {
            facetsCall = "CNLOH Before & Loss";
        } else if (wgd === "WGD" && mcn === 4 && lcn === 0) {
            facetsCall = "CNLOH Before";
        } else if (wgd === "WGD" && mcn === 5 && lcn === 0) {
            facetsCall = "CNLOH Before & Gain";
        } else if (wgd === "WGD" && mcn === 6 && lcn === 0) {
            facetsCall = "Amp (LOH)";
        } else if (wgd === "WGD" && mcn === 1 && lcn === 1) {
            facetsCall = "Double Loss After";
        } else if (wgd === "WGD" && mcn === 2 && lcn === 1) {
            facetsCall = "Loss After";
        } else if (wgd === "WGD" && mcn === 3 && lcn === 1) {
            facetsCall = "CNLOH After";
        } else if (wgd === "WGD" && mcn === 4 && lcn === 1) {
            facetsCall = "Loss & Gain";
        } else if (wgd === "WGD" && mcn === 5 && lcn === 1) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 6 && lcn === 1) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 2 && lcn === 2) {
            facetsCall = "Tetraploid";
        } else if (wgd === "WGD" && mcn === 3 && lcn === 2) {
            facetsCall = "Gain";
        } else if (wgd === "WGD" && mcn === 4 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 5 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 6 && lcn === 2) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 3 && lcn === 3) {
            facetsCall = "Amp (Balanced)";
        } else if (wgd === "WGD" && mcn === 4 && lcn === 3) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 5 && lcn === 3) {
            facetsCall = "Amp";
        } else if (wgd === "WGD" && mcn === 6 && lcn === 3) {
            facetsCall = "Amp";
        } else {
            facetsCall = "NA";
        }
        return facetsCall;
    }
   
    public static formatFacetsCNAData(facetsCNAData:string) {
        let color = "";
        let size = "";
        if (facetsCNAData.includes("Amp")) {
            color = "red";
            size = "12px";
        } else if (facetsCNAData.includes("Gain")) {
            color = "red";
            size = "smaller"; 
        } else if (facetsCNAData.includes("Loss")) {
            color = "blue";
            size = "smaller";
        } else if (facetsCNAData.includes("Homdel")) {
            color = "blue";
            size = "12px";
        } else { 
            color = "black";
            size = "xx-small";
        }
        if (facetsCNAData === "Diploid") {
            return (<span style={{color:color, textAlign:"center", fontSize:size}}>
                {facetsCNAData}
                </span>);
        } 
        return (<span style={{color:color, textAlign:"center", fontSize:size}}>
                <b>{facetsCNAData}</b>
                </span>);
    }

    public static getFacetsCNATooltip(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined) {
        const sampleId:string = data[0].sampleId;
        const tcn = data[0].totalCopyNumber;
        const lcn = data[0].minorCopyNumber;
        const mcn:number = tcn - lcn;
        let wgd = null;
        let facetsTooltip = null;
        if (sampleIdToClinicalDataMap) {
            let wgdData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_WGD");
            if (wgdData !== undefined && wgdData.length > 0) {
                wgd = wgdData[0].value;
            }
        }
        if (tcn === -1 || lcn === -1 || wgd === null) {
            return (<span><b>NA</b></span>);
        } else {
            facetsTooltip = DiscreteCNAColumnFormatter.getFacetsCall(mcn, lcn, wgd).toLowerCase() 
        }
        return (<span><b>{facetsTooltip}</b> ({wgd} with total copy number of {tcn.toString(10)} and a minor copy number of {lcn.toString(10)})</span>);
            
    }

    public static renderFunction(data: Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined) {
        const cnaData = DiscreteCNAColumnFormatter.getData(data, molecularProfileIdToMolecularProfile, cache);
        const facetsCNAData = DiscreteCNAColumnFormatter.getFacetsCNAData(data, sampleIdToClinicalDataMap);
        let cnaDataValue = DiscreteCNAColumnFormatter.getTdContents(cnaData);
        let cnaToolTip = DiscreteCNAColumnFormatter.getTooltipContents(cnaData);
        if (facetsCNAData !== "NA") {        
            cnaDataValue = DiscreteCNAColumnFormatter.formatFacetsCNAData(facetsCNAData);
            cnaToolTip = DiscreteCNAColumnFormatter.getFacetsCNATooltip(data, sampleIdToClinicalDataMap);
        }
        return (<DefaultTooltip placement="left" 
                    overlay={cnaToolTip} 
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                >
                    {cnaDataValue}
                </DefaultTooltip>
        );
    }

    public static getSortValue(data:Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache) {
        return DiscreteCNAColumnFormatter.getTdValue(DiscreteCNAColumnFormatter.getData(data, molecularProfileIdToMolecularProfile, cache));
    }

    public static filter(data:Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, filterString:string):boolean {
        const cnaData = DiscreteCNAColumnFormatter.getData(data, molecularProfileIdToMolecularProfile, cache);
        if (cnaData && cnaData.data) {
            return (!!DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration])
                && (DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration]
                    .indexOf(filterString.toLowerCase()) > -1);
        } else {
            return false;
        }
    }

    protected static getData(data:Mutation[] | undefined, molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, discreteCNACache:DiscreteCNACache):DiscreteCNACacheDataType | null {
        if (!data || data.length === 0 || !discreteCNACache.isActive) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        const molecularProfile = molecularProfileIdToMolecularProfile[data[0].molecularProfileId];
        if (molecularProfile) {
            return discreteCNACache.get({sampleId, entrezGeneId, studyId: molecularProfile.studyId});
        } else {
            return null;
        }
    }

    protected static getTdValue(cacheDatum:DiscreteCNACacheDataType | null):number|null {
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return cacheDatum.data.alteration;
        } else {
            return null;
        }
    }

    protected static getTdContents(cacheDatum:DiscreteCNACacheDataType | null) {
        let status:TableCellStatus | null = null;
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            const alteration = cacheDatum.data.alteration;
            if (alteration === 2) {
                return (<span style={{color:"red", textAlign:"center", fontSize:"12px"}}>
                    <b>Amp</b>
                </span>);
            } else if (alteration === 1) {
                return (<span style={{color:"red", textAlign:"center", fontSize:"smaller"}}>
                    <b>Gain</b>
                </span>);
            } else if (alteration === 0) {
                return (<span style={{color:"black", textAlign:"center", fontSize:"xx-small"}}>
                    Diploid
                </span>);
            } else if (alteration === -1) {
                return (<span style={{color:"blue", textAlign:"center", fontSize:"smaller"}}>
                    <b>ShallowDel</b>
                </span>);
            } else {
                return (<span style={{color:"blue", textAlign:"center", fontSize:"12px"}}>
                    <b>DeepDel</b>
                </span>);
            }
        } else if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data === null) {
            status=TableCellStatus.NA;
        } else if (cacheDatum && cacheDatum.status === "error") {
            status=TableCellStatus.ERROR;
        } else {
            status=TableCellStatus.NA;
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                    naAlt="CNA data is not available for this gene."
                />
            );
        }
    }

    protected static getTooltipContents(cacheDatum:DiscreteCNACacheDataType | null) {
        const altToText:{[a:number]:string} = {
            '-2':"Deep deletion",
            '-1':"Shallow deletion",
            '0':"Diploid / normal",
            '1':"Low-level gain",
            '2':"High-level amplification"
        };
        if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return (
                <div>
                    <span>{altToText[cacheDatum.data.alteration]}</span>
                </div>
            );
        } else if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data === null) {
            return (<span>CNA data is not available for this gene.</span>);
        } else if (cacheDatum && cacheDatum.status === "error") {
            return (<span>Error retrieving data.</span>);
        } else {
            return (<span>Querying server for data.</span>);
        }
    }

    public static isVisible(cache:DiscreteCNACache): boolean {
        return cache && cache.isActive;
    }
}
