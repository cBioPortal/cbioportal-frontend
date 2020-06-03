import { ICache } from 'cbioportal-frontend-commons';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';

import { MobxCache } from '../../model/MobxCache';
import OncoKbCard from './OncoKbCard';
import { OncoKbCardDataType } from './OncoKbHelper';

export interface IOncoKbTooltipProps {
    indicator?: IndicatorQueryResp;
    pubMedCache?: MobxCache;
    handleFeedbackOpen?: () => void;
    hugoSymbol: string;
    isCancerGene: boolean;
    geneNotExist: boolean;
    usingPublicOncoKbInstance: boolean;
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class OncoKbTooltip extends React.Component<
    IOncoKbTooltipProps,
    {}
> {
    public get pmidData(): ICache<any> {
        if (this.props.pubMedCache) {
            let mutationEffectPmids =
                this.props.indicator && this.props.indicator.mutationEffect
                    ? this.props.indicator.mutationEffect.citations.pmids.map(
                          pmid => Number(pmid)
                      )
                    : [];
            const refs = (this.props.indicator
                ? _.reduce(
                      this.props.indicator.treatments,
                      (acc, next) => {
                          acc = acc.concat(
                              next.pmids.map(pmid => Number(pmid))
                          );
                          return acc;
                      },
                      [] as number[]
                  )
                : []
            ).concat(mutationEffectPmids);

            for (const ref of refs) {
                this.props.pubMedCache.get(ref);
            }
        }

        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    }

    public render() {
        let tooltipContent: JSX.Element = <span />;

        if (this.props.geneNotExist) {
            tooltipContent = (
                <OncoKbCard
                    type={OncoKbCardDataType.TX}
                    usingPublicOncoKbInstance={
                        this.props.usingPublicOncoKbInstance
                    }
                    hugoSymbol={this.props.hugoSymbol}
                    geneNotExist={this.props.geneNotExist}
                    isCancerGene={this.props.isCancerGene}
                    pmidData={{}}
                    handleFeedbackOpen={this.props.handleFeedbackOpen}
                />
            );
        }

        if (!this.props.indicator) {
            return tooltipContent;
        }

        if (!this.props.geneNotExist) {
            const pmidData: ICache<any> = this.pmidData;
            tooltipContent = (
                <OncoKbCard
                    type={OncoKbCardDataType.TX}
                    usingPublicOncoKbInstance={
                        this.props.usingPublicOncoKbInstance
                    }
                    geneNotExist={this.props.geneNotExist}
                    isCancerGene={this.props.isCancerGene}
                    hugoSymbol={this.props.hugoSymbol}
                    indicator={this.props.indicator}
                    pmidData={pmidData}
                    handleFeedbackOpen={this.props.handleFeedbackOpen}
                />
            );
        }

        return tooltipContent;
    }
}
