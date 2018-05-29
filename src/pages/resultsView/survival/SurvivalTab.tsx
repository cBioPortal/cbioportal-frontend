import * as React from 'react';
import SurvivalChart from "./SurvivalChart";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import { observer } from "mobx-react";
import styles from "./styles.module.scss";

export interface ISurvivalTabProps {
    store: ResultsViewPageStore
}

@observer
export default class SurvivalTab extends React.Component<ISurvivalTabProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease/Progression-free Kaplan-Meier Estimate';

    public render() {

        if (this.props.store.overallAlteredPatientSurvivals.isPending ||
            this.props.store.overallUnalteredPatientSurvivals.isPending ||
            this.props.store.diseaseFreeAlteredPatientSurvivals.isPending ||
            this.props.store.diseaseFreeUnalteredPatientSurvivals.isPending) {
            return <Loader isLoading={true} />;
        }

        let content: any = [];
        let overallNotAvailable: boolean = false;
        let diseaseFreeNotAvailable: boolean = false;

        if (this.props.store.overallAlteredPatientSurvivals.isComplete &&
            this.props.store.overallUnalteredPatientSurvivals.isComplete &&
            this.props.store.overallAlteredPatientSurvivals.result.length > 0 &&
            this.props.store.overallUnalteredPatientSurvivals.result.length > 0) {
            content.push(
                <div style={{marginBottom:40}}>
                    <h4 className='forceHeaderStyle h4'>{this.overallSurvivalTitleText}</h4>
                    <SurvivalChart alteredPatientSurvivals={this.props.store.overallAlteredPatientSurvivals.result}
                        unalteredPatientSurvivals={this.props.store.overallUnalteredPatientSurvivals.result}
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
                        showTable={true}
                        showLegend={true}
                        showDownloadButtons={true} />
                </div>
            );
        } else {
            overallNotAvailable = true;
        }

        if (this.props.store.diseaseFreeAlteredPatientSurvivals.isComplete &&
            this.props.store.diseaseFreeUnalteredPatientSurvivals.isComplete &&
            this.props.store.diseaseFreeAlteredPatientSurvivals.result.length > 0 &&
            this.props.store.diseaseFreeUnalteredPatientSurvivals.result.length > 0) {
            content.push(
                <div>
                    <h4 className='forceHeaderStyle h4'>{ this.diseaseFreeSurvivalTitleText }</h4>
                    <SurvivalChart alteredPatientSurvivals={this.props.store.diseaseFreeAlteredPatientSurvivals.result}
                    unalteredPatientSurvivals={this.props.store.diseaseFreeUnalteredPatientSurvivals.result}
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
                    showTable={true}
                    showLegend={true}
                    showDownloadButtons={true} />
                </div>
            );
        } else {
            diseaseFreeNotAvailable = true;
        }

        if (overallNotAvailable && diseaseFreeNotAvailable) {
            content.push(<div className={styles.NotAvailable}>{this.overallSurvivalTitleText} not available</div>);
            content.push(<div className={styles.NotAvailable}>{this.diseaseFreeSurvivalTitleText} not available</div>);
        }

        return <div>{content}</div>;
    }
}
