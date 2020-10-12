import * as React from 'react';
import styles from './styles.module.scss';
import { If } from 'react-if';
import {
    ChartType,
    NumericalGroupComparisonType,
} from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import { ChartTypeEnum } from '../StudyViewConfig';
import { ChartMeta, getClinicalAttributeOverlay } from '../StudyViewUtils';
import {
    DataType,
    DefaultTooltip,
    DownloadControls,
    DownloadControlsButton,
} from 'cbioportal-frontend-commons';
import FlexAlignedCheckbox from '../../../shared/components/FlexAlignedCheckbox';
import CustomBinsModal from 'pages/studyView/charts/barChart/CustomBinsModal';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';
import { getHugoGeneSymbols } from 'pages/studyView/StudyViewComparisonUtils';

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    chartType: ChartType;
    store: StudyViewPageStore;
    title: string;
    height: number;
    placement: 'left' | 'right';
    active: boolean;
    resetChart: () => void;
    deleteChart: () => void;
    selectedRowsKeys?: string[];
    toggleLogScale?: () => void;
    hideLabel?: boolean;
    chartControls?: ChartControls;
    changeChartType: (chartType: ChartType) => void;
    getSVG?: () => Promise<SVGElement | null>;
    getData?:
        | ((dataType?: DataType) => Promise<string | null>)
        | ((dataType?: DataType) => string);
    downloadTypes?: DownloadControlsButton[];
    description?: ISurvivalDescription;
    openComparisonPage: (params: {
        categorizationType?: NumericalGroupComparisonType;
        hugoGeneSymbols?: string[];
        treatmentUniqueKeys?: string[];
    }) => void;
}

export interface ChartControls {
    showResetIcon?: boolean;
    showTableIcon?: boolean;
    showPieIcon?: boolean;
    showComparisonPageIcon?: boolean;
    showLogScaleToggle?: boolean;
    logScaleChecked?: boolean;
}

