webpackJsonp([2],{

/***/ 924:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {"use strict";
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var React = _interopRequireWildcard(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();
	
	var _FlexBox = __webpack_require__(925);
	
	function _interopRequireWildcard(obj) {
	    if (obj && obj.__esModule) {
	        return obj;
	    } else {
	        var newObj = {};if (obj != null) {
	            for (var key in obj) {
	                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
	            }
	        }newObj.default = obj;return newObj;
	    }
	}
	
	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}
	
	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}
	
	function _possibleConstructorReturn(self, call) {
	    if (!self) {
	        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
	}
	
	function _inherits(subClass, superClass) {
	    if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
	    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}
	
	var _components = {
	    HomePage: {
	        displayName: "HomePage"
	    }
	};
	
	var _CCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: "C:/cbioportal-frontend/src/pages/home/HomePage.tsx",
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _CCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: "C:/cbioportal-frontend/src/pages/home/HomePage.tsx",
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var HomePage = _wrapComponent("HomePage")(function (_React$Component) {
	    _inherits(HomePage, _React$Component);
	
	    function HomePage(props) {
	        _classCallCheck(this, HomePage);
	
	        // mock data for test
	        var _this = _possibleConstructorReturn(this, (HomePage.__proto__ || Object.getPrototypeOf(HomePage)).call(this, props));
	
	        _this.treeData = { label: "All", children: [{ label: "Category 1", children: [{ label: "Item 1.1" }, { label: "Item 1.2" }] }, { label: "Category 2", children: [{ label: "Item 2.1" }, { label: "Item 2.2" }] }] };
	        return _this;
	    }
	
	    _createClass(HomePage, [{
	        key: "renderTree",
	        value: function renderTree(tree, style) {
	            var _this2 = this;
	
	            // this is just a test to make sure we can reference other components like VBox and have its local styles work
	            if (tree.children && tree.children.length) return React.createElement(_FlexBox.VBox, { padded: true, style: style }, React.createElement("span", null, tree.label), tree.children.map(function (child) {
	                return _this2.renderTree(child, { paddingLeft: "1em" });
	            }));
	            return React.createElement("span", { style: style }, tree.label);
	        }
	    }, {
	        key: "render",
	        value: function render() {
	            return this.renderTree(this.treeData);
	        }
	    }]);
	
	    return HomePage;
	}(React.Component));
	
	exports.default = HomePage;
	
	;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 925:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.VBox = exports.HBox = exports.BoxProps = undefined;
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var React = _interopRequireWildcard(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _underscore = __webpack_require__(332);
	
	var _ = _interopRequireWildcard(_underscore);
	
	var _styles = __webpack_require__(926);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _classNames = __webpack_require__(929);
	
	var _classNames2 = _interopRequireDefault(_classNames);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _components = {
	    HBox: {
	        displayName: 'HBox'
	    },
	    VBox: {
	        displayName: 'VBox'
	    }
	};
	
	var _CCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/shared/components/flexbox/FlexBox.tsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _CCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/shared/components/flexbox/FlexBox.tsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	} /*
	      Copyright (c) 2015 Weave Visual Analytics, Inc.
	  
	      This Source Code Form is subject to the terms of the
	      Mozilla Public License, v. 2.0. If a copy of the MPL
	      was not distributed with this file, You can obtain
	      one at https://mozilla.org/MPL/2.0/.
	  */
	
	
	var BoxProps = exports.BoxProps = function () {
	    function BoxProps() {
	        _classCallCheck(this, BoxProps);
	    }
	
	    _createClass(BoxProps, null, [{
	        key: 'renderBox',
	        value: function renderBox(props, flexDirection) {
	            var attributes = _.omit(props, 'padded', 'overflow');
	            var style = _.extend({
	                display: "flex",
	                overflow: props.overflow ? "visible" : "auto"
	            }, props.style, {
	                flexDirection: flexDirection
	            });
	            var className = (0, _classNames2.default)(props.className, _styles2.default[flexDirection], props.padded ? _styles2.default.padded : null);
	            return React.createElement('div', _extends({}, attributes, { style: style, className: className }));
	        }
	    }]);
	
	    return BoxProps;
	}();
	
	var HBox = exports.HBox = _wrapComponent('HBox')(function (_React$Component) {
	    _inherits(HBox, _React$Component);
	
	    function HBox() {
	        _classCallCheck(this, HBox);
	
	        return _possibleConstructorReturn(this, (HBox.__proto__ || Object.getPrototypeOf(HBox)).apply(this, arguments));
	    }
	
	    _createClass(HBox, [{
	        key: 'render',
	        value: function render() {
	            return BoxProps.renderBox(this.props, "row");
	        }
	    }]);
	
	    return HBox;
	}(React.Component));
	
	var VBox = exports.VBox = _wrapComponent('VBox')(function (_React$Component2) {
	    _inherits(VBox, _React$Component2);
	
	    function VBox() {
	        _classCallCheck(this, VBox);
	
	        return _possibleConstructorReturn(this, (VBox.__proto__ || Object.getPrototypeOf(VBox)).apply(this, arguments));
	    }
	
	    _createClass(VBox, [{
	        key: 'render',
	        value: function render() {
	            return BoxProps.renderBox(this.props, "column");
	        }
	    }]);
	
	    return VBox;
	}(React.Component));
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 926:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _stylesModule = __webpack_require__(927);
	
	var _stylesModule2 = _interopRequireDefault(_stylesModule);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _stylesModule2.default; // this is a temporary solution to make TypeScript happy
	// there should be a way to resolve this the right way by modifying webpack.config.js

/***/ },

/***/ 927:
[963, 928],

/***/ 928:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".styles-module__padded__3sicK.styles-module__column__1J8k5 > * {\n  flex-shrink: 0;\n  margin-top: 8px; }\n\n.styles-module__padded__3sicK.styles-module__column__1J8k5 > *:nth-child(1) {\n  margin-top: 0; }\n\n.styles-module__padded__3sicK.styles-module__row__1ARzt > * {\n  flex-shrink: 0;\n  margin-left: 8px; }\n\n.styles-module__padded__3sicK.styles-module__row__1ARzt > *:nth-child(1) {\n  margin-left: 0; }\n", ""]);
	
	// exports
	exports.locals = {
		"padded": "styles-module__padded__3sicK",
		"column": "styles-module__column__1J8k5",
		"row": "styles-module__row__1ARzt"
	};

