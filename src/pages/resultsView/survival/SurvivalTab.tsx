import * as React from 'react';
import SurvivalChart from './SurvivalChart';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import {
    ALTERED_GROUP_VALUE,
    getSurvivalChartDataByAlteredStatus,
    UNALTERED_GROUP_VALUE,
} from './SurvivalUtil';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import _ from 'lodash';
import SurvivalDescriptionTable from './SurvivalDescriptionTable';
import NotUsingGenePanelWarning from '../NotUsingGenePanelWarning';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';

export interface ISurvivalTabProps {
    store: ResultsViewPageStore;
}

const analysisGroups = [
    {
        value: ALTERED_GROUP_VALUE,
        color: 'red',
        name: 'Cases with Alteration(s) in Query Gene(s)',
    },
    {
        value: UNALTERED_GROUP_VALUE,
        color: 'blue',
        name: 'Cases without Alteration(s) in Query Gene(s)',
    },
];

@observer
export default class SurvivalTab extends React.Component<
    ISurvivalTabProps,
    {}
> {
    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText =
        'Disease/Progression-free Kaplan-Meier Estimate';
    private multipleDescriptionWarningMessageWithoutTooltip =
        'The survival data on patients from different cohorts may have been defined by ';
    private multipleDescriptionWarningMessageWithTooltip =
        'different criteria.';
    private differentDescriptionExistMessage =
        'Different descriptions of survival data were used for different studies.';

    readonly overallPatientSurvivalData = remoteData({
        await: () => [
            this.props.store.overallAlteredPatientSurvivals,
            this.props.store.overallUnalteredPatientSurvivals,
        ],
        invoke: () => {
            return Promise.resolve(
                getSurvivalChartDataByAlteredStatus(
                    this.props.store.overallAlteredPatientSurvivals.result!,
                    this.props.store.overallUnalteredPatientSurvivals.result!
                )
            );
        },
    });

    readonly diseaseFreePatientSurvivalData = remoteData({
        await: () => [
            this.props.store.diseaseFreeAlteredPatientSurvivals,
            this.props.store.diseaseFreeUnalteredPatientSurvivals,
        ],
        invoke: () => {
            return Promise.resolve(
                getSurvivalChartDataByAlteredStatus(
                    this.props.store.diseaseFreeAlteredPatientSurvivals.result!,
                    this.props.store.diseaseFreeUnalteredPatientSurvivals
                        .result!
                )
            );
        },
    });

    public render() {
        if (
            this.overallPatientSurvivalData.isPending ||
            this.diseaseFreePatientSurvivalData.isPending ||
            this.props.store.overallSurvivalDescriptions.isPending ||
            this.props.store.diseaseFreeSurvivalDescriptions.isPending
        ) {
            return (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            );
        }

        let content: any = [];
        let overallNotAvailable: boolean = false;
        let diseaseFreeNotAvailable: boolean = false;
        const overallSurvivalDescription =
            this.props.store.overallSurvivalDescriptions &&
            this.props.store.overallSurvivalDescriptions.result!.length == 1
                ? this.props.store.overallSurvivalDescriptions.result![0]
                      .description
                : '';
        const diseaseFreeSurvivalDescription =
            this.props.store.diseaseFreeSurvivalDescriptions &&
            this.props.store.diseaseFreeSurvivalDescriptions.result!.length == 1
                ? this.props.store.diseaseFreeSurvivalDescriptions.result![0]
                      .description
                : '';

        if (
            this.overallPatientSurvivalData.isComplete &&
            this.overallPatientSurvivalData.result.patientSurvivals.length > 0
        ) {
            if (
                this.props.store.overallSurvivalDescriptions &&
                this.props.store.overallSurvivalDescriptions.result!.length > 1
            ) {
                let messageBeforeTooltip = this
                    .multipleDescriptionWarningMessageWithoutTooltip;
                const uniqDescriptions = _.uniq(
                    _.map(
                        this.props.store.overallSurvivalDescriptions.result!,
                        d => d.description
                    )
                );
                if (uniqDescriptions.length > 1) {
                    messageBeforeTooltip = `${this.differentDescriptionExistMessage} ${messageBeforeTooltip}`;
                }
                content.push(
                    <div className={'tabMessageContainer'}>
                        <div className={'alert alert-warning'} role="alert">
                            {messageBeforeTooltip}
                            <DefaultTooltip
                                placement="bottom"
                                overlay={
                                    <SurvivalDescriptionTable
                                        survivalDescriptionData={
                                            this.props.store
                                                .overallSurvivalDescriptions
                                                .result!
                                        }
                                    />
                                }
                            >
                                <a href="javascript:void(0)">
                                    {
                                        this
                                            .multipleDescriptionWarningMessageWithTooltip
                                    }
                                </a>
                            </DefaultTooltip>
                        </div>
                    </div>
                );
            }
            content.push(
                <div style={{ marginBottom: 40 }}>
                    <h4 className="forceHeaderStyle h4">
                        {overallSurvivalDescription
                            ? `${this.overallSurvivalTitleText} (${overallSurvivalDescription})`
                            : this.overallSurvivalTitleText}
                    </h4>
                    <div style={{ width: '920px' }}>
                        <SurvivalChart
                            className="borderedChart"
                            patientSurvivals={
                                this.overallPatientSurvivalData.result
                                    .patientSurvivals
                            }
                            analysisGroups={analysisGroups}
                            patientToAnalysisGroups={
                                this.overallPatientSurvivalData.result
                                    .patientToAnalysisGroups
                            }
                            title={this.overallSurvivalTitleText}
                            xAxisLabel="Months Survival"
                            yAxisLabel="Overall Survival"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Deceased"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip="Survival estimate"
                            xLabelWithEventTooltip="Time of death"
                            xLabelWithoutEventTooltip="Time of last observation"
                            fileName="Overall_Survival"
                        />
                    </div>
                </div>
            );
        } else {
            overallNotAvailable = true;
        }

        if (
            this.diseaseFreePatientSurvivalData.isComplete &&
            this.diseaseFreePatientSurvivalData.result.patientSurvivals.length >
                0
        ) {
            if (
                this.props.store.diseaseFreeSurvivalDescriptions &&
                this.props.store.diseaseFreeSurvivalDescriptions.result!
                    .length > 1
            ) {
                let messageBeforeTooltip = this
                    .multipleDescriptionWarningMessageWithoutTooltip;
                const uniqDescriptions = _.uniq(
                    _.map(
                        this.props.store.diseaseFreeSurvivalDescriptions
                            .result!,
                        d => d.description
                    )
                );
                if (uniqDescriptions.length > 1) {
                    messageBeforeTooltip = `${this.differentDescriptionExistMessage} ${messageBeforeTooltip}`;
                }
                content.push(
                    <div className={'tabMessageContainer'}>
                        <div className={'alert alert-warning'} role="alert">
                            {messageBeforeTooltip}
                            <DefaultTooltip
                                placement="bottom"
                                overlay={
                                    <SurvivalDescriptionTable
                                        survivalDescriptionData={
                                            this.props.store
                                                .diseaseFreeSurvivalDescriptions
                                                .result!
                                        }
                                    />
                                }
                            >
                                <a href="javascript:void(0)">
                                    {
                                        this
                                            .multipleDescriptionWarningMessageWithTooltip
                                    }
                                </a>
                            </DefaultTooltip>
                        </div>
                    </div>
                );
            }
            content.push(
                <div>
                    <h4 className="forceHeaderStyle h4">
                        {diseaseFreeSurvivalDescription
                            ? `${this.diseaseFreeSurvivalTitleText} (${diseaseFreeSurvivalDescription})`
                            : this.diseaseFreeSurvivalTitleText}
                    </h4>
                    <div style={{ width: '920px' }}>
                        <SurvivalChart
                            className="borderedChart"
                            patientSurvivals={
                                this.diseaseFreePatientSurvivalData.result
                                    .patientSurvivals
                            }
                            analysisGroups={analysisGroups}
                            patientToAnalysisGroups={
                                this.diseaseFreePatientSurvivalData.result
                                    .patientToAnalysisGroups
                            }
                            title={this.diseaseFreeSurvivalTitleText}
                            xAxisLabel="Months Disease/Progression-free"
                            yAxisLabel="Disease/Progression-free Survival"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Relapsed/Progressed"
                            medianMonthsHeader="Median Months Disease-free"
                            yLabelTooltip="Disease-free Estimate"
                            xLabelWithEventTooltip="Time of Relapse"
                            xLabelWithoutEventTooltip="Time of Last Observation"
                            fileName="Disease_Free_Survival"
                        />
                    </div>
                </div>
            );
        } else {
            diseaseFreeNotAvailable = true;
        }

        if (overallNotAvailable && diseaseFreeNotAvailable) {
            content.push(
                <div className={'alert alert-info'}>
                    {this.overallSurvivalTitleText} not available
                </div>
            );
            content.push(
                <div className={'alert alert-info'}>
                    {this.diseaseFreeSurvivalTitleText} not available
                </div>
            );
        }

        return (
            <div data-test="survivalTabDiv">
                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner
                        className="survival-oql-status-banner"
                        store={this.props.store}
                        tabReflectsOql={true}
                    />
                    <NotUsingGenePanelWarning store={this.props.store} />
                    <AlterationFilterWarning store={this.props.store} />
                </div>
                {content}
            </div>
        );
    }
}
