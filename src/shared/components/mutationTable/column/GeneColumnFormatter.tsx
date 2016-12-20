import * as React from 'react';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter implements IColumnFormatter
{
    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        let aValue = GeneColumnFormatter.getTextValue(a);
        let bValue = GeneColumnFormatter.getTextValue(b);

        return aValue > bValue;
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return GeneColumnFormatter.getTextValue(data);
    }

    /**
     * Default text value for a gene is its hugo gene symbol.
     *
     * @param data  column formatter data
     * @returns {string}    hugo gene symbol
     */
    public static getTextValue(data:IColumnFormatterData):string
    {
        let geneData = GeneColumnFormatter.getData(data);

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

    public static getData(data:IColumnFormatterData)
    {
        let value;

        if (data.columnData)
        {
            value = data.columnData;
        }
        else if (data.rowData)
        {
            value = data.rowData.gene;
        }
        else {
            value = {};
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData)
    {
        let value = GeneColumnFormatter.getDisplayValue(data);

        data.toString = function() {
            return GeneColumnFormatter.filterValue(data);
        };

        return (
            <Td column={data.name} value={data}>
                <span>{value}</span>
            </Td>

        );
    }
}
