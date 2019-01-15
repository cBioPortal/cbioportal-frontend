import * as React from 'react';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import SampleManager from "../../sampleManager";
import {floatValueIsNA} from "shared/lib/NumberUtils";

export default class FACETSClonalColumnFormatter {

    public static getDisplayValue(mutations:Mutation[], sampleIds:string[], sampleManager:SampleManager) {
        let values:string[] = [];
        const sampleToValue:{[key: string]: any} = {};
        const sampleToCCF:{[key: string]: number} = {};
        for (const mutation of mutations) {
            sampleToValue[mutation.sampleId] = FACETSClonalColumnFormatter.getClonalValue([mutation]);
        }
        for (const mutation of mutations) {
            sampleToCCF[mutation.sampleId] = mutation.ccfMCopies;
        }
        // exclude samples with invalid count value (undefined || emtpy || lte 0)
        const samplesWithValue = sampleIds.filter(sampleId =>
            sampleToValue[sampleId] && sampleToValue[sampleId].toString().length > 0);

        // single value: just add the actual value only
        let tdValue = null;
        if (!samplesWithValue) {
            return (<span></span>);
        } else if (samplesWithValue.length === 1) {
             tdValue = <li><DefaultTooltip overlay={FACETSClonalColumnFormatter.getTooltip(`${samplesWithValue[0]}`, `${sampleToValue[samplesWithValue[0]]}`, `${sampleToCCF[samplesWithValue[0]]}`, sampleManager)} placement="left" arrowContent={<div className="rc-tooltip-arrow-inner"/>}>{FACETSClonalColumnFormatter.getClonalCircle(sampleToValue[samplesWithValue[0]])}</DefaultTooltip></li>;
        }
        // multiple value: add sample id and value pairs
        else {
             tdValue = samplesWithValue.map((sampleId:string) => {
                return (
                    <li><DefaultTooltip overlay={FACETSClonalColumnFormatter.getTooltip(`${sampleId}`, `${sampleToValue[sampleId]}`, `${sampleToCCF[sampleId]}`, sampleManager)} placement="left" arrowContent={<div className="rc-tooltip-arrow-inner"/>}>{FACETSClonalColumnFormatter.getClonalCircle(`${sampleToValue[sampleId]}`)}</DefaultTooltip></li>
                );
            });
        }
        return (
                <span style={{display:'inline-block', minWidth:100}}>
                    <ul style={{marginBottom:0}} className="list-inline list-unstyled">{ tdValue }</ul>
                </span>
               );
    }

    public static getTooltip(sampleId:string, clonalValue:string, ccfMCopies:string, sampleManager:SampleManager) {
        let clonalColor = "";
        if (clonalValue === "yes") {
            clonalColor = "limegreen";
        } else if  (clonalValue === "no") {
            clonalColor = "dimgrey";
        } else {
            clonalColor = "lightgrey";
        }
        return (
                <div>
                    <table>
                        <tr><td style={{paddingRight:10}}>{sampleManager.getComponentForSample(sampleId, 1, "")}</td><td><strong></strong></td></tr>
                        <tr><td style={{paddingRight:5}}>Clonal</td><td><span style={{color: `${clonalColor}`, fontWeight: "bold"}}>{clonalValue}</span></td></tr>
                        <tr><td style={{paddingRight:5}}>CCF</td><td><strong>{ccfMCopies}</strong></td></tr>
                    </table>
                </div>
            );
    }

    public static getClonalCircle(clonalValue:string) {
        let color:string = "";
        if (clonalValue === "yes") {
            color = "limegreen";
        } else if (clonalValue === "no") {
            color = "dimgrey";
        } else {
            color = "lightgrey";
        }
        return (
                <svg height="10" width="10">
                    <circle cx={5} cy={5} r={5} fill={`${color}`}/>
                </svg>
        );
    }

    public static getCcfMCopiesUpperValue(mutations:Mutation[]):number {
        const ccfMCopiesUpperValue = mutations[0].ccfMCopiesUpper;
        return ccfMCopiesUpperValue;
    }

    public static getCcfMCopiesValue(mutations:Mutation[]):number {
        const ccfMCopiesValue = mutations[0].ccfMCopies;
        return ccfMCopiesValue;
    }

    public static getClonalValue(mutations:Mutation[]):string {
        let textValue:string = "";
        const ccfMCopiesUpperValue = FACETSClonalColumnFormatter.getCcfMCopiesUpperValue(mutations);
        if (floatValueIsNA(ccfMCopiesUpperValue)) {
            textValue = "";
        } else if (ccfMCopiesUpperValue === 1) {
            textValue = "yes";
        } else {
            textValue = "no";
        }
        return textValue;
    }

    public static renderFunction(mutations:Mutation[], sampleIds:string[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }
        return FACETSClonalColumnFormatter.getDisplayValue(mutations, sampleIds, sampleManager);
    }

    public static getClonalDownload(mutations:Mutation[]): string|string[] {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push(FACETSClonalColumnFormatter.getClonalValue([mutation]));
            }
        }
        return result;
    }
}
