var cell_padding = 3;
var whitespace_on = true;

var onc = Oncoprint.create('#onc', {cell_padding: cell_padding});

$('#shuffle_btn').click(function() {
	onc.sort(gender_track_id, function(d1, d2) {
		var map = {'MALE':0, 'FEMALE':1};
		return map[d1.attr_val] - map[d2.attr_val];
	});
});

$('#toggle_whitespace').click(function() {
	onc.toggleCellPadding();
});
var z = 1;
$('#reduce_cell_width').click(function() {
	z *= 0.9;
	onc.setZoom(z);
});
 /*$('#to_svg_btn').click(function() {
 	onc.toSVG(d3.select('#svg_container'));
	var DOMURL = window.URL || window.webkitURL || window;
	var ctx = $('#canvas')[0].getContext('2d');
	var img = new Image();
	var svg;
	var data = $('#svg_container')[0].outerHTML;
	console.log(data);
	svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
	console.log(svg);
	var url = DOMURL.createObjectURL(svg);
	img.src = url;
	img.onload = function() {
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);
	};
 });*/

var gender_data;
var gender_track_id;
var gender_data_promise = $.getJSON('dist/test/gbm/gender-gbm.json');

var mutation_data;
var mutation_track_id;
var mutation_data_promise = $.getJSON('dist/test/gbm/mutations-gbm.json');

var alteration_data;
var alteration_track_id;
var alteration_data_promise = $.getJSON('dist/test/gbm/tp53.json');

var tracks_to_load = 8;
onc.suppressRendering();

gender_data_promise.then(function(data) {
	gender_data = data.data;
});
$.when(gender_data_promise).then(function() {
	gender_track_id = onc.addTrack({label: 'Gender'});
	tracks_to_load -= 1;
	onc.setRuleSet(gender_track_id, Oncoprint.CATEGORICAL_COLOR, {
		color: {},
		getCategory: function(d) {
			return d.attr_val;
		},
		legend_label: 'Gender'
	});

	onc.setTrackData(gender_track_id, gender_data);
	for (var i=0; i<2; i++) {
		var dup_gender_track_id = onc.addTrack({label: 'Gender'});
		onc.useSameRuleSet(dup_gender_track_id, gender_track_id);
		onc.setTrackData(dup_gender_track_id, gender_data);
		tracks_to_load -= 1;
	}
	if (tracks_to_load === 0) {
		onc.releaseRendering();
	}
});

mutation_data_promise.then(function(data) {
	mutation_data = data.data;
});
$.when(mutation_data_promise).then(function() {
	mutation_track_id = onc.addTrack({label: 'Mutations', 
		tooltip: function(d) {
			return '<a href="http://www.google.com"><p><b>'+d.sample+'</b>: '+d.attr_val+'</p></a>';
		}
	}, 0);
	tracks_to_load -= 1;
	onc.setRuleSet(mutation_track_id, Oncoprint.GRADIENT_COLOR, {
		data_key: 'attr_val',
		color_range: ['#A9A9A9', '#FF0000'],
		data_range: [0,100],
		legend_label: 'Mutations',
	});
	onc.setTrackData(mutation_track_id, mutation_data);

	var log_mut_track_id = onc.addTrack({label: 'Log Mutations'}, 0);
	tracks_to_load -= 1;
	onc.setRuleSet(log_mut_track_id, Oncoprint.BAR_CHART, {
		data_key: 'attr_val',
		data_range: [0,100],
		fill: '#ff0000',
		scale: 'log',
		legend_label: 'Mutations (Log scale)'
	});
	onc.setTrackData(log_mut_track_id, mutation_data);

	var dup_mut_track_id = onc.addTrack({label: 'Mutations'}, 0);
	tracks_to_load -= 1;
	onc.setRuleSet(dup_mut_track_id, Oncoprint.BAR_CHART, {
		data_key: 'attr_val',
		data_range: [0,100],
		fill: '#ff0000',
		legend_label: 'Mutations (Linear scale)'
	});
	onc.setTrackData(dup_mut_track_id, mutation_data);
	if (tracks_to_load === 0) {
		onc.releaseRendering();
	}
});


alteration_data_promise.then(function(data) {
	alteration_data = _.map(data, function(x) { if (Math.random() < 0.3) { x.mut_type='MISSENSE'; } return x; });
});
$.when(alteration_data_promise).then(function() {
	alteration_track_id = onc.addTrack({label: 'TP53'}, 1);
	tracks_to_load -= 1;
	onc.setRuleSet(alteration_track_id, Oncoprint.GENETIC_ALTERATION);
	onc.setTrackData(alteration_track_id, alteration_data);

	var second_alt_track = onc.addTrack({Label: 'TP53 duplicate'}, 1);
	tracks_to_load -= 1;
	onc.useSameRuleSet(second_alt_track, alteration_track_id);
	onc.setTrackData(second_alt_track, alteration_data);
	if (tracks_to_load === 0) {
		onc.releaseRendering();
	}
});

$('#change_color_scheme').click(function() {
	onc.setRuleSet(gender_track_id, Oncoprint.CATEGORICAL_COLOR, {
		color: {MALE: '#000000', FEMALE: '#999999'},
		getCategory: function(d) {
			return d.attr_val;
		},
		legend_label: 'Gender (modified color)'
	});
});
