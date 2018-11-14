import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from "./mutationType.module.scss";
import getCanonicalMutationType from "shared/lib/getCanonicalMutationType";

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
     * @returns {string}    "Clonal" text value
     */
    public static getDisplayValue(data:Mutation[]):string {
        return ClonalColumnFormatter.getClonalValue(data);
    }

    public static getTooltipValue(data:Mutation[]):string {
        const ccfMCopiesValue = ClonalColumnFormatter.getCcfMCopiesValue(data);
        if (ClonalColumnFormatter.missingFacetsData(ccfMCopiesValue)) {
            return "FACETS data not available";
        } 
        return ClonalColumnFormatter.getTextValue(ccfMCopiesValue);
    } 
            
    public static missingFacetsData(value:number):boolean {
        if (value === 1.4e-45) {
            return true;
        }
        return false;
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
        if (ClonalColumnFormatter.missingFacetsData(ccfMCopiesUpperValue)) {
            textValue = "NA";
        } else if (ccfMCopiesUpperValue === 1) {
            textValue = "True";
        } else {
            textValue = "False";
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
        const text:string = ClonalColumnFormatter.getDisplayValue(data);

        // use actual value for tooltip
        const toolTip:string = ClonalColumnFormatter.getTooltipValue(data);

        let content = <span>{text}</span>;

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip.toLowerCase() !== text.toLowerCase()) {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            content = (
                <DefaultTooltip overlay={<span>{toolTip}</span>} placement="left" arrowContent={arrowContent}>
                    {content}
                </DefaultTooltip>
            );
        }
        return content;
    }
}

