import * as React from 'react';
import {MolecularProfile, Mutation} from "shared/api/generated/CBioPortalAPI";
import TruncatedText from "shared/components/TruncatedText";
import {getPatientViewUrl, getSampleViewUrl} from "../../../api/urls";

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

    public static renderFunction(data:Mutation[], molecularProfileIdToMolecularProfile?: {[molecularProfileId:string]:MolecularProfile})
    {
        const sampleId:string = SampleColumnFormatter.getTextValue(data);
        let content = (
            <TruncatedText
                text={sampleId}
                tooltip={<div style={{maxWidth: 300}}>{sampleId}</div>}
                maxLength={16}
            />
        );

        if (molecularProfileIdToMolecularProfile)
        {
            const profile = molecularProfileIdToMolecularProfile[data[0].molecularProfileId];
            const studyId = profile && profile.studyId;
            if (studyId) {
                content = (
                    <a href={getSampleViewUrl(studyId, sampleId)} target='_blank'>
                        {content}
                    </a>
                );
            }
        }

        return content;
    }
}
