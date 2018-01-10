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
    private diseaseFreeSurvivalTitleText = 'Disease Free Survival Kaplan-Meier Estimate';

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
                    <h4 className='forceHeaderStyle h4'>Overall Survival Kaplan-Meier Estimate</h4>
                    <SurvivalChart alteredPatientSurvivals={this.props.store.overallAlteredPatientSurvivals.result}
                        unalteredPatientSurvivals={this.props.store.overallUnalteredPatientSurvivals.result}
                        title={''}
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
                    <h4 className='forceHeaderStyle h4'>Disease Free Survival Kaplan-Meier Estimate</h4>
                    <SurvivalChart alteredPatientSurvivals={this.props.store.diseaseFreeAlteredPatientSurvivals.result}
                    unalteredPatientSurvivals={this.props.store.diseaseFreeUnalteredPatientSurvivals.result}
                    title={""}
                    xAxisLabel="Months Disease Free"
                    yAxisLabel="Disease/Progression-free survival"
                    totalCasesHeader="Number of Cases, Total"
                    statusCasesHeader="Number of Cases, Relapsed"
                    medianMonthsHeader="Median Months Disease Free"
                    yLabelTooltip="Disease free estimate"
                    xLabelWithEventTooltip="Time of relapse"
                    xLabelWithoutEventTooltip="Time of last observation"
                    fileName="Disease_Free_Survival" />
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
