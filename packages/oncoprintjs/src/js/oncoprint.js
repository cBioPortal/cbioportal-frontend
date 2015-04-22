var Track = require('track').Track;
var $ = require('jQuery');
module.exports = {};

var defaultConfig = {
	track_padding: 2.5,
	id_accessor: 'sample'
};

function Oncoprint(container, config) {
	var $dom = $(container);
	this.config = $.extend({}, defaultConfig, config || {});
	var id_order = [];
	var track_order = {}; 
	var tracks = {};
	var ids = {};


	this.sortOnTrack = function(trackName, cmp) {
	};
	this.setTrackOrder = function(trackName, orderIndex) {
		track_order = arr;
	};
	this.addTrack = function(name, data, config) {
		this.tracks[name] = new Track(data, config);
		this.track_order.push(name);
		this.render();
	};
	this.render = function() {
		this.clear();

		//TODO
	};
	this.clear = function() {
		$dom.empty();
	}
}

module.exports.Oncoprint = Oncoprint;