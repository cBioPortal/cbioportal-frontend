import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MolecularProfile, Mutation, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";

export default class FACETSCNAColumnFormatter {

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

    private static facetsCNATable:{[key:string]:string} = {
        "no WGD,0,0":"-2",
        "no WGD,1,0":"-1",
        "no WGD,2,0":"-1",
        "no WGD,3,0":"1",
        "no WGD,4,0":"1",
        "no WGD,5,0":"2",
        "no WGD,6,0":"2",
        "no WGD,1,1":"0",
        "no WGD,2,1":"1",
        "no WGD,3,1":"1",
        "no WGD,4,1":"2",
        "no WGD,5,1":"2",
        "no WGD,6,1":"2",
        "no WGD,2,2":"1",
        "no WGD,3,2":"2",
        "no WGD,4,2":"2",
        "no WGD,5,2":"2",
        "no WGD,6,2":"2",
        "no WGD,3,3":"2",
        "no WGD,4,3":"2",
        "no WGD,5,3":"2",
        "no WGD,6,3":"2",
        "WGD,0,0":"-2",
        "WGD,1,0":"-1",
        "WGD,2,0":"-1",
        "WGD,3,0":"-1",
        "WGD,4,0":"-1",
        "WGD,5,0":"1",
        "WGD,6,0":"2",
        "WGD,1,1":"-1",
        "WGD,2,1":"-1",
        "WGD,3,1":"-1",
        "WGD,4,1":"1",
        "WGD,5,1":"2",
        "WGD,6,1":"2",
        "WGD,2,2":"0",
        "WGD,3,2":"1",
        "WGD,4,2":"2",
        "WGD,5,2":"2",
        "WGD,6,2":"2",
        "WGD,3,3":"2",
        "WGD,4,3":"2",
        "WGD,5,3":"2",
        "WGD,6,3":"2"	
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
        return FACETSCNAColumnFormatter.getFacetsCNA(mcn, lcn, wgd);
    }

