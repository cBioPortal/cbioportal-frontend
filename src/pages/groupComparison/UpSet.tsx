import * as React from 'react';
import {observer, Observer} from "mobx-react";
import {VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryLine, VictoryScatter} from 'victory';
import {computed, observable} from 'mobx';
import * as _ from 'lodash';
import CBIOPORTAL_VICTORY_THEME, {axisTickLabelStyles} from 'shared/theme/cBioPoralTheme';
import autobind from 'autobind-decorator';
import {ComparisonGroup} from './GroupComparisonUtils';
import {getTextWidth, truncateWithEllipsis} from 'shared/lib/wrapText';
import {tickFormatNumeral} from 'shared/components/plots/TickUtils';
import {joinGroupNames} from './OverlapUtils';
import {capitalize, pluralize} from 'shared/lib/StringUtils';
import {getPlotDomain} from './UpSetUtils';
import * as ReactDOM from "react-dom";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../resultsView/survival/styles.module.scss";
import Timer = NodeJS.Timer;
import WindowStore from "../../shared/components/window/WindowStore";

export interface IUpSetProps {
    groups: {
        key:{[uid:string]:boolean},
        value: string[];
    }[];
    uidToGroup: { [uid: string]: ComparisonGroup };
    svgId?: string;
    title?: string;
    caseType: "sample" | "patient";
};

const PLOT_DATA_PADDING_PIXELS = 20;
const DEFAULT_BOTTOM_PADDING = 10;
const RIGHT_PADDING_FOR_LONG_LABELS = 50;
const BAR_WIDTH = 10;
const DEFAULT_SCATTER_DOT_COLOR = "#efefef"

@observer
export default class UpSet extends React.Component<IUpSetProps, {}> {

