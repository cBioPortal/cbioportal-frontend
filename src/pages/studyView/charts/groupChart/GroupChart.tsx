import * as React from "react";
import { observer } from "mobx-react";
import { VictoryChart, VictoryGroup, VictoryBar, VictoryContainer, VictoryAxis, VictoryLabel } from 'victory';
import { observable, computed, action, toJS } from "mobx";
import _ from "lodash";
import { AbstractChart } from "pages/studyView/charts/ChartContainer";
import { bind } from "bind-decorator";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";

export type GroupChartData = {
    name: string,
    color: string,
    categories: {
        name: string,
        count: number
    }[]
}

export interface IGroupChartProps {
    data: GroupChartData[];
}

@observer
export default class GroupChart extends React.Component<IGroupChartProps, {}> implements AbstractChart {

    private svg: SVGElement;


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
        return this.props.data.map(dataObj => dataObj.color)
    }
    @computed get victoryBars() {
        return this.props.data.map((group, i) => {
            let data = group.categories.map(category => {
                return {
                    x: category.name,
                    y: category.count
                }
            })
            return (<VictoryBar style={{ data: { width: 20 } }} data={data} key={i} />)
        })
    }

    @computed get bodyWidth() {
        return (_.sum(_.flatMap(this.props.data, group => group.categories.length)) * (28));
    }

    @computed get width() {
        return this.bodyWidth + 100;
    }

    @computed get height(){
        return 300 + this.bottomPadding;
    }

    @computed get bottomPadding(){

        let names = _.flatMap(this.props.data,(group, i) => {
            return _.map(group.categories, category => category.name)

        })

        const adjustedForCaps = names.map((label)=>{
           const capitalizedLetters = label.match(/[A-Z]/g) || [];
           const undercaseLetters = label.match(/[a-z]/g) || [];
           const spaces = label.match(/\s/g) || [];
           return (capitalizedLetters.length * 2) + (undercaseLetters.length * 1) + (spaces.length * 2);
        });

        return _.max(adjustedForCaps)! * 7 + 40 ;

    }

    private get leftPadding(){
        return 80;
    }

    private get topPadding(){
        return 20;
    }

    private get rightPadding(){
        return 20;
    }


    public render() {
        return (
            <div>
                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    width={this.width}
                    height={this.height}
                    padding={{bottom:this.bottomPadding, top:this.topPadding, left:this.leftPadding, right:this.rightPadding }}
                    containerComponent={<VictoryContainer responsive={false}/>}>
                    <VictoryAxis dependentAxis
                        axisLabelComponent={<VictoryLabel dy={-20} />}
                        label={'Counts'}
                    />
                    <VictoryAxis
                        tickLabelComponent={
                            <VictoryLabel
                                angle={-85}
                                verticalAnchor="middle"
                                textAnchor="end"
                            />
                        }

                    />
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