@observer
export class ChartHeader extends React.Component<IChartHeaderProps, {}> {
    @observable menuOpen = false;
    @observable downloadSubmenuOpen = false;
    @observable comparisonSubmenuOpen = false;
    @observable showCustomBinModal: boolean = false;
    private closeMenuTimeout: number | undefined = undefined;

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
            this.closeMenuTimeout = window.setTimeout(() => {
                this.menuOpen = false;
                this.closeMenuTimeout = undefined;
            }, 125);
        }
    }

    @computed get active() {
        return this.menuOpen || this.props.active;
    }

    @computed get comparisonButton() {
        const submenuWidth = 120;
        switch (this.props.chartType) {
            case ChartTypeEnum.BAR_CHART:
                return (
                    <div
                        className={classnames(
                            'dropdown-item',
                            styles.dropdownHoverEffect
                        )}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 20px',
                        }}
                        onMouseEnter={() => (this.comparisonSubmenuOpen = true)}
                        onMouseLeave={() =>
                            (this.comparisonSubmenuOpen = false)
                        }
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ComparisonVsIcon
                                className={classnames(
                                    'fa fa-fw',
                                    styles.menuItemIcon
                                )}
                            />
                            <span>Compare Groups</span>
                        </div>
                        <i
                            className={'fa fa-xs fa-fw fa-caret-right'}
                            style={{ lineHeight: 'inherit' }}
                        />

                        {this.comparisonSubmenuOpen && (
                            <ul
                                className={classnames('dropdown-menu', {
                                    show: this.comparisonSubmenuOpen,
                                })}
                                style={{
                                    top: 0,
                                    margin: '-6px 0',
                                    left:
                                        this.props.placement === 'left'
                                            ? -submenuWidth
                                            : '100%',
                                    minWidth: submenuWidth,
                                }}
                            >
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() => {
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.QUARTILES,
                                            });
                                        }}
                                    >
                                        Quartiles
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() => {
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.MEDIAN,
                                            });
                                        }}
                                    >
                                        Median
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() =>
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.BINS,
                                            })
                                        }
                                    >
                                        Current bins
                                    </a>
                                </li>
                            </ul>
                        )}
                    </div>
                );
            case ChartTypeEnum.MUTATED_GENES_TABLE:
            case ChartTypeEnum.CNA_GENES_TABLE:
                return (
                    <a
                        className={classnames('dropdown-item', {
                            [styles.disabledMenuItem]:
                                this.props.selectedRowsKeys!.length < 2,
                        })}
                        onClick={() => {
                            const hugoGeneSymbols = getHugoGeneSymbols(
                                this.props.chartType,
                                this.props.selectedRowsKeys!
                            );
                            if (this.props.selectedRowsKeys!.length >= 2) {
                                this.props.openComparisonPage({
                                    hugoGeneSymbols: hugoGeneSymbols.slice(), // slice() gets rid of mobx wrapping which messes up API calls
                                });
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames(
                                'fa fa-fw',
                                styles.menuItemIcon
                            )}
                        />
                        Compare Groups
                    </a>
                );
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                return (
                    <a
                        className={classnames('dropdown-item', {
                            [styles.disabledMenuItem]:
                                this.props.selectedRowsKeys!.length < 2,
                        })}
                        onClick={() => {
                            const treatmentUniqueKeys = this.props
                                .selectedRowsKeys!;
                            if (treatmentUniqueKeys.length >= 2) {
                                this.props.openComparisonPage({
                                    treatmentUniqueKeys: treatmentUniqueKeys.slice(), // slice() gets rid of mobx wrapping which messes up API calls
                                });
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames(
                                'fa fa-fw',
                                styles.menuItemIcon
                            )}
                        />
                        Compare Groups
                    </a>
                );
            default:
                return (
                    <a
                        className="dropdown-item"
                        onClick={() => this.props.openComparisonPage({})}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames(
                                'fa fa-fw',
                                styles.menuItemIcon
                            )}
                        />
                        Compare Groups
                    </a>
                );
        }
    }

    @computed get menuItems() {
        const items = [];
        if (
            this.props.chartControls &&
            !!this.props.chartControls.showLogScaleToggle
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item logScaleCheckbox"
                        onClick={this.props.toggleLogScale}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.logScaleChecked
                                )
                            }
                            onClick={this.props.toggleLogScale}
                            label={
                                <span style={{ marginTop: -3 }}>Log Scale</span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            !!this.props.chartControls.showTableIcon
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() =>
                            this.props.changeChartType(ChartTypeEnum.TABLE)
                        }
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-table',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Show Table
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            !!this.props.chartControls.showPieIcon
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() =>
                            this.props.changeChartType(ChartTypeEnum.PIE_CHART)
                        }
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-pie-chart',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Show Pie
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            this.props.chartControls.showComparisonPageIcon
        ) {
            items.push(
                <li style={{ position: 'relative' }}>
                    {this.comparisonButton}
                </li>
            );
        }

        if (this.props.chartType === ChartTypeEnum.BAR_CHART) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() => (this.showCustomBinModal = true)}
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-bar-chart',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Custom Bins
                    </a>
                    <CustomBinsModal
                        show={this.showCustomBinModal}
                        onHide={() => (this.showCustomBinModal = false)}
                        chartMeta={this.props.chartMeta}
                        currentBins={this.props.store.getCurrentBins(
                            this.props.chartMeta
                        )}
                        updateCustomBins={this.props.store.updateCustomBins}
                    />
                </li>
            );
        }

        if (
            this.props.chartControls &&
            this.props.downloadTypes &&
            this.props.downloadTypes.length > 0
        ) {
            const downloadSubmenuWidth = 70;
            items.push(
                <li style={{ position: 'relative' }}>
                    <div
                        className={classnames(
                            'dropdown-item',
                            styles.dropdownHoverEffect
                        )}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 20px',
                        }}
                        onMouseEnter={() => (this.downloadSubmenuOpen = true)}
                        onMouseLeave={() => (this.downloadSubmenuOpen = false)}
                    >
                        <div>
                            <i
                                className={classnames(
                                    'fa fa-xs',
                                    'fa-download',
                                    styles.menuItemIcon
                                )}
                                aria-hidden="true"
                            />
                            <span>Download</span>
                        </div>
                        <i
                            className={'fa fa-xs fa-fw fa-caret-right'}
                            style={{ lineHeight: 'inherit' }}
                        />

                        {this.downloadSubmenuOpen && (
                            <DownloadControls
                                filename={this.fileName}
                                buttons={this.props.downloadTypes}
                                getSvg={this.props.getSVG}
                                getData={this.props.getData}
                                type="dropdown"
                                className={classnames({
                                    show: this.downloadSubmenuOpen,
                                })}
                                style={{
                                    top: 0,
                                    margin: '-6px 0',
                                    left:
                                        this.props.placement === 'left'
                                            ? -downloadSubmenuWidth
                                            : '100%',
                                    minWidth: downloadSubmenuWidth,
                                }}
                                dontFade={true}
                            />
                        )}
                    </div>
                </li>
            );
        }
        return items;
    }

    // there's some incompatiblity with rc-tooltip and study view layout
    // these adjustments force tooltips to open on different directions because tooltips
    // were breaking at far right of page
    @computed
    get tooltipPosition() {
        return this.props.placement == 'left' ? 'topRight' : 'top';
    }

    @computed
    get tooltipAlign() {
        return this.props.placement == 'left' ? { offset: [0, -6] } : undefined;
    }

    public render() {
        return (
            <div
                className={classnames(styles.header, 'chartHeader')}
                style={{
                    position: 'relative',
                    height: `${this.props.height}px`,
                    lineHeight: `${this.props.height}px`,
                }}
            >
                <div className={classnames(styles.name, styles.draggable)}>
                    {!this.props.hideLabel && (
                        <span className="chartTitle">{this.props.title}</span>
                    )}
                </div>
                {this.active && (
                    <div className={classnames(styles.controls, 'controls')}>
                        <div className="btn-group">
                            <If condition={!!this.props.description}>
                                <DefaultTooltip
                                    mouseEnterDelay={0}
                                    trigger={['hover']}
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={getClinicalAttributeOverlay(
                                        this.props.title,
                                        this.props.description
                                            ? this.props.description.description
                                            : '',
                                        this.props.chartMeta.uniqueKey
                                    )}
                                    destroyTooltipOnHide={true}
                                >
                                    <div
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-info-circle'
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </DefaultTooltip>
                            </If>
                            <If
                                condition={
                                    !!this.props.chartMeta.clinicalAttribute ||
                                    !!this.props.chartMeta.description
                                }
                            >
                                <DefaultTooltip
                                    mouseEnterDelay={0}
                                    trigger={['hover']}
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={getClinicalAttributeOverlay(
                                        this.props.chartMeta.displayName,
                                        this.props.chartMeta.description,
                                        this.props.chartMeta.clinicalAttribute
                                            ? this.props.chartMeta
                                                  .clinicalAttribute
                                                  .clinicalAttributeId
                                            : undefined
                                    )}
                                    destroyTooltipOnHide={true}
                                >
                                    <div
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-info-circle'
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </DefaultTooltip>
                            </If>
                            <If
                                condition={
                                    this.props.chartControls &&
                                    !!this.props.chartControls.showResetIcon
                                }
                            >
                                <DefaultTooltip
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={
                                        <span>Reset filters in chart</span>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <button
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                        onClick={this.props.resetChart}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-undo',
                                                styles.undo,
                                                styles.clickable
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </DefaultTooltip>
                            </If>
                            <DefaultTooltip
                                placement={this.tooltipPosition}
                                align={this.tooltipAlign}
                                overlay={<span>Delete chart</span>}
                            >
                                <button
                                    className={classnames(
                                        'btn btn-xs btn-default',
                                        styles.item
                                    )}
                                    onClick={this.props.deleteChart}
                                >
                                    <i
                                        className={classnames(
                                            'fa fa-xs fa-fw',
                                            'fa-times',
                                            styles.clickable
                                        )}
                                        aria-hidden="true"
                                    ></i>
                                </button>
                            </DefaultTooltip>
                            {this.menuItems.length > 0 && (
                                <div
                                    onMouseEnter={this.openMenu}
                                    onMouseLeave={this.closeMenu}
                                    data-test="chart-header-hamburger-icon"
                                    className={classnames(
                                        'dropdown btn-group',
                                        { show: this.menuOpen }
                                    )}
                                >
                                    <button
                                        className={classnames(
                                            'btn btn-xs btn-default dropdown-toggle',
                                            { active: this.menuOpen }
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw fa-bars'
                                            )}
                                        />
                                    </button>
                                    <ul
                                        data-test="chart-header-hamburger-icon-menu"
                                        className={classnames(
                                            'dropdown-menu pull-right',
                                            { show: this.menuOpen }
                                        )}
                                        style={{ width: '190px' }}
                                    >
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
                            position: 'absolute',
                            top: 2,
                            right: 2,
                        }}
                    ></div>
                )}
            </div>
        );
    }
}
