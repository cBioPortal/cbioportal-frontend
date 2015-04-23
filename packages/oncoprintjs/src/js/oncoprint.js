var Track = require('./track').Track;
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
module.exports = {};

var defaultConfig = {
	cell_width: 10,
	cell_padding: 3,
	track_padding: 2.5,
};

function Oncoprint(container_selector_string, config) {
	var d3_container = d3.select(container_selector_string);
	this.config = $.extend({}, defaultConfig, config || {});
	var id_order = [];
	var track_order = []; 
	var tracks = {};
	var ids = {};

	this.sortOnTrack = function(trackName, cmp) {
		id_order = tracks[trackName].sort(cmp);
		for (var i=0; i<track_order.length; i++) {
			tracks[track_order[i]].update(id_order);
		}
	};
	this.setTrackOrder = function(arr) {
		track_order = arr;
	};
	this.addTrack = function(name, data, config) {
		tracks[name] = new Track(data, config, this);
		if (track_order.indexOf(name) === -1) {
			track_order.push(name);
		}
		id_order = id_order.concat(_.difference(tracks[name].getIds(), id_order));
		return tracks[name];
	};
	this.getTrack = function(name) {
		return tracks[name];
	}
	this.renderInit = function() {
		this.clear();
		// build table
		var d3_table = d3_container.append('table');
		// delegate rendering to tracks
		for (var i=0; i<track_order.length; i++) {
			tracks[track_order[i]].renderInit(d3_table, id_order);
		}
	};
	this.clear = function() {
		d3_container.selectAll("*").remove();
	}
}

module.exports.Oncoprint = Oncoprint;