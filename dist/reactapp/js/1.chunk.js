webpackJsonp([1],{

/***/ 669:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
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
	
	var _reactDom = __webpack_require__(44);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _ClinicalInformationContainer = __webpack_require__(670);
	
	var _ClinicalInformationContainer2 = _interopRequireDefault(_ClinicalInformationContainer);
	
	var _PatientHeader = __webpack_require__(919);
	
	var _PatientHeader2 = _interopRequireDefault(_PatientHeader);
	
	var _reactRedux = __webpack_require__(395);
	
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
	    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
	}
	
	function _inherits(subClass, superClass) {
	    if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
	    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}
	
	var _components = {
	    PatientViewPage: {
	        displayName: 'PatientViewPage'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/PatientViewPage.tsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/PatientViewPage.tsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var PatientViewPage = _wrapComponent('PatientViewPage')(function (_React$Component) {
	    _inherits(PatientViewPage, _React$Component);
	
	    function PatientViewPage() {
	        _classCallCheck(this, PatientViewPage);
	
	        return _possibleConstructorReturn(this, (PatientViewPage.__proto__ || Object.getPrototypeOf(PatientViewPage)).apply(this, arguments));
	    }
	
	    _createClass(PatientViewPage, [{
	        key: 'componentDidMount',
	        value: function componentDidMount() {
	            var PatientHeader = (0, _reactRedux.connect)(PatientViewPage.mapStateToProps)(_PatientHeader2.default);
	            ReactDOM.render(React.createElement(PatientHeader, { store: this.props.store }), document.getElementById("clinical_div"));
	            //ReactDOM.render(<div><Example /><Example /></div>, document.getElementById("clinical_div") as Element);
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            return React.createElement(_ClinicalInformationContainer2.default, null);
	        }
	    }], [{
	        key: 'mapStateToProps',
	        value: function mapStateToProps(state) {
	            var ci = state.get('clinicalInformation');
	            return {
	                samples: ci.get('samples'),
	                status: ci.get('status'),
	                patient: ci.get('patient')
	            };
	        }
	    }]);
	
	    return PatientViewPage;
	}(React.Component));
	
	exports.default = PatientViewPage;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 670:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.PatientHeader = exports.ClinicalInformationContainerUnconnected = undefined;
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var _react3 = _interopRequireDefault(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _reactDom = __webpack_require__(44);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _ClinicalInformationPatientTable = __webpack_require__(671);
	
	var _ClinicalInformationPatientTable2 = _interopRequireDefault(_ClinicalInformationPatientTable);
	
	var _PDXTree = __webpack_require__(658);
	
	var _PDXTree2 = _interopRequireDefault(_PDXTree);
	
	var _reactSpinkit = __webpack_require__(829);
	
	var _reactSpinkit2 = _interopRequireDefault(_reactSpinkit);
	
	var _duck = __webpack_require__(652);
	
	var _PurifyComponent = __webpack_require__(852);
	
	var _PurifyComponent2 = _interopRequireDefault(_PurifyComponent);
	
	var _reactRedux = __webpack_require__(395);
	
	var _ClinicalInformationSamples = __webpack_require__(856);
	
	var _ClinicalInformationSamples2 = _interopRequireDefault(_ClinicalInformationSamples);
	
	var _PatientHeader = __webpack_require__(919);
	
	var _PatientHeader2 = _interopRequireDefault(_PatientHeader);
	
	__webpack_require__(921);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    ClinicalInformationContainerUnconnected: {
	        displayName: 'ClinicalInformationContainerUnconnected'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationContainer.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationContainer.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var ClinicalInformationContainerUnconnected = exports.ClinicalInformationContainerUnconnected = _wrapComponent('ClinicalInformationContainerUnconnected')(function (_React$Component) {
	    _inherits(ClinicalInformationContainerUnconnected, _React$Component);
	
	    function ClinicalInformationContainerUnconnected() {
	        _classCallCheck(this, ClinicalInformationContainerUnconnected);
	
	        return _possibleConstructorReturn(this, (ClinicalInformationContainerUnconnected.__proto__ || Object.getPrototypeOf(ClinicalInformationContainerUnconnected)).apply(this, arguments));
	    }
	
	    _createClass(ClinicalInformationContainerUnconnected, [{
	        key: 'componentDidMount',
	        value: function componentDidMount(ar1, ar2) {
	            this.props.loadClinicalInformationTableData();
	        }
	    }, {
	        key: 'buildButtonGroups',
	        value: function buildButtonGroups() {
	            return _react3.default.createElement(
	                ButtonGroup,
	                null,
	                _react3.default.createElement(
	                    Button,
	                    null,
	                    'Copy'
	                ),
	                _react3.default.createElement(
	                    Button,
	                    null,
	                    'CSV'
	                ),
	                _react3.default.createElement(
	                    Button,
	                    null,
	                    'Show/Hide Columns'
	                )
	            );
	        }
	    }, {
	        key: 'selectTab',
	        value: function selectTab(tabId) {
	            this.props.setTab(tabId);
	        }
	    }, {
	        key: 'buildTabs',
	        value: function buildTabs() {
	            return _react3.default.createElement(
	                'div',
	                null,
	                _react3.default.createElement(
	                    'h4',
	                    null,
	                    'My Samples'
	                ),
	                _react3.default.createElement(_ClinicalInformationSamples2.default, { data: this.props.samples }),
	                _react3.default.createElement(
	                    'h4',
	                    null,
	                    'Patient'
	                ),
	                _react3.default.createElement(_ClinicalInformationPatientTable2.default, { data: this.props.patient.get('clinicalData') })
	            );
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	
	            switch (this.props.status) {
	
	                case 'fetching':
	
	                    return _react3.default.createElement(
	                        'div',
	                        null,
	                        _react3.default.createElement(_reactSpinkit2.default, { spinnerName: 'three-bounce' })
	                    );
	
	                case 'complete':
	
	                    return _react3.default.createElement(
	                        'div',
	                        null,
	                        this.buildTabs()
	                    );
	
	                case 'error':
	
	                    return _react3.default.createElement(
	                        'div',
	                        null,
	                        'There was an error.'
	                    );
	
	                default:
	
	                    return _react3.default.createElement('div', null);
	
	            }
	        }
	    }]);
	
	    return ClinicalInformationContainerUnconnected;
	}(_react3.default.Component));
	
	var PatientHeader = exports.PatientHeader = (0, _reactRedux.connect)(_duck.mapStateToProps, _duck.actionCreators)(_PatientHeader2.default);
	
	exports.default = (0, _reactRedux.connect)(_duck.mapStateToProps, _duck.actionCreators)(ClinicalInformationContainerUnconnected);
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 671:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
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
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _reactBootstrap = __webpack_require__(672);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    ClinicalInformationPatientTable: {
	        displayName: 'ClinicalInformationPatientTable'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationPatientTable.tsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationPatientTable.tsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var ClinicalInformationPatientTable = _wrapComponent('ClinicalInformationPatientTable')(function (_React$Component) {
	    _inherits(ClinicalInformationPatientTable, _React$Component);
	
	    function ClinicalInformationPatientTable() {
	        _classCallCheck(this, ClinicalInformationPatientTable);
	
	        return _possibleConstructorReturn(this, (ClinicalInformationPatientTable.__proto__ || Object.getPrototypeOf(ClinicalInformationPatientTable)).apply(this, arguments));
	    }
	
	    _createClass(ClinicalInformationPatientTable, [{
	        key: 'render',
	        value: function render() {
	            var rows = [];
	            this.props.data.forEach(function (item) {
	                rows.push(React.createElement(
	                    'tr',
	                    { key: item.get('id') },
	                    React.createElement(
	                        'td',
	                        null,
	                        item.get('id')
	                    ),
	                    React.createElement(
	                        'td',
	                        null,
	                        item.get('value')
	                    )
	                ));
	            });
	            return React.createElement(
	                _reactBootstrap.Table,
	                { striped: true },
	                React.createElement(
	                    'thead',
	                    null,
	                    React.createElement(
	                        'tr',
	                        null,
	                        React.createElement(
	                            'th',
	                            null,
	                            'Attribute'
	                        ),
	                        React.createElement(
	                            'th',
	                            null,
	                            'Value'
	                        )
	                    )
	                ),
	                React.createElement(
	                    'tbody',
	                    null,
	                    rows
	                )
	            );
	        }
	    }]);
	
	    return ClinicalInformationPatientTable;
	}(React.Component));
	
	exports.default = ClinicalInformationPatientTable;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 829:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(675);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _objectAssign = __webpack_require__(17);
	
	var _objectAssign2 = _interopRequireDefault(_objectAssign);
	
	__webpack_require__(830);
	
	__webpack_require__(832);
	
	__webpack_require__(834);
	
	__webpack_require__(836);
	
	__webpack_require__(838);
	
	__webpack_require__(840);
	
	__webpack_require__(842);
	
	__webpack_require__(844);
	
	__webpack_require__(846);
	
	__webpack_require__(848);
	
	__webpack_require__(850);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line import/no-extraneous-dependencies
	
	
	var Spinner = function (_React$Component) {
	  _inherits(Spinner, _React$Component);
	
	  function Spinner(props) {
	    _classCallCheck(this, Spinner);
	
	    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Spinner).call(this, props));
	
	    _this.displayName = 'SpinKit';
	    return _this;
	  }
	
	  _createClass(Spinner, [{
	    key: 'render',
	    value: function render() {
	      var _cx;
	
	      var classes = (0, _classnames2.default)((_cx = {
	        'fade-in': !this.props.noFadeIn,
	        spinner: this.props.overrideSpinnerClassName === ''
	      }, _defineProperty(_cx, this.props.overrideSpinnerClassName, !!this.props.overrideSpinnerClassName), _defineProperty(_cx, this.props.className, !!this.props.className), _cx));
	
	      var props = (0, _objectAssign2.default)({}, this.props);
	      delete props.spinnerName;
	      delete props.noFadeIn;
	      delete props.overrideSpinnerClassName;
	      delete props.className;
	
	      var spinnerEl = void 0;
	      switch (this.props.spinnerName) {
	        case 'double-bounce':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'double-bounce ' + classes }),
	            _react2.default.createElement('div', { className: 'double-bounce1' }),
	            _react2.default.createElement('div', { className: 'double-bounce2' })
	          );
	          break;
	        case 'rotating-plane':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: classes }),
	            _react2.default.createElement('div', { className: 'rotating-plane' })
	          );
	          break;
	        case 'wave':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'wave ' + classes }),
	            _react2.default.createElement('div', { className: 'rect1' }),
	            _react2.default.createElement('div', { className: 'rect2' }),
	            _react2.default.createElement('div', { className: 'rect3' }),
	            _react2.default.createElement('div', { className: 'rect4' }),
	            _react2.default.createElement('div', { className: 'rect5' })
	          );
	          break;
	        case 'wandering-cubes':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'wandering-cubes ' + classes }),
	            _react2.default.createElement('div', { className: 'cube1' }),
	            _react2.default.createElement('div', { className: 'cube2' })
	          );
	          break;
	        case 'pulse':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: classes }),
	            _react2.default.createElement('div', { className: 'pulse' })
	          );
	          break;
	        case 'chasing-dots':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: classes }),
	            _react2.default.createElement(
	              'div',
	              { className: 'chasing-dots' },
	              _react2.default.createElement('div', { className: 'dot1' }),
	              _react2.default.createElement('div', { className: 'dot2' })
	            )
	          );
	          break;
	        case 'circle':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'circle-wrapper ' + classes }),
	            _react2.default.createElement('div', { className: 'circle1 circle' }),
	            _react2.default.createElement('div', { className: 'circle2 circle' }),
	            _react2.default.createElement('div', { className: 'circle3 circle' }),
	            _react2.default.createElement('div', { className: 'circle4 circle' }),
	            _react2.default.createElement('div', { className: 'circle5 circle' }),
	            _react2.default.createElement('div', { className: 'circle6 circle' }),
	            _react2.default.createElement('div', { className: 'circle7 circle' }),
	            _react2.default.createElement('div', { className: 'circle8 circle' }),
	            _react2.default.createElement('div', { className: 'circle9 circle' }),
	            _react2.default.createElement('div', { className: 'circle10 circle' }),
	            _react2.default.createElement('div', { className: 'circle11 circle' }),
	            _react2.default.createElement('div', { className: 'circle12 circle' })
	          );
	          break;
	        case 'cube-grid':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'cube-grid ' + classes }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' }),
	            _react2.default.createElement('div', { className: 'cube' })
	          );
	          break;
	        case 'wordpress':
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: classes }),
	            _react2.default.createElement(
	              'div',
	              { className: 'wordpress' },
	              _react2.default.createElement('div', { className: 'inner-circle' })
	            )
	          );
	          break;
	        case 'three-bounce':
	        default:
	          spinnerEl = _react2.default.createElement(
	            'div',
	            _extends({}, props, { className: 'three-bounce ' + classes }),
	            _react2.default.createElement('div', { className: 'bounce1' }),
	            _react2.default.createElement('div', { className: 'bounce2' }),
	            _react2.default.createElement('div', { className: 'bounce3' })
	          );
	      }
	      return spinnerEl;
	    }
	  }]);
	
	  return Spinner;
	}(_react2.default.Component);
	
	Spinner.propTypes = {
	  spinnerName: _react2.default.PropTypes.string.isRequired,
	  noFadeIn: _react2.default.PropTypes.bool,
	  overrideSpinnerClassName: _react2.default.PropTypes.string,
	  className: _react2.default.PropTypes.string
	};
	
	Spinner.defaultProps = {
	  spinnerName: 'three-bounce',
	  noFadeIn: false,
	  overrideSpinnerClassName: ''
	};
	
	module.exports = Spinner;

