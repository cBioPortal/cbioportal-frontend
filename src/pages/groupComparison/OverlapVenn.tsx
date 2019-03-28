import * as React from 'react';
import { observer } from "mobx-react";
import { VictoryLabel, VictoryLegend } from 'victory';
import CBIOPORTAL_VICTORY_THEME from 'shared/theme/cBioPoralTheme';
import _ from "lodash";
import { computed } from 'mobx';
import {ComparisonGroup} from './GroupComparisonUtils';
import VennSimple from "./VennSimple";

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

const VENN_PLOT_WIDTH = 400;
const PADDING_BTWN_SAMPLE_AND_PATIENT = 10;
const VENN_PLOT_HEIGHT = 400;
const PADDING_BTWN_VENN_AND_LEGEND = 20;
const LEGEND_WIDTH = 180;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            feDropShadow:any; // for some reason typescript doesnt know about this SVG tag
        }
    }
}

@observer
export default class Venn extends React.Component<IVennProps, {}> {
    @computed get chartWidth() {
        return this.vennPlotAreaWidth + PADDING_BTWN_VENN_AND_LEGEND + LEGEND_WIDTH;
    }

    @computed get chartHeight() {
        return 500;
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

    @computed get vennPlotAreaWidth() {
        return 2*VENN_PLOT_WIDTH + PADDING_BTWN_SAMPLE_AND_PATIENT;
    }

    public render() {
        return (
            <svg
                id={this.props.svgId || ""}
                xmlns="http://www.w3.org/2000/svg"
                width={this.chartWidth}
                height={this.chartHeight}
                role="img"
                viewBox={`0 0 ${this.chartWidth} ${this.chartHeight}`}
            >
                <defs>
                    <filter x="0" y="0" width="100" height="100" id="caseCountBackground">
                        <feDropShadow as any dx="0" dy="0" floodColor="white" stdDeviation="2" floodOpacity="0.5"/>
                    </filter>
                </defs>
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
                <VennSimple
                    x={0}
                    y={15}
                    groups={this.props.sampleGroups}
                    uidToGroup={this.props.uidToGroup}
                    width={VENN_PLOT_WIDTH}
                    height={VENN_PLOT_HEIGHT}
                    caseCountFilterName="caseCountBackground"
                    onClickRegion={()=>{}}
                />

                <VictoryLabel
                    style={{
                        fontWeight: "bold",
                        fontFamily: "Verdana,Arial,sans-serif",
                        textAnchor: "middle"
                    }}
                    x={VENN_PLOT_WIDTH / 2}
                    dx={VENN_PLOT_WIDTH+PADDING_BTWN_SAMPLE_AND_PATIENT}
                    y="1.2em"
                    text={'Patients overlap'}
                />

                <VennSimple
                    x={VENN_PLOT_WIDTH+PADDING_BTWN_SAMPLE_AND_PATIENT}
                    y={15}
                    groups={this.props.patientGroups}
                    uidToGroup={this.props.uidToGroup}
                    width={VENN_PLOT_WIDTH}
                    height={VENN_PLOT_HEIGHT}
                    caseCountFilterName="caseCountBackground"
                    onClickRegion={()=>{}}
                />

                {this.legendData.length > 0 && (
                    <VictoryLegend
                        x={this.vennPlotAreaWidth + PADDING_BTWN_VENN_AND_LEGEND}
                        y={100}
                        theme={CBIOPORTAL_VICTORY_THEME}
                        standalone={false}
                        data={this.legendData}
                    />
                )}
            </svg>
        );
    }
}
