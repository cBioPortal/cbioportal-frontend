import * as React from "react";
import styles from "./styles.module.scss";
import { StudyViewPageStore, ClinicalAttributeDataWithMeta, ClinicalDataType } from "pages/studyView/StudyViewPage";
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

export interface IChartProps {
    clinicalAttribute: ClinicalAttribute,
    data?: ClinicalAttributeDataWithMeta;
    filters: string[];
    onUserSelection: (attrId: string, clinicalDataType: ClinicalDataType, value: string[]) => void;
    key: number;
}

@observer
export class Chart extends React.Component<IChartProps, {}> {

    constructor(props: IChartProps) {
        super(props);
        this.onUserSelection = this.onUserSelection.bind(this);
        this.handleFilter = this.handleFilter.bind(this)
        this.resetFilters = this.resetFilters.bind(this)
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

    }

    private chartFilterSet = observable.shallowMap<boolean>();

    @computed private get showSelectIcon(){
        return this.chartFilterSet.keys().length>0;
    }

    @computed private get showResetIcon(){
        return this.props.filters.length>0;
    }
    private handleFilter(){
        //TODO: get rid off data variable here
        if(this.props.data){
            this.props.onUserSelection(this.props.clinicalAttribute.clinicalAttributeId,
                                       this.props.data.clinicalDataType,this.chartFilterSet.keys());
        }
    }

    @action private resetFilters(){
        this.chartFilterSet.clear()
        this.handleFilter()
    }

    @action private onUserSelection(value : string){
        let values = this.chartFilterSet;
        if(this.chartFilterSet.has(value)){
            this.chartFilterSet.delete(value);
        }else{
            this.chartFilterSet.set(value);
        }
        this.handleFilter()
    }

    @observable mouseInsideBounds:boolean = false;

    onMouseEnter(){
        this.mouseInsideBounds = true;
    }

    onMouseLeave(){
        this.mouseInsideBounds = false;
    }
    


    public render() {
        return (
            <div className={styles.chart} onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}>
                <ChartHeader 
                    clinicalAttribute={this.props.clinicalAttribute}
                    showControls={this.mouseInsideBounds}
                    showResetIcon={this.chartFilterSet.size>0}
                    handleResetClick={this.resetFilters}
                />
                {this.props.data && <div className={styles.plot}>
                    <PieChart
                        onUserSelection={this.onUserSelection}
                        filters={this.chartFilterSet.keys()}
                        data={this.props.data} />
                </div>}
            </div>
        );
    }

}