/***/ },

/***/ 830:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(831);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./fade-in.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./fade-in.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 831:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, "@-webkit-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@-moz-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@-ms-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n.fade-in {\n  -webkit-animation: fade-in 2s;\n  -moz-animation: fade-in 2s;\n  -o-animation: fade-in 2s;\n  -ms-animation: fade-in 2s;\n}\n", ""]);
	
	// exports


/***/ },

/***/ 832:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(833);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./chasing-dots.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./chasing-dots.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 833:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".chasing-dots {\n  width: 27px;\n  height: 27px;\n  position: relative;\n\n  -webkit-animation: rotate 2.0s infinite linear;\n  animation: rotate 2.0s infinite linear;\n}\n\n.dot1, .dot2 {\n  width: 60%;\n  height: 60%;\n  display: inline-block;\n  position: absolute;\n  top: 0;\n  background-color: #333;\n  border-radius: 100%;\n\n  -webkit-animation: bounce 2.0s infinite ease-in-out;\n  animation: bounce 2.0s infinite ease-in-out;\n}\n\n.dot2 {\n  top: auto;\n  bottom: 0px;\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n@-webkit-keyframes rotate { 100% { -webkit-transform: rotate(360deg) }}\n@keyframes rotate {\n  100% {\n    transform: rotate(360deg);\n    -webkit-transform: rotate(360deg);\n  }\n}\n\n@-webkit-keyframes bounce {\n  0%, 100% { -webkit-transform: scale(0.0) }\n  50% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bounce {\n  0%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 50% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 834:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(835);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./circle.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./circle.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 835:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".circle-wrapper {\n  width: 22px;\n  height: 22px;\n  position: relative;\n}\n\n.circle {\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  left: 0;\n  top: 0;\n}\n\n.circle:before {\n  content: '';\n  display: block;\n  margin: 0 auto;\n  width: 20%;\n  height: 20%;\n  background-color: #333;\n\n  border-radius: 100%;\n  -webkit-animation: bouncedelay 1.2s infinite ease-in-out;\n  animation: bouncedelay 1.2s infinite ease-in-out;\n  /* Prevent first frame from flickering when animation starts */\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both;\n}\n\n.circle2  { -webkit-transform: rotate(30deg);  transform: rotate(30deg)  }\n.circle3  { -webkit-transform: rotate(60deg);  transform: rotate(60deg)  }\n.circle4  { -webkit-transform: rotate(90deg);  transform: rotate(90deg)  }\n.circle5  { -webkit-transform: rotate(120deg); transform: rotate(120deg) }\n.circle6  { -webkit-transform: rotate(150deg); transform: rotate(150deg) }\n.circle7  { -webkit-transform: rotate(180deg); transform: rotate(180deg) }\n.circle8  { -webkit-transform: rotate(210deg); transform: rotate(210deg) }\n.circle9  { -webkit-transform: rotate(240deg); transform: rotate(240deg) }\n.circle10 { -webkit-transform: rotate(270deg); transform: rotate(270deg) }\n.circle11 { -webkit-transform: rotate(300deg); transform: rotate(300deg) }\n.circle12 { -webkit-transform: rotate(330deg); transform: rotate(330deg) }\n\n.circle2:before  { -webkit-animation-delay: -1.1s; animation-delay: -1.1s }\n.circle3:before  { -webkit-animation-delay: -1.0s; animation-delay: -1.0s }\n.circle4:before  { -webkit-animation-delay: -0.9s; animation-delay: -0.9s }\n.circle5:before  { -webkit-animation-delay: -0.8s; animation-delay: -0.8s }\n.circle6:before  { -webkit-animation-delay: -0.7s; animation-delay: -0.7s }\n.circle7:before  { -webkit-animation-delay: -0.6s; animation-delay: -0.6s }\n.circle8:before  { -webkit-animation-delay: -0.5s; animation-delay: -0.5s }\n.circle9:before  { -webkit-animation-delay: -0.4s; animation-delay: -0.4s }\n.circle10:before { -webkit-animation-delay: -0.3s; animation-delay: -0.3s }\n.circle11:before { -webkit-animation-delay: -0.2s; animation-delay: -0.2s }\n.circle12:before { -webkit-animation-delay: -0.1s; animation-delay: -0.1s }\n\n@-webkit-keyframes bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0.0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bouncedelay {\n  0%, 80%, 100% {\n    -webkit-transform: scale(0.0);\n    transform: scale(0.0);\n  } 40% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 836:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(837);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./cube-grid.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./cube-grid.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 837:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".cube-grid {\n  width:27px;\n  height:27px;\n}\n\n.cube {\n  width:33%;\n  height:33%;\n  background:#333;\n  float:left;\n  -webkit-animation: scaleDelay 1.3s infinite ease-in-out;\n  animation: scaleDelay 1.3s infinite ease-in-out;\n}\n\n/*\n * Spinner positions\n * 1 2 3\n * 4 5 6\n * 7 8 9\n */\n\n.spinner .cube:nth-child(1) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n.spinner .cube:nth-child(2) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s  }\n.spinner .cube:nth-child(3) { -webkit-animation-delay: 0.4s; animation-delay: 0.4s  }\n.spinner .cube:nth-child(4) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s  }\n.spinner .cube:nth-child(5) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n.spinner .cube:nth-child(6) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s  }\n.spinner .cube:nth-child(7) { -webkit-animation-delay: 0.0s; animation-delay: 0.0s  }\n.spinner .cube:nth-child(8) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s  }\n.spinner .cube:nth-child(9) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n\n@-webkit-keyframes scaleDelay {\n  0%, 70%, 100% { -webkit-transform:scale3D(1.0, 1.0, 1.0) }\n  35%           { -webkit-transform:scale3D(0.0, 0.0, 1.0) }\n}\n\n@keyframes scaleDelay {\n  0%, 70%, 100% { -webkit-transform:scale3D(1.0, 1.0, 1.0); transform:scale3D(1.0, 1.0, 1.0) }\n  35%           { -webkit-transform:scale3D(1.0, 1.0, 1.0); transform:scale3D(0.0, 0.0, 1.0) }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 838:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(839);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./double-bounce.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./double-bounce.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 839:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".double-bounce {\n  width: 27px;\n  height: 27px;\n\n  position: relative;\n}\n\n.double-bounce1, .double-bounce2 {\n  width: 100%;\n  height: 100%;\n  border-radius: 50%;\n  background-color: #333;\n  opacity: 0.6;\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  -webkit-animation: bounce 2.0s infinite ease-in-out;\n  animation: bounce 2.0s infinite ease-in-out;\n}\n\n.double-bounce2 {\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n@-webkit-keyframes bounce {\n  0%, 100% { -webkit-transform: scale(0.0) }\n  50% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bounce {\n  0%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 50% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 840:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(841);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./pulse.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./pulse.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 841:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".pulse {\n  width: 27px;\n  height: 27px;\n  background-color: #333;\n\n  border-radius: 100%;\n  -webkit-animation: scaleout 1.0s infinite ease-in-out;\n  animation: scaleout 1.0s infinite ease-in-out;\n}\n\n@-webkit-keyframes scaleout {\n  0% { -webkit-transform: scale(0.0) }\n  100% {\n    -webkit-transform: scale(1.0);\n    opacity: 0;\n  }\n}\n\n@keyframes scaleout {\n  0% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 100% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n    opacity: 0;\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 842:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(843);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./rotating-plane.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./rotating-plane.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 843:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".rotating-plane {\n  width: 27px;\n  height: 27px;\n  background-color: #333;\n\n  -webkit-animation: rotateplane 1.2s infinite ease-in-out;\n  animation: rotateplane 1.2s infinite ease-in-out;\n}\n\n@-webkit-keyframes rotateplane {\n  0% { -webkit-transform: perspective(120px) }\n  50% { -webkit-transform: perspective(120px) rotateY(180deg) }\n  100% { -webkit-transform: perspective(120px) rotateY(180deg)  rotateX(180deg) }\n}\n\n@keyframes rotateplane {\n  0% {\n    transform: perspective(120px) rotateX(0deg) rotateY(0deg);\n    -webkit-transform: perspective(120px) rotateX(0deg) rotateY(0deg);\n  } 50% {\n    transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);\n    -webkit-transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);\n  } 100% {\n    transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);\n    -webkit-transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 844:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(845);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./three-bounce.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./three-bounce.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 845:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".three-bounce > div {\n  width: 18px;\n  height: 18px;\n  background-color: #333;\n\n  border-radius: 100%;\n  display: inline-block;\n  -webkit-animation: bouncedelay 1.4s infinite ease-in-out;\n  animation: bouncedelay 1.4s infinite ease-in-out;\n  /* Prevent first frame from flickering when animation starts */\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both;\n}\n\n.three-bounce .bounce1 {\n  -webkit-animation-delay: -0.32s;\n  animation-delay: -0.32s;\n}\n\n.three-bounce .bounce2 {\n  -webkit-animation-delay: -0.16s;\n  animation-delay: -0.16s;\n}\n\n@-webkit-keyframes bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0.0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bouncedelay {\n  0%, 80%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 40% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n", ""]);
	
	// exports


/***/ },

