import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import FixedHeaderTable from 'pages/studyView/table/FixedHeaderTable';
import { action, computed, makeObservable, observable } from 'mobx';
import StudyViewViolinPlot from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlot';
import { ClinicalViolinPlotRowData } from 'cbioportal-ts-api-client';
import {
    ChartDimension,
    STUDY_VIEW_CONFIG,
} from 'pages/studyView/StudyViewConfig';
import { toFixedWithoutTrailingZeros } from 'shared/lib/FormatUtils';
import { SortDirection } from 'react-virtualized';
import { EditableSpan } from 'cbioportal-frontend-commons';
import {
    getDataX,
    getTickValues,
    getViolinX,
    violinPlotXPadding,
} from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotUtils';
import { ClinicalViolinPlotIndividualPoint } from 'cbioportal-ts-api-client';
import classnames from 'classnames';
import styles from 'pages/resultsView/survival/styles.module.scss';
import chartStyles from 'pages/studyView/charts/styles.module.scss';
import { Popover } from 'react-bootstrap';
import * as ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { getSampleViewUrl, getStudySummaryUrl } from 'shared/api/urls';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import tableStyles from '../../table/tables.module.scss';
import { clamp } from 'shared/lib/NumberUtils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

const NUM_SAMPLES_COL_NAME = '#';
const HEADER_HEIGHT = 50;
const FIRST_COLUMN_WIDTH = 120;
const VIOLIN_PLOT_START_X = 143;

export interface IStudyViewViolinPlotTableProps {
    width: number;
    height: number;
    dimension: ChartDimension;
    categoryColumnName: string;
    violinColumnName: string;
    violinBounds: {
        min: number;
        max: number;
    };
    rows: ClinicalViolinPlotRowData[];
    showViolin: boolean;
    showBox: boolean;
    logScale: boolean;
    selectedCategories: string[];
    setFilters: (
        type: 'categorical' | 'numerical',
        values: string[] | { start: number; end: number }
    ) => void;
    isLoading: boolean;
}

@observer
export default class StudyViewViolinPlotTable extends React.Component<
    IStudyViewViolinPlotTableProps,
    {}
