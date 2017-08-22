import * as React from 'react';
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate, somaticMutationRateBySample} from "shared/lib/MutationUtils";
import _ from "lodash";
import {hasSampleOrPatient} from "../../../shared/lib/StoreUtils";

export interface IMutationRateSummaryProps {
    mutations: Mutation[];
    hugoGeneSymbol: string;
    geneticProfileIdToStudyId:{[geneticProfileId:string]:string};
    studyToSampleIds: {[studyId:string]:{[sampleId:string]:boolean}};
    patientIdsStatus: "pending" | "error" | "complete";
    studyToPatientIds?: {[studyId:string]:{[patientId:string]:boolean}};
    mskImpactGermlineConsentedPatientIdsStatus: "pending" | "error" | "complete";
    studyToMskImpactGermlineConsentedPatientIds?: {[studyId:string]:{[patientId:string]:boolean}};
}

export default class MutationRateSummary extends React.Component<IMutationRateSummaryProps, {}>
{
    public somaticMutationFrequency(): JSX.Element
    {
        let rate = 0;

        if (hasSampleOrPatient(this.props.studyToSampleIds)) {
            rate = somaticMutationRateBySample(this.props.hugoGeneSymbol, this.props.mutations,
                this.props.geneticProfileIdToStudyId, this.props.studyToSampleIds);
        }
        else if (this.props.studyToPatientIds && hasSampleOrPatient(this.props.studyToPatientIds)) {
            rate = somaticMutationRate(this.props.hugoGeneSymbol, this.props.mutations,
                this.props.geneticProfileIdToStudyId, this.props.studyToPatientIds);
        }

        return (
            <div data-test="somaticMutationRate">
                <label>Somatic Mutation Frequency:</label>
                {rate.toFixed(1)}%
            </div>
        );
    }

    public germlineMutationFrequency(): JSX.Element
    {
        let patientIds: {[studyId:string]:{[patientId:string]:boolean}}|undefined;

        if (this.props.patientIdsStatus !== "pending" &&
            this.props.mskImpactGermlineConsentedPatientIdsStatus !== "pending")
        {
            // for germline mutation rate
            // - only use germline constented patients for impact study
            // - in all other cases assume that every patient had germline testing
            //   if > 0 germline mutations are found
            patientIds = (
                this.props.studyToMskImpactGermlineConsentedPatientIds &&
                hasSampleOrPatient(this.props.studyToMskImpactGermlineConsentedPatientIds)
            ) ? this.props.studyToMskImpactGermlineConsentedPatientIds : this.props.studyToPatientIds;
        }

        const gmr = patientIds ? germlineMutationRate(this.props.hugoGeneSymbol, this.props.mutations,
                            this.props.geneticProfileIdToStudyId, patientIds) : 0;

        return (
            <div data-test='germlineMutationRate' className={(gmr > 0) ? '' : 'invisible' }>
                <label>Germline Mutation Frequency:</label>
                {(gmr > 0) ? `${gmr.toFixed(1)}%` : '--'}
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.somaticMutationFrequency()}
                {this.germlineMutationFrequency()}
            </div>
        );
    }
}
