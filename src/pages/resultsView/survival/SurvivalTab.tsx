import * as React from 'react';
import SurvivalChart from "./SurvivalChart";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import { observer } from "mobx-react";
import styles from "./styles.module.scss";
import {remoteData} from "../../../shared/api/remoteData";
import {ALTERED_GROUP_VALUE, getSurvivalChartDataByAlteredStatus, UNALTERED_GROUP_VALUE} from "./SurvivalUtil";
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";

export interface ISurvivalTabProps {
    store: ResultsViewPageStore
}

const analysisGroups = [{
    value:ALTERED_GROUP_VALUE,
    color: "red",
    legendText: "Cases with Alteration(s) in Query Gene(s)"
},{
    value: UNALTERED_GROUP_VALUE,
    color: "blue",
    legendText: "Cases without Alteration(s) in Query Gene(s)"
}];

@observer
export default class SurvivalTab extends React.Component<ISurvivalTabProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease/Progression-free Kaplan-Meier Estimate';

    readonly overallPatientSurvivalData = remoteData({
        await: ()=>[
            this.props.store.overallAlteredPatientSurvivals,
            this.props.store.overallUnalteredPatientSurvivals,
        ],
        invoke:()=>{
            return Promise.resolve(getSurvivalChartDataByAlteredStatus(
                this.props.store.overallAlteredPatientSurvivals.result!,
                this.props.store.overallUnalteredPatientSurvivals.result!
            ));
        }
    });

    readonly diseaseFreePatientSurvivalData = remoteData({
        await: ()=>[
            this.props.store.diseaseFreeAlteredPatientSurvivals,
            this.props.store.diseaseFreeUnalteredPatientSurvivals,
        ],
        invoke:()=>{
            return Promise.resolve(getSurvivalChartDataByAlteredStatus(
                this.props.store.diseaseFreeAlteredPatientSurvivals.result!,
                this.props.store.diseaseFreeUnalteredPatientSurvivals.result!
            ));
        }
    });

    public render() {

        if (this.overallPatientSurvivalData.isPending ||
            this.diseaseFreePatientSurvivalData.isPending) {
            return <LoadingIndicator isLoading={true} size={"big"} center={true} />;
        }

        let content: any = [];
        let overallNotAvailable: boolean = false;
        let diseaseFreeNotAvailable: boolean = false;

        if (this.overallPatientSurvivalData.isComplete &&
            this.overallPatientSurvivalData.result.patientSurvivals.length > 0) {
            content.push(
                <div style={{marginBottom:40}}>
                    <h4 className='forceHeaderStyle h4'>{this.overallSurvivalTitleText}</h4>
                    <div style={{width: '920px'}}>
                        <SurvivalChart
                            className='borderedChart'
                            patientSurvivals = {this.overallPatientSurvivalData.result.patientSurvivals}
                            analysisGroups={analysisGroups}
                            patientToAnalysisGroup={this.overallPatientSurvivalData.result.patientToAnalysisGroup}
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

        if (this.diseaseFreePatientSurvivalData.isComplete &&
            this.diseaseFreePatientSurvivalData.result.patientSurvivals.length > 0) {
            content.push(
                <div>
                    <h4 className='forceHeaderStyle h4'>{ this.diseaseFreeSurvivalTitleText }</h4>
                    <div style={{width: '920px'}}>
                        <SurvivalChart
                            className='borderedChart'
                            patientSurvivals = {this.diseaseFreePatientSurvivalData.result.patientSurvivals}
                            analysisGroups={analysisGroups}
                            patientToAnalysisGroup={this.diseaseFreePatientSurvivalData.result.patientToAnalysisGroup}
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

        if (overallNotAvailable && diseaseFreeNotAvailable) {
            content.push(<div className={'alert alert-info'}>{this.overallSurvivalTitleText} not available</div>);
            content.push(<div className={'alert alert-info'}>{this.diseaseFreeSurvivalTitleText} not available</div>);
        }

        return (
            <div data-test="survivalTabDiv">
                <div className={"tabMessageContainer"}>
                    <OqlStatusBanner className="survival-oql-status-banner" store={this.props.store} tabReflectsOql={true} />
                </div>
                {content}
            </div>
        );
    }
}
