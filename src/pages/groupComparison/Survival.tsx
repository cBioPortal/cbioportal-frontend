import * as React from 'react';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { observer } from "mobx-react";
import GroupComparisonStore, { OverlapStrategy } from './GroupComparisonStore';
import { remoteData } from 'shared/api/remoteData';
import { COLORS } from 'pages/studyView/StudyViewUtils';
import {MakeMobxView} from "../../shared/components/MobxView";
import {ENRICHMENTS_NOT_2_GROUPS_MSG, SURVIVAL_TOO_MANY_GROUPS_MSG, EXCLUDE_OVERLAPPING_SAMPLES_AND_PATIENTS_MSG} from "./GroupComparisonUtils";
import ErrorMessage from "../../shared/components/ErrorMessage";

export interface ISurvivalProps {
    store: GroupComparisonStore
}

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease/Progression-free Kaplan-Meier Estimate';

    public readonly analysisGroups = remoteData({
        await: () => [
            this.props.store._activeGroupsOverlapRemoved
        ],
        invoke: () => {
            let colorIndex = 0;
            return Promise.resolve(this.props.store._activeGroupsOverlapRemoved.result!.map((group)=>({
                name: group.name,
                color: group.color,
                value: group.uid,
                legendText: group.name
            })));
        }
    });


    readonly tabUI = MakeMobxView({
        await:()=>{
            if (this.props.store._activeGroupsOverlapRemoved.isComplete &&
                this.props.store._activeGroupsOverlapRemoved.result.length > 10) {
                // dont bother loading data for and computing UI if its not valid situation for it
                return [this.props.store._activeGroupsOverlapRemoved];
            } else {
                return [this.props.store._activeGroupsOverlapRemoved, this.survivalUI];
            }
        },
        render:()=>{
            if (this.props.store._activeGroupsOverlapRemoved.result!.length > 10) {
                return <span>{SURVIVAL_TOO_MANY_GROUPS_MSG}</span>;
            } else {
                let content: any = [];
                if (this.props.store.overlapStrategy === OverlapStrategy.INCLUDE && (this.props.store._selectionInfo.result!.overlappingSamples.length !== 0 || this.props.store._selectionInfo.result!.overlappingPatients.length !== 0)) {
                    content.push(<div className={'alert alert-info'}>{EXCLUDE_OVERLAPPING_SAMPLES_AND_PATIENTS_MSG}</div>);
                }
                content.push(this.survivalUI.component)
                return content;
            }
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    readonly survivalUI = MakeMobxView({
        await:()=>[
            this.props.store.overallPatientSurvivals,
            this.props.store.diseaseFreePatientSurvivals,
            this.analysisGroups,
            this.props.store.patientToAnalysisGroups
        ],
        render:()=>{
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
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.tabUI.component;
    }
}
