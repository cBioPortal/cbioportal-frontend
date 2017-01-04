import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData, IColumnFormatter}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatterProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter extends React.Component<IColumnFormatterProps, {}> implements IColumnFormatter
{
    // make these thresholds customizable if needed...
    public static get MAX_LENGTH():number {return 16;}; // max allowed length of a sample id.
    public static get BUFFER():number {return 2;}; // no need to bother with clipping the text for a few chars.
    public static get SUFFIX():string {return "...";};
    public static get TOOLTIP_STYLE():string {return "simple-tip";};

    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        let aValue = SampleColumnFormatter.getValue(a);
        let bValue = SampleColumnFormatter.getValue(b);

        return aValue > bValue;
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return SampleColumnFormatter.getValue(data);
    }

    public static getText(sampleId:string):string
    {
        let text:string = sampleId;

        // clip if too long
        if (SampleColumnFormatter.isTooLong(sampleId,
                                            SampleColumnFormatter.MAX_LENGTH,
                                            SampleColumnFormatter.BUFFER))
        {
            text = text.substring(0, SampleColumnFormatter.MAX_LENGTH) + SampleColumnFormatter.SUFFIX;
        }

        return text;
    }

    public static getStyleClass(sampleId:string):string
    {
        let style:string = "";

        if (SampleColumnFormatter.isTooLong(sampleId,
                                            SampleColumnFormatter.MAX_LENGTH,
                                            SampleColumnFormatter.BUFFER))
        {
            // enable tooltip for long strings
            style = SampleColumnFormatter.TOOLTIP_STYLE;
        }

        return style;
    }

    public static getToolTip(sampleId:string):string
    {
        return sampleId;
    }

    public static isTooLong(sampleId:string, maxLength:number, buffer:number):boolean
    {
        return sampleId != null && (sampleId.length > maxLength + buffer);
    }

    public static getValue(data:IColumnFormatterData):string
    {
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
        let sampleId:string = SampleColumnFormatter.getValue(data);
        let text:string = SampleColumnFormatter.getText(sampleId);
        let toolTip:string = SampleColumnFormatter.getToolTip(sampleId);
        let styleClass:string = SampleColumnFormatter.getStyleClass(sampleId);
        let linkToPatientView:string = "#"; // TODO generate or get it from somewhere else

        return (
            <a href={linkToPatientView} target='_blank'>
                <span alt={toolTip} class={styleClass}>{text}</span>
            </a>
        );
    }
}
