import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatterProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter extends React.Component<IColumnFormatterProps, {}> implements IColumnFormatter
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

    constructor(props:IColumnFormatterProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        let data:IColumnFormatterData = this.props.data;
        let value = GeneColumnFormatter.getDisplayValue(data);

        return (
            <span>{value}</span>
        );
    }
}
