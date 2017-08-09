$(document).ready(function() {

var oncoprint = new window.Oncoprint("#oncoprint-glyphmap", 800);
oncoprint.suppressRendering();

function geneticComparator() {
  var cna_key = 'disp_cna';
  var cna_order = {'amp': 0, 'homdel': 1, 'gain': 2, 'hetloss': 3, 'diploid': 4, undefined: 5};
  var mut_type_key = 'disp_mut';
  var mut_order = {'trunc': 0, 'inframe': 1, 'promoter': 2, 'missense': 3, undefined: 4};
  var mrna_key = 'disp_mrna';
  var prot_key = 'disp_prot';
	var reg_order = {'up': 0, 'down': 1, undefined: 2};
  return function (d1, d2) {
    var keys = [cna_key, mut_type_key, mrna_key, prot_key];
    var orders = [cna_order, mut_order, reg_order, reg_order];
    var diff = 0;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var order = orders[i];
      if (d1[key] && d2[key]) {
        diff = order[d1[key]] - order[d2[key]];
      } else if (d1[key]) {
        diff = -1;
      } else if (d2[key]) {
        diff = 1;
      }
    }
    return diff;
  }
}

var share_id = null;
for (var i = 0; i < ga_data.length; i++) {
  var track_params = {
    'rule_set_params': window.geneticrules.genetic_rule_set_different_colors_no_recurrence,
    'label': ga_data[i].gene,
    'target_group': 0,
    'sortCmpFn': geneticComparator(),
    'description': ga_data[i].desc,
    'na_z': 1.1
  };
  var new_ga_id = oncoprint.addTracks([track_params])[0];
  ga_data[i].track_id = new_ga_id;
  if (i === 0) {
    share_id = new_ga_id;
  } else {
    oncoprint.shareRuleSet(share_id, new_ga_id);
  }
}

oncoprint.hideIds([], true);
oncoprint.keepSorted(false);

for (var i = 0; i < ga_data.length; i++) {
  oncoprint.setTrackData(ga_data[i].track_id, ga_data[i].data, 'sample');
  oncoprint.setTrackInfo(ga_data[i].track_id, "");
  oncoprint.setTrackTooltipFn(ga_data[i].track_id, function(data) {
    return "<b>Sample: " + data.sample + "</b>";
  });
}

oncoprint.keepSorted(true);
oncoprint.releaseRendering();

});