/***/ 846:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(847);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./wandering-cubes.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./wandering-cubes.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 847:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".wandering-cubes {\n  width: 27px;\n  height: 27px;\n  position: relative;\n}\n\n.cube1, .cube2 {\n  background-color: #333;\n  width: 10px;\n  height: 10px;\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  -webkit-animation: cubemove 1.8s infinite ease-in-out;\n  animation: cubemove 1.8s infinite ease-in-out;\n}\n\n.cube2 {\n  -webkit-animation-delay: -0.9s;\n  animation-delay: -0.9s;\n}\n\n@-webkit-keyframes cubemove {\n  25% { -webkit-transform: translateX(22px) rotate(-90deg) scale(0.5) }\n  50% { -webkit-transform: translateX(22px) translateY(22px) rotate(-180deg) }\n  75% { -webkit-transform: translateX(0px) translateY(22px) rotate(-270deg) scale(0.5) }\n  100% { -webkit-transform: rotate(-360deg) }\n}\n\n@keyframes cubemove {\n  25% { \n    transform: translateX(42px) rotate(-90deg) scale(0.5);\n    -webkit-transform: translateX(42px) rotate(-90deg) scale(0.5);\n  } 50% {\n    /* Hack to make FF rotate in the right direction */\n    transform: translateX(42px) translateY(42px) rotate(-179deg);\n    -webkit-transform: translateX(42px) translateY(42px) rotate(-179deg);\n  } 50.1% {\n    transform: translateX(42px) translateY(42px) rotate(-180deg);\n    -webkit-transform: translateX(42px) translateY(42px) rotate(-180deg);\n  } 75% {\n    transform: translateX(0px) translateY(42px) rotate(-270deg) scale(0.5);\n    -webkit-transform: translateX(0px) translateY(42px) rotate(-270deg) scale(0.5);\n  } 100% {\n    transform: rotate(-360deg);\n    -webkit-transform: rotate(-360deg);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 848:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(849);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./wave.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./wave.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 849:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".wave {\n  width: 50px;\n  height: 27px;\n}\n\n.wave > div {\n  background-color: #333;\n  height: 100%;\n  width: 6px;\n  display: inline-block;\n\n  -webkit-animation: stretchdelay 1.2s infinite ease-in-out;\n  animation: stretchdelay 1.2s infinite ease-in-out;\n}\n\n.wave .rect2 {\n  -webkit-animation-delay: -1.1s;\n  animation-delay: -1.1s;\n}\n\n.wave .rect3 {\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n.wave .rect4 {\n  -webkit-animation-delay: -0.9s;\n  animation-delay: -0.9s;\n}\n\n.wave .rect5 {\n  -webkit-animation-delay: -0.8s;\n  animation-delay: -0.8s;\n}\n\n@-webkit-keyframes stretchdelay {\n  0%, 40%, 100% { -webkit-transform: scaleY(0.4) }\n  20% { -webkit-transform: scaleY(1.0) }\n}\n\n@keyframes stretchdelay {\n  0%, 40%, 100% {\n    transform: scaleY(0.4);\n    -webkit-transform: scaleY(0.4);\n  } 20% {\n    transform: scaleY(1.0);\n    -webkit-transform: scaleY(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 850:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(851);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./wordpress.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./wordpress.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 851:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, ".wordpress {\n  background: #333;\n  width: 27px;\n  height: 27px;\n  display: inline-block;\n  border-radius: 27px;\n  position: relative;\n  -webkit-animation: inner-circle 1s linear infinite;\n  animation: inner-circle 1s linear infinite;\n}\n\n.inner-circle {\n  display: block;\n  background: #fff;\n  width: 8px;\n  height: 8px;\n  position: absolute;\n  border-radius: 8px;\n  top: 5px;\n  left: 5px;\n}\n\n@-webkit-keyframes inner-circle {\n  0% { -webkit-transform: rotate(0); }\n  100% { -webkit-transform: rotate(360deg); }\n}\n\n@keyframes inner-circle {\n  0% { transform: rotate(0); -webkit-transform:rotate(0); }\n  100% { transform: rotate(360deg); -webkit-transform:rotate(360deg); }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 852:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var _react3 = _interopRequireDefault(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _reactAddonsPureRenderMixin = __webpack_require__(853);
	
	var _reactAddonsPureRenderMixin2 = _interopRequireDefault(_reactAddonsPureRenderMixin);
	
	var _immutable = __webpack_require__(647);
	
	var _immutable2 = _interopRequireDefault(_immutable);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    PurifyComponent: {
	        displayName: 'PurifyComponent'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/shared/components/PurifyComponent.js',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/shared/components/PurifyComponent.js',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var PurifyComponent = _wrapComponent('PurifyComponent')(function (_React$Component) {
	    _inherits(PurifyComponent, _React$Component);
	
	    function PurifyComponent(props) {
	        _classCallCheck(this, PurifyComponent);
	
	        var _this = _possibleConstructorReturn(this, (PurifyComponent.__proto__ || Object.getPrototypeOf(PurifyComponent)).call(this, props));
	
	        _this.shouldComponentUpdate = _reactAddonsPureRenderMixin2.default.shouldComponentUpdate.bind(_this);
	        return _this;
	    }
	
	    _createClass(PurifyComponent, [{
	        key: 'render',
	        value: function render() {
	            var _this2 = this;
	
	            var newProps = {};
	
	            Object.keys(this.props).forEach(function (key) {
	                if (key !== 'component') {
	                    if (_immutable2.default.Iterable.isIterable(_this2.props[key])) {
	                        newProps[key] = _this2.props[key].toJS();
	                    } else {
	                        newProps[key] = _this2.props[key];
	                    }
	                }
	            });
	
	            return _react3.default.createElement(this.props.component, newProps);
	        }
	    }]);
	
	    return PurifyComponent;
	}(_react3.default.Component));
	
	exports.default = PurifyComponent;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 853:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(854);

/***/ },

/***/ 854:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactComponentWithPureRenderMixin
	 */
	
	'use strict';
	
	var shallowCompare = __webpack_require__(855);
	
	/**
	 * If your React component's render function is "pure", e.g. it will render the
	 * same result given the same props and state, provide this mixin for a
	 * considerable performance boost.
	 *
	 * Most React components have pure render functions.
	 *
	 * Example:
	 *
	 *   var ReactComponentWithPureRenderMixin =
	 *     require('ReactComponentWithPureRenderMixin');
	 *   React.createClass({
	 *     mixins: [ReactComponentWithPureRenderMixin],
	 *
	 *     render: function() {
	 *       return <div className={this.props.className}>foo</div>;
	 *     }
	 *   });
	 *
	 * Note: This only checks shallow equality for props and state. If these contain
	 * complex data structures this mixin may have false-negatives for deeper
	 * differences. Only mixin to components which have simple props and state, or
	 * use `forceUpdate()` when you know deep data structures have changed.
	 *
	 * See https://facebook.github.io/react/docs/pure-render-mixin.html
	 */
	var ReactComponentWithPureRenderMixin = {
	  shouldComponentUpdate: function (nextProps, nextState) {
	    return shallowCompare(this, nextProps, nextState);
	  }
	};
	
	module.exports = ReactComponentWithPureRenderMixin;

/***/ },

/***/ 855:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	* @providesModule shallowCompare
	*/
	
	'use strict';
	
	var shallowEqual = __webpack_require__(131);
	
	/**
	 * Does a shallow comparison for props and state.
	 * See ReactComponentWithPureRenderMixin
	 * See also https://facebook.github.io/react/docs/shallow-compare.html
	 */
	function shallowCompare(instance, nextProps, nextState) {
	  return !shallowEqual(instance.props, nextProps) || !shallowEqual(instance.state, nextState);
	}
	
	module.exports = shallowCompare;

/***/ },

/***/ 856:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.ClinicalInformationSamplesTable = undefined;
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var _react3 = _interopRequireDefault(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _immutable = __webpack_require__(647);
	
	var _immutable2 = _interopRequireDefault(_immutable);
	
	var _fixedDataTable = __webpack_require__(857);
	
	var _EnhancedFixedDataTable = __webpack_require__(907);
	
	var _EnhancedFixedDataTable2 = _interopRequireDefault(_EnhancedFixedDataTable);
	
	var _convertSamplesData = __webpack_require__(918);
	
	var _convertSamplesData2 = _interopRequireDefault(_convertSamplesData);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    ClinicalInformationSamplesTable: {
	        displayName: 'ClinicalInformationSamplesTable'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationSamples.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationSamples.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var ClinicalInformationSamplesTable = exports.ClinicalInformationSamplesTable = _wrapComponent('ClinicalInformationSamplesTable')(function (_React$Component) {
	    _inherits(ClinicalInformationSamplesTable, _React$Component);
	
	    function ClinicalInformationSamplesTable(props) {
	        _classCallCheck(this, ClinicalInformationSamplesTable);
	
	        var _this = _possibleConstructorReturn(this, (ClinicalInformationSamplesTable.__proto__ || Object.getPrototypeOf(ClinicalInformationSamplesTable)).call(this, props));
	
	        _this.state = {
	            myTableData: [{ name: 'Rylan' }, { name: 'Amelia' }, { name: 'Estevan' }, { name: 'Florence' }, { name: 'Tressa' }]
	        };
	        return _this;
	    }
	
	    _createClass(ClinicalInformationSamplesTable, [{
	        key: 'render',
	        value: function render() {
	            var data = (0, _convertSamplesData2.default)(this.props.data.toArray());
	
	            var cells = [];
	
	            Object.keys(data.items).forEach(function (key) {
	                var item = data.items[key];
	
	                data.columns.forEach(function (col) {
	                    if (col.id in item) {
	                        cells.push({ attr_name: key, attr_id: col.id, attr_val: item[col.id] });
	                    } else {
	                        cells.push({ attr_name: key, attr_id: col.id, attr_val: 'N/A' });
	                    }
	                });
	            });
	
	            var d = {
	                attributes: data.columns.map(function (col) {
	                    return { attr_id: col.id, datatype: 'STRING', display_name: col.id };
	                }),
	                data: cells
	            };
	
	            d.attributes.unshift({ attr_id: 'attr_name', datatype: 'STRING', display_name: 'Attribute' });
	
	            return _react3.default.createElement(_EnhancedFixedDataTable2.default, { input: d, groupHeader: false, filter: 'GLOBAL', rowHeight: 33, headerHeight: 33, download: 'ALL', uniqueId: 'attr_name', tableWidth: 1190, autoColumnWidth: true });
	        }
	    }]);
	
	    return ClinicalInformationSamplesTable;
	}(_react3.default.Component));
	
	exports.default = ClinicalInformationSamplesTable;
	
	
	ClinicalInformationSamplesTable.propTypes = {
	    data: _react2.PropTypes.any.isRequired
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 918:
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	exports.default = function (data) {
	    var output = { columns: [], items: {} };
	
	    data.forEach(function (sample) {
	        var sampleId = sample.id;
	
	        output.columns.push({ id: sampleId });
	
	        sample.clinicalData.forEach(function (dataItem) {
	            output.items[dataItem.id] = output.items[dataItem.id] || {};
	            output.items[dataItem.id][sampleId] = dataItem.value.toString();
	            output.items[dataItem.id].name = dataItem.name;
	            output.items[dataItem.id].id = dataItem.id;
	        });
	    });
	
	    return output;
	};

/***/ },

/***/ 919:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
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
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _reactBootstrap = __webpack_require__(672);
	
	var _SampleInline = __webpack_require__(920);
	
	var _SampleInline2 = _interopRequireDefault(_SampleInline);
	
	var _ClinicalInformationPatientTable = __webpack_require__(671);
	
	var _ClinicalInformationPatientTable2 = _interopRequireDefault(_ClinicalInformationPatientTable);
	
	var _immutable = __webpack_require__(647);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactSpinkit = __webpack_require__(829);
	
	var _reactSpinkit2 = _interopRequireDefault(_reactSpinkit);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    PatientHeader: {
	        displayName: 'PatientHeader'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/patientHeader/PatientHeader.tsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/patientHeader/PatientHeader.tsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var PatientHeader = _wrapComponent('PatientHeader')(function (_React$Component) {
	    _inherits(PatientHeader, _React$Component);
	
	    function PatientHeader() {
	        _classCallCheck(this, PatientHeader);
	
	        return _possibleConstructorReturn(this, (PatientHeader.__proto__ || Object.getPrototypeOf(PatientHeader)).apply(this, arguments));
	    }
	
	    _createClass(PatientHeader, [{
	        key: 'getPopover',
	        value: function getPopover(sample, number) {
	            return React.createElement(
	                _reactBootstrap.Popover,
	                { key: number, id: 'popover-sample-' + number },
	                React.createElement(_ClinicalInformationPatientTable2.default, { data: Immutable.fromJS(sample.clinicalData) })
	            );
	        }
	    }, {
	        key: 'drawHeader',
	        value: function drawHeader() {
	            var _this2 = this;
	
	            if (this.props.samples && this.props.samples.size > 0) {
	                return React.createElement(
	                    'div',
	                    null,
	                    this.props.samples.map(function (sample, number) {
	                        //let clinicalData = this.props.samples.get('items').keys().map(attr_id => { 
	                        //    return Object({'id': x, 
	                        //                  'value': this.props.samples.get('items').get(attr_id).get('TCGA-P6-A5OH-01')
	                        //    }) 
	                        //}).filter(x => x.value);
	                        console.log(sample);
	                        return React.createElement(
	                            _reactBootstrap.OverlayTrigger,
	                            { delayHide: 100, key: number, trigger: ['hover', 'focus'], placement: 'bottom', overlay: _this2.getPopover(sample, number + 1) },
	                            React.createElement(
	                                'span',
	                                null,
	                                React.createElement(_SampleInline2.default, { sample: sample, number: number + 1 })
	                            )
	                        );
	                    })
	                );
	            } else {
	                return React.createElement(
	                    'div',
	                    null,
	                    'There was an error.'
	                );
	            }
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            switch (this.props.status) {
	                case 'fetching':
	                    return React.createElement(
	                        'div',
	                        null,
	                        React.createElement(_reactSpinkit2.default, { spinnerName: 'three-bounce' })
	                    );
	                case 'complete':
	                    return this.drawHeader();
	                case 'error':
	                    return React.createElement(
	                        'div',
	                        null,
	                        'There was an error.'
	                    );
	                default:
	                    return React.createElement('div', null);
	            }
	        }
	    }]);
	
	    return PatientHeader;
	}(React.Component));
	
	exports.default = PatientHeader;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 920:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
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
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _SampleLabel = __webpack_require__(659);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    SampleInline: {
	        displayName: 'SampleInline'
	    }
	};
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/patientHeader/SampleInline.tsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/aaronlisman/WebstormProjects/cbioportal-frontend/src/pages/patientView/patientHeader/SampleInline.tsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersAaronlismanWebstormProjectsCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var SampleInline = _wrapComponent('SampleInline')(function (_React$Component) {
	    _inherits(SampleInline, _React$Component);
	
	    function SampleInline() {
	        _classCallCheck(this, SampleInline);
	
	        return _possibleConstructorReturn(this, (SampleInline.__proto__ || Object.getPrototypeOf(SampleInline)).apply(this, arguments));
	    }
	
	    _createClass(SampleInline, [{
	        key: 'render',
	        value: function render() {
	            var _props = this.props;
	            var sample = _props.sample;
	            var number = _props.number;
	
	            return React.createElement(
	                'span',
	                { style: { "paddingRight": "10px" } },
	                React.createElement(_SampleLabel.SampleLabelHTML, { color: 'black', label: number.toString() }),
	                ' ' + sample.id
	            );
	        }
	    }]);
	
	    return SampleInline;
	}(React.Component));
	
	exports.default = SampleInline;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 921:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(922);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(667)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../../../node_modules/css-loader/index.js?!sass!sass-resources!./local-styles.scss", function() {
				var newContent = require("!!./../../../../../node_modules/css-loader/index.js?!sass!sass-resources!./local-styles.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 922:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(666)();
	// imports
	
	
	// module
	exports.push([module.id, "#content h4 {\n  margin-bottom: 50px !important; }\n  #content h4:nth-child(n+2) {\n    margin-top: 20px; }\n", ""]);
	
	// exports


/***/ }

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvUGF0aWVudFZpZXdQYWdlLnRzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlLnRzeCIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvZGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzPzZjZjQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9mYWRlLWluLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3M/ODRkZSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzPzcwNDgiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcz9lNjUzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2RvdWJsZS1ib3VuY2UuY3NzPzU0MTQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9kb3VibGUtYm91bmNlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3B1bHNlLmNzcz85MzUxIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvcm90YXRpbmctcGxhbmUuY3NzP2EyYjMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9yb3RhdGluZy1wbGFuZS5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzP2YwMTYiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcz8xMTA0Iiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dhdmUuY3NzP2JiMWUiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3M/MDA2MSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9jb21wb25lbnRzL1B1cmlmeUNvbXBvbmVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LWFkZG9ucy1wdXJlLXJlbmRlci1taXhpbi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0L2xpYi9SZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC9saWIvc2hhbGxvd0NvbXBhcmUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMuanN4Iiwid2VicGFjazovLy8uL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL2xpYi9jb252ZXJ0U2FtcGxlc0RhdGEuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvUGF0aWVudEhlYWRlci50c3giLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvU2FtcGxlSW5saW5lLnRzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2NzcyIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2Nzcz8wNTZiIl0sIm5hbWVzIjpbImFyMSIsImFyMiIsInByb3BzIiwibG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEiLCJ0YWJJZCIsInNldFRhYiIsInNhbXBsZXMiLCJwYXRpZW50IiwiZ2V0Iiwic3RhdHVzIiwiYnVpbGRUYWJzIiwiQ29tcG9uZW50IiwiUGF0aWVudEhlYWRlciIsIkNsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXJVbmNvbm5lY3RlZCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsImJpbmQiLCJuZXdQcm9wcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwiSXRlcmFibGUiLCJpc0l0ZXJhYmxlIiwidG9KUyIsInN0YXRlIiwibXlUYWJsZURhdGEiLCJuYW1lIiwiZGF0YSIsInRvQXJyYXkiLCJjZWxscyIsIml0ZW1zIiwiaXRlbSIsImNvbHVtbnMiLCJjb2wiLCJpZCIsInB1c2giLCJhdHRyX25hbWUiLCJhdHRyX2lkIiwiYXR0cl92YWwiLCJkIiwiYXR0cmlidXRlcyIsIm1hcCIsImRhdGF0eXBlIiwiZGlzcGxheV9uYW1lIiwidW5zaGlmdCIsIkNsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUiLCJwcm9wVHlwZXMiLCJhbnkiLCJpc1JlcXVpcmVkIiwib3V0cHV0Iiwic2FtcGxlIiwic2FtcGxlSWQiLCJjbGluaWNhbERhdGEiLCJkYXRhSXRlbSIsInZhbHVlIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBQThCOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ3ZCOztLQUE4Qjs7QUFFd0Q7Ozs7QUFDekI7Ozs7QUFhcEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNBY1E7aUJBQW1CLGdCQUFlLHlCQUFnQixnQkFBb0QsaUNBRTlGO3NCQUFPLE9BQ1gsb0JBQWMsaUJBQU8sT0FBSyxLQUFNLE1BQVUsVUFDbEMsU0FBZSxlQUkvQjtBQUVNOzs7O2tDQUVLO29CQUdYLDREQUNIOzs7O3lDQTVCdUQsT0FFaEQ7aUJBQU0sS0FBUSxNQUFJLElBQ1o7OzBCQUNTLEdBQUksSUFDVDt5QkFBSSxHQUFJLElBQ1A7MEJBQUksR0FBSSxJQUlOO0FBTkY7Ozs7O0dBTitCLE1BRXhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xCMUI7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkNBS3NCQSxHLEVBQUtDLEcsRUFBSztBQUN4QixrQkFBS0MsS0FBTCxDQUFXQyxnQ0FBWDtBQUNIOzs7NkNBRW1CO0FBQ2hCLG9CQUVJO0FBQUMsNEJBQUQ7QUFBQTtBQUNJO0FBQUMsMkJBQUQ7QUFBQTtBQUFBO0FBQUEsa0JBREo7QUFFSTtBQUFDLDJCQUFEO0FBQUE7QUFBQTtBQUFBLGtCQUZKO0FBR0k7QUFBQywyQkFBRDtBQUFBO0FBQUE7QUFBQTtBQUhKLGNBRko7QUFTSDs7O21DQUVTQyxLLEVBQU87QUFDYixrQkFBS0YsS0FBTCxDQUFXRyxNQUFYLENBQWtC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bGUiOiJyZWFjdGFwcC9qcy8xLmNodW5rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7QnV0dG9uLCBPdmVybGF5LCBUb29sdGlwLCBQb3BvdmVyfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IENsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXIgZnJvbSAnLi9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXInO1xuaW1wb3J0IFBhdGllbnRIZWFkZXJVbmNvbm5lY3RlZCBmcm9tICcuL3BhdGllbnRIZWFkZXIvUGF0aWVudEhlYWRlcic7XG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0ICogYXMgSW1tdXRhYmxlIGZyb20gXCJpbW11dGFibGVcIjtcbmltcG9ydCBPcmRlcmVkTWFwID0gSW1tdXRhYmxlLk9yZGVyZWRNYXA7XG5pbXBvcnQge1BhdGllbnRIZWFkZXJQcm9wc30gZnJvbSBcIi4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyXCI7XG5cbnR5cGUgVE9ETyA9IGFueTtcblxuaW50ZXJmYWNlIFBhdGllbnRWaWV3UGFnZVByb3BzXG57XG4gICAgc3RvcmU/OiBUT0RPO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRpZW50Vmlld1BhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UGF0aWVudFZpZXdQYWdlUHJvcHMsIHt9Plxue1xuICAgIHN0YXRpYyBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6T3JkZXJlZE1hcDxzdHJpbmcsIGFueT4pOlBhdGllbnRIZWFkZXJQcm9wc1xuICAgIHtcbiAgICAgICAgbGV0IGNpID0gc3RhdGUuZ2V0KCdjbGluaWNhbEluZm9ybWF0aW9uJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzYW1wbGVzOiBjaS5nZXQoJ3NhbXBsZXMnKSxcbiAgICAgICAgICAgIHN0YXR1czogY2kuZ2V0KCdzdGF0dXMnKSxcbiAgICAgICAgICAgIHBhdGllbnQ6IGNpLmdldCgncGF0aWVudCcpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KClcbiAgICB7XG4gICAgICAgIGNvbnN0IFBhdGllbnRIZWFkZXI6VE9ETyA9IGNvbm5lY3QoUGF0aWVudFZpZXdQYWdlLm1hcFN0YXRlVG9Qcm9wcykoUGF0aWVudEhlYWRlclVuY29ubmVjdGVkIGFzIFRPRE8pO1xuXG4gICAgICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgICAgICAgIDxQYXRpZW50SGVhZGVyIHN0b3JlPXt0aGlzLnByb3BzLnN0b3JlfSAvPixcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xpbmljYWxfZGl2XCIpIGFzIEVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgICAgLy9SZWFjdERPTS5yZW5kZXIoPGRpdj48RXhhbXBsZSAvPjxFeGFtcGxlIC8+PC9kaXY+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNsaW5pY2FsX2RpdlwiKSBhcyBFbGVtZW50KTtcblxuICAgIH1cblxuICAgIHJlbmRlcigpXG4gICAge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPENsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXIgLz5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9QYXRpZW50Vmlld1BhZ2UudHN4XG4gKiovIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IENsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUgZnJvbSAnLi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlJztcbmltcG9ydCBQRFhUcmVlIGZyb20gJy4vUERYVHJlZSc7XG5pbXBvcnQgU3Bpbm5lciBmcm9tICdyZWFjdC1zcGlua2l0JztcbmltcG9ydCB7IGFjdGlvbkNyZWF0b3JzLCBtYXBTdGF0ZVRvUHJvcHMgfSBmcm9tICcuL2R1Y2snO1xuaW1wb3J0IFB1cmlmeUNvbXBvbmVudCBmcm9tICdzaGFyZWQvY29tcG9uZW50cy9QdXJpZnlDb21wb25lbnQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCBDbGluaWNhbEluZm9ybWF0aW9uU2FtcGxlcyBmcm9tICcuL0NsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzJztcbmltcG9ydCBQYXRpZW50SGVhZGVyVW5jb25uZWN0ZWQgZnJvbSAnLi4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyJztcblxuaW1wb3J0ICcuL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzJztcblxuXG5leHBvcnQgY2xhc3MgQ2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lclVuY29ubmVjdGVkIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICAgIGNvbXBvbmVudERpZE1vdW50KGFyMSwgYXIyKSB7XG4gICAgICAgIHRoaXMucHJvcHMubG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEoKTtcbiAgICB9XG5cbiAgICBidWlsZEJ1dHRvbkdyb3VwcygpIHtcbiAgICAgICAgcmV0dXJuIChcblxuICAgICAgICAgICAgPEJ1dHRvbkdyb3VwPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q29weTwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q1NWPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbj5TaG93L0hpZGUgQ29sdW1uczwvQnV0dG9uPlxuICAgICAgICAgICAgPC9CdXR0b25Hcm91cD5cblxuICAgICAgICApO1xuICAgIH1cblxuICAgIHNlbGVjdFRhYih0YWJJZCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldFRhYih0YWJJZCk7XG4gICAgfVxuXG4gICAgYnVpbGRUYWJzKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQ+TXkgU2FtcGxlczwvaDQ+XG5cbiAgICAgICAgICAgICAgICA8Q2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMgZGF0YT17dGhpcy5wcm9wcy5zYW1wbGVzfSAvPlxuXG4gICAgICAgICAgICAgICAgPGg0PlBhdGllbnQ8L2g0PlxuICAgICAgICAgICAgICAgIDxDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlIGRhdGE9e3RoaXMucHJvcHMucGF0aWVudC5nZXQoJ2NsaW5pY2FsRGF0YScpfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5zdGF0dXMpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmV0Y2hpbmcnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+PFNwaW5uZXIgc3Bpbm5lck5hbWU9XCJ0aHJlZS1ib3VuY2VcIiAvPjwvZGl2PjtcblxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+eyB0aGlzLmJ1aWxkVGFicygpIH08L2Rpdj47XG5cbiAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcblxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiAvPjtcblxuICAgICAgICB9XG4gICAgfVxuXG5cbn1cblxuZXhwb3J0IGNvbnN0IFBhdGllbnRIZWFkZXIgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcyxcbiAgICBhY3Rpb25DcmVhdG9ycykoUGF0aWVudEhlYWRlclVuY29ubmVjdGVkKTtcblxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIGFjdGlvbkNyZWF0b3JzKShDbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyVW5jb25uZWN0ZWQpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeFxuICoqLyIsImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7TGlzdH0gZnJvbSBcImltbXV0YWJsZVwiO1xuaW1wb3J0ICogYXMgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5cbnR5cGUgVE9ETyA9IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlUHJvcHNcbntcbiAgICBkYXRhOiBMaXN0PFRPRE8+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PENsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGVQcm9wcywge30+XG57XG4gICAgcmVuZGVyKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHJvd3M6SlNYLkVsZW1lbnRbXSA9IFtdO1xuICAgICAgICB0aGlzLnByb3BzLmRhdGEuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0uZ2V0KCdpZCcpfT5cbiAgICAgICAgICAgICAgICAgICAgPHRkPntpdGVtLmdldCgnaWQnKX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQ+e2l0ZW0uZ2V0KCd2YWx1ZScpfTwvdGQ+XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8VGFibGUgc3RyaXBlZD5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICA8dGg+QXR0cmlidXRlPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPHRoPlZhbHVlPC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG5cbiAgICAgICAgICAgIDwvVGFibGU+XG4gICAgICAgICk7XG5cbiAgICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUudHN4XG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX29iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIF9vYmplY3RBc3NpZ24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfb2JqZWN0QXNzaWduKTtcblxucmVxdWlyZSgnLi4vY3NzL2ZhZGUtaW4uY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9jaGFzaW5nLWRvdHMuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9jaXJjbGUuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9jdWJlLWdyaWQuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9kb3VibGUtYm91bmNlLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvcHVsc2UuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9yb3RhdGluZy1wbGFuZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3RocmVlLWJvdW5jZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3dhbmRlcmluZy1jdWJlcy5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3dhdmUuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy93b3JkcHJlc3MuY3NzJyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcblxuXG52YXIgU3Bpbm5lciA9IGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhTcGlubmVyLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBTcGlubmVyKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFNwaW5uZXIpO1xuXG4gICAgdmFyIF90aGlzID0gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgT2JqZWN0LmdldFByb3RvdHlwZU9mKFNwaW5uZXIpLmNhbGwodGhpcywgcHJvcHMpKTtcblxuICAgIF90aGlzLmRpc3BsYXlOYW1lID0gJ1NwaW5LaXQnO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhTcGlubmVyLCBbe1xuICAgIGtleTogJ3JlbmRlcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgIHZhciBfY3g7XG5cbiAgICAgIHZhciBjbGFzc2VzID0gKDAsIF9jbGFzc25hbWVzMi5kZWZhdWx0KSgoX2N4ID0ge1xuICAgICAgICAnZmFkZS1pbic6ICF0aGlzLnByb3BzLm5vRmFkZUluLFxuICAgICAgICBzcGlubmVyOiB0aGlzLnByb3BzLm92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZSA9PT0gJydcbiAgICAgIH0sIF9kZWZpbmVQcm9wZXJ0eShfY3gsIHRoaXMucHJvcHMub3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lLCAhIXRoaXMucHJvcHMub3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lKSwgX2RlZmluZVByb3BlcnR5KF9jeCwgdGhpcy5wcm9wcy5jbGFzc05hbWUsICEhdGhpcy5wcm9wcy5jbGFzc05hbWUpLCBfY3gpKTtcblxuICAgICAgdmFyIHByb3BzID0gKDAsIF9vYmplY3RBc3NpZ24yLmRlZmF1bHQpKHt9LCB0aGlzLnByb3BzKTtcbiAgICAgIGRlbGV0ZSBwcm9wcy5zcGlubmVyTmFtZTtcbiAgICAgIGRlbGV0ZSBwcm9wcy5ub0ZhZGVJbjtcbiAgICAgIGRlbGV0ZSBwcm9wcy5vdmVycmlkZVNwaW5uZXJDbGFzc05hbWU7XG4gICAgICBkZWxldGUgcHJvcHMuY2xhc3NOYW1lO1xuXG4gICAgICB2YXIgc3Bpbm5lckVsID0gdm9pZCAwO1xuICAgICAgc3dpdGNoICh0aGlzLnByb3BzLnNwaW5uZXJOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2RvdWJsZS1ib3VuY2UnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAnZG91YmxlLWJvdW5jZSAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2RvdWJsZS1ib3VuY2UxJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2RvdWJsZS1ib3VuY2UyJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JvdGF0aW5nLXBsYW5lJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JvdGF0aW5nLXBsYW5lJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dhdmUnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAnd2F2ZSAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JlY3QxJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JlY3QyJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JlY3QzJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JlY3Q0JyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3JlY3Q1JyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dhbmRlcmluZy1jdWJlcyc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICd3YW5kZXJpbmctY3ViZXMgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlMScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlMicgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdWxzZSc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6IGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdwdWxzZScgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjaGFzaW5nLWRvdHMnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgICB7IGNsYXNzTmFtZTogJ2NoYXNpbmctZG90cycgfSxcbiAgICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnZG90MScgfSksXG4gICAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2RvdDInIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY2lyY2xlJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ2NpcmNsZS13cmFwcGVyICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMSBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMiBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMyBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlNCBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlNSBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlNiBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlNyBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlOCBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlOSBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMTAgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTExIGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUxMiBjaXJjbGUnIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY3ViZS1ncmlkJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ2N1YmUtZ3JpZCAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dvcmRwcmVzcyc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6IGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAnd29yZHByZXNzJyB9LFxuICAgICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdpbm5lci1jaXJjbGUnIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndGhyZWUtYm91bmNlJzpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ3RocmVlLWJvdW5jZSAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2JvdW5jZTEnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnYm91bmNlMicgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdib3VuY2UzJyB9KVxuICAgICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3Bpbm5lckVsO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBTcGlubmVyO1xufShfcmVhY3QyLmRlZmF1bHQuQ29tcG9uZW50KTtcblxuU3Bpbm5lci5wcm9wVHlwZXMgPSB7XG4gIHNwaW5uZXJOYW1lOiBfcmVhY3QyLmRlZmF1bHQuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBub0ZhZGVJbjogX3JlYWN0Mi5kZWZhdWx0LlByb3BUeXBlcy5ib29sLFxuICBvdmVycmlkZVNwaW5uZXJDbGFzc05hbWU6IF9yZWFjdDIuZGVmYXVsdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBjbGFzc05hbWU6IF9yZWFjdDIuZGVmYXVsdC5Qcm9wVHlwZXMuc3RyaW5nXG59O1xuXG5TcGlubmVyLmRlZmF1bHRQcm9wcyA9IHtcbiAgc3Bpbm5lck5hbWU6ICd0aHJlZS1ib3VuY2UnLFxuICBub0ZhZGVJbjogZmFsc2UsXG4gIG92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZTogJydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3Bpbm5lcjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Rpc3QvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA4MjlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9mYWRlLWluLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZmFkZS1pbi5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2ZhZGUtaW4uY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9mYWRlLWluLmNzc1xuICoqIG1vZHVsZSBpZCA9IDgzMFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIkAtd2Via2l0LWtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuQC1tb3ota2V5ZnJhbWVzIGZhZGUtaW4ge1xcbiAgMCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICA1MCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICAxMDAlIHtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgfVxcbn1cXG5cXG5ALW1zLWtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuQGtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuLmZhZGUtaW4ge1xcbiAgLXdlYmtpdC1hbmltYXRpb246IGZhZGUtaW4gMnM7XFxuICAtbW96LWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG4gIC1vLWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG4gIC1tcy1hbmltYXRpb246IGZhZGUtaW4gMnM7XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzXG4gKiogbW9kdWxlIGlkID0gODMxXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY2hhc2luZy1kb3RzLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY2hhc2luZy1kb3RzLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY2hhc2luZy1kb3RzLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvY2hhc2luZy1kb3RzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDgzMlxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5jaGFzaW5nLWRvdHMge1xcbiAgd2lkdGg6IDI3cHg7XFxuICBoZWlnaHQ6IDI3cHg7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogcm90YXRlIDIuMHMgaW5maW5pdGUgbGluZWFyO1xcbiAgYW5pbWF0aW9uOiByb3RhdGUgMi4wcyBpbmZpbml0ZSBsaW5lYXI7XFxufVxcblxcbi5kb3QxLCAuZG90MiB7XFxuICB3aWR0aDogNjAlO1xcbiAgaGVpZ2h0OiA2MCU7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcbiAgYm9yZGVyLXJhZGl1czogMTAwJTtcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogYm91bmNlIDIuMHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxufVxcblxcbi5kb3QyIHtcXG4gIHRvcDogYXV0bztcXG4gIGJvdHRvbTogMHB4O1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjBzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHJvdGF0ZSB7IDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZykgfX1cXG5Aa2V5ZnJhbWVzIHJvdGF0ZSB7XFxuICAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpO1xcbiAgfVxcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCkgfVxcbiAgNTAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCkgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIGJvdW5jZSB7XFxuICAwJSwgMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICB9IDUwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzXG4gKiogbW9kdWxlIGlkID0gODM0XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLmNpcmNsZS13cmFwcGVyIHtcXG4gIHdpZHRoOiAyMnB4O1xcbiAgaGVpZ2h0OiAyMnB4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4uY2lyY2xlIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgbGVmdDogMDtcXG4gIHRvcDogMDtcXG59XFxuXFxuLmNpcmNsZTpiZWZvcmUge1xcbiAgY29udGVudDogJyc7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIG1hcmdpbjogMCBhdXRvO1xcbiAgd2lkdGg6IDIwJTtcXG4gIGhlaWdodDogMjAlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG5cXG4gIGJvcmRlci1yYWRpdXM6IDEwMCU7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIC8qIFByZXZlbnQgZmlyc3QgZnJhbWUgZnJvbSBmbGlja2VyaW5nIHdoZW4gYW5pbWF0aW9uIHN0YXJ0cyAqL1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xcbiAgYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcXG59XFxuXFxuLmNpcmNsZTIgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzMGRlZyk7ICB0cmFuc2Zvcm06IHJvdGF0ZSgzMGRlZykgIH1cXG4uY2lyY2xlMyAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDYwZGVnKTsgIHRyYW5zZm9ybTogcm90YXRlKDYwZGVnKSAgfVxcbi5jaXJjbGU0ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpOyAgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpICB9XFxuLmNpcmNsZTUgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgxMjBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgxMjBkZWcpIH1cXG4uY2lyY2xlNiAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDE1MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDE1MGRlZykgfVxcbi5jaXJjbGU3ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMTgwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMTgwZGVnKSB9XFxuLmNpcmNsZTggIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgyMTBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgyMTBkZWcpIH1cXG4uY2lyY2xlOSAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDI0MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDI0MGRlZykgfVxcbi5jaXJjbGUxMCB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMjcwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMjcwZGVnKSB9XFxuLmNpcmNsZTExIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzMDBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgzMDBkZWcpIH1cXG4uY2lyY2xlMTIgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDMzMGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDMzMGRlZykgfVxcblxcbi5jaXJjbGUyOmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMXM7IGFuaW1hdGlvbi1kZWxheTogLTEuMXMgfVxcbi5jaXJjbGUzOmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7IGFuaW1hdGlvbi1kZWxheTogLTEuMHMgfVxcbi5jaXJjbGU0OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOXM7IGFuaW1hdGlvbi1kZWxheTogLTAuOXMgfVxcbi5jaXJjbGU1OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOHM7IGFuaW1hdGlvbi1kZWxheTogLTAuOHMgfVxcbi5jaXJjbGU2OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuN3M7IGFuaW1hdGlvbi1kZWxheTogLTAuN3MgfVxcbi5jaXJjbGU3OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuNnM7IGFuaW1hdGlvbi1kZWxheTogLTAuNnMgfVxcbi5jaXJjbGU4OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuNXM7IGFuaW1hdGlvbi1kZWxheTogLTAuNXMgfVxcbi5jaXJjbGU5OmJlZm9yZSAgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuNHM7IGFuaW1hdGlvbi1kZWxheTogLTAuNHMgfVxcbi5jaXJjbGUxMDpiZWZvcmUgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuM3M7IGFuaW1hdGlvbi1kZWxheTogLTAuM3MgfVxcbi5jaXJjbGUxMTpiZWZvcmUgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuMnM7IGFuaW1hdGlvbi1kZWxheTogLTAuMnMgfVxcbi5jaXJjbGUxMjpiZWZvcmUgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuMXM7IGFuaW1hdGlvbi1kZWxheTogLTAuMXMgfVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBib3VuY2VkZWxheSB7XFxuICAwJSwgODAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCkgfVxcbiAgNDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCkgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIGJvdW5jZWRlbGF5IHtcXG4gIDAlLCA4MCUsIDEwMCUge1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgfSA0MCUge1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzXG4gKiogbW9kdWxlIGlkID0gODM1XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY3ViZS1ncmlkLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY3ViZS1ncmlkLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY3ViZS1ncmlkLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzc1xuICoqIG1vZHVsZSBpZCA9IDgzNlxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5jdWJlLWdyaWQge1xcbiAgd2lkdGg6MjdweDtcXG4gIGhlaWdodDoyN3B4O1xcbn1cXG5cXG4uY3ViZSB7XFxuICB3aWR0aDozMyU7XFxuICBoZWlnaHQ6MzMlO1xcbiAgYmFja2dyb3VuZDojMzMzO1xcbiAgZmxvYXQ6bGVmdDtcXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBzY2FsZURlbGF5IDEuM3MgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IHNjYWxlRGVsYXkgMS4zcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLypcXG4gKiBTcGlubmVyIHBvc2l0aW9uc1xcbiAqIDEgMiAzXFxuICogNCA1IDZcXG4gKiA3IDggOVxcbiAqL1xcblxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCgxKSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjJzOyBhbmltYXRpb24tZGVsYXk6IDAuMnMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoMikgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4zczsgYW5pbWF0aW9uLWRlbGF5OiAwLjNzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDMpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuNHM7IGFuaW1hdGlvbi1kZWxheTogMC40cyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg0KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjFzOyBhbmltYXRpb24tZGVsYXk6IDAuMXMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoNSkgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4yczsgYW5pbWF0aW9uLWRlbGF5OiAwLjJzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDYpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuM3M7IGFuaW1hdGlvbi1kZWxheTogMC4zcyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg3KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjBzOyBhbmltYXRpb24tZGVsYXk6IDAuMHMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoOCkgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4xczsgYW5pbWF0aW9uLWRlbGF5OiAwLjFzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDkpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuMnM7IGFuaW1hdGlvbi1kZWxheTogMC4ycyAgfVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBzY2FsZURlbGF5IHtcXG4gIDAlLCA3MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApIH1cXG4gIDM1JSAgICAgICAgICAgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDAuMCwgMC4wLCAxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBzY2FsZURlbGF5IHtcXG4gIDAlLCA3MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApOyB0cmFuc2Zvcm06c2NhbGUzRCgxLjAsIDEuMCwgMS4wKSB9XFxuICAzNSUgICAgICAgICAgIHsgLXdlYmtpdC10cmFuc2Zvcm06c2NhbGUzRCgxLjAsIDEuMCwgMS4wKTsgdHJhbnNmb3JtOnNjYWxlM0QoMC4wLCAwLjAsIDEuMCkgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jdWJlLWdyaWQuY3NzXG4gKiogbW9kdWxlIGlkID0gODM3XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZG91YmxlLWJvdW5jZS5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2RvdWJsZS1ib3VuY2UuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9kb3VibGUtYm91bmNlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvZG91YmxlLWJvdW5jZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuZG91YmxlLWJvdW5jZSB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG5cXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG59XFxuXFxuLmRvdWJsZS1ib3VuY2UxLCAuZG91YmxlLWJvdW5jZTIge1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBib3JkZXItcmFkaXVzOiA1MCU7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcbiAgb3BhY2l0eTogMC42O1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiAwO1xcbiAgbGVmdDogMDtcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogYm91bmNlIDIuMHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxufVxcblxcbi5kb3VibGUtYm91bmNlMiB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0xLjBzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCkgfVxcbiAgNTAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCkgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIGJvdW5jZSB7XFxuICAwJSwgMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICB9IDUwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2RvdWJsZS1ib3VuY2UuY3NzXG4gKiogbW9kdWxlIGlkID0gODM5XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHVsc2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9wdWxzZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3B1bHNlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzXG4gKiogbW9kdWxlIGlkID0gODQwXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLnB1bHNlIHtcXG4gIHdpZHRoOiAyN3B4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG5cXG4gIGJvcmRlci1yYWRpdXM6IDEwMCU7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogc2NhbGVvdXQgMS4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogc2NhbGVvdXQgMS4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlb3V0IHtcXG4gIDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCkgfVxcbiAgMTAwJSB7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIHNjYWxlb3V0IHtcXG4gIDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICAgIG9wYWNpdHk6IDA7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL3B1bHNlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0MVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3JvdGF0aW5nLXBsYW5lLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcm90YXRpbmctcGxhbmUuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9yb3RhdGluZy1wbGFuZS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL3JvdGF0aW5nLXBsYW5lLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0MlxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5yb3RhdGluZy1wbGFuZSB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogcm90YXRlcGxhbmUgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogcm90YXRlcGxhbmUgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHJvdGF0ZXBsYW5lIHtcXG4gIDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVkoMTgwZGVnKSB9XFxuICAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVZKDE4MGRlZykgIHJvdGF0ZVgoMTgwZGVnKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgcm90YXRlcGxhbmUge1xcbiAgMCUge1xcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKDBkZWcpIHJvdGF0ZVkoMGRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMjBweCkgcm90YXRlWCgwZGVnKSByb3RhdGVZKDBkZWcpO1xcbiAgfSA1MCUge1xcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKC0xODAuMWRlZykgcm90YXRlWSgwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKC0xODAuMWRlZykgcm90YXRlWSgwZGVnKTtcXG4gIH0gMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MGRlZykgcm90YXRlWSgtMTc5LjlkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MGRlZykgcm90YXRlWSgtMTc5LjlkZWcpO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9yb3RhdGluZy1wbGFuZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90aHJlZS1ib3VuY2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90aHJlZS1ib3VuY2UuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90aHJlZS1ib3VuY2UuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzXG4gKiogbW9kdWxlIGlkID0gODQ0XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLnRocmVlLWJvdW5jZSA+IGRpdiB7XFxuICB3aWR0aDogMThweDtcXG4gIGhlaWdodDogMThweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuXFxuICBib3JkZXItcmFkaXVzOiAxMDAlO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZWRlbGF5IDEuNHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IGJvdW5jZWRlbGF5IDEuNHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICAvKiBQcmV2ZW50IGZpcnN0IGZyYW1lIGZyb20gZmxpY2tlcmluZyB3aGVuIGFuaW1hdGlvbiBzdGFydHMgKi9cXG4gIC13ZWJraXQtYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcXG4gIGFuaW1hdGlvbi1maWxsLW1vZGU6IGJvdGg7XFxufVxcblxcbi50aHJlZS1ib3VuY2UgLmJvdW5jZTEge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjMycztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTAuMzJzO1xcbn1cXG5cXG4udGhyZWUtYm91bmNlIC5ib3VuY2UyIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC4xNnM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0wLjE2cztcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIGJvdW5jZWRlbGF5IHtcXG4gIDAlLCA4MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA0MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlZGVsYXkge1xcbiAgMCUsIDgwJSwgMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICB9IDQwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICB9XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL3RocmVlLWJvdW5jZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YW5kZXJpbmctY3ViZXMuY3NzXG4gKiogbW9kdWxlIGlkID0gODQ2XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndhbmRlcmluZy1jdWJlcyB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG59XFxuXFxuLmN1YmUxLCAuY3ViZTIge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG4gIHdpZHRoOiAxMHB4O1xcbiAgaGVpZ2h0OiAxMHB4O1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiAwO1xcbiAgbGVmdDogMDtcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBjdWJlbW92ZSAxLjhzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBjdWJlbW92ZSAxLjhzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG4uY3ViZTIge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjlzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMC45cztcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIGN1YmVtb3ZlIHtcXG4gIDI1JSB7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDIycHgpIHJvdGF0ZSgtOTBkZWcpIHNjYWxlKDAuNSkgfVxcbiAgNTAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMjJweCkgdHJhbnNsYXRlWSgyMnB4KSByb3RhdGUoLTE4MGRlZykgfVxcbiAgNzUlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMHB4KSB0cmFuc2xhdGVZKDIycHgpIHJvdGF0ZSgtMjcwZGVnKSBzY2FsZSgwLjUpIH1cXG4gIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKC0zNjBkZWcpIH1cXG59XFxuXFxuQGtleWZyYW1lcyBjdWJlbW92ZSB7XFxuICAyNSUgeyBcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHJvdGF0ZSgtOTBkZWcpIHNjYWxlKDAuNSk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHJvdGF0ZSgtOTBkZWcpIHNjYWxlKDAuNSk7XFxuICB9IDUwJSB7XFxuICAgIC8qIEhhY2sgdG8gbWFrZSBGRiByb3RhdGUgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvbiAqL1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTE3OWRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0xNzlkZWcpO1xcbiAgfSA1MC4xJSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMTgwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTE4MGRlZyk7XFxuICB9IDc1JSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwcHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0yNzBkZWcpIHNjYWxlKDAuNSk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDBweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTI3MGRlZykgc2NhbGUoMC41KTtcXG4gIH0gMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogcm90YXRlKC0zNjBkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKC0zNjBkZWcpO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YW5kZXJpbmctY3ViZXMuY3NzXG4gKiogbW9kdWxlIGlkID0gODQ3XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd2F2ZS5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhdmUuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YXZlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2F2ZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud2F2ZSB7XFxuICB3aWR0aDogNTBweDtcXG4gIGhlaWdodDogMjdweDtcXG59XFxuXFxuLndhdmUgPiBkaXYge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG4gIGhlaWdodDogMTAwJTtcXG4gIHdpZHRoOiA2cHg7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogc3RyZXRjaGRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IHN0cmV0Y2hkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG4ud2F2ZSAucmVjdDIge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjFzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMS4xcztcXG59XFxuXFxuLndhdmUgLnJlY3QzIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxufVxcblxcbi53YXZlIC5yZWN0NCB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOXM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0wLjlzO1xcbn1cXG5cXG4ud2F2ZSAucmVjdDUge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjhzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMC44cztcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHN0cmV0Y2hkZWxheSB7XFxuICAwJSwgNDAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgwLjQpIH1cXG4gIDIwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgc3RyZXRjaGRlbGF5IHtcXG4gIDAlLCA0MCUsIDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlWSgwLjQpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCk7XFxuICB9IDIwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGVZKDEuMCk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2F2ZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93b3JkcHJlc3MuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93b3JkcHJlc3MuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93b3JkcHJlc3MuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy93b3JkcHJlc3MuY3NzXG4gKiogbW9kdWxlIGlkID0gODUwXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndvcmRwcmVzcyB7XFxuICBiYWNrZ3JvdW5kOiAjMzMzO1xcbiAgd2lkdGg6IDI3cHg7XFxuICBoZWlnaHQ6IDI3cHg7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBib3JkZXItcmFkaXVzOiAyN3B4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgLXdlYmtpdC1hbmltYXRpb246IGlubmVyLWNpcmNsZSAxcyBsaW5lYXIgaW5maW5pdGU7XFxuICBhbmltYXRpb246IGlubmVyLWNpcmNsZSAxcyBsaW5lYXIgaW5maW5pdGU7XFxufVxcblxcbi5pbm5lci1jaXJjbGUge1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICBiYWNrZ3JvdW5kOiAjZmZmO1xcbiAgd2lkdGg6IDhweDtcXG4gIGhlaWdodDogOHB4O1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xcbiAgdG9wOiA1cHg7XFxuICBsZWZ0OiA1cHg7XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBpbm5lci1jaXJjbGUge1xcbiAgMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDApOyB9XFxuICAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyB9XFxufVxcblxcbkBrZXlmcmFtZXMgaW5uZXItY2lyY2xlIHtcXG4gIDAlIHsgdHJhbnNmb3JtOiByb3RhdGUoMCk7IC13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgwKTsgfVxcbiAgMTAwJSB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IC13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpOyB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NTFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHVyZVJlbmRlck1peGluIGZyb20gJ3JlYWN0LWFkZG9ucy1wdXJlLXJlbmRlci1taXhpbic7XG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFB1cmlmeUNvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnNob3VsZENvbXBvbmVudFVwZGF0ZSA9IFB1cmVSZW5kZXJNaXhpbi5zaG91bGRDb21wb25lbnRVcGRhdGUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IG5ld1Byb3BzID0ge307XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5wcm9wcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSAnY29tcG9uZW50Jykge1xuICAgICAgICAgICAgICAgIGlmIChJbW11dGFibGUuSXRlcmFibGUuaXNJdGVyYWJsZSh0aGlzLnByb3BzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Byb3BzW2tleV0gPSB0aGlzLnByb3BzW2tleV0udG9KUygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Byb3BzW2tleV0gPSB0aGlzLnByb3BzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gPHRoaXMucHJvcHMuY29tcG9uZW50IHsuLi5uZXdQcm9wc30gLz47XG4gICAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2hhcmVkL2NvbXBvbmVudHMvUHVyaWZ5Q29tcG9uZW50LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdyZWFjdC9saWIvUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluJyk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3QtYWRkb25zLXB1cmUtcmVuZGVyLW1peGluL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gODUzXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2hhbGxvd0NvbXBhcmUgPSByZXF1aXJlKCcuL3NoYWxsb3dDb21wYXJlJyk7XG5cbi8qKlxuICogSWYgeW91ciBSZWFjdCBjb21wb25lbnQncyByZW5kZXIgZnVuY3Rpb24gaXMgXCJwdXJlXCIsIGUuZy4gaXQgd2lsbCByZW5kZXIgdGhlXG4gKiBzYW1lIHJlc3VsdCBnaXZlbiB0aGUgc2FtZSBwcm9wcyBhbmQgc3RhdGUsIHByb3ZpZGUgdGhpcyBtaXhpbiBmb3IgYVxuICogY29uc2lkZXJhYmxlIHBlcmZvcm1hbmNlIGJvb3N0LlxuICpcbiAqIE1vc3QgUmVhY3QgY29tcG9uZW50cyBoYXZlIHB1cmUgcmVuZGVyIGZ1bmN0aW9ucy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgdmFyIFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbiA9XG4gKiAgICAgcmVxdWlyZSgnUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluJyk7XG4gKiAgIFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAqICAgICBtaXhpbnM6IFtSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW5dLFxuICpcbiAqICAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICogICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXt0aGlzLnByb3BzLmNsYXNzTmFtZX0+Zm9vPC9kaXY+O1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogTm90ZTogVGhpcyBvbmx5IGNoZWNrcyBzaGFsbG93IGVxdWFsaXR5IGZvciBwcm9wcyBhbmQgc3RhdGUuIElmIHRoZXNlIGNvbnRhaW5cbiAqIGNvbXBsZXggZGF0YSBzdHJ1Y3R1cmVzIHRoaXMgbWl4aW4gbWF5IGhhdmUgZmFsc2UtbmVnYXRpdmVzIGZvciBkZWVwZXJcbiAqIGRpZmZlcmVuY2VzLiBPbmx5IG1peGluIHRvIGNvbXBvbmVudHMgd2hpY2ggaGF2ZSBzaW1wbGUgcHJvcHMgYW5kIHN0YXRlLCBvclxuICogdXNlIGBmb3JjZVVwZGF0ZSgpYCB3aGVuIHlvdSBrbm93IGRlZXAgZGF0YSBzdHJ1Y3R1cmVzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy9wdXJlLXJlbmRlci1taXhpbi5odG1sXG4gKi9cbnZhciBSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4gPSB7XG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgcmV0dXJuIHNoYWxsb3dDb21wYXJlKHRoaXMsIG5leHRQcm9wcywgbmV4dFN0YXRlKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW47XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3QvbGliL1JlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbi5qc1xuICoqIG1vZHVsZSBpZCA9IDg1NFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuKiBAcHJvdmlkZXNNb2R1bGUgc2hhbGxvd0NvbXBhcmVcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHNoYWxsb3dFcXVhbCA9IHJlcXVpcmUoJ2ZianMvbGliL3NoYWxsb3dFcXVhbCcpO1xuXG4vKipcbiAqIERvZXMgYSBzaGFsbG93IGNvbXBhcmlzb24gZm9yIHByb3BzIGFuZCBzdGF0ZS5cbiAqIFNlZSBSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW5cbiAqIFNlZSBhbHNvIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3Mvc2hhbGxvdy1jb21wYXJlLmh0bWxcbiAqL1xuZnVuY3Rpb24gc2hhbGxvd0NvbXBhcmUoaW5zdGFuY2UsIG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gIHJldHVybiAhc2hhbGxvd0VxdWFsKGluc3RhbmNlLnByb3BzLCBuZXh0UHJvcHMpIHx8ICFzaGFsbG93RXF1YWwoaW5zdGFuY2Uuc3RhdGUsIG5leHRTdGF0ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhbGxvd0NvbXBhcmU7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3QvbGliL3NoYWxsb3dDb21wYXJlLmpzXG4gKiogbW9kdWxlIGlkID0gODU1XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIGFzIFQgfSBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuaW1wb3J0IHtUYWJsZSwgQ29sdW1uLCBDZWxsfSBmcm9tICdmaXhlZC1kYXRhLXRhYmxlJztcblxuaW1wb3J0IEVuaGFuY2VkRml4ZWREYXRhVGFibGUgZnJvbSAnc2hhcmVkL2NvbXBvbmVudHMvZW5oYW5jZWRGaXhlZERhdGFUYWJsZS9FbmhhbmNlZEZpeGVkRGF0YVRhYmxlJztcblxuaW1wb3J0IGNvdmVydFNhbXBsZURhdGEgZnJvbSAnLi9saWIvY29udmVydFNhbXBsZXNEYXRhJztcblxuZXhwb3J0IGNsYXNzIENsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBteVRhYmxlRGF0YTogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ1J5bGFuJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0FtZWxpYScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdFc3RldmFuJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0Zsb3JlbmNlJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ1RyZXNzYScgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gY292ZXJ0U2FtcGxlRGF0YSh0aGlzLnByb3BzLmRhdGEudG9BcnJheSgpKTtcblxuICAgICAgICBjb25zdCBjZWxscyA9IFtdO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKGRhdGEuaXRlbXMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGRhdGEuaXRlbXNba2V5XTtcblxuICAgICAgICAgICAgZGF0YS5jb2x1bW5zLmZvckVhY2goKGNvbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2wuaWQgaW4gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHsgYXR0cl9uYW1lOiBrZXksIGF0dHJfaWQ6IGNvbC5pZCwgYXR0cl92YWw6IGl0ZW1bY29sLmlkXSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHsgYXR0cl9uYW1lOiBrZXksIGF0dHJfaWQ6IGNvbC5pZCwgYXR0cl92YWw6ICdOL0EnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkID0ge1xuICAgICAgICAgICAgYXR0cmlidXRlczogZGF0YS5jb2x1bW5zLm1hcCgoY29sKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXR0cl9pZDogY29sLmlkLCBkYXRhdHlwZTogJ1NUUklORycsIGRpc3BsYXlfbmFtZTogY29sLmlkIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGRhdGE6IGNlbGxzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGQuYXR0cmlidXRlcy51bnNoaWZ0KHsgYXR0cl9pZDogJ2F0dHJfbmFtZScsIGRhdGF0eXBlOiAnU1RSSU5HJywgZGlzcGxheV9uYW1lOiAnQXR0cmlidXRlJyB9KTtcblxuICAgICAgICByZXR1cm4gPEVuaGFuY2VkRml4ZWREYXRhVGFibGUgaW5wdXQ9e2R9IGdyb3VwSGVhZGVyPXtmYWxzZX0gZmlsdGVyPVwiR0xPQkFMXCIgcm93SGVpZ2h0PXszM30gaGVhZGVySGVpZ2h0PXszM30gZG93bmxvYWQ9XCJBTExcIiB1bmlxdWVJZD1cImF0dHJfbmFtZVwiIHRhYmxlV2lkdGg9ezExOTB9IGF1dG9Db2x1bW5XaWR0aD17dHJ1ZX0gLz47XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDbGluaWNhbEluZm9ybWF0aW9uU2FtcGxlc1RhYmxlO1xuXG5cbkNsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUucHJvcFR5cGVzID0ge1xuICAgIGRhdGE6IFQuYW55LmlzUmVxdWlyZWQsXG59O1xuXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzLmpzeFxuICoqLyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0geyBjb2x1bW5zOiBbXSwgaXRlbXM6IHt9IH07XG5cbiAgICBkYXRhLmZvckVhY2goKHNhbXBsZSkgPT4ge1xuICAgICAgICBjb25zdCBzYW1wbGVJZCA9IHNhbXBsZS5pZDtcblxuICAgICAgICBvdXRwdXQuY29sdW1ucy5wdXNoKHsgaWQ6IHNhbXBsZUlkIH0pO1xuXG4gICAgICAgIHNhbXBsZS5jbGluaWNhbERhdGEuZm9yRWFjaCgoZGF0YUl0ZW0pID0+IHtcbiAgICAgICAgICAgIG91dHB1dC5pdGVtc1tkYXRhSXRlbS5pZF0gPSBvdXRwdXQuaXRlbXNbZGF0YUl0ZW0uaWRdIHx8IHt9O1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXVtzYW1wbGVJZF0gPSBkYXRhSXRlbS52YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXS5uYW1lID0gZGF0YUl0ZW0ubmFtZTtcbiAgICAgICAgICAgIG91dHB1dC5pdGVtc1tkYXRhSXRlbS5pZF0uaWQgPSBkYXRhSXRlbS5pZDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9saWIvY29udmVydFNhbXBsZXNEYXRhLmpzXG4gKiovIiwiaW1wb3J0IHtMaXN0fSBmcm9tIFwiaW1tdXRhYmxlXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge0J1dHRvbiwgT3ZlcmxheVRyaWdnZXIsIFBvcG92ZXJ9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgU2FtcGxlSW5saW5lIGZyb20gJy4vU2FtcGxlSW5saW5lJztcbmltcG9ydCBUb29sdGlwVGFibGUgZnJvbSAnLi4vY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlJztcbmltcG9ydCAqIGFzIEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IFNwaW5uZXIgZnJvbSAncmVhY3Qtc3BpbmtpdCc7XG5pbXBvcnQgT3JkZXJlZE1hcCA9IEltbXV0YWJsZS5PcmRlcmVkTWFwO1xuXG50eXBlIFRPRE8gPSBhbnk7XG5cbnR5cGUgU2FtcGxlID0ge2NsaW5pY2FsRGF0YTpUT0RPfTtcblxuZXhwb3J0IGludGVyZmFjZSBQYXRpZW50SGVhZGVyUHJvcHNcbntcbiAgICBzYW1wbGVzOkxpc3Q8U2FtcGxlPjtcbiAgICBzdGF0dXM6J2ZldGNoaW5nJ3wnY29tcGxldGUnfCdlcnJvcic7XG4gICAgcGF0aWVudDpUT0RPO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRpZW50SGVhZGVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFBhdGllbnRIZWFkZXJQcm9wcywge30+XG57XG4gICAgZ2V0UG9wb3ZlcihzYW1wbGU6U2FtcGxlLCBudW1iZXI6bnVtYmVyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxQb3BvdmVyIGtleT17bnVtYmVyfSBpZD17J3BvcG92ZXItc2FtcGxlLScgKyBudW1iZXJ9PlxuICAgICAgICAgICAgICAgIDxUb29sdGlwVGFibGUgZGF0YT17SW1tdXRhYmxlLmZyb21KUyhzYW1wbGUuY2xpbmljYWxEYXRhKX0gLz5cbiAgICAgICAgICAgIDwvUG9wb3Zlcj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBkcmF3SGVhZGVyKClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNhbXBsZXMgJiYgdGhpcy5wcm9wcy5zYW1wbGVzLnNpemUgPiAwKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLnNhbXBsZXMubWFwKChzYW1wbGU6U2FtcGxlLCBudW1iZXI6bnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBjbGluaWNhbERhdGEgPSB0aGlzLnByb3BzLnNhbXBsZXMuZ2V0KCdpdGVtcycpLmtleXMoKS5tYXAoYXR0cl9pZCA9PiB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgcmV0dXJuIE9iamVjdCh7J2lkJzogeCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IHRoaXMucHJvcHMuc2FtcGxlcy5nZXQoJ2l0ZW1zJykuZ2V0KGF0dHJfaWQpLmdldCgnVENHQS1QNi1BNU9ILTAxJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIH0pIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy99KS5maWx0ZXIoeCA9PiB4LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNhbXBsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPE92ZXJsYXlUcmlnZ2VyIGRlbGF5SGlkZT17MTAwfSBrZXk9e251bWJlcn0gdHJpZ2dlcj17Wydob3ZlcicsICdmb2N1cyddfSBwbGFjZW1lbnQ9XCJib3R0b21cIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxheT17dGhpcy5nZXRQb3BvdmVyKHNhbXBsZSwgbnVtYmVyKzEpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U2FtcGxlSW5saW5lIHNhbXBsZT17c2FtcGxlfSBudW1iZXI9e251bWJlcisxfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9PdmVybGF5VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKVxuICAgIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLnByb3BzLnN0YXR1cylcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSAnZmV0Y2hpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PjxTcGlubmVyIHNwaW5uZXJOYW1lPVwidGhyZWUtYm91bmNlXCIgLz48L2Rpdj47XG5cbiAgICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kcmF3SGVhZGVyKCk7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj5UaGVyZSB3YXMgYW4gZXJyb3IuPC9kaXY+O1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2IC8+O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyLnRzeFxuICoqLyIsImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7QnV0dG9uLCBPdmVybGF5VHJpZ2dlciwgUG9wb3Zlcn0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IFNhbXBsZUxhYmVsSFRNTCB9IGZyb20gJy4uL1NhbXBsZUxhYmVsJztcblxudHlwZSBUT0RPID0gYW55O1xuXG5pbnRlcmZhY2UgU2FtcGxlSW5saW5lUHJvcHNcbntcbiAgICBzYW1wbGU6IFRPRE87XG4gICAgbnVtYmVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNhbXBsZUlubGluZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxTYW1wbGVJbmxpbmVQcm9wcywge30+XG57XG4gICAgcmVuZGVyKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHsgc2FtcGxlLCBudW1iZXIgfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c3BhbiBzdHlsZT17e1wicGFkZGluZ1JpZ2h0XCI6XCIxMHB4XCJ9fT5cbiAgICAgICAgICAgICAgICA8U2FtcGxlTGFiZWxIVE1MIGNvbG9yPXsnYmxhY2snfSBsYWJlbD17KG51bWJlcikudG9TdHJpbmcoKX0gLz5cbiAgICAgICAgICAgICAgICB7JyAnICsgc2FtcGxlLmlkfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvU2FtcGxlSW5saW5lLnRzeFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzPyFzYXNzIXNhc3MtcmVzb3VyY2VzIS4vbG9jYWwtc3R5bGVzLnNjc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzPyFzYXNzIXNhc3MtcmVzb3VyY2VzIS4vbG9jYWwtc3R5bGVzLnNjc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/IXNhc3Mhc2Fzcy1yZXNvdXJjZXMhLi9sb2NhbC1zdHlsZXMuc2Nzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzXG4gKiogbW9kdWxlIGlkID0gOTIxXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIiNjb250ZW50IGg0IHtcXG4gIG1hcmdpbi1ib3R0b206IDUwcHggIWltcG9ydGFudDsgfVxcbiAgI2NvbnRlbnQgaDQ6bnRoLWNoaWxkKG4rMikge1xcbiAgICBtYXJnaW4tdG9wOiAyMHB4OyB9XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlcj8hLi9+L3Nhc3MtbG9hZGVyIS4vfi9zYXNzLXJlc291cmNlcy1sb2FkZXIvbGliL2xvYWRlci5qcyEuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzXG4gKiogbW9kdWxlIGlkID0gOTIyXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9