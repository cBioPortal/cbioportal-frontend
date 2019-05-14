import * as React from 'react';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from './GroupComparisonStore';
import {remoteData} from 'shared/api/remoteData';
import {MakeMobxView} from "../../shared/components/MobxView";
import {SURVIVAL_TOO_MANY_GROUPS_MSG} from "./GroupComparisonUtils";
import ErrorMessage from "../../shared/components/ErrorMessage";
import {blendColors} from "./OverlapUtils";
import OverlapExclusionIndicator from "./OverlapExclusionIndicator";

export interface ISurvivalProps {
    store: GroupComparisonStore
}

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease/Progression-free Kaplan-Meier Estimate';

    public readonly analysisGroupsComputations = remoteData({
        await: () => [
            this.props.store.patientsVennPartition,
            this.props.store.uidToGroup
        ],
        invoke: () => {
            const partition = this.props.store.patientsVennPartition.result!;
            const uidToGroup = this.props.store.uidToGroup.result!;
            const analysisGroups = [];
            const patientToAnalysisGroups:{[patientKey:string]:string[]} = {};
            for (const entry of partition) {
                const partitionGroupUids = Object.keys(entry.key).filter(uid=>entry.key[uid]);
                if (this.props.store.overlapStrategy === OverlapStrategy.EXCLUDE && partitionGroupUids.length > 1) {
                    // dont show the overlap curves if we're excluding overlapping cases
                } else {
                    const name = partitionGroupUids.map(uid=>uidToGroup[uid].nameWithOrdinal).join(", ");
                    const value = partitionGroupUids.join(",");
                    for (const patientKey of entry.value) {
                        patientToAnalysisGroups[patientKey] = [value];
                    }
                    analysisGroups.push({
                        name,
                        color: blendColors(partitionGroupUids.map(uid=>uidToGroup[uid].color)),
                        value,
                        legendText: name
                    });
                }
            }
            return Promise.resolve({
                analysisGroups,
                patientToAnalysisGroups
            });
        }
    });


    readonly tabUI = MakeMobxView({
        await:()=>{
            if (this.props.store._activeGroupsNotOverlapRemoved.isComplete &&
                this.props.store._activeGroupsNotOverlapRemoved.result.length > 10) {
                // dont bother loading data for and computing UI if its not valid situation for it
                return [this.props.store._activeGroupsNotOverlapRemoved];
            } else {
                return [this.props.store._activeGroupsNotOverlapRemoved, this.survivalUI];
            }
        },
        render:()=>{
            if (this.props.store._activeGroupsNotOverlapRemoved.result!.length > 10) {
                return <span>{SURVIVAL_TOO_MANY_GROUPS_MSG}</span>;
            } else {
                let content: any = [];
                switch (this.props.store.overlapStrategy) {
                    case OverlapStrategy.EXCLUDE:
                        content.push(<OverlapExclusionIndicator store={this.props.store}/>);
                        break;
                    case OverlapStrategy.INCLUDE:
                        content.push(
                            <div className={`alert alert-info`}>
                                <i
                                    className={`fa fa-md fa-info-circle`}
                                    style={{
                                        color: "#000000",
                                        marginRight:5
                                    }}
                                />
                                Overlapping samples and patients are graphed in multiple-group curves below.
                            </div>
                        );
                        break;
                }
                content.push(this.survivalUI.component)
                return content;
            }
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>,
        showLastRenderWhenPending:true
    });

    readonly survivalUI = MakeMobxView({
        await:()=>[
            this.props.store.overallPatientSurvivals,
            this.props.store.diseaseFreePatientSurvivals,
            this.analysisGroupsComputations,
            this.props.store._selectionInfo
        ],
        render:()=>{
            let content: any = [];
            let overallNotAvailable: boolean = false;
            let diseaseFreeNotAvailable: boolean = false;
            const analysisGroups = this.analysisGroupsComputations.result!.analysisGroups;
            const patientToAnalysisGroups = this.analysisGroupsComputations.result!.patientToAnalysisGroups;

            if (this.props.store.overallPatientSurvivals.result!.length > 0) {
                content.push(
                    <div style={{marginBottom:40}}>
                        <h4 className='forceHeaderStyle h4'>{this.overallSurvivalTitleText}</h4>
                        <div style={{width: '920px'}}>
                            <SurvivalChart
                                className='borderedChart'
                                patientSurvivals = {this.props.store.overallPatientSurvivals.result}
                                analysisGroups={analysisGroups}
                                patientToAnalysisGroups={patientToAnalysisGroups}
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

            if (this.props.store.diseaseFreePatientSurvivals.result!.length > 0) {
                content.push(
                    <div>
                        <h4 className='forceHeaderStyle h4'>{ this.diseaseFreeSurvivalTitleText }</h4>
                        <div style={{width: '920px'}}>
                            <SurvivalChart
                                className='borderedChart'
                                patientSurvivals = {this.props.store.diseaseFreePatientSurvivals.result}
                                analysisGroups={analysisGroups}
                                patientToAnalysisGroups={patientToAnalysisGroups}
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
        renderError:()=><ErrorMessage/>,
    });

    render() {
        return this.tabUI.component;
    }
}
