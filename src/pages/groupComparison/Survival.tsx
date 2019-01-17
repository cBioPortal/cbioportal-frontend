import * as React from 'react';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { observer } from "mobx-react";
import GroupComparisonStore from './GroupComparisonStore';
import { remoteData } from 'shared/api/remoteData';
import { COLORS } from 'pages/studyView/StudyViewUtils';

export interface ISurvivalProps {
    store: GroupComparisonStore
}

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease/Progression-free Kaplan-Meier Estimate';

    public readonly analysisGroups = remoteData({
        await: () => [
            this.props.store.sampleGroups
        ],
        invoke: () => {
            let colorIndex = 0;
            return Promise.resolve(this.props.store.sampleGroups.result!.map((group)=>({
                name: group.name,
                color: group.color ? group.color : COLORS[(colorIndex++) % COLORS.length],
                value: group.id,
                legendText: group.legendText
            })));
        }
    });

    public render() {

        if (this.props.store.overallPatientSurvivals.isPending ||
            this.props.store.diseaseFreePatientSurvivals.isPending ||
            this.analysisGroups.isPending ||
            this.props.store.patientToAnalysisGroups.isPending) {
            return <LoadingIndicator isLoading={true} size={"big"} center={true} />;
        }

        let content: any = [];
        let overallNotAvailable: boolean = false;
        let diseaseFreeNotAvailable: boolean = false;

        if (this.props.store.overallPatientSurvivals.isComplete &&
            this.props.store.overallPatientSurvivals.result.length > 0 &&
            this.analysisGroups.isComplete &&
            this.props.store.patientToAnalysisGroups.isComplete) {
            content.push(
                <div style={{marginBottom:40}}>
                    <h4 className='forceHeaderStyle h4'>{this.overallSurvivalTitleText}</h4>
                    <div style={{width: '920px'}}>
                        <SurvivalChart
                            className='borderedChart'
                            patientSurvivals = {this.props.store.overallPatientSurvivals.result}
                            analysisGroups={this.analysisGroups.result!}
                            patientToAnalysisGroups={this.props.store.patientToAnalysisGroups.result!}
                            title={this.overallSurvivalTitleText}
                            xAxisLabel="Months Survival"
                            yAxisLabel="Overall Survival"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Deceased"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip="Survival estimate"
                            xLabelWithEventTooltip="Time of death"
                            xLabelWithoutEventTooltip="Time of last observation"
                            fileName="Overall_Survival" />
                    </div>
                </div>
            );
        } else {
            overallNotAvailable = true;
        }

        if (this.props.store.diseaseFreePatientSurvivals.isComplete &&
            this.props.store.diseaseFreePatientSurvivals.result.length > 0 &&
            this.analysisGroups.isComplete &&
            this.props.store.patientToAnalysisGroups.isComplete) {
            content.push(
                <div>
                    <h4 className='forceHeaderStyle h4'>{ this.diseaseFreeSurvivalTitleText }</h4>
                    <div style={{width: '920px'}}>
                        <SurvivalChart
                            className='borderedChart'
                            patientSurvivals = {this.props.store.diseaseFreePatientSurvivals.result}
                            analysisGroups={this.analysisGroups.result!}
                            patientToAnalysisGroups={this.props.store.patientToAnalysisGroups.result!}
                            title={this.diseaseFreeSurvivalTitleText}
                            xAxisLabel="Months Disease/Progression-free"
                            yAxisLabel="Disease/Progression-free Survival"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Relapsed/Progressed"
                            medianMonthsHeader="Median Months Disease-free"
                            yLabelTooltip="Disease-free Estimate"
                            xLabelWithEventTooltip="Time of Relapse"
                            xLabelWithoutEventTooltip="Time of Last Observation"
                            fileName="Disease_Free_Survival" />
                    </div>
                </div>
            );
        } else {
            diseaseFreeNotAvailable = true;
        }

        if (overallNotAvailable) {
            content.push(<div className={'alert alert-info'}>{this.overallSurvivalTitleText} not available</div>);
        }

        if (diseaseFreeNotAvailable) {
            content.push(<div className={'alert alert-info'}>{this.diseaseFreeSurvivalTitleText} not available</div>);
        }

        return (
            <div>
                {content}
            </div>
        );
    }
}
