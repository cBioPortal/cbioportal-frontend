function ReadOnlyObject(obj) {
	var self = this;
	self.get = function(name) {
		return obj[name];
	};
	self.getObj = function() {
		return obj;
	};
};

module.exports = ReadOnlyObject;