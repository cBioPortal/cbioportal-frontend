var _ = require('underscore');
var $ = require('jquery');

var Oncoprint = require('../../src/js/Oncoprint');
var cell_padding = 3;
var whitespace_on = true;

var onc = Oncoprint.create('#onc', {cell_padding: cell_padding});

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
	gender_track_id = onc.addTrack({label: 'Gender'});
	onc.setRuleSet(gender_track_id, Oncoprint.CATEGORICAL_COLOR, {
		color: {},
		getCategory: function(d) {
			return d.attr_val;
		}
	});
	onc.setTrackData(gender_track_id, gender_data);
});

mutation_data_promise.then(function(data) {
	mutation_data = data.data;
});
$.when(mutation_data_promise).then(function() {
	mutation_track_id = onc.addTrack({label: 'Mutations'});
	onc.setRuleSet(mutation_track_id, Oncoprint.GRADIENT_COLOR, {
		data_key: 'attr_val',
		data_range: [0,100],
		color_range: ['#A9A9A9', '#FF0000']
	});
	onc.setTrackData(mutation_track_id, mutation_data);
});


alteration_data_promise.then(function(data) {
	alteration_data = _.map(data, function(x) { if (Math.random() < 0.3) { x.mut_type='MISSENSE'; } return x; });
});
$.when(alteration_data_promise).then(function() {
	alteration_track_id = onc.addTrack({label: 'TP53'});
	onc.setRuleSet(alteration_track_id, Oncoprint.GENETIC_ALTERATION, {
		default_color: '#D3D3D3',
		cna_key: 'cna',
		cna: {
			color: {
				AMPLIFIED: '#FF0000',
				GAINED: '#FFB6C1',
				HOMODELETED: '#8FD8D8',
				HETLOSS: '#8FD8D8',	
			},
			label: {
				AMPLIFIED: 'Amplification',
				GAINED: 'Gain',
				HOMODELETED: 'Homozygous Deletion',
				HETLOSS: 'Heterozygous Deletion'
			}

		},
		mut_type_key: 'mut_type',
		mut: {
			color: {
				MISSENSE: 'green'
			},
			label: {
				MISSENSE: 'Missense Mutation'
			}
		}
	});
	onc.setTrackData(alteration_track_id, alteration_data);
});

$('#change_color_scheme').click(function() {
	onc.setRuleSet(gender_track_id, onc.CATEGORICAL_COLOR, {
		color: {MALE: '#000000', FEMALE: '#999999'},
		getCategory: function(d) {
			return d.attr_val;
		}
	});
});