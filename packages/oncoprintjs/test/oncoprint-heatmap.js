$(document).ready(function() {

var oncoprint = new window.Oncoprint("#oncoprint-heatmap", 800);
oncoprint.suppressRendering();

// hm_data is in heatmap-data.js

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
    'target_group': 1,
    'removable': true,
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
