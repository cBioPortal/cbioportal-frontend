import * as React from "react";
import {observer} from "mobx-react";
import {Slice, VictoryContainer, VictoryLabel, VictoryLegend, VictoryPie} from 'victory';
import {action, computed, observable, toJS} from "mobx";
import _ from "lodash";
import {getFrequencyStr, toSvgDomNodeWithLegend} from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import {AbstractChart} from "pages/studyView/charts/ChartContainer";
import ifndef from "shared/lib/ifndef";
import autobind from 'autobind-decorator';
import {ClinicalDataCountWithColor} from "pages/studyView/StudyViewPageStore";
import classnames from 'classnames';
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import {If} from 'react-if';
import {STUDY_VIEW_CONFIG} from "../../StudyViewConfig";
import DefaultTooltip from "../../../../shared/components/defaultTooltip/DefaultTooltip";

export interface IPieChartProps {
    width: number;
    height: number;
    data: ClinicalDataCountWithColor[];
    filters: string[];
    onUserSelection: (values: string[]) => void;
    placement: 'left' | 'right';
    patientAttribute: boolean;
    label?: string;
    labelDescription?: string;
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}> implements AbstractChart {

    private svg: SVGElement;

    constructor(props: IPieChartProps) {
        super(props);
    }

    @autobind
    private onUserSelection(filter: string) {
        let filters = toJS(this.props.filters);
        if (_.includes(filters, filter)) {
            filters = _.filter(filters, obj => obj !== filter);
        } else {
            filters.push(filter);
        }
        this.props.onUserSelection(filters);
    }

    private get userEvents() {
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onClick: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.onUserSelection(props.datum.value);
                            }
                        }
                    ];
                }
            }
        }];
    }

    @observable isTooltipHovered: boolean = false;
    @observable tooltipHighlightedRow: string | undefined = undefined;

    @autobind
    @action private highlightedRow(value: string): void {
        this.tooltipHighlightedRow = value;
    }

    public downloadData() {
        return this.props.data.map(obj => obj.value + '\t' + obj.count).join('\n');
    }

    public toSVGDOMNode(): Element {
        return toSvgDomNodeWithLegend(this.svg, ".studyViewPieChartLegend", ".studyViewPieChartGroup", true);
    }

    @computed get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count)
    }

    @computed get fill() {
        return (d: ClinicalDataCountWithColor) => {
            if (!_.isEmpty(this.props.filters) && !_.includes(this.props.filters, d.value)) {
                return STUDY_VIEW_CONFIG.colors.na;
            }
            return d.color;
        };
    }

    @computed get stroke() {
        return (d: ClinicalDataCountWithColor) => {
            if (!_.isEmpty(this.props.filters) && _.includes(this.props.filters, d.value)) {
                return "#cccccc";
            }
            return null;
        };
    }

    @computed get strokeWidth() {
        return (d: ClinicalDataCountWithColor) => {
            if (!_.isEmpty(this.props.filters) && _.includes(this.props.filters, d.value)) {
                return 3;
            }
            return 0;
        };
    }

    @computed get fillOpacity() {
        return (d: ClinicalDataCountWithColor) => {
            if (!_.isEmpty(this.props.filters) && !_.includes(this.props.filters, d.value)) {
                return '0.5';
            }
            return 1;
        };
    }

    @autobind
    private x(d: ClinicalDataCountWithColor) {
        return d.value;
    }

    @autobind
    private y(d: ClinicalDataCountWithColor) {
        return d.count;
    }

    @autobind
    private label(d: ClinicalDataCountWithColor) {
        // Roughly let's say do not show label when the percentage is lower than (digits of the count * 5% )
        return (d.count / this.totalCount) < (0.05 * d.count.toLocaleString().length) ? '' : d.count.toLocaleString();
    }

    // We do want to show a bigger pie chart when the height is way smaller than width
    @computed
    get chartSize() {
        return (this.props.width + this.props.height ) / 2;
    }

    @computed get victoryPie() {
        return (
            <VictoryPie
                standalone={false}
                theme={CBIOPORTAL_VICTORY_THEME}
                containerComponent={<VictoryContainer responsive={false} />}
                groupComponent={<g className="studyViewPieChartGroup" />}
                width={this.props.width}
                height={this.chartSize}
                labelRadius={15}
                padding={30}
                labels={this.label}
                data={this.props.data}
                dataComponent={<CustomSlice />}
                labelComponent={<VictoryLabel />}
                events={this.userEvents}
                style={{
                    data: {
                        fill: ifndef(this.fill, "#cccccc"),
                        stroke: ifndef(this.stroke, "0x000000"),
                        strokeWidth: ifndef(this.strokeWidth, 0),
                        fillOpacity: ifndef(this.fillOpacity, 1),
                        cursor: 'pointer'
                    },
                    labels: {
                        fill: "white",
                        cursor: 'pointer'
                    }
                }}
                x={this.x}
                y={this.y}
            />
        );
    }

    @computed get victoryLegend() {
        const legendData = this.props.data.map(data =>
            ({name: `${data.value}: ${data.count} (${getFrequencyStr(100 * data.count / this.totalCount)})`}));
        const colorScale = this.props.data.map(data => data.color);

        // override the legend style without mutating the actual theme object
        const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
        theme.legend.style.data = {
            type: "square",
            size: 5,
            strokeWidth: 0,
            stroke: "black"
        };

        return (
            <VictoryLegend
                standalone={false}
                theme={theme}
                colorScale={colorScale}
                x={0} y={181}
                rowGutter={-10}
                title={this.props.label || "Legend"}
                centerTitle={true}
                style={{ title: { fontWeight: "bold" } }}
                data={legendData}
                groupComponent={<g className="studyViewPieChartLegend" />}
            />
        );
    }

    public render() {
        return (
            <DefaultTooltip
                placement="right"
                overlay={(
                    <ClinicalTable
                        width={300}
                        height={150}
                        data={this.props.data}
                        labelDescription={this.props.labelDescription}
                        patientAttribute={this.props.patientAttribute}
                        filters={this.props.filters}
                        highlightedRow={this.highlightedRow}
                        onUserSelection={this.props.onUserSelection}
                    />)}
                destroyTooltipOnHide={true}
                trigger={["hover"]}
            >
                <svg
                    width={this.props.width}
                    height={this.props.height}
                    ref={(ref: any) => this.svg = ref}
                >
                    {this.victoryPie}
                    {this.victoryLegend}
                </svg>
            </DefaultTooltip>
        );
    }

}

class CustomSlice extends React.Component<{}, {}> {
    render() {
        const d: any = this.props;
        return (
            <g>
                <Slice {...this.props} />
                <title>{`${d.datum.value}:${d.datum.count}`}</title>
            </g>
        );
    }
}