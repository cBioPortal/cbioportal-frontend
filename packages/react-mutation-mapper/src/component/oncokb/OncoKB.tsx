import autobind from 'autobind-decorator';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { MobxCache, OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

import {
    calcDiagnosticLevelScore,
    calcOncogenicScore,
    calcPrognosticLevelScore,
    calcResistanceLevelScore,
    calcSensitivityLevelScore,
} from '../../util/OncoKbUtils';
import { errorIcon, loaderIcon } from '../StatusHelpers';
import OncoKbTooltip from './OncoKbTooltip';
import OncoKbFeedback from './OncoKbFeedback';

import annotationStyles from '../column/annotation.module.scss';
import './oncokb.scss';
import 'oncokb-styles/dist/oncokb.css';
import { AnnotationIcon } from './AnnotationIcon';

export interface IOncoKbProps {
    status: 'pending' | 'error' | 'complete';
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
    pubMedCache?: MobxCache;
    usingPublicOncoKbInstance: boolean;
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
        values[3] = calcDiagnosticLevelScore(
            indicator.highestDiagnosticImplicationLevel
        );
        values[4] = calcPrognosticLevelScore(
            indicator.highestPrognosticImplicationLevel
        );
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

@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
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
                <>
                    <AnnotationIcon
                        type={OncoKbCardDataType.BIOLOGICAL}
                        tooltipOverlay={this.tooltipContent(
                            OncoKbCardDataType.BIOLOGICAL
                        )}
                        indicator={this.props.indicator}
                        availableDataTypes={this.props.availableDataTypes}
                    />
                    {!this.props.usingPublicOncoKbInstance &&
                        this.props.indicator && (
                            <>
                                {[
                                    OncoKbCardDataType.TXS,
                                    OncoKbCardDataType.TXR,
                                    OncoKbCardDataType.DX,
                                    OncoKbCardDataType.PX,
                                ].map(dataType => (
                                    <AnnotationIcon
                                        type={dataType}
                                        tooltipOverlay={this.tooltipContent(
                                            dataType
                                        )}
                                        indicator={this.props.indicator}
                                        availableDataTypes={
                                            this.props.availableDataTypes
                                        }
                                    />
                                ))}
                            </>
                        )}
                </>
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
            }
        }

        return oncoKbContent;
    }

    @autobind
    private tooltipContent(type: OncoKbCardDataType): JSX.Element {
        return (
            <OncoKbTooltip
                type={type}
                usingPublicOncoKbInstance={this.props.usingPublicOncoKbInstance}
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
