import * as React from 'react';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import generalStyles from "./styles.module.scss";

/**
 * Designed to customize allele count column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class AlleleCountColumnFormatter
{
    public static getValues(mutations:Mutation[], sampleOrder:string[], dataField:string)
    {
        let values:string[] = [];

        const sampleToValue:{[key: string]: any} = {};

        for (const rowDatum of mutations) {
            sampleToValue[rowDatum.sampleId] = (rowDatum as any)[dataField]; // TODO this is not type safe...
        }

        const samplesWithValue = sampleOrder.filter((sampleId:string) => sampleToValue.hasOwnProperty(sampleId));

        if (samplesWithValue.length === 1) {
            values = [sampleToValue[samplesWithValue[0]]];
        }
        else {
            values = samplesWithValue.map((sampleId:string) => (`${sampleId}: ${sampleToValue[sampleId]}`));
        }

        return values;
    }

    public static getTextValue(data:Mutation[], sampleOrder:string[], dataField:string)
    {
        return AlleleCountColumnFormatter.getValues(data, sampleOrder, dataField).join(";");
    }

    public static getDisplayValue(data:Mutation[], sampleOrder:string[], dataField:string)
    {
        return AlleleCountColumnFormatter.getValues(data, sampleOrder, dataField).join("\n");
    }

    public static renderFunction(data:Mutation[], sampleOrder:string[], dataField:string)
    {
        return (
            <div className={generalStyles["integer-data"]}>
                {AlleleCountColumnFormatter.getDisplayValue(data, sampleOrder, dataField)}
            </div>
        );
    }
    
    public static getReads(mutations:Mutation[], dataField:string): string|string[]
    {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push((mutation as any)[dataField]);
            }
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}
