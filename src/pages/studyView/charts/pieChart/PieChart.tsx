import * as React from "react";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, Slice } from 'victory';
import { observable, computed, action, toJS } from "mobx";
import _ from "lodash";
import { UNSELECTED_COLOR } from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import { AbstractChart } from "pages/studyView/charts/ChartContainer";
import ifndef from "shared/lib/ifndef";
import { bind } from "bind-decorator";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";
import classnames from 'classnames';
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import { If } from 'react-if';

export interface IPieChartProps {
    data: ClinicalDataCountWithColor[];
    filters: string[];
    onUserSelection: (values: string[]) => void;
    active: boolean;
    placement: 'left' | 'right';
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}> implements AbstractChart {

    private svgContainer: any;

    constructor(props: IPieChartProps) {
        super(props);
    }

    @bind
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

    @bind
    @action private highlightedRow(value: string): void {
        this.tooltipHighlightedRow = value;
    }

    @computed private get showTooltip() {
        return this.props.active || this.isTooltipHovered
    }

    public downloadData() {
        return this.props.data.map(obj => obj.value + '\t' + obj.count).join('\n');
    }

    public toSVGDOMNode(): Element {
        return this.svgContainer.firstChild
    }

    @computed get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count)
    }

    @computed get fill() {
        return (d: ClinicalDataCountWithColor) => {
            if (!_.isEmpty(this.props.filters) && !_.includes(this.props.filters, d.value)) {
                return UNSELECTED_COLOR;
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

    @bind
    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    @bind
    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
    }

    @bind
    private x(d: ClinicalDataCountWithColor) {
        return d.value;
    }

    @bind
    private y(d: ClinicalDataCountWithColor) {
        return d.count;
    }

    @bind
    private label(d: ClinicalDataCountWithColor) {
        return ((d.count * 360) / this.totalCount) < 20 ? '' : d.count;
    }

    public render() {
        // 350px => width of tooltip
        // 195px => width of chart
        let left = _.isEqual(this.props.placement, 'right') ? '195px' : '-350px'
        return (
            <div>
                <If condition={this.showTooltip}>
                    <div
                        className={classnames('popover', this.props.placement)}
                        onMouseLeave={() => this.tooltipMouseLeave()}
                        onMouseEnter={() => this.tooltipMouseEnter()}
                        style={{ display: 'block', position: 'absolute', left: left, width: '350px', maxWidth: '350px' }}>

                        <div className="arrow" style={{ top: 20 }}></div>
                        <div className="popover-content">
                            <ClinicalTable
                                data={this.props.data}
                                filters={this.props.filters}
                                highlightedRow={this.highlightedRow}
                                onUserSelection={this.props.onUserSelection}
                            />
                        </div>
                    </div>
                </If>


                <VictoryPie
                    theme={CBIOPORTAL_VICTORY_THEME}
                    containerComponent={<VictoryContainer
                        responsive={false}
                        containerRef={(ref: any) => this.svgContainer = ref}
                    />}
                    width={190}
                    height={180}
                    labelRadius={30}
                    padding={30}
                    //to hide label if the angle is too small(currently set to 20 degrees)
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
                            fillOpacity: ifndef(this.fillOpacity, 1)
                        },
                        labels: {
                            fill: "white"
                        }
                    }}
                    x={this.x}
                    y={this.y}
                />
            </div>
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