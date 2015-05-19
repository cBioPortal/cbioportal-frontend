var _ = require("underscore");

var exports = module.exports = {};

exports.invert_array = function invert_array(arr) {
	return arr.reduce(function(curr, next, index) {
		curr[next] = index;
		return curr;
	}, {});
};

exports.makeD3SVGElement = function(tag) {
	return d3.select(document.createElementNS('http://www.w3.org/2000/svg', tag));
};

exports.warn = function(str, context) {
	console.log("Oncoprint error in "+context+": "+str);
};

exports.stableSort = function(arr, cmp) {
	// cmp returns something in [-1,0,1]

	cmp = [].concat(cmp);
	var index_cmp = function(a,b) {
		if (a[1] < b[1]) {
			return -1;
		} else if (a[1] > b[1]) {
			return 1;
		} else {
			return 0;
		}
	};
	cmp = cmp.concat(index_cmp); // stable

	var ordered_cmp = function(a,b) {
		var res = 0;
		var cmp_ind = -1;
		while (res === 0 && cmp_ind < cmp.length) {
			cmp_ind += 1;
			res = (cmp[cmp_ind])(a[0],b[0]);
		}
		return res;
	};
	var zipped = [];
	_.each(arr, function(val, ind) {
		zipped.push([val, ind]);
	})
	zipped.sort(ordered_cmp);
	return _map(zipped, function(x) { return x[0];});
};

exports.translate = function(x,y) {
	return "translate(" + x + "," + y + ")";
};

exports.assert = function(bool, msg) {
	if (!bool) {
		throw msg;
	}
}