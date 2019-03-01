import * as React from 'react';
import { observer, Observer } from "mobx-react";
import { VictoryLabel, VictoryStack, VictoryBar, VictoryLegend } from 'victory';
import { observable, computed } from 'mobx';
import * as _ from 'lodash';
import CBIOPORTAL_VICTORY_THEME from 'shared/theme/cBioPoralTheme';
import { percentageRounder } from 'pages/resultsView/cancerSummary/CancerSummaryChart';
import autobind from 'autobind-decorator';
import ScatterPlotTooltip from 'shared/components/plots/ScatterPlotTooltip';
import Timer = NodeJS.Timer;
import {ComparisonGroup, getStackedBarData} from './GroupComparisonUtils';

export interface IOverlapStackedBarProps {
    svgId?: string;
    sampleGroups: {
        uid: string;
        cases: string[];
    }[];
    patientGroups: {
        uid: string;
        cases: string[];
    }[];
    uidToGroup: { [uid: string]: ComparisonGroup };
};

const STACKBAR_WIDTH = 250
const STACKBAR_HEIGHT = 530

@observer
export default class OverlapStackedBar extends React.Component<IOverlapStackedBarProps, {}> {

    constructor(props: IOverlapStackedBarProps, context: any) {
        super(props, context);
    }

    @observable.ref private tooltipModel: any | null = null;
    @observable pointHovered: boolean = false;
    private mouseEvents: any = this.makeMouseEvents();

    @observable.ref private container: HTMLDivElement;

    private makeMouseEvents() {
        let disappearTimeout: Timer | null = null;
        const disappearDelayMs = 250;

        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.pointHovered = true;

                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                    disappearTimeout = null;
                                }

                                return { active: true };
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                }

                                disappearTimeout = setTimeout(() => {
                                    this.pointHovered = false;
                                }, disappearDelayMs);

                                return { active: false };
                            }
                        }
                    ];
                }
            }
        }];
    }

    @computed get sampleStackedBarData() {
        return getStackedBarData(this.props.sampleGroups, this.props.uidToGroup);
    }


    @computed get patientStackedBarData() {
        return getStackedBarData(this.props.patientGroups, this.props.uidToGroup);
    }

    @computed get totalSamplesCount() {
        return _.chain(this.props.sampleGroups)
            .flatMap(set => set.cases)
            .uniq()
            .value().length;
    }

    @computed get totalPatientsCount() {
        return _.chain(this.props.patientGroups)
            .flatMap(set => set.cases)
            .uniq()
            .value().length;
    }


    @autobind
    buildTooltip(datum: any) {
        return (
            <div>
                <strong>{datum.groupName}</strong>
                <p>{datum.cases.length} cases</p>
            </div>
        )
    }

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    get legendData() {
        const legendData = _.reduce(this.sampleStackedBarData, (memo, group, alterationType) => {
            memo.push({
                name: group[0].groupName,
                symbol: { fill: group[0].fill }
            })

            return memo;
        }, [] as { name: string, symbol: { fill: string } }[])
        return legendData.reverse();
    }

    @autobind
    private getTooltip() {
        if (this.container && this.tooltipModel) {
            const countAxisOffset = (this.tooltipModel.y + this.tooltipModel.y0) / 2;
            const categoryAxisOffset = this.tooltipModel.x;
            return (
                <ScatterPlotTooltip
                    placement={"right"}
                    container={this.container}
                    targetHovered={this.pointHovered}
                    targetCoords={{
                        x: categoryAxisOffset + 15,
                        y: countAxisOffset
                    }}
                    overlay={this.buildTooltip(this.tooltipModel.datum)}
                    arrowOffsetTop={20}
                />
            );
        } else {
            return <span></span>;
        }
    }

    @computed get chartWidth() {
        return 2 * STACKBAR_WIDTH + 200;
    }

    @computed get chartHeight() {
        return 500;
    }

    @computed get topPadding() {
        return 100
    }

    @autobind
    private getStackedBar(data: {
        cases: string[];
        fill: string;
        groupName: string;
    }[][], title: string, total: number, position: number) {

        return (
            <g>
                <VictoryLabel
                    theme={CBIOPORTAL_VICTORY_THEME}
                    style={{
                        fontWeight: "bold",
                        fontFamily: "Verdana,Arial,sans-serif",
                        textAnchor: "middle"
                    }}
                    x={STACKBAR_WIDTH / 2}
                    dx={STACKBAR_WIDTH * position}
                    y="1.2em"
                    text={title}
                />
                <VictoryStack
                    theme={CBIOPORTAL_VICTORY_THEME}
                    width={STACKBAR_WIDTH}
                    height={STACKBAR_HEIGHT}
                    standalone={false}
                    domainPadding={10}
                    padding={{ left: STACKBAR_WIDTH * position * 2, top: 50, bottom: 50 }}
                >
                    {data.map((data: any, i: number) => {
                        return (
                            <VictoryBar
                                data={data}
                                key={i}
                                labels={(d: any) => percentageRounder(d.cases.length / total) > 6 ? d.cases.length : ''}
                                labelComponent={<VictoryLabel dy={30} />}
                                events={this.mouseEvents}
                                x={(d:any) => title} //point x to a string instead of number
                                y={(d:any) => d.cases.length}
                                style={{
                                    data: {
                                        width: 50,
                                        fill: (d: any) => d.fill
                                    }
                                }}
                            />
                        )
                    })}
                </VictoryStack>
            </g>
        )
    }

    @autobind
    private getChart() {
        return (
            <div
                ref={this.containerRef}
                style={{ width: this.chartWidth, height: this.chartHeight }}
            >
                <svg
                    id={this.props.svgId || ""}
                    style={{
                        width: this.chartWidth,
                        height: this.chartHeight,
                        pointerEvents: "all"
                    }}
                    height={this.chartHeight}
                    width={this.chartWidth}
                    role="img"
                    viewBox={`0 0 ${this.chartWidth} ${this.chartHeight}`}
                >
                    {this.getStackedBar(this.sampleStackedBarData, 'Samples Overlap', this.totalSamplesCount, 0)}
                    {this.getStackedBar(this.patientStackedBarData, 'Patients Overlap', this.totalPatientsCount, 1)}
                    <VictoryLegend
                        x={2 * STACKBAR_WIDTH}
                        y={this.topPadding}
                        theme={CBIOPORTAL_VICTORY_THEME}
                        standalone={false}
                        data={this.legendData} />
                </svg>
            </div>
        );
    }

    render() {
        return (
            <div>
                <Observer>
                    {this.getChart}
                </Observer>
                {this.container && this.tooltipModel &&
                    <Observer>
                        {this.getTooltip}
                    </Observer>
                }
            </div>
        );
    }

}
