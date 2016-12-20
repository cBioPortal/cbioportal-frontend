import * as React from 'react';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatter";
import "./sample.scss";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter implements IColumnFormatter
{
    // make these thresholds customizable if needed...
    public static get MAX_LENGTH():number {return 16;}; // max allowed length of a sample id.
    public static get BUFFER():number {return 2;}; // no need to bother with clipping the text for a few chars.
    public static get SUFFIX():string {return "...";};
    public static get TOOLTIP_CLASS_NAME():string {return "simple-tip";};

    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        let aValue = SampleColumnFormatter.getTextValue(a);
        let bValue = SampleColumnFormatter.getTextValue(b);

        return aValue > bValue;
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return SampleColumnFormatter.getTextValue(data);
    }

    public static getTextValue(data:IColumnFormatterData):string
    {
        let textValue:string = "";
        let dataValue = SampleColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    /**
     * For short sample ids display value is same as the text value,
     * but for long sample id's we truncate the id and display a partial value.
     *
     * @param data  column formatter data
     * @returns {string}    display text value (may be truncated)
     */
    public static getDisplayValue(data:IColumnFormatterData):string
    {
        let text:string = SampleColumnFormatter.getTextValue(data);

        // clip if too long
        if (SampleColumnFormatter.isTooLong(text,
                                            SampleColumnFormatter.MAX_LENGTH,
                                            SampleColumnFormatter.BUFFER))
        {
            text = text.substring(0, SampleColumnFormatter.MAX_LENGTH) + SampleColumnFormatter.SUFFIX;
        }

        return text;
    }

    public static getClassName(sampleId:string):string
    {
        let className:string = "";

        if (SampleColumnFormatter.isTooLong(sampleId,
                                            SampleColumnFormatter.MAX_LENGTH,
                                            SampleColumnFormatter.BUFFER))
        {
            // enable tooltip for long strings
            className = SampleColumnFormatter.TOOLTIP_CLASS_NAME;
        }

        return className;
    }

    public static getToolTip(sampleId:string):string
    {
        return sampleId;
    }

    public static isTooLong(sampleId:string, maxLength:number, buffer:number):boolean
    {
        return sampleId != null && (sampleId.length > maxLength + buffer);
    }

    public static getData(data:IColumnFormatterData)
    {
        let value;

        if (data.columnData) {
            value = data.columnData;
        }
        else if (data.rowData) {
            value = data.rowData.sampleId;
        }
        else {
            value = null;
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData)
    {
        let sampleId:string = SampleColumnFormatter.getTextValue(data);
        let text:string = SampleColumnFormatter.getDisplayValue(data);
        let toolTip:string = SampleColumnFormatter.getToolTip(sampleId);
        let className:string = SampleColumnFormatter.getClassName(sampleId);
        let linkToPatientView:string = "#"; // TODO generate or get it from somewhere else

        data.toString = function() {
            return SampleColumnFormatter.filterValue(data);
        };

        return (
            <Td column={data.name} value={data}>
                <a href={linkToPatientView} target='_blank'>
                    <span alt={toolTip} className={`${className} text-no-wrap`}>{text}</span>
                </a>
            </Td>
        );
    }
}
