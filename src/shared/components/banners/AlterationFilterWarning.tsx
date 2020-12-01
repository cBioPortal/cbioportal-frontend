import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../../../pages/resultsView/ResultsViewPageStore';
import { computed } from 'mobx';
import { MakeMobxView } from '../MobxView';
import classnames from 'classnames';

export interface IAlterationFilterWarningProps {
    store: ResultsViewPageStore;
    isUnaffected?: boolean;
    mutationsTabModeSettings?: {
        // if set, then we show in "mutations tab mode" - different text, different source of exclude state, and toggleable exclude state
        excludeVUS: boolean;
        excludeGermline: boolean;
        toggleExcludeVUS: () => void;
        toggleExcludeGermline: () => void;
        hugoGeneSymbol: string;
    };
}

function getVusDescription(
    types: { mutation: boolean; cna: boolean },
    plural: boolean
) {
    const descriptions = [];
    if (types.mutation) {
        descriptions.push(`mutation${plural ? 's' : ''}`);
    }
    if (types.cna) {
        descriptions.push(`copy number alteration${plural ? 's' : ''}`);
    }
    return `${descriptions.join(' and ')} of unknown significance`;
}

@observer
export default class AlterationFilterWarning extends React.Component<
    IAlterationFilterWarningProps,
    {}
