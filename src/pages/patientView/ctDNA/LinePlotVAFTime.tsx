import * as React from 'react';
import * as _ from 'lodash';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import SampleManager from "../sampleManager";

// require because recharts doesn't have @types
const {LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend} = require('recharts');


interface ILinePlotVAFTimeProps {
    linePlotGene: string;
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}

export default class LinePlotVAFTime extends React.Component<ILinePlotVAFTimeProps, {}> {

  constructor(props:ILinePlotVAFTimeProps) {
    super(props);
  }

  shouldComponentUpdate(newProps:ILinePlotVAFTimeProps, newState:any) {
    let update = false;
    if (this.props.linePlotGene !== newProps.linePlotGene) {
      update = true;
    }
    return update;
  }

  public render() {

    // move all of the calculations to another lifecycle hook
    // also pull in uncalled mutations from store

    const mutations = _.flatten(this.props.mergedMutations);
    const sampleOrder = this.props.sampleManager.sampleOrder;
    const gene = this.props.linePlotGene;

    var plotData:Array<any> = [];
    _.each(mutations, (mutation:Mutation) => {
      let mutGene = mutation.gene.hugoGeneSymbol;
      let mutSample = mutation.sampleId;
      if (~sampleOrder.indexOf(mutSample) && mutGene === gene) {
        let mutPush = {
          'sampleId': mutation.sampleId,
          'hugoGeneSymbol': mutation.gene.hugoGeneSymbol,
          'altFreq': mutation.tumorAltCount/(mutation.tumorRefCount + mutation.tumorAltCount),
        };
        plotData.push(mutPush);
      }
    });

    return (
        <LineChart width={400} height={300} data={plotData}
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
