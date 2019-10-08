import * as React from 'react';
import DefaultTooltip from 'public-lib/components/defaultTooltip/DefaultTooltip';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from "./mutationType.module.scss";
import getCanonicalMutationType from "public-lib/lib/getCanonicalMutationType";
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
export default class ASCNMethodColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    "ASCNMethod" text value
     */
    public static getDisplayValue(data:Mutation[]):string {
        return ASCNMethodColumnFormatter.getASCNMethodValue(data);
    }

    public static getAscnMethodValue(data:Mutation[]):string {
        let ascnMethodValue = "";
        if (data[0].alleleSpecificCopyNumber !== undefined && data[0].alleleSpecificCopyNumber.ascnMethod !== undefined) {
            ascnMethodValue = data[0].alleleSpecificCopyNumber.ascnMethod;
        }
        return ascnMethodValue;
    }

    public static getASCNMethodValue(data:Mutation[]):string {
        const ascnMethodValue = ASCNMethodColumnFormatter.getAscnMethodValue(data);
        return ascnMethodValue;
    }

    public static getTextValue(data:number):string {
        let textValue:string = "";
        if (data) {
            textValue = data.toString();
        }
        return textValue;
    }

    public static renderFunction(data:Mutation[]) {
        // use text for all purposes (display, sort, filter)
        const text:string = ASCNMethodColumnFormatter.getDisplayValue(data);
        let content = <span>{text}</span>;
        return content;
    }
    
    public static getASCNMethodDownload(mutations:Mutation[]): string|string[]
    {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push(ASCNMethodColumnFormatter.getASCNMethodValue([mutation]));
            }
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}

