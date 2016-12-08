import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatterProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter extends React.Component<IColumnFormatterProps, {}>
{
    constructor(props:IColumnFormatterProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        let data:IColumnFormatterData = this.props.data;

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

        return (
            <span>{value}</span>
        );
    }
}
