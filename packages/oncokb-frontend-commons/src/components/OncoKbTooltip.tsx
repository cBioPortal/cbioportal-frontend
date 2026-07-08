import { OncoKbCardDataType } from 'cbioportal-utils';
import * as React from 'react';

import { OncoKbCard } from './OncoKbCard';
import { IndicatorQueryResp } from '../model/OncoKB';

export interface IOncoKbTooltipProps {
    type: OncoKbCardDataType;
    indicator?: IndicatorQueryResp;
    handleFeedbackOpen?: () => void;
    hugoSymbol: string;
    isCancerGene: boolean;
    geneNotExist: boolean;
    usingPublicOncoKbInstance: boolean;
    isGermline?: boolean;
    cDnaChange?: string;
    proteinChange?: string;
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
                isGermline={props.isGermline}
                cDnaChange={props.cDnaChange}
                proteinChange={props.proteinChange}
                handleFeedbackOpen={props.handleFeedbackOpen}
                displayHighestLevelInTabTitle={true}
            />
        );
    }

    if (!props.indicator) {
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
                isGermline={props.isGermline}
                cDnaChange={props.cDnaChange}
                proteinChange={props.proteinChange}
                handleFeedbackOpen={props.handleFeedbackOpen}
                displayHighestLevelInTabTitle={true}
                hasMultipleCancerTypes={props.hasMultipleCancerTypes}
            />
        );
    }

    return tooltipContent;
};
