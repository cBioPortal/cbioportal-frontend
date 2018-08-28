import * as React from "react";
import "./styles.scss";
import {If} from 'react-if';
import {ChartMeta, ChartType} from "pages/studyView/StudyViewPageStore";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import bind from "bind-decorator";
import fileDownload from 'react-file-download';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {IChartContainerDownloadProps} from "../charts/ChartContainer";

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    active           : boolean;
    resetChart       : () => void;
    deleteChart      : () => void;
    hideLabel?       : boolean;
    chartControls?   : ChartControls;
    changeChartType  : (chartType: ChartType) => void;
    download?        : IChartContainerDownloadProps[];
    setAnalysisGroups  : () => void;
}

export interface ChartControls {
    showResetIcon?   : boolean;
    showTableIcon?    : boolean;
    showPieIcon?      : boolean;
    showAnalysisGroupsIcon?   : boolean;
}

@observer
export class ChartHeader extends React.Component<IChartHeaderProps, {}> {
    constructor(props: IChartHeaderProps) {
        super(props);
    }

    @observable downloadMenuActive = false;
    @observable downloadPending = {
        TSV: false,
        SVG: false,
        PDF: false
    };

    @computed
    get fileName() {
        return this.props.chartMeta.displayName.replace(/[ \t]/g, '_');
    }

    private downloadControls() {
        const overlay = (
            <div className="studyViewChartHeaderDownloadControls">
                {
                    this.props.download && this.props.download.map( props =>
                        <button
                            key={props.type}
                            className="btn btn-xs"
                            onClick={() => {
                                this.downloadPending[props.type] = true;
                                props.initDownload!().then(data => {
                                    if (data && data.length > 0) {
                                        fileDownload(data, `${this.fileName}.${props.type.substring(0, 3).toLowerCase()}`);
                                    }
                                    this.downloadPending[props.type] = false;
                                }).catch(() => {
                                    // TODO this.triggerDownloadError();
                                    this.downloadPending[props.type] = false;
                                });
                            }}
                        >
                            {this.downloadPending[props.type] ? <i className="fa fa-spinner fa-spin" aria-hidden="true" /> : props.type}
                        </button>
                    )
                }
            </div>
        );

        return (
            <DefaultTooltip
                placement="bottom"
                overlay={overlay}
                destroyTooltipOnHide={true}
                onVisibleChange={this.onTooltipVisibleChange as any}
                trigger={["click"]}
            >
                <button className="btn btn-xs">
                    <i className="fa fa-download" aria-hidden="true" title="Download" />
                </button>
            </DefaultTooltip>
        );
    }

    @bind
    @action
    onTooltipVisibleChange(visible: boolean) {
        this.downloadMenuActive = visible;
    }

    @computed get active() {
        return this.downloadMenuActive || this.props.active;
    }

    public render() {
        return (
            <div className='studyViewPageChartHeader'>
                <div className='name'>
                { !this.props.hideLabel && <span>{this.props.chartMeta.displayName}</span>}
                </div>
                <div className='controls'>
                    <If condition={this.active}>
                        <div role="group" className="btn-group">
                            <If condition={this.props.chartControls && this.props.chartControls.showResetIcon}>
                                <button className="btn btn-xs" onClick={() => this.props.resetChart()}>
                                    <i className="fa fa-undo" aria-hidden="true" title="Reset filters in chart"></i>
                                </button>
                            </If>
                            <If condition={!!this.props.chartMeta.description}>
                                <button className="btn btn-xs">
                                    <i className="fa fa-info-circle" aria-hidden="true"
                                       title={this.props.chartMeta.description}></i>
                                </button>
                            </If>
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
                            <If condition={this.props.chartControls && this.props.chartControls.showAnalysisGroupsIcon}>
                                <button className="btn btn-xs"  onClick={this.props.setAnalysisGroups}>
                                    <img src="images/survival_icon.svg" style={{verticalAlign:"initial"}} width="10" height="10" className="icon hover" alt="Survival Analysis"/>
                                </button>
                            </If>
                            <If condition={this.props.download && this.props.download.length > 0}>
                                {this.downloadControls()}
                            </If>
                            <button className="btn btn-xs"  onClick={() => this.props.deleteChart()}>
                                <i className="fa fa-times" aria-hidden="true" title="Delete chart"></i>
                            </button>
                        </div>
                    </If>
                </div>
            </div>
        );
    }

}