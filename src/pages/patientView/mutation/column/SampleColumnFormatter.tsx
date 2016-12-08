import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatterProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter extends React.Component<IColumnFormatterProps, {}>
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

        if (data.columnData) {
            value = data.columnData;
        }
        else if (data.rowData) {
            value = data.rowData.sampleId;
        }
        else {
            value = ""; // default value (e.g: N/A)?
        }

        return (
            <span>{value}</span>
        );
    }
}
