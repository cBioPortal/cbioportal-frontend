webpackJsonp([1],{

/***/ 761:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
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
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _reactBootstrap = __webpack_require__(762);
	
	var _ClinicalInformationContainer = __webpack_require__(1015);
	
	var _ClinicalInformationContainer2 = _interopRequireDefault(_ClinicalInformationContainer);
	
	var _PatientHeader = __webpack_require__(1107);
	
	var _PatientHeader2 = _interopRequireDefault(_PatientHeader);
	
	var _reactRedux = __webpack_require__(393);
	
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
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/PatientViewPage.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/PatientViewPage.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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
	            var mapStateToProps = function mapStateToProps(state) {
	                return {
	                    samples: state.get('clinicalInformation').get('samples'),
	                    status: state.get('clinicalInformation').get('status'),
	                    patient: state.get('clinicalInformation').get('patient')
	                };
	            };
	
	            var PatientHeader = (0, _reactRedux.connect)(mapStateToProps)(_PatientHeader2.default);
	
	            _reactDom2.default.render(_react3.default.createElement(PatientHeader, { store: this.props.store }), document.getElementById("clinical_div"));
	            //ReactDOM.render(<div><Example /><Example /></div>, document.getElementById("clinical_div"));
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            return _react3.default.createElement(_ClinicalInformationContainer2.default, null);
	        }
	    }]);
	
	    return PatientViewPage;
	}(_react3.default.Component));
	
	exports.default = PatientViewPage;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 1015:
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
	
	var _ClinicalInformationPatientTable = __webpack_require__(1016);
	
	var _ClinicalInformationPatientTable2 = _interopRequireDefault(_ClinicalInformationPatientTable);
	
	var _PDXTree = __webpack_require__(750);
	
	var _PDXTree2 = _interopRequireDefault(_PDXTree);
	
	var _reactSpinkit = __webpack_require__(1017);
	
	var _reactSpinkit2 = _interopRequireDefault(_reactSpinkit);
	
	var _duck = __webpack_require__(744);
	
	var _PurifyComponent = __webpack_require__(1040);
	
	var _PurifyComponent2 = _interopRequireDefault(_PurifyComponent);
	
	var _reactRedux = __webpack_require__(393);
	
	var _ClinicalInformationSamples = __webpack_require__(1044);
	
	var _ClinicalInformationSamples2 = _interopRequireDefault(_ClinicalInformationSamples);
	
	var _PatientHeader = __webpack_require__(1107);
	
	var _PatientHeader2 = _interopRequireDefault(_PatientHeader);
	
	__webpack_require__(1109);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    ClinicalInformationContainerUnconnected: {
	        displayName: 'ClinicalInformationContainerUnconnected'
	    }
	};
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationContainer.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationContainer.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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
	                    'Samples'
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

/***/ 1016:
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
	
	var _reactBootstrap = __webpack_require__(762);
	
	var _immutable = __webpack_require__(739);
	
	var _immutable2 = _interopRequireDefault(_immutable);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    ClinicalInformationPatientTable: {
	        displayName: 'ClinicalInformationPatientTable'
	    }
	};
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationPatientTable.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationPatientTable.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var ClinicalInformationPatientTable = _wrapComponent('ClinicalInformationPatientTable')(function (_React$Component) {
	    _inherits(ClinicalInformationPatientTable, _React$Component);
	
	    function ClinicalInformationPatientTable() {
	        _classCallCheck(this, ClinicalInformationPatientTable);
	
	        return _possibleConstructorReturn(this, (ClinicalInformationPatientTable.__proto__ || Object.getPrototypeOf(ClinicalInformationPatientTable)).apply(this, arguments));
	    }
	
	    _createClass(ClinicalInformationPatientTable, [{
	        key: 'componentDidMount',
	        value: function componentDidMount() {}
	    }, {
	        key: 'shouldComponentUpdate',
	        value: function shouldComponentUpdate(nextProps, nextState) {
	            return nextProps === this.props;
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            var rows = [];
	
	            ;
	            this.props.data.forEach(function (item) {
	                rows.push(_react3.default.createElement(
	                    'tr',
	                    { key: item.get('id') },
	                    _react3.default.createElement(
	                        'td',
	                        null,
	                        item.get('id')
	                    ),
	                    _react3.default.createElement(
	                        'td',
	                        null,
	                        item.get('value')
	                    )
	                ));
	            });
	
	            return _react3.default.createElement(
	                _reactBootstrap.Table,
	                { striped: true },
	                _react3.default.createElement(
	                    'thead',
	                    null,
	                    _react3.default.createElement(
	                        'tr',
	                        null,
	                        _react3.default.createElement(
	                            'th',
	                            null,
	                            'Attribute'
	                        ),
	                        _react3.default.createElement(
	                            'th',
	                            null,
	                            'Value'
	                        )
	                    )
	                ),
	                _react3.default.createElement(
	                    'tbody',
	                    null,
	                    rows
	                )
	            );
	            // const headerCells = this.props.data.get('columns').map((col)=>{
	            //     return <th>{col.get('id')}</th>
	            // });
	            //
	            // const rows = this.props.data.get('items').map((row, key) => {
	            //     return (<tr key={key}>
	            //             <th>{row.get('name')}</th>
	            //             {
	            //                 this.props.data.get('columns').map((col)=> {
	            //                     if(col.get('id') in row.toJS()) {
	            //                         return <td>{row.get(col.get('id'))}</td>
	            //                     } else {
	            //                         return <td>N/A</td>
	            //                     }
	            //
	            //                 })
	            //             }
	            //
	            //         </tr>
	            //     );
	            // });
	            //
	            // return (
	            //     <Table striped>
	            //         <thead><tr>
	            //             <th></th>
	            //             { headerCells }
	            //         </tr></thead>
	            //         <tbody>{ rows }</tbody>
	            //     </Table>
	            // );
	        }
	    }]);
	
	    return ClinicalInformationPatientTable;
	}(_react3.default.Component));
	
	exports.default = ClinicalInformationPatientTable;
	
	
	ClinicalInformationPatientTable.propTypes = {
	    data: _react2.PropTypes.any.isRequired
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 1017:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(849);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _objectAssign = __webpack_require__(17);
	
	var _objectAssign2 = _interopRequireDefault(_objectAssign);
	
	__webpack_require__(1018);
	
	__webpack_require__(1020);
	
	__webpack_require__(1022);
	
	__webpack_require__(1024);
	
	__webpack_require__(1026);
	
	__webpack_require__(1028);
	
	__webpack_require__(1030);
	
	__webpack_require__(1032);
	
	__webpack_require__(1034);
	
	__webpack_require__(1036);
	
	__webpack_require__(1038);
	
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

/***/ 1018:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1019);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1019:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, "@-webkit-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@-moz-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@-ms-keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n@keyframes fade-in {\n  0% {\n      opacity: 0;\n  }\n  50% {\n      opacity: 0;\n  }\n  100% {\n      opacity: 1;\n  }\n}\n\n.fade-in {\n  -webkit-animation: fade-in 2s;\n  -moz-animation: fade-in 2s;\n  -o-animation: fade-in 2s;\n  -ms-animation: fade-in 2s;\n}\n", ""]);
	
	// exports


/***/ },

