import * as React from 'react';
import {observer} from "mobx-react";
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate} from "shared/lib/MutationUtils";
import classnames from 'classnames';

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
                                         patientIds);

        return (
            <div>
                <h4>{this.props.hugoGeneSymbol}</h4>

                <div data-test="somaticMutationRate">
                <label>Somatic Mutation Frequency:</label>&nbsp;
                {somaticMutationRate(this.props.hugoGeneSymbol,
                              this.props.mutations,
                              this.props.patientIds).toFixed(1)}%
                </div>


                <div data-test='germlineMutationRate' className={(gmr > 0) ? '' : 'invisible' }>
                    <label>Germline Mutation Frequency:</label>&nbsp;
                    {(gmr > 0) ? `${gmr.toFixed(1)}%` : '--'}
                </div>

            </div>
        );
    }
}
