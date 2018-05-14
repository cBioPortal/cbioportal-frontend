import * as React from "react";
import "./styles.scss";
import { ClinicalAttribute } from "shared/api/generated/CBioPortalAPI";
import { observable, computed, action } from "mobx";
import _ from "lodash";
import {If} from 'react-if';
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

export interface IChartHeaderProps {
    clinicalAttribute: ClinicalAttribute;
    showControls:boolean;
    showResetIcon?:boolean;
    showTableIcon?:boolean;
    showPieIcon?:boolean;
    showSurvivalIcon?:boolean;
    handleResetClick: () => void;
    handleDownloadDataClick: () => void;
    handleSVGClick: () => void;
    handlePDFClick: () => void;
}

export class ChartHeader extends React.Component<IChartHeaderProps, {}> {

    private handlers:any;

    @observable private isDownloadControlActive:boolean = false;

    constructor(props: IChartHeaderProps) {
        super(props);
        this.handlers = {
            onVisibleChange: action((visible:boolean)=>{
                this.isDownloadControlActive=visible;
            })
        }
    }

    @computed
    private get showChartControls(){
        return this.isDownloadControlActive || this.props.showControls;
    }

    public render() {
        return (
            <div className='studyViewPageChartHeader'>
                <div className='name'><span>{this.props.clinicalAttribute.displayName}</span></div>
                <div className='controls'>
                    <If condition={this.showChartControls}>
                        <div role="group" className="btn-group">
                            <If condition={!!this.props.showResetIcon}>
                                <button className="btn btn-xs" onClick={()=>this.props.handleResetClick()}>
                                    <i className="fa fa-undo" aria-hidden="true" title="Reset filters in chart"></i>
                                </button>
                            </If>
                            <button className="btn btn-xs" >
                                <i className="fa fa-info-circle" aria-hidden="true" title={this.props.clinicalAttribute.description}></i>
                            </button>
                            <If condition={!!this.props.showTableIcon}>
                                <button className="btn btn-xs">
                                    <i className="fa fa-table" aria-hidden="true" title="Convert pie chart to table"></i>
                                </button>
                            </If>
                            <If condition={!!this.props.showPieIcon}>
                                <button className="btn btn-xs">
                                    <i className="fa fa-pie-chart" aria-hidden="true" title="Convert table to pie chart"></i>
                                </button>
                            </If>
                            <If condition={!!this.props.showSurvivalIcon}>
                                <button className="btn btn-xs">
                                    <i className="fa fa-line-chart" aria-hidden="true" title="Survival Analysis"></i>
                                </button>
                            </If>
                            <button className="btn btn-xs">
                                <DefaultTooltip
                                    placement="bottom"
                                    onVisibleChange={this.handlers.onVisibleChange}
                                    trigger={['hover', 'focus']}
                                    overlay={<div role="group" className="btn-group study-view-chart-download">
                                                <button className="btn btn-xs" onClick={()=>this.props.handleDownloadDataClick()}>
                                                DATA
                                                </button>
                                                <button className="btn btn-xs" onClick={()=>this.props.handlePDFClick()}>
                                                PDF
                                                </button>
                                                <button className="btn btn-xs" onClick={()=>this.props.handleSVGClick()}>
                                                SVG
                                                </button>
                                            </div>}
                                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                                    destroyTooltipOnHide={true}
                                >
                                    <i className="fa fa-download" aria-hidden="true" title="Download"></i>
                                </DefaultTooltip>
                            </button>
                            <button className="btn btn-xs">
                                <i className="fa fa-arrows" aria-hidden="true" title="Move chart"></i>
                            </button>
                            <button className="btn btn-xs">
                            <i className="fa fa-times" aria-hidden="true" title="Delete chart"></i>
                            </button>
                        </div>
                    </If>
                </div>
            </div>
        )
    }

}