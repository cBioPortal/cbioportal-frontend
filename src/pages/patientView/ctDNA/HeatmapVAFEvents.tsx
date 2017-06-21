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

  chart:any;

  constructor(props:IHeatmapVAFEventsProps) {
    super(props);
    this.chart = undefined;
  }

  extractPlotData() {
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
        let mutPush = [
          sampleOrder.indexOf(mutSample),
          heatmapGeneList.indexOf(mutGene),
          vaf,
        ];
        plotData.push(mutPush);
      }
    });

    let plotMaker = {
      data: plotData,
      xTicks: sampleOrder,
      yTicks: heatmapGeneList,
    };
    return plotMaker;
  }

  componentDidMount() {
    let plotMaker = this.extractPlotData();

    let config = {};

    let data = {
      labels : ['0h','1h','2h','3h','4h','5h','6h','7h','8h','9h','10h','11h'],
      datasets : [
        {
          label: 'Monday',
          data: [8, 6, 5, 7, 9, 8, 1, 6, 3, 3, 8, 7]
        },
        {
          label: 'Tuesday',
          data: [6, 8, 5, 6, 5, 5, 7, 0, 0, 3, 0, 7]
        },
        {
          label: 'Wednesday',
          data: [8, 5, 6, 4, 2, 2, 3, 0, 2, 0, 10, 8]
        },
        {
          label: 'Thursday',
          data: [4, 0, 7, 4, 6, 3, 2, 4, 2, 10, 8, 2]
        },
        {
          label: 'Friday',
          data: [1, 0, 0, 7, 0, 4, 1, 3, 4, 5, 1, 10]
        }
      ]
    };

    var canvas:any = document.getElementById("heatmap");
    var ctx = canvas.getContext("2d");
    this.chart = new Chart(ctx).HeatMap(data, config);
  }

  public render() {
    return (
      <canvas id="heatmap" width="800" height="400"></canvas>
    )
  }
}
