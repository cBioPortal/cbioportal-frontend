import * as React from 'react';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {CancerStudy, GeneticProfile, Mutation} from "shared/api/generated/CBioPortalAPI";
import TruncatedText from "../../TruncatedText";
import {getStudySummaryUrl} from "../../../api/urls";

export default class StudyColumnFormatter
{
    private static getStudy(d:Mutation[], geneticProfileIdToGeneticProfile?:{[geneticProfileId:string]:GeneticProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}):CancerStudy|null {
        if (!geneticProfileIdToGeneticProfile || !studyIdToStudy)
            return null;

        const geneticProfileId = d[0].geneticProfileId;
        const geneticProfile = geneticProfileIdToGeneticProfile[geneticProfileId];
        if (!geneticProfile)
            return null;
        const study = studyIdToStudy[geneticProfile.studyId];
        return study || null;
    }
    public static renderFunction(d:Mutation[], geneticProfileIdToGeneticProfile?:{[geneticProfileId:string]:GeneticProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, geneticProfileIdToGeneticProfile, studyIdToStudy);
        if (!study) {
            return <span/>;
        } else {
            return (
                <a href={getStudySummaryUrl(study.studyId)} target="_blank">
                    <TruncatedText
                        text={study.name}
                        tooltip={<div style={{maxWidth: 300}}>{`${study.name}: ${study.description}`}</div>}
                        maxLength={16}
                    />
                </a>
            );
        }
    }

    public static getTextValue(d:Mutation[], geneticProfileIdToGeneticProfile?:{[geneticProfileId:string]:GeneticProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, geneticProfileIdToGeneticProfile, studyIdToStudy);
        if (!study) {
            return "";
        } else {
            return study.name;
        }
    }

    public static filter(d:Mutation[], filterStringUpper:string, geneticProfileIdToGeneticProfile?:{[geneticProfileId:string]:GeneticProfile}, studyIdToStudy?:{[studyId:string]:CancerStudy}) {
        const study = StudyColumnFormatter.getStudy(d, geneticProfileIdToGeneticProfile, studyIdToStudy);
        if (!study) {
            return false;
        } else {
            return study.name.toUpperCase().indexOf(filterStringUpper) > -1;
        }
    }
}