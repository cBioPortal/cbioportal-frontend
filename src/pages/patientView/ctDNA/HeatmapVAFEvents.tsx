import * as React from 'react';
import * as _ from 'lodash';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import SampleManager from "../sampleManager";

const Chart = require('chart.heatmap.js/dst/Chart.HeatMap.S');


interface IHeatmapVAFEventsProps {
    heatmapGeneList: string[];
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}


export default class HeatmapVAFEvents extends React.Component<IHeatmapVAFEventsProps, {}> {

  constructor(props:IHeatmapVAFEventsProps) {
    super(props);
  }

  extractPlotData() {
    // also pull in uncalled mutations from store
    // perform check if objects still the same (shouldComponentUpdate)

    const mutations = _.flatten(this.props.mergedMutations);
    const sampleOrder = this.props.sampleManager.sampleOrder;
    const heatmapGeneList = this.props.heatmapGeneList;

    var plotData:Array<any> = [];
    _.each(heatmapGeneList, (gene:string) => {
      plotData.push({
        label: gene,
        data: new Array(sampleOrder.length),
      });
    });

    _.each(mutations, (mutation:Mutation) => {
      let mutGene = mutation.gene.hugoGeneSymbol;
      let mutSample = mutation.sampleId;
      if (~sampleOrder.indexOf(mutSample) && ~heatmapGeneList.indexOf(mutGene)) {
        let vaf = mutation.tumorAltCount/(mutation.tumorRefCount + mutation.tumorAltCount);
        let sampInd = sampleOrder.indexOf(mutSample);
        let geneInd = heatmapGeneList.indexOf(mutGene);
        plotData[geneInd].data[sampInd] = Math.round(vaf*100);
      }
    });

    let plotMaker = {
      datasets: plotData,
      labels: sampleOrder,
    };
    return plotMaker;
  }

  componentDidMount() {
    let plotMaker = this.extractPlotData();

    let config = {};

    let data = {
      labels : plotMaker.labels,
      datasets : plotMaker.datasets,
    };

    let canvas:any = document.getElementById("heatmap");
    let ctx = canvas.getContext("2d");
    let chart = new Chart(ctx).HeatMap(data, config);
  }

  public render() {
    return (
      <canvas id="heatmap" width={400} height={300}></canvas>
    )
  }
}
