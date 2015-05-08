var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var D3SVGCellRenderer = require('./D3SVGCellRenderer');
var ReadOnlyObject = require('./ReadOnlyObject');
var utils = require('./utils');
var events = require('./events');
var signals = require('./signals');

var defaultTrackConfig = {
	label: 'Gene',
	datum_id: function(d) { return d['sample'];},
	cell_height: 20,
	track_height: 20,
	track_padding: 20,
	sort_cmp: undefined
}; 

function Track(name, data, config, oncoprint_config) {
	var self = this;
	self.name = name;
	self.config = $.extend({}, defaultTrackConfig, config || {}); // inherit from default
	self.oncoprint_config = oncoprint_config;
	
	self.data = data;
	var cell_renderer;

	if (self.oncoprint_config.get('render') === 'table') {
		cell_renderer = new D3SVGCellRenderer(self.data, self.oncoprint_config.extend(self.config));
		cell_renderer.bindEvents(self);
		self.renderer = new TrackTableRenderer(self.oncoprint_config.extend(self.config), cell_renderer);
	}
	self.renderer.bindEvents(self);

	self.bindEvents = function(oncoprint) {
		var pass_down_from_oncoprint = [events.SORT, events.SET_CELL_WIDTH, events.SET_CELL_PADDING, events.SET_PRE_TRACK_PADDING];
		_.each(pass_down_from_oncoprint, function(evt) {
			$(oncoprint).on(evt, function(e, data) {
				$(self).trigger(evt, data);
			})
		});
		var pass_up_from_cell_renderer = [events.CELL_CLICK, events.CELL_MOUSEENTER, events.CELL_MOUSELEAVE, signals.REQUEST_PRE_TRACK_PADDING];
		_.each(pass_up_from_cell_renderer, function(evt) {
			$(cell_renderer).on(evt, function(e, data) {
				$(oncoprint).trigger(evt, $.extend({}, data, {track: self}));
			})
		});
	};

	self.getLabel = function() {
		// TODO: label decorations
		return self.config.label;
	};
	
	self.getDatumIds = function(sort_cmp) {
		return _.map((sort_cmp && utils.stableSort(self.data, sort_cmp)) || self.data, 
				self.config.datum_id
				);
	};

	self.useRenderTemplate = function(templName, params) {
		self.renderer.useTemplate(templName, params);
	};

	$(self).trigger('init.track.oncoprint', {label_text: self.getLabel()});
}

function TrackTableRenderer(track_config, cell_renderer) {
	// coupled with OncoprintTableRenderer

	var self = this;
	var cell_renderer = cell_renderer;
	self.row;
	self.$row;
	self.label_area;
	self.between_area;
	self.cell_area;
	var label_text;

	self.bindEvents = function(track) {
		$(track).on('init.track.oncoprint', function(e, data) {
			label_text = data.label_text;
		});
	};

	var renderLabel = function(label_area) {
		label_area.selectAll('*').remove();
		label_area.append('p').text(label_text);
	};

	var initCells = function(cell_area) {
		cell_renderer.init(cell_area);
	};

	self.init = function(row) {
		self.row = row;
		self.$row = $(self.row.node());
		self.label_area = row.append('td').classed('track_label', true);
		self.between_area = row.append('td').classed('track_between', true).style('position', 'relative');
		self.cell_area = row.append('td').classed('track_cells', true);
		renderLabel(self.label_area);
		initCells(self.cell_area)
	};

	self.addRule = function(params) {
		cell_renderer.addRule(params);
	};

	self.useTemplate = function(templName, params) {
		cell_renderer.useTemplate(templName, params);
	};

}
module.exports = Track;