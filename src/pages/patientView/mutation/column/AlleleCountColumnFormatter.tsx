import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";

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
            <div>
                {AlleleCountColumnFormatter.getDisplayValue(data, sampleOrder, dataField)}
            </div>
        );
    }
}
