import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatterProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter extends React.Component<IColumnFormatterProps, {}>
{
    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData)
    {
        let aValue = GeneColumnFormatter.getValue(a);
        let bValue = GeneColumnFormatter.getValue(b);

        return aValue > bValue;
    }

    public static filterFunction(contents:IColumnFormatterData, filter:string)
    {
        let value = GeneColumnFormatter.getValue(contents);

        return value.toLowerCase().indexOf(filter.toLowerCase()) > -1;
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
