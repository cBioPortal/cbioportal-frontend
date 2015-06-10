var _ = require('underscore');
var $ = require('jquery');

var Oncoprint = require('../../src/js/Oncoprint');
var cell_padding = 3;
var whitespace_on = true;

var onc = CreateOncoprint('#onc', {cell_padding: cell_padding});

$('#shuffle_btn').click(function() {
	onc.sortOnTrack(gender_track_id, function(d1, d2) {
		var map = {'MALE':0, 'FEMALE':1};
		return map[d1.attr_val] - map[d2.attr_val];
	});
});

$('#toggle_whitespace').click(function() {
	whitespace_on = !whitespace_on;
	if (whitespace_on) {
		onc.setCellPadding(cell_padding);
	} else {
		onc.setCellPadding(0);
	}
});

var gender_data;
var gender_track_id;
var gender_data_promise = $.getJSON('./gbm/gender-gbm.json');

var mutation_data;
var mutation_track_id;
var mutation_data_promise = $.getJSON('./gbm/mutations-gbm.json');

var alteration_data;
var alteration_track_id;
var alteration_data_promise = $.getJSON('./gbm/tp53.json');

gender_data_promise.then(function(data) {
	gender_data = data.data;
});
$.when(gender_data_promise).then(function() {
	gender_track_id = onc.addTrack(gender_data, {label: 'Gender'});
	onc.getTrack(gender_track_id).useRenderTemplate('categorical_color', {
		color: {MALE: '#6699FF', FEMALE: '#FF00FF'},
		category: function(d) {
			return d.attr_val;	
		}
	});
});

mutation_data_promise.then(function(data) {
	mutation_data = data.data;
});
$.when(mutation_data_promise).then(function() {
	for (var i=0; i<10; i++) {
	mutation_track_id = onc.addTrack(mutation_data, {label: 'Mutations'});
	onc.getTrack(mutation_track_id).useRenderTemplate('continuous_color', {
		data_key: 'attr_val',
		data_range: [0,100],
		color_range: ['#A9A9A9', '#FF0000']
	});
}
});

alteration_data_promise.then(function(data) {
	alteration_data = data;
});
$.when(alteration_data_promise).then(function() {
	alteration_track_id = onc.addTrack(alteration_data, {label: 'TP53'});
	onc.getTrack(alteration_track_id).useRenderTemplate('genetic_alteration', {
		cna_key: 'cna',
		cna_amp_name: 'AMPLIFIED',
		cna_homdel_name: 'HOMODELETED',
		cna_gain_name: 'GAINED',
		cna_hetloss_name: 'HETLOSS',
		cna_amp_color: '#FF0000',
		cna_gain_color: '#FFB6C1',
		cna_hetloss_color: '#8FD8D8',
		cna_homdel_color: '#0000FF',
		default_cell_color: '#D3D3D3'
	});
});

$('#change_color_scheme').click(function() {
	onc.getTrack(gender_track_id).useRenderTemplate('categorical_color', {
		color: {MALE: '#0F0F0F', FEMALE: '#D6D6D6'},
		category: function(d) {
			return d.attr_val;	
		}
	});
});