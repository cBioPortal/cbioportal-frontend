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
	self.table;
	self.config = $.extend({}, defaultOncoprintConfig, config || {});

	self.id_order = [];
	self.track_order = []; 
	self.tracks = {};
	self.ids = {};

	if (self.config.render === 'table') {
		self.renderer = new OncoprintTableRenderer(container_selector_string, self);
	}

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		// trigger event
		$(self).trigger('set_cell_width.oncoprint');
	};

	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		// trigger event
		$(self).trigger('set_cell_padding.oncoprint');
	};

	self.sortOnTrack = function(trackName, dataCmp) {
		// sort ids using given comparator, by delegating to the track
		self.id_order = self.tracks[trackName].getDatumIds(dataCmp);
		// trigger event
		$(self).trigger('sort.oncoprint', {id_order:this.id_order});
	};

	self.moveTrack = function(trackName, newPosition) {
		// remove from old position in order and place it in new position
		var oldPosition = self.track_order.indexOf(trackName);
		self.track_order.splice(oldPosition, 1);
		self.track_order.splice(newPosition, 0, trackName);
		// trigger event
		$(self).trigger('move_track.oncoprint', {track: self.tracks[trackName], new_position: newPosition, track_order: this.track_order});
	};

	self.appendTrack = function(name, data, config) {
		// two tracks with same name not allowed
		if (name in self.tracks) {
			return false;
		}
		// add track to internal indexes
		self.tracks[name] = new Track(name, self, data, config);
		self.track_order.push(name);
		// add new id to id_order
		// TODO: maybe this line shouldn't exist if we're not handling no data in oncoprint
		self.id_order = self.id_order.concat(_.difference(self.tracks[name].getDatumIds(), self.id_order));
		// trigger event
		$(self).trigger('append_track.oncoprint', {track: self.tracks[name]});
		return self.tracks[name];
	};

	self.getTrack = function(name) {
		return self.tracks[name];
	};
}

function OncoprintTableRenderer(container_selector_string, oncoprint) {
	var self = this;
	self.oncoprint = oncoprint;
	self.container = d3.select(container_selector_string);
	
	// initialize table
	self.container.selectAll('*').remove();
	self.table = self.container.append('table');
	self.$table = $(self.table.node());

	// bind events
	$(self.oncoprint).on('append_track.oncoprint', function(e, data) {
		var track = data.track;
		// append track
		track.renderer.renderTrack(self.table.append('tr'));
	});
	$(self.oncoprint).on('move_track.oncoprint', function(e, data) {
		var new_position = data.new_position;
		var order = data.track_order;
		var track = data.track;
		if (new_position === 0) {
			self.$table.find('tr:first').before(track.renderer.$row);
		} else {
			var beforeTrack = self.oncoprint.tracks[order[new_position-1]];
			beforeTrack.renderer.$row.after(track.renderer.$row);
		}
	});
}

module.exports.Oncoprint = Oncoprint;