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
import {Dropdown, MenuItem} from "react-bootstrap";

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
    openComparisonPage : () => void;
}

export interface ChartControls {
    showResetIcon?      : boolean;
    showTableIcon?      : boolean;
    showPieIcon?        : boolean;
    showAnalysisGroupsIcon?   : boolean;
    showComparisonPageIcon?   : boolean;
    showLogScaleToggle? : boolean;
    logScaleChecked?    : boolean;
}

@observer
export class ChartHeader extends React.Component<IChartHeaderProps, {}> {

    @observable menuOpen = false;
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

    @autobind
    @action
    onMenuToggle(isOpen:boolean) {
        this.menuOpen = isOpen;
    }

    @computed get active() {
        return this.menuOpen || this.props.active;
    }

    @computed get menuItems() {
        const items = [];
        if (this.props.chartControls && !!this.props.chartControls.showLogScaleToggle) {
            items.push(
                <MenuItem>
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
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showResetIcon) {
            items.push(
                <MenuItem onClick={this.props.resetChart}>
                    Reset filters in chart
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showTableIcon) {
            items.push(
                <MenuItem
                    onClick={() => this.props.changeChartType(ChartTypeEnum.TABLE)}
                >
                    Convert pie chart to table
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showPieIcon) {
            items.push(
                <MenuItem
                    onClick={() => this.props.changeChartType(ChartTypeEnum.PIE_CHART)}
                >
                    Convert table to pie chart
                </MenuItem>
            );
        }

        if (this.props.chartControls && this.props.chartControls.showComparisonPageIcon) {
            items.push(
                <MenuItem
                    onClick={this.props.openComparisonPage}
                >
                    Compare samples in these groups
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showAnalysisGroupsIcon) {
            items.push(
                <MenuItem
                    onClick={this.props.setAnalysisGroups}
                >
                    Survival Analysis
                </MenuItem>
            );
        }

        if (this.props.download && this.props.download.length > 0) {
            if (items.length > 0) {
                items.push(<MenuItem divider={true}/>);
            }
            for (const props of this.props.download) {
                items.push(
                    <MenuItem
                        onClick={()=>{
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
                        {
                            this.downloadPending[props.type] ?
                            <i className="fa fa-spinner fa-spin" aria-hidden="true"/> :
                            `Download ${props.type}`
                        }
                    </MenuItem>
                );
            }
        }

        return items;
    }

    public render() {
        return (
            <div className={classnames(styles.header, 'chartHeader')}
                 style={{position:"relative", height: `${this.props.height}px`, lineHeight: `${this.props.height}px`}}>
                <div className={styles.name}>
                    {!this.props.hideLabel && <span className='chartTitle'>{this.props.title}</span>}
                </div>
                {this.active && (
                    <div className={classnames(styles.controls, 'controls')}>
                        <If condition={!!this.props.chartMeta.description}>
                            <DefaultTooltip
                                trigger={["hover","click"]}
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={getClinicalAttributeOverlay(this.props.chartMeta.displayName, this.props.chartMeta.description)}
                                destroyTooltipOnHide={true}
                            >
                                <i
                                    className={classnames("fa", "fa-info-circle", styles.item, styles.clickable)}
                                    aria-hidden="true"
                                />
                            </DefaultTooltip>
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
                        <Dropdown
                            id={"chartMenu"}
                            onToggle={this.onMenuToggle}
                        >
                            <Dropdown.Toggle id="btn" bsStyle="default" bsSize="xs">
                                <span>
                                    <i className="fa fa-xs fa-bars" style={{marginRight:3}}/>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {this.menuItems}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                )}
            </div>
        );
    }

}