    private container: HTMLDivElement;
    @observable.ref private tooltipModel: any | null = null;
    private mouseEvents: any = this.makeMouseEvents();
    @observable mousePosition = { x:0, y:0 };

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

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
                                if (!props.datum || !props.datum.dontShowTooltip) {
                                    this.tooltipModel = props;
                                }
                                return null;
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                this.tooltipModel = null;
                                return null;
                            }
                        }
                    ];
                }
            }
        }];
    }

    @computed get usedGroups() {
        const usedGroupUids =
            _.chain(this.groupCombinationSets)
            .flatMap(g=>g.groups)
            .keyBy()
            .value();

        return _.chain(this.props.uidToGroup)
            .reduce((acc, group, uid) => {
                if (uid in usedGroupUids) {
                    acc.push(group);
                }
                return acc;
            }, [] as ComparisonGroup[])
            .orderBy(group=>group.nameWithOrdinal,"desc")
            .value();
    }

    @computed get groupLabels() {
        return _.map(this.usedGroups, group => truncateWithEllipsis(group.nameWithOrdinal, 100, "Arial", "13px"));
    }

    private barSeparation() {
        return 0.2 * this.barWidth();
    }

    private barWidth() {
        return BAR_WIDTH;
    }

    @computed get chartWidth() {
        return this.barChartExtent
    }

    private barChartHeight() {
        return 250;
    }

    @computed get scatterChartHeight() {
        return this.scatterChartExtent
    }

    private domainPadding() {
        return PLOT_DATA_PADDING_PIXELS;
    }

    private categoryAxisDomainPadding() {
        return this.domainPadding();
    }

    private countAxisDomainPadding() {
        return this.domainPadding();
    }

    private chartDomainPadding() {
        return {
            y: this.countAxisDomainPadding(),
            x: this.categoryAxisDomainPadding()
        };
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight: "bold",
                        fontFamily: "Verdana,Arial,sans-serif",
                        textAnchor: "middle"
                    }}
                    x={this.svgWidth / 2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    @computed get scatterChartExtent() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        if (this.usedGroups.length > 0) {
            return this.categoryCoord(this.usedGroups.length - 1) + (2 * (this.categoryAxisDomainPadding())) + miscPadding;
        } else {
            return miscPadding;
        }
    }

    @computed get barChartExtent() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        if (this.groupCombinationSets.length > 0) {
            return this.categoryCoord(this.groupCombinationSets.length - 1) + 2 * (this.categoryAxisDomainPadding()) + miscPadding;
        } else {
            return miscPadding;
        }
    }

    @computed get biggestCategoryLabelSize() {
        return Math.max(
            ..._.map(this.usedGroups, group => getTextWidth(group.nameWithOrdinal, axisTickLabelStyles.fontFamily, axisTickLabelStyles.fontSize + "px"))
        );
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        //subtract 100 as padding added both while calculating barchart height and scatter plot height
        return this.topPadding + this.barChartHeight() + this.scatterChartHeight + this.bottomPadding - 100;
    }

    @computed get leftPadding() {
        return this.biggestCategoryLabelSize;
    }

    @computed get rightPadding() {
        return RIGHT_PADDING_FOR_LONG_LABELS;
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get bottomPadding() {
        return DEFAULT_BOTTOM_PADDING;
    }

    @autobind
    private categoryCoord(index: number) {
        return index * (this.barWidth() + this.barSeparation()); // half box + separation + half box
    }

    @computed get groupCombinationSets() {
        return _.orderBy(
            this.props.groups.map(entry=>({
                groups:Object.keys(entry.key).filter(k=>entry.key[k]),
                cases: entry.value
            })),
            group=>group.cases.length,
            "desc"
        );
    }

    @computed get scatterData() {
        return _.flatMap(this.groupCombinationSets, (set, index) => {
            return _.map(this.usedGroups, (group, i) => ({
                x: this.categoryCoord(index),
                y: this.categoryCoord(i),
                fill: _.includes(set.groups, group.uid) ? "#000000" : DEFAULT_SCATTER_DOT_COLOR,
                dontShowTooltip: !_.includes(set.groups, group.uid),
                ...set
            }));
        });
    }

    @computed get barPlotData() {
        return _.map(this.groupCombinationSets, (set, index) => ({
            x: this.categoryCoord(index),
            y: set.cases.length,
            ...set
        }));
    }

    @computed get barPlotHitzoneData() {
        const minY = this.barPlotDomain.y[1]/15;
        return this.barPlotData.map(d=>{
            return Object.assign({}, d, { y: Math.max(d.y, minY) });
        });
    }

    @computed private get getGroupIntersectionLines() {
        const activeUids = _.map(this.usedGroups, g => g.uid)
        return _.flatMap(this.groupCombinationSets, (set, index) => {
            const data = _.map(set.groups, groupUid => {
                const groupIndex = _.indexOf(activeUids, groupUid);
                return {
                    x: this.categoryCoord(index),
                    y: this.categoryCoord(groupIndex),
                    ...set
                };
            });
            return [
                <VictoryLine
                    style={{
                        data: {
                            stroke: "#000000",
                            strokeWidth: 2,
                            strokeLinecap: "round"
                        },
                    }}
                    data={data}
                />,
                <VictoryLine
                    style={{
                        data: {
                            strokeOpacity: 0,
                            strokeWidth: 10,
                            strokeLinecap: "round"
                        },
                    }}
                    data={data}
                    events={this.mouseEvents}
                />
            ]
        })
    }

    @computed get barPlotDomain() {
        const maxCount = _.max(_.map(this.groupCombinationSets, datum => datum.cases.length)) || 0;
        return getPlotDomain(this.groupCombinationSets.length, maxCount, this.categoryCoord, true, false);
    }

    @computed get scatterPlotDomain() {
        return getPlotDomain(this.groupCombinationSets.length, _.keys(this.groupLabels).length, this.categoryCoord);
    }

    @computed get categoryTickValues() {
        return this.groupCombinationSets.map((x, i) => this.categoryCoord(i));
    }

    @computed get groupTickValues() {
        return _.map(this.groupLabels, (label, index) => this.categoryCoord(index));
    }

    @autobind
    private formatNumericalTick(t: number, i: number, ticks: number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @autobind
    private groupTick(t: number, index: number) {
        return this.groupLabels[index];
    }

    @computed get scatterPlotTopPadding() {
        // subtract 100 to plot scatter p\lot close to bar plot
        return this.barChartHeight() - 100;
    }

    private tooltipFunction(datum: any) {
        const includedGroups = _.map(datum.groups as string[], uid=>this.props.uidToGroup[uid]);
        const casesCount = datum.cases.length;

        return (
            <div style={{width:300, whiteSpace:"normal"}}>
                <strong>{casesCount} {pluralize(this.props.caseType, casesCount)}</strong>
                <br/>
                in only {joinGroupNames(includedGroups, "and")}.
            </div>
        );
    }

    @computed get tooltipComponent() {
        if (!this.tooltipModel) {
            return null;
        } else {
            const maxWidth = 400;
            let tooltipPlacement = (this.mousePosition.x > WindowStore.size.width-maxWidth ? "left" : "right");
            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={17}
                    className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)}
                    positionLeft={this.mousePosition.x+(tooltipPlacement === "left" ? -8 : 8)}
                    positionTop={this.mousePosition.y-17}
                    style={{
                        transform: (tooltipPlacement === "left" ? "translate(-100%,0%)" : undefined),
                        maxWidth
                    }}
                    placement={tooltipPlacement}
                >
                    {this.tooltipFunction(this.tooltipModel.datum || this.tooltipModel.data[0])}
                </Popover>,
                document.body
            );
        }
    }

    @autobind private onMouseMove(e:React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    @autobind private getChart() {
        if (this.groupCombinationSets.length > 0) {
            return (
                <div
                    ref={this.containerRef}
                    style={{ width: this.svgWidth, height: this.svgHeight }}
                >
                    <svg
                        id={this.props.svgId || ""}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: "all"
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                        onMouseMove={this.onMouseMove}
                    >
                        <g>
                            {this.title}
                        </g>
                        <g
                            transform={`translate(${this.leftPadding}, ${this.topPadding})`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.barChartHeight()}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                domain={this.barPlotDomain}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false
                                }}
                            >
                                <VictoryAxis
                                    orientation="bottom"
                                    offsetY={50}
                                    crossAxis={false}
                                    tickValues={this.categoryTickValues}
                                    style={{
                                        ticks: { size: 0, },
                                        tickLabels: { fontSize: 0 },
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                />
                                <VictoryAxis
                                    orientation="left"
                                    offsetX={50}
                                    dependentAxis
                                    label={"Overlap count"}
                                    tickFormat={this.formatNumericalTick}
                                    style={{
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                    axisLabelComponent={<VictoryLabel dy={-40} />}
                                />
                                <VictoryBar
                                    style={{ data: { fill: "#000000", width: this.barWidth() } }}
                                    data={this.barPlotData}
                                />
                                <VictoryBar
                                    style={{ data: { fillOpacity:0, width: this.barWidth()} }}
                                    data={this.barPlotHitzoneData}
                                    events={this.mouseEvents}
                                />

                            </VictoryChart>
                        </g>

                        <g
                            transform={`translate(${this.leftPadding}, ${this.scatterPlotTopPadding})`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.scatterChartHeight}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                domain={this.scatterPlotDomain}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false
                                }}
                            >
                                <VictoryAxis
                                    orientation="bottom"
                                    offsetY={50}
                                    crossAxis={false}
                                    tickValues={this.categoryTickValues}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        tickLabels: { fill: "none" },
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                />

                                <VictoryAxis
                                    orientation="left"
                                    offsetX={50}
                                    dependentAxis
                                    crossAxis={false}
                                    tickFormat={this.groupTick}
                                    tickValues={this.groupTickValues}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                />

                                <VictoryScatter
                                    size={this.barWidth()/2}
                                    style={{
                                        data: {
                                            fill: (d: any) => d.fill,
                                        }
                                    }}
                                    data={this.scatterData}
                                    events={this.mouseEvents}
                                />
                                {this.getGroupIntersectionLines}

                            </VictoryChart>
                        </g>
                    </svg>
                </div>
            );
        } else {
            return <span>No data to plot.</span>
        }
    }

    render() {
        return (
            <div>
                <Observer>
                    {this.getChart}
                </Observer>
                {this.tooltipComponent}
            </div>
        );
    }

}
