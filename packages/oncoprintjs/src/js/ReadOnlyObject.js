var $ = require('jquery');
function ReadOnlyObject(obj) {
	var self = this;
	var objs = [obj];
	self.get = function(name) {
		var i = objs.length - 1;
		var ret = undefined;
		while (typeof ret === 'undefined' && i >= 0) {
			ret = objs[i][name];
			i -= 1;
		}
		return ret;
	};
	self.extend = function(new_obj) {
		// later objects override earlier objects when keys are the same
		objs.push(new_obj);
		return self;
	}
};

module.exports = ReadOnlyObject;