import * as React from 'react';
import {MolecularProfile, Mutation, SampleIdentifier} from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate} from "shared/lib/MutationUtils";
import {MobxPromise} from "mobxpromise";
import {observer} from "mobx-react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";

export interface IMutationRateSummaryProps {
    mutations: Mutation[];
    hugoGeneSymbol: string;
    samples: SampleIdentifier[];
    germlineConsentedSamples: MobxPromise<SampleIdentifier[]>;
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>;
}

@observer
export default class MutationRateSummary extends React.Component<IMutationRateSummaryProps, {}>
{
    public somaticMutationFrequency(): JSX.Element
    {
        let rate = 0;

        if (this.props.samples.length > 0) {
            rate = somaticMutationRate(this.props.hugoGeneSymbol, this.props.mutations, this.props.molecularProfileIdToMolecularProfile.result!, this.props.samples);
        }

        return (
            <div data-test="somaticMutationRate">
                <label>Somatic Mutation Frequency:</label>
                {rate.toFixed(1)}%

                <DefaultTooltip
                    placement="right"
                    overlay={(<span>{'Percentage of samples with a somatic mutation in ' + this.props.hugoGeneSymbol}</span>)}
                >
                    <i className="fa fa-info-circle" style={{'marginLeft':5}}></i>
                </DefaultTooltip>
            </div>
        );
    }

    public germlineMutationFrequency(): JSX.Element
    {
        let samples: SampleIdentifier[]|undefined;

        if (this.props.germlineConsentedSamples.status !== "pending")
        {
            // for germline mutation rate
            // - only use germline constented samples for impact study
            // - in all other cases assume that every sample had germline testing
            //   if > 0 germline mutations are found
            samples = (
                this.props.germlineConsentedSamples &&
                this.props.germlineConsentedSamples.result &&
                this.props.germlineConsentedSamples.result.length > 0
            ) ? this.props.germlineConsentedSamples.result : this.props.samples;
        }

        const gmr = samples ? germlineMutationRate(this.props.hugoGeneSymbol, this.props.mutations, this.props.molecularProfileIdToMolecularProfile.result!, samples) : 0;

        return (
            <div data-test='germlineMutationRate' className={(gmr > 0) ? '' : 'invisible' }>
                <label>Germline Mutation Frequency:</label>
                {(gmr > 0) ? `${gmr.toFixed(1)}%` : '--'}
                <DefaultTooltip
                    placement="right"
                    overlay={(<span>{'Percentage of samples with a germline mutation in ' + this.props.hugoGeneSymbol}</span>)}
                >
                    <i className="fa fa-info-circle" style={{'marginLeft':5}}></i>
                </DefaultTooltip>
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