> {
    @computed get excludeVUS() {
        if (this.props.mutationsTabModeSettings) {
            return this.props.mutationsTabModeSettings.excludeVUS;
        } else {
            return !this.props.store.driverAnnotationSettings.includeVUS;
        }
    }

    @computed get excludeGermline() {
        if (this.props.mutationsTabModeSettings) {
            return this.props.mutationsTabModeSettings.excludeGermline;
        } else {
            return !this.props.store.includeGermlineMutations;
        }
    }

    @computed get vusToggleable() {
        return (
            this.props.mutationsTabModeSettings &&
            !this.props.store.driverAnnotationSettings.includeVUS
        );
    }

    @computed get germlineToggleable() {
        return (
            this.props.mutationsTabModeSettings &&
            !this.props.store.includeGermlineMutations
        );
    }

    readonly vusWarning = MakeMobxView({
        await: () => {
            if (this.props.mutationsTabModeSettings) {
                return [this.props.store.mutationsReportByGene];
            } else {
                return [
                    this.props.store.oqlFilteredMutationsReport,
                    this.props.store.oqlFilteredMolecularDataReport,
                ];
            }
        },
        render: () => {
            let vusCount = 0;
            const vusTypes = {
                mutation: false,
                cna: false,
            };
            if (this.props.mutationsTabModeSettings) {
                const report = this.props.store.mutationsReportByGene.result![
                    this.props.mutationsTabModeSettings.hugoGeneSymbol
                ];
                vusCount = report.vus.length + report.vusAndGermline.length;
                if (vusCount > 0) {
                    vusTypes.mutation = true;
                }
            } else {
                const mutationReport = this.props.store
                    .oqlFilteredMutationsReport.result!;
                const mutationVusCount =
                    mutationReport.vus.length +
                    mutationReport.vusAndGermline.length;
                const cnaVusCount = this.props.store
                    .oqlFilteredMolecularDataReport.result!.vus.length;
                vusCount = mutationVusCount + cnaVusCount;
                if (mutationVusCount > 0) {
                    vusTypes.mutation = true;
                }
                if (cnaVusCount > 0) {
                    vusTypes.cna = true;
                }
            }

            if (vusCount > 0) {
                const is = vusCount === 1 ? 'is' : 'are';
                const does = vusCount === 1 ? 'does' : 'do';
                const anAlteration =
                    vusCount === 1 ? 'an alteration' : 'alterations';
                if (this.props.isUnaffected && this.excludeVUS) {
                    return (
                        <div className="alert alert-unaffected">
                            <i
                                className="fa fa-md fa-info-circle"
                                style={{
                                    verticalAlign: 'middle !important',
                                    marginRight: 6,
                                    marginBottom: 1,
                                }}
                            />
                            {`${vusCount} ${getVusDescription(
                                vusTypes,
                                vusCount !== 1
                            )} ${is} included in analysis.`}
                        </div>
                    );
                } else if (this.excludeVUS || this.vusToggleable) {
                    return (
                        <div className="alert alert-info">
                            <img
                                src={require('../../../rootImages/funnel.svg')}
                                style={{
                                    marginRight: 6,
                                    width: 15,
                                    marginTop: -2,
                                }}
                            />
                            {this.excludeVUS
                                ? `${vusCount} ${getVusDescription(
                                      vusTypes,
                                      vusCount !== 1
                                  )} ${
                                      this.props.mutationsTabModeSettings
                                          ? `${is} hidden below.`
                                          : `${does} not count as ${anAlteration} for this analysis.`
                                  }`
                                : `${vusCount} ${getVusDescription(
                                      vusTypes,
                                      vusCount !== 1
                                  )} ${is} ${
                                      this.props.mutationsTabModeSettings
                                          ? 'shown below.'
                                          : 'included in analysis.'
                                  }`}
                            {this.vusToggleable && (
                                <button
                                    onClick={
                                        this.props.mutationsTabModeSettings!
                                            .toggleExcludeVUS
                                    }
                                    className="btn btn-default btn-xs"
                                    style={{ marginLeft: 5 }}
                                >
                                    {this.excludeVUS
                                        ? this.props.mutationsTabModeSettings
                                            ? 'Show'
                                            : 'Include'
                                        : this.props.mutationsTabModeSettings
                                        ? 'Hide'
                                        : 'Exclude'}
                                </button>
                            )}
                        </div>
                    );
                }
            } else {
                return null;
            }
        },
    });

    readonly germlineWarning = MakeMobxView({
        await: () => {
            if (this.props.mutationsTabModeSettings) {
                return [this.props.store.mutationsReportByGene];
            } else {
                return [this.props.store.oqlFilteredMutationsReport];
            }
        },
        render: () => {
            let report;
            if (this.props.mutationsTabModeSettings) {
                report = this.props.store.mutationsReportByGene.result![
                    this.props.mutationsTabModeSettings.hugoGeneSymbol
                ];
            } else {
                report = this.props.store.oqlFilteredMutationsReport.result!;
            }

            const germlineCount =
                report.germline.length + report.vusAndGermline.length;

            if (germlineCount > 0) {
                const is = germlineCount === 1 ? 'is' : 'are';
                const does = germlineCount === 1 ? 'does' : 'do';
                const anAlteration =
                    germlineCount === 1 ? 'an alteration' : 'alterations';
                if (this.props.isUnaffected && this.excludeGermline) {
                    return (
                        <div className="alert alert-unaffected">
                            <i
                                className="fa fa-md fa-info-circle"
                                style={{
                                    verticalAlign: 'middle !important',
                                    marginRight: 6,
                                    marginBottom: 1,
                                }}
                            />
                            {`${germlineCount} germline mutations ${is} included in analysis.`}
                        </div>
                    );
                } else if (this.excludeGermline || this.germlineToggleable) {
                    return (
                        <div className="alert alert-info">
                            <img
                                src={require('../../../rootImages/funnel.svg')}
                                style={{
                                    marginRight: 6,
                                    width: 15,
                                    marginTop: -2,
                                }}
                            />
                            {this.excludeGermline
                                ? `${germlineCount} germline mutations ${
                                      this.props.mutationsTabModeSettings
                                          ? `${is} hidden below.`
                                          : `${does} not count as ${anAlteration} for this analysis.`
                                  }`
                                : `${germlineCount} germline mutations ${is} ${
                                      this.props.mutationsTabModeSettings
                                          ? 'shown below.'
                                          : 'included in analysis.'
                                  }`}
                            {this.germlineToggleable && (
                                <button
                                    onClick={
                                        this.props.mutationsTabModeSettings!
                                            .toggleExcludeGermline
                                    }
                                    className="btn btn-default btn-xs"
                                    style={{ marginLeft: 5 }}
                                >
                                    {this.excludeGermline
                                        ? this.props.mutationsTabModeSettings
                                            ? 'Show'
                                            : 'Include'
                                        : this.props.mutationsTabModeSettings
                                        ? 'Hide'
                                        : 'Exclude'}
                                </button>
                            )}
                        </div>
                    );
                }
            } else {
                return null;
            }
        },
    });

    render() {
        return (
            <>
                {this.vusWarning.component}
                {this.germlineWarning.component}
            </>
        );
    }
}
