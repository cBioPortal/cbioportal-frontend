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
        let aValue = GeneColumnFormatter.getValue(a);
        let bValue = GeneColumnFormatter.getValue(b);

        return aValue > bValue;
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return GeneColumnFormatter.getValue(data);
    }

    public static getValue(data:IColumnFormatterData):string
    {
        let value:any;

        if (data.columnData)
        {
            value = data.columnData.hugoGeneSymbol;
        }
        else if (data.rowData)
        {
            value = data.rowData.gene.hugoGeneSymbol;
        }
        else {
            value = ""; // default value (e.g: N/A)?
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
        let value = GeneColumnFormatter.getValue(data);

        return (
            <span>{value}</span>
        );
    }
}
