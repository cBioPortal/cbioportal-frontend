var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var D3SVGRenderer = require('./cell');
var utils = require('./utils');

module.exports = {};

var defaultConfig = {
	labelDecorator: 'percent_altered',
	isAltered: function(d) {
		// default deals with genomic oncoprint data in which an unaltered datum just has 'sample' and 'gene' as keys
		return Object.keys(d).length > 2; 
	},
	baseLabel: 'Gene',
	id_accessor: 'sample',
	cell_height: 20,
	track_height: 20,
}; 

// Predefined label decorators
var labelDecoratorPercentAltered = function(data, isAlteredFn) {
	if (!isAlteredFn || typeof isAlteredFn != "function") {
		return -1;
	}
	var alteredCt = _.reduce(_.map(data, isAlteredFn), function(memo, bool) {
		return memo+bool;
	}, 0);
	var percentAltered = 100*(alteredCt/data.length);
	// TODO: precision
	return ''+Math.floor(percentAltered)+'%';
}

function Track(oncoprint, data, config) {
	this.config = $.extend({}, defaultConfig, config || {}); // inherit from default
	
	this.oncoprint = oncoprint;
	this.config = $.extend({}, this.oncoprint.config, this.config); // inherit from oncoprint
	this.data = data;

	this.renderer = new D3SVGRenderer(this);

	this.init = function() {

		$.)
		var config = this.config;
		var row = d3_table.append('tr')
			.style('padding-bottom', this.config.track_padding || 0)
			.style('padding-top', this.config.track_padding || 0);
		// label segment
		row.append('td').classed('track_label', true).append('p').text(this.getLabel());
		// cells segment
		row.append('td').classed('track_cells', true);
		var cellArea = makeCellArea(row.append('td').classed('track_cells', true));
		this.d3SVGRenderer.renderInit(cellArea, this.data, id_order);
	}
	
	var makeCellArea = $.proxy(function(ctr) {
		return ctr.append('svg')
			.attr('width', (this.config.cell_width + this.config.cell_padding)*this.data.length)
			.attr('height', this.config.track_height);
	}, this);

	this.getLabel = function() {
		var ret = this.config.baseLabel;
		if (this.config.labelDecorator) {
			ret += " ";
			if (typeof this.config.labelDecorator === "function") {
				ret += this.config.labelDecorator(this.data);
			} else if (typeof this.config.labelDecorator === "string") {
				if (this.config.labelDecorator === "percent_altered") {
					ret += labelDecoratorPercentAltered(this.data, this.config.isAltered);
				}
			}
		}
		return ret;
	};
	
	this.getIds = function(sort_cmp) {
		// if sort_cmp is undefined, the order is unspecified
		// otherwise, it's the order given by sorting by sort_cmp
		var id_accessor = this.config.id_accessor;
		if (sort_cmp) {
			this.data.sort(sort_cmp);
		}
		return _.map(this.data, function(d) { return d[id_accessor];});
	};

	this.update = function(id_order) {
		this.cellRenderer.update_order(this.d3_table, this.data, id_order);
	}	
}

function TrackTableRenderer(track) {
	this.track = track;
	this.row;

	this.render = function(row) {
		var label_area = row.append('td').classed('track_label', true);
		var cell_area = row.append('td').classed('track_cells', true);
		this.renderLabel(label_area);
		this.renderCells(cell_area)
	}
}
module.exports.Track = Track;