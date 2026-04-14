import { OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp, GermlineIndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';

import { OncoKbCard } from './OncoKbCard';

export interface IOncoKbTooltipProps {
    type: OncoKbCardDataType;
    indicator?: IndicatorQueryResp;
    germlineIndicator?: GermlineIndicatorQueryResp;
    handleFeedbackOpen?: () => void;
    hugoSymbol: string;
    isCancerGene: boolean;
    geneNotExist: boolean;
    usingPublicOncoKbInstance: boolean;
    hasMultipleCancerTypes?: boolean;
}

export const OncoKbTooltip: React.FunctionComponent<IOncoKbTooltipProps> = (
    props: IOncoKbTooltipProps
) => {
    let tooltipContent: JSX.Element = <span />;

    if (props.geneNotExist) {
        tooltipContent = (
            <OncoKbCard
                type={props.type}
                usingPublicOncoKbInstance={props.usingPublicOncoKbInstance}
                hugoSymbol={props.hugoSymbol}
                geneNotExist={props.geneNotExist}
                isCancerGene={props.isCancerGene}
                handleFeedbackOpen={props.handleFeedbackOpen}
                displayHighestLevelInTabTitle={true}
            />
        );
    }

    if (!props.indicator && !props.germlineIndicator) {
        return tooltipContent;
    }

    if (!props.geneNotExist) {
        tooltipContent = (
            <OncoKbCard
                type={props.type}
                usingPublicOncoKbInstance={props.usingPublicOncoKbInstance}
                geneNotExist={props.geneNotExist}
                isCancerGene={props.isCancerGene}
                hugoSymbol={props.hugoSymbol}
                indicator={props.indicator}
                germlineIndicator={props.germlineIndicator}
                handleFeedbackOpen={props.handleFeedbackOpen}
                displayHighestLevelInTabTitle={true}
                hasMultipleCancerTypes={props.hasMultipleCancerTypes}
            />
        );
    }

    return tooltipContent;
};
