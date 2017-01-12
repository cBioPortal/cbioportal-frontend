import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData}
    from "../../enhancedReactTable/IColumnFormatter";

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
    public static getTextValue(data:IColumnFormatterData):string
    {
        const geneData = GeneColumnFormatter.getData(data);

        if (geneData.hugoGeneSymbol) {
            return geneData.hugoGeneSymbol.toString();
        }
        else {
            return "";
        }
    }

    public static getDisplayValue(data:IColumnFormatterData):string
    {
        // same as text value
        return GeneColumnFormatter.getTextValue(data);
    }

    public static getDataFromRow(rowData:any)
    {
        let value;

        if (rowData) {
            const rowDataArr:Array<any> = [].concat(rowData);
            value = (rowDataArr.length > 0 ? rowDataArr[0].gene : null);
        }
        else {
            value = {};
        }

        return value;
    }

    public static getData(data:IColumnFormatterData)
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

    public static renderFunction(data:IColumnFormatterData)
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
