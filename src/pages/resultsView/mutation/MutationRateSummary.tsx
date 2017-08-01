import * as React from 'react';
import {observer} from "mobx-react";
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate} from "shared/lib/MutationUtils";

export interface IMutationRateSummaryProps {
    patientIds: string[];
    mutations: Mutation[];
    hugoGeneSymbol: string;
    mskImpactGermlineConsentedPatientIds: string[];
}

export default class MutationRateSummary extends React.Component<IMutationRateSummaryProps, {}>
{
    render() {
        // for germline mutation rate
        // - only use germline constented patients for impact study
        // - in all other cases assume that every patient had germline testing
        //   if > 0 germline mutations are found
        const patientIds = (this.props.mskImpactGermlineConsentedPatientIds.length > 0)?
                                this.props.mskImpactGermlineConsentedPatientIds :
                                this.props.patientIds;
        const gmr = germlineMutationRate(this.props.hugoGeneSymbol,
                                         this.props.mutations,
                                         patientIds)
        const germlineMutationRateElement:JSX.Element|null =
            (gmr > 0)?
            (
                <span style={{paddingRight: 5}}>
                 Germline Mutation Rate:
                     <span style={{paddingLeft:2}} data-test='germlineMutationRate'>
                        {gmr.toFixed(1)}%,
                     </span>
                </span>
            )
            : null;

        return (
            <h4 style={{paddingBottom:8,paddingTop:8}}>
                {this.props.hugoGeneSymbol}:
                     [{germlineMutationRateElement}
                  Somatic Mutation Rate:
                     <span style={{paddingLeft:2}} data-test='somaticMutationRate'>
                     {somaticMutationRate(this.props.hugoGeneSymbol,
                                          this.props.mutations,
                                          this.props.patientIds).toFixed(1)}%]
                     </span>
            </h4>
        );
    }
}
