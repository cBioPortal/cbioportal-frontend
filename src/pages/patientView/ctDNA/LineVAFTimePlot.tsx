import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import {Mutation, ClinicalEvent, ClinicalEventData} from "../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../sampleManager";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";

const recharts = require('recharts');
const LineChart = recharts.LineChart;
const Line = recharts.Line;
const XAxis = recharts.XAxis;
const YAxis = recharts.YAxis;
const Tooltip = recharts.Tooltip;
const CartesianGrid = recharts.CartesianGrid;
const Legend = recharts.Legend;


interface ExampleDataArrayProps {
  [index: number]: {
    name: string;
    uv: number;
    pv: number;
    amt: number;
  };
}

export default class LineVAFTimePlot extends React.Component<ExampleDataArrayProps, {}> {
  public render() {

    const data = [
      {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
      {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
      {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
      {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
      {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
      {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
      {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
    ];

    return (
        <LineChart width={600} height={300} data={data}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}>
         <XAxis dataKey="name"/>
         <YAxis/>
         <CartesianGrid strokeDasharray="3 3"/>
         <Tooltip/>
         <Legend />
         <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{r: 8}}/>
         <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>
    )
  }
}
