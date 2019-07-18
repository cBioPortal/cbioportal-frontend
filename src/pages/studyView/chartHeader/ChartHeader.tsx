import * as React from "react";
import styles from "./styles.module.scss";
import {If} from 'react-if';
import {ChartType} from "pages/studyView/StudyViewUtils";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import DefaultTooltip from "../../../public-lib/components/defaultTooltip/DefaultTooltip";
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import fileDownload from 'react-file-download';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {IChartContainerDownloadProps} from "../charts/ChartContainer";
import {saveSvgAsPng} from "save-svg-as-png";
import {ChartTypeEnum} from "../StudyViewConfig";
import {ChartMeta, getClinicalAttributeOverlay} from "../StudyViewUtils";
import svgToPdfDownload from "public-lib/lib/svgToPdfDownload";
import {Dropdown, MenuItem} from "react-bootstrap";
import Timer = NodeJS.Timer;
import DownloadControls, {DownloadControlsButton} from "public-lib/components/downloadControls/DownloadControls";
import FlexAlignedCheckbox from "../../../shared/components/FlexAlignedCheckbox";
import {serializeEvent} from "shared/lib/tracking";

// there's some incompatiblity with rc-tooltip and study view layout
// these adjustments force tooltips to open top right because tooltips
// were breaking at far right of page
const tooltipPosition = "topRight";
const tooltipAlign = { offset:[5,-6] };

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    title: string;
    height: number;
    placement: 'left' | 'right',
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
    @observable downloadSubmenuOpen = false;
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
                <li>
                    <a className="dropdown-item logScaleCheckbox"  onClick={this.props.toggleLogScale}>
                        <FlexAlignedCheckbox
                            checked={!!(this.props.chartControls && this.props.chartControls.logScaleChecked)}
                            onClick={this.props.toggleLogScale}
                            label={<span style={{marginTop:-3}}>Log Scale</span>}
                            style={{ marginTop:1, marginBottom:-3 }}
                        />
                    </a>
                </li>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showTableIcon) {
            items.push(
                <li>
                    <a className="dropdown-item"
                        onClick={() => this.props.changeChartType(ChartTypeEnum.TABLE)}
                    >
                        <i className={classnames("fa", "fa-table", styles.menuItemIcon)}
                           aria-hidden="true"
                        />
                        Show Table
                    </a>
                </li>
            );
        }

        if (this.props.chartControls && !!this.props.chartControls.showPieIcon) {
            items.push(
                <li>
                    <a className="dropdown-item"
                        onClick={() => this.props.changeChartType(ChartTypeEnum.PIE_CHART)}
                    >
                        <i className={classnames("fa", "fa-pie-chart", styles.menuItemIcon)}
                           aria-hidden="true"
                        />
                        Show Pie
                    </a>
                </li>
            );
        }

        if (this.props.chartControls && this.props.chartControls.showComparisonPageIcon) {
            items.push(
                <li>
                    <a className="dropdown-item"
                        onClick={this.props.openComparisonPage}

                    >
                        <img src={require("../../../rootImages/compare_vs.svg")}
                             width={13}
                             style={{marginTop:-2}}
                             className={styles.menuItemIcon}
                        />
                        Compare Groups
                    </a>
                </li>
            );
        }

        const downloadSubmenuWidth = 70;
        items.push(
            <li style={{position: 'relative'}}>
                <div className={classnames('dropdown-item', styles.dropdownHoverEffect)}
                   style={{'display': 'flex', justifyContent:'space-between', padding: '3px 20px'}}
                   onMouseEnter={() => this.downloadSubmenuOpen = true}
                   onMouseLeave={() => this.downloadSubmenuOpen = false}
                >
                    <div>
                        <i className={classnames("fa fa-xs", "fa-download", styles.menuItemIcon)}
                           aria-hidden="true"
                        />
                        <span>Download</span>
                    </div>
                    <i className={classnames("fa fa-xs", this.props.placement === 'left' ? 'fa-caret-left' : 'fa-caret-right')}
                       style={{lineHeight: 'inherit'}}/>

                    {this.downloadSubmenuOpen &&
                        <DownloadControls
                            filename={this.fileName}
                            buttons={this.props.downloadTypes}
                            getSvg={this.props.getSVG}
                            getData={this.props.getData}
                            type='dropdown'
                            className={classnames({show: this.downloadSubmenuOpen})}
                            style={{
                                top: 0,
                                margin: '-6px 0',
                                left: this.props.placement === 'left' ? -downloadSubmenuWidth : '100%',
                                minWidth: downloadSubmenuWidth
                            }}
                            dontFade={true}
                        />
                    }
                </div>
            </li>
        );

        return items;
    }

    public render() {
        return (
            <div className={classnames(styles.header, 'chartHeader')}
                 style={{position:"relative", height: `${this.props.height}px`, lineHeight: `${this.props.height}px`}}>
                <div className={classnames(styles.name, styles.draggable)}>
                    {!this.props.hideLabel && <span className='chartTitle'>{this.props.title}</span>}
                </div>
                {this.active && (
                    <div className={classnames(styles.controls, 'controls')}>
                        <div className="btn-group">
                            <If condition={!!this.props.chartMeta.description}>
                                <DefaultTooltip
                                    mouseEnterDelay={0}
                                    trigger={["hover"]}
                                    placement={tooltipPosition}
                                    align={tooltipAlign}
                                    overlay={getClinicalAttributeOverlay(this.props.chartMeta.displayName, this.props.chartMeta.description)}
                                    destroyTooltipOnHide={true}
                                >
                                    <div
                                        className={classnames("btn btn-xs btn-default", styles.item)}
                                    >
                                        <i
                                            className={classnames("fa fa-xs", "fa-info-circle", styles.clickable)}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </DefaultTooltip>
                            </If>
                            <If condition={this.props.chartControls && !!this.props.chartControls.showResetIcon}>
                                <DefaultTooltip
                                    placement={tooltipPosition}
                                    align={tooltipAlign}
                                    overlay={<span>Reset filters in chart</span>}
                                    destroyTooltipOnHide={true}
                                >
                                    <button
                                        className={classnames("btn btn-xs btn-default", styles.item)}
                                        onClick={this.props.resetChart}
                                    >
                                        <i
                                            className={classnames("fa fa-xs", "fa-undo", styles.undo, styles.clickable)}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </DefaultTooltip>
                            </If>
                            <DefaultTooltip
                                placement={tooltipPosition}
                                align={tooltipAlign}
                                overlay={<span>Delete chart</span>}
                            >
                                <button
                                    className={classnames("btn btn-xs btn-default", styles.item)}
                                    onClick={this.props.deleteChart}
                                >
                                    <i className={classnames("fa fa-xs", "fa-times", styles.clickable)}
                                       aria-hidden="true"></i>
                                </button>
                            </DefaultTooltip>
                            {(this.menuItems.length > 0) && (
                                <div
                                    onMouseEnter={this.openMenu}
                                    onMouseLeave={this.closeMenu}
                                    data-test='chart-header-hamburger-icon'
                                    className={classnames("dropdown btn-group", styles.chartMenu, {show:this.menuOpen})}
                                >
                                    <button className={classnames("btn btn-xs btn-default dropdown-toggle", {active:this.menuOpen})}>
                                        <i
                                            className={classnames("fa fa-xs fa-bars")}
                                        />
                                    </button>
                                    <ul data-test='chart-header-hamburger-icon-menu'
                                        className={classnames("dropdown-menu pull-right", {show:this.menuOpen})}>
                                        {this.menuItems}
                                    </ul>
                                </div>
                            )}
                        </div>
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

                    </div>
                )}
            </div>
        );
    }

}
