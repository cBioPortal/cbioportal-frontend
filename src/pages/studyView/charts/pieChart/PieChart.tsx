import * as React from "react";
import "./styles.scss";
import { StudyViewPageStore, ClinicalAttributeDataWithMeta, ClinicalDataType } from "pages/studyView/StudyViewPage";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, VictoryTooltip } from 'victory';
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";
import { observable, computed } from "mobx";
import _ from "lodash";
import { annotatePieChartDatum, COLORS, NA_COLOR } from "pages/studyView/StudyViewUtils";

export interface IPieChartProps {
  data: ClinicalAttributeDataWithMeta;
  filters:string[];
  onUserSelection:(value:string)=>void;
}

@observer
export class PieChart extends React.Component<IPieChartProps, {}> {


  private colorSet:{[id:string]:string} = {}
  constructor(props: IPieChartProps) {
    super(props);

    let index = 0
    props.data.counts.forEach(obj => {
      if(obj.value.includes('NA')){
        this.colorSet[obj.value] = NA_COLOR;
      } else{
        this.colorSet[obj.value] = COLORS[index]
        index++;
      }
    })
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
          //colorScale={COLORS}
          containerComponent={<VictoryContainer responsive={false}/>}
          width={200}
          height={200}
          labelRadius={30}
          padding={35}
          //to hide label if the angle is too small(currently set to 20 degrees)
          labels={(d:any) => ((d.y*360)/this.totalCount)<20?'':d.y}
          data={annotatePieChartDatum(this.props.data.counts,this.props.filters,this.colorSet)}
          events={this.events}
          labelComponent={<CustomTooltip />}
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

class CustomTooltip extends React.Component<{}, {}> {
  static defaultEvents = VictoryTooltip.defaultEvents
  render() {
    const d:any = this.props;
    return (
      <g>
        <VictoryTooltip {...this.props}
                        pointerLength={0}
                        cornerRadius={0}
                        text={`${d.datum.x}: ${d.datum.y}`}
                        style={{ fontSize: '10px',fontFamily: "Verdana, Arial, sans-serif" }}
                        flyoutStyle={{ strokeWidth: '0' }}
        />
        <VictoryLabel {...this.props}/>
      </g>
    );
  }
}