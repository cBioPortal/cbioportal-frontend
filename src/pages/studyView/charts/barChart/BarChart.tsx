import * as React from "react";
import {observer} from "mobx-react";
import {VictoryAxis, VictoryBar, VictoryChart, VictorySelectionContainer} from 'victory';
import {computed} from "mobx";
import _ from "lodash";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import {ClinicalDataIntervalFilterValue, DataBin} from "shared/api/generated/CBioPortalAPIInternal";
import {AbstractChart} from "pages/studyView/charts/ChartContainer";
import autobind from 'autobind-decorator';
import BarChartAxisLabel from "./BarChartAxisLabel";
import {
    filterCategoryBins,
    filterNumericalBins,
    formatNumericalTickValues,
    generateCategoricalData,
    generateNumericalData,
    needAdditionShiftForLogScaleBarChart
} from "../../StudyViewUtils";
import {STUDY_VIEW_CONFIG} from "../../StudyViewConfig";
import {getTextDiagonal, getTextHeight, getTextWidth} from "../../../../shared/lib/wrapText";
import {DEFAULT_NA_COLOR} from "shared/lib/Colors";

export interface IBarChartProps {
    data: DataBin[];
    width: number;
    height: number;
    filters: ClinicalDataIntervalFilterValue[];
    onUserSelection: (dataBins: DataBin[]) => void;
}

export type BarDatum = {
    x: number,
    y: number,
    dataBin: DataBin
};

function generateTheme() {
    const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
    theme.axis.style.tickLabels.fontSize *= 0.85;

    return theme;
}

const VICTORY_THEME = generateTheme();
const TILT_ANGLE = 50;

@observer
export default class BarChart extends React.Component<IBarChartProps, {}> implements AbstractChart {

    private svgContainer: any;

    constructor(props: IBarChartProps) {
        super(props);
    }

    @autobind
    private onSelection(bars: { data: BarDatum[] }[], bounds: { x: number, y: number }[], props: any) {
        const dataBins = _.flatten(bars.map(bar => bar.data.map(barDatum => barDatum.dataBin)));
        this.props.onUserSelection(dataBins);
    }

    private isDataBinSelected(dataBin: DataBin, filters: ClinicalDataIntervalFilterValue[]) {
        return filters.find(filter =>
            (filter.start === dataBin.start && filter.end === dataBin.end) ||
            (filter.value !== undefined && filter.value === dataBin.specialValue)
        ) !== undefined;
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
        return generateCategoricalData(this.categoryBins, this.numericalTickFormat.length);
    }

    @computed
    get numericalTickFormat() {
        const formatted = formatNumericalTickValues(this.numericalBins);

        // if the value contains ^ we need to return an array of values, instead of a single value
        // to be compatible with BarChartAxisLabel
        return formatted.map(value => value.includes("^") ? value.split("^") : value);
    }

    @computed
    get barData(): BarDatum[] {
        return [
            ...this.numericalData,
            ...this.categoricalData
        ];
    }

    @computed
    get categories() {
        return this.categoryBins.map(dataBin =>
            dataBin.specialValue === undefined ? `${dataBin.start}` : dataBin.specialValue);
    }

    @computed
    get tickValues() {
        const values: number[] = [];

        for (let i = 1; i <= this.numericalTickFormat.length + this.categories.length; i++) {
            values.push(i);
        }

        return values;
    }

    @computed
    get tickFormat() {
        // copy non-numerical categories as is
        return [
            ...this.numericalTickFormat,
            ...this.categories
        ];
    }

    @computed
    get tilted() {
        return this.tickValues.length > STUDY_VIEW_CONFIG.thresholds.escapeTick;
    }

    @computed
    get bottomPadding(): number {
        const MAX_PADDING = 30;
        const padding = _.max(this.tickFormat.map((tick: string | string[]) => { 
            let content;
            if (_.isArray(tick)) {
                content = tick.join();
            } else {
                content = tick;
            }
            const fontFamily = VICTORY_THEME.axis.style.tickLabels.fontFamily;
            const fontSize = `${VICTORY_THEME.axis.style.tickLabels.fontSize}px`;
            const textHeight = getTextHeight(content, fontFamily, fontSize);
            const textWidth = getTextWidth(content, fontFamily, fontSize);
            const textDiagonal = getTextDiagonal(textHeight, textWidth);
            return 10 + (this.tilted ? textDiagonal * Math.sin(Math.PI * TILT_ANGLE / 180)  : textHeight);  
        }));
        return padding > MAX_PADDING ? MAX_PADDING : padding;
    }

    @computed
    get barRatio(): number {
        // In log scale bar chart, when the first bin is .5 exponential, the bars will be shifted to the right
        // for one bar. We need to adjust the bar ratio since it's calculated based on the range / # of bars
        const additionRatio = needAdditionShiftForLogScaleBarChart(this.numericalBins) ? this.barData.length / (this.barData.length + 1) : 1;
        return additionRatio * STUDY_VIEW_CONFIG.thresholds.barRatio;
    }

    public render() {

        return (
            <div>
                {this.barData.length > 0 &&
                <VictoryChart
                    containerComponent={
                        <VictorySelectionContainer
                            containerRef={(ref: any) => this.svgContainer = ref}
                            selectionDimension="x"
                            onSelection={this.onSelection} />
                    }
                    style={{
                        parent: {
                            width: this.props.width, height: this.props.height
                        }
                    }}
                    height={this.props.height - this.bottomPadding}
                    padding={{left: 40, right: 20, top: 10, bottom: this.bottomPadding}}
                    theme={VICTORY_THEME}
                >
                    <VictoryAxis
                        tickValues={this.tickValues}
                        tickFormat={(t: number) => this.tickFormat[t - 1]}
                        domain={[0, this.tickValues[this.tickValues.length - 1] + 1]}
                        tickLabelComponent={<BarChartAxisLabel />}
                        style={
                            this.tilted ? {
                                tickLabels: {
                                    angle: TILT_ANGLE,
                                    verticalAnchor: "start",
                                    textAnchor: "start"
                                }
                            } : undefined
                        }
                    />
                    <VictoryAxis
                        dependentAxis={true}
                        tickFormat={(t: number) => Number.isInteger(t) ? t.toFixed(0) : ''}
                    />
                    <VictoryBar
                        barRatio={this.barRatio}
                        style={{
                            data: {
                                fill: (d: BarDatum) =>
                                    (this.isDataBinSelected(d.dataBin, this.props.filters) || this.props.filters.length === 0) ?
                                        STUDY_VIEW_CONFIG.colors.theme.primary : DEFAULT_NA_COLOR
                            }
                        }}
                        data={this.barData}
                    />
                </VictoryChart>}
            </div>
        );
    }
}
