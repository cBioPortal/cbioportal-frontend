import * as React from 'react';
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import {germlineMutationRate, somaticMutationRate} from "shared/lib/MutationUtils";
import {MobxPromise} from "mobxpromise";
import {observer} from "mobx-react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";

export interface IMutationRateSummaryProps {
    mutations: Mutation[];
    hugoGeneSymbol: string;
    sampleIds: string[];
    germlineConsentedSampleIds: MobxPromise<string[]>;
}

@observer
export default class MutationRateSummary extends React.Component<IMutationRateSummaryProps, {}>
{
    public somaticMutationFrequency(): JSX.Element
    {
        let rate = 0;

        if (this.props.sampleIds.length > 0) {
            rate = somaticMutationRate(this.props.hugoGeneSymbol, this.props.mutations, this.props.sampleIds);
        }

        return (
            <div data-test="somaticMutationRate">
                <label>Somatic Mutation Frequency:</label>
                {rate.toFixed(1)}%

                <DefaultTooltip
                    placement="right"
                    overlay={(<span>{'Percentage of samples with a somatic mutation in ' + this.props.hugoGeneSymbol}</span>)}
                >
                    <i className='glyphicon glyphicon-info-sign' style={{'marginLeft':5}}></i>
                </DefaultTooltip>
            </div>
        );
    }

    public germlineMutationFrequency(): JSX.Element
    {
        let sampleIds: string[]|undefined;

        if (this.props.germlineConsentedSampleIds.status !== "pending")
        {
            // for germline mutation rate
            // - only use germline constented samples for impact study
            // - in all other cases assume that every sample had germline testing
            //   if > 0 germline mutations are found
            sampleIds = (
                this.props.germlineConsentedSampleIds &&
                this.props.germlineConsentedSampleIds.result &&
                this.props.germlineConsentedSampleIds.result.length > 0
            ) ? this.props.germlineConsentedSampleIds.result : this.props.sampleIds;
        }

        const gmr = sampleIds ? germlineMutationRate(this.props.hugoGeneSymbol, this.props.mutations, sampleIds) : 0;

        return (
            <div data-test='germlineMutationRate' className={(gmr > 0) ? '' : 'invisible' }>
                <label>Germline Mutation Frequency:</label>
                {(gmr > 0) ? `${gmr.toFixed(1)}%` : '--'}
                <DefaultTooltip
                    placement="right"
                    overlay={(<span>{'Percentage of samples with a germline mutation in ' + this.props.hugoGeneSymbol}</span>)}
                >
                    <i className='glyphicon glyphicon-info-sign' style={{'marginLeft':5}}></i>
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
