import autobind from 'autobind-decorator';
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
import { AnnotationIcon, AnnotationIconWithTooltip } from './AnnotationIcon';
import { CompactAnnotationIcon } from './CompactAnnotationIcon';
import OncoKbTooltip from './OncoKbTooltip';
import OncoKbFeedback from './OncoKbFeedback';

import './oncokb.scss';
import 'oncokb-styles/dist/oncokb.css';

export interface IOncoKbProps {
    status: 'pending' | 'error' | 'complete';
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
    mergeAnnotationIcons?: boolean;
    pubMedCache?: MobxCache;
    usingPublicOncoKbInstance: boolean;
    isCancerGene: boolean;
    geneNotExist: boolean;
    hugoGeneSymbol: string;
    userEmailAddress?: string;
    disableFeedback?: boolean;
    contentPadding?: number;
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
    const sensitivityLevel =
        indicator.highestSensitiveLevel?.toLowerCase() || 'level NA';
    const resistanceLevel =
        indicator.highestResistanceLevel?.toLowerCase() || 'resistance NA';

    return `${oncogenic}, ${sensitivityLevel}, ${resistanceLevel}`;
}

function findDefaultDataTypeForTooltip(
    usingPublicOncoKbInstance: boolean,
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    if (usingPublicOncoKbInstance || !indicator) {
        return OncoKbCardDataType.BIOLOGICAL;
    }

    // priority is in this order: Tx > Dx > Px > Biological
    if (
        indicator.highestSensitiveLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.TXS)
    ) {
        return OncoKbCardDataType.TXS;
    } else if (
        indicator.highestResistanceLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.TXR)
    ) {
        return OncoKbCardDataType.TXR;
    } else if (
        indicator.highestDiagnosticImplicationLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.DX)
    ) {
        return OncoKbCardDataType.DX;
    } else if (
        indicator.highestPrognosticImplicationLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.PX)
    ) {
        return OncoKbCardDataType.PX;
    }

    return OncoKbCardDataType.BIOLOGICAL;
}

@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}> {
    constructor(props: IOncoKbProps) {
        super(props);
        makeObservable(this);
    }

    @observable showFeedback: boolean = false;
    @observable tooltipDataLoadComplete: boolean = false;

    public render() {
        let oncoKbContent: JSX.Element;

        if (this.props.status === 'error') {
            oncoKbContent = errorIcon('Error fetching OncoKB data');
        } else if (this.props.status === 'pending') {
            oncoKbContent = loaderIcon('pull-left');
        } else {
            oncoKbContent = this.props.mergeAnnotationIcons
                ? this.singleAnnotationIcon()
                : this.multiAnnotationIcon();

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

    private multiAnnotationIcon() {
        return (
            <span className="oncokb-content" style={{ display: 'inline-flex' }}>
                <AnnotationIcon
                    type={OncoKbCardDataType.BIOLOGICAL}
                    tooltipOverlay={this.tooltipContent(
                        OncoKbCardDataType.BIOLOGICAL
                    )}
                    indicator={this.props.indicator}
                    availableDataTypes={this.props.availableDataTypes}
                />
                {this.levelIcons()}
            </span>
        );
    }

    private levelIcons() {
        if (this.props.usingPublicOncoKbInstance) {
            return null;
        }

        if (this.props.indicator) {
            return (
                <>
                    {[
                        OncoKbCardDataType.TXS,
                        OncoKbCardDataType.TXR,
                        OncoKbCardDataType.DX,
                        OncoKbCardDataType.PX,
                    ].map(dataType => (
                        <AnnotationIcon
                            type={dataType}
                            tooltipOverlay={this.tooltipContent(dataType)}
                            indicator={this.props.indicator}
                            availableDataTypes={this.props.availableDataTypes}
                        />
                    ))}
                </>
            );
        } else {
            // workaround: use content padding value to draw an empty icon when there is no indicator data.
            // this is to keep the icon alignment consistent with the rest of the column.
            // ideally we should implement grouped columns to avoid these kind of workarounds
            // (see https://github.com/cBioPortal/cbioportal/issues/8723)
            return <i style={{ paddingRight: this.props.contentPadding }} />;
        }
    }

    private singleAnnotationIcon() {
        return (
            <span className="oncokb-content" style={{ display: 'inline-flex' }}>
                <AnnotationIconWithTooltip
                    tooltipOverlay={this.tooltipContent(
                        findDefaultDataTypeForTooltip(
                            this.props.usingPublicOncoKbInstance,
                            this.props.indicator,
                            this.props.availableDataTypes
                        )
                    )}
                    icon={
                        <CompactAnnotationIcon
                            indicator={this.props.indicator}
                            availableDataTypes={this.props.availableDataTypes}
                            usingPublicOncoKbInstance={
                                this.props.usingPublicOncoKbInstance
                            }
                        />
                    }
                />
            </span>
        );
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