    public static getFacetsCNATooltip(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined) {
        const sampleId:string = mutation.sampleId;
        const tcn = mutation.totalCopyNumber;
        const lcn = mutation.minorCopyNumber;
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
            facetsTooltip = FACETSCNAColumnFormatter.getFacetsCall(mcn, lcn, wgd).toLowerCase() 
        }
        return (<span><b>{facetsTooltip}</b> ({wgd} with total copy number of {tcn.toString(10)} and a minor copy number of {lcn.toString(10)})</span>);
    }

    // gets the FACETES call (e.g tetraploid, amp, cnloh)
    private static getFacetsCall(mcn:number, lcn:number, wgd:string) {
        let facetsCall = null;
        const key: string = [wgd, mcn.toString(), lcn.toString()].join(",");
        if (!(key in FACETSCNAColumnFormatter.facetsCallTable)) {
            facetsCall = "NA";
        } else {
            facetsCall = FACETSCNAColumnFormatter.facetsCallTable[key];
        }
        return facetsCall;
    }

    // gets the FACETS generated copy number (e.g -1, 0, 1)
    private static getFacetsCNA(mcn:number, lcn:number, wgd:string) {
        let facetsCNA = null;
        const key: string = [wgd, mcn.toString(), lcn.toString()].join(",");
        if (!(key in FACETSCNAColumnFormatter.facetsCNATable)) {
            facetsCNA = "NA";
        } else {
            facetsCNA = FACETSCNAColumnFormatter.facetsCNATable[key];
        }
        return facetsCNA;
    }   
   
    public static renderFunction(data: Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[]) {
        const displayValuesBySample:{[key:string]:JSX.Element} = FACETSCNAColumnFormatter.getElementsForMutations(data, sampleIdToClinicalDataMap);
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

    public static getSortValue(data:Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[]) {
        const displayValuesBySample:{[key: string]: string} = FACETSCNAColumnFormatter.getAllTotalCopyNumberForMutation(data, sampleIdToClinicalDataMap, sampleIds);
        const sampleIdsWithValues = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        const displayValuesAsString = sampleIdsWithValues.map((sampleId:string) => {
            return displayValuesBySample[sampleId];
        })
        return displayValuesAsString.join(";");
    } 

    public static getAllTotalCopyNumberForMutation(data:Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[]) {
        const sampleToCNA:{[key: string]: string} = {};
        for (const mutation of data) {
            const facetsCNAData = FACETSCNAColumnFormatter.getFacetsCNAData(mutation, sampleIdToClinicalDataMap);
            if (facetsCNAData !== "NA") {
                sampleToCNA[mutation.sampleId] = mutation.totalCopyNumber.toString();
            } else {
                sampleToCNA[mutation.sampleId] = "NA";
            }
        }
        return sampleToCNA;
    }          

    public static filter(data:Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[], filterString:string):boolean {
        const displayValuesBySample:{[key: string]: string} = FACETSCNAColumnFormatter.getAllTotalCopyNumberForMutation(data, sampleIdToClinicalDataMap, sampleIds);
        const sampleIdsWithValues = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        const displayValuesAsString = sampleIdsWithValues.map((sampleId:string) => {
            return displayValuesBySample[sampleId];
        })
        return displayValuesAsString.join(";").toLowerCase().indexOf(filterString.toLowerCase()) > -1;
    }

    // map sample id to an element (square with tcn inside) 
    public static getElementsForMutations(data:Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined) {
        const sampleToElement:{[key: string]: JSX.Element} = {};
        for (const mutation of data) {
            const element = FACETSCNAColumnFormatter.getElement(mutation, sampleIdToClinicalDataMap);
            sampleToElement[mutation.sampleId] = element;
        }
        return sampleToElement;
    }

    public static getElement(mutation:Mutation, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined) {
        const facetsCNAData = FACETSCNAColumnFormatter.getFacetsCNAData(mutation, sampleIdToClinicalDataMap);
        let cnaDataValue = null;
        if (facetsCNAData === "NA") {
            cnaDataValue = FACETSCNAColumnFormatter.formatFacetsCNAData(facetsCNAData, "NA");
        } else {
            cnaDataValue = FACETSCNAColumnFormatter.formatFacetsCNAData(facetsCNAData, mutation.totalCopyNumber);
        }
        const cnaToolTip = FACETSCNAColumnFormatter.getFacetsCNATooltip(mutation, sampleIdToClinicalDataMap);
        return (<DefaultTooltip placement="left" 
                    overlay={cnaToolTip} 
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                >
                    {cnaDataValue}
                </DefaultTooltip>
        );
    }
    
    // returns an element (rounded rectangle with tcn inside - coloring based on FACETS CNA number equivalent)
    public static formatFacetsCNAData(facetsCNAData:string, tcn:string|number) {
        let color = "";
        if (facetsCNAData === "2") {
            color = "red";
        } else if (facetsCNAData === "1") {
            color = "#e15b5b";
        } else if (facetsCNAData === "0") {
            color = "black"
        } else if (facetsCNAData === "-1") {
            color = "#2a5eea";
        } else if (facetsCNAData === "-2") {
            color = "blue";
        } else { 
            color = "#7a7a7a";
        }
        return FACETSCNAColumnFormatter.getFacetsCNAIcon(tcn.toString(), color);
    }

    public static getFacetsCNAIcon(cnaNumber:string, color:string) {
        let size = 9;
        if (cnaNumber === "NA") {
            size = 8;
        }
        return (
            <svg width='13' height='13' className='case-label-header'>
                <g transform='translate(1,1)'>
                    <rect width='12' height='12' rx='15%' ry='15%' fill={color} />
                    <text x='6' y='9' textAnchor='middle' fontSize={size} fill='white'>{cnaNumber}</text>
                </g>
            </svg>
        );  
    }   
}
