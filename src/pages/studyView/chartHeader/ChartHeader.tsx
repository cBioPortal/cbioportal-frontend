import * as React from "react";
import styles from "./styles.module.scss";
import {If} from 'react-if';
import {ChartType} from "pages/studyView/StudyViewUtils";
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
import {ChartMeta, getClinicalAttributeOverlay} from "../StudyViewUtils";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import {Dropdown, MenuItem} from "react-bootstrap";
import Timer = NodeJS.Timer;
import DownloadControls, {DownloadControlsButton} from "../../../shared/components/downloadControls/DownloadControls";

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
    getSVG?          : ()=>Promise<SVGElement | null>;
    getData?         : ()=>Promise<string | null>;
    downloadTypes?   : DownloadControlsButton[];
    openComparisonPage : () => void;
}

export interface ChartControls {
    showResetIcon?      : boolean;
    showTableIcon?      : boolean;
    showPieIcon?        : boolean;
    showComparisonPageIcon?   : boolean;
    showLogScaleToggle? : boolean;
    logScaleChecked?    : boolean;
}

@observer
export class ChartHeader extends React.Component<IChartHeaderProps, {}> {

    @observable menuOpen = false;
    private closeMenuTimeout:number|undefined = undefined;

    @computed
    get fileName() {
        return this.props.chartMeta.displayName.replace(/[ \t]/g, '_');
    }

    @autobind
    @action
    private openMenu() {
        this.menuOpen = true;
        window.clearTimeout(this.closeMenuTimeout);
        this.closeMenuTimeout = undefined;
    }

    @autobind
    @action
    private closeMenu() {
        if (!this.closeMenuTimeout) {
            this.closeMenuTimeout = window.setTimeout(()=>{
                this.menuOpen = false;
                this.closeMenuTimeout = undefined;
            }, 125);
        }
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
                    <i className={classnames("fa", "fa-undo", styles.menuItemIcon, styles.undo)}
                       aria-hidden="true"
                   />
                    Reset filters in chart
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showTableIcon) {
            items.push(
                <MenuItem
                    onClick={() => this.props.changeChartType(ChartTypeEnum.TABLE)}
                >
                    <i className={classnames("fa", "fa-table", styles.menuItemIcon)}
                       aria-hidden="true"
                    />
                    Convert pie chart to table
                </MenuItem>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showPieIcon) {
            items.push(
                <MenuItem
                    onClick={() => this.props.changeChartType(ChartTypeEnum.PIE_CHART)}
                >
                    <i className={classnames("fa", "fa-pie-chart", styles.menuItemIcon)}
                       aria-hidden="true"
                    />
                    Convert table to pie chart
                </MenuItem>
            );
        }

        if (this.props.chartControls && this.props.chartControls.showComparisonPageIcon) {
            items.push(
                <MenuItem
                    onClick={this.props.openComparisonPage}
                >
                    <img src={require("../../../rootImages/compare_vs.png")}
                         width={13}
                         style={{marginRight:4}}
                    />
                    Compare groups
                </MenuItem>
            );
        }

        items.push(
            <MenuItem
                onClick={this.props.deleteChart}
            >
                <i className={classnames("fa", "fa-times", styles.menuItemIcon)}
                   aria-hidden="true"
                />
                Delete Chart
            </MenuItem>
        );

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
                        {(this.menuItems.length > 0) && (
                            <Dropdown
                                id={"chartMenu"}
                                open={this.menuOpen}
                                onMouseEnter={this.openMenu}
                                onMouseLeave={this.closeMenu}
                                className={styles.chartMenu}
                            >
                                <Dropdown.Toggle noCaret={true} id="btn" bsStyle="none" bsSize="xs" className={styles.menuToggle}>
                                    <i
                                        className={classnames("fa fa-xs fa-bars")}
                                    />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {this.menuItems}
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
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
                        <If condition={this.props.chartControls && this.props.chartControls.showComparisonPageIcon}>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Compare groups</span>}
                            >
                                <img src={require("../../../rootImages/compare_vs.png")}
                                     width={13}
                                     style={{marginLeft:4, cursor:"pointer"}}
                                     onClick={this.props.openComparisonPage}
                                />
                            </DefaultTooltip>
                        </If>
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
                               style={{marginRight:4}}
                               aria-hidden="true" onClick={this.props.deleteChart}></i>
                        </DefaultTooltip>
                    </div>
                )}
                {this.active && (
                    <div
                        style={{
                            position:"absolute",
                            top:2,
                            right:2
                        }}
                    >
                        <DownloadControls
                            filename={this.fileName}
                            buttons={this.props.downloadTypes}
                            getSvg={this.props.getSVG}
                            getData={this.props.getData}
                            collapse={true}
                            dontFade={true}
                        />
                    </div>
                )}
            </div>
        );
    }

}