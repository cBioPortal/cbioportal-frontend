import * as React from "react";
import { observer } from "mobx-react";
import { VictoryChart, VictoryGroup, VictoryBar, VictoryLegend, Slice, VictoryAxis, VictoryLabel } from 'victory';
import { observable, computed, action, toJS } from "mobx";
import _ from "lodash";
import {toSvgDomNodeWithLegend, UNSELECTED_COLOR} from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import { AbstractChart } from "pages/studyView/charts/ChartContainer";
import ifndef from "shared/lib/ifndef";
import { bind } from "bind-decorator";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";
import classnames from 'classnames';
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import { If } from 'react-if';

export type GroupChartData = {
    name:string,
    color:string,
    categories:{
        name:string,
        count:number
    }[]
}

export interface IGroupChartProps {
    data: GroupChartData[];
    filters: string[];
}

@observer
export default class GroupChart extends React.Component<IGroupChartProps, {}> implements AbstractChart {

    private svg: SVGElement;
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

    public toSVGDOMNode(): Element {
        return this.svg.cloneNode(true) as Element;;
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
        return d.count;
    }

    @computed get colorScale() {
        return this.props.data.map(dataObj=> dataObj.color)
    }
    @computed get victoryBars() {
        return this.props.data.map(group=>{
            let data = group.categories.map(category=>{
                return {
                    x:category.name,
                    y:category.count
                }
            })
            return( <VictoryBar style={{data:{ width:20 }}} data={data} /> )
        })
    }

    private get bodyWidth(){
        let temp = _.flatMap(this.props.data, group=>group.categories.length)
        return (temp.length * (28));
    }

    private get width(){
        return this.bodyWidth + 20 + 20;
    }



    public render() {
        return (
            <div>
                <VictoryChart >
                <VictoryGroup
                    offset={20}
                    colorScale={this.colorScale}
                >
                {
                    this.victoryBars
                }
                </VictoryGroup>
            </VictoryChart>
            </div>
        );
    }

}