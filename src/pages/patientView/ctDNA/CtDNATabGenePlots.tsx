import * as React from 'react';
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../sampleManager";
import LineVAFTimePlot from "./LineVAFTimePlot"

interface ICtDNATabGenePlotsProps {
    mergedMutations: Mutation[][];
    sampleManager:SampleManager;
}

interface ICtDNATabGenePlotsState {
  linePlotGene: string;
  heatmapGeneList: string[];
}

export default class CtDNATabGenePlots extends React.Component<ICtDNATabGenePlotsProps, ICtDNATabGenePlotsState> {

  constructor(props:ICtDNATabGenePlotsProps) {
    super(props);
    this.state = {
      linePlotGene: 'TP53',
      heatmapGeneList: ['TP53'],
    };
  }

  public render() {

    return (
      <LineVAFTimePlot
        linePlotGene={this.state.linePlotGene}
        mergedMutations={this.props.mergedMutations}
        sampleManager={this.props.sampleManager}/>
    )
  }
}
