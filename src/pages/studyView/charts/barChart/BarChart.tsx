import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictorySelectionContainer,
} from 'victory';
import { computed, observable } from 'mobx';
import _ from 'lodash';
import CBIOPORTAL_VICTORY_THEME from 'shared/theme/cBioPoralTheme';
import {
    ClinicalDataFilterValue,
    DataBin,
} from 'shared/api/generated/CBioPortalAPIInternal';
import { AbstractChart } from 'pages/studyView/charts/ChartContainer';
import autobind from 'autobind-decorator';
import BarChartAxisLabel from './BarChartAxisLabel';
import {
    filterCategoryBins,
    filterNumericalBins,
    formatNumericalTickValues,
    generateCategoricalData,
    generateNumericalData,
    needAdditionShiftForLogScaleBarChart,
} from '../../StudyViewUtils';
import { STUDY_VIEW_CONFIG } from '../../StudyViewConfig';
import {
    getTextDiagonal,
    getTextHeight,
    getTextWidth,
} from 'cbioportal-frontend-commons';
import { DEFAULT_NA_COLOR } from 'shared/lib/Colors';
import BarChartToolTip, { ToolTipModel } from './BarChartToolTip';
import WindowStore from 'shared/components/window/WindowStore';
import ReactDOM from 'react-dom';

export interface IBarChartProps {
    data: DataBin[];
    width: number;
    height: number;
    filters: ClinicalDataFilterValue[];
    onUserSelection: (dataBins: DataBin[]) => void;
}

export type BarDatum = {
    x: number;
    y: number;
    dataBin: DataBin;
};

function generateTheme() {
    const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
    theme.axis.style.tickLabels.fontSize *= 0.85;

    return theme;
}

const VICTORY_THEME = generateTheme();
const TILT_ANGLE = 50;

