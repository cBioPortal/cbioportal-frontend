import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLabel,
    VictorySelectionContainer,
} from 'victory';
import { computed, observable, makeObservable } from 'mobx';
import _ from 'lodash';
import { DataFilterValue } from 'cbioportal-ts-api-client';
import { AbstractChart } from 'pages/studyView/charts/ChartContainer';
import autobind from 'autobind-decorator';
import CategoryBarChartAxisLabel from './CategoryBarChartAxisLabel';
import {
    clinicalDataToDataBin,
    BarDatum,
    DataBin,
    onlyContainsNA,
    doesNotContainNA,
    isDataBinSelected,
    ClinicalDataCountSummary,
    CategoryDataBin,
    generateCategoricalBarData,
} from '../../StudyViewUtils';
import { STUDY_VIEW_CONFIG } from '../../StudyViewConfig';
import { DEFAULT_NA_COLOR } from 'shared/lib/Colors';
import BarChartToolTip from '../barChart/BarChartToolTip';
import { ToolTipModel } from '../barChart/BarChartToolTip';
import WindowStore from 'shared/components/window/WindowStore';
import ReactDOM from 'react-dom';
import { calcPlotBottomPadding } from 'cbioportal-frontend-commons';
import { VICTORY_THEME, TILT_ANGLE } from '../barChart/BarChart';

export interface IBarChartProps {
    data: ClinicalDataCountSummary[];
    width: number;
    height: number;
    filters: DataFilterValue[];
    onUserSelection: (dataBins: DataBin[]) => void;
    showNAChecked: boolean;
}

@observer
export default class CategoryBarChart
    extends React.Component<IBarChartProps, {}>
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
        makeObservable(this);
    }

    @autobind
    private onSelection(bars: { data: BarDatum[] }[]): void {
        const dataBins = _(bars)
            .map(bar => bar.data)
            .flatten()
            .map(barDatum => barDatum.dataBin)
            .value();
        this.props.onUserSelection(dataBins);
    }

    public toSVGDOMNode(): Element {
        return this.svgContainer.firstChild;
    }

    @computed
    get categoryBins(): CategoryDataBin[] {
        return clinicalDataToDataBin(this.props.data);
    }

    @computed
    get categoricalData(): BarDatum[] {
        return generateCategoricalBarData(this.categoryBins, 0);
    }

    @computed
    get barData(): BarDatum[] {
        return [...this.categoricalData];
    }

    @computed
    get barDataBasedOnNA(): BarDatum[] {
        return this.props.showNAChecked
            ? this.barData
            : this.barData.filter(doesNotContainNA);
    }

    @computed
    get categories(): string[] {
        return this.categoryBins.map(dataBin => dataBin.specialValue);
    }

    @computed
    get tickValues(): number[] {
        const values = [];
        for (let i = 1; i <= this.categories.length; i++) {
            values.push(i);
        }
        return values;
    }

    @computed
    get barDataWithNA(): BarDatum[] {
        return this.barData.filter(onlyContainsNA);
    }

    @computed
    get numberOfNA(): number {
        return this.barDataWithNA.length;
    }

    @computed
    get tickValuesBasedOnNA(): number[] {
        if (this.props.showNAChecked || !this.numberOfNA) {
            return this.tickValues;
        }
        const tickValuesWithoutNA = this.tickValues.slice(0, -this.numberOfNA);
        return tickValuesWithoutNA;
    }

    @computed
    get tickFormat(): (string | string[])[] {
        return [...this.categories];
    }

    @computed
    get bottomPadding(): number {
        return calcPlotBottomPadding(
            VICTORY_THEME.axis.style.tickLabels.fontFamily,
            VICTORY_THEME.axis.style.tickLabels.fontSize,
            this.tickFormat,
            TILT_ANGLE,
            30,
            10
        );
    }

    @computed
    get barRatio(): number {
        return STUDY_VIEW_CONFIG.thresholds.barRatio;
    }

    @autobind
    private onMouseMove(event: React.MouseEvent<any>): void {
        this.mousePosition = { x: event.pageX, y: event.pageY };
    }

    /*
     * Supplies the CategoryBarPlot with the event handlers needed to record when the mouse enters
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

    @computed
    get maximumX(): number {
        return (
            this.tickValuesBasedOnNA[this.tickValuesBasedOnNA.length - 1] + 1
        );
    }

    @computed
    get maximumY(): number {
        const barDataWithoutNA = this.barData.filter(doesNotContainNA);
        return Math.max(
            ...barDataWithoutNA.map((element: BarDatum) => element.y)
        );
    }

    @computed
    get labelShowingNA(): JSX.Element | null {
        if (!this.props.showNAChecked && this.numberOfNA) {
            const labelNA = this.barDataWithNA
                .map((element: BarDatum) => element.dataBin.count)
                .join(', ');
            return (
                <VictoryLabel
                    text={`NA: ${labelNA}`}
                    textAnchor="end"
                    datum={{ x: this.maximumX, y: this.maximumY }}
                    style={{
                        fontFamily:
                            VICTORY_THEME.axis.style.tickLabels.fontFamily,
                        fontSize: VICTORY_THEME.axis.style.tickLabels.fontSize,
                    }}
                />
            );
        }
        return null;
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
                        width={this.props.width}
                        padding={{
                            left: 40,
                            right: 20,
                            top: 10,
                            bottom: this.bottomPadding,
                        }}
                        theme={VICTORY_THEME}
                    >
                        <VictoryAxis
                            tickValues={this.tickValuesBasedOnNA}
                            tickFormat={(t: number) => this.tickFormat[t - 1]}
                            domain={[0, this.maximumX]}
                            tickLabelComponent={<CategoryBarChartAxisLabel />}
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
                                        isDataBinSelected(
                                            d.dataBin,
                                            this.props.filters
                                        ) || this.props.filters.length === 0
                                            ? STUDY_VIEW_CONFIG.colors.theme
                                                  .primary
                                            : DEFAULT_NA_COLOR,
                                },
                            }}
                            data={this.barDataBasedOnNA}
                            events={this.barPlotEvents}
                        />
                        {this.labelShowingNA}
                    </VictoryChart>
                )}
                {ReactDOM.createPortal(
                    <BarChartToolTip
                        mousePosition={this.mousePosition}
                        windowWidth={WindowStore.size.width}
                        model={this.toolTipModel}
                        totalBars={this.barData.length}
                        currentBarIndex={this.currentBarIndex}
                        isCategorical
                    />,
                    document.body
                )}
            </div>
        );
    }
}
