import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    DiscreteCNACacheDataType,
    default as DiscreteCNACache
} from "shared/cache/DiscreteCNACache";
import {MolecularProfile, Mutation, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import SampleManager from "../../sampleManager";

export default class DiscreteCNAColumnFormatter {

    private static altToFilterString:{[a:number]:string} = {
        "2": "amp",
        "1": "gain",
        "0": "diploid",
        "-1": "shallowdel",
        "-2": "deepdel"
    };

    private static facetsCallTable:{[key:string]:string} = {
        "no WGD,0,0":"Homdel",
        "no WGD,1,0":"Hetloss",
        "no WGD,2,0":"CNLOH",
        "no WGD,3,0":"CNLOH & Gain",
        "no WGD,4,0":"CNLOH & Gain",
        "no WGD,5,0":"Amp (LOH)",
        "no WGD,6,0":"Amp (LOH)",
        "no WGD,1,1":"Diploid",
        "no WGD,2,1":"Gain",
        "no WGD,3,1":"Gain",
        "no WGD,4,1":"Amp",
        "no WGD,5,1":"Amp",
        "no WGD,6,1":"Amp",
        "no WGD,2,2":"Tetraploid",
        "no WGD,3,2":"Amp",
        "no WGD,4,2":"Amp",
        "no WGD,5,2":"Amp",
        "no WGD,6,2":"Amp",
        "no WGD,3,3":"Amp (Balanced)",
        "no WGD,4,3":"Amp",
        "no WGD,5,3":"Amp",
        "no WGD,6,3":"Amp",
        "WGD,0,0":"Homdel",
        "WGD,1,0":"Loss Before & After",
        "WGD,2,0":"Loss Before",
        "WGD,3,0":"CNLOH Before & Loss",
        "WGD,4,0":"CNLOH Before",
        "WGD,5,0":"CNLOH Before & Gain",
        "WGD,6,0":"Amp (LOH)",
        "WGD,1,1":"Double Loss After",
        "WGD,2,1":"Loss After",
        "WGD,3,1":"CNLOH After",
        "WGD,4,1":"Loss & Gain",
        "WGD,5,1":"Amp",
        "WGD,6,1":"Amp",
        "WGD,2,2":"Tetraploid",
        "WGD,3,2":"Gain",
        "WGD,4,2":"Amp",
        "WGD,5,2":"Amp",
        "WGD,6,2":"Amp",
        "WGD,3,3":"Amp (Balanced)",
        "WGD,4,3":"Amp",
        "WGD,5,3":"Amp",
        "WGD,6,3":"Amp"
    };

    private static getFacetsCNAData(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined) {
        const sampleId:string = mutation.sampleId;
        const tcn = mutation.totalCopyNumber;
        const lcn = mutation.minorCopyNumber;
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
        const key: string = [wgd, mcn.toString(), lcn.toString()].join(",");
        if (!(key in DiscreteCNAColumnFormatter.facetsCallTable)) {
            facetsCall = "NA";
        } else {
            facetsCall = DiscreteCNAColumnFormatter.facetsCallTable[key];
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

    public static getFacetsCNATooltip(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const sampleId:string = mutation.sampleId;
        const tcn = mutation.totalCopyNumber;
        const lcn = mutation.minorCopyNumber;
        const mcn:number = tcn - lcn;
        const componentBySample = sampleManager.getComponentForSample(sampleId, 1, "");
        let wgd = null;
        let facetsTooltip = null;
        if (sampleIdToClinicalDataMap) {
            let wgdData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_WGD");
            if (wgdData !== undefined && wgdData.length > 0) {
                wgd = wgdData[0].value;
            }
        }
        if (tcn === -1 || lcn === -1 || wgd === null) {
            return (<span>{componentBySample} <b>NA</b></span>);
        } else {
            facetsTooltip = DiscreteCNAColumnFormatter.getFacetsCall(mcn, lcn, wgd).toLowerCase() 
        }
        return (<span>{componentBySample} <b>{facetsTooltip}</b> ({wgd} with total copy number of {tcn.toString(10)} and a minor copy number of {lcn.toString(10)})</span>);
            
    }

    public static renderFunction(data: Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }
        const displayValuesBySample:{[key:string]:JSX.Element} = DiscreteCNAColumnFormatter.getElementsForMutations(data, molecularProfileIdToMolecularProfile, cache, sampleIdToClinicalDataMap, sampleManager);
        const sampleIdsWithElements = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        if (!sampleIdsWithElements) {
            return (<span></span>);
        } else {
            let content = sampleIdsWithElements.map((sampleId:string) => {
                let displayElement = displayValuesBySample[sampleId];
                // if current item is not last samle in list then append '; ' to end of text value
                if (sampleIdsWithElements.indexOf(sampleId) !== (sampleIdsWithElements.length -1)) {
                    return <li>{displayElement}<span style={{fontSize:"small"}}>{";"}</span></li>;
                }
                return <li>{displayElement}</li>;
            }) 
            return (
             <span style={{display:'inline-block', minWidth:100}}>
                 <ul style={{marginBottom:0}} className="list-inline list-unstyled">{ content }</ul>
             </span>
            );
        }
    }
 
    public static getElementsForMutations(data:Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const sampleToElement:{[key: string]: JSX.Element} = {};
        for (const mutation of data) {
            const element = DiscreteCNAColumnFormatter.getElement(mutation, molecularProfileIdToMolecularProfile, cache, sampleIdToClinicalDataMap, sampleManager);
            sampleToElement[mutation.sampleId] = element;
        }
        return sampleToElement;
    }

    public static getElement(mutation:Mutation, molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const cnaData = DiscreteCNAColumnFormatter.getData(mutation, molecularProfileIdToMolecularProfile, cache);
        const facetsCNAData = DiscreteCNAColumnFormatter.getFacetsCNAData(mutation, sampleIdToClinicalDataMap);
        let cnaDataValue = DiscreteCNAColumnFormatter.getTdContents(cnaData);
        let cnaToolTip = DiscreteCNAColumnFormatter.getTooltipContents(cnaData);
        if (facetsCNAData !== "NA") {        
            cnaDataValue = DiscreteCNAColumnFormatter.formatFacetsCNAData(facetsCNAData);
            cnaToolTip = DiscreteCNAColumnFormatter.getFacetsCNATooltip(mutation, sampleIdToClinicalDataMap, sampleManager);
        }
        return (<DefaultTooltip placement="left" 
                    overlay={cnaToolTip} 
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                >
                    {cnaDataValue}
                </DefaultTooltip>
        );
    }

    public static getSortValue(data:Mutation[], molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined) {
        const facetsCNAData = DiscreteCNAColumnFormatter.getFacetsCNAData(data[0], sampleIdToClinicalDataMap);
        if (facetsCNAData!= "NA") {
            return facetsCNAData;
        }
        const altValue = DiscreteCNAColumnFormatter.getTdValue(DiscreteCNAColumnFormatter.getData(data[0], molecularProfileIdToMolecularProfile, cache));
        if (altValue) {
            return DiscreteCNAColumnFormatter.altToFilterString[altValue];
        }
        return null;
    }

    public static filter(data:Mutation, molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, cache:DiscreteCNACache, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, filterString:string):boolean {
        const cnaData = DiscreteCNAColumnFormatter.getData(data, molecularProfileIdToMolecularProfile, cache);
        const facetsCNAData = DiscreteCNAColumnFormatter.getFacetsCNAData(data, sampleIdToClinicalDataMap);
        if (facetsCNAData !== "NA") {
            return facetsCNAData.toLowerCase().indexOf(filterString.toLowerCase()) > -1; 
        } else if (cnaData && cnaData.data) {
            return (!!DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration])
                && (DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration]
                    .indexOf(filterString.toLowerCase()) > -1);
        } else {
            return false;
        }
    }

    protected static getData(mutation:Mutation | undefined, molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile}, discreteCNACache:DiscreteCNACache):DiscreteCNACacheDataType | null {
        if (!mutation || !discreteCNACache.isActive) {
            return null;
        }
        const sampleId = mutation.sampleId;
        const entrezGeneId = mutation.entrezGeneId;
        const molecularProfile = molecularProfileIdToMolecularProfile[mutation.molecularProfileId];
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