@observer
export default class BarChart extends React.Component<IBarChartProps, {}>
    implements AbstractChart {
    private svgContainer: any;

    @observable.ref
    private mousePosition = { x: 0, y: 0 };

    @observable
    private currentBarIndex = -1;

    @observable
    private toolTipModel: ToolTipModel | null = null;

    constructor(props: IBarChartProps) {
        super(props);
    }

    @autobind
    private onSelection(
        bars: { data: BarDatum[] }[],
        bounds: { x: number; y: number }[],
        props: any
    ) {
        const dataBins = _.flatten(
            bars.map(bar => bar.data.map(barDatum => barDatum.dataBin))
        );
        this.props.onUserSelection(dataBins);
    }

    private isDataBinSelected(
        dataBin: DataBin,
        filters: ClinicalDataFilterValue[]
    ) {
        return _.some(filters, filter => {
            let isFiltered = false;
            if (filter.start !== undefined && filter.end !== undefined) {
                isFiltered =
                    filter.start <= dataBin.start && filter.end >= dataBin.end;
            } else if (filter.start !== undefined && filter.end === undefined) {
                isFiltered = dataBin.start >= filter.start;
            } else if (filter.start === undefined && filter.end !== undefined) {
                isFiltered = dataBin.end <= filter.end;
            } else {
                isFiltered =
                    filter.value !== undefined &&
                    filter.value === dataBin.specialValue;
            }
            return isFiltered;
        });
    }

    public toSVGDOMNode(): Element {
        return this.svgContainer.firstChild;
    }

    @computed
    get numericalBins() {
        return filterNumericalBins(this.props.data);
    }

    @computed
    get categoryBins() {
        return filterCategoryBins(this.props.data);
    }

    @computed
    get numericalData(): BarDatum[] {
        return generateNumericalData(this.numericalBins);
    }

    @computed
    get categoricalData(): BarDatum[] {
        return generateCategoricalData(
            this.categoryBins,
            this.numericalTickFormat.length
        );
    }

    @computed
    get numericalTickFormat() {
        const formatted = formatNumericalTickValues(this.numericalBins);

        // if the value contains ^ we need to return an array of values, instead of a single value
        // to be compatible with BarChartAxisLabel
        return formatted.map(value =>
            value.includes('^') ? value.split('^') : value
        );
    }

    @computed
    get barData(): BarDatum[] {
        return [...this.numericalData, ...this.categoricalData];
    }

    @computed
    get categories() {
        return this.categoryBins.map(dataBin =>
            dataBin.specialValue === undefined
                ? `${dataBin.start}`
                : dataBin.specialValue
        );
    }

    @computed
    get tickValues() {
        const values: number[] = [];

        for (
            let i = 1;
            i <= this.numericalTickFormat.length + this.categories.length;
            i++
        ) {
            values.push(i);
        }

        return values;
    }

    @computed
    get tickFormat() {
        // copy non-numerical categories as is
        return [...this.numericalTickFormat, ...this.categories];
    }

    @computed
    get bottomPadding(): number {
        const MAX_PADDING = 40;
        const MIN_PADDING = 10; // used when tickFormat is empty
        const padding =
            _.max(
                this.tickFormat.map((tick: string | string[]) => {
                    const content = _.isArray(tick) ? tick.join() : tick;
                    const fontFamily =
                        VICTORY_THEME.axis.style.tickLabels.fontFamily;
                    const fontSize = `${VICTORY_THEME.axis.style.tickLabels.fontSize}px`;
                    const textHeight = getTextHeight(
                        content,
                        fontFamily,
                        fontSize
                    );
                    const textWidth = getTextWidth(
                        content,
                        fontFamily,
                        fontSize
                    );
                    const textDiagonal = getTextDiagonal(textHeight, textWidth);
                    return (
                        10 +
                        textDiagonal * Math.sin((Math.PI * TILT_ANGLE) / 180)
                    );
                })
            ) || MIN_PADDING;
        return padding > MAX_PADDING ? MAX_PADDING : padding;
    }

    @computed
    get barRatio(): number {
        // In log scale bar chart, when the first bin is .5 exponential, the bars will be shifted to the right
        // for one bar. We need to adjust the bar ratio since it's calculated based on the range / # of bars
        const additionRatio = needAdditionShiftForLogScaleBarChart(
            this.numericalBins
        )
            ? this.barData.length / (this.barData.length + 1)
            : 1;
        return additionRatio * STUDY_VIEW_CONFIG.thresholds.barRatio;
    }

    @autobind
    private onMouseMove(event: React.MouseEvent<any>): void {
        this.mousePosition = { x: event.pageX, y: event.pageY };
    }

    /*
     * Supplies the BarPlot with the event handlers needed to record when the mouse enters
     * or leaves a bar on the plot.
     */
    private get barPlotEvents() {
        const self = this;
        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseEnter: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (event: any) => {
                                    self.currentBarIndex = event.datum.eventKey;
                                    self.toolTipModel = {
                                        start:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.start,
                                        end:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.end,
                                        special:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.specialValue,
                                        sampleCount: event.datum.y,
                                    };
                                },
                            },
                        ];
                    },
                    onMouseLeave: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    self.toolTipModel = null;
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    public render() {
        return (
            <div onMouseMove={this.onMouseMove}>
                {this.barData.length > 0 && (
                    <VictoryChart
                        containerComponent={
                            <VictorySelectionContainer
                                containerRef={(ref: any) =>
                                    (this.svgContainer = ref)
                                }
                                selectionDimension="x"
                                onSelection={this.onSelection}
                            />
                        }
                        style={{
                            parent: {
                                width: this.props.width,
                                height: this.props.height,
                            },
                        }}
                        height={this.props.height - this.bottomPadding}
                        padding={{
                            left: 40,
                            right: 20,
                            top: 10,
                            bottom: this.bottomPadding,
                        }}
                        theme={VICTORY_THEME}
                    >
                        <VictoryAxis
                            tickValues={this.tickValues}
                            tickFormat={(t: number) => this.tickFormat[t - 1]}
                            domain={[
                                0,
                                this.tickValues[this.tickValues.length - 1] + 1,
                            ]}
                            tickLabelComponent={<BarChartAxisLabel />}
                            style={{
                                tickLabels: {
                                    angle: TILT_ANGLE,
                                    verticalAnchor: 'start',
                                    textAnchor: 'start',
                                },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis={true}
                            tickFormat={(t: number) =>
                                Number.isInteger(t) ? t.toFixed(0) : ''
                            }
                        />
                        <VictoryBar
                            barRatio={this.barRatio}
                            style={{
                                data: {
                                    fill: (d: BarDatum) =>
                                        this.isDataBinSelected(
                                            d.dataBin,
                                            this.props.filters
                                        ) || this.props.filters.length === 0
                                            ? STUDY_VIEW_CONFIG.colors.theme
                                                  .primary
                                            : DEFAULT_NA_COLOR,
                                },
                            }}
                            data={this.barData}
                            events={this.barPlotEvents}
                        />
                    </VictoryChart>
                )}
                {ReactDOM.createPortal(
                    <BarChartToolTip
                        mousePosition={this.mousePosition}
                        windowWidth={WindowStore.size.width}
                        model={this.toolTipModel}
                        totalBars={this.barData.length}
                        currentBarIndex={this.currentBarIndex}
                    />,
                    document.body
                )}
            </div>
        );
    }
}
