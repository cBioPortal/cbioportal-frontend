var _ = require('underscore');

module.exports = {};

// Predefined configs
var defaultConfig = {
	labelDecorator: 'percent_altered',
	isAltered: function(d) {
		// default deals with genomic oncoprint data in which an unaltered datum just has 'sample' and 'gene' as keys
		return Object.keys(d).length > 2; 
	},
	id_accessor: 'sample',
	cell_width: 10,
	cell_height: 20,
	cell_padding: 3,
}; 

var geneConfig = {
};

var genderConfig = {
	labelDecorator: false
};

// Predefined label decorators
var labelDecoratorPercentAltered = function(data, isAltered) {
	if (!isAltered || typeof isAltered != "function") {
		return -1;
	}
	var alteredCt = _.reduce(_.map(data, isAltered), function(memo, bool) {
		return memo+bool;
	}, 0);
	var percentAltered = alteredCt/data.length;
	// TODO: precision
	return ''+percentAltered+'%';
}

function Track(data, config) {
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
	this.baseLabel = baseLabel; 
	this.data = data;
	
	this.getLabel = function() {
		var ret = this.baseLabel;
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
	this.sort = function(cmp, id_accessor) {
		// sorts and returns the new order

	}

	this.update = function() {
		// to be called after render has already been called

	};
	this.render = function() {

	}

}