var Track = require('./Track');
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var ReadOnlyObject = require('./ReadOnlyObject');
var Toolbar = require('./Toolbar')
var events = require('./events');
var signals = require('./signals');

// TODO: use self everywhere

var defaultOncoprintConfig = {
	cell_width: 10,
	cell_padding: 3,
	render: 'table',
};

var hiddenOncoprintConfig = {
	pre_track_padding: 0,
};

function Oncoprint(container_selector_string, config) {
	var self = this;
	var track_id_counter = 0;
	self.toolbar = new Toolbar();
	self.table;
	self.config = $.extend({}, defaultOncoprintConfig, config || {});
	self.config = $.extend(self.config, hiddenOncoprintConfig);

	self.config.id_order = [];
	self.track_order = []; 
	self.tracks = {};
	self.ids = {};

	if (self.config.render === 'table') {
		self.renderer = new OncoprintTableRenderer(container_selector_string);
	}
	self.renderer.bindEvents(self);
	self.toolbar.bindEvents(self);

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		$(self).trigger(events.SET_CELL_WIDTH);
	};

	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		$(self).trigger(events.SET_CELL_PADDING);
	};

	self.sortOnTrack = function(track_id, data_cmp) {
		self.config.id_order = self.tracks[track_id].getDatumIds(data_cmp);
		$(self).trigger(events.SORT, {id_order: self.config.id_order});
	};

	self.sortOnTracks = function(track_ids, data_cmps) {
		self.config.id_order;
	};

	self.moveTrack = function(track_id, new_position) {
		new_position = Math.min(self.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.track_order.indexOf(track_id);

		self.track_order.splice(old_position, 1);
		self.track_order.splice(new_position, 0, track_id);

		$(self).trigger(events.MOVE_TRACK, {track_id: track_id, tracks:self.tracks, track_order: self.track_order});
	};

	self.addTrack = function(data, config) {
		var track_id = track_id_counter;
		track_id_counter += 1;
		self.tracks[track_id] = new Track(data, config, new ReadOnlyObject(self.config));
		self.tracks[track_id].bindEvents(self);
		self.track_order.push(track_id);

		// TODO: maybe this line shouldn't exist if we're not handling no data in oncoprint
		self.config.id_order = self.config.id_order.concat(_.difference(self.tracks[track_id].getDatumIds(), self.config.id_order));

		$(self).trigger(events.ADD_TRACK, {track: self.tracks[track_id]});
		return track_id;
	};

	self.getTrack = function(track_id) {
		return self.tracks[track_id];
	};

	self.removeTrack = function(track_id) {
		var track = self.tracks[track_id];
		delete self.tracks[track_id];

		var oldPosition = self.track_order.indexOf(track_id);
		self.track_order.splice(oldPosition, 1);

		$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
		return true;
	};

	(function bindEvents(self) {
		$(self).on(signals.REQUEST_PRE_TRACK_PADDING, function(e, data) {
			self.config.pre_track_padding = Math.max(data.pre_track_padding, self.config.pre_track_padding);
			$(self).trigger(events.SET_PRE_TRACK_PADDING, {pre_track_padding: self.config.pre_track_padding});
		});
	})(self);
}

function OncoprintTableRenderer(container_selector_string) {
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
		$(oncoprint).on(events.ADD_TRACK, function(e, data) {
			data.track.renderer.init(self.table.append('tr'));
		});
		$(oncoprint).on(events.MOVE_TRACK, function(e, data) {
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
		$(oncoprint).on(events.REMOVE_TRACK, function(e, data) {
			var track = data.track;
			track.renderer.$row.remove();
		});
	};
}

module.exports = Oncoprint;