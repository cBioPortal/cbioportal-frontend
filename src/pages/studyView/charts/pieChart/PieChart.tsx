import * as React from "react";
import "./styles.scss";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, VictoryTooltip, Slice } from 'victory';
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";
import { observable, computed } from "mobx";
import _ from "lodash";
import { annotatePieChartDatum, getPieSliceColors } from "pages/studyView/StudyViewUtils";
import { ClinicalAttributeDataWithMeta } from "pages/studyView/StudyViewPageStore";

export interface IPieChartProps {
    data: ClinicalAttributeDataWithMeta;
    filters:string[];
    onUserSelection:(value:string)=>void;
}

@observer
export class PieChart extends React.Component<IPieChartProps, {}> {

    private colorSet:{[id:string]:string} = {};

    constructor(props: IPieChartProps) {
        super(props);
        this.colorSet = getPieSliceColors(props.data.counts);
    }

    private events = [{
        target: "data",
        eventHandlers: {
        onClick: () => {
            return [
            {
                target: "data",
                mutation: (props:any) => {
                    this.props.onUserSelection(props.datum.x);
                }
            }
            ];
        }
        }
    }];

    @computed get totalCount(){
        return this.props.data.counts.reduce((acc:number,next)=>{
        return acc+next.count
        },0)
    }

    public render() {
        return (
        <div className="study-view-pie">
            <VictoryPie
                containerComponent={<VictoryContainer responsive={false}/>}
                width={200}
                height={175}
                labelRadius={30}
                padding={30}
                //to hide label if the angle is too small(currently set to 20 degrees)
                labels={(d:any) => ((d.y*360)/this.totalCount)<20?'':d.y}
                data={annotatePieChartDatum(this.props.data.counts,this.props.filters,this.colorSet)}
                dataComponent={<CustomSlice/>}
                events={this.events}
                labelComponent={<VictoryLabel/>}
                style={{
                data: { fillOpacity: 0.9 },
                labels: { fill: "white" }
                }}
                x="value"
                y="count"
            />
        </div>
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