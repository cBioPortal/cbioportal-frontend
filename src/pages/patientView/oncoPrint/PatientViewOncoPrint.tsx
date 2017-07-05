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
    const fake_data:any = [
      {gene:'ABC',
       data:[{gene: 'ABC', sample:'biopsy-1', vaf: 0.5},
             {gene: 'ABC', sample:'biopsy-2', vaf: 0.7},
             {gene: 'ABC', sample:'biopsy-3', vaf: 0.9},
             {gene: 'ABC', sample:'biopsy-4', vaf: 1.0},
            ],
      },
      {gene:'DEF',
       data:[{gene: 'DEF', sample:'biopsy-1', vaf: 1.0},
             {gene: 'DEF', sample:'biopsy-2', vaf: 0.9},
             {gene: 'DEF', sample:'biopsy-3', vaf: 0.7},
             {gene: 'DEF', sample:'biopsy-4', vaf: 0.5},
            ],
      },
      {gene:'GHI',
       data:[{gene: 'GHI', sample:'biopsy-1', vaf: 0.8},
             {gene: 'GHI', sample:'biopsy-2', vaf: 0.3},
             {gene: 'GHI', sample:'biopsy-3', vaf: 0.8},
             {gene: 'GHI', sample:'biopsy-4', vaf: 0.2},
            ],
      },
    ];

    function makeOncoprint(newOncoprint:any, params:any) {
        return new newOncoprint(params.ctr_selector, params.width);
    }

    var oncoprint = makeOncoprint(window.Oncoprint, {ctr_selector: "#patient-view-oncoprint", width: 1050});
    oncoprint.suppressRendering();

    var hm_ids:number[] = [];
    var track_data:any[] = [];
    for (var i=0; i<fake_data.length; i++) {
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
        'has_column_spacing': false,
        'track_padding': 0,
        'label': fake_data[i].gene,
        'sortCmpFn': function(d1:any, d2:any) {return 0;},
        'target_group': 0,
        'removable': true,
      };
      var new_hm_id = oncoprint.addTracks([track_params])[0];
      hm_ids.push(new_hm_id);
      track_data.push(fake_data[new_hm_id]);
      var share_id = null;
      if (hm_ids.length === 0) {
        share_id = new_hm_id;
      } else {
        oncoprint.shareRuleSet(share_id, new_hm_id);
      }
    }

    oncoprint.hideIds([], true);
    oncoprint.keepSorted(false);

    for (let i=0; i<track_data.length; i++) {
      oncoprint.setTrackData(i, track_data[i].data, 'sample');
      oncoprint.setTrackInfo(i, track_data[i].data);
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
