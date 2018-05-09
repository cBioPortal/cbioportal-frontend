import * as React from "react";
import "./styles.scss";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, Slice } from 'victory';
import { observable, computed } from "mobx";
import _ from "lodash";
import { annotatePieChartDatum, getPieSliceColors } from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import { AbstractChart } from "pages/studyView/charts/Chart";
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";

export interface IPieChartProps {
    data: ClinicalDataCount[];
    filters:string[];
    onUserSelection:(values:string[])=>void;
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}> implements AbstractChart{

    private colorSet:{[id:string]:string} = {};
    private svgContainer: any;

    constructor(props: IPieChartProps) {
        super(props);
        this.colorSet = getPieSliceColors(props.data);
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

    public render() {
        return (
            <VictoryPie
                theme={CBIOPORTAL_VICTORY_THEME}
                containerComponent={<VictoryContainer 
                                        responsive={false}
                                        className="study-view-pie"
                                        containerRef={(ref: any) => this.svgContainer = ref}
                                    />}
                width={200}
                height={185}
                labelRadius={30}
                padding={30}
                //to hide label if the angle is too small(currently set to 20 degrees)
                labels={(d:any) => ((d.y*360)/this.totalCount)<20?'':d.y}
                data={annotatePieChartDatum(this.props.data,this.props.filters,this.colorSet)}
                dataComponent={<CustomSlice/>}
                events={this.userEvents}
                labelComponent={<VictoryLabel/>}
                style={{
                data: { fillOpacity: 0.9 },
                labels: { fill: "white" }
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