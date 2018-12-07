import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {Mutation, ClinicalData} from "shared/api/generated/CBioPortalAPI";
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
export default class MutantCopiesColumnFormatter
{
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):string
    {
        return MutantCopiesColumnFormatter.getMutantCopiesOverTotalCopies(data, sampleIdToClinicalDataMap);
    }

    public static invalidTotalCopyNumber(value:number):boolean
    { 
        if (value === -1 || value === null) {
            return true;
        }
        return false;
    }

    public static getVariantAlleleFraction(data:Mutation[]):number
    {
        let variantAlleleFraction = 0;
        if (data.length > 0) {
            const refreads:number = data[0].tumorRefCount;
            const altreads:number = data[0].tumorAltCount;
            variantAlleleFraction = altreads/(refreads + altreads);
        }
        return variantAlleleFraction;
    }

    public static getMutantCopies(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):number
    {
        const sampleId:string = data[0].sampleId;
        const variantAlleleFraction:number = MutantCopiesColumnFormatter.getVariantAlleleFraction(data);
        const totalCopyNumber = data[0].totalCopyNumber;
        let purity = null;
        if (sampleIdToClinicalDataMap) {
            const purityData = sampleIdToClinicalDataMap[sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_PURITY");
            if (purityData !== undefined && purityData.length > 0) {
                purity = Number(purityData[0].value);
            }
        }
        if (purity === null) {
            return -1;
        }
        const mutantCopies:number = Math.min(totalCopyNumber, Math.round((variantAlleleFraction/purity)*totalCopyNumber))
        return mutantCopies;
    }
 
    public static getMutantCopiesOverTotalCopies(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):string
    {
        let textValue:string = "";
        const totalCopyNumber:number = data[0].totalCopyNumber;
        const mutantCopies:number = MutantCopiesColumnFormatter.getMutantCopies(data, sampleIdToClinicalDataMap)
        if (mutantCopies === -1 || MutantCopiesColumnFormatter.invalidTotalCopyNumber(totalCopyNumber)) {
            textValue = "";
        } else {
            textValue = mutantCopies.toString() + "/" + totalCopyNumber.toString();
        }
        return textValue;
    }
        
    public static getMutantCopiesToolTip(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):string
    {
        let textValue:string = "";
        const totalCopyNumber:number = data[0].totalCopyNumber;
        const mutantCopies:number = MutantCopiesColumnFormatter.getMutantCopies(data, sampleIdToClinicalDataMap);
        if (mutantCopies === -1 || MutantCopiesColumnFormatter.invalidTotalCopyNumber(totalCopyNumber)) {
            textValue = "Missing data values, mutant copies can not be computed";
        } else {
            textValue = mutantCopies.toString(10) + " out of " + totalCopyNumber.toString(10) + " copies of this gene are mutated";
        }
        return textValue;
    }
    
    public static renderFunction(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined)
    {
        // use text for all purposes (display, sort, filter)
        const text:string = MutantCopiesColumnFormatter.getDisplayValue(data, sampleIdToClinicalDataMap);
        // use actual value for tooltip
        const toolTip:string = MutantCopiesColumnFormatter.getMutantCopiesToolTip(data, sampleIdToClinicalDataMap);
        let content = <span>{text}</span>;
        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
        content = (
            <DefaultTooltip overlay={<span>{toolTip}</span>} placement="left" arrowContent={arrowContent}>
                {content}
            </DefaultTooltip>
        );
        return content;
    }
}

