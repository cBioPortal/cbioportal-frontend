var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var D3SVGRenderer = require('./cell');
var utils = require('./utils');

module.exports = {};

var defaultTrackConfig = {
	label: 'Gene',
	id_member: 'sample',
	cell_height: 20,
	track_height: 20,
	track_padding: 2.5,
}; 

function Track(oncoprint, data, config) {
	this.config = $.extend({}, defaultConfig, config || {}); // inherit from default
	
	this.oncoprint = oncoprint;
	this.config = $.extend({}, this.oncoprint.config, this.config); // inherit from oncoprint
	this.data = data;

	if (this.config.render === 'table') {
		this.renderer = new TrackTableRenderer(this, new D3SVGCellRenderer());
	}

	var makeCellArea = $.proxy(function(ctr) {
		return ctr.append('svg')
			.attr('width', (this.config.cell_width + this.config.cell_padding)*this.data.length)
			.attr('height', this.config.track_height);
	}, this);

	this.getLabel = function() {
		return this.config.label;
	};
	
	this.getDatumIds = function(sort_cmp) {
		// if sort_cmp is undefined, the order is unspecified
		// otherwise, it's the order given by sorting by sort_cmp
		var id_member = this.config.id_member;
		if (sort_cmp) {
			this.data.sort(sort_cmp);
		}
		return _.map(this.data, function(d) { return d[id_member];});
	};
}

function TrackTableRenderer(track, cellRenderer) {
	this.track = track;
	this.cellRenderer = cellRenderer;
	this.row;

	this.renderTrack = function(row) {
		this.row = row;
		var label_area = row.append('td').classed('track_label', true);
		var cell_area = row.append('td').classed('track_cells', true);
		this.renderLabel(label_area);
		this.renderCells(cell_area)
	};

	this.renderLabel = function(label_area) {
		label_area.selectAll('*').remove();
		label_area.append('p').text(this.track.getLabel());
	};
	this.renderCells = function(cell_area) {
		this.cellRenderer.renderCells(cell_area);
	};
}
module.exports.Track = Track;