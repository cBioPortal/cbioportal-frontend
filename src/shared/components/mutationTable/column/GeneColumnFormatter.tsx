import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../IMutationTableProps";
import {Mutation, Gene} from "shared/api/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter
{
    /**
     * Default text value for a gene is its hugo gene symbol.
     *
     * @param data  column formatter data
     * @returns {string}    hugo gene symbol
     */
    public static getTextValue(data:IColumnFormatterData<MutationTableRowData>):string
    {
        const geneData = GeneColumnFormatter.getData(data);

        if (geneData.hugoGeneSymbol) {
            return geneData.hugoGeneSymbol.toString();
        }
        else {
            return "";
        }
    }

    public static getDisplayValue(data:IColumnFormatterData<MutationTableRowData>):string
    {
        // same as text value
        return GeneColumnFormatter.getTextValue(data);
    }

    public static getDataFromRow(rowData:MutationTableRowData|undefined)
    {
        let value: Gene|null;

        if (rowData) {
            const mutations:Mutation[] = rowData;
            value = (mutations.length > 0 ? mutations[0].gene : null);
        }
        else {
            value = null;
        }

        return value;
    }

    public static getData(data:IColumnFormatterData<MutationTableRowData>)
    {
        let value;

        if (data.columnData) {
            value = data.columnData;
        }
        else {
            value = GeneColumnFormatter.getDataFromRow(data.rowData);
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>)
    {
        // use text as display value
        const text = GeneColumnFormatter.getDisplayValue(data);

        // use value as filter & sort value
        const value = GeneColumnFormatter.getTextValue(data);

        return (
            <Td key={data.name} column={data.name} value={value}>
                <span>{text}</span>
            </Td>
        );
    }
}
