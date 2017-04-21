import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";

/**
 * Designed to customize allele count column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class AlleleCountColumnFormatter
{
    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any)
    {
        const sampleOrder = columnProps.sampleOrder;
        const dataField = columnProps.dataField;

        let ret = "";

        if (data.rowData)
        {
            const mutations:Array<Mutation> = data.rowData;
            const sampleToValue:{[key: string]: any} = {};

            for (let rowDatum of mutations) {
                sampleToValue[rowDatum.sampleId] = (rowDatum as any)[dataField]; // TODO this is not type safe...
            }

            const samplesWithValue = sampleOrder.filter((sampleId:string) => sampleToValue.hasOwnProperty(sampleId));

            if (samplesWithValue.length === 1) {
                ret = sampleToValue[samplesWithValue[0]];
            }
            else {
                ret = samplesWithValue.map((sampleId:string) => (`${sampleId}: ${sampleToValue[sampleId]}`)).join("\n");
            }
        }

        return (<Td key={data.name} column={data.name} value={data}>{ret}</Td>);
    }
}
