import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import SampleManager from "../sampleManager";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";

// require because recharts doesn't have @types
const recharts = require('recharts');
const LineChart = recharts.LineChart;
const Line = recharts.Line;
const XAxis = recharts.XAxis;
const YAxis = recharts.YAxis;
const Tooltip = recharts.Tooltip;
const CartesianGrid = recharts.CartesianGrid;
const Legend = recharts.Legend;


interface ILineVAFTimePlotProps {
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}

export default class LineVAFTimePlot extends React.Component<ILineVAFTimePlotProps, {}> {

  constructor(props:ILineVAFTimePlotProps) {
    super(props);
    this.state = {
      'gene': 'TP53',
    };
  }

  public render() {

    // also pull in uncalled mutations from store
    // perform check if objects still the same (shouldComponentUpdate)

    const mutations = _.flatten(this.props.mergedMutations);
    const uniqMutSamples = _.uniq(_.map(mutations, 'sampleId'));

    var plotData:Array<any> = [];
    _.each(this.props.sampleManager.samples, (sample:ClinicalDataBySampleId) => {
      var sampleMutData = _.filter(mutations, function (mutData:Mutation) {
        return (
          (mutData.sampleId === sample.id && mutData.gene.hugoGeneSymbol === 'TP53')
        );
      });
      if (sampleMutData.length > 0) {
        var mutPush = {
          'sampleId': sampleMutData[0].sampleId,
          'altFreq': sampleMutData[0].tumorAltCount/(sampleMutData[0].tumorRefCount + sampleMutData[0].tumorAltCount),
        };
        plotData.push(mutPush);
      }
    });

    debugger;

    /*const data = [
      {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
      {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
      {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
      {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
      {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
      {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
      {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
    ];*/

    return (
        <LineChart width={600} height={300} data={plotData}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}>
         <XAxis dataKey="sampleId"/>
         <YAxis/>
         <CartesianGrid strokeDasharray="3 3"/>
         <Tooltip/>
         <Legend />
         <Line type="monotone" dataKey="altFreq" stroke="#8884d8" activeDot={{r: 8}}/>
        </LineChart>
    )
  }
}
