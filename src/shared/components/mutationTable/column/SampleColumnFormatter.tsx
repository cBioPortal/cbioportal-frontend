import * as React from 'react';
import Tooltip from 'rc-tooltip';
import {Td} from 'reactable';
import {IColumnFormatterData}
    from "../../enhancedReactTable/IColumnFormatter";
import styles from "./sample.module.scss";
import {MutationTableRowData} from "../IMutationTableProps";
import {Mutation} from "../../../api/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter
{
    // make these thresholds customizable if needed...
    public static get MAX_LENGTH():number {return 16;}; // max allowed length of a sample id.
    public static get BUFFER():number {return 2;}; // no need to bother with clipping the text for a few chars.
    public static get SUFFIX():string {return "...";};

    public static getTextValue(data:IColumnFormatterData<MutationTableRowData>):string
    {
        let textValue:string = "";
        const dataValue = SampleColumnFormatter.getData(data);

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
    public static getDisplayValue(data:IColumnFormatterData<MutationTableRowData>):string
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

    public static getTooltipValue(sampleId:string):string
    {
        let tooltip:string = "";

        if (SampleColumnFormatter.isTooLong(sampleId,
                                            SampleColumnFormatter.MAX_LENGTH,
                                            SampleColumnFormatter.BUFFER))
        {
            // enable tooltip for long strings
            tooltip = sampleId;
        }

        return tooltip;
    }

    public static isTooLong(sampleId:string, maxLength:number, buffer:number):boolean
    {
        return sampleId != null && (sampleId.length > maxLength + buffer);
    }

    public static getData(data:IColumnFormatterData<MutationTableRowData>)
    {
        let value;

        if (data.columnData) {
            value = data.columnData;
        }
        else if (data.rowData) {
            const mutations:Array<Mutation> = new Array<Mutation>().concat(data.rowData);
            value = (mutations.length > 0 ? mutations[0].sampleId : null);
        }
        else {
            value = null;
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>)
    {
        const sampleId:string = SampleColumnFormatter.getTextValue(data);
        const text:string = SampleColumnFormatter.getDisplayValue(data);
        const toolTip:string = SampleColumnFormatter.getTooltipValue(sampleId);
        const linkToPatientView:string = "#"; // TODO generate or get it from somewhere else

        let content = (
            <a href={linkToPatientView} target='_blank'>
                <span className={styles['text-no-wrap']}>{text}</span>
            </a>
        );

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        // update content with tooltip if tooltip has a valid value
        if (toolTip.length > 0)
        {
            content = (
                <Tooltip overlay={toolTip} placement="rightTop" arrowContent={arrowContent}>
                    {content}
                </Tooltip>
            );
        }

        return (
            <Td key={data.name} column={data.name} value={sampleId}>
                {content}
            </Td>
        );
    }
}
