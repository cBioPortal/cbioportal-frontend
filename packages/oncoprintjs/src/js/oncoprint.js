var Track = require('./Track');
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var ReadOnlyObject = require('./ReadOnlyObject');

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

	self.config.id_order = [];
	self.track_order = []; 
	self.tracks = {};
	self.ids = {};

	if (self.config.render === 'table') {
		self.renderer = new OncoprintTableRenderer(container_selector_string);
	}
	self.renderer.bindEvents(self);

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		$(self).trigger('set_cell_width.oncoprint');
	};

	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		$(self).trigger('set_cell_padding.oncoprint');
	};

	self.sortOnTrack = function(trackName, dataCmp) {
		self.config.id_order = self.tracks[trackName].getDatumIds(dataCmp);
		$(self).trigger('sort.oncoprint', {id_order: self.config.id_order});
	};

	self.moveTrack = function(track_name, new_position) {
		new_position = Math.min(self.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.track_order.indexOf(track_name);

		self.track_order.splice(old_position, 1);
		self.track_order.splice(new_position, 0, track_name);

		$(self).trigger('move_track.oncoprint', {track_name: track_name, tracks:self.tracks, track_order: self.track_order});
	};

	self.addTrack = function(name, data, config) {
		if (name in self.tracks) {
			return false;
		}
		self.tracks[name] = new Track(name, data, config, new ReadOnlyObject(self.config));
		self.tracks[name].bindEvents(self);
		self.track_order.push(name);

		// TODO: maybe this line shouldn't exist if we're not handling no data in oncoprint
		self.config.id_order = self.config.id_order.concat(_.difference(self.tracks[name].getDatumIds(), self.config.id_order));

		$(self).trigger('add_track.oncoprint', {track: self.tracks[name]});
		return self.tracks[name];
	};

	self.getTrack = function(name) {
		return self.tracks[name];
	};

	self.removeTrack = function(name) {
		delete self.tracks[name];

		var oldPosition = self.track_order.indexOf(name);
		self.track_order.splice(oldPosition, 1);

		$(self).trigger('remove_track.oncoprint', {track: name});
		return true;
	};
}

function OncoprintTableRenderer(container_selector_string, oncoprint) {
	var self = this;
	self.container = d3.select(container_selector_string);
	self.table;
	self.$table;
	
	(function initTable(self) {
		self.container.selectAll('*').remove();
		self.table = self.container.append('table');
		self.$table = $(self.table.node());
	})(self);

	self.bindEvents = function(oncoprint) {
		$(oncoprint).on('add_track.oncoprint', function(e, data) {
			data.track.renderer.init(self.table.append('tr'));
		});
		$(oncoprint).on('move_track.oncoprint', function(e, data) {
			var track_name = data.track_name;
			var new_position = data.track_order.indexOf(track_name);
			var track_order = data.track_order;
			var track = data.tracks[track_name];
			if (new_position === 0) {
				self.$table.find('tr:first').before(track.renderer.$row);
			} else {
				var before_track = data.tracks[track_order[new_position-1]];
				before_track.renderer.$row.after(track.renderer.$row);
			}
		});
		$(oncoprint).on('remove_track.oncoprint', function(e, data) {
			var track = data.track;
			track.renderer.$row.remove();
		});
	};
}

module.exports = Oncoprint;