> {
    private ref: any;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private setRef(r: any) {
        this.ref = r;
    }

    @observable rangeSelection = {
        mouseX: undefined as undefined | number,
        startX: undefined as undefined | number,
        dragging: false,
        get rectX() {
            return Math.min(this.mouseX, this.startX);
        },
        get rectWidth() {
            return Math.abs(this.mouseX - this.startX);
        },
    };

    @observable tooltipModel: {
        point: ClinicalViolinPlotIndividualPoint;
        category: string;
        mouseX: number;
        mouseY: number;
    } | null = null;
    private tooltipResetTimer: any = null;
    private mouseInTooltip = false;

    @autobind
    private onMouseEnterTooltip() {
        this.mouseInTooltip = true;
    }

    @autobind
    private onMouseLeaveTooltip() {
        this.mouseInTooltip = false;
    }

    @observable sampleNumberFilter = '10';

    @action.bound
    private setSampleNumberFilter(s: string) {
        this.sampleNumberFilter = s;
    }

    private violinX(v: number) {
        return getViolinX(v, this.props.violinBounds, this.violinPlotWidth);
    }
    @computed get violinColumnWidth() {
        const baseViolinWidth = 160; //180;
        let additionalViolinWidth = 0;
        if (this.props.dimension.w > 3) {
            // starting after grid width 3, we will absorb
            //  all grid width increases directly into the violin plot
            additionalViolinWidth =
                (this.props.dimension.w - 3) * STUDY_VIEW_CONFIG.layout.grid.w;
        }
        return baseViolinWidth + additionalViolinWidth;
    }
    @computed get violinPlotWidth() {
        return this.violinColumnWidth - 2 * violinPlotXPadding;
    }

    @action.bound
    private onMouseOverPoint(
        point: ClinicalViolinPlotIndividualPoint,
        mouseX: number,
        mouseY: number,
        category: string
    ) {
        // mouse on point means mouse not in tooltip
        this.onMouseLeaveTooltip();
        // cancel hiding the tooltip
        this.cancelResetTooltip();
        // Only update tooltip if this is not the same point as we're already showing
        if (
            !this.tooltipModel ||
            this.tooltipModel.category !== category ||
            !_.isEqual(this.tooltipModel.point, point)
        ) {
            this.tooltipModel = { point, category, mouseX, mouseY };
        }
    }

    @action.bound
    private onMouseOverBackground() {
        // mouse hovering background means mouse not in tooltip
        this.onMouseLeaveTooltip();
        if (this.tooltipResetTimer === null) {
            // add hide timer if it's not already pending
            this.tooltipResetTimer = setTimeout(() => {
                this.tooltipResetTimer = null;
                if (!this.mouseInTooltip) {
                    this.tooltipModel = null;
                }
            }, 400);
        }
    }

    private cancelResetTooltip() {
        clearTimeout(this.tooltipResetTimer);
        this.tooltipResetTimer = null;
    }

    private isCategorySelected(category: string) {
        return category in this.selectedCategories;
    }

    @action.bound
    private onSelectCategory(category: string) {
        if (this.props.selectedCategories.includes(category)) {
            this.props.setFilters(
                'categorical',
                this.props.selectedCategories.filter(x => x !== category)
            );
        } else {
            this.props.setFilters('categorical', [
                category,
                ...this.props.selectedCategories,
            ]);
        }
    }

    @action.bound
    private onSelectRange(range: { start: number; end: number }) {
        this.props.setFilters('numerical', range);
    }

    @computed get selectedCategories() {
        return _.keyBy(this.props.selectedCategories);
    }

    @computed get columns() {
        return [
            {
                name: this.props.categoryColumnName,
                render: (row: ClinicalViolinPlotRowData) => (
                    <span>{row.category}</span>
                ),
                width: FIRST_COLUMN_WIDTH,
                sortBy: (row: ClinicalViolinPlotRowData) => row.category,
                filter: (
                    row: ClinicalViolinPlotRowData,
                    filterString: string,
                    filterStringUpper: string
                ) => row.category.toUpperCase().includes(filterStringUpper),
                visible: true,
            },
            {
                name: this.props.violinColumnName,
                render: (row: ClinicalViolinPlotRowData, rowIndex: number) => {
                    return (
                        <StudyViewViolinPlot
                            curveMagnitudes={row.curveData}
                            violinBounds={this.props.violinBounds}
                            individualPoints={row.individualPoints}
                            boxData={row.boxData}
                            showViolin={this.props.showViolin}
                            showBox={this.props.showBox}
                            width={this.violinColumnWidth}
                            gridValues={this.gridTicks}
                            onMouseOverPoint={(p, x, y) =>
                                this.onMouseOverPoint(p, x, y, row.category)
                            }
                            onMouseOverBackground={this.onMouseOverBackground}
                        />
                    );
                },
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.median,
                width: this.violinColumnWidth,
                visible: true,
            },
            {
                name: NUM_SAMPLES_COL_NAME,
                render: (row: ClinicalViolinPlotRowData) => (
                    <LabeledCheckbox
                        checked={this.isCategorySelected(row.category)}
                        onChange={() => this.onSelectCategory(row.category)}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                            },
                        }}
                        inputProps={{
                            className: tableStyles.autoMarginCheckbox,
                        }}
                    >
                        <span data-test={'fixedHeaderTableRightJustified'}>
                            {row.numSamples}
                        </span>
                    </LabeledCheckbox>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.numSamples,
                visible: true,
                width: 60,
            },
            {
                name: 'Median',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.median, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.median,
                visible: this.props.dimension.w > 2,
                width: 42,
            },
            {
                name: 'Quartile 1',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.q1, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.q1,
                visible: this.props.dimension.w > 2,
                width: 50,
            },
            {
                name: 'Quartile 3',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.q3, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.q3,
                visible: this.props.dimension.w > 2,
                width: 50,
            },
        ].filter(c => c.visible);
    }

    @computed get gridLabelsOffset() {
        if (this.props.dimension.w > 2) {
            return 140;
        } else {
            return 139;
        }
    }

    @computed get gridTicks() {
        return getTickValues(
            this.props.violinBounds,
            this.props.dimension.w,
            this.props.logScale
        );
    }
    renderGridLabels() {
        return (
            <svg
                style={{
                    // We position the grid labels manually at the top of the violin column
                    //  because it's too hard to put them into the column through the
                    //  table library
                    position: 'absolute',
                    top: 52,
                }}
                width={this.props.width}
                height={20}
            >
                <rect width={this.props.width} height={20} fill={'#ffffff'} />
                <g transform={`translate(${this.gridLabelsOffset},0)`}>
                    {this.gridTicks.map((val, index) => {
                        const x = this.violinX(val);
                        return (
                            <text
                                x={x}
                                y={15}
                                textAnchor={'middle'}
                                fill={'#aaa'}
                                fontSize={10}
                            >
                                {this.props.logScale
                                    ? toFixedWithoutTrailingZeros(
                                          Math.exp(val) - 1,
                                          1
                                      )
                                    : val}
                            </text>
                        );
                    })}
                </g>
            </svg>
        );
    }

    @computed get data() {
        return this.props.rows.filter(
            row => row.numSamples >= parseFloat(this.sampleNumberFilter)
        );
    }

    @computed get extraFooterElements() {
        const ret = [
            <div
                style={{
                    border: '1px solid #cccccc',
                    padding: '1px 4px 1px 4px',
                    borderRadius: 4,
                }}
            >
                <span>{`Hide # <`}</span>
                <EditableSpan
                    value={this.sampleNumberFilter}
                    setValue={this.setSampleNumberFilter}
                    style={{
                        width: 50,
                        marginTop: 0,
                        marginLeft: 5,
                        lineHeight: '15px',
                    }}
                    numericOnly={true}
                    textFieldAppearance={true}
                />
            </div>,
        ];
        return ret;
    }

    private renderTooltip() {
        const model = this.tooltipModel;
        if (!model) {
            return null;
        }
        return (ReactDOM as any).createPortal(
            <Popover
                arrowOffsetTop={17}
                className={classnames(
                    'cbioportal-frontend',
                    'cbioTooltip',
                    styles.Tooltip
                )}
                positionLeft={model.mouseX + 7}
                positionTop={model.mouseY - 19}
                onMouseEnter={this.onMouseEnterTooltip}
                onMouseLeave={this.onMouseLeaveTooltip}
            >
                <b>Study ID:</b>
                {` `}
                <a href={getStudySummaryUrl(model.point.studyId)}>
                    {model.point.studyId}
                </a>
                <br />
                <b>Sample ID:</b>
                {` `}
                <a
                    href={getSampleViewUrl(
                        model.point.studyId,
                        model.point.sampleId
                    )}
                >
                    {model.point.sampleId}
                </a>
                <br />
                <b>{this.props.violinColumnName}:</b>
                {` `}
                {model.point.value}
            </Popover>,
            document.body
        );
    }
    @action.bound onScroll() {
        // hide tooltip on scroll
        this.tooltipModel = null;
        this.cancelResetTooltip();
    }

    private renderRangeSelectUI() {
        if (!this.mouseInteractionPossible) {
            return null;
        }
        if (this.rangeSelection.dragging) {
            return (
                <div
                    style={{
                        top: 73,
                        height: this.props.height - HEADER_HEIGHT,
                        position: 'absolute',
                        background: '#ccc',
                        left: this.rangeSelection.rectX,
                        width: this.rangeSelection.rectWidth,
                        zIndex: 100,
                        opacity: 0.3,
                    }}
                />
            );
        } else if (this.rangeSelection.mouseX !== undefined) {
            return (
                <div
                    style={{
                        top: 73,
                        height: this.props.height - HEADER_HEIGHT,
                        position: 'absolute',
                        left: this.rangeSelection.mouseX,
                        borderLeft: '1px dashed #999',
                        width: 1,
                        zIndex: 100,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                />
            );
        }
    }

    @computed get mouseInteractionPossible() {
        return !this.props.isLoading && this.data.length > 0;
    }

    private handlers = {
        isMouseInside: (mouseX: number) => {
            return (
                mouseX >= VIOLIN_PLOT_START_X - 3 &&
                mouseX <=
                    VIOLIN_PLOT_START_X +
                        this.violinColumnWidth -
                        2 * violinPlotXPadding +
                        3
            );
        },
        onMouseMove: action((e: any) => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            const elementX = this.ref!.getBoundingClientRect().x;
            const mouseX = e.pageX - elementX;
            if (this.handlers.isMouseInside(mouseX)) {
                this.rangeSelection.mouseX = mouseX;
            } else {
                if (this.rangeSelection.dragging) {
                    this.handlers.onMouseUp();
                } else {
                    this.handlers.onMouseLeave();
                }
            }
        }),
        onMouseLeave: action(() => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            this.rangeSelection.mouseX = undefined;
            this.rangeSelection.dragging = false;
        }),
        onMouseDown: action((e: any) => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            const elementX = this.ref!.getBoundingClientRect().x;
            const mouseX = e.pageX - elementX;
            if (this.handlers.isMouseInside(mouseX)) {
                this.rangeSelection.startX = mouseX;
                this.rangeSelection.dragging = true;
            }
        }),
        onMouseUp: action(() => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            this.rangeSelection.dragging = false;
            if (this.rangeSelection.rectWidth > 5) {
                // execute zoom
                let start = clamp(
                    getDataX(
                        this.rangeSelection.rectX - VIOLIN_PLOT_START_X + 4,
                        this.props.violinBounds,
                        this.violinPlotWidth
                    ),
                    this.props.violinBounds.min,
                    this.props.violinBounds.max
                );
                let end = clamp(
                    getDataX(
                        this.rangeSelection.rectX +
                            this.rangeSelection.rectWidth -
                            VIOLIN_PLOT_START_X +
                            4,
                        this.props.violinBounds,
                        this.violinPlotWidth
                    ),
                    this.props.violinBounds.min,
                    this.props.violinBounds.max
                );
                if (this.props.logScale) {
                    start = Math.exp(start) - 1;
                    end = Math.exp(end) - 1;
                }
                this.onSelectRange({ start, end });
            }
        }),
    };
    private renderLoadingIndicator() {
        if (!this.props.isLoading) {
            return null;
        }
        return (
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: this.props.width,
                    height: this.props.height + 50,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: this.props.height + 2,
                        top: 20,
                        background: '#fff',
                        left: 0,
                        opacity: 0.8,
                    }}
                />

                <LoadingIndicator
                    centerRelativeToContainer={true}
                    isLoading={true}
                    className={chartStyles.chartLoader}
                />
            </div>
        );
    }

    render() {
        return (
            <div
                ref={this.setRef}
                onMouseMove={this.handlers.onMouseMove}
                onMouseLeave={this.handlers.onMouseLeave}
                onMouseDown={this.handlers.onMouseDown}
                onMouseUp={this.handlers.onMouseUp}
                className={this.rangeSelection.dragging ? 'noselect' : ''}
            >
                <>
                    <FixedHeaderTable
                        columns={this.columns}
                        data={this.data}
                        headerHeight={HEADER_HEIGHT}
                        headerClassName={'violinPlotTableHeader'}
                        rowHeight={30}
                        width={this.props.width}
                        height={this.props.height}
                        sortBy={NUM_SAMPLES_COL_NAME}
                        sortDirection={'desc'}
                        extraFooterElements={this.extraFooterElements}
                        onScroll={this.onScroll}
                    />
                    {this.renderGridLabels()}
                    {this.renderRangeSelectUI()}
                    {this.renderTooltip()}
                    {this.renderLoadingIndicator()}
                </>
                {this.data.length === 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 70,
                            width: this.props.width,
                            height: this.props.height - 70,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        No data.
                    </div>
                )}
            </div>
        );
    }
}
