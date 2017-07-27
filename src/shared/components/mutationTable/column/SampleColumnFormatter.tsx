import * as React from 'react';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import TruncatedText from "shared/components/TruncatedText";

/**
 * @author Selcuk Onur Sumer
 */
export default class SampleColumnFormatter
{
    public static getTextValue(data:Mutation[]):string
    {
        return SampleColumnFormatter.getData(data) || "";
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
        let content = (
            <TruncatedText
                text={sampleId}
                tooltip={<div style={{maxWidth: 300}}>{sampleId}</div>}
                maxLength={16}
            />
        );

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

        return content;
    }
}
