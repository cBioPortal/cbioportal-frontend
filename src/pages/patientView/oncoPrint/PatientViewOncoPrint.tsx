import * as React from 'react';
import * as _ from 'lodash';
import SampleManager from "../sampleManager";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
const Oncoprint = require('oncoprintjs/dist/oncoprint-bundle.js');


interface IPatientViewOncoPrintProps {
  sampleManager: SampleManager;
  mutationData: Mutation[][];
}

interface IOncoData {
  track_id?: number;
  track_info: string;
  sample: string;
  data: Array<{
      gene: string;
      vaf: number;
  }>;
}

declare global {
  interface Window {
    Oncoprint:(ctr_selector:string, width:number) => void;
  }
}

export default class PatientViewOncoPrint extends React.Component<IPatientViewOncoPrintProps, {}> {
  constructor(props:IPatientViewOncoPrintProps) {
    super(props);
  }

  componentDidMount() {

    const hugo_genes = _.map(this.props.mutationData, function(mut_array) {
      return mut_array[0].gene.hugoGeneSymbol;
    });
    const sample_order = this.props.sampleManager.sampleOrder;
    const mutations = _.flatten(this.props.mutationData);

    const onco_data:IOncoData[] = [];
    for (var i = 0; i < sample_order.length; i++) {
      var sample_id = sample_order[i];
      const push_data:any[] = [];
      for (var j = 0; j < hugo_genes.length; j++) {
        var gene_id = hugo_genes[j];
        push_data.push({gene: gene_id, vaf: 0});
      }
      onco_data.push({sample: sample_id, data: push_data, track_info: ""});
    }

    _.each(mutations, function(mut_data) {
      var i = sample_order.indexOf(mut_data.sampleId);
      var j = hugo_genes.indexOf(mut_data.gene.hugoGeneSymbol);
      var tumor_ratio = 0;
      if (mut_data.tumorAltCount !== -1 && mut_data.tumorRefCount !== -1) {
        tumor_ratio = mut_data.tumorAltCount/(mut_data.tumorRefCount + mut_data.tumorAltCount);
      }
      onco_data[i].data[j].vaf = tumor_ratio;
    });

    function makeOncoprint(newOncoprint:any, params:any) {
        return new newOncoprint(params.ctr_selector, params.width);
    }

    var oncoprint = makeOncoprint(window.Oncoprint, {ctr_selector: "#patient-view-oncoprint", width: 800});

    oncoprint.suppressRendering();

    var share_id = null;
    for (var i=0; i<onco_data.length; i++) {
      const track_params:any = {
        'rule_set_params': {
            'type': 'gradient',
            'legend_label': 'Heatmap',
            'value_key': 'vaf',
            'value_range': [0, 1],
            'colors': [[0,0,0,1],[0,0,255,1]],
            'value_stop_points': [0, 1],
            'null_color': 'rgba(224,224,224,1)'
        },
        'has_column_spacing': true,
        'track_padding': 5,
        'label': onco_data[i].sample,
        'sortCmpFn': function(d1:any, d2:any) {
          if (d1.vaf && d2.vaf) {
            return d2.vaf - d1.vaf;
          } else if (d1.vaf) {
            return -1;
          }  else if (d2.vaf) {
            return 1;
          }  else {
            return 0;
          }
        },
        'target_group': 0,
        'removable': true,
      };
      var new_hm_id = oncoprint.addTracks([track_params])[0];
      onco_data[i].track_id = new_hm_id;
      if (i === 0) {
        share_id = new_hm_id;
      } else {
        oncoprint.shareRuleSet(share_id, new_hm_id);
      }
    }

    oncoprint.hideIds([], true);
    oncoprint.keepSorted(false);

    for (let i = 0; i < onco_data.length; i++) {
      oncoprint.setTrackData(onco_data[i].track_id, onco_data[i].data, 'gene');
      oncoprint.setTrackInfo(onco_data[i].track_id, onco_data[i].track_info);
      oncoprint.setTrackTooltipFn(onco_data[i].track_id, function(data:any) {
        return "<b>Gene: " + data.gene + "<br/>VAF: " + data.vaf.toString().slice(0, 4) + "</b>";
      });
    }

    oncoprint.keepSorted(true);
    oncoprint.releaseRendering();
  }

  render() {

    return (
      <div id="patient-view-oncoprint"></div>
    )
  }
}
