var Track = require('./track').Track;
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
module.exports = {};

// TODO: use self everywhere

var defaultOncoprintConfig = {
	cell_width: 10,
	cell_padding: 3,
	render: 'table',
};

function Oncoprint(container_selector_string, config) {
	var self = this;
	this.table;
	this.config = $.extend({}, defaultConfig, config || {});

	this.id_order = [];
	this.track_order = []; 
	this.tracks = {};
	this.ids = {};

	if (this.config.render === 'table') {
		this.renderer = new OncoprintTableRenderer(container_selector_string, this);
	}

	this.sortOnTrack = function(trackName, dataCmp) {
		// sort ids using given comparator, by delegating to the track
		this.id_order = this.tracks[trackName].getDatumIds(dataCmp);
		// trigger event
		$(this).trigger('sort.oncoprint', {id_order:this.id_order});
	};

	this.moveTrack = function(trackName, newPosition) {
		// remove from old position in order and place it in new position
		var oldPosition = this.track_order.indexOf(trackName);
		this.track_order.splice(oldPosition, 1);
		this.track_order.splice(newPosition, 0, trackName);
		// trigger event
		$(this).trigger('moveTrack.oncoprint', {track_name: trackName, new_position: newPosition, track_order: this.track_order});
	};

	this.appendTrack = function(name, data, config) {
		// two tracks with same name not allowed
		if (name in this.tracks) {
			return false;
		}
		// add track to internal indexes
		this.tracks[name] = new Track(this, data, config);
		this.track_order.push(name);
		// add new id to id_order
		// TODO: maybe this shouldn't exist if we're not handling no data in oncoprint
		this.id_order = this.id_order.concat(_.difference(this.tracks[name].getDatumIds(), this.id_order));
		// trigger event
		$(this).trigger('appendTrack.oncoprint', {track: self.tracks[name]});
		return this.tracks[name];
	};

	this.getTrack = function(name) {
		return this.tracks[name];
	};
}

function OncoprintTableRenderer(container_selector_string, oncoprint) {
	this.oncoprint = oncoprint;
	this.container = d3.select(container_selector_string);
	
	// initialize table
	this.container.selectAll('*').remove();
	this.table = this.container.append('table');

	// bind events
	$(this.oncoprint).on('appendTrack.oncoprint', function(data) {
		var track = data.track;
		// append track
		track.renderer.renderTrack(this.table.append('tr'));
	});
}

module.exports.Oncoprint = Oncoprint;