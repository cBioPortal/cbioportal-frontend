import * as React from 'react';
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import 'rc-tooltip/assets/bootstrap_white.css';
import {Mutation, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "public-lib/components/TableCellStatus";
import SampleManager from "../../sampleManager";

export default class PatientASCNCopyNumberColumnFormatter {

    private static ascnCallTable:{[key:string]:string} = {
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

    private static hasRequiredAscnData(mutation:Mutation):boolean {
        if (mutation.alleleSpecificCopyNumber === undefined || 
            mutation.alleleSpecificCopyNumber.totalCopyNumber === undefined || 
            mutation.alleleSpecificCopyNumber.minorCopyNumber === undefined ||
            mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber == undefined) {
            return false;
        }
        return true;
    }

    // gets value displayed in table cell - "NA" if missing attributes needed for calculation
    private static getASCNCopyNumberData(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined) {
        if (!PatientASCNCopyNumberColumnFormatter.hasRequiredAscnData(mutation)) {
            return "NA";
        }
        return mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber;
    }

    public static getASCNCopyNumberTooltip(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const sampleId:string = mutation.sampleId;
        const componentBySample = sampleManager.getComponentForSample(sampleId, 1, "");
        let wgd = null;
        if (sampleIdToClinicalDataMap) {
            let wgdData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_WGD");
            if (wgdData !== undefined && wgdData.length > 0) {
                wgd = wgdData[0].value;
            }
        }
        if (!PatientASCNCopyNumberColumnFormatter.hasRequiredAscnData(mutation) || wgd === null) {
            return (<span>{componentBySample} <b>NA</b></span>);
        }
        const tcn = mutation.alleleSpecificCopyNumber.totalCopyNumber;
        const lcn = mutation.alleleSpecificCopyNumber.minorCopyNumber;
        const mcn:number = tcn - lcn;
        let ascnTooltip = PatientASCNCopyNumberColumnFormatter.getASCNCall(mcn, lcn, wgd).toLowerCase()
        return (<span>{componentBySample} <b>{ascnTooltip}</b> ({wgd} with total copy number of {tcn.toString(10)} and a minor copy number of {lcn.toString(10)})</span>);
    }

    // gets the FACETES call (e.g tetraploid, amp, cnloh)
    private static getASCNCall(mcn:number, lcn:number, wgd:string) {
        let ascnCall = null;
        const key: string = [wgd, mcn.toString(), lcn.toString()].join(",");
        if (!(key in PatientASCNCopyNumberColumnFormatter.ascnCallTable)) {
            ascnCall = "NA";
        } else {
            ascnCall = PatientASCNCopyNumberColumnFormatter.ascnCallTable[key];
        }
        return ascnCall;
    }

    public static renderFunction(data: Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleIds:string[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }
        const displayValuesBySample:{[key:string]:JSX.Element} = PatientASCNCopyNumberColumnFormatter.getElementsForMutations(data, sampleIdToClinicalDataMap, sampleManager);
        const sampleIdsWithElements = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        if (!sampleIdsWithElements) {
            return (<span></span>);
        } else {
            // map to sampleIds instead of sampleIdsWithElements so that each icon will line up
            // positionally (e.g col 1 will always be sample 1, col 2 will always be sample 2
            // even if sample 1 doesn't have an icon)
            let content = sampleIds.map((sampleId:string) => {
                let displayElement = undefined;
                if (displayValuesBySample[sampleId] === undefined) {
                    displayElement = <svg width='18' height='20' className='case-label-header'></svg>
                } else {
                    displayElement = displayValuesBySample[sampleId];
                }
                // if current item is not last samle in list, seperate withs space
                if (sampleIdsWithElements.indexOf(sampleId) !== (sampleIdsWithElements.length -1)) {
                    return <li>{displayElement}<span style={{fontSize:"small"}}>{""}</span></li>;
                }
                return <li>{displayElement}</li>;
            })
            return (
             <span style={{display:'inline-block', minWidth:100, position:'relative'}}>
                 <ul style={{marginBottom:0}} className="list-inline list-unstyled">{ content }</ul>
             </span>
            );
        }
    }

    public static getElementsForMutations(data:Mutation[], sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const sampleToElement:{[key: string]: JSX.Element} = {};
        for (const mutation of data) {
            const element = PatientASCNCopyNumberColumnFormatter.getElement(mutation, sampleIdToClinicalDataMap, sampleManager);
            sampleToElement[mutation.sampleId] = element;
        }
        return sampleToElement;
    }

    public static getElement(mutation:Mutation, sampleIdToClinicalDataMap: {[key: string]:ClinicalData[]}|undefined, sampleManager:SampleManager) {
        const sampleId:string = mutation.sampleId;
        let wgd = null;
        if (sampleIdToClinicalDataMap) {
            const wgdData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_WGD");
            if (wgdData !== undefined && wgdData.length > 0) {
                wgd = wgdData[0].value;
            }
        }
        const ascnCopyNumberData = PatientASCNCopyNumberColumnFormatter.getASCNCopyNumberData(mutation, sampleIdToClinicalDataMap);
        let cnaDataValue = null;
        if (ascnCopyNumberData === "NA") {
            cnaDataValue = PatientASCNCopyNumberColumnFormatter.formatASCNCopyNumberData(ascnCopyNumberData, "NA", wgd);
            return cnaDataValue
        } else {
            cnaDataValue = PatientASCNCopyNumberColumnFormatter.formatASCNCopyNumberData(ascnCopyNumberData.toString(), mutation.alleleSpecificCopyNumber.totalCopyNumber, wgd);
        }
        const cnaToolTip = PatientASCNCopyNumberColumnFormatter.getASCNCopyNumberTooltip(mutation, sampleIdToClinicalDataMap, sampleManager);
        return (<DefaultTooltip placement="left"
                    overlay={cnaToolTip}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                >
                    {cnaDataValue}
                </DefaultTooltip>
        );
    }

    // returns an element (rounded rectangle with tcn inside - coloring based on FACETS CopyNumber number equivalent)
    public static formatASCNCopyNumberData(ascnCopyNumberData:string, tcn:string|number, wgd:null|string) {
        let color = "";
        let textcolor = "white"
        let opacity = 100
        if (ascnCopyNumberData === "2") {
            color = "red";
        } else if (ascnCopyNumberData === "1") {
            color = "#e15b5b";
        } else if (ascnCopyNumberData === "0") {
            color = "#BCBCBC"
        } else if (ascnCopyNumberData === "-1") {
            color = "#2a5eea";
        } else if (ascnCopyNumberData === "-2") {
            color = "blue";
        } else {
            textcolor = "black"
            opacity = 0
            tcn = "NA"
        }
        return PatientASCNCopyNumberColumnFormatter.getASCNCopyNumberIcon(tcn.toString(), color, opacity, wgd, textcolor);
    }

    public static getASCNCopyNumberIcon(cnaNumber:string, color:string, opacity:number, wgd:null|string, textcolor:string) {
      let size = 9;
      let cnaTextValue = cnaNumber;
      let fillColor = color;
      let wgdStringSVG = null;

      if (cnaNumber == "NA") {
        cnaTextValue = ""
      }

      if (wgd === "WGD" && cnaNumber !== "NA") {
        wgdStringSVG = <svg>
                          <text x='9' y='5' dominantBaseline='middle' fontWeight='bold' textAnchor='middle' fontSize='7' fill='black'>WGD</text>
                       </svg>
      }
      let ascnCopyNumberIconRectangle = <rect width='12' height='12' rx='15%' ry='15%' fill={fillColor} opacity={opacity}/>

      return (
          <svg width='18' height='20' className='case-label-header'>
              {wgdStringSVG}
              <g transform="translate(3,8)">
                {ascnCopyNumberIconRectangle}
                <svg>
                  <text x='6' y='7' dominantBaseline='middle' textAnchor='middle' fontSize={size} fill={textcolor}>{cnaTextValue}</text>
                </svg>
              </g>
          </svg>
      );
    }
}
