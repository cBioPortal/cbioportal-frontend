import * as React from "react";
import styles from "./styles.scss";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, Slice } from 'victory';
import { observable, computed } from "mobx";
import _ from "lodash";
import { COLORS, UNSELECTED_COLOR, NA_COLOR } from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import { AbstractChart } from "pages/studyView/charts/ChartContainer";
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";
import ifndef from "shared/lib/ifndef";

export interface IPieChartProps {
    data: ClinicalDataCount[];
    filters:string[];
    onUserSelection:(values:string[])=>void;
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}> implements AbstractChart{

    // used in saving slice color
    private colorSet:{[id:string]:string} = {};
    private svgContainer: any;

    constructor(props: IPieChartProps) {
        super(props);
    }

    private get userEvents(){
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onClick: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props:any) => {
                                let filters = self.props.filters;
                                if(_.includes(filters,props.datum.x)){
                                    filters = _.filter(filters, filter=> filter !== props.datum.x);
                                }else{
                                    filters.push(props.datum.x);
                                }
                                self.props.onUserSelection(filters);
                            }
                        }
                    ];
                }
            }
        }];
    }

    public downloadData() {
        return this.props.data.map(obj=>obj.value+'\t'+obj.count).join('\n');
    }

    public toSVGDOMNode():Element {
        return this.svgContainer.firstChild
    }

    @computed get totalCount(){
        return _.sumBy(this.props.data, obj=>obj.count)
    }

    /* Add style properties for each slice datum and make sure
    that the slice color remain same with and without filters

    Step1: check if the slice already has a color assigned
            a. YES -> Go to Step 2
            b. No  -> assign a color depending on the value and update the set
    Step2: check if the filters is empty
            a. Yes -> add fill property to slice datum
            b. No  -> add appropriate slice style properties depending on the filters
    */
    @computed get annotatedData() {
        return this.props.data.map(slice => {
            let color = this.colorSet[slice.value];
            if (_.isUndefined(color)) {
                if (slice.value.toLowerCase().includes('na')) {
                    color = NA_COLOR;
                } else {
                    color = COLORS[Object.keys(this.colorSet).length];
                }
                this.colorSet[slice.value] = color;
            }
            if (_.isEmpty(this.props.filters)) {
                return { ...slice, fill: color };
            } else {
                if (_.includes(this.props.filters, slice.value)) {
                    return { ...slice, fill: color, stroke: "#cccccc", strokeWidth: 3 };
                } else {
                    return { ...slice, fill: UNSELECTED_COLOR, fillOpacity: '0.5' };
                }
            }
        })
    }

    public render() {
        //to hide label if the angle is too small(currently set to 20 degrees)
        return (
            <VictoryPie
                containerComponent={<VictoryContainer
                                        theme={CBIOPORTAL_VICTORY_THEME}
                                        standalone={false}
                                        containerRef={(ref: any) => this.svgContainer = ref}
                                    />}
                width={190}
                height={185}
                labelRadius={30}
                padding={30}
                labels={(d:any) => ((d.y*360)/this.totalCount)<20?'':d.y}
                data={this.annotatedData}
                dataComponent={<CustomSlice/>}
                events={this.userEvents}
                labelComponent={<VictoryLabel/>}
                style={{
                    data: { 
                        fill: (d:any) => ifndef(d.fill, "0x000000"),
                        stroke: (d:any) => ifndef(d.stroke, "0x000000"),
                        strokeWidth: (d:any) => ifndef(d.strokeWidth, 0),
                        fillOpacity: (d:any) => ifndef(d.fillOpacity, 1)
                    },
                    labels: { 
                        fill: "white" 
                    }
                }}
                x="value"
                y="count"
            />
        );
    }

}

class CustomSlice extends React.Component<{}, {}> {
    render() {
        const d:any = this.props;
        return (
        <g>
            <Slice {...this.props}/>
            <title>{`${d.datum.x}:${d.datum.y}`}</title>
        </g>
        );
    }
}