import * as React from "react";
import * as _ from "lodash";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import TableCellStatusIndicator from "shared/components/TableCellStatus";
import {TableCellStatus} from "shared/components/TableCellStatus";
import TruncatedText from "shared/components/TruncatedText";

export default class CancerTypeColumnFormatter {

    public static getData(d: Mutation[], geneticProfileIdToStudyId?:{[geneticProfileId:string]:string},
                          studyToSampleToTumorType?: {[studyId:string]:{[sampleId: string]: string}}): string|null
    {
        let data: string|null = null;

        if (studyToSampleToTumorType && geneticProfileIdToStudyId) {
            const studyId = geneticProfileIdToStudyId[d[0].geneticProfileId];
            data = studyToSampleToTumorType[studyId][d[0].sampleId] || null;
        }

        return data;
    }

    public static sortBy(d: Mutation[], geneticProfileIdToStudyId?:{[geneticProfileId:string]:string},
                         studyToSampleToTumorType?: {[studyId:string]:{[sampleId: string]: string}}): string|null
    {
        const data = CancerTypeColumnFormatter.getData(d, geneticProfileIdToStudyId, studyToSampleToTumorType);

        if (data) {
            return data;
        }
        else {
            return null;
        }
    }

    public static filter(d: Mutation[],
                         filterStringUpper: string,
                         geneticProfileIdToStudyId?:{[geneticProfileId:string]:string},
                         studyToSampleToTumorType?: {[studyId:string]:{[sampleId: string]: string}}): boolean
    {
        const data = CancerTypeColumnFormatter.getData(d, geneticProfileIdToStudyId, studyToSampleToTumorType);

        return (
            data !== null &&
            data.toUpperCase().indexOf(filterStringUpper) > -1
        );
    }

    public static isVisible(mutations?: Mutation[][], geneticProfileIdToStudyId?:{[geneticProfileId:string]:string},
                            studyToSampleToTumorType?: {[studyId:string]:{[sampleId: string]: string}}): boolean
    {
        if (!mutations || !studyToSampleToTumorType) {
            return false;
        }

        const tumorTypeToSampleId: {[tumorType: string]: string} = {};

        mutations.forEach((d: Mutation[]) => {
            const tumorType = CancerTypeColumnFormatter.getData(d, geneticProfileIdToStudyId, studyToSampleToTumorType);

            if (tumorType) {
                tumorTypeToSampleId[tumorType] = d[0].sampleId;
            }
        });

        // only visible if number of distinct tumor type values is greater than 1
        return _.keys(tumorTypeToSampleId).length > 1;
    }

    public static render(d: Mutation[],
                         geneticProfileIdToStudyId?:{[geneticProfileId:string]:string},
                         studyToSampleToTumorType?: {[studyId:string]:{[sampleId: string]: string}})
    {
        const data = CancerTypeColumnFormatter.getData(d, geneticProfileIdToStudyId, studyToSampleToTumorType);

        if (data) {
            return (
                <TruncatedText
                    text={data || ""}
                    tooltip={<div style={{maxWidth: 300}}>{data}</div>}
                />
            );
        }
        else {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt="Cancer type not available for this sample."
                />
            );
        }
    }
}
