import * as React from 'react';
import { observer } from "mobx-react";
import * as d3 from 'd3';
import autobind from 'autobind-decorator';
const venn = require('venn.js');
import { VictoryLabel, VictoryLegend } from 'victory';
import CBIOPORTAL_VICTORY_THEME from 'shared/theme/cBioPoralTheme';
import _ from "lodash";
import { computed } from 'mobx';
import {ComparisonGroup, getCombinations, getVennPlotData} from './GroupComparisonUtils';

export interface IVennProps {
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
}

const VENN_PLOT_WIDTH = 250
const VENN_PLOT_HEIGHT = 200

@observer
export default class Venn extends React.Component<IVennProps, {}> {

    constructor(props: IVennProps, context: any) {
        super(props, context);
    }

    componentDidMount() {
        this.createVennDiagram(this.sampleSets, 'sampleVennDiagram')
        this.createVennDiagram(this.patientSets, 'patientVennDiagram')
    }

    componentDidUpdate() {
        this.createVennDiagram(this.sampleSets, 'sampleVennDiagram')
        this.createVennDiagram(this.patientSets, 'patientVennDiagram')
    }

    @computed get sampleSets() {
        return getVennPlotData(getCombinations(this.props.sampleGroups));
    }

    @computed get patientSets() {
        return getVennPlotData(getCombinations(this.props.patientGroups));
    }

    @autobind
    getColor(categories: string[]) {
        return categories.length === 1 ? this.props.uidToGroup[categories[0]].color : undefined
    }

    @autobind
    private createVennDiagram(sets: {
        label: string;
        size: number;
        sets: string[];
    }[], id: string) {
        let self = this

        let vennDiagram = venn.VennDiagram();
        vennDiagram.width(VENN_PLOT_WIDTH);
        vennDiagram.height(VENN_PLOT_HEIGHT);
        vennDiagram.padding(5);
        vennDiagram.fontSize('14px');

        let vennDiagramDiv = d3.select(`#${id}`)
        vennDiagramDiv.datum(sets).call(vennDiagram);

        vennDiagramDiv.selectAll(".venn-circle path")
            .style("fill-opacity", .8)
            .style("fill", function (d: any) { return self.getColor(d.sets); });

        vennDiagramDiv.selectAll(".venn-intersection text")
            .style("font-size", '10px');

        vennDiagramDiv.selectAll("text")
            .style("fill", "black")

        vennDiagramDiv.selectAll("path")
            .style("stroke-opacity", 0)
            .style("stroke", "#fff")
            .style("stroke-width", 3);

        vennDiagramDiv.selectAll("g")
            .on("mouseover", function (d: any) {
                // highlight the current path
                d3.select(this)
                    .select("path")
                    .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
                    .style("stroke-opacity", 1);
            })
            .on("mouseout", function (d: any) {
                d3.select(this)
                    .select("path")
                    .style("fill-opacity", d.sets.length == 1 ? .8 : .0)
                    .style("stroke-opacity", 0);
            });

    }

    @computed get chartWidth() {
        return 2 * VENN_PLOT_WIDTH + 200;
    }

    @computed get chartHeight() {
        return 500;
    }

    @computed get topPadding() {
        return 100
    }

    @computed get legendData() {
        const usedGroups = _.keyBy(this.props.sampleGroups.map(group=>group.uid));
        const legendData:any[] = [];
        _.forEach(this.props.uidToGroup, (group) => {
            if (group.uid in usedGroups) {
                legendData.push({
                    name: group.name,
                    symbol: { fill: group.color, strokeOpacity:0, type:"square", size: 6 }
                });
            }
        });
        return legendData;
    }

    public render() {
        return (<div
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
                <VictoryLabel
                    style={{
                        fontWeight: "bold",
                        fontFamily: "Verdana,Arial,sans-serif",
                        textAnchor: "middle"
                    }}
                    x={VENN_PLOT_WIDTH / 2}
                    y="1.2em"
                    text={'Samples overlap'}
                />
                <g id="sampleVennDiagram" transform={`translate(0,${this.topPadding})`} />

                <VictoryLabel
                    style={{
                        fontWeight: "bold",
                        fontFamily: "Verdana,Arial,sans-serif",
                        textAnchor: "middle"
                    }}
                    x={VENN_PLOT_WIDTH / 2}
                    dx={VENN_PLOT_WIDTH}
                    y="1.2em"
                    text={'Patients overlap'}
                />
                <g id="patientVennDiagram" transform={`translate(${VENN_PLOT_WIDTH},${this.topPadding})`} />

                {this.legendData.length > 0 && (
                    <VictoryLegend
                        x={2 * VENN_PLOT_WIDTH}
                        y={this.topPadding}
                        theme={CBIOPORTAL_VICTORY_THEME}
                        standalone={false}
                        data={this.legendData}
                    />
                )}
            </svg>
        </div>)
    }
}
