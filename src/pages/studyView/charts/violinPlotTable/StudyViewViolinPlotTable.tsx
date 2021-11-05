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
    getTickValues,
    getViolinX,
    violinPlotXPadding,
} from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotUtils';
import { scaleLinear, scaleLog } from 'd3-scale';

const NUM_SAMPLES_COL_NAME = '#';

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
}

@observer
export default class StudyViewViolinPlotTable extends React.Component<
    IStudyViewViolinPlotTableProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @observable sampleNumberFilter = '10';

    @action.bound
    private setSampleNumberFilter(s: string) {
        this.sampleNumberFilter = s;
    }

    private violinX(v: number) {
        return getViolinX(
            v,
            this.props.violinBounds,
            this.violinColumnWidth - 2 * violinPlotXPadding
        );
    }
    @computed get violinColumnWidth() {
        return (
            180 +
            (this.props.dimension.w > 3
                ? STUDY_VIEW_CONFIG.layout.grid.w *
                  (1 + (this.props.dimension.w - 4))
                : 0)
        );
    }
    @computed get columns() {
        return [
            {
                name: this.props.categoryColumnName,
                render: (row: ClinicalViolinPlotRowData) => (
                    <span>{row.category}</span>
                ),
                width: 120,
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
                    <span className={'fixedHeaderTableRightJustified'}>
                        {row.numSamples}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.numSamples,
                visible: true,
                width: 42,
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
                    position: 'absolute',
                    top: 52,
                }}
                width={this.props.width}
                height={20}
            >
                <rect width={this.props.width} height={20} fill={'white'} />
                <g transform={`translate(${this.gridLabelsOffset},0)`}>
                    {this.gridTicks.map((val, index) => {
                        const x = this.violinX(val);
                        const textX = x - 2;
                        return (
                            <>
                                <line
                                    x1={x}
                                    x2={textX}
                                    y1={20}
                                    y2={17}
                                    stroke={'#aaa'}
                                    strokeWidth={1}
                                />
                                <text
                                    x={textX}
                                    y={15}
                                    textAnchor={'end'}
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
                            </>
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

    render() {
        return (
            <>
                <FixedHeaderTable
                    columns={this.columns}
                    data={this.data}
                    headerHeight={50}
                    headerClassName={'violinPlotTableHeader'}
                    rowHeight={30}
                    width={this.props.width}
                    height={this.props.height}
                    sortBy={NUM_SAMPLES_COL_NAME}
                    sortDirection={'desc'}
                    extraFooterElements={this.extraFooterElements}
                />
                {this.renderGridLabels()}
            </>
        );
    }
}
