import * as React from 'react';
import * as _ from 'lodash';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import SampleManager from "../sampleManager";

// require because recharts doesn't have @types
const {ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Legend} = require('recharts');


interface IHeatmapVAFEventsProps {
    heatmapGeneList: string[];
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}


export default class HeatmapVAFEvents extends React.Component<IHeatmapVAFEventsProps, {}> {

  constructor(props:IHeatmapVAFEventsProps) {
    super(props);
  }

  public render() {

    // move all of the calculations to another lifecycle hook
    // also pull in uncalled mutations from store
    // perform check if objects still the same (shouldComponentUpdate)

    const mutations = _.flatten(this.props.mergedMutations);
    const sampleOrder = this.props.sampleManager.sampleOrder;
    const heatmapGeneList = this.props.heatmapGeneList;

    var plotData:Array<any> = [];
    _.each(mutations, (mutation:Mutation) => {
      let mutGene = mutation.gene.hugoGeneSymbol;
      let mutSample = mutation.sampleId;
      if (~sampleOrder.indexOf(mutSample) && ~heatmapGeneList.indexOf(mutGene)) {
        let vaf = mutation.tumorAltCount/(mutation.tumorRefCount + mutation.tumorAltCount);
        let mutPush = {
          x: sampleOrder.indexOf(mutSample),
          y: heatmapGeneList.indexOf(mutGene),
          z: Math.round(vaf * 1000),
        };
        plotData.push(mutPush);
      }
    });

    return (
      <ScatterChart width={(sampleOrder.length * 100)} height={(heatmapGeneList.length * 100)} margin={{top: 20, right: 20, bottom: 20, left: 20}}>
        <XAxis dataKey={'x'} allowDecimals={false} domain={[0, 'dataMax']}/>
        <YAxis dataKey={'y'} allowDecimals={false} domain={[0, 'dataMax']}/>
        <ZAxis dataKey={'z'} range={[0, 1000]}/>
        <CartesianGrid />
        <Tooltip/>
        <Legend/>
        <Scatter name='altFreq' data={plotData} fill='#003366' shape="circle"/>
      </ScatterChart>
    )
  }
}
