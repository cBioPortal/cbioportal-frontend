var _ = require('underscore');
var $ = require('jquery');

var Oncoprint = require('../../src/js/Oncoprint');
var cell_padding = 3;
var whitespace_on = true;

var onc = new Oncoprint('#onc', {cell_padding: cell_padding});
$('#shuffle_btn').click(function() {
	onc.sortOnTrack(gender_track, function(d1, d2) {
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