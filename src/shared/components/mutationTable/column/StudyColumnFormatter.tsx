import * as React from 'react';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {CancerStudy, MolecularProfile, Mutation} from "shared/api/generated/CBioPortalAPI";
import TruncatedText from "../../TruncatedText";
import {getStudySummaryUrl} from "../../../api/urls";

export default class StudyColumnFormatter
{
    private static getStudy(d:Mutation[], molecularProfileIdToMolecularProfile?:{[molecularProfileId:string]:MolecularProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}):CancerStudy|null {
        if (!molecularProfileIdToMolecularProfile || !studyIdToStudy)
            return null;

        const molecularProfileId = d[0].molecularProfileId;
        const geneticProfile = molecularProfileIdToMolecularProfile[molecularProfileId];
        if (!geneticProfile)
            return null;
        const study = studyIdToStudy[geneticProfile.studyId];
        return study || null;
    }
    public static renderFunction(d:Mutation[], molecularProfileIdToMolecularProfile?:{[molecularProfileId:string]:MolecularProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, molecularProfileIdToMolecularProfile, studyIdToStudy);
        if (!study) {
            return <span/>;
        } else {
            return (
                <a href={getStudySummaryUrl(study.studyId)} target="_blank">
                    <TruncatedText
                        text={study.name}
                        tooltip={<div style={{maxWidth: 300}} dangerouslySetInnerHTML={{
                            __html: `${study.name}: ${study.description}`
                        }}/>}
                        maxLength={16}
                    />
                </a>
            );
        }
    }

    public static getTextValue(d:Mutation[], molecularProfileIdToMolecularProfile?:{[molecularProfileId:string]:MolecularProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, molecularProfileIdToMolecularProfile, studyIdToStudy);
        if (!study) {
            return "";
        } else {
            return study.name;
        }
    }

    public static filter(d:Mutation[], filterStringUpper:string, geneticProfileIdToGeneticProfile?:{[geneticProfileId:string]:MolecularProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, geneticProfileIdToGeneticProfile, studyIdToStudy);
        if (!study) {
            return false;
        } else {
            return study.name.toUpperCase().indexOf(filterStringUpper) > -1;
        }
    }
}
