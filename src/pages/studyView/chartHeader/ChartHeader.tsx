import * as React from "react";
import "./styles.scss";
import {ClinicalAttribute} from "shared/api/generated/CBioPortalAPI";
import {If} from 'react-if';
import { ChartType } from "pages/studyView/StudyViewPageStore";

export interface IChartHeaderProps {
    clinicalAttribute: ClinicalAttribute;
    active           : boolean;
    resetChart       : () => void;
    deleteChart      : () => void;
    hideLabel?       : boolean;
    chartControls?   : ChartControls;
    changeChartType  : (chartType: ChartType) => void;
}

export interface ChartControls {
    showResetIcon?   : boolean;
    showTableIcon?    : boolean;
    showPieIcon?      : boolean;
}

export class ChartHeader extends React.Component<IChartHeaderProps, {}> {
    constructor(props: IChartHeaderProps) {
        super(props);
    }

    public render() {
        return (
            <div className='studyViewPageChartHeader'>
                <div className='name'>
                { !this.props.hideLabel && <span>{this.props.clinicalAttribute.displayName}</span>}
                </div>
                <div className='controls'>
                    <If condition={this.props.active}>
                        <div role="group" className="btn-group">
                            <If condition={this.props.chartControls && this.props.chartControls.showResetIcon}>
                                <button className="btn btn-xs" onClick={() => this.props.resetChart()}>
                                    <i className="fa fa-undo" aria-hidden="true" title="Reset filters in chart"></i>
                                </button>
                            </If>
                            <button className="btn btn-xs">
                                <i className="fa fa-info-circle" aria-hidden="true"
                                   title={this.props.clinicalAttribute.description}></i>
                            </button>
                            <If condition={this.props.chartControls && this.props.chartControls.showTableIcon}>
                                <button className="btn btn-xs"  onClick={() => this.props.changeChartType(ChartType.TABLE)}>
                                    <i className="fa fa-table" aria-hidden="true" title="Convert to table"></i>
                                </button>
                            </If>
                            <If condition={this.props.chartControls && this.props.chartControls.showPieIcon}>
                                <button className="btn btn-xs"  onClick={() => this.props.changeChartType(ChartType.PIE_CHART)}>
                                    <i className="fa fa-pie-chart" aria-hidden="true" title="Convert to Pie chart"></i>
                                </button>
                            </If>
                            <button className="btn btn-xs"  onClick={() => this.props.deleteChart()}>
                                <i className="fa fa-times" aria-hidden="true" title="Delete chart"></i>
                            </button>
                        </div>
                    </If>
                </div>
            </div>
        )
    }

}