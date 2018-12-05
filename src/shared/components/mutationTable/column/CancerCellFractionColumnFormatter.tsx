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
export default class CancerCellFractionColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    "CancerCellFraction" text value
     */
    public static getDisplayValue(data:Mutation[]):string {
        return CancerCellFractionColumnFormatter.getCancerCellFractionValue(data);
    }

    public static getCcfMCopiesValue(data:Mutation[]):number {
        const ccfMCopiesValue = data[0].ccfMCopies;
        return ccfMCopiesValue;
    }

    public static getCancerCellFractionValue(data:Mutation[]):string {
        let textValue:string = "";
        const ccfMCopiesValue = CancerCellFractionColumnFormatter.getCcfMCopiesValue(data);
        if (floatValueIsNA(ccfMCopiesValue)) {
            textValue = "NA";
        } else {
            textValue = ccfMCopiesValue.toFixed(2);
        }
        return textValue;
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
}

