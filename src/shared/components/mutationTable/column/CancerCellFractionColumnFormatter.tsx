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
export default class CancerCellFractionColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    "CancerCellFraction" text value
     */
    public static getDisplayValue(data:Mutation[]):string {
        return CancerCellFractionColumnFormatter.getCancerCellFractionValue(data);
    }

    public static getCcfMCopiesValue(data:Mutation[]):string {
        let ccfMCopiesValue = "";
        if (data[0].alleleSpecificCopyNumber !== undefined && data[0].alleleSpecificCopyNumber.ccfMCopies !== undefined) {
            ccfMCopiesValue = data[0].alleleSpecificCopyNumber.ccfMCopies.toFixed(2);
        }
        return ccfMCopiesValue;
    }

    public static getCancerCellFractionValue(data:Mutation[]):string {
        const ccfMCopiesValue = CancerCellFractionColumnFormatter.getCcfMCopiesValue(data);
        return ccfMCopiesValue;
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
        const text:string = CancerCellFractionColumnFormatter.getDisplayValue(data);
        let content = <span>{text}</span>;
        return content;
    }
    
    public static getCancerCellFractionDownload(mutations:Mutation[]): string|string[]
    {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push(CancerCellFractionColumnFormatter.getCancerCellFractionValue([mutation]));
            }
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}

