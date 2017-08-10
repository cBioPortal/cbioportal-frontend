import * as React from 'react';
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate, somaticMutationRateBySample} from "shared/lib/MutationUtils";

export interface IMutationRateSummaryProps {
    mutations: Mutation[];
    hugoGeneSymbol: string;
    sampleIds: string[];
    patientIdsStatus: "pending" | "error" | "complete";
    patientIds?: string[];
    mskImpactGermlineConsentedPatientIdsStatus: "pending" | "error" | "complete";
    mskImpactGermlineConsentedPatientIds?: string[];
}

export default class MutationRateSummary extends React.Component<IMutationRateSummaryProps, {}>
{
    public somaticMutationFrequency(): JSX.Element
    {
        let rate = 0;

        if (this.props.sampleIds.length > 0) {
            rate = somaticMutationRateBySample(this.props.hugoGeneSymbol, this.props.mutations, this.props.sampleIds);
        }
        else if (this.props.patientIds && this.props.patientIds.length > 0) {
            rate = somaticMutationRate(this.props.hugoGeneSymbol, this.props.mutations, this.props.patientIds);
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
        let patientIds: string[]|undefined;

        if (this.props.patientIdsStatus !== "pending" &&
            this.props.mskImpactGermlineConsentedPatientIdsStatus !== "pending")
        {
            // for germline mutation rate
            // - only use germline constented patients for impact study
            // - in all other cases assume that every patient had germline testing
            //   if > 0 germline mutations are found
            patientIds = (
                this.props.mskImpactGermlineConsentedPatientIds &&
                this.props.mskImpactGermlineConsentedPatientIds.length > 0
            ) ? this.props.mskImpactGermlineConsentedPatientIds : this.props.patientIds;
        }

        const gmr = patientIds ? germlineMutationRate(this.props.hugoGeneSymbol, this.props.mutations, patientIds) : 0;

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