/***/ 1020:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1021);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1021:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".chasing-dots {\n  width: 27px;\n  height: 27px;\n  position: relative;\n\n  -webkit-animation: rotate 2.0s infinite linear;\n  animation: rotate 2.0s infinite linear;\n}\n\n.dot1, .dot2 {\n  width: 60%;\n  height: 60%;\n  display: inline-block;\n  position: absolute;\n  top: 0;\n  background-color: #333;\n  border-radius: 100%;\n\n  -webkit-animation: bounce 2.0s infinite ease-in-out;\n  animation: bounce 2.0s infinite ease-in-out;\n}\n\n.dot2 {\n  top: auto;\n  bottom: 0px;\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n@-webkit-keyframes rotate { 100% { -webkit-transform: rotate(360deg) }}\n@keyframes rotate {\n  100% {\n    transform: rotate(360deg);\n    -webkit-transform: rotate(360deg);\n  }\n}\n\n@-webkit-keyframes bounce {\n  0%, 100% { -webkit-transform: scale(0.0) }\n  50% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bounce {\n  0%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 50% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1022:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1023);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1023:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".circle-wrapper {\n  width: 22px;\n  height: 22px;\n  position: relative;\n}\n\n.circle {\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  left: 0;\n  top: 0;\n}\n\n.circle:before {\n  content: '';\n  display: block;\n  margin: 0 auto;\n  width: 20%;\n  height: 20%;\n  background-color: #333;\n\n  border-radius: 100%;\n  -webkit-animation: bouncedelay 1.2s infinite ease-in-out;\n  animation: bouncedelay 1.2s infinite ease-in-out;\n  /* Prevent first frame from flickering when animation starts */\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both;\n}\n\n.circle2  { -webkit-transform: rotate(30deg);  transform: rotate(30deg)  }\n.circle3  { -webkit-transform: rotate(60deg);  transform: rotate(60deg)  }\n.circle4  { -webkit-transform: rotate(90deg);  transform: rotate(90deg)  }\n.circle5  { -webkit-transform: rotate(120deg); transform: rotate(120deg) }\n.circle6  { -webkit-transform: rotate(150deg); transform: rotate(150deg) }\n.circle7  { -webkit-transform: rotate(180deg); transform: rotate(180deg) }\n.circle8  { -webkit-transform: rotate(210deg); transform: rotate(210deg) }\n.circle9  { -webkit-transform: rotate(240deg); transform: rotate(240deg) }\n.circle10 { -webkit-transform: rotate(270deg); transform: rotate(270deg) }\n.circle11 { -webkit-transform: rotate(300deg); transform: rotate(300deg) }\n.circle12 { -webkit-transform: rotate(330deg); transform: rotate(330deg) }\n\n.circle2:before  { -webkit-animation-delay: -1.1s; animation-delay: -1.1s }\n.circle3:before  { -webkit-animation-delay: -1.0s; animation-delay: -1.0s }\n.circle4:before  { -webkit-animation-delay: -0.9s; animation-delay: -0.9s }\n.circle5:before  { -webkit-animation-delay: -0.8s; animation-delay: -0.8s }\n.circle6:before  { -webkit-animation-delay: -0.7s; animation-delay: -0.7s }\n.circle7:before  { -webkit-animation-delay: -0.6s; animation-delay: -0.6s }\n.circle8:before  { -webkit-animation-delay: -0.5s; animation-delay: -0.5s }\n.circle9:before  { -webkit-animation-delay: -0.4s; animation-delay: -0.4s }\n.circle10:before { -webkit-animation-delay: -0.3s; animation-delay: -0.3s }\n.circle11:before { -webkit-animation-delay: -0.2s; animation-delay: -0.2s }\n.circle12:before { -webkit-animation-delay: -0.1s; animation-delay: -0.1s }\n\n@-webkit-keyframes bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0.0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bouncedelay {\n  0%, 80%, 100% {\n    -webkit-transform: scale(0.0);\n    transform: scale(0.0);\n  } 40% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1024:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1025);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1025:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".cube-grid {\n  width:27px;\n  height:27px;\n}\n\n.cube {\n  width:33%;\n  height:33%;\n  background:#333;\n  float:left;\n  -webkit-animation: scaleDelay 1.3s infinite ease-in-out;\n  animation: scaleDelay 1.3s infinite ease-in-out;\n}\n\n/*\n * Spinner positions\n * 1 2 3\n * 4 5 6\n * 7 8 9\n */\n\n.spinner .cube:nth-child(1) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n.spinner .cube:nth-child(2) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s  }\n.spinner .cube:nth-child(3) { -webkit-animation-delay: 0.4s; animation-delay: 0.4s  }\n.spinner .cube:nth-child(4) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s  }\n.spinner .cube:nth-child(5) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n.spinner .cube:nth-child(6) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s  }\n.spinner .cube:nth-child(7) { -webkit-animation-delay: 0.0s; animation-delay: 0.0s  }\n.spinner .cube:nth-child(8) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s  }\n.spinner .cube:nth-child(9) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s  }\n\n@-webkit-keyframes scaleDelay {\n  0%, 70%, 100% { -webkit-transform:scale3D(1.0, 1.0, 1.0) }\n  35%           { -webkit-transform:scale3D(0.0, 0.0, 1.0) }\n}\n\n@keyframes scaleDelay {\n  0%, 70%, 100% { -webkit-transform:scale3D(1.0, 1.0, 1.0); transform:scale3D(1.0, 1.0, 1.0) }\n  35%           { -webkit-transform:scale3D(1.0, 1.0, 1.0); transform:scale3D(0.0, 0.0, 1.0) }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1026:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1027);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1027:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".double-bounce {\n  width: 27px;\n  height: 27px;\n\n  position: relative;\n}\n\n.double-bounce1, .double-bounce2 {\n  width: 100%;\n  height: 100%;\n  border-radius: 50%;\n  background-color: #333;\n  opacity: 0.6;\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  -webkit-animation: bounce 2.0s infinite ease-in-out;\n  animation: bounce 2.0s infinite ease-in-out;\n}\n\n.double-bounce2 {\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n@-webkit-keyframes bounce {\n  0%, 100% { -webkit-transform: scale(0.0) }\n  50% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bounce {\n  0%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 50% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1028:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1029);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1029:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".pulse {\n  width: 27px;\n  height: 27px;\n  background-color: #333;\n\n  border-radius: 100%;\n  -webkit-animation: scaleout 1.0s infinite ease-in-out;\n  animation: scaleout 1.0s infinite ease-in-out;\n}\n\n@-webkit-keyframes scaleout {\n  0% { -webkit-transform: scale(0.0) }\n  100% {\n    -webkit-transform: scale(1.0);\n    opacity: 0;\n  }\n}\n\n@keyframes scaleout {\n  0% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 100% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n    opacity: 0;\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1030:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1031);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1031:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".rotating-plane {\n  width: 27px;\n  height: 27px;\n  background-color: #333;\n\n  -webkit-animation: rotateplane 1.2s infinite ease-in-out;\n  animation: rotateplane 1.2s infinite ease-in-out;\n}\n\n@-webkit-keyframes rotateplane {\n  0% { -webkit-transform: perspective(120px) }\n  50% { -webkit-transform: perspective(120px) rotateY(180deg) }\n  100% { -webkit-transform: perspective(120px) rotateY(180deg)  rotateX(180deg) }\n}\n\n@keyframes rotateplane {\n  0% {\n    transform: perspective(120px) rotateX(0deg) rotateY(0deg);\n    -webkit-transform: perspective(120px) rotateX(0deg) rotateY(0deg);\n  } 50% {\n    transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);\n    -webkit-transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);\n  } 100% {\n    transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);\n    -webkit-transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1032:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1033);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1033:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".three-bounce > div {\n  width: 18px;\n  height: 18px;\n  background-color: #333;\n\n  border-radius: 100%;\n  display: inline-block;\n  -webkit-animation: bouncedelay 1.4s infinite ease-in-out;\n  animation: bouncedelay 1.4s infinite ease-in-out;\n  /* Prevent first frame from flickering when animation starts */\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both;\n}\n\n.three-bounce .bounce1 {\n  -webkit-animation-delay: -0.32s;\n  animation-delay: -0.32s;\n}\n\n.three-bounce .bounce2 {\n  -webkit-animation-delay: -0.16s;\n  animation-delay: -0.16s;\n}\n\n@-webkit-keyframes bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0.0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes bouncedelay {\n  0%, 80%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 40% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n", ""]);
	
	// exports


/***/ },

/***/ 1034:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1035);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1035:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".wandering-cubes {\n  width: 27px;\n  height: 27px;\n  position: relative;\n}\n\n.cube1, .cube2 {\n  background-color: #333;\n  width: 10px;\n  height: 10px;\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  -webkit-animation: cubemove 1.8s infinite ease-in-out;\n  animation: cubemove 1.8s infinite ease-in-out;\n}\n\n.cube2 {\n  -webkit-animation-delay: -0.9s;\n  animation-delay: -0.9s;\n}\n\n@-webkit-keyframes cubemove {\n  25% { -webkit-transform: translateX(22px) rotate(-90deg) scale(0.5) }\n  50% { -webkit-transform: translateX(22px) translateY(22px) rotate(-180deg) }\n  75% { -webkit-transform: translateX(0px) translateY(22px) rotate(-270deg) scale(0.5) }\n  100% { -webkit-transform: rotate(-360deg) }\n}\n\n@keyframes cubemove {\n  25% { \n    transform: translateX(42px) rotate(-90deg) scale(0.5);\n    -webkit-transform: translateX(42px) rotate(-90deg) scale(0.5);\n  } 50% {\n    /* Hack to make FF rotate in the right direction */\n    transform: translateX(42px) translateY(42px) rotate(-179deg);\n    -webkit-transform: translateX(42px) translateY(42px) rotate(-179deg);\n  } 50.1% {\n    transform: translateX(42px) translateY(42px) rotate(-180deg);\n    -webkit-transform: translateX(42px) translateY(42px) rotate(-180deg);\n  } 75% {\n    transform: translateX(0px) translateY(42px) rotate(-270deg) scale(0.5);\n    -webkit-transform: translateX(0px) translateY(42px) rotate(-270deg) scale(0.5);\n  } 100% {\n    transform: rotate(-360deg);\n    -webkit-transform: rotate(-360deg);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1036:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1037);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1037:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".wave {\n  width: 50px;\n  height: 27px;\n}\n\n.wave > div {\n  background-color: #333;\n  height: 100%;\n  width: 6px;\n  display: inline-block;\n\n  -webkit-animation: stretchdelay 1.2s infinite ease-in-out;\n  animation: stretchdelay 1.2s infinite ease-in-out;\n}\n\n.wave .rect2 {\n  -webkit-animation-delay: -1.1s;\n  animation-delay: -1.1s;\n}\n\n.wave .rect3 {\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n.wave .rect4 {\n  -webkit-animation-delay: -0.9s;\n  animation-delay: -0.9s;\n}\n\n.wave .rect5 {\n  -webkit-animation-delay: -0.8s;\n  animation-delay: -0.8s;\n}\n\n@-webkit-keyframes stretchdelay {\n  0%, 40%, 100% { -webkit-transform: scaleY(0.4) }\n  20% { -webkit-transform: scaleY(1.0) }\n}\n\n@keyframes stretchdelay {\n  0%, 40%, 100% {\n    transform: scaleY(0.4);\n    -webkit-transform: scaleY(0.4);\n  } 20% {\n    transform: scaleY(1.0);\n    -webkit-transform: scaleY(1.0);\n  }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1038:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1039);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1039:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, ".wordpress {\n  background: #333;\n  width: 27px;\n  height: 27px;\n  display: inline-block;\n  border-radius: 27px;\n  position: relative;\n  -webkit-animation: inner-circle 1s linear infinite;\n  animation: inner-circle 1s linear infinite;\n}\n\n.inner-circle {\n  display: block;\n  background: #fff;\n  width: 8px;\n  height: 8px;\n  position: absolute;\n  border-radius: 8px;\n  top: 5px;\n  left: 5px;\n}\n\n@-webkit-keyframes inner-circle {\n  0% { -webkit-transform: rotate(0); }\n  100% { -webkit-transform: rotate(360deg); }\n}\n\n@keyframes inner-circle {\n  0% { transform: rotate(0); -webkit-transform:rotate(0); }\n  100% { transform: rotate(360deg); -webkit-transform:rotate(360deg); }\n}\n\n", ""]);
	
	// exports


/***/ },

