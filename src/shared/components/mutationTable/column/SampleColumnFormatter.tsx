import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from "./sample.module.scss";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter
{
    // make these thresholds customizable if needed...
    public static get MAX_LENGTH():number {return 16;}; // max allowed length of a sample id.
    public static get BUFFER():number {return 2;}; // no need to bother with clipping the text for a few chars.
    public static get SUFFIX():string {return "...";};

    public static getTextValue(data:Mutation[]):string
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
    public static getDisplayValue(data:Mutation[]):string
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

    public static getData(data:Mutation[])
    {
        if (data.length > 0) {
            return data[0].sampleId;
        } else {
            return null;
        }
    }

    public static renderFunction(data:Mutation[], studyId?: string)
    {
        const sampleId:string = SampleColumnFormatter.getTextValue(data);
        const text:string = SampleColumnFormatter.getDisplayValue(data);
        const toolTip:string = SampleColumnFormatter.getTooltipValue(sampleId);

        let content = <span className={styles['text-no-wrap']}>{text}</span>;

        if (studyId)
        {
            let linkToPatientView:string = `#/patient?sampleId=${sampleId}&studyId=${studyId}`;
            /** 
             * HACK to deal with having mutation mapper on index.do
             * Change it to case.do
             * https://github.com/cBioPortal/cbioportal/issues/2783
             */
            const indexLocation:number = window.location.href.search('index.do');
            if (indexLocation > -1) {
                linkToPatientView = window.location.href.substring(0, indexLocation) + 'case.do' + linkToPatientView;
            }
            // END HACK


            content = (
                <a href={linkToPatientView} target='_blank'>
                    {content}
                </a>
            );
        }

        // update content with tooltip if tooltip has a valid value
        if (toolTip.length > 0)
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

            content = (
                <DefaultTooltip overlay={<span>{toolTip}</span>} placement="rightTop" arrowContent={arrowContent}>
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
