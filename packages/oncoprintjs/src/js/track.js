var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var CellRenderer = require('./cell').CellRenderer;
var utils = require('./utils');

module.exports = {};

// To use a track, you must specify:
//	labelDecorator

// Predefined configs
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

var geneConfig = {
};

var genderConfig = {
	labelDecorator: false
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

function Track(data, config, oncoprint) {
	if (typeof config === "object") {
		// Use user-specified config
		this.config = $.extend({}, defaultConfig, config);
	} else if (typeof config === "string") {
		// Select from predefined configs
		if (config === "gender") {
			this.config = genderConfig;
		} else if (config === "gene") {
			this.config = geneConfig;
		} else {
			this.config = defaultConfig;
		}
	} else {
		this.config = defaultConfig;
	}
	this.oncoprint = oncoprint;
	this.config = $.extend({}, this.oncoprint.config, this.config);
	this.data = data;
	this.cellRenderer = new CellRenderer(this);
	this.d3_table = false;
	
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
	
	this.getIds = function() {
		var id_accessor = this.config.id_accessor;
		return _.map(this.data, function(d) { return d[id_accessor];});
	};
	this.sort = function(cmp) {
		// returns result of sorting on comparator: a list of ids
		this.data.sort(cmp);
		return this.getIds();
	};

	this.addRenderRule = function(type, stroke, fill, selector) {
		this.cellRenderer.addRule(type, stroke, fill, selector);
		return this;
	};

	this.addDefaultRenderRule = function(type, stroke, fill) {
		this.cellRenderer.addDefaultRule(type, stroke, fill);
		return this;
	}

	this.update = function(id_order) {
		this.cellRenderer.update_order(this.d3_table, this.data, id_order);
	}
	this.render = function(d3_table, id_order) {
		this.d3_table = d3_table;
		var config = this.config;
		var row = this.d3_table.append('tr')
			.style('padding-bottom', config.track_padding)
			.style('padding-top', config.track_padding);
		// label segment
		row.append('td').classed('track_label', true).append('p').text(this.getLabel());
		// cells segment
		var cellArea = makeCellArea(row.append('td').classed('track_cells', true));
		this.cellRenderer.render(cellArea, this.data, id_order);
	}
}
module.exports.Track = Track;