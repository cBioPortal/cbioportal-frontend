import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";

/**
 * Designed to customize allele count column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class AlleleCountColumnFormatter
{
    public static getValues(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        const sampleOrder = columnProps.sampleOrder;
        const dataField = columnProps.dataField;

        let values:string[] = [];

        if (data.rowData)
        {
            const mutations:Mutation[] = data.rowData;
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
        }

        return values;
    }

    public static getTextValue(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        return AlleleCountColumnFormatter.getValues(data, columnProps).join(";");
    }

    public static getDisplayValue(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        return AlleleCountColumnFormatter.getValues(data, columnProps).join("\n");
    }

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        return (
            <Td key={data.name} column={data.name} value={data}>
                {AlleleCountColumnFormatter.getDisplayValue(data, columnProps)}
            </Td>
        );
    }
}
