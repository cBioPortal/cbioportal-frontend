import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from "./mutationType.module.scss";
import getCanonicalMutationType from "shared/lib/getCanonicalMutationType";
import {floatValueIsNA} from "shared/lib/NumberUtils";

interface IMutationTypeFormat {
    label?: string;
    longName?: string;
    className: string;
    mainType: string;
    priority?: number;
}

/**
 * @author Avery Wang
 */
export default class ClonalColumnFormatter {
    
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"Clonal" text value
     */
    public static getDisplayValue(data:Mutation[], sampleIds:string[]) {
        let values:string[] = [];
        const sampleToValue:{[key: string]: any} = {};
        for (const mutation of data) {
            sampleToValue[mutation.sampleId] = ClonalColumnFormatter.getClonalValue([mutation]);
        }
        // exclude samples with invalid count value (undefined || emtpy || lte 0)
        const samplesWithValue = sampleIds.filter(sampleId =>
            sampleToValue[sampleId] && sampleToValue[sampleId].toString().length > 0);

        // single value: just add the actual value only
        if (samplesWithValue.length === 1) {
            values = [sampleToValue[samplesWithValue[0]].toString()];
        }
        // multiple value: add sample id and value pairs
        else {
            values = samplesWithValue.map((sampleId:string) => (`${sampleId}: ${sampleToValue[sampleId]}`));
        }
        return values.join("\n");
    }
       
    public static getCcfMCopiesUpperValue(data:Mutation[]):number {
        const ccfMCopiesUpperValue = data[0].ccfMCopiesUpper;
        return ccfMCopiesUpperValue;
    }

    public static getCcfMCopiesValue(data:Mutation[]):number {
        const ccfMCopiesValue = data[0].ccfMCopies;
        return ccfMCopiesValue;
    }

    public static getClonalValue(data:Mutation[]):string {
        let textValue:string = "";
        const ccfMCopiesUpperValue = ClonalColumnFormatter.getCcfMCopiesUpperValue(data);
        if (floatValueIsNA(ccfMCopiesUpperValue)) {
            textValue = "";
        } else if (ccfMCopiesUpperValue === 1) {
            textValue = "yes";
        } else {
            textValue = "no";
        }
        return textValue;
    }

    public static renderFunction(data:Mutation[], sampleIds:string[]) {
        // use text for all purposes (display, sort, filter)
        const text:string = ClonalColumnFormatter.getDisplayValue(data, sampleIds);
        let content = <span>{text}</span>;
        return content;
    }
    
    // can be removed if mouseover is dropped
    public static getTextValue(data:number):string {
        let textValue:string = "";
        if (data) {
            textValue = data.toString();
        }
        return textValue;
    }

    // can be removed if mouseover is dropped
    public static getTooltipValue(data:Mutation[]):string {
        const ccfMCopiesValue = ClonalColumnFormatter.getCcfMCopiesValue(data);
        if (floatValueIsNA(ccfMCopiesValue)) {
            return "FACETS data not available";
        } 
        return "CCF: " + ClonalColumnFormatter.getTextValue(ccfMCopiesValue);
    } 
            
    public static getClonalDownload(mutations:Mutation[]): string|string[]
    {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push(ClonalColumnFormatter.getClonalValue([mutation]));
            }
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}

