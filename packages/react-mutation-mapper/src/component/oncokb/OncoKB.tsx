import autobind from 'autobind-decorator';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { MobxCache } from '../../model/MobxCache';
import {
    annotationIconClassNames,
    calcOncogenicScore,
    calcResistanceLevelScore,
    calcSensitivityLevelScore,
} from '../../util/OncoKbUtils';
import { errorIcon, loaderIcon } from '../StatusHelpers';
import OncoKbTooltip from './OncoKbTooltip';
import OncoKbFeedback from './OncoKbFeedback';

import annotationStyles from '../column/annotation.module.scss';
import './oncokb.scss';
import 'oncokb-styles/dist/oncokb.css';

export interface IOncoKbProps {
    status: 'pending' | 'error' | 'complete';
    indicator?: IndicatorQueryResp;
    pubMedCache?: MobxCache;
    isCancerGene: boolean;
    geneNotExist: boolean;
    hugoGeneSymbol: string;
    userEmailAddress?: string;
    disableFeedback?: boolean;
}

export function sortValue(
    indicator?: IndicatorQueryResp | undefined | null
): number[] {
    const values: number[] = [0, 0, 0];

    if (indicator) {
        values[0] = calcOncogenicScore(indicator.oncogenic);
        values[1] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[2] = calcResistanceLevelScore(indicator.highestResistanceLevel);
    }

    return values;
}

export function download(
    indicator?: IndicatorQueryResp | undefined | null
): string {
    if (!indicator) {
        return 'NA';
    }

    const oncogenic = indicator.oncogenic ? indicator.oncogenic : 'Unknown';
    const level = indicator.highestSensitiveLevel
        ? indicator.highestSensitiveLevel.toLowerCase()
        : 'level NA';

    return `${oncogenic}, ${level}`;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}> {
    @observable showFeedback: boolean = false;
    @observable tooltipDataLoadComplete: boolean = false;

    public render() {
        let oncoKbContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item']}`} />
        );

        if (this.props.status === 'error') {
            oncoKbContent = errorIcon('Error fetching OncoKB data');
        } else if (this.props.status === 'pending') {
            oncoKbContent = loaderIcon('pull-left');
        } else {
            oncoKbContent = (
                <span className={`${annotationStyles['annotation-item']}`}>
                    <i
                        className={annotationIconClassNames(
                            this.props.indicator
                        )}
                        data-test="oncogenic-icon-image"
                        data-test2={this.props.hugoGeneSymbol}
                    />
                </span>
            );
            if (!this.props.disableFeedback && this.showFeedback) {
                oncoKbContent = (
                    <span>
                        {oncoKbContent}
                        <OncoKbFeedback
                            userEmailAddress={this.props.userEmailAddress}
                            hugoSymbol={this.props.hugoGeneSymbol}
                            alteration={
                                this.props.indicator
                                    ? this.props.indicator.query.alteration
                                    : undefined
                            }
                            showFeedback={this.showFeedback}
                            handleFeedbackClose={this.handleFeedbackClose}
                        />
                    </span>
                );
            } else {
                oncoKbContent = (
                    <DefaultTooltip
                        overlayClassName="oncokb-tooltip"
                        overlay={this.tooltipContent}
                        placement="right"
                        trigger={['hover', 'focus']}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={true}
                    >
                        {oncoKbContent}
                    </DefaultTooltip>
                );
            }
        }

        return oncoKbContent;
    }

    @autobind
    private tooltipContent(): JSX.Element {
        return (
            <OncoKbTooltip
                hugoSymbol={this.props.hugoGeneSymbol}
                geneNotExist={this.props.geneNotExist}
                isCancerGene={this.props.isCancerGene}
                indicator={this.props.indicator || undefined}
                pubMedCache={this.props.pubMedCache}
                handleFeedbackOpen={
                    this.props.disableFeedback
                        ? undefined
                        : this.handleFeedbackOpen
                }
            />
        );
    }

    @autobind
    private handleFeedbackOpen(): void {
        this.showFeedback = true;
    }

    @autobind
    private handleFeedbackClose(): void {
        this.showFeedback = false;
    }
}
