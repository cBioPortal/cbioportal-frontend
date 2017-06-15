import * as React from 'react';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../sampleManager";
import LinePlotVAFTime from "./LinePlotVAFTime"
import HeatmapVAFEvents from "./HeatmapVAFEvents"

interface ICtDNAResultsTabProps {
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}

interface ICtDNAResultsTabState {
  linePlotGene: string;
  heatmapGeneList: string[];
}

export default class CtDNAResultsTab extends React.Component<ICtDNAResultsTabProps, ICtDNAResultsTabState> {

  constructor(props:ICtDNAResultsTabProps) {
    super(props);
    this.state = {
      linePlotGene: 'TP53',
      heatmapGeneList: ['TP53', 'IDH1', 'SLC9A4'],
    };
  }

  public render() {

    return (
      <div>
      <LinePlotVAFTime
        linePlotGene={this.state.linePlotGene}
        mergedMutations={this.props.mergedMutations}
        sampleManager={this.props.sampleManager}/>

      <HeatmapVAFEvents
        heatmapGeneList={this.state.heatmapGeneList}
        mergedMutations={this.props.mergedMutations}
        sampleManager={this.props.sampleManager}/>
      </div>
    )
  }
}
