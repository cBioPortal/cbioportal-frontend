import * as React from "react";
import "./styles.scss";
import { StudyViewPageStore, ClinicalAttributeDataWithMeta, ClinicalDataType } from "pages/studyView/StudyViewPage";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, VictoryTooltip } from 'victory';
import { ClinicalDataCount } from "shared/api/generated/CBioPortalAPIInternal";
import { observable, computed } from "mobx";
import _ from "lodash";

export interface IPieChartProps {
  data: ClinicalAttributeDataWithMeta;
  filters:string[];
  onUserSelection:(value:string)=>void;
}

//TODO:cleanup
export const COLORS = [
  '#2986e2', '#dc3912', '#f88508', '#109618',
  '#990099', '#0099c6', '#dd4477', '#66aa00',
  '#b82e2e', '#316395', '#994499', '#22aa99',
  '#aaaa11', '#6633cc', '#e67300', '#8b0707',
  '#651067', '#329262', '#5574a6', '#3b3eac',
  '#b77322', '#16d620', '#b91383', '#f4359e',
  '#9c5935', '#a9c413', '#2a778d', '#668d1c',
  '#bea413', '#0c5922', '#743411', '#743440',
  '#9986e2', '#6c3912', '#788508', '#609618',
  '#790099', '#5099c6', '#2d4477', '#76aa00',
  '#882e2e', '#916395', '#794499', '#92aa99',
  '#2aaa11', '#5633cc', '#667300', '#100707',
  '#751067', '#229262', '#4574a6', '#103eac',
  '#177322', '#66d620', '#291383', '#94359e',
  '#5c5935', '#29c413', '#6a778d', '#868d1c',
  '#5ea413', '#6c5922', '#243411', '#103440',
  '#2886e2', '#d93912', '#f28508', '#110618',
  '#970099', '#0109c6', '#d10477', '#68aa00',
  '#b12e2e', '#310395', '#944499', '#24aa99',
  '#a4aa11', '#6333cc', '#e77300', '#820707',
  '#610067', '#339262', '#5874a6', '#313eac',
  '#b67322', '#13d620', '#b81383', '#f8359e',
  '#935935', '#a10413', '#29778d', '#678d1c',
  '#b2a413', '#075922', '#763411', '#773440',
  '#2996e2', '#dc4912', '#f81508', '#104618',
  '#991099', '#0049c6', '#dd2477', '#663a00',
  '#b84e2e', '#312395', '#993499', '#223a99',
  '#aa1a11', '#6673cc', '#e66300', '#8b5707',
  '#656067', '#323262', '#5514a6', '#3b8eac',
  '#b71322', '#165620', '#b99383', '#f4859e',
  '#9c4935', '#a91413', '#2a978d', '#669d1c',
  '#be1413', '#0c8922', '#742411', '#744440',
  '#2983e2', '#dc3612', '#f88808', '#109518',
  '#990599', '#0092c6', '#dd4977', '#66a900',
  '#b8282e', '#316295', '#994199', '#22a499',
  '#aaa101', '#66310c', '#e67200', '#8b0907',
  '#651167', '#329962', '#5573a6', '#3b37ac',
  '#b77822', '#16d120', '#b91783', '#f4339e',
  '#9c5105', '#a9c713', '#2a710d', '#66841c',
  '#bea913', '#0c5822', '#743911', '#743740',
  '#298632', '#dc3922', '#f88588', '#109658',
  '#990010', '#009916', '#dd4447', '#66aa60',
  '#b82e9e', '#316365', '#994489', '#22aa69',
  '#aaaa51', '#66332c', '#e67390', '#8b0777',
  '#651037', '#329232', '#557486', '#3b3e4c',
  '#b77372', '#16d690', '#b91310', '#f4358e',
  '#9c5910', '#a9c493', '#2a773d', '#668d5c',
  '#bea463', '#0c5952', '#743471', '#743450',
  '#2986e3', '#dc3914', '#f88503', '#109614',
  '#990092', '#0099c8', '#dd4476', '#66aa04',
  '#b82e27', '#316397', '#994495', '#22aa93',
  '#aaaa14', '#6633c1', '#e67303', '#8b0705',
  '#651062', '#329267', '#5574a1', '#3b3ea5'
];
@observer
export class PieChart extends React.Component<IPieChartProps, {}> {


  constructor(props: IPieChartProps) {
    super(props);
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
    let data:ClinicalDataCount[] = this.props.data.counts;
    let chartFilters = this.props.filters;
    let result =data.map(prop => {
      let toReturn = {x:prop.value,y:prop.count};
      if(_.includes(chartFilters,prop.value)){
        toReturn = Object.assign({}, toReturn, { stroke: "#cccccc", strokeWidth: 3 });
      }
      return toReturn;
    })
    return (
      <div className="study-view-pie">
        <VictoryPie
          colorScale={COLORS}
          containerComponent={<VictoryContainer responsive={false}/>}
          width={200}
          height={200}
          labelRadius={30}
          padding={35}
          //to hide label if the angle is too small(currently set to 20 degrees)
          labels={(d:any) => ((d.y*360)/this.totalCount)<20?'':d.y}
          data={result}
          events={this.events}
          labelComponent={<CustomTooltip />}
          style={{
            data: { fillOpacity: 0.9 },
            labels: { fill: "white" }
          }}
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