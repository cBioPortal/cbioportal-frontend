$(document).ready(function() {

var oncoprint = new window.Oncoprint("#oncoprint-heatmap", 800);
var TRACK_GROUP = 1;

// hm_data is in heatmap-data.js

var current_expansion_tracks = [];
function makeExpandCallback(gene_id) {
  return function (parent_track_id) {
    oncoprint.suppressRendering();
    try {
      for (var i = 0; i < 3; i++) {
        var track_params = {
            'rule_set_params': {
              'type': 'gradient',
              'legend_label': 'Expansion',
              'value_key': 'vaf',
              'value_range': [-3, 3],
              'colors': [[0, 255, 255,1],[0,0,0,1],[255,255,0,1]],
              'value_stop_points': [-3, 0, 3],
              'null_color': 'rgba(224,224,224,1)',
            },
            'has_column_spacing': true,
            'track_padding': 5,
            'label': gene_id + 'abc'[i],
            'track_label_color': 'teal',
            'sortCmpFn': function(d1, d2) {return 0;},
            'target_group': TRACK_GROUP,
            'expansion_of': parent_track_id,
            'removable': true,
            'removeCallback': function (track_id) {
              current_expansion_tracks.splice(
                  current_expansion_tracks.indexOf(track_id),
                  1
              )
            }
        }
        var new_track_id = oncoprint.addTracks([track_params])[0];
        if (current_expansion_tracks.length > 0) {
          oncoprint.shareRuleSet(current_expansion_tracks[0], new_track_id);
        }
        current_expansion_tracks.push(new_track_id);
        var data_record = hm_data.filter(function (record) {
          return record.gene === gene_id;
        })[0];
        oncoprint.setTrackData(new_track_id, data_record.data, 'sample');
      }
    } finally {
      oncoprint.releaseRendering();
    }
  }
}

oncoprint.suppressRendering();

var share_id = null;
for (var i = 0; i < hm_data.length; i++) {
  var track_params = {
    'rule_set_params': {
        'type': 'gradient',
        'legend_label': 'Heatmap',
        'value_key': 'vaf',
        'value_range': [-3, 3],
        'colors': [[255,0,0,1],[0,0,0,1],[0,0,255,1]],
        'value_stop_points': [-3, 0, 3],
        'null_color': 'rgba(224,224,224,1)'
    },
    'has_column_spacing': true,
    'track_padding': 5,
    'label': hm_data[i].gene,
    'sortCmpFn': function(d1, d2) {return 0;},
    'target_group': TRACK_GROUP,
    'expandCallback': makeExpandCallback(hm_data[i].gene),
    'removable': true
  };
  var new_hm_id = oncoprint.addTracks([track_params])[0];
  hm_data[i].track_id = new_hm_id;
  if (i === 0) {
    share_id = new_hm_id;
  } else {
    oncoprint.shareRuleSet(share_id, new_hm_id);
  }
}

oncoprint.hideIds([], true);
oncoprint.keepSorted(false);

for (var i = 0; i < hm_data.length; i++) {
  oncoprint.setTrackData(hm_data[i].track_id, hm_data[i].data, 'sample');
  oncoprint.setTrackInfo(hm_data[i].track_id, "VAF");
  oncoprint.setTrackTooltipFn(hm_data[i].track_id, function(data) {
    return "<b>Sample: " + data.sample + "<br/>VAF: " + data.vaf.toString().slice(0, 4) + "</b>";
  });
}

oncoprint.keepSorted(true);
oncoprint.releaseRendering();

});