/***/ },

/***/ 929:
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.default = classNames;
	// Type definitions for classnames
	// Project: https://github.com/JedWatson/classnames
	// Definitions by: Dave Keen <http://www.keendevelopment.ch>, Adi Dahiya <https://github.com/adidahiya>, Jason Killian <https://github.com/JKillian>
	// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
	/*!
	  Copyright (c) 2016 Jed Watson.
	  Licensed under the MIT License (MIT), see
	  http://jedwatson.github.io/classnames
	*/
	var hasOwn = {}.hasOwnProperty;
	function classNames() {
	    var classes = [];
	
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	    }
	
	    for (var i = 0; i < args.length; i++) {
	        var arg = args[i];
	        if (!arg) continue;
	        if (typeof arg === 'string' || typeof arg === 'number') {
	            classes.push(arg);
	        } else if (Array.isArray(arg)) {
	            classes.push(classNames.apply(null, arg));
	        } else if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object') {
	            for (var key in arg) {
	                if (hasOwn.call(arg, key) && arg[key]) {
	                    classes.push(key);
	                }
	            }
	        }
	    }
	    return classes.join(' ');
	}

/***/ }

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvaG9tZS9Ib21lUGFnZS50c3giLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9jb21wb25lbnRzL2ZsZXhib3gvRmxleEJveC50c3giLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9jb21wb25lbnRzL2ZsZXhib3gvc3R5bGVzLmpzIiwid2VicGFjazovLy8uL3NyYy9zaGFyZWQvY29tcG9uZW50cy9mbGV4Ym94L3N0eWxlcy5tb2R1bGUuc2NzcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2hhcmVkL2xpYi9jbGFzc05hbWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBQThCOzs7Ozs7Ozs7Ozs7Ozs7O0FBYTlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7eUJBSUM7O3VCQUErQixPQUU5QjsrQkFFcUI7Ozt5SEFDakI7O2VBQVMsV0FBRyxFQUFNLE9BQU8sT0FBVSxVQUFFLENBQ3hDLEVBQU0sT0FBYyxjQUFVLFVBQUUsQ0FDL0IsRUFBTSxPQUFhLGNBQ25CLEVBQU0sT0FDTCxpQkFDRixFQUFNLE9BQWMsY0FBVSxVQUFFLENBQy9CLEVBQU0sT0FBYSxjQUNuQixFQUFNLE9BR1Q7Z0JBRWtCOzs7OztvQ0FBZ0IsTUFBNEI7MEJBRWlEOztBQUMzRztpQkFBSyxLQUFTLFlBQVEsS0FBUyxTQUFRLHFCQUVuQywrQkFBTyxjQUFPLE9BQ1oscUNBQUssV0FDTixhQUFTLFNBQUkscUJBQU07d0JBQVEsT0FBVyxXQUFNLE9BQUUsRUFBWSxhQUUvRDtBQUNHOzBCQUFNLHdCQUFPLE9BQWEsY0FHM0I7Ozs7a0NBRUM7b0JBQUssS0FBVyxXQUFLLEtBRTVCOzs7OztHQXRDMEMsTUFBVTs7OztBQXNDbkQsRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQzFDNEI7Ozs7Ozs7Ozs7QUFDdkI7O0tBQXdCOztBQUNGOzs7O0FBUzdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQVhPOzs7Ozs7Ozs7O0tBYVU7Ozs7Ozs7bUNBQXFCLE9BQThCO0FBRWxFLGlCQUFjLGFBQXlCLEVBQUssS0FBTSxPQUFVLFVBQWM7QUFDMUUsaUJBQVMsVUFBK0I7QUFFL0IsMEJBQVE7QUFDUCwyQkFBTyxNQUFTLFdBQVksWUFDcEM7QUFIRCxjQURnQyxFQUszQixNQUFNO0FBSVY7QUFIRDtBQUlELGlCQUFhLFlBQWEsMEJBQU0sTUFBVSxXQUFRLGlCQUFlLGdCQUFPLE1BQU8sU0FBUyxpQkFBTyxTQUFTO0FBQ2xHLG9CQUFLLHdDQUFlLGNBQVEsT0FBTyxPQUFXLFdBQ3JEO0FBR0Q7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlRLG9CQUFTLFNBQVUsVUFBSyxLQUFNLE9BQ3JDO0FBR0Q7Ozs7R0FSK0IsTUFFeEI7Ozs7Ozs7Ozs7Ozs7O0FBVUMsb0JBQVMsU0FBVSxVQUFLLEtBQU0sT0FDckM7QUFDQTs7OztHQU44QixNQUV4QixZOzs7Ozs7Ozs7Ozs7OztBQ2hEUDs7Ozs7OzJDQUZBO0FBQ0Esc0Y7Ozs7Ozs7Ozs7QUNEQTtBQUNBOzs7QUFHQTtBQUNBLDJGQUEwRixtQkFBbUIsb0JBQW9CLEVBQUUsaUZBQWlGLGtCQUFrQixFQUFFLGlFQUFpRSxtQkFBbUIscUJBQXFCLEVBQUUsOEVBQThFLG1CQUFtQixFQUFFOztBQUV0YjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRzs7Ozs7Ozs7Ozs7Ozs7OztBQ1prQztBQUNpQjtBQUNpRztBQUNsRjtBQWNoRTs7Ozs7QUFDRixLQUFVLFNBQUssR0FDZjtVQUFvQztBQUNuQyxTQUFXLFVBQVk7OztBQURnQzs7O0FBR25ELFVBQUMsSUFBSyxJQUFJLEdBQUcsSUFBTyxLQUFPLFFBQUssS0FBRztBQUN0QyxhQUFPLE1BQU8sS0FBSTtBQUNmLGFBQUMsQ0FBSyxLQUFVO0FBRWhCLGFBQUMsT0FBVSxRQUFhLFlBQUksT0FBVSxRQUFjLFVBQUU7QUFDakQscUJBQUssS0FDYjtBQUFNLG9CQUFVLE1BQVEsUUFBTSxNQUFFO0FBQ3hCLHFCQUFLLEtBQVcsV0FBTSxNQUFLLE1BQ25DO0FBQU0sVUFGSSxNQUVBLElBQUMsUUFBVSxzREFBYyxVQUFFO0FBQ2hDLGtCQUFDLElBQU8sT0FBUSxLQUFFO0FBQ2xCLHFCQUFPLE9BQUssS0FBSSxLQUFNLFFBQU8sSUFBTSxNQUFFO0FBQ2hDLDZCQUFLLEtBQ2I7QUFDRDtBQUNEO0FBQ0Q7QUFBQztBQUVLLFlBQVEsUUFBSyxLQUNwQjtBQUFDLEUiLCJmaWxlIjoicmVhY3RhcHAvanMvMi5jaHVuay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7VkJveH0gZnJvbSBcInNoYXJlZC9jb21wb25lbnRzL2ZsZXhib3gvRmxleEJveFwiO1xuXG5pbnRlcmZhY2UgSG9tZVBhZ2VQcm9wc1xue1xufVxuXG5pbnRlcmZhY2UgSG9tZVBhZ2VTdGF0ZVxue1xufVxuXG50eXBlIFRyZWVTdHJ1Y3QgPSB7bGFiZWw6c3RyaW5nLCBjaGlsZHJlbj86VHJlZVN0cnVjdFtdfTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSG9tZVBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8SG9tZVBhZ2VQcm9wcywgSG9tZVBhZ2VTdGF0ZT5cbntcblx0dHJlZURhdGE6VHJlZVN0cnVjdDtcblxuXHRjb25zdHJ1Y3Rvcihwcm9wczpIb21lUGFnZVByb3BzKVxuXHR7XG5cdFx0c3VwZXIocHJvcHMpO1xuXG5cdFx0Ly8gbW9jayBkYXRhIGZvciB0ZXN0XG5cdFx0dGhpcy50cmVlRGF0YSA9IHtsYWJlbDogXCJBbGxcIiwgY2hpbGRyZW46IFtcblx0XHRcdHtsYWJlbDogXCJDYXRlZ29yeSAxXCIsIGNoaWxkcmVuOiBbXG5cdFx0XHRcdHtsYWJlbDogXCJJdGVtIDEuMVwifSxcblx0XHRcdFx0e2xhYmVsOiBcIkl0ZW0gMS4yXCJ9XG5cdFx0XHRdfSxcblx0XHRcdHtsYWJlbDogXCJDYXRlZ29yeSAyXCIsIGNoaWxkcmVuOiBbXG5cdFx0XHRcdHtsYWJlbDogXCJJdGVtIDIuMVwifSxcblx0XHRcdFx0e2xhYmVsOiBcIkl0ZW0gMi4yXCJ9XG5cdFx0XHRdfSxcblx0XHRdfTtcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVHJlZSh0cmVlOlRyZWVTdHJ1Y3QsIHN0eWxlPzpSZWFjdC5DU1NQcm9wZXJ0aWVzKTpKU1guRWxlbWVudFxuXHR7XG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgdGVzdCB0byBtYWtlIHN1cmUgd2UgY2FuIHJlZmVyZW5jZSBvdGhlciBjb21wb25lbnRzIGxpa2UgVkJveCBhbmQgaGF2ZSBpdHMgbG9jYWwgc3R5bGVzIHdvcmtcblx0XHRpZiAodHJlZS5jaGlsZHJlbiAmJiB0cmVlLmNoaWxkcmVuLmxlbmd0aClcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxWQm94IHBhZGRlZCBzdHlsZT17c3R5bGV9PlxuXHRcdFx0XHRcdDxzcGFuPnt0cmVlLmxhYmVsfTwvc3Bhbj5cblx0XHRcdFx0XHR7dHJlZS5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gdGhpcy5yZW5kZXJUcmVlKGNoaWxkLCB7cGFkZGluZ0xlZnQ6IFwiMWVtXCJ9KSl9XG5cdFx0XHRcdDwvVkJveD5cblx0XHRcdCk7XG5cdFx0cmV0dXJuIDxzcGFuIHN0eWxlPXtzdHlsZX0+e3RyZWUubGFiZWx9PC9zcGFuPjtcblx0fVxuXG5cdHJlbmRlcigpXG5cdHtcblx0XHRyZXR1cm4gdGhpcy5yZW5kZXJUcmVlKHRoaXMudHJlZURhdGEpO1xuXHR9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvaG9tZS9Ib21lUGFnZS50c3hcbiAqKi8iLCIvKlxuXHRDb3B5cmlnaHQgKGMpIDIwMTUgV2VhdmUgVmlzdWFsIEFuYWx5dGljcywgSW5jLlxuXG5cdFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGVcblx0TW96aWxsYSBQdWJsaWMgTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTFxuXHR3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcyBmaWxlLCBZb3UgY2FuIG9idGFpblxuXHRvbmUgYXQgaHR0cHM6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiovXG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzdHlsZXMgZnJvbSAnLi9zdHlsZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcInNoYXJlZC9saWIvY2xhc3NOYW1lc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJveFByb3BzIDxUPiBleHRlbmRzIFJlYWN0LkhUTUxQcm9wczxUPlxue1xuXHRwYWRkZWQ/OmJvb2xlYW47XG5cdG92ZXJmbG93Pzpib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQm94UHJvcHM8VD5cbntcblx0c3RhdGljIHJlbmRlckJveDxUPihwcm9wczpCb3hQcm9wczxUPiwgZmxleERpcmVjdGlvbjpcInJvd1wifFwiY29sdW1uXCIpOkpTWC5FbGVtZW50XG5cdHtcblx0XHR2YXIgYXR0cmlidXRlczpSZWFjdC5IVE1MQXR0cmlidXRlcyA9IF8ub21pdChwcm9wcywgJ3BhZGRlZCcsICdvdmVyZmxvdycpO1xuXHRcdHZhciBzdHlsZTpSZWFjdC5DU1NQcm9wZXJ0aWVzID0gXy5leHRlbmQoXG5cdFx0XHR7XG5cdFx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdFx0XHRvdmVyZmxvdzogcHJvcHMub3ZlcmZsb3cgPyBcInZpc2libGVcIiA6IFwiYXV0b1wiXG5cdFx0XHR9LFxuXHRcdFx0cHJvcHMuc3R5bGUsXG5cdFx0XHR7XG5cdFx0XHRcdGZsZXhEaXJlY3Rpb25cblx0XHRcdH1cblx0XHQpO1xuXHRcdGxldCBjbGFzc05hbWUgPSBjbGFzc05hbWVzKHByb3BzLmNsYXNzTmFtZSwgc3R5bGVzW2ZsZXhEaXJlY3Rpb25dLCBwcm9wcy5wYWRkZWQgPyBzdHlsZXMucGFkZGVkIDogbnVsbCk7XG5cdFx0cmV0dXJuIDxkaXYgey4uLmF0dHJpYnV0ZXN9IHN0eWxlPXtzdHlsZX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9Lz47XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEhCb3ggZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8Qm94UHJvcHM8SEJveD4sIHt9Plxue1xuXHRyZW5kZXIoKTpKU1guRWxlbWVudFxuXHR7XG5cdFx0cmV0dXJuIEJveFByb3BzLnJlbmRlckJveCh0aGlzLnByb3BzLCBcInJvd1wiKTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgVkJveCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxCb3hQcm9wczxWQm94Piwge30+XG57XG5cdHJlbmRlcigpOkpTWC5FbGVtZW50XG5cdHtcblx0XHRyZXR1cm4gQm94UHJvcHMucmVuZGVyQm94KHRoaXMucHJvcHMsIFwiY29sdW1uXCIpO1xuXHR9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zaGFyZWQvY29tcG9uZW50cy9mbGV4Ym94L0ZsZXhCb3gudHN4XG4gKiovIiwiLy8gdGhpcyBpcyBhIHRlbXBvcmFyeSBzb2x1dGlvbiB0byBtYWtlIFR5cGVTY3JpcHQgaGFwcHlcbi8vIHRoZXJlIHNob3VsZCBiZSBhIHdheSB0byByZXNvbHZlIHRoaXMgdGhlIHJpZ2h0IHdheSBieSBtb2RpZnlpbmcgd2VicGFjay5jb25maWcuanNcbmltcG9ydCBzdHlsZXMgZnJvbSBcIi4vc3R5bGVzLm1vZHVsZS5zY3NzXCI7XG5leHBvcnQgZGVmYXVsdCBzdHlsZXM7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2hhcmVkL2NvbXBvbmVudHMvZmxleGJveC9zdHlsZXMuanNcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5zdHlsZXMtbW9kdWxlX19wYWRkZWRfXzNzaWNLLnN0eWxlcy1tb2R1bGVfX2NvbHVtbl9fMUo4azUgPiAqIHtcXG4gIGZsZXgtc2hyaW5rOiAwO1xcbiAgbWFyZ2luLXRvcDogOHB4OyB9XFxuXFxuLnN0eWxlcy1tb2R1bGVfX3BhZGRlZF9fM3NpY0suc3R5bGVzLW1vZHVsZV9fY29sdW1uX18xSjhrNSA+ICo6bnRoLWNoaWxkKDEpIHtcXG4gIG1hcmdpbi10b3A6IDA7IH1cXG5cXG4uc3R5bGVzLW1vZHVsZV9fcGFkZGVkX18zc2ljSy5zdHlsZXMtbW9kdWxlX19yb3dfXzFBUnp0ID4gKiB7XFxuICBmbGV4LXNocmluazogMDtcXG4gIG1hcmdpbi1sZWZ0OiA4cHg7IH1cXG5cXG4uc3R5bGVzLW1vZHVsZV9fcGFkZGVkX18zc2ljSy5zdHlsZXMtbW9kdWxlX19yb3dfXzFBUnp0ID4gKjpudGgtY2hpbGQoMSkge1xcbiAgbWFyZ2luLWxlZnQ6IDA7IH1cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5leHBvcnRzLmxvY2FscyA9IHtcblx0XCJwYWRkZWRcIjogXCJzdHlsZXMtbW9kdWxlX19wYWRkZWRfXzNzaWNLXCIsXG5cdFwiY29sdW1uXCI6IFwic3R5bGVzLW1vZHVsZV9fY29sdW1uX18xSjhrNVwiLFxuXHRcInJvd1wiOiBcInN0eWxlcy1tb2R1bGVfX3Jvd19fMUFSenRcIlxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyP21vZHVsZXMmaW1wb3J0TG9hZGVycz0yJmxvY2FsSWRlbnROYW1lPVtuYW1lXV9fW2xvY2FsXV9fW2hhc2g6YmFzZTY0OjVdIS4vfi9zYXNzLWxvYWRlciEuL34vc2Fzcy1yZXNvdXJjZXMtbG9hZGVyL2xpYi9sb2FkZXIuanMhLi9zcmMvc2hhcmVkL2NvbXBvbmVudHMvZmxleGJveC9zdHlsZXMubW9kdWxlLnNjc3NcbiAqKiBtb2R1bGUgaWQgPSA5MjhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMlxuICoqLyIsIi8vIFR5cGUgZGVmaW5pdGlvbnMgZm9yIGNsYXNzbmFtZXNcbi8vIFByb2plY3Q6IGh0dHBzOi8vZ2l0aHViLmNvbS9KZWRXYXRzb24vY2xhc3NuYW1lc1xuLy8gRGVmaW5pdGlvbnMgYnk6IERhdmUgS2VlbiA8aHR0cDovL3d3dy5rZWVuZGV2ZWxvcG1lbnQuY2g+LCBBZGkgRGFoaXlhIDxodHRwczovL2dpdGh1Yi5jb20vYWRpZGFoaXlhPiwgSmFzb24gS2lsbGlhbiA8aHR0cHM6Ly9naXRodWIuY29tL0pLaWxsaWFuPlxuLy8gRGVmaW5pdGlvbnM6IGh0dHBzOi8vZ2l0aHViLmNvbS9EZWZpbml0ZWx5VHlwZWQvRGVmaW5pdGVseVR5cGVkXG5cbmRlY2xhcmUgdHlwZSBDbGFzc1ZhbHVlID0gc3RyaW5nIHwgbnVtYmVyIHwgQ2xhc3NEaWN0aW9uYXJ5IHwgQ2xhc3NBcnJheSB8IHVuZGVmaW5lZCB8IG51bGw7XG5cbmludGVyZmFjZSBDbGFzc0RpY3Rpb25hcnkge1xuXHRbaWQ6IHN0cmluZ106IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBDbGFzc0FycmF5IGV4dGVuZHMgQXJyYXk8Q2xhc3NWYWx1ZT4geyB9XG5cbi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTYgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbnZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNsYXNzTmFtZXMgKC4uLmFyZ3M6Q2xhc3NWYWx1ZVtdKSB7XG5cdHZhciBjbGFzc2VzOmFueVtdID0gW107XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGFyZyA9IGFyZ3NbaV07XG5cdFx0aWYgKCFhcmcpIGNvbnRpbnVlO1xuXG5cdFx0aWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goYXJnKTtcblx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0Y2xhc3Nlcy5wdXNoKGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKSk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zaGFyZWQvbGliL2NsYXNzTmFtZXMudHNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9