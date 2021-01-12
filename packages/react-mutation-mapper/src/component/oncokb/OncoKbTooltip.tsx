import { ICache } from 'cbioportal-frontend-commons';
import { MobxCache, OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';

import OncoKbCard from './OncoKbCard';

export interface IOncoKbTooltipProps {
    type: OncoKbCardDataType;
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
            let allPmids: string[] = [];

            if (this.props.indicator) {
                if (this.props.indicator.mutationEffect) {
                    allPmids = allPmids.concat(
                        this.props.indicator.mutationEffect.citations.pmids
                    );
                }
                this.props.indicator.treatments.forEach(treatment => {
                    allPmids = allPmids.concat(treatment.pmids);
                });
                this.props.indicator.diagnosticImplications.forEach(
                    implication => {
                        allPmids = allPmids.concat(implication.pmids);
                    }
                );
                this.props.indicator.prognosticImplications.forEach(
                    implication => {
                        allPmids = allPmids.concat(implication.pmids);
                    }
                );
            }
            for (const ref of _.uniq(allPmids).map(pmid => Number(pmid))) {
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
                    type={this.props.type}
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
                    type={this.props.type}
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
