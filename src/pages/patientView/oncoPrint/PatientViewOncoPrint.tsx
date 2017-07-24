import * as React from 'react';
import * as _ from 'lodash';
import SampleManager from "../sampleManager";
import {Mutation} from "shared/api/generated/CBioPortalAPI";

interface IPatientViewOncoPrintProps {
  sampleManager: SampleManager;
  mutationData: Mutation[][];
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
    
    const onco_data:any = [
      {sample:'biopsy-1',
       data:[{gene: 'ABC', sample:'biopsy-1', vaf: 0.1},
             {gene: 'DEF', sample:'biopsy-1', vaf: 0.5},
             {gene: 'GHI', sample:'biopsy-1', vaf: 0.9},
            ],
      },
      {sample:'biopsy-2',
       data:[{gene: 'ABC', sample:'biopsy-2', vaf: 0.9},
             {gene: 'DEF', sample:'biopsy-2', vaf: 0.5},
             {gene: 'GHI', sample:'biopsy-2', vaf: 0.1},
            ],
      },
      {sample:'biopsy-3',
       data:[{gene: 'ABC', sample:'biopsy-3', vaf: 0.3},
             {gene: 'DEF', sample:'biopsy-3', vaf: 0.7},
             {gene: 'GHI', sample:'biopsy-3', vaf: 0.3},
            ],
      },
      {sample:'biopsy-4',
       data:[{gene: 'ABC', sample:'biopsy-4', vaf: 0.8},
             {gene: 'DEF', sample:'biopsy-4', vaf: 0.2},
             {gene: 'GHI', sample:'biopsy-4', vaf: 0.6},
            ],
      },
    ];

    function makeOncoprint(newOncoprint:any, params:any) {
        return new newOncoprint(params.ctr_selector, params.width);
    }

    var oncoprint = makeOncoprint(window.Oncoprint, {ctr_selector: "#patient-view-oncoprint", width: 100 + onco_data.length * 50});
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
        'sortCmpFn': function(d1:any, d2:any) {return 0;},
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

    for (let i=0; i<onco_data.length; i++) {
      oncoprint.setTrackData(onco_data[i].track_id, onco_data[i].data, 'gene');
      oncoprint.setTrackInfo(onco_data[i].track_id, onco_data[i].sample);
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
