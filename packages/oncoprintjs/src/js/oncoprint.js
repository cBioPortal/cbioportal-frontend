var Track = require('./track').Track;
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
module.exports = {};

var defaultConfig = {
	cell_width: 10,
	cell_padding: 3,
	track_padding: 2.5,
	render: 'table',
};

function Oncoprint(config) {
	var self = this;
	this.table;
	this.config = $.extend({}, defaultConfig, config || {});

	this.id_order = [];
	this.track_order = []; 
	this.tracks = {};
	this.ids = {};

	if (this.config.render === 'table') {
		this.renderer = new OncoprintTableRenderer(this);
	}

	this.sortOnTrack = function(trackName, dataCmp) {
		this.id_order = this.tracks[trackName].getIds(dataCmp);
		_.each(this.track_order, function(trackName) {
			self.tracks[trackName].resort(self.id_order);
		});
	};

	this.setTrackOrder = function(arr) {
		this.track_order = arr;
	};

	this.appendTrack = function(name, data, config) {
		if (name in this.tracks) {
			return false;
		}
		this.tracks[name] = new Track(this, data, config);
		this.track_order.push(name);
		this.id_order = this.id_order.concat(_.difference(this.tracks[name].getIds(), this.id_order));
		self.renderer.appendTrack(self.tracks[name]);	
		return this.tracks[name];
	};

	this.getTrack = function(name) {
		return this.tracks[name];
	}
}

function OncoprintTableRenderer(oncoprint) {
	this.oncoprint = oncoprint;
	this.container;
	this.table;

	this.init = function() {
		// clear all
		this.container.selectAll('*').remove();
		// put table
		this.table = this.container.append('table');
	}

	this.appendTrack = function(track) {
		var row = this.table.append('tr');
		track.renderer.render(row);
	}
}

module.exports.Oncoprint = Oncoprint;