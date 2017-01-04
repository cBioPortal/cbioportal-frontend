import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatter";

/**
 * Designed to customize allele count column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class AlleleCountColumnFormatter
{
    public static renderFunction(data:IColumnFormatterData, columnProps:any)
    {
        const sampleOrder = columnProps.sampleOrder;
        const dataField = columnProps.dataField;

        let ret = "";

        if (data.rowData)
        {
            const rowDataArr:Array<any> = [].concat(data.rowData);
            const sampleToValue:{[key: string]: any} = {};

            for (let rowDatum of rowDataArr) {
                sampleToValue[rowDatum.sampleId] = rowDatum[dataField];
            }

            const samplesWithValue = sampleOrder.filter(sampleId=>sampleToValue.hasOwnProperty(sampleId));

            if (samplesWithValue.length === 1) {
                ret = sampleToValue[samplesWithValue[0]];
            }
            else {
                ret = samplesWithValue.map(sampleId=>(`${sampleId}: ${sampleToValue[sampleId]}`)).join("\n");
            }
        }

        return (<Td column={data.name} value={data}>{ret}</Td>);

    }
}