/***/ 1040:
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
	
	var _reactAddonsPureRenderMixin = __webpack_require__(1041);
	
	var _reactAddonsPureRenderMixin2 = _interopRequireDefault(_reactAddonsPureRenderMixin);
	
	var _immutable = __webpack_require__(739);
	
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
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/shared/components/PurifyComponent.js',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/shared/components/PurifyComponent.js',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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

/***/ 1041:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1042);

/***/ },

/***/ 1042:
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
	
	var shallowCompare = __webpack_require__(1043);
	
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

/***/ 1043:
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

/***/ 1044:
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
	
	var _immutable = __webpack_require__(739);
	
	var _immutable2 = _interopRequireDefault(_immutable);
	
	var _fixedDataTable = __webpack_require__(1045);
	
	var _EnhancedFixedDataTable = __webpack_require__(1095);
	
	var _EnhancedFixedDataTable2 = _interopRequireDefault(_EnhancedFixedDataTable);
	
	var _convertSamplesData = __webpack_require__(1106);
	
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
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationSamples.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/clinicalInformation/ClinicalInformationSamples.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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

/***/ 1106:
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

/***/ 1107:
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
	
	var _reactBootstrap = __webpack_require__(762);
	
	var _SampleInline = __webpack_require__(1108);
	
	var _SampleInline2 = _interopRequireDefault(_SampleInline);
	
	var _ClinicalInformationPatientTable = __webpack_require__(1016);
	
	var _ClinicalInformationPatientTable2 = _interopRequireDefault(_ClinicalInformationPatientTable);
	
	var _immutable = __webpack_require__(739);
	
	var _immutable2 = _interopRequireDefault(_immutable);
	
	var _reactSpinkit = __webpack_require__(1017);
	
	var _reactSpinkit2 = _interopRequireDefault(_reactSpinkit);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    PatientHeader: {
	        displayName: 'PatientHeader'
	    }
	};
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/patientHeader/PatientHeader.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/patientHeader/PatientHeader.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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
	            return _react3.default.createElement(
	                _reactBootstrap.Popover,
	                { key: number, id: 'popover-sample-' + number },
	                _react3.default.createElement(_ClinicalInformationPatientTable2.default, { data: _immutable2.default.fromJS(sample.clinicalData) })
	            );
	        }
	    }, {
	        key: 'drawHeader',
	        value: function drawHeader() {
	            var _this2 = this;
	
	            if (this.props.samples && this.props.samples.size > 0) {
	                return _react3.default.createElement(
	                    'div',
	                    null,
	                    this.props.samples.map(function (sample, number) {
	                        //let clinicalData = this.props.samples.get('items').keys().map(attr_id => { 
	                        //    return Object({'id': x, 
	                        //                  'value': this.props.samples.get('items').get(attr_id).get('TCGA-P6-A5OH-01')
	                        //    }) 
	                        //}).filter(x => x.value);
	                        console.log(sample);
	
	                        return _react3.default.createElement(
	                            _reactBootstrap.OverlayTrigger,
	                            { delayHide: 100, key: number, trigger: ['hover', 'focus'], placement: 'bottom',
	                                overlay: _this2.getPopover(sample, number + 1) },
	                            _react3.default.createElement(
	                                'span',
	                                null,
	                                _react3.default.createElement(_SampleInline2.default, { sample: sample, number: number + 1 })
	                            )
	                        );
	                    })
	                );
	            } else {
	                return _react3.default.createElement(
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
	
	                    return _react3.default.createElement(
	                        'div',
	                        null,
	                        _react3.default.createElement(_reactSpinkit2.default, { spinnerName: 'three-bounce' })
	                    );
	
	                case 'complete':
	
	                    return this.drawHeader();
	
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
	
	    return PatientHeader;
	}(_react3.default.Component));
	
	exports.default = PatientHeader;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 1108:
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
	
	var _reactBootstrap = __webpack_require__(762);
	
	var _SampleLabel = __webpack_require__(751);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _components = {
	    SampleInline: {
	        displayName: 'SampleInline'
	    }
	};
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/patientHeader/SampleInline.jsx',
	    components: _components,
	    locals: [module],
	    imports: [_react3.default]
	});
	
	var _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: 'C:/cbioportal-frontend/src/pages/patientView/patientHeader/SampleInline.jsx',
	    components: _components,
	    locals: [],
	    imports: [_react3.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformHmrLibIndexJs2(_CCbioportalFrontendNode_modulesBabelPresetReactHmreNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
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
	
	
	            return _react3.default.createElement(
	                'span',
	                { style: { "paddingRight": "10px" } },
	                _react3.default.createElement(_SampleLabel.SampleLabelHTML, { color: 'black', label: number.toString() }),
	                ' ' + sample.id
	            );
	        }
	    }]);
	
	    return SampleInline;
	}(_react3.default.Component));
	
	exports.default = SampleInline;
	
	SampleInline.propTypes = {
	    sample: _react3.default.PropTypes.object.isRequired,
	    number: _react3.default.PropTypes.number.isRequired
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 1109:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(1110);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(759)(content, {});
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

/***/ 1110:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(758)();
	// imports
	
	
	// module
	exports.push([module.id, "#content h4 {\n  margin-bottom: 15px !important; }\n  #content h4:nth-child(n+2) {\n    margin-top: 20px; }\n", ""]);
	
	// exports


/***/ }

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvUGF0aWVudFZpZXdQYWdlLmpzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlLmpzeCIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvZGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzPzZjZjQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9mYWRlLWluLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3M/ODRkZSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzPzcwNDgiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcz9lNjUzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2RvdWJsZS1ib3VuY2UuY3NzPzU0MTQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9kb3VibGUtYm91bmNlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3B1bHNlLmNzcz85MzUxIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvcm90YXRpbmctcGxhbmUuY3NzP2EyYjMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9yb3RhdGluZy1wbGFuZS5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzP2YwMTYiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcz8xMTA0Iiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dhdmUuY3NzP2JiMWUiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3M/MDA2MSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9jb21wb25lbnRzL1B1cmlmeUNvbXBvbmVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LWFkZG9ucy1wdXJlLXJlbmRlci1taXhpbi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0L2xpYi9SZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC9saWIvc2hhbGxvd0NvbXBhcmUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMuanN4Iiwid2VicGFjazovLy8uL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL2xpYi9jb252ZXJ0U2FtcGxlc0RhdGEuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvUGF0aWVudEhlYWRlci5qc3giLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvU2FtcGxlSW5saW5lLmpzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2NzcyIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2Nzcz8wNTZiIl0sIm5hbWVzIjpbImFyMSIsImFyMiIsInByb3BzIiwibG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEiLCJ0YWJJZCIsInNldFRhYiIsInNhbXBsZXMiLCJwYXRpZW50IiwiZ2V0Iiwic3RhdHVzIiwiYnVpbGRUYWJzIiwiQ29tcG9uZW50IiwiUGF0aWVudEhlYWRlciIsIkNsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXJVbmNvbm5lY3RlZCIsIm5leHRQcm9wcyIsIm5leHRTdGF0ZSIsInJvd3MiLCJkYXRhIiwiZm9yRWFjaCIsIml0ZW0iLCJwdXNoIiwiQ2xpbmljYWxJbmZvcm1hdGlvblBhdGllbnRUYWJsZSIsInByb3BUeXBlcyIsImFueSIsImlzUmVxdWlyZWQiLCJzaG91bGRDb21wb25lbnRVcGRhdGUiLCJiaW5kIiwibmV3UHJvcHMiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwiSXRlcmFibGUiLCJpc0l0ZXJhYmxlIiwidG9KUyIsInN0YXRlIiwibXlUYWJsZURhdGEiLCJuYW1lIiwidG9BcnJheSIsImNlbGxzIiwiaXRlbXMiLCJjb2x1bW5zIiwiY29sIiwiaWQiLCJhdHRyX25hbWUiLCJhdHRyX2lkIiwiYXR0cl92YWwiLCJkIiwiYXR0cmlidXRlcyIsIm1hcCIsImRhdGF0eXBlIiwiZGlzcGxheV9uYW1lIiwidW5zaGlmdCIsIkNsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUiLCJvdXRwdXQiLCJzYW1wbGUiLCJzYW1wbGVJZCIsImNsaW5pY2FsRGF0YSIsImRhdGFJdGVtIiwidmFsdWUiLCJ0b1N0cmluZyIsIm51bWJlciIsImZyb21KUyIsInNpemUiLCJjb25zb2xlIiwibG9nIiwiZ2V0UG9wb3ZlciIsImRyYXdIZWFkZXIiLCJTYW1wbGVJbmxpbmUiLCJQcm9wVHlwZXMiLCJvYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZDQUtRO2lCQUFNLGtCQUFrQixTQUFTLGdCQUFnQixPQUM3Qzs7OEJBQ2EsTUFBTSxJQUFJLHVCQUF1QixJQUMxQzs2QkFBUSxNQUFNLElBQUksdUJBQXVCLElBQ3pDOzhCQUFTLE1BQU0sSUFBSSx1QkFBdUIsSUFFakQ7QUFKTztBQU1SOztpQkFBTSxnQkFBZ0IseUJBQVEsaUNBRTlCOztnQ0FBUyxPQUFPLDhCQUFDLGlCQUFjLE9BQU8sS0FBSyxNQUFNLFVBQy9DLFNBQVMsZUFDWDtBQUVIOzs7O2tDQUVHO29CQUNJLHNFQUVQOzs7OztHQXRCeUIsZ0JBQU07O21CQTBCckIsZ0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hDZjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsyQ0FLc0JBLEcsRUFBS0MsRyxFQUFLO0FBQ3hCLGtCQUFLQyxLQUFMLENBQVdDLGdDQUFYO0FBQ0g7Ozs2Q0FFbUI7QUFDaEIsb0JB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TUFGWCxVQUVXQSxNQUZYOzs7QUFJTCxvQkFDSTtBQUFBO0FBQUEsbUJBQU0sT0FBTyxFQUFDLGdCQUFlLE1BQWhCLEVBQWI7QUFDSSwrRUFBaUIsT0FBTyxPQUF4QixFQUFpQyxPQUFRQSxNQUFELENBQVNELFFBQVQsRUFBeEMsR0FESjtBQUVLLHVCQUFNTCxPQUFPWjtBQUZsQixjQURKO0FBTUg7Ozs7R0FYcUMsZ0JBQU0vQixTOzs7O0FBYWhEd0QsY0FBYTdDLFNBQWIsR0FBeUI7QUFDckJnQyxhQUFRLGdCQUFNYyxTQUFOLENBQWdCQyxNQUFoQixDQUF1QjdDLFVBRFY7QUFFckJvQyxhQUFRLGdCQUFNUSxTQUFOLENBQWdCUixNQUFoQixDQUF1QnBDO0FBRlYsRUFBekIsQzs7Ozs7Ozs7QUNqQkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBNEY7QUFDNUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSx3Q0FBdUMsbUNBQW1DLEVBQUUsZ0NBQWdDLHVCQUF1QixFQUFFOztBQUVySSIsImZpbGUiOiJyZWFjdGFwcC9qcy8xLmNodW5rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHtCdXR0b24sIE92ZXJsYXksIFRvb2x0aXAsIFBvcG92ZXJ9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgQ2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lciBmcm9tICcuL2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lcic7XG5pbXBvcnQgUGF0aWVudEhlYWRlclVuY29ubmVjdGVkIGZyb20gJy4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyJztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5cbmNsYXNzIFBhdGllbnRWaWV3UGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgY29uc3QgbWFwU3RhdGVUb1Byb3BzID0gZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNhbXBsZXM6IHN0YXRlLmdldCgnY2xpbmljYWxJbmZvcm1hdGlvbicpLmdldCgnc2FtcGxlcycpLFxuICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdGUuZ2V0KCdjbGluaWNhbEluZm9ybWF0aW9uJykuZ2V0KCdzdGF0dXMnKSxcbiAgICAgICAgICAgICAgICBwYXRpZW50OiBzdGF0ZS5nZXQoJ2NsaW5pY2FsSW5mb3JtYXRpb24nKS5nZXQoJ3BhdGllbnQnKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgUGF0aWVudEhlYWRlciA9IGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzKShQYXRpZW50SGVhZGVyVW5jb25uZWN0ZWQpO1xuXG4gICAgICAgIFJlYWN0RE9NLnJlbmRlcig8UGF0aWVudEhlYWRlciBzdG9yZT17dGhpcy5wcm9wcy5zdG9yZX0gLz4sXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbGluaWNhbF9kaXZcIikpO1xuICAgICAgICAvL1JlYWN0RE9NLnJlbmRlcig8ZGl2PjxFeGFtcGxlIC8+PEV4YW1wbGUgLz48L2Rpdj4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xpbmljYWxfZGl2XCIpKTtcblxuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8Q2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lciAvPlxuICAgICAgICApO1xuICAgIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBQYXRpZW50Vmlld1BhZ2U7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9QYXRpZW50Vmlld1BhZ2UuanN4XG4gKiovIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IENsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUgZnJvbSAnLi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlJztcbmltcG9ydCBQRFhUcmVlIGZyb20gJy4vUERYVHJlZSc7XG5pbXBvcnQgU3Bpbm5lciBmcm9tICdyZWFjdC1zcGlua2l0JztcbmltcG9ydCB7IGFjdGlvbkNyZWF0b3JzLCBtYXBTdGF0ZVRvUHJvcHMgfSBmcm9tICcuL2R1Y2snO1xuaW1wb3J0IFB1cmlmeUNvbXBvbmVudCBmcm9tICdzaGFyZWQvY29tcG9uZW50cy9QdXJpZnlDb21wb25lbnQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCBDbGluaWNhbEluZm9ybWF0aW9uU2FtcGxlcyBmcm9tICcuL0NsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzJztcbmltcG9ydCBQYXRpZW50SGVhZGVyVW5jb25uZWN0ZWQgZnJvbSAnLi4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyJztcblxuaW1wb3J0ICcuL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzJztcblxuXG5leHBvcnQgY2xhc3MgQ2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lclVuY29ubmVjdGVkIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICAgIGNvbXBvbmVudERpZE1vdW50KGFyMSwgYXIyKSB7XG4gICAgICAgIHRoaXMucHJvcHMubG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEoKTtcbiAgICB9XG5cbiAgICBidWlsZEJ1dHRvbkdyb3VwcygpIHtcbiAgICAgICAgcmV0dXJuIChcblxuICAgICAgICAgICAgPEJ1dHRvbkdyb3VwPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q29weTwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q1NWPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbj5TaG93L0hpZGUgQ29sdW1uczwvQnV0dG9uPlxuICAgICAgICAgICAgPC9CdXR0b25Hcm91cD5cblxuICAgICAgICApO1xuICAgIH1cblxuICAgIHNlbGVjdFRhYih0YWJJZCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldFRhYih0YWJJZCk7XG4gICAgfVxuXG4gICAgYnVpbGRUYWJzKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQ+U2FtcGxlczwvaDQ+XG5cbiAgICAgICAgICAgICAgICA8Q2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMgZGF0YT17dGhpcy5wcm9wcy5zYW1wbGVzfSAvPlxuXG4gICAgICAgICAgICAgICAgPGg0PlBhdGllbnQ8L2g0PlxuICAgICAgICAgICAgICAgIDxDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlIGRhdGE9e3RoaXMucHJvcHMucGF0aWVudC5nZXQoJ2NsaW5pY2FsRGF0YScpfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5zdGF0dXMpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmV0Y2hpbmcnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+PFNwaW5uZXIgc3Bpbm5lck5hbWU9XCJ0aHJlZS1ib3VuY2VcIiAvPjwvZGl2PjtcblxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+eyB0aGlzLmJ1aWxkVGFicygpIH08L2Rpdj47XG5cbiAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcblxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiAvPjtcblxuICAgICAgICB9XG4gICAgfVxuXG5cbn1cblxuZXhwb3J0IGNvbnN0IFBhdGllbnRIZWFkZXIgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcyxcbiAgICBhY3Rpb25DcmVhdG9ycykoUGF0aWVudEhlYWRlclVuY29ubmVjdGVkKTtcblxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIGFjdGlvbkNyZWF0b3JzKShDbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyVW5jb25uZWN0ZWQpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeFxuICoqLyIsImltcG9ydCBSZWFjdCwgeyBQcm9wVHlwZXMgYXMgVCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpbmljYWxJbmZvcm1hdGlvblBhdGllbnRUYWJsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcblxuICAgIH1cblxuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gKG5leHRQcm9wcyA9PT0gdGhpcy5wcm9wcyk7XG4gICAgfVxuXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHJvd3MgPSBbXTtcblxuICAgICAgICA7XG4gICAgICAgIHRoaXMucHJvcHMuZGF0YS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByb3dzLnB1c2goXG4gICAgICAgICAgICAgICAgPHRyIGtleT17aXRlbS5nZXQoJ2lkJyl9PlxuICAgICAgICAgICAgICAgICAgICA8dGQ+e2l0ZW0uZ2V0KCdpZCcpfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDx0ZD57aXRlbS5nZXQoJ3ZhbHVlJyl9PC90ZD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxUYWJsZSBzdHJpcGVkPlxuICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgIDx0aD5BdHRyaWJ1dGU8L3RoPlxuICAgICAgICAgICAgICAgICAgICA8dGg+VmFsdWU8L3RoPlxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAge3Jvd3N9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cblxuICAgICAgICAgICAgPC9UYWJsZT5cbiAgICAgICAgKTtcbiAgICAgICAgLy8gY29uc3QgaGVhZGVyQ2VsbHMgPSB0aGlzLnByb3BzLmRhdGEuZ2V0KCdjb2x1bW5zJykubWFwKChjb2wpPT57XG4gICAgICAgIC8vICAgICByZXR1cm4gPHRoPntjb2wuZ2V0KCdpZCcpfTwvdGg+XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBjb25zdCByb3dzID0gdGhpcy5wcm9wcy5kYXRhLmdldCgnaXRlbXMnKS5tYXAoKHJvdywga2V5KSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4gKDx0ciBrZXk9e2tleX0+XG4gICAgICAgIC8vICAgICAgICAgICAgIDx0aD57cm93LmdldCgnbmFtZScpfTwvdGg+XG4gICAgICAgIC8vICAgICAgICAgICAgIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuZGF0YS5nZXQoJ2NvbHVtbnMnKS5tYXAoKGNvbCk9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoY29sLmdldCgnaWQnKSBpbiByb3cudG9KUygpKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8dGQ+e3Jvdy5nZXQoY29sLmdldCgnaWQnKSl9PC90ZD5cbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPHRkPk4vQTwvdGQ+XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgLy8gICAgICAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgICAgIDwvdHI+XG4gICAgICAgIC8vICAgICApO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIChcbiAgICAgICAgLy8gICAgIDxUYWJsZSBzdHJpcGVkPlxuICAgICAgICAvLyAgICAgICAgIDx0aGVhZD48dHI+XG4gICAgICAgIC8vICAgICAgICAgICAgIDx0aD48L3RoPlxuICAgICAgICAvLyAgICAgICAgICAgICB7IGhlYWRlckNlbGxzIH1cbiAgICAgICAgLy8gICAgICAgICA8L3RyPjwvdGhlYWQ+XG4gICAgICAgIC8vICAgICAgICAgPHRib2R5Pnsgcm93cyB9PC90Ym9keT5cbiAgICAgICAgLy8gICAgIDwvVGFibGU+XG4gICAgICAgIC8vICk7XG4gICAgfVxufVxuXG5cbkNsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUucHJvcFR5cGVzID0ge1xuICAgIGRhdGE6IFQuYW55LmlzUmVxdWlyZWQsXG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlLmpzeFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9vYmplY3RBc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBfb2JqZWN0QXNzaWduMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX29iamVjdEFzc2lnbik7XG5cbnJlcXVpcmUoJy4uL2Nzcy9mYWRlLWluLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvY2hhc2luZy1kb3RzLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvY2lyY2xlLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvY3ViZS1ncmlkLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvZG91YmxlLWJvdW5jZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3B1bHNlLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3Mvcm90YXRpbmctcGxhbmUuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy90aHJlZS1ib3VuY2UuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy93YW5kZXJpbmctY3ViZXMuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy93YXZlLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3Mvd29yZHByZXNzLmNzcycpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmICghc2VsZikgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIGNhbGwgJiYgKHR5cGVvZiBjYWxsID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpID8gY2FsbCA6IHNlbGY7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5cblxudmFyIFNwaW5uZXIgPSBmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoU3Bpbm5lciwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gU3Bpbm5lcihwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTcGlubmVyKTtcblxuICAgIHZhciBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIE9iamVjdC5nZXRQcm90b3R5cGVPZihTcGlubmVyKS5jYWxsKHRoaXMsIHByb3BzKSk7XG5cbiAgICBfdGhpcy5kaXNwbGF5TmFtZSA9ICdTcGluS2l0JztcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoU3Bpbm5lciwgW3tcbiAgICBrZXk6ICdyZW5kZXInLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICB2YXIgX2N4O1xuXG4gICAgICB2YXIgY2xhc3NlcyA9ICgwLCBfY2xhc3NuYW1lczIuZGVmYXVsdCkoKF9jeCA9IHtcbiAgICAgICAgJ2ZhZGUtaW4nOiAhdGhpcy5wcm9wcy5ub0ZhZGVJbixcbiAgICAgICAgc3Bpbm5lcjogdGhpcy5wcm9wcy5vdmVycmlkZVNwaW5uZXJDbGFzc05hbWUgPT09ICcnXG4gICAgICB9LCBfZGVmaW5lUHJvcGVydHkoX2N4LCB0aGlzLnByb3BzLm92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZSwgISF0aGlzLnByb3BzLm92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZSksIF9kZWZpbmVQcm9wZXJ0eShfY3gsIHRoaXMucHJvcHMuY2xhc3NOYW1lLCAhIXRoaXMucHJvcHMuY2xhc3NOYW1lKSwgX2N4KSk7XG5cbiAgICAgIHZhciBwcm9wcyA9ICgwLCBfb2JqZWN0QXNzaWduMi5kZWZhdWx0KSh7fSwgdGhpcy5wcm9wcyk7XG4gICAgICBkZWxldGUgcHJvcHMuc3Bpbm5lck5hbWU7XG4gICAgICBkZWxldGUgcHJvcHMubm9GYWRlSW47XG4gICAgICBkZWxldGUgcHJvcHMub3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lO1xuICAgICAgZGVsZXRlIHByb3BzLmNsYXNzTmFtZTtcblxuICAgICAgdmFyIHNwaW5uZXJFbCA9IHZvaWQgMDtcbiAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5zcGlubmVyTmFtZSkge1xuICAgICAgICBjYXNlICdkb3VibGUtYm91bmNlJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ2RvdWJsZS1ib3VuY2UgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdkb3VibGUtYm91bmNlMScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdkb3VibGUtYm91bmNlMicgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyb3RhdGluZy1wbGFuZSc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6IGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyb3RhdGluZy1wbGFuZScgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3YXZlJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ3dhdmUgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyZWN0MScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyZWN0MicgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyZWN0MycgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyZWN0NCcgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdyZWN0NScgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3YW5kZXJpbmctY3ViZXMnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAnd2FuZGVyaW5nLWN1YmVzICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZTEnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZTInIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVsc2UnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncHVsc2UnIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY2hhc2luZy1kb3RzJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgICAgeyBjbGFzc05hbWU6ICdjaGFzaW5nLWRvdHMnIH0sXG4gICAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2RvdDEnIH0pLFxuICAgICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdkb3QyJyB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICdjaXJjbGUtd3JhcHBlciAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTEgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTIgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTMgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTQgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTUgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTYgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTcgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTggY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTkgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTEwIGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUxMSBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMTIgY2lyY2xlJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2N1YmUtZ3JpZCc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICdjdWJlLWdyaWQgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3b3JkcHJlc3MnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgICB7IGNsYXNzTmFtZTogJ3dvcmRwcmVzcycgfSxcbiAgICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnaW5uZXItY2lyY2xlJyB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RocmVlLWJvdW5jZSc6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICd0aHJlZS1ib3VuY2UgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdib3VuY2UxJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2JvdW5jZTInIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnYm91bmNlMycgfSlcbiAgICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNwaW5uZXJFbDtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gU3Bpbm5lcjtcbn0oX3JlYWN0Mi5kZWZhdWx0LkNvbXBvbmVudCk7XG5cblNwaW5uZXIucHJvcFR5cGVzID0ge1xuICBzcGlubmVyTmFtZTogX3JlYWN0Mi5kZWZhdWx0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgbm9GYWRlSW46IF9yZWFjdDIuZGVmYXVsdC5Qcm9wVHlwZXMuYm9vbCxcbiAgb3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lOiBfcmVhY3QyLmRlZmF1bHQuUHJvcFR5cGVzLnN0cmluZyxcbiAgY2xhc3NOYW1lOiBfcmVhY3QyLmRlZmF1bHQuUHJvcFR5cGVzLnN0cmluZ1xufTtcblxuU3Bpbm5lci5kZWZhdWx0UHJvcHMgPSB7XG4gIHNwaW5uZXJOYW1lOiAndGhyZWUtYm91bmNlJyxcbiAgbm9GYWRlSW46IGZhbHNlLFxuICBvdmVycmlkZVNwaW5uZXJDbGFzc05hbWU6ICcnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwaW5uZXI7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9kaXN0L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2ZhZGUtaW4uY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9mYWRlLWluLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZmFkZS1pbi5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzXG4gKiogbW9kdWxlIGlkID0gMTAxOFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIkAtd2Via2l0LWtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuQC1tb3ota2V5ZnJhbWVzIGZhZGUtaW4ge1xcbiAgMCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICA1MCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICAxMDAlIHtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgfVxcbn1cXG5cXG5ALW1zLWtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuQGtleWZyYW1lcyBmYWRlLWluIHtcXG4gIDAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgNTAlIHtcXG4gICAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbiAgMTAwJSB7XFxuICAgICAgb3BhY2l0eTogMTtcXG4gIH1cXG59XFxuXFxuLmZhZGUtaW4ge1xcbiAgLXdlYmtpdC1hbmltYXRpb246IGZhZGUtaW4gMnM7XFxuICAtbW96LWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG4gIC1vLWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG4gIC1tcy1hbmltYXRpb246IGZhZGUtaW4gMnM7XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzXG4gKiogbW9kdWxlIGlkID0gMTAxOVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NoYXNpbmctZG90cy5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NoYXNpbmctZG90cy5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NoYXNpbmctZG90cy5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDIwXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLmNoYXNpbmctZG90cyB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiByb3RhdGUgMi4wcyBpbmZpbml0ZSBsaW5lYXI7XFxuICBhbmltYXRpb246IHJvdGF0ZSAyLjBzIGluZmluaXRlIGxpbmVhcjtcXG59XFxuXFxuLmRvdDEsIC5kb3QyIHtcXG4gIHdpZHRoOiA2MCU7XFxuICBoZWlnaHQ6IDYwJTtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHRvcDogMDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBib3JkZXItcmFkaXVzOiAxMDAlO1xcblxcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZSAyLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLmRvdDIge1xcbiAgdG9wOiBhdXRvO1xcbiAgYm90dG9tOiAwcHg7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0xLjBzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgcm90YXRlIHsgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKSB9fVxcbkBrZXlmcmFtZXMgcm90YXRlIHtcXG4gIDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7XFxuICB9XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBib3VuY2Uge1xcbiAgMCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNTAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvY2hhc2luZy1kb3RzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMjFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaXJjbGUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAyMlxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5jaXJjbGUtd3JhcHBlciB7XFxuICB3aWR0aDogMjJweDtcXG4gIGhlaWdodDogMjJweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG59XFxuXFxuLmNpcmNsZSB7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGxlZnQ6IDA7XFxuICB0b3A6IDA7XFxufVxcblxcbi5jaXJjbGU6YmVmb3JlIHtcXG4gIGNvbnRlbnQ6ICcnO1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICBtYXJnaW46IDAgYXV0bztcXG4gIHdpZHRoOiAyMCU7XFxuICBoZWlnaHQ6IDIwJTtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuXFxuICBib3JkZXItcmFkaXVzOiAxMDAlO1xcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZWRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IGJvdW5jZWRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICAvKiBQcmV2ZW50IGZpcnN0IGZyYW1lIGZyb20gZmxpY2tlcmluZyB3aGVuIGFuaW1hdGlvbiBzdGFydHMgKi9cXG4gIC13ZWJraXQtYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcXG4gIGFuaW1hdGlvbi1maWxsLW1vZGU6IGJvdGg7XFxufVxcblxcbi5jaXJjbGUyICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpOyAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpICB9XFxuLmNpcmNsZTMgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSg2MGRlZyk7ICB0cmFuc2Zvcm06IHJvdGF0ZSg2MGRlZykgIH1cXG4uY2lyY2xlNCAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgIHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKSAgfVxcbi5jaXJjbGU1ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMTIwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMTIwZGVnKSB9XFxuLmNpcmNsZTYgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgxNTBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgxNTBkZWcpIH1cXG4uY2lyY2xlNyAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZykgfVxcbi5jaXJjbGU4ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMjEwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMjEwZGVnKSB9XFxuLmNpcmNsZTkgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgyNDBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgyNDBkZWcpIH1cXG4uY2lyY2xlMTAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDI3MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDI3MGRlZykgfVxcbi5jaXJjbGUxMSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzAwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMzAwZGVnKSB9XFxuLmNpcmNsZTEyIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzMzBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgzMzBkZWcpIH1cXG5cXG4uY2lyY2xlMjpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjFzOyBhbmltYXRpb24tZGVsYXk6IC0xLjFzIH1cXG4uY2lyY2xlMzpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjBzOyBhbmltYXRpb24tZGVsYXk6IC0xLjBzIH1cXG4uY2lyY2xlNDpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjlzOyBhbmltYXRpb24tZGVsYXk6IC0wLjlzIH1cXG4uY2lyY2xlNTpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjhzOyBhbmltYXRpb24tZGVsYXk6IC0wLjhzIH1cXG4uY2lyY2xlNjpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjdzOyBhbmltYXRpb24tZGVsYXk6IC0wLjdzIH1cXG4uY2lyY2xlNzpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjZzOyBhbmltYXRpb24tZGVsYXk6IC0wLjZzIH1cXG4uY2lyY2xlODpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjVzOyBhbmltYXRpb24tZGVsYXk6IC0wLjVzIH1cXG4uY2lyY2xlOTpiZWZvcmUgIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjRzOyBhbmltYXRpb24tZGVsYXk6IC0wLjRzIH1cXG4uY2lyY2xlMTA6YmVmb3JlIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjNzOyBhbmltYXRpb24tZGVsYXk6IC0wLjNzIH1cXG4uY2lyY2xlMTE6YmVmb3JlIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjJzOyBhbmltYXRpb24tZGVsYXk6IC0wLjJzIH1cXG4uY2lyY2xlMTI6YmVmb3JlIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjFzOyBhbmltYXRpb24tZGVsYXk6IC0wLjFzIH1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgYm91bmNlZGVsYXkge1xcbiAgMCUsIDgwJSwgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApIH1cXG4gIDQwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBib3VuY2VkZWxheSB7XFxuICAwJSwgODAlLCAxMDAlIHtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNDAlIHtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvY2lyY2xlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMjNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jdWJlLWdyaWQuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAyNFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5jdWJlLWdyaWQge1xcbiAgd2lkdGg6MjdweDtcXG4gIGhlaWdodDoyN3B4O1xcbn1cXG5cXG4uY3ViZSB7XFxuICB3aWR0aDozMyU7XFxuICBoZWlnaHQ6MzMlO1xcbiAgYmFja2dyb3VuZDojMzMzO1xcbiAgZmxvYXQ6bGVmdDtcXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBzY2FsZURlbGF5IDEuM3MgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IHNjYWxlRGVsYXkgMS4zcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLypcXG4gKiBTcGlubmVyIHBvc2l0aW9uc1xcbiAqIDEgMiAzXFxuICogNCA1IDZcXG4gKiA3IDggOVxcbiAqL1xcblxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCgxKSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjJzOyBhbmltYXRpb24tZGVsYXk6IDAuMnMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoMikgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4zczsgYW5pbWF0aW9uLWRlbGF5OiAwLjNzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDMpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuNHM7IGFuaW1hdGlvbi1kZWxheTogMC40cyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg0KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjFzOyBhbmltYXRpb24tZGVsYXk6IDAuMXMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoNSkgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4yczsgYW5pbWF0aW9uLWRlbGF5OiAwLjJzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDYpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuM3M7IGFuaW1hdGlvbi1kZWxheTogMC4zcyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg3KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjBzOyBhbmltYXRpb24tZGVsYXk6IDAuMHMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoOCkgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4xczsgYW5pbWF0aW9uLWRlbGF5OiAwLjFzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDkpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuMnM7IGFuaW1hdGlvbi1kZWxheTogMC4ycyAgfVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBzY2FsZURlbGF5IHtcXG4gIDAlLCA3MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApIH1cXG4gIDM1JSAgICAgICAgICAgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDAuMCwgMC4wLCAxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBzY2FsZURlbGF5IHtcXG4gIDAlLCA3MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApOyB0cmFuc2Zvcm06c2NhbGUzRCgxLjAsIDEuMCwgMS4wKSB9XFxuICAzNSUgICAgICAgICAgIHsgLXdlYmtpdC10cmFuc2Zvcm06c2NhbGUzRCgxLjAsIDEuMCwgMS4wKTsgdHJhbnNmb3JtOnNjYWxlM0QoMC4wLCAwLjAsIDEuMCkgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jdWJlLWdyaWQuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAyNVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2RvdWJsZS1ib3VuY2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9kb3VibGUtYm91bmNlLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZG91YmxlLWJvdW5jZS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL2RvdWJsZS1ib3VuY2UuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAyNlxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5kb3VibGUtYm91bmNlIHtcXG4gIHdpZHRoOiAyN3B4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcblxcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4uZG91YmxlLWJvdW5jZTEsIC5kb3VibGUtYm91bmNlMiB7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIGJvcmRlci1yYWRpdXM6IDUwJTtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBvcGFjaXR5OiAwLjY7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcblxcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZSAyLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLmRvdWJsZS1ib3VuY2UyIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBib3VuY2Uge1xcbiAgMCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNTAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvZG91YmxlLWJvdW5jZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDI3XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHVsc2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9wdWxzZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3B1bHNlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAyOFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5wdWxzZSB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuXFxuICBib3JkZXItcmFkaXVzOiAxMDAlO1xcbiAgLXdlYmtpdC1hbmltYXRpb246IHNjYWxlb3V0IDEuMHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IHNjYWxlb3V0IDEuMHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBzY2FsZW91dCB7XFxuICAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApIH1cXG4gIDEwMCUge1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgb3BhY2l0eTogMDtcXG4gIH1cXG59XFxuXFxuQGtleWZyYW1lcyBzY2FsZW91dCB7XFxuICAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICB9IDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9wdWxzZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDI5XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcm90YXRpbmctcGxhbmUuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9yb3RhdGluZy1wbGFuZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3JvdGF0aW5nLXBsYW5lLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvcm90YXRpbmctcGxhbmUuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAzMFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5yb3RhdGluZy1wbGFuZSB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogcm90YXRlcGxhbmUgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogcm90YXRlcGxhbmUgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHJvdGF0ZXBsYW5lIHtcXG4gIDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVkoMTgwZGVnKSB9XFxuICAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVZKDE4MGRlZykgIHJvdGF0ZVgoMTgwZGVnKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgcm90YXRlcGxhbmUge1xcbiAgMCUge1xcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKDBkZWcpIHJvdGF0ZVkoMGRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMjBweCkgcm90YXRlWCgwZGVnKSByb3RhdGVZKDBkZWcpO1xcbiAgfSA1MCUge1xcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKC0xODAuMWRlZykgcm90YXRlWSgwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKC0xODAuMWRlZykgcm90YXRlWSgwZGVnKTtcXG4gIH0gMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MGRlZykgcm90YXRlWSgtMTc5LjlkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MGRlZykgcm90YXRlWSgtMTc5LjlkZWcpO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy9yb3RhdGluZy1wbGFuZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDMxXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdGhyZWUtYm91bmNlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdGhyZWUtYm91bmNlLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdGhyZWUtYm91bmNlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3MvdGhyZWUtYm91bmNlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIudGhyZWUtYm91bmNlID4gZGl2IHtcXG4gIHdpZHRoOiAxOHB4O1xcbiAgaGVpZ2h0OiAxOHB4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG5cXG4gIGJvcmRlci1yYWRpdXM6IDEwMCU7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS40cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS40cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIC8qIFByZXZlbnQgZmlyc3QgZnJhbWUgZnJvbSBmbGlja2VyaW5nIHdoZW4gYW5pbWF0aW9uIHN0YXJ0cyAqL1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xcbiAgYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcXG59XFxuXFxuLnRocmVlLWJvdW5jZSAuYm91bmNlMSB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuMzJzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMC4zMnM7XFxufVxcblxcbi50aHJlZS1ib3VuY2UgLmJvdW5jZTIge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjE2cztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTAuMTZzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgYm91bmNlZGVsYXkge1xcbiAgMCUsIDgwJSwgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApIH1cXG4gIDQwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBib3VuY2VkZWxheSB7XFxuICAwJSwgODAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvdGhyZWUtYm91bmNlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YW5kZXJpbmctY3ViZXMuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YW5kZXJpbmctY3ViZXMuY3NzXG4gKiogbW9kdWxlIGlkID0gMTAzNFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi53YW5kZXJpbmctY3ViZXMge1xcbiAgd2lkdGg6IDI3cHg7XFxuICBoZWlnaHQ6IDI3cHg7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxufVxcblxcbi5jdWJlMSwgLmN1YmUyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICB3aWR0aDogMTBweDtcXG4gIGhlaWdodDogMTBweDtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHRvcDogMDtcXG4gIGxlZnQ6IDA7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogY3ViZW1vdmUgMS44cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogY3ViZW1vdmUgMS44cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLmN1YmUyIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC45cztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTAuOXM7XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBjdWJlbW92ZSB7XFxuICAyNSUgeyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCgyMnB4KSByb3RhdGUoLTkwZGVnKSBzY2FsZSgwLjUpIH1cXG4gIDUwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDIycHgpIHRyYW5zbGF0ZVkoMjJweCkgcm90YXRlKC0xODBkZWcpIH1cXG4gIDc1JSB7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDBweCkgdHJhbnNsYXRlWSgyMnB4KSByb3RhdGUoLTI3MGRlZykgc2NhbGUoMC41KSB9XFxuICAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgtMzYwZGVnKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgY3ViZW1vdmUge1xcbiAgMjUlIHsgXFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSByb3RhdGUoLTkwZGVnKSBzY2FsZSgwLjUpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSByb3RhdGUoLTkwZGVnKSBzY2FsZSgwLjUpO1xcbiAgfSA1MCUge1xcbiAgICAvKiBIYWNrIHRvIG1ha2UgRkYgcm90YXRlIGluIHRoZSByaWdodCBkaXJlY3Rpb24gKi9cXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0xNzlkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMTc5ZGVnKTtcXG4gIH0gNTAuMSUge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTE4MGRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0xODBkZWcpO1xcbiAgfSA3NSUge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMHB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMjcwZGVnKSBzY2FsZSgwLjUpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCgwcHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0yNzBkZWcpIHNjYWxlKDAuNSk7XFxuICB9IDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHJvdGF0ZSgtMzYwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgtMzYwZGVnKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YXZlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd2F2ZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhdmUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud2F2ZSB7XFxuICB3aWR0aDogNTBweDtcXG4gIGhlaWdodDogMjdweDtcXG59XFxuXFxuLndhdmUgPiBkaXYge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG4gIGhlaWdodDogMTAwJTtcXG4gIHdpZHRoOiA2cHg7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuXFxuICAtd2Via2l0LWFuaW1hdGlvbjogc3RyZXRjaGRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IHN0cmV0Y2hkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG4ud2F2ZSAucmVjdDIge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjFzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMS4xcztcXG59XFxuXFxuLndhdmUgLnJlY3QzIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxufVxcblxcbi53YXZlIC5yZWN0NCB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOXM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0wLjlzO1xcbn1cXG5cXG4ud2F2ZSAucmVjdDUge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjhzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMC44cztcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHN0cmV0Y2hkZWxheSB7XFxuICAwJSwgNDAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgwLjQpIH1cXG4gIDIwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgc3RyZXRjaGRlbGF5IHtcXG4gIDAlLCA0MCUsIDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlWSgwLjQpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCk7XFxuICB9IDIwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGVZKDEuMCk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2F2ZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDM3XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd29yZHByZXNzLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd29yZHByZXNzLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd29yZHByZXNzLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd29yZHByZXNzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud29yZHByZXNzIHtcXG4gIGJhY2tncm91bmQ6ICMzMzM7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIGJvcmRlci1yYWRpdXM6IDI3cHg7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogaW5uZXItY2lyY2xlIDFzIGxpbmVhciBpbmZpbml0ZTtcXG4gIGFuaW1hdGlvbjogaW5uZXItY2lyY2xlIDFzIGxpbmVhciBpbmZpbml0ZTtcXG59XFxuXFxuLmlubmVyLWNpcmNsZSB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIGJhY2tncm91bmQ6ICNmZmY7XFxuICB3aWR0aDogOHB4O1xcbiAgaGVpZ2h0OiA4cHg7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBib3JkZXItcmFkaXVzOiA4cHg7XFxuICB0b3A6IDVweDtcXG4gIGxlZnQ6IDVweDtcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIGlubmVyLWNpcmNsZSB7XFxuICAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMCk7IH1cXG4gIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cXG59XFxuXFxuQGtleWZyYW1lcyBpbm5lci1jaXJjbGUge1xcbiAgMCUgeyB0cmFuc2Zvcm06IHJvdGF0ZSgwKTsgLXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDApOyB9XFxuICAxMDAlIHsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgLXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7IH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd29yZHByZXNzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDEwMzlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHVyZVJlbmRlck1peGluIGZyb20gJ3JlYWN0LWFkZG9ucy1wdXJlLXJlbmRlci1taXhpbic7XG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFB1cmlmeUNvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnNob3VsZENvbXBvbmVudFVwZGF0ZSA9IFB1cmVSZW5kZXJNaXhpbi5zaG91bGRDb21wb25lbnRVcGRhdGUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IG5ld1Byb3BzID0ge307XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5wcm9wcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSAnY29tcG9uZW50Jykge1xuICAgICAgICAgICAgICAgIGlmIChJbW11dGFibGUuSXRlcmFibGUuaXNJdGVyYWJsZSh0aGlzLnByb3BzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Byb3BzW2tleV0gPSB0aGlzLnByb3BzW2tleV0udG9KUygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Byb3BzW2tleV0gPSB0aGlzLnByb3BzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gPHRoaXMucHJvcHMuY29tcG9uZW50IHsuLi5uZXdQcm9wc30gLz47XG4gICAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2hhcmVkL2NvbXBvbmVudHMvUHVyaWZ5Q29tcG9uZW50LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdyZWFjdC9saWIvUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluJyk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3QtYWRkb25zLXB1cmUtcmVuZGVyLW1peGluL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTA0MVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpblxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHNoYWxsb3dDb21wYXJlID0gcmVxdWlyZSgnLi9zaGFsbG93Q29tcGFyZScpO1xuXG4vKipcbiAqIElmIHlvdXIgUmVhY3QgY29tcG9uZW50J3MgcmVuZGVyIGZ1bmN0aW9uIGlzIFwicHVyZVwiLCBlLmcuIGl0IHdpbGwgcmVuZGVyIHRoZVxuICogc2FtZSByZXN1bHQgZ2l2ZW4gdGhlIHNhbWUgcHJvcHMgYW5kIHN0YXRlLCBwcm92aWRlIHRoaXMgbWl4aW4gZm9yIGFcbiAqIGNvbnNpZGVyYWJsZSBwZXJmb3JtYW5jZSBib29zdC5cbiAqXG4gKiBNb3N0IFJlYWN0IGNvbXBvbmVudHMgaGF2ZSBwdXJlIHJlbmRlciBmdW5jdGlvbnMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgIHZhciBSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4gPVxuICogICAgIHJlcXVpcmUoJ1JlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbicpO1xuICogICBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gKiAgICAgbWl4aW5zOiBbUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluXSxcbiAqXG4gKiAgICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAqICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17dGhpcy5wcm9wcy5jbGFzc05hbWV9PmZvbzwvZGl2PjtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIE5vdGU6IFRoaXMgb25seSBjaGVja3Mgc2hhbGxvdyBlcXVhbGl0eSBmb3IgcHJvcHMgYW5kIHN0YXRlLiBJZiB0aGVzZSBjb250YWluXG4gKiBjb21wbGV4IGRhdGEgc3RydWN0dXJlcyB0aGlzIG1peGluIG1heSBoYXZlIGZhbHNlLW5lZ2F0aXZlcyBmb3IgZGVlcGVyXG4gKiBkaWZmZXJlbmNlcy4gT25seSBtaXhpbiB0byBjb21wb25lbnRzIHdoaWNoIGhhdmUgc2ltcGxlIHByb3BzIGFuZCBzdGF0ZSwgb3JcbiAqIHVzZSBgZm9yY2VVcGRhdGUoKWAgd2hlbiB5b3Uga25vdyBkZWVwIGRhdGEgc3RydWN0dXJlcyBoYXZlIGNoYW5nZWQuXG4gKlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvcHVyZS1yZW5kZXItbWl4aW4uaHRtbFxuICovXG52YXIgUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluID0ge1xuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uIChuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgIHJldHVybiBzaGFsbG93Q29tcGFyZSh0aGlzLCBuZXh0UHJvcHMsIG5leHRTdGF0ZSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0L2xpYi9SZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4uanNcbiAqKiBtb2R1bGUgaWQgPSAxMDQyXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4qIEBwcm92aWRlc01vZHVsZSBzaGFsbG93Q29tcGFyZVxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2hhbGxvd0VxdWFsID0gcmVxdWlyZSgnZmJqcy9saWIvc2hhbGxvd0VxdWFsJyk7XG5cbi8qKlxuICogRG9lcyBhIHNoYWxsb3cgY29tcGFyaXNvbiBmb3IgcHJvcHMgYW5kIHN0YXRlLlxuICogU2VlIFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpblxuICogU2VlIGFsc28gaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy9zaGFsbG93LWNvbXBhcmUuaHRtbFxuICovXG5mdW5jdGlvbiBzaGFsbG93Q29tcGFyZShpbnN0YW5jZSwgbmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgcmV0dXJuICFzaGFsbG93RXF1YWwoaW5zdGFuY2UucHJvcHMsIG5leHRQcm9wcykgfHwgIXNoYWxsb3dFcXVhbChpbnN0YW5jZS5zdGF0ZSwgbmV4dFN0YXRlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaGFsbG93Q29tcGFyZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC9saWIvc2hhbGxvd0NvbXBhcmUuanNcbiAqKiBtb2R1bGUgaWQgPSAxMDQzXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIGFzIFQgfSBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuaW1wb3J0IHtUYWJsZSwgQ29sdW1uLCBDZWxsfSBmcm9tICdmaXhlZC1kYXRhLXRhYmxlJztcblxuaW1wb3J0IEVuaGFuY2VkRml4ZWREYXRhVGFibGUgZnJvbSAnc2hhcmVkL2NvbXBvbmVudHMvZW5oYW5jZWRGaXhlZERhdGFUYWJsZS9FbmhhbmNlZEZpeGVkRGF0YVRhYmxlJztcblxuaW1wb3J0IGNvdmVydFNhbXBsZURhdGEgZnJvbSAnLi9saWIvY29udmVydFNhbXBsZXNEYXRhJztcblxuZXhwb3J0IGNsYXNzIENsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBteVRhYmxlRGF0YTogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ1J5bGFuJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0FtZWxpYScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdFc3RldmFuJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0Zsb3JlbmNlJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ1RyZXNzYScgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gY292ZXJ0U2FtcGxlRGF0YSh0aGlzLnByb3BzLmRhdGEudG9BcnJheSgpKTtcblxuICAgICAgICBjb25zdCBjZWxscyA9IFtdO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKGRhdGEuaXRlbXMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGRhdGEuaXRlbXNba2V5XTtcblxuICAgICAgICAgICAgZGF0YS5jb2x1bW5zLmZvckVhY2goKGNvbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2wuaWQgaW4gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHsgYXR0cl9uYW1lOiBrZXksIGF0dHJfaWQ6IGNvbC5pZCwgYXR0cl92YWw6IGl0ZW1bY29sLmlkXSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHsgYXR0cl9uYW1lOiBrZXksIGF0dHJfaWQ6IGNvbC5pZCwgYXR0cl92YWw6ICdOL0EnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkID0ge1xuICAgICAgICAgICAgYXR0cmlidXRlczogZGF0YS5jb2x1bW5zLm1hcCgoY29sKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXR0cl9pZDogY29sLmlkLCBkYXRhdHlwZTogJ1NUUklORycsIGRpc3BsYXlfbmFtZTogY29sLmlkIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGRhdGE6IGNlbGxzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGQuYXR0cmlidXRlcy51bnNoaWZ0KHsgYXR0cl9pZDogJ2F0dHJfbmFtZScsIGRhdGF0eXBlOiAnU1RSSU5HJywgZGlzcGxheV9uYW1lOiAnQXR0cmlidXRlJyB9KTtcblxuICAgICAgICByZXR1cm4gPEVuaGFuY2VkRml4ZWREYXRhVGFibGUgaW5wdXQ9e2R9IGdyb3VwSGVhZGVyPXtmYWxzZX0gZmlsdGVyPVwiR0xPQkFMXCIgcm93SGVpZ2h0PXszM30gaGVhZGVySGVpZ2h0PXszM30gZG93bmxvYWQ9XCJBTExcIiB1bmlxdWVJZD1cImF0dHJfbmFtZVwiIHRhYmxlV2lkdGg9ezExOTB9IGF1dG9Db2x1bW5XaWR0aD17dHJ1ZX0gLz47XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDbGluaWNhbEluZm9ybWF0aW9uU2FtcGxlc1RhYmxlO1xuXG5cbkNsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUucHJvcFR5cGVzID0ge1xuICAgIGRhdGE6IFQuYW55LmlzUmVxdWlyZWQsXG59O1xuXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzLmpzeFxuICoqLyIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0geyBjb2x1bW5zOiBbXSwgaXRlbXM6IHt9IH07XG5cbiAgICBkYXRhLmZvckVhY2goKHNhbXBsZSkgPT4ge1xuICAgICAgICBjb25zdCBzYW1wbGVJZCA9IHNhbXBsZS5pZDtcblxuICAgICAgICBvdXRwdXQuY29sdW1ucy5wdXNoKHsgaWQ6IHNhbXBsZUlkIH0pO1xuXG4gICAgICAgIHNhbXBsZS5jbGluaWNhbERhdGEuZm9yRWFjaCgoZGF0YUl0ZW0pID0+IHtcbiAgICAgICAgICAgIG91dHB1dC5pdGVtc1tkYXRhSXRlbS5pZF0gPSBvdXRwdXQuaXRlbXNbZGF0YUl0ZW0uaWRdIHx8IHt9O1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXVtzYW1wbGVJZF0gPSBkYXRhSXRlbS52YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXS5uYW1lID0gZGF0YUl0ZW0ubmFtZTtcbiAgICAgICAgICAgIG91dHB1dC5pdGVtc1tkYXRhSXRlbS5pZF0uaWQgPSBkYXRhSXRlbS5pZDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9saWIvY29udmVydFNhbXBsZXNEYXRhLmpzXG4gKiovIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7QnV0dG9uLCBPdmVybGF5VHJpZ2dlciwgUG9wb3Zlcn0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCBTYW1wbGVJbmxpbmUgZnJvbSAnLi9TYW1wbGVJbmxpbmUnO1xuaW1wb3J0IFRvb2x0aXBUYWJsZSBmcm9tICcuLi9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUnO1xuaW1wb3J0IEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IFNwaW5uZXIgZnJvbSAncmVhY3Qtc3BpbmtpdCc7XG5cblxuY2xhc3MgUGF0aWVudEhlYWRlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgICBnZXRQb3BvdmVyKHNhbXBsZSwgbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UG9wb3ZlciBrZXk9e251bWJlcn0gaWQ9eydwb3BvdmVyLXNhbXBsZS0nICsgbnVtYmVyfT5cbiAgICAgICAgICAgICAgICA8VG9vbHRpcFRhYmxlIGRhdGE9e0ltbXV0YWJsZS5mcm9tSlMoc2FtcGxlLmNsaW5pY2FsRGF0YSl9IC8+XG4gICAgICAgICAgICA8L1BvcG92ZXI+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZHJhd0hlYWRlcigpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2FtcGxlcyAmJiB0aGlzLnByb3BzLnNhbXBsZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMucHJvcHMuc2FtcGxlcy5tYXAoKHNhbXBsZSwgbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBjbGluaWNhbERhdGEgPSB0aGlzLnByb3BzLnNhbXBsZXMuZ2V0KCdpdGVtcycpLmtleXMoKS5tYXAoYXR0cl9pZCA9PiB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgcmV0dXJuIE9iamVjdCh7J2lkJzogeCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IHRoaXMucHJvcHMuc2FtcGxlcy5nZXQoJ2l0ZW1zJykuZ2V0KGF0dHJfaWQpLmdldCgnVENHQS1QNi1BNU9ILTAxJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIH0pIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy99KS5maWx0ZXIoeCA9PiB4LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNhbXBsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPE92ZXJsYXlUcmlnZ2VyIGRlbGF5SGlkZT17MTAwfSBrZXk9e251bWJlcn0gdHJpZ2dlcj17Wydob3ZlcicsICdmb2N1cyddfSBwbGFjZW1lbnQ9XCJib3R0b21cIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxheT17dGhpcy5nZXRQb3BvdmVyKHNhbXBsZSwgbnVtYmVyKzEpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U2FtcGxlSW5saW5lIHNhbXBsZT17c2FtcGxlfSBudW1iZXI9e251bWJlcisxfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9PdmVybGF5VHJpZ2dlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5zdGF0dXMpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmV0Y2hpbmcnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+PFNwaW5uZXIgc3Bpbm5lck5hbWU9XCJ0aHJlZS1ib3VuY2VcIiAvPjwvZGl2PjtcblxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJhd0hlYWRlcigpO1xuXG4gICAgICAgICAgICBjYXNlICdlcnJvcic6XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj5UaGVyZSB3YXMgYW4gZXJyb3IuPC9kaXY+O1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2IC8+O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYXRpZW50SGVhZGVyO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyLmpzeFxuICoqLyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge0J1dHRvbiwgT3ZlcmxheVRyaWdnZXIsIFBvcG92ZXJ9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBTYW1wbGVMYWJlbEhUTUwgfSBmcm9tICcuLi9TYW1wbGVMYWJlbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNhbXBsZUlubGluZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgIGNvbnN0IHsgc2FtcGxlLCBudW1iZXIgfSA9IHRoaXMucHJvcHM7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7XCJwYWRkaW5nUmlnaHRcIjpcIjEwcHhcIn19PlxuICAgICAgICAgICAgICAgIDxTYW1wbGVMYWJlbEhUTUwgY29sb3I9eydibGFjayd9IGxhYmVsPXsobnVtYmVyKS50b1N0cmluZygpfSAvPlxuICAgICAgICAgICAgICAgIHsnICcgKyBzYW1wbGUuaWR9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICk7XG4gICAgfVxufVxuU2FtcGxlSW5saW5lLnByb3BUeXBlcyA9IHtcbiAgICBzYW1wbGU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBudW1iZXI6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvcGF0aWVudEhlYWRlci9TYW1wbGVJbmxpbmUuanN4XG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/IXNhc3Mhc2Fzcy1yZXNvdXJjZXMhLi9sb2NhbC1zdHlsZXMuc2Nzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/IXNhc3Mhc2Fzcy1yZXNvdXJjZXMhLi9sb2NhbC1zdHlsZXMuc2Nzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz8hc2FzcyFzYXNzLXJlc291cmNlcyEuL2xvY2FsLXN0eWxlcy5zY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vc3R5bGUvbG9jYWwtc3R5bGVzLnNjc3NcbiAqKiBtb2R1bGUgaWQgPSAxMTA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIiNjb250ZW50IGg0IHtcXG4gIG1hcmdpbi1ib3R0b206IDE1cHggIWltcG9ydGFudDsgfVxcbiAgI2NvbnRlbnQgaDQ6bnRoLWNoaWxkKG4rMikge1xcbiAgICBtYXJnaW4tdG9wOiAyMHB4OyB9XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlcj8hLi9+L3Nhc3MtbG9hZGVyIS4vfi9zYXNzLXJlc291cmNlcy1sb2FkZXIvbGliL2xvYWRlci5qcyEuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzXG4gKiogbW9kdWxlIGlkID0gMTExMFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==