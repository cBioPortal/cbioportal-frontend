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
    linePlotGene: string;
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}

export default class LineVAFTimePlot extends React.Component<ILineVAFTimePlotProps, {}> {

  constructor(props:ILineVAFTimePlotProps) {
    super(props);
  }

  public render() {

    // move all of the calculations to another lifecycle hook
    // also pull in uncalled mutations from store
    // perform check if objects still the same (shouldComponentUpdate)

    const mutations = _.flatten(this.props.mergedMutations);
    const uniqMutSamples = _.uniq(_.map(mutations, 'sampleId'));
    const gene = this.props.linePlotGene;

    var plotData:Array<any> = [];
    _.each(this.props.sampleManager.samples, (sample:ClinicalDataBySampleId) => {
      var sampleMutData = _.filter(mutations, function (mutData:Mutation) {
        return (
          (mutData.sampleId === sample.id && mutData.gene.hugoGeneSymbol === gene)
        );
      });
      if (sampleMutData.length > 0) {
        var mutPush = {
          'sampleId': sampleMutData[0].sampleId,
          'altFreq': (sampleMutData[0].tumorAltCount/
                     (sampleMutData[0].tumorRefCount + sampleMutData[0].tumorAltCount)),
        };
        plotData.push(mutPush);
      } else {
        plotData.push({
          'sampleId': sample.id,
          'altFreq': NaN,
        });
      }
    });

    return (
        <LineChart width={600} height={300} data={plotData}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}>
         <XAxis dataKey="sampleId"/>
         <YAxis type="number" domain={[0, 1]}/>
         <CartesianGrid strokeDasharray="3 3"/>
         <Tooltip/>
         <Legend />
         <Line type="monotone" dataKey="altFreq" stroke="#990000" strokeWidth={2} activeDot={{r: 8}}/>
        </LineChart>
    )
  }
}
