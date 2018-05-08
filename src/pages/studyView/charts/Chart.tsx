import * as React from "react";
import styles from "./styles.module.scss";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel } from 'victory';
import { ClinicalAttribute } from "shared/api/generated/CBioPortalAPI";
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";
import { observable, computed, action } from "mobx";
import _ from "lodash";
import { PieChart } from "pages/studyView/charts/pieChart/PieChart";
import {If} from 'react-if';
import {Button} from 'react-bootstrap';
import { ChartHeader } from "pages/studyView/chartHeader/ChartHeader";
import { ClinicalAttributeDataWithMeta, ClinicalDataType } from "pages/studyView/StudyViewPageStore";
import { getClinicalDataType } from "pages/studyView/StudyViewUtils";

export interface IChartProps {
    chartType:ChartType;
    clinicalAttribute: ClinicalAttribute,
    data?: ClinicalAttributeDataWithMeta;
    filters: string[];
    onUserSelection: (attrId: string, clinicalDataType: ClinicalDataType, value: string[]) => void;
    key: number;
}

export enum ChartType {
    PIE_CHART,
    BAR_CHART,
    SURVIVAL,
    TABLE,
    SCATTER
}

@observer
export class Chart extends React.Component<IChartProps, {}> {

    constructor(props: IChartProps) {
        super(props);
        this.currentChartType = props.chartType;
        this.onUserSelection = this.onUserSelection.bind(this);
        this.resetFilters = this.resetFilters.bind(this)
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

    }

    private currentChartType:ChartType;

    @action private resetFilters(){
        this.props.onUserSelection(
            this.props.clinicalAttribute.clinicalAttributeId,
            getClinicalDataType(this.props.clinicalAttribute),
            []);
    }

    @action private onUserSelection(values : string[]){
       this.props.onUserSelection(
            this.props.clinicalAttribute.clinicalAttributeId,
            getClinicalDataType(this.props.clinicalAttribute),
            values);
    }

    @observable mouseInsideBounds:boolean = false;

    onMouseEnter(){
        this.mouseInsideBounds = true;
    }

    onMouseLeave(){
        this.mouseInsideBounds = false;
    }

    @computed get showPieControlIcon(){
        return this.props.clinicalAttribute.datatype==='STRING' && this.currentChartType === ChartType.TABLE;
    }

    @computed get showTableControlIcon(){
        return this.currentChartType === ChartType.PIE_CHART && this.props.clinicalAttribute.datatype==='STRING';
    }
    


    public render() {
        return (
            <div className={styles.chart} onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}>
                <ChartHeader 
                    clinicalAttribute={this.props.clinicalAttribute}
                    showControls={this.mouseInsideBounds}
                    showResetIcon={this.props.filters.length>0}
                    handleResetClick={this.resetFilters}
                    showTableIcon={this.showTableControlIcon}
                    showPieIcon={this.showPieControlIcon}
                />
                {this.props.data &&
                    <PieChart
                        onUserSelection={this.onUserSelection}
                        filters={this.props.filters}
                        data={this.props.data} />}
            </div>
        );
    }

}
