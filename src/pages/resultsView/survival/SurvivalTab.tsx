import * as React from 'react';
import {Chart} from 'chart.js';
import SurvivalChart from "./SurvivalChart";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import styles from "./styles.module.scss";

export interface ISurvivalTabProps {
    store: ResultsViewPageStore
}

export function hideEventPoints(chart: any): void {

    chart.config.data.datasets.map((dataset: any) => {
        let previousData: number;
        dataset.data.map((data: any, index: number) => {
            if (previousData && data.y !== previousData) {
                let meta = dataset._meta[0] == null ? dataset._meta[1] : dataset._meta[0];
                meta.data[index]._model.borderColor = 'rgba(0, 0, 0, 0)';
            }
            previousData = data.y;
        });
    });
}

@observer
export default class SurvivalTab extends React.Component<ISurvivalTabProps, {}> {

    private overallSurvivalTitleText = 'Overall Survival Kaplan-Meier Estimate';
    private diseaseFreeSurvivalTitleText = 'Disease Free Survival Kaplan-Meier Estimate';

    componentWillMount() {
        Chart.pluginService.register({
            beforeDraw: (chart: any) => {
                //https://github.com/jerairrest/react-chartjs-2/issues/146
                if (chart.options.title.text === this.overallSurvivalTitleText ||
                    chart.options.title.text === this.diseaseFreeSurvivalTitleText) {
                    hideEventPoints(chart);
                }
            }
        });
    }

    public render() {

        if (this.props.store.overallAlteredPatientSurvivals.isPending ||
            this.props.store.overallUnalteredPatientSurvivals.isPending ||
            this.props.store.diseaseFreeAlteredPatientSurvivals.isPending ||
            this.props.store.diseaseFreeUnalteredPatientSurvivals.isPending) {
            return <Loader isLoading={true}/>;
        }

        let content:any = [];

        if (this.props.store.overallAlteredPatientSurvivals.isComplete &&
            this.props.store.overallUnalteredPatientSurvivals.isComplete &&
            this.props.store.overallAlteredPatientSurvivals.result.length > 0 &&
            this.props.store.overallUnalteredPatientSurvivals.result.length > 0) {
            content.push(
                <SurvivalChart alteredPatientSurvivals={this.props.store.overallAlteredPatientSurvivals.result}
                               unalteredPatientSurvivals={this.props.store.overallUnalteredPatientSurvivals.result}
                               title={this.overallSurvivalTitleText}
                               xAxisLabel="Months Survival"
                               yAxisLabel="Surviving"
                               totalCasesHeader="#total cases"
                               statusCasesHeader="#cases deceased"
                               medianMonthsHeader="median months survival"
                               yLabelTooltip="Survival estimate"
                               xLabelWithEventTooltip="Time of death"
                               xLabelWithoutEventTooltip="Time of last observation"
                               fileName="Overall_Survival"/>);
        } else {
            content.push(<div className={styles.NotAvailable}>{this.overallSurvivalTitleText} not available</div>);
        }

        if (this.props.store.diseaseFreeAlteredPatientSurvivals.isComplete &&
            this.props.store.diseaseFreeUnalteredPatientSurvivals.isComplete &&
            this.props.store.diseaseFreeAlteredPatientSurvivals.result.length > 0 &&
            this.props.store.diseaseFreeUnalteredPatientSurvivals.result.length > 0) {
            content.push(
                <SurvivalChart alteredPatientSurvivals={this.props.store.diseaseFreeAlteredPatientSurvivals.result}
                           unalteredPatientSurvivals={this.props.store.diseaseFreeUnalteredPatientSurvivals.result}
                           title={this.diseaseFreeSurvivalTitleText}
                           xAxisLabel="Months Disease Free"
                           yAxisLabel="Disease Free"
                           totalCasesHeader="#total cases"
                           statusCasesHeader="#cases relapsed"
                           medianMonthsHeader="median months disease free"
                           yLabelTooltip="Disease free estimate"
                           xLabelWithEventTooltip="Time of relapse"
                           xLabelWithoutEventTooltip="Time of last observation"
                           fileName="Disease_Free_Survival"/>);
        } else {
            content.push(<div className={styles.NotAvailable}>{this.diseaseFreeSurvivalTitleText} not available</div>);
        }

        return <div>{content}</div>;
    }
}
