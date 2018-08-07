import * as React from "react";
import styles from "./styles.module.scss";
import {If} from 'react-if';
import {ChartMeta, ChartType} from "pages/studyView/StudyViewPageStore";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import {bind} from "bind-decorator";
import classnames from 'classnames';
import fileDownload from 'react-file-download';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {IChartContainerDownloadProps} from "../charts/ChartContainer";

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    active           : boolean;
    resetChart       : () => void;
    deleteChart      : () => void;
    toggleLogScale?  : () => void;
    hideLabel?       : boolean;
    chartControls?   : ChartControls;
    changeChartType  : (chartType: ChartType) => void;
    download?        : IChartContainerDownloadProps[];
    setAnalysisGroups  : () => void;
}

export interface ChartControls {
    showResetIcon?      : boolean;
    showTableIcon?      : boolean;
    showPieIcon?        : boolean;
    showAnalysisGroupsIcon?   : boolean;
    showLogScaleToggle? : boolean;
    logScaleChecked?    : boolean;
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
            <div className={styles.downloadControl}>
                {
                    this.props.download && this.props.download.map(props =>
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
                            {this.downloadPending[props.type] ?
                                <i className="fa fa-spinner fa-spin" aria-hidden="true"/> : props.type}
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
                <i className={classnames("fa", "fa-download", styles.item, styles.clickable)}
                   aria-hidden="true"
                   title="Download"></i>
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
        const overlay = () => {
            return <div style={{maxWidth: '250px'}}>
                <b>{this.props.chartMeta.displayName}</b><br/>
                {this.props.chartMeta.description}
            </div>
        };
        return (
            <div className={styles.header}>
                <div className={styles.name}>
                    {!this.props.hideLabel && <span>{this.props.chartMeta.displayName}</span>}
                </div>
                <If condition={this.active}>
                    <div className={styles.controls}>
                        <div role="group" className="btn-group">
                            <If condition={this.props.chartControls && this.props.chartControls.showLogScaleToggle}>
                                <LabeledCheckbox
                                    checked={this.props.chartControls && this.props.chartControls.logScaleChecked}
                                    onChange={event => {
                                        if (this.props.toggleLogScale) {
                                            this.props.toggleLogScale();
                                        }
                                    }}
                                >
                                    <span>Log Scale</span>
                                </LabeledCheckbox>
                            </If>
                        </div>
                        <If condition={this.props.chartControls && this.props.chartControls.showResetIcon}>
                            <i className={classnames("fa", "fa-undo", styles.item, styles.clickable, styles.undo)}
                               aria-hidden="true"
                               title="Reset filters in chart" onClick={() => this.props.resetChart()}></i>
                        </If>
                        <If condition={!!this.props.chartMeta.description}>
                            <DefaultTooltip
                                placement="top"
                                overlay={overlay}
                                destroyTooltipOnHide={true}
                            >
                                <i className={classnames("fa", "fa-info-circle", styles.item)} aria-hidden="true"
                                   title={this.props.chartMeta.description}></i>
                            </DefaultTooltip>
                        </If>
                        <If condition={this.props.chartControls && this.props.chartControls.showTableIcon}>
                            <i className={classnames("fa", "fa-table", styles.item, styles.clickable)}
                               aria-hidden="true"
                               title="Convert to table"
                               onClick={() => this.props.changeChartType(ChartType.TABLE)}></i>
                        </If>
                        <If condition={this.props.chartControls && this.props.chartControls.showPieIcon}>
                            <i className={classnames("fa", "fa-pie-chart", styles.item, styles.clickable)}
                               aria-hidden="true"
                               title="Convert to Pie chart"
                               onClick={() => this.props.changeChartType(ChartType.PIE_CHART)}></i>
                        </If>
                        <If condition={this.props.chartControls && this.props.chartControls.showAnalysisGroupsIcon}>
                            <img src="images/survival_icon.svg" className={classnames(styles.survivalIcon, styles.item, styles.clickable)} style={{verticalAlign:"initial"}} alt="Survival Analysis" onClick={this.props.setAnalysisGroups}/>
                        </If>
                        <If condition={this.props.download && this.props.download.length > 0}>
                            {this.downloadControls()}
                        </If>
                        <i className={classnames("fa", "fa-times", styles.item, styles.clickable)}
                           aria-hidden="true" title="Delete chart" onClick={() => this.props.deleteChart()}></i>
                    </div>
                </If>
            </div>
        );
    }

}