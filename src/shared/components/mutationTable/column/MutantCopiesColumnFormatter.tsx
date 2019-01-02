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
export default class MutantCopiesColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleIds:string[]):{[key: string]: string} {
        const sampleToValue:{[key: string]: string} = {};
        for (const mutation of data) {
            const value:string = MutantCopiesColumnFormatter.getMutantCopiesOverTotalCopies(mutation, sampleIdToClinicalDataMap);
            if (value.toString().length > 0) {
                sampleToValue[mutation.sampleId] = value;
            }
        }
        return sampleToValue;
    }

    public static getDisplayValueAsString(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleIds:string[]):string {
        const displayValuesBySample:{[key: string]: string} = MutantCopiesColumnFormatter.getDisplayValue(data, sampleIdToClinicalDataMap, sampleIds);
        const sampleIdsWithValues = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        const displayValuesAsString = sampleIdsWithValues.map((sampleId:string) => {
            return displayValuesBySample[sampleId];
        })
        return displayValuesAsString.join("; ");
    }

    public static invalidTotalCopyNumber(value:number):boolean {
        if (value === -1 || value === null) {
            return true;
        }
        return false;
    }

    public static getVariantAlleleFraction(mutation:Mutation):number {
        let variantAlleleFraction = 0;
        if (mutation.tumorRefCount !== null && mutation.tumorAltCount !== null) {
            variantAlleleFraction = mutation.tumorAltCount/(mutation.tumorRefCount + mutation.tumorAltCount);
        }
        return variantAlleleFraction;
    }

    public static getMutantCopies(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):number {
        const sampleId:string = mutation.sampleId;
        const variantAlleleFraction:number = MutantCopiesColumnFormatter.getVariantAlleleFraction(mutation);
        const totalCopyNumber = mutation.totalCopyNumber;
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

    public static getMutantCopiesOverTotalCopies(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):string {
        let textValue:string = "";
        const totalCopyNumber:number = mutation.totalCopyNumber;
        const mutantCopies:number = MutantCopiesColumnFormatter.getMutantCopies(mutation, sampleIdToClinicalDataMap)
        if (mutantCopies === -1 || MutantCopiesColumnFormatter.invalidTotalCopyNumber(totalCopyNumber)) {
            textValue = "";
        } else {
            textValue = mutantCopies.toString() + "/" + totalCopyNumber.toString();
        }
        return textValue;
    }

    /**
     * Returns map of sample id to tooltip text value.
     * @param data
     * @param sampleIdToClinicalDataMap
     * @param sampleIdsWithValues
     */
    public static getMutantCopiesToolTip(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleIdsWithValues:string[]):{[key: string]: string} {
        const sampleToToolTip:{[key: string]: string} = {};
        for (const mutation of data) {
            sampleToToolTip[mutation.sampleId] = MutantCopiesColumnFormatter.constructToolTipString(mutation, sampleIdToClinicalDataMap);
        }
        return sampleToToolTip;
    }

    /**
     * Constructs tooltip string value.
     * @param mutation
     * @param sampleIdToClinicalDataMap
     */
    public static constructToolTipString(mutation:Mutation, sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined):string {
        let textValue:string = "";
        const totalCopyNumber:number = mutation.totalCopyNumber;
        const mutantCopies:number = MutantCopiesColumnFormatter.getMutantCopies(mutation, sampleIdToClinicalDataMap);
        if (mutantCopies === -1 || MutantCopiesColumnFormatter.invalidTotalCopyNumber(totalCopyNumber)) {
            textValue = "Missing data values, mutant copies can not be computed";
        } else {
            textValue = mutantCopies.toString(10) + " out of " + totalCopyNumber.toString(10) + " copies of this gene are mutated";
        }
        return textValue;
    }

    public static renderFunction(data:Mutation[], sampleIdToClinicalDataMap:{[sampleId:string]:ClinicalData[]}|undefined, sampleIds:string[]) {
        // get display text values map (sampleid -> value), list of sample ids with values in 'displayValuesBySample', and calculate tooltip by sample
        const displayValuesBySample:{[key: string]: string} = MutantCopiesColumnFormatter.getDisplayValue(data, sampleIdToClinicalDataMap, sampleIds);
        const sampleIdsWithValues = sampleIds.filter(sampleId => displayValuesBySample[sampleId]);
        const toolTipBySample:{[key: string]: string} = MutantCopiesColumnFormatter.getMutantCopiesToolTip(data, sampleIdToClinicalDataMap, sampleIdsWithValues);
        if (!sampleIdsWithValues) {
            return (<span></span>);
        } else {
            let content = sampleIdsWithValues.map((sampleId:string) => {
                let textValue = displayValuesBySample[sampleId];
                // if current item is not last samle in list then append '; ' to end of text value
                if (sampleIdsWithValues.indexOf(sampleId) !== (sampleIdsWithValues.length - 1)) {
                    textValue = textValue + "; ";
                }
                return <li><DefaultTooltip overlay={<span>{toolTipBySample[sampleId]}</span>} placement='left' arrowContent={<div className="rc-tooltip-arrow-inner"/>}><span>{textValue}</span></DefaultTooltip></li>
            })
            return (
             <span style={{display:'inline-block', minWidth:100}}>
                 <ul style={{marginBottom:0}} className="list-inline list-unstyled">{ content }</ul>
             </span>
            );
       }
    }
}
