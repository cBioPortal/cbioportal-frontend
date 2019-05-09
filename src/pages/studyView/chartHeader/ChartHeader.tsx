import * as React from "react";
import styles from "./styles.module.scss";
import {If} from 'react-if';
import {ChartMeta, ChartType} from "pages/studyView/StudyViewPageStore";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import fileDownload from 'react-file-download';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {IChartContainerDownloadProps} from "../charts/ChartContainer";
import {saveSvgAsPng} from "save-svg-as-png";
import {ChartTypeEnum} from "../StudyViewConfig";
import {getClinicalAttributeOverlay} from "../StudyViewUtils";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";

// there's some incompatiblity with rc-tooltip and study view layout
// these adjustments force tooltips to open top right because tooltips
// were breaking at far right of page
const tooltipPosition = "topRight";
const tooltipAlign = { offset:[5,-6] };

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    title: string;
    height: number;
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
        PDF: false,
        PNG: false
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
                                    if (data) {
                                        const fileName = `${this.fileName}.${props.type.substring(0, 3).toLowerCase()}`;
                                        if (props.type === "PNG") {
                                            saveSvgAsPng(data, fileName, {backgroundColor:"#ffffff"});
                                        } else if (typeof data === "string" && data.length > 0) {
                                            fileDownload(data, fileName);
                                        } else if (props.type === "PDF" && data) {
                                            svgToPdfDownload(fileName, data)
                                        }
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
                placement={tooltipPosition}
                align={tooltipAlign}
                overlay={<span>Download</span>}>
                <DefaultTooltip
                    placement="bottom"
                    overlay={overlay}
                    destroyTooltipOnHide={true}
                    onVisibleChange={this.onTooltipVisibleChange}
                    trigger={["click"]}
                    getTooltipContainer={(...args:any[])=>{
                        // this weirdness is necessary to fix broken type
                        return args[0].parentNode;
                    }}
                >
                    <i className={classnames("fa", "fa-download", styles.item, styles.clickable)}
                       aria-hidden="true"></i>
                </DefaultTooltip>
            </DefaultTooltip>
        );
    }

    @autobind
    @action
    onTooltipVisibleChange(visible: boolean) {
        this.downloadMenuActive = visible;
    }

    @computed get active() {
        return this.downloadMenuActive || this.props.active;
    }

    public render() {
        return (
            <div className={classnames(styles.header, 'chartHeader')}
                 style={{height: `${this.props.height}px`, lineHeight: `${this.props.height}px`}}>
                <div className={styles.name}>
                    {!this.props.hideLabel && <span className='chartTitle'>{this.props.title}</span>}
                </div>
                <If condition={this.active}>
                    <div className={classnames(styles.controls, 'controls')}>
                        <div role="group" className="btn-group logScaleCheckbox">
                            <If condition={this.props.chartControls && !!this.props.chartControls.showLogScaleToggle}>
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
                        <If condition={this.props.chartControls && !!this.props.chartControls.showResetIcon}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Reset filters in chart</span>}
                                destroyTooltipOnHide={true}
                            >
                                <i className={classnames("fa", "fa-undo", styles.item, styles.clickable, styles.undo)}
                                   aria-hidden="true" onClick={() => this.props.resetChart()}></i>
                            </DefaultTooltip>
                        </If>
                        <If condition={!!this.props.chartMeta.description}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={getClinicalAttributeOverlay(this.props.chartMeta.displayName, this.props.chartMeta.description)}
                                destroyTooltipOnHide={true}
                            >
                                <i className={classnames("fa", "fa-info-circle", styles.item)} aria-hidden="true"></i>
                            </DefaultTooltip>
                        </If>
                        <If condition={this.props.chartControls && !!this.props.chartControls.showTableIcon}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Convert pie chart to table</span>}
                            >
                                <i className={classnames("fa", "fa-table", styles.item, styles.clickable)}
                                   aria-hidden="true"
                                   onClick={() => this.props.changeChartType(ChartTypeEnum.TABLE)}></i>
                            </DefaultTooltip>
                        </If>
                        <If condition={this.props.chartControls && !!this.props.chartControls.showPieIcon}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Convert table to pie chart</span>}
                            >
                                <i className={classnames("fa", "fa-pie-chart", styles.item, styles.clickable)}
                                   aria-hidden="true"
                                   onClick={() => this.props.changeChartType(ChartTypeEnum.PIE_CHART)}></i>
                            </DefaultTooltip>
                        </If>
                        <If condition={this.props.chartControls && !!this.props.chartControls.showAnalysisGroupsIcon}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Survival Analysis</span>}
                            >
                                <img src={require("../../../rootImages/survival_icon.svg")} 
                                     className={classnames(styles.survivalIcon, styles.item, styles.clickable, 'survivalIcon')}
                                     style={{verticalAlign: "initial"}} alt="Survival Analysis"
                                     onClick={this.props.setAnalysisGroups}/>
                            </DefaultTooltip>
                        </If>
                        <If condition={this.props.download && this.props.download.length > 0}>
                            {this.downloadControls()}
                        </If>
                        <DefaultTooltip
                            placement={tooltipPosition}
                            align={tooltipAlign}
                            overlay={<span>Move chart</span>}
                        >
                            <i className={classnames("fa", "fa-arrows", styles.item, styles.clickable)}
                               aria-hidden="true"
                               style={{cursor: 'move'}}/>
                        </DefaultTooltip>
                        <DefaultTooltip
                            placement={tooltipPosition}
                            align={tooltipAlign}
                            overlay={<span>Delete chart</span>}
                        >
                            <i className={classnames("fa", "fa-times", styles.item, styles.clickable)}
                               aria-hidden="true" onClick={() => this.props.deleteChart()}></i>
                        </DefaultTooltip>
                    </div>
                </If>
            </div>
        );
    }

}