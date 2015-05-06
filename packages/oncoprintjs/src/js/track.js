var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var D3SVGCellRenderer = require('./d3_svg_cell_renderer');
var ReadOnlyObject = require('./ReadOnlyObject');
var utils = require('./utils');

module.exports = {};

var defaultTrackConfig = {
	label: 'Gene',
	datum_id: function(d) { return d['sample'];},
	cell_height: 20,
	track_height: 20,
	track_padding: 2.5,
}; 

function Track(name, data, config, oncoprint_config) {
	var self = this;
	self.name = name;
	self.config = $.extend({}, defaultTrackConfig, config || {}); // inherit from default
	self.oncoprint_config = oncoprint_config;
	
	self.data = data;

	if (self.oncoprint_config.get('render') === 'table') {
		var cellRenderer = new D3SVGCellRenderer(self.data, self.oncoprint_config, new ReadOnlyObject(self.config));
		cellRenderer.bindEvents(self);
		self.renderer = new TrackTableRenderer(cellRenderer);
	}
	self.renderer.bindEvents(self);

	self.bindEvents = function(oncoprint) {
		var passAlong = ['sort.oncoprint', 'set_cell_width.oncoprint', 'set_cell_padding.oncoprint'];
		_.each(passAlong, function(evt) {
			$(oncoprint).on(evt, function(e, data) {
				$(self).trigger(evt, data);
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

function TrackTableRenderer(cellRenderer) {
	// coupled with OncoprintTableRenderer

	var self = this;
	var cellRenderer = cellRenderer;
	self.row;
	self.$row;
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
		cellRenderer.init(cell_area);
	};

	self.init = function(row) {
		self.row = row;
		self.$row = $(self.row.node());
		var label_area = row.append('td').classed('track_label', true);
		var cell_area = row.append('td').classed('track_cells', true);
		renderLabel(label_area);
		initCells(cell_area)
	};

	self.addRule = function(params) {
		cellRenderer.addRule(params);
	};

	self.useTemplate = function(templName, params) {
		cellRenderer.useTemplate(templName, params);
	};

}
module.exports.Track = Track;