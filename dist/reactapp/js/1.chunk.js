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
	exports.push([module.id, "#content h4 {\n  margin-bottom: 15px !important; }\n  #content h4:nth-child(n+2) {\n    margin-top: 20px; }\n", ""]);
	
	// exports


/***/ }

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvUGF0aWVudFZpZXdQYWdlLnRzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlLnRzeCIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvZGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzPzZjZjQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9mYWRlLWluLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3M/ODRkZSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NoYXNpbmctZG90cy5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzPzcwNDgiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaXJjbGUuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcz9lNjUzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvY3ViZS1ncmlkLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL2RvdWJsZS1ib3VuY2UuY3NzPzU0MTQiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9kb3VibGUtYm91bmNlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3B1bHNlLmNzcz85MzUxIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvcm90YXRpbmctcGxhbmUuY3NzP2EyYjMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy9yb3RhdGluZy1wbGFuZS5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzP2YwMTYiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy90aHJlZS1ib3VuY2UuY3NzIiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcz8xMTA0Iiwid2VicGFjazovLy8uL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dhdmUuY3NzP2JiMWUiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3M/MDA2MSIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NoYXJlZC9jb21wb25lbnRzL1B1cmlmeUNvbXBvbmVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0LWFkZG9ucy1wdXJlLXJlbmRlci1taXhpbi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0L2xpYi9SZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdC9saWIvc2hhbGxvd0NvbXBhcmUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMuanN4Iiwid2VicGFjazovLy8uL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL2xpYi9jb252ZXJ0U2FtcGxlc0RhdGEuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvUGF0aWVudEhlYWRlci50c3giLCJ3ZWJwYWNrOi8vLy4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L3BhdGllbnRIZWFkZXIvU2FtcGxlSW5saW5lLnRzeCIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2NzcyIsIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9zdHlsZS9sb2NhbC1zdHlsZXMuc2Nzcz8wNTZiIl0sIm5hbWVzIjpbImFyMSIsImFyMiIsInByb3BzIiwibG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEiLCJ0YWJJZCIsInNldFRhYiIsInNhbXBsZXMiLCJwYXRpZW50IiwiZ2V0Iiwic3RhdHVzIiwiYnVpbGRUYWJzIiwiQ29tcG9uZW50IiwiUGF0aWVudEhlYWRlciIsIkNsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXJVbmNvbm5lY3RlZCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsImJpbmQiLCJuZXdQcm9wcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwiSXRlcmFibGUiLCJpc0l0ZXJhYmxlIiwidG9KUyIsInN0YXRlIiwibXlUYWJsZURhdGEiLCJuYW1lIiwiZGF0YSIsInRvQXJyYXkiLCJjZWxscyIsIml0ZW1zIiwiaXRlbSIsImNvbHVtbnMiLCJjb2wiLCJpZCIsInB1c2giLCJhdHRyX25hbWUiLCJhdHRyX2lkIiwiYXR0cl92YWwiLCJkIiwiYXR0cmlidXRlcyIsIm1hcCIsImRhdGF0eXBlIiwiZGlzcGxheV9uYW1lIiwidW5zaGlmdCIsIkNsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGUiLCJwcm9wVHlwZXMiLCJhbnkiLCJpc1JlcXVpcmVkIiwib3V0cHV0Iiwic2FtcGxlIiwic2FtcGxlSWQiLCJjbGluaWNhbERhdGEiLCJkYXRhSXRlbSIsInZhbHVlIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBQThCOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ3ZCOztLQUE4Qjs7QUFFd0Q7Ozs7QUFDekI7Ozs7QUFhcEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNBY1E7aUJBQW1CLGdCQUFlLHlCQUFnQixnQkFBb0QsaUNBRTlGO3NCQUFPLE9BQ1gsb0JBQWMsaUJBQU8sT0FBSyxLQUFNLE1BQVUsVUFDbEMsU0FBZSxlQUkvQjtBQUVNOzs7O2tDQUVLO29CQUdYLDREQUNIOzs7O3lDQTVCdUQsT0FFaEQ7aUJBQU0sS0FBUSxNQUFJLElBQ1o7OzBCQUNTLEdBQUksSUFDVDt5QkFBSSxHQUFJLElBQ1A7MEJBQUksR0FBSSxJQUlOO0FBTkY7Ozs7O0dBTitCLE1BRXhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xCMUI7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkNBS3NCQSxHLEVBQUtDLEcsRUFBSztBQUN4QixrQkFBS0MsS0FBTCxDQUFXQyxnQ0FBWDtBQUNIOzs7NkNBRW1CO0FBQ2hCLG9CQUVJO0FBQUMsNEJBQUQ7QUFBQTtBQUNJO0FBQUMsMkJBQUQ7QUFBQTtBQUFBO0FBQUEsa0JBREo7QUFFSTtBQUFDLDJCQUFEO0FBQUE7QUFBQTtBQUFBLGtCQUZKO0FBR0k7QUFBQywyQkFBRDtBQUFBO0FBQUE7QUFBQTtBQUhKLGNBRko7QUFTSDs7O21DQUVTQyxLLEVBQU87QUFDYixrQkFBS0YsS0FBTCxDQUFXRyxNQUFYLENBQWtCRCxLQUFsQjtBQUNIOzs7cUNBRVc7QUFDUixvQkFDSTtBQUFBO0FBQUE7QUFDSTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQURKO0FBR0ksdUZBQTRCLE1BQU0sS0FBS0YsS0FBTCxDQUFXSSxPQUE3QyxHQUhKO0FBS0k7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFMSjtBQU1JLDRGQUFpQyxNQUFNLEtBQUtKLEtBQUwsQ0FBV0ssT0FBWCxDQUFtQkMsR0FBbkIsQ0FBdUIsY0FBdkIsQ0FBdkM7QUFOSixjQURKO0FBVUg7OztrQ0FFUTs7QUFFTCxxQkFBUSxLQUFLTixLQUFMLENBQVdPLE1BQW5COztBQUVJLHNCQUFLLFVBQUw7O0FBRUksNEJBQU87QUFBQTtBQUFBO0FBQUssaUZBQVMsYUFBWSxjQUFyQjtBQUFMLHNCQUFQOztBQUVKLHNCQUFLLFVBQUw7O0FBRUksNEJBQU87QUFBQTtBQUFBO0FBQU8sOEJBQUtDLFNBQUw7QUFBUCxzQkFBUDs7QUFFSixzQkFBSyxPQUFMOztBQUVJLDRCQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBQVA7O0FBRUo7O0FBRUksNEJBQU8sMENBQVA7O0FBaEJSO0FBbUJIOzs7O0dBeER3RCxnQkFBTUMsUzs7QUE2RDVELEtBQU1DLHdDQUFnQiw4RkFBdEI7O21CQUdRLHNFQUF5Q0MsdUNBQXpDLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQzdFZTs7Ozs7Ozs7QUFXOUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSVEsaUJBQVUsT0FBb0I7QUFDMUIsa0JBQU0sTUFBSyxLQUFRLFFBQUMsVUFBSztBQUNyQixzQkFBSztBQUNGO3VCQUFLLEtBQUssS0FBSSxJQUNiO0FBQUk7OztBQUFLLDhCQUFJLElBQ2I7O0FBQUk7OztBQUFLLDhCQUFJLElBR3pCOzs7QUFBRztBQUVJO0FBQ0c7bUJBQ0Y7QUFDQTs7O0FBQ0k7OztBQUNBOzs7OztBQUdKOzs7Ozs7O0FBQ0E7OztBQUlOOzs7QUFDZ0U7QUFDNUI7QUFDaEM7QUFDSjtBQUM4RDtBQUNuQztBQUNZO0FBQ3pCO0FBQytDO0FBQ1A7QUFDVztBQUNwQztBQUNlO0FBQ3RCO0FBQ3RCO0FBQ21CO0FBQ0w7QUFDZDtBQUNjO0FBQ1A7QUFDSDtBQUNKO0FBQ1M7QUFDVztBQUNBO0FBQ0U7QUFDTTtBQUNOO0FBQ1U7QUFDbkI7QUFFbkI7QUFDSDs7OztHQTVEaUUsTUFFeEQ7Ozs7Ozs7Ozs7QUNkVjs7QUFFQSxvREFBbUQsZ0JBQWdCLHNCQUFzQixPQUFPLDJCQUEyQiwwQkFBMEIseURBQXlELDJCQUEyQixFQUFFLEVBQUUsRUFBRSxlQUFlOztBQUU5UCxpQ0FBZ0MsMkNBQTJDLGdCQUFnQixrQkFBa0IsT0FBTywyQkFBMkIsd0RBQXdELGdDQUFnQyx1REFBdUQsMkRBQTJELEVBQUUsRUFBRSx5REFBeUQscUVBQXFFLDZEQUE2RCxvQkFBb0IsR0FBRyxFQUFFOztBQUVqakI7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUEsdUNBQXNDLHVDQUF1QyxnQkFBZ0I7O0FBRTdGLDRDQUEyQyxrQkFBa0Isa0NBQWtDLHFFQUFxRSxFQUFFLEVBQUUsT0FBTyxrQkFBa0IsRUFBRSxZQUFZOztBQUUvTSxrREFBaUQsMENBQTBDLDBEQUEwRCxFQUFFOztBQUV2SixrREFBaUQsYUFBYSx1RkFBdUYsRUFBRSx1RkFBdUY7O0FBRTlPLDJDQUEwQywrREFBK0QscUdBQXFHLEVBQUUseUVBQXlFLGVBQWUseUVBQXlFLEVBQUUsRUFBRSx1SEFBdUgsRUFBRTs7O0FBRzllO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTzs7QUFFUCxpREFBZ0Q7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF1QixVQUFVLHdDQUF3QztBQUN6RSxtREFBa0QsOEJBQThCO0FBQ2hGLG1EQUFrRCw4QkFBOEI7QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF1QixVQUFVLHFCQUFxQjtBQUN0RCxtREFBa0QsOEJBQThCO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBdUIsVUFBVSwrQkFBK0I7QUFDaEUsbURBQWtELHFCQUFxQjtBQUN2RSxtREFBa0QscUJBQXFCO0FBQ3ZFLG1EQUFrRCxxQkFBcUI7QUFDdkUsbURBQWtELHFCQUFxQjtBQUN2RSxtREFBa0QscUJBQXFCO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBdUIsVUFBVSwwQ0FBMEM7QUFDM0UsbURBQWtELHFCQUFxQjtBQUN2RSxtREFBa0QscUJBQXFCO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBdUIsVUFBVSxxQkFBcUI7QUFDdEQsbURBQWtELHFCQUFxQjtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXVCLFVBQVUscUJBQXFCO0FBQ3REO0FBQ0E7QUFDQSxnQkFBZSw0QkFBNEI7QUFDM0MscURBQW9ELG9CQUFvQjtBQUN4RSxxREFBb0Qsb0JBQW9CO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF1QixVQUFVLHlDQUF5QztBQUMxRSxtREFBa0QsOEJBQThCO0FBQ2hGLG1EQUFrRCw4QkFBOEI7QUFDaEYsbURBQWtELDhCQUE4QjtBQUNoRixtREFBa0QsOEJBQThCO0FBQ2hGLG1EQUFrRCw4QkFBOEI7QUFDaEYsbURBQWtELDhCQUE4QjtBQUNoRixtREFBa0QsOEJBQThCO0FBQ2hGLG1EQUFrRCw4QkFBOEI7QUFDaEYsbURBQWtELDhCQUE4QjtBQUNoRixtREFBa0QsK0JBQStCO0FBQ2pGLG1EQUFrRCwrQkFBK0I7QUFDakYsbURBQWtELCtCQUErQjtBQUNqRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXVCLFVBQVUsb0NBQW9DO0FBQ3JFLG1EQUFrRCxvQkFBb0I7QUFDdEUsbURBQWtELG9CQUFvQjtBQUN0RSxtREFBa0Qsb0JBQW9CO0FBQ3RFLG1EQUFrRCxvQkFBb0I7QUFDdEUsbURBQWtELG9CQUFvQjtBQUN0RSxtREFBa0Qsb0JBQW9CO0FBQ3RFLG1EQUFrRCxvQkFBb0I7QUFDdEUsbURBQWtELG9CQUFvQjtBQUN0RSxtREFBa0Qsb0JBQW9CO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBdUIsVUFBVSxxQkFBcUI7QUFDdEQ7QUFDQTtBQUNBLGdCQUFlLHlCQUF5QjtBQUN4QyxxREFBb0QsNEJBQTRCO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXVCLFVBQVUsdUNBQXVDO0FBQ3hFLG1EQUFrRCx1QkFBdUI7QUFDekUsbURBQWtELHVCQUF1QjtBQUN6RSxtREFBa0QsdUJBQXVCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBLEVBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsMEI7Ozs7Ozs7QUNoTkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSx1REFBc0QsUUFBUSxtQkFBbUIsS0FBSyxTQUFTLG1CQUFtQixLQUFLLFVBQVUsbUJBQW1CLEtBQUssR0FBRyw2QkFBNkIsUUFBUSxtQkFBbUIsS0FBSyxTQUFTLG1CQUFtQixLQUFLLFVBQVUsbUJBQW1CLEtBQUssR0FBRyw0QkFBNEIsUUFBUSxtQkFBbUIsS0FBSyxTQUFTLG1CQUFtQixLQUFLLFVBQVUsbUJBQW1CLEtBQUssR0FBRyx3QkFBd0IsUUFBUSxtQkFBbUIsS0FBSyxTQUFTLG1CQUFtQixLQUFLLFVBQVUsbUJBQW1CLEtBQUssR0FBRyxjQUFjLGtDQUFrQywrQkFBK0IsNkJBQTZCLDhCQUE4QixHQUFHOztBQUU1cUI7Ozs7Ozs7O0FDUEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSwwQ0FBeUMsZ0JBQWdCLGlCQUFpQix1QkFBdUIscURBQXFELDJDQUEyQyxHQUFHLGtCQUFrQixlQUFlLGdCQUFnQiwwQkFBMEIsdUJBQXVCLFdBQVcsMkJBQTJCLHdCQUF3QiwwREFBMEQsZ0RBQWdELEdBQUcsV0FBVyxjQUFjLGdCQUFnQixtQ0FBbUMsMkJBQTJCLEdBQUcsK0JBQStCLE9BQU8scUNBQXFDLHFCQUFxQixVQUFVLGdDQUFnQyx3Q0FBd0MsS0FBSyxHQUFHLCtCQUErQixjQUFjLGdDQUFnQyxTQUFTLGdDQUFnQyxHQUFHLHVCQUF1QixjQUFjLDRCQUE0QixvQ0FBb0MsS0FBSyxNQUFNLDRCQUE0QixvQ0FBb0MsS0FBSyxHQUFHOztBQUV0aUM7Ozs7Ozs7O0FDUEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSw0Q0FBMkMsZ0JBQWdCLGlCQUFpQix1QkFBdUIsR0FBRyxhQUFhLGdCQUFnQixpQkFBaUIsdUJBQXVCLFlBQVksV0FBVyxHQUFHLG9CQUFvQixnQkFBZ0IsbUJBQW1CLG1CQUFtQixlQUFlLGdCQUFnQiwyQkFBMkIsMEJBQTBCLDZEQUE2RCxxREFBcUQseUdBQXlHLDhCQUE4QixHQUFHLGVBQWUsa0NBQWtDLDZCQUE2QixhQUFhLGtDQUFrQyw2QkFBNkIsYUFBYSxrQ0FBa0MsNkJBQTZCLGFBQWEsbUNBQW1DLDRCQUE0QixhQUFhLG1DQUFtQyw0QkFBNEIsYUFBYSxtQ0FBbUMsNEJBQTRCLGFBQWEsbUNBQW1DLDRCQUE0QixhQUFhLG1DQUFtQyw0QkFBNEIsYUFBYSxtQ0FBbUMsNEJBQTRCLGFBQWEsbUNBQW1DLDRCQUE0QixhQUFhLG1DQUFtQyw0QkFBNEIsc0JBQXNCLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0JBQW9CLGdDQUFnQyx5QkFBeUIsb0NBQW9DLG1CQUFtQixnQ0FBZ0MsU0FBUyxnQ0FBZ0MsR0FBRyw0QkFBNEIsbUJBQW1CLG9DQUFvQyw0QkFBNEIsS0FBSyxNQUFNLG9DQUFvQyw0QkFBNEIsS0FBSyxHQUFHOztBQUUzakY7Ozs7Ozs7O0FDUEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSx1Q0FBc0MsZUFBZSxnQkFBZ0IsR0FBRyxXQUFXLGNBQWMsZUFBZSxvQkFBb0IsZUFBZSw0REFBNEQsb0RBQW9ELEdBQUcsZ0dBQWdHLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsK0JBQStCLCtCQUErQix5QkFBeUIsbUNBQW1DLG1CQUFtQiwyQ0FBMkMsbUJBQW1CLDJDQUEyQyxHQUFHLDJCQUEyQixtQkFBbUIsMENBQTBDLG1DQUFtQyxtQkFBbUIsMENBQTBDLG1DQUFtQyxHQUFHOztBQUV0OUM7Ozs7Ozs7O0FDUEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSwyQ0FBMEMsZ0JBQWdCLGlCQUFpQix5QkFBeUIsR0FBRyxzQ0FBc0MsZ0JBQWdCLGlCQUFpQix1QkFBdUIsMkJBQTJCLGlCQUFpQix1QkFBdUIsV0FBVyxZQUFZLDBEQUEwRCxnREFBZ0QsR0FBRyxxQkFBcUIsbUNBQW1DLDJCQUEyQixHQUFHLCtCQUErQixjQUFjLGdDQUFnQyxTQUFTLGdDQUFnQyxHQUFHLHVCQUF1QixjQUFjLDRCQUE0QixvQ0FBb0MsS0FBSyxNQUFNLDRCQUE0QixvQ0FBb0MsS0FBSyxHQUFHOztBQUVueEI7Ozs7Ozs7O0FDUEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSxtQ0FBa0MsZ0JBQWdCLGlCQUFpQiwyQkFBMkIsMEJBQTBCLDBEQUEwRCxrREFBa0QsR0FBRyxpQ0FBaUMsUUFBUSxnQ0FBZ0MsVUFBVSxvQ0FBb0MsaUJBQWlCLEtBQUssR0FBRyx5QkFBeUIsUUFBUSw0QkFBNEIsb0NBQW9DLEtBQUssT0FBTyw0QkFBNEIsb0NBQW9DLGlCQUFpQixLQUFLLEdBQUc7O0FBRTdqQjs7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLDRDQUEyQyxnQkFBZ0IsaUJBQWlCLDJCQUEyQiwrREFBK0QscURBQXFELEdBQUcsb0NBQW9DLFFBQVEsd0NBQXdDLFNBQVMsd0RBQXdELFVBQVUseUVBQXlFLEdBQUcsNEJBQTRCLFFBQVEsZ0VBQWdFLHdFQUF3RSxLQUFLLE1BQU0scUVBQXFFLDZFQUE2RSxLQUFLLE9BQU8sd0VBQXdFLGdGQUFnRixLQUFLLEdBQUc7O0FBRTk3Qjs7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLGdEQUErQyxnQkFBZ0IsaUJBQWlCLDJCQUEyQiwwQkFBMEIsMEJBQTBCLDZEQUE2RCxxREFBcUQseUdBQXlHLDhCQUE4QixHQUFHLDRCQUE0QixvQ0FBb0MsNEJBQTRCLEdBQUcsNEJBQTRCLG9DQUFvQyw0QkFBNEIsR0FBRyxvQ0FBb0MsbUJBQW1CLGdDQUFnQyxTQUFTLGdDQUFnQyxHQUFHLDRCQUE0QixtQkFBbUIsNEJBQTRCLG9DQUFvQyxLQUFLLE1BQU0sNEJBQTRCLG9DQUFvQyxLQUFLLEdBQUc7O0FBRTk1Qjs7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLDZDQUE0QyxnQkFBZ0IsaUJBQWlCLHVCQUF1QixHQUFHLG9CQUFvQiwyQkFBMkIsZ0JBQWdCLGlCQUFpQix1QkFBdUIsV0FBVyxZQUFZLDREQUE0RCxrREFBa0QsR0FBRyxZQUFZLG1DQUFtQywyQkFBMkIsR0FBRyxpQ0FBaUMsU0FBUyxnRUFBZ0UsU0FBUyx1RUFBdUUsU0FBUyxpRkFBaUYsVUFBVSxxQ0FBcUMsR0FBRyx5QkFBeUIsU0FBUyw2REFBNkQsb0VBQW9FLEtBQUssTUFBTSw0SEFBNEgsMkVBQTJFLEtBQUssUUFBUSxtRUFBbUUsMkVBQTJFLEtBQUssTUFBTSw2RUFBNkUscUZBQXFGLEtBQUssT0FBTyxpQ0FBaUMseUNBQXlDLEtBQUssR0FBRzs7QUFFcGdEOzs7Ozs7OztBQ1BBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQXNFO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsaUNBQWdDLFVBQVUsRUFBRTtBQUM1QyxFOzs7Ozs7O0FDcEJBO0FBQ0E7OztBQUdBO0FBQ0Esa0NBQWlDLGdCQUFnQixpQkFBaUIsR0FBRyxpQkFBaUIsMkJBQTJCLGlCQUFpQixlQUFlLDBCQUEwQixnRUFBZ0Usc0RBQXNELEdBQUcsa0JBQWtCLG1DQUFtQywyQkFBMkIsR0FBRyxrQkFBa0IsbUNBQW1DLDJCQUEyQixHQUFHLGtCQUFrQixtQ0FBbUMsMkJBQTJCLEdBQUcsa0JBQWtCLG1DQUFtQywyQkFBMkIsR0FBRyxxQ0FBcUMsbUJBQW1CLGlDQUFpQyxTQUFTLGlDQUFpQyxHQUFHLDZCQUE2QixtQkFBbUIsNkJBQTZCLHFDQUFxQyxLQUFLLE1BQU0sNkJBQTZCLHFDQUFxQyxLQUFLLEdBQUc7O0FBRTc3Qjs7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLHVDQUFzQyxxQkFBcUIsZ0JBQWdCLGlCQUFpQiwwQkFBMEIsd0JBQXdCLHVCQUF1Qix1REFBdUQsK0NBQStDLEdBQUcsbUJBQW1CLG1CQUFtQixxQkFBcUIsZUFBZSxnQkFBZ0IsdUJBQXVCLHVCQUF1QixhQUFhLGNBQWMsR0FBRyxxQ0FBcUMsUUFBUSw4QkFBOEIsRUFBRSxVQUFVLG1DQUFtQyxFQUFFLEdBQUcsNkJBQTZCLFFBQVEsc0JBQXNCLDZCQUE2QixFQUFFLFVBQVUsMkJBQTJCLGtDQUFrQyxFQUFFLEdBQUc7O0FBRXp0Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdJLDhCQUFZWCxLQUFaLEVBQW1CO0FBQUE7O0FBQUEsdUlBQ1RBLEtBRFM7O0FBRWYsZUFBS1kscUJBQUwsR0FBNkIscUNBQWdCQSxxQkFBaEIsQ0FBc0NDLElBQXRDLE9BQTdCO0FBRmU7QUFHbEI7Ozs7a0NBRVE7QUFBQTs7QUFDTCxpQkFBTUMsV0FBVyxFQUFqQjs7QUFFQUMsb0JBQU9DLElBQVAsQ0FBWSxLQUFLaEIsS0FBakIsRUFBd0JpQixPQUF4QixDQUFnQyxVQUFDQyxHQUFELEVBQVM7QUFDckMscUJBQUlBLFFBQVEsV0FBWixFQUF5QjtBQUNyQix5QkFBSSxvQkFBVUMsUUFBVixDQUFtQkMsVUFBbkIsQ0FBOEIsT0FBS3BCLEtBQUwsQ0FBV2tCLEdBQVgsQ0FBOUIsQ0FBSixFQUFvRDtBQUNoREosa0NBQVNJLEdBQVQsSUFBZ0IsT0FBS2xCLEtBQUwsQ0FBV2tCLEdBQVgsRUFBZ0JHLElBQWhCLEVBQWhCO0FBQ0gsc0JBRkQsTUFFTztBQUNIUCxrQ0FBU0ksR0FBVCxJQUFnQixPQUFLbEIsS0FBTCxDQUFXa0IsR0FBWCxDQUFoQjtBQUNIO0FBQ0o7QUFDSixjQVJEOztBQVVBLG9CQUFPLG1DQUFNLEtBQU4sQ0FBWSxTQUFaLEVBQTBCSixRQUExQixDQUFQO0FBQ0g7Ozs7R0FwQndDLGdCQUFNTCxTOzs7Ozs7Ozs7O0FDSm5ELDJDOzs7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWdDLHFCQUFxQjtBQUNyRDtBQUNBLE9BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvRDs7Ozs7OztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RCQTs7OztBQUVBOztBQUVBOzs7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUksOENBQVlULEtBQVosRUFBbUI7QUFBQTs7QUFBQSx1S0FDVEEsS0FEUzs7QUFHZixlQUFLc0IsS0FBTCxHQUFhO0FBQ1RDLDBCQUFhLENBQ1QsRUFBRUMsTUFBTSxPQUFSLEVBRFMsRUFFVCxFQUFFQSxNQUFNLFFBQVIsRUFGUyxFQUdULEVBQUVBLE1BQU0sU0FBUixFQUhTLEVBSVQsRUFBRUEsTUFBTSxVQUFSLEVBSlMsRUFLVCxFQUFFQSxNQUFNLFFBQVIsRUFMUztBQURKLFVBQWI7QUFIZTtBQVlsQjs7OztrQ0FFUTtBQUNMLGlCQUFNQyxPQUFPLGtDQUFpQixLQUFLekIsS0FBTCxDQUFXeUIsSUFBWCxDQUFnQkMsT0FBaEIsRUFBakIsQ0FBYjs7QUFFQSxpQkFBTUMsUUFBUSxFQUFkOztBQUVBWixvQkFBT0MsSUFBUCxDQUFZUyxLQUFLRyxLQUFqQixFQUF3QlgsT0FBeEIsQ0FBZ0MsVUFBQ0MsR0FBRCxFQUFTO0FBQ3JDLHFCQUFNVyxPQUFPSixLQUFLRyxLQUFMLENBQVdWLEdBQVgsQ0FBYjs7QUFFQU8sc0JBQUtLLE9BQUwsQ0FBYWIsT0FBYixDQUFxQixVQUFDYyxHQUFELEVBQVM7QUFDMUIseUJBQUlBLElBQUlDLEVBQUosSUFBVUgsSUFBZCxFQUFvQjtBQUNoQkYsK0JBQU1NLElBQU4sQ0FBVyxFQUFFQyxXQUFXaEIsR0FBYixFQUFrQmlCLFNBQVNKLElBQUlDLEVBQS9CLEVBQW1DSSxVQUFVUCxLQUFLRSxJQUFJQyxFQUFULENBQTdDLEVBQVg7QUFDSCxzQkFGRCxNQUVPO0FBQ0hMLCtCQUFNTSxJQUFOLENBQVcsRUFBRUMsV0FBV2hCLEdBQWIsRUFBa0JpQixTQUFTSixJQUFJQyxFQUEvQixFQUFtQ0ksVUFBVSxLQUE3QyxFQUFYO0FBQ0g7QUFDSixrQkFORDtBQU9ILGNBVkQ7O0FBWUEsaUJBQU1DLElBQUk7QUFDTkMsNkJBQVliLEtBQUtLLE9BQUwsQ0FBYVMsR0FBYixDQUFpQixVQUFDUixHQUFELEVBQVM7QUFDbEMsNEJBQU8sRUFBRUksU0FBU0osSUFBSUMsRUFBZixFQUFtQlEsVUFBVSxRQUE3QixFQUF1Q0MsY0FBY1YsSUFBSUMsRUFBekQsRUFBUDtBQUNILGtCQUZXLENBRE47QUFJTlAsdUJBQU1FO0FBSkEsY0FBVjs7QUFPQVUsZUFBRUMsVUFBRixDQUFhSSxPQUFiLENBQXFCLEVBQUVQLFNBQVMsV0FBWCxFQUF3QkssVUFBVSxRQUFsQyxFQUE0Q0MsY0FBYyxXQUExRCxFQUFyQjs7QUFFQSxvQkFBTyxrRUFBd0IsT0FBT0osQ0FBL0IsRUFBa0MsYUFBYSxLQUEvQyxFQUFzRCxRQUFPLFFBQTdELEVBQXNFLFdBQVcsRUFBakYsRUFBcUYsY0FBYyxFQUFuRyxFQUF1RyxVQUFTLEtBQWhILEVBQXNILFVBQVMsV0FBL0gsRUFBMkksWUFBWSxJQUF2SixFQUE2SixpQkFBaUIsSUFBOUssR0FBUDtBQUNIOzs7O0dBM0NnRCxnQkFBTTVCLFM7O21CQThDNUNrQywrQjs7O0FBR2ZBLGlDQUFnQ0MsU0FBaEMsR0FBNEM7QUFDeENuQixXQUFNLGtCQUFFb0IsR0FBRixDQUFNQztBQUQ0QixFQUE1QyxDOzs7Ozs7Ozs7Ozs7OzttQkMzRGUsVUFBVXJCLElBQVYsRUFBZ0I7QUFDM0IsU0FBTXNCLFNBQVMsRUFBRWpCLFNBQVMsRUFBWCxFQUFlRixPQUFPLEVBQXRCLEVBQWY7O0FBRUFILFVBQUtSLE9BQUwsQ0FBYSxVQUFDK0IsTUFBRCxFQUFZO0FBQ3JCLGFBQU1DLFdBQVdELE9BQU9oQixFQUF4Qjs7QUFFQWUsZ0JBQU9qQixPQUFQLENBQWVHLElBQWYsQ0FBb0IsRUFBRUQsSUFBSWlCLFFBQU4sRUFBcEI7O0FBRUFELGdCQUFPRSxZQUFQLENBQW9CakMsT0FBcEIsQ0FBNEIsVUFBQ2tDLFFBQUQsRUFBYztBQUN0Q0osb0JBQU9uQixLQUFQLENBQWF1QixTQUFTbkIsRUFBdEIsSUFBNEJlLE9BQU9uQixLQUFQLENBQWF1QixTQUFTbkIsRUFBdEIsS0FBNkIsRUFBekQ7QUFDQWUsb0JBQU9uQixLQUFQLENBQWF1QixTQUFTbkIsRUFBdEIsRUFBMEJpQixRQUExQixJQUFzQ0UsU0FBU0MsS0FBVCxDQUFlQyxRQUFmLEVBQXRDO0FBQ0FOLG9CQUFPbkIsS0FBUCxDQUFhdUIsU0FBU25CLEVBQXRCLEVBQTBCUixJQUExQixHQUFpQzJCLFNBQVMzQixJQUExQztBQUNBdUIsb0JBQU9uQixLQUFQLENBQWF1QixTQUFTbkIsRUFBdEIsRUFBMEJBLEVBQTFCLEdBQStCbUIsU0FBU25CLEVBQXhDO0FBQ0gsVUFMRDtBQU1ILE1BWEQ7O0FBYUEsWUFBT2UsTUFBUDtBQUNILEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tDaEI2Qjs7Ozs7Ozs7QUFDaUM7O0FBQ3RCOzs7O0FBQ3dDOzs7O0FBQzFFOztLQUErQjs7QUFldEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0FFNEIsUUFBZTtBQUU1QjtBQUNLO21CQUFLLEtBQVEsUUFBSSxJQUFrQixvQkFDdkM7QUFBYSxrRkFBTSxNQUFVLFVBQU8sT0FBTyxPQUd2RDs7QUFFVTs7Ozs7O0FBRUgsaUJBQUssS0FBTSxNQUFRLFdBQVEsS0FBTSxNQUFRLFFBQUssT0FBSyxHQUNyRDtBQUNVO0FBRUM7O0FBQUssMEJBQU0sTUFBUSxRQUFJLElBQUMsVUFBYyxRQUFlO0FBQzRCO0FBQy9DO0FBQ2tFO0FBQ3ZGO0FBQ2lCO0FBQ25CLGlDQUFJLElBQVM7QUFFYjtBQUNZOytCQUFXLFdBQUssS0FBSyxLQUFRLFFBQVMsU0FBQyxDQUFRLFNBQVcsVUFBVSxXQUFTLFVBQ25GLFNBQUssT0FBVyxXQUFPLFFBQVEsU0FDcEM7QUFDSTs7O0FBQWEsK0VBQVEsUUFBUSxRQUFRLFFBQU8sU0FJNUQ7OztBQUdaOztBQUNJLG9CQUNIO0FBQ1M7QUFDVjs7OztBQUNKO0FBRU07Ozs7QUFFSyxxQkFBSyxLQUFNLE1BQ2pCO0FBQ0csc0JBQWU7QUFDTDtBQUFLOztBQUFTLHVFQUFZLGFBQXlCOztBQUU3RCxzQkFBZTtBQUNMLDRCQUFLLEtBQWM7QUFFN0Isc0JBQVk7QUFDRjtBQUFnQzs7OztBQUUxQztBQUNVLDRCQUVsQjs7QUFDSDs7OztHQTVEK0MsTUFFbEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tDdEJnQjs7Ozs7Ozs7QUFZOUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWMsMEJBQXlCLEtBQU87aUJBQXhCO2lCQUFVOztBQUNqQjtBQUNFO21CQUFPLE9BQUMsRUFBZSxnQkFDeEI7QUFBZ0IscUVBQU8sT0FBUyxTQUFPLE9BQVMsTUFBUixDQUN4QztBQUFJLHVCQUFTLE9BR3pCOztBQUNIOzs7O0dBWjhDLE1BRXJDOzs7Ozs7Ozs7O0FDZFY7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBNEY7QUFDNUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7Ozs7QUNwQkE7QUFDQTs7O0FBR0E7QUFDQSx3Q0FBdUMsbUNBQW1DLEVBQUUsZ0NBQWdDLHVCQUF1QixFQUFFOztBQUVySSIsImZpbGUiOiJyZWFjdGFwcC9qcy8xLmNodW5rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7QnV0dG9uLCBPdmVybGF5LCBUb29sdGlwLCBQb3BvdmVyfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IENsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXIgZnJvbSAnLi9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXInO1xuaW1wb3J0IFBhdGllbnRIZWFkZXJVbmNvbm5lY3RlZCBmcm9tICcuL3BhdGllbnRIZWFkZXIvUGF0aWVudEhlYWRlcic7XG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0ICogYXMgSW1tdXRhYmxlIGZyb20gXCJpbW11dGFibGVcIjtcbmltcG9ydCBPcmRlcmVkTWFwID0gSW1tdXRhYmxlLk9yZGVyZWRNYXA7XG5pbXBvcnQge1BhdGllbnRIZWFkZXJQcm9wc30gZnJvbSBcIi4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyXCI7XG5cbnR5cGUgVE9ETyA9IGFueTtcblxuaW50ZXJmYWNlIFBhdGllbnRWaWV3UGFnZVByb3BzXG57XG4gICAgc3RvcmU/OiBUT0RPO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRpZW50Vmlld1BhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UGF0aWVudFZpZXdQYWdlUHJvcHMsIHt9Plxue1xuICAgIHN0YXRpYyBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6T3JkZXJlZE1hcDxzdHJpbmcsIGFueT4pOlBhdGllbnRIZWFkZXJQcm9wc1xuICAgIHtcbiAgICAgICAgbGV0IGNpID0gc3RhdGUuZ2V0KCdjbGluaWNhbEluZm9ybWF0aW9uJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzYW1wbGVzOiBjaS5nZXQoJ3NhbXBsZXMnKSxcbiAgICAgICAgICAgIHN0YXR1czogY2kuZ2V0KCdzdGF0dXMnKSxcbiAgICAgICAgICAgIHBhdGllbnQ6IGNpLmdldCgncGF0aWVudCcpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KClcbiAgICB7XG4gICAgICAgIGNvbnN0IFBhdGllbnRIZWFkZXI6VE9ETyA9IGNvbm5lY3QoUGF0aWVudFZpZXdQYWdlLm1hcFN0YXRlVG9Qcm9wcykoUGF0aWVudEhlYWRlclVuY29ubmVjdGVkIGFzIFRPRE8pO1xuXG4gICAgICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgICAgICAgIDxQYXRpZW50SGVhZGVyIHN0b3JlPXt0aGlzLnByb3BzLnN0b3JlfSAvPixcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xpbmljYWxfZGl2XCIpIGFzIEVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgICAgLy9SZWFjdERPTS5yZW5kZXIoPGRpdj48RXhhbXBsZSAvPjxFeGFtcGxlIC8+PC9kaXY+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNsaW5pY2FsX2RpdlwiKSBhcyBFbGVtZW50KTtcblxuICAgIH1cblxuICAgIHJlbmRlcigpXG4gICAge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPENsaW5pY2FsSW5mb3JtYXRpb25Db250YWluZXIgLz5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9QYXRpZW50Vmlld1BhZ2UudHN4XG4gKiovIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IENsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUgZnJvbSAnLi9DbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlJztcbmltcG9ydCBQRFhUcmVlIGZyb20gJy4vUERYVHJlZSc7XG5pbXBvcnQgU3Bpbm5lciBmcm9tICdyZWFjdC1zcGlua2l0JztcbmltcG9ydCB7IGFjdGlvbkNyZWF0b3JzLCBtYXBTdGF0ZVRvUHJvcHMgfSBmcm9tICcuL2R1Y2snO1xuaW1wb3J0IFB1cmlmeUNvbXBvbmVudCBmcm9tICdzaGFyZWQvY29tcG9uZW50cy9QdXJpZnlDb21wb25lbnQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCBDbGluaWNhbEluZm9ybWF0aW9uU2FtcGxlcyBmcm9tICcuL0NsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzJztcbmltcG9ydCBQYXRpZW50SGVhZGVyVW5jb25uZWN0ZWQgZnJvbSAnLi4vcGF0aWVudEhlYWRlci9QYXRpZW50SGVhZGVyJztcblxuaW1wb3J0ICcuL3N0eWxlL2xvY2FsLXN0eWxlcy5zY3NzJztcblxuXG5leHBvcnQgY2xhc3MgQ2xpbmljYWxJbmZvcm1hdGlvbkNvbnRhaW5lclVuY29ubmVjdGVkIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICAgIGNvbXBvbmVudERpZE1vdW50KGFyMSwgYXIyKSB7XG4gICAgICAgIHRoaXMucHJvcHMubG9hZENsaW5pY2FsSW5mb3JtYXRpb25UYWJsZURhdGEoKTtcbiAgICB9XG5cbiAgICBidWlsZEJ1dHRvbkdyb3VwcygpIHtcbiAgICAgICAgcmV0dXJuIChcblxuICAgICAgICAgICAgPEJ1dHRvbkdyb3VwPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q29weTwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24+Q1NWPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbj5TaG93L0hpZGUgQ29sdW1uczwvQnV0dG9uPlxuICAgICAgICAgICAgPC9CdXR0b25Hcm91cD5cblxuICAgICAgICApO1xuICAgIH1cblxuICAgIHNlbGVjdFRhYih0YWJJZCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldFRhYih0YWJJZCk7XG4gICAgfVxuXG4gICAgYnVpbGRUYWJzKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDQ+U2FtcGxlczwvaDQ+XG5cbiAgICAgICAgICAgICAgICA8Q2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMgZGF0YT17dGhpcy5wcm9wcy5zYW1wbGVzfSAvPlxuXG4gICAgICAgICAgICAgICAgPGg0PlBhdGllbnQ8L2g0PlxuICAgICAgICAgICAgICAgIDxDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlIGRhdGE9e3RoaXMucHJvcHMucGF0aWVudC5nZXQoJ2NsaW5pY2FsRGF0YScpfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5wcm9wcy5zdGF0dXMpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmV0Y2hpbmcnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+PFNwaW5uZXIgc3Bpbm5lck5hbWU9XCJ0aHJlZS1ib3VuY2VcIiAvPjwvZGl2PjtcblxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+eyB0aGlzLmJ1aWxkVGFicygpIH08L2Rpdj47XG5cbiAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcblxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiAvPjtcblxuICAgICAgICB9XG4gICAgfVxuXG5cbn1cblxuZXhwb3J0IGNvbnN0IFBhdGllbnRIZWFkZXIgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcyxcbiAgICBhY3Rpb25DcmVhdG9ycykoUGF0aWVudEhlYWRlclVuY29ubmVjdGVkKTtcblxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIGFjdGlvbkNyZWF0b3JzKShDbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyVW5jb25uZWN0ZWQpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvY2xpbmljYWxJbmZvcm1hdGlvbi9DbGluaWNhbEluZm9ybWF0aW9uQ29udGFpbmVyLmpzeFxuICoqLyIsImltcG9ydCB7TGlzdH0gZnJvbSBcImltbXV0YWJsZVwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0ICogYXMgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5cbnR5cGUgVE9ETyA9IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlUHJvcHNcbntcbiAgICBkYXRhOiBMaXN0PFRPRE8+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbGluaWNhbEluZm9ybWF0aW9uUGF0aWVudFRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PENsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGVQcm9wcywge30+XG57XG4gICAgcmVuZGVyKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHJvd3M6SlNYLkVsZW1lbnRbXSA9IFtdO1xuICAgICAgICB0aGlzLnByb3BzLmRhdGEuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0uZ2V0KCdpZCcpfT5cbiAgICAgICAgICAgICAgICAgICAgPHRkPntpdGVtLmdldCgnaWQnKX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQ+e2l0ZW0uZ2V0KCd2YWx1ZScpfTwvdGQ+XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8VGFibGUgc3RyaXBlZD5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICA8dGg+QXR0cmlidXRlPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPHRoPlZhbHVlPC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG5cbiAgICAgICAgICAgIDwvVGFibGU+XG4gICAgICAgICk7XG4gICAgICAgIC8vIGNvbnN0IGhlYWRlckNlbGxzID0gdGhpcy5wcm9wcy5kYXRhLmdldCgnY29sdW1ucycpLm1hcCgoY29sKT0+e1xuICAgICAgICAvLyAgICAgcmV0dXJuIDx0aD57Y29sLmdldCgnaWQnKX08L3RoPlxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc3Qgcm93cyA9IHRoaXMucHJvcHMuZGF0YS5nZXQoJ2l0ZW1zJykubWFwKChyb3csIGtleSkgPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuICg8dHIga2V5PXtrZXl9PlxuICAgICAgICAvLyAgICAgICAgICAgICA8dGg+e3Jvdy5nZXQoJ25hbWUnKX08L3RoPlxuICAgICAgICAvLyAgICAgICAgICAgICB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmRhdGEuZ2V0KCdjb2x1bW5zJykubWFwKChjb2wpPT4ge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGNvbC5nZXQoJ2lkJykgaW4gcm93LnRvSlMoKSkge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPHRkPntyb3cuZ2V0KGNvbC5nZXQoJ2lkJykpfTwvdGQ+XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDx0ZD5OL0E8L3RkPlxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIC8vICAgICAgICAgICAgIH1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICAgICA8L3RyPlxuICAgICAgICAvLyAgICAgKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiAoXG4gICAgICAgIC8vICAgICA8VGFibGUgc3RyaXBlZD5cbiAgICAgICAgLy8gICAgICAgICA8dGhlYWQ+PHRyPlxuICAgICAgICAvLyAgICAgICAgICAgICA8dGg+PC90aD5cbiAgICAgICAgLy8gICAgICAgICAgICAgeyBoZWFkZXJDZWxscyB9XG4gICAgICAgIC8vICAgICAgICAgPC90cj48L3RoZWFkPlxuICAgICAgICAvLyAgICAgICAgIDx0Ym9keT57IHJvd3MgfTwvdGJvZHk+XG4gICAgICAgIC8vICAgICA8L1RhYmxlPlxuICAgICAgICAvLyApO1xuICAgIH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvblBhdGllbnRUYWJsZS50c3hcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgX29iamVjdEFzc2lnbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9vYmplY3RBc3NpZ24pO1xuXG5yZXF1aXJlKCcuLi9jc3MvZmFkZS1pbi5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL2NoYXNpbmctZG90cy5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL2NpcmNsZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL2N1YmUtZ3JpZC5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL2RvdWJsZS1ib3VuY2UuY3NzJyk7XG5cbnJlcXVpcmUoJy4uL2Nzcy9wdWxzZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3JvdGF0aW5nLXBsYW5lLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3MvdGhyZWUtYm91bmNlLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3Mvd2FuZGVyaW5nLWN1YmVzLmNzcycpO1xuXG5yZXF1aXJlKCcuLi9jc3Mvd2F2ZS5jc3MnKTtcblxucmVxdWlyZSgnLi4vY3NzL3dvcmRwcmVzcy5jc3MnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuXG5cbnZhciBTcGlubmVyID0gZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKFNwaW5uZXIsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIFNwaW5uZXIocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgU3Bpbm5lcik7XG5cbiAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoU3Bpbm5lcikuY2FsbCh0aGlzLCBwcm9wcykpO1xuXG4gICAgX3RoaXMuZGlzcGxheU5hbWUgPSAnU3BpbktpdCc7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFNwaW5uZXIsIFt7XG4gICAga2V5OiAncmVuZGVyJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgdmFyIF9jeDtcblxuICAgICAgdmFyIGNsYXNzZXMgPSAoMCwgX2NsYXNzbmFtZXMyLmRlZmF1bHQpKChfY3ggPSB7XG4gICAgICAgICdmYWRlLWluJzogIXRoaXMucHJvcHMubm9GYWRlSW4sXG4gICAgICAgIHNwaW5uZXI6IHRoaXMucHJvcHMub3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lID09PSAnJ1xuICAgICAgfSwgX2RlZmluZVByb3BlcnR5KF9jeCwgdGhpcy5wcm9wcy5vdmVycmlkZVNwaW5uZXJDbGFzc05hbWUsICEhdGhpcy5wcm9wcy5vdmVycmlkZVNwaW5uZXJDbGFzc05hbWUpLCBfZGVmaW5lUHJvcGVydHkoX2N4LCB0aGlzLnByb3BzLmNsYXNzTmFtZSwgISF0aGlzLnByb3BzLmNsYXNzTmFtZSksIF9jeCkpO1xuXG4gICAgICB2YXIgcHJvcHMgPSAoMCwgX29iamVjdEFzc2lnbjIuZGVmYXVsdCkoe30sIHRoaXMucHJvcHMpO1xuICAgICAgZGVsZXRlIHByb3BzLnNwaW5uZXJOYW1lO1xuICAgICAgZGVsZXRlIHByb3BzLm5vRmFkZUluO1xuICAgICAgZGVsZXRlIHByb3BzLm92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZTtcbiAgICAgIGRlbGV0ZSBwcm9wcy5jbGFzc05hbWU7XG5cbiAgICAgIHZhciBzcGlubmVyRWwgPSB2b2lkIDA7XG4gICAgICBzd2l0Y2ggKHRoaXMucHJvcHMuc3Bpbm5lck5hbWUpIHtcbiAgICAgICAgY2FzZSAnZG91YmxlLWJvdW5jZSc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICdkb3VibGUtYm91bmNlICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnZG91YmxlLWJvdW5jZTEnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnZG91YmxlLWJvdW5jZTInIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncm90YXRpbmctcGxhbmUnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncm90YXRpbmctcGxhbmUnIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2F2ZSc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6ICd3YXZlICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncmVjdDEnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncmVjdDInIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncmVjdDMnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncmVjdDQnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAncmVjdDUnIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2FuZGVyaW5nLWN1YmVzJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ3dhbmRlcmluZy1jdWJlcyAnICsgY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUxJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUyJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bHNlJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ3B1bHNlJyB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NoYXNpbmctZG90cyc6XG4gICAgICAgICAgc3Bpbm5lckVsID0gX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgIF9leHRlbmRzKHt9LCBwcm9wcywgeyBjbGFzc05hbWU6IGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAnY2hhc2luZy1kb3RzJyB9LFxuICAgICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdkb3QxJyB9KSxcbiAgICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnZG90MicgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjaXJjbGUnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAnY2lyY2xlLXdyYXBwZXIgJyArIGNsYXNzZXMgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUxIGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUyIGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUzIGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU0IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU1IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU2IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU3IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU4IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGU5IGNpcmNsZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjaXJjbGUxMCBjaXJjbGUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY2lyY2xlMTEgY2lyY2xlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2NpcmNsZTEyIGNpcmNsZScgfSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjdWJlLWdyaWQnOlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAnY3ViZS1ncmlkICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnY3ViZScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdjdWJlJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2N1YmUnIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd29yZHByZXNzJzpcbiAgICAgICAgICBzcGlubmVyRWwgPSBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogY2xhc3NlcyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICAgICAgeyBjbGFzc05hbWU6ICd3b3JkcHJlc3MnIH0sXG4gICAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2lubmVyLWNpcmNsZScgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0aHJlZS1ib3VuY2UnOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHNwaW5uZXJFbCA9IF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiAndGhyZWUtYm91bmNlICcgKyBjbGFzc2VzIH0pLFxuICAgICAgICAgICAgX3JlYWN0Mi5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnYm91bmNlMScgfSksXG4gICAgICAgICAgICBfcmVhY3QyLmRlZmF1bHQuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdib3VuY2UyJyB9KSxcbiAgICAgICAgICAgIF9yZWFjdDIuZGVmYXVsdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2JvdW5jZTMnIH0pXG4gICAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzcGlubmVyRWw7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFNwaW5uZXI7XG59KF9yZWFjdDIuZGVmYXVsdC5Db21wb25lbnQpO1xuXG5TcGlubmVyLnByb3BUeXBlcyA9IHtcbiAgc3Bpbm5lck5hbWU6IF9yZWFjdDIuZGVmYXVsdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gIG5vRmFkZUluOiBfcmVhY3QyLmRlZmF1bHQuUHJvcFR5cGVzLmJvb2wsXG4gIG92ZXJyaWRlU3Bpbm5lckNsYXNzTmFtZTogX3JlYWN0Mi5kZWZhdWx0LlByb3BUeXBlcy5zdHJpbmcsXG4gIGNsYXNzTmFtZTogX3JlYWN0Mi5kZWZhdWx0LlByb3BUeXBlcy5zdHJpbmdcbn07XG5cblNwaW5uZXIuZGVmYXVsdFByb3BzID0ge1xuICBzcGlubmVyTmFtZTogJ3RocmVlLWJvdW5jZScsXG4gIG5vRmFkZUluOiBmYWxzZSxcbiAgb3ZlcnJpZGVTcGlubmVyQ2xhc3NOYW1lOiAnJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGlubmVyO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvZGlzdC9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDgyOVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2ZhZGUtaW4uY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9mYWRlLWluLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZmFkZS1pbi5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL2ZhZGUtaW4uY3NzXG4gKiogbW9kdWxlIGlkID0gODMwXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiQC13ZWJraXQta2V5ZnJhbWVzIGZhZGUtaW4ge1xcbiAgMCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICA1MCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICAxMDAlIHtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgfVxcbn1cXG5cXG5ALW1vei1rZXlmcmFtZXMgZmFkZS1pbiB7XFxuICAwJSB7XFxuICAgICAgb3BhY2l0eTogMDtcXG4gIH1cXG4gIDUwJSB7XFxuICAgICAgb3BhY2l0eTogMDtcXG4gIH1cXG4gIDEwMCUge1xcbiAgICAgIG9wYWNpdHk6IDE7XFxuICB9XFxufVxcblxcbkAtbXMta2V5ZnJhbWVzIGZhZGUtaW4ge1xcbiAgMCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICA1MCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICAxMDAlIHtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIGZhZGUtaW4ge1xcbiAgMCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICA1MCUge1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICB9XFxuICAxMDAlIHtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgfVxcbn1cXG5cXG4uZmFkZS1pbiB7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG4gIC1tb3otYW5pbWF0aW9uOiBmYWRlLWluIDJzO1xcbiAgLW8tYW5pbWF0aW9uOiBmYWRlLWluIDJzO1xcbiAgLW1zLWFuaW1hdGlvbjogZmFkZS1pbiAycztcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvZmFkZS1pbi5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaGFzaW5nLWRvdHMuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaGFzaW5nLWRvdHMuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jaGFzaW5nLWRvdHMuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jaGFzaW5nLWRvdHMuY3NzXG4gKiogbW9kdWxlIGlkID0gODMyXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLmNoYXNpbmctZG90cyB7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiByb3RhdGUgMi4wcyBpbmZpbml0ZSBsaW5lYXI7XFxuICBhbmltYXRpb246IHJvdGF0ZSAyLjBzIGluZmluaXRlIGxpbmVhcjtcXG59XFxuXFxuLmRvdDEsIC5kb3QyIHtcXG4gIHdpZHRoOiA2MCU7XFxuICBoZWlnaHQ6IDYwJTtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHRvcDogMDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBib3JkZXItcmFkaXVzOiAxMDAlO1xcblxcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZSAyLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLmRvdDIge1xcbiAgdG9wOiBhdXRvO1xcbiAgYm90dG9tOiAwcHg7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0xLjBzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgcm90YXRlIHsgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKSB9fVxcbkBrZXlmcmFtZXMgcm90YXRlIHtcXG4gIDEwMCUge1xcbiAgICB0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7XFxuICB9XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBib3VuY2Uge1xcbiAgMCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNTAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvY2hhc2luZy1kb3RzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDgzM1xuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NpcmNsZS5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NpcmNsZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NpcmNsZS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NpcmNsZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuY2lyY2xlLXdyYXBwZXIge1xcbiAgd2lkdGg6IDIycHg7XFxuICBoZWlnaHQ6IDIycHg7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxufVxcblxcbi5jaXJjbGUge1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBsZWZ0OiAwO1xcbiAgdG9wOiAwO1xcbn1cXG5cXG4uY2lyY2xlOmJlZm9yZSB7XFxuICBjb250ZW50OiAnJztcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgbWFyZ2luOiAwIGF1dG87XFxuICB3aWR0aDogMjAlO1xcbiAgaGVpZ2h0OiAyMCU7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcblxcbiAgYm9yZGVyLXJhZGl1czogMTAwJTtcXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBib3VuY2VkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBib3VuY2VkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgLyogUHJldmVudCBmaXJzdCBmcmFtZSBmcm9tIGZsaWNrZXJpbmcgd2hlbiBhbmltYXRpb24gc3RhcnRzICovXFxuICAtd2Via2l0LWFuaW1hdGlvbi1maWxsLW1vZGU6IGJvdGg7XFxuICBhbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xcbn1cXG5cXG4uY2lyY2xlMiAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDMwZGVnKTsgIHRyYW5zZm9ybTogcm90YXRlKDMwZGVnKSAgfVxcbi5jaXJjbGUzICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoNjBkZWcpOyAgdHJhbnNmb3JtOiByb3RhdGUoNjBkZWcpICB9XFxuLmNpcmNsZTQgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZyk7ICB0cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZykgIH1cXG4uY2lyY2xlNSAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDEyMGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDEyMGRlZykgfVxcbi5jaXJjbGU2ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMTUwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMTUwZGVnKSB9XFxuLmNpcmNsZTcgIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgxODBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgxODBkZWcpIH1cXG4uY2lyY2xlOCAgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDIxMGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDIxMGRlZykgfVxcbi5jaXJjbGU5ICB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMjQwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMjQwZGVnKSB9XFxuLmNpcmNsZTEwIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgyNzBkZWcpOyB0cmFuc2Zvcm06IHJvdGF0ZSgyNzBkZWcpIH1cXG4uY2lyY2xlMTEgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDMwMGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDMwMGRlZykgfVxcbi5jaXJjbGUxMiB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzMwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMzMwZGVnKSB9XFxuXFxuLmNpcmNsZTI6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4xczsgYW5pbWF0aW9uLWRlbGF5OiAtMS4xcyB9XFxuLmNpcmNsZTM6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4wczsgYW5pbWF0aW9uLWRlbGF5OiAtMS4wcyB9XFxuLmNpcmNsZTQ6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC45czsgYW5pbWF0aW9uLWRlbGF5OiAtMC45cyB9XFxuLmNpcmNsZTU6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC44czsgYW5pbWF0aW9uLWRlbGF5OiAtMC44cyB9XFxuLmNpcmNsZTY6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC43czsgYW5pbWF0aW9uLWRlbGF5OiAtMC43cyB9XFxuLmNpcmNsZTc6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC42czsgYW5pbWF0aW9uLWRlbGF5OiAtMC42cyB9XFxuLmNpcmNsZTg6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC41czsgYW5pbWF0aW9uLWRlbGF5OiAtMC41cyB9XFxuLmNpcmNsZTk6YmVmb3JlICB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC40czsgYW5pbWF0aW9uLWRlbGF5OiAtMC40cyB9XFxuLmNpcmNsZTEwOmJlZm9yZSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC4zczsgYW5pbWF0aW9uLWRlbGF5OiAtMC4zcyB9XFxuLmNpcmNsZTExOmJlZm9yZSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC4yczsgYW5pbWF0aW9uLWRlbGF5OiAtMC4ycyB9XFxuLmNpcmNsZTEyOmJlZm9yZSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC4xczsgYW5pbWF0aW9uLWRlbGF5OiAtMC4xcyB9XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIGJvdW5jZWRlbGF5IHtcXG4gIDAlLCA4MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA0MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlZGVsYXkge1xcbiAgMCUsIDgwJSwgMTAwJSB7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICB9IDQwJSB7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2NpcmNsZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jdWJlLWdyaWQuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9jdWJlLWdyaWQuY3NzXG4gKiogbW9kdWxlIGlkID0gODM2XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLmN1YmUtZ3JpZCB7XFxuICB3aWR0aDoyN3B4O1xcbiAgaGVpZ2h0OjI3cHg7XFxufVxcblxcbi5jdWJlIHtcXG4gIHdpZHRoOjMzJTtcXG4gIGhlaWdodDozMyU7XFxuICBiYWNrZ3JvdW5kOiMzMzM7XFxuICBmbG9hdDpsZWZ0O1xcbiAgLXdlYmtpdC1hbmltYXRpb246IHNjYWxlRGVsYXkgMS4zcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogc2NhbGVEZWxheSAxLjNzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG4vKlxcbiAqIFNwaW5uZXIgcG9zaXRpb25zXFxuICogMSAyIDNcXG4gKiA0IDUgNlxcbiAqIDcgOCA5XFxuICovXFxuXFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDEpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuMnM7IGFuaW1hdGlvbi1kZWxheTogMC4ycyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCgyKSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjNzOyBhbmltYXRpb24tZGVsYXk6IDAuM3MgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoMykgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC40czsgYW5pbWF0aW9uLWRlbGF5OiAwLjRzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDQpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuMXM7IGFuaW1hdGlvbi1kZWxheTogMC4xcyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg1KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjJzOyBhbmltYXRpb24tZGVsYXk6IDAuMnMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoNikgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4zczsgYW5pbWF0aW9uLWRlbGF5OiAwLjNzICB9XFxuLnNwaW5uZXIgLmN1YmU6bnRoLWNoaWxkKDcpIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuMHM7IGFuaW1hdGlvbi1kZWxheTogMC4wcyAgfVxcbi5zcGlubmVyIC5jdWJlOm50aC1jaGlsZCg4KSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAwLjFzOyBhbmltYXRpb24tZGVsYXk6IDAuMXMgIH1cXG4uc3Bpbm5lciAuY3ViZTpudGgtY2hpbGQoOSkgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4yczsgYW5pbWF0aW9uLWRlbGF5OiAwLjJzICB9XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlRGVsYXkge1xcbiAgMCUsIDcwJSwgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOnNjYWxlM0QoMS4wLCAxLjAsIDEuMCkgfVxcbiAgMzUlICAgICAgICAgICB7IC13ZWJraXQtdHJhbnNmb3JtOnNjYWxlM0QoMC4wLCAwLjAsIDEuMCkgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIHNjYWxlRGVsYXkge1xcbiAgMCUsIDcwJSwgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOnNjYWxlM0QoMS4wLCAxLjAsIDEuMCk7IHRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApIH1cXG4gIDM1JSAgICAgICAgICAgeyAtd2Via2l0LXRyYW5zZm9ybTpzY2FsZTNEKDEuMCwgMS4wLCAxLjApOyB0cmFuc2Zvcm06c2NhbGUzRCgwLjAsIDAuMCwgMS4wKSB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL2N1YmUtZ3JpZC5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9kb3VibGUtYm91bmNlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vZG91YmxlLWJvdW5jZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2RvdWJsZS1ib3VuY2UuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9kb3VibGUtYm91bmNlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDgzOFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5kb3VibGUtYm91bmNlIHtcXG4gIHdpZHRoOiAyN3B4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcblxcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4uZG91YmxlLWJvdW5jZTEsIC5kb3VibGUtYm91bmNlMiB7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIGJvcmRlci1yYWRpdXM6IDUwJTtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBvcGFjaXR5OiAwLjY7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcblxcbiAgLXdlYmtpdC1hbmltYXRpb246IGJvdW5jZSAyLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBib3VuY2UgMi4wcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuXFxuLmRvdWJsZS1ib3VuY2UyIHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxufVxcblxcbkAtd2Via2l0LWtleWZyYW1lcyBib3VuY2Uge1xcbiAgMCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKSB9XFxufVxcblxcbkBrZXlmcmFtZXMgYm91bmNlIHtcXG4gIDAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNTAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvZG91YmxlLWJvdW5jZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MzlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9wdWxzZS5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3B1bHNlLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHVsc2UuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy9wdWxzZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIucHVsc2Uge1xcbiAgd2lkdGg6IDI3cHg7XFxuICBoZWlnaHQ6IDI3cHg7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcblxcbiAgYm9yZGVyLXJhZGl1czogMTAwJTtcXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBzY2FsZW91dCAxLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiBzY2FsZW91dCAxLjBzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgc2NhbGVvdXQge1xcbiAgMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKSB9XFxuICAxMDAlIHtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMCk7XFxuICAgIG9wYWNpdHk6IDA7XFxuICB9XFxufVxcblxcbkBrZXlmcmFtZXMgc2NhbGVvdXQge1xcbiAgMCUge1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuMCk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgfSAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gICAgb3BhY2l0eTogMDtcXG4gIH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvcHVsc2UuY3NzXG4gKiogbW9kdWxlIGlkID0gODQxXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcm90YXRpbmctcGxhbmUuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9yb3RhdGluZy1wbGFuZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3JvdGF0aW5nLXBsYW5lLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvcm90YXRpbmctcGxhbmUuY3NzXG4gKiogbW9kdWxlIGlkID0gODQyXG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLnJvdGF0aW5nLXBsYW5lIHtcXG4gIHdpZHRoOiAyN3B4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiByb3RhdGVwbGFuZSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbiAgYW5pbWF0aW9uOiByb3RhdGVwbGFuZSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0O1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgcm90YXRlcGxhbmUge1xcbiAgMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIH1cXG4gIDUwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMjBweCkgcm90YXRlWSgxODBkZWcpIH1cXG4gIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVkoMTgwZGVnKSAgcm90YXRlWCgxODBkZWcpIH1cXG59XFxuXFxuQGtleWZyYW1lcyByb3RhdGVwbGFuZSB7XFxuICAwJSB7XFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoMGRlZykgcm90YXRlWSgwZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEyMHB4KSByb3RhdGVYKDBkZWcpIHJvdGF0ZVkoMGRlZyk7XFxuICB9IDUwJSB7XFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MC4xZGVnKSByb3RhdGVZKDBkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTIwcHgpIHJvdGF0ZVgoLTE4MC4xZGVnKSByb3RhdGVZKDBkZWcpO1xcbiAgfSAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMjBweCkgcm90YXRlWCgtMTgwZGVnKSByb3RhdGVZKC0xNzkuOWRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMjBweCkgcm90YXRlWCgtMTgwZGVnKSByb3RhdGVZKC0xNzkuOWRlZyk7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL3JvdGF0aW5nLXBsYW5lLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0M1xuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3RocmVlLWJvdW5jZS5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3RocmVlLWJvdW5jZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3RocmVlLWJvdW5jZS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL3RocmVlLWJvdW5jZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIudGhyZWUtYm91bmNlID4gZGl2IHtcXG4gIHdpZHRoOiAxOHB4O1xcbiAgaGVpZ2h0OiAxOHB4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG5cXG4gIGJvcmRlci1yYWRpdXM6IDEwMCU7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS40cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogYm91bmNlZGVsYXkgMS40cyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIC8qIFByZXZlbnQgZmlyc3QgZnJhbWUgZnJvbSBmbGlja2VyaW5nIHdoZW4gYW5pbWF0aW9uIHN0YXJ0cyAqL1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xcbiAgYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcXG59XFxuXFxuLnRocmVlLWJvdW5jZSAuYm91bmNlMSB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuMzJzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMC4zMnM7XFxufVxcblxcbi50aHJlZS1ib3VuY2UgLmJvdW5jZTIge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjE2cztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTAuMTZzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgYm91bmNlZGVsYXkge1xcbiAgMCUsIDgwJSwgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjApIH1cXG4gIDQwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBib3VuY2VkZWxheSB7XFxuICAwJSwgODAlLCAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4wKTtcXG4gIH0gNDAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjApO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMS4wKTtcXG4gIH1cXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3MvdGhyZWUtYm91bmNlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0NVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhbmRlcmluZy1jdWJlcy5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhbmRlcmluZy1jdWJlcy5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhbmRlcmluZy1jdWJlcy5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dhbmRlcmluZy1jdWJlcy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud2FuZGVyaW5nLWN1YmVzIHtcXG4gIHdpZHRoOiAyN3B4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4uY3ViZTEsIC5jdWJlMiB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcbiAgd2lkdGg6IDEwcHg7XFxuICBoZWlnaHQ6IDEwcHg7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcblxcbiAgLXdlYmtpdC1hbmltYXRpb246IGN1YmVtb3ZlIDEuOHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxuICBhbmltYXRpb246IGN1YmVtb3ZlIDEuOHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxufVxcblxcbi5jdWJlMiB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOXM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0wLjlzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgY3ViZW1vdmUge1xcbiAgMjUlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMjJweCkgcm90YXRlKC05MGRlZykgc2NhbGUoMC41KSB9XFxuICA1MCUgeyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCgyMnB4KSB0cmFuc2xhdGVZKDIycHgpIHJvdGF0ZSgtMTgwZGVnKSB9XFxuICA3NSUgeyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCgwcHgpIHRyYW5zbGF0ZVkoMjJweCkgcm90YXRlKC0yNzBkZWcpIHNjYWxlKDAuNSkgfVxcbiAgMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZykgfVxcbn1cXG5cXG5Aa2V5ZnJhbWVzIGN1YmVtb3ZlIHtcXG4gIDI1JSB7IFxcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgcm90YXRlKC05MGRlZykgc2NhbGUoMC41KTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgcm90YXRlKC05MGRlZykgc2NhbGUoMC41KTtcXG4gIH0gNTAlIHtcXG4gICAgLyogSGFjayB0byBtYWtlIEZGIHJvdGF0ZSBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uICovXFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMTc5ZGVnKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoNDJweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTE3OWRlZyk7XFxuICB9IDUwLjElIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDQycHgpIHRyYW5zbGF0ZVkoNDJweCkgcm90YXRlKC0xODBkZWcpO1xcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCg0MnB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMTgwZGVnKTtcXG4gIH0gNzUlIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDBweCkgdHJhbnNsYXRlWSg0MnB4KSByb3RhdGUoLTI3MGRlZykgc2NhbGUoMC41KTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMHB4KSB0cmFuc2xhdGVZKDQycHgpIHJvdGF0ZSgtMjcwZGVnKSBzY2FsZSgwLjUpO1xcbiAgfSAxMDAlIHtcXG4gICAgdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7XFxuICB9XFxufVxcblxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dhbmRlcmluZy1jdWJlcy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi93YXZlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vd2F2ZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dhdmUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0OFxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi53YXZlIHtcXG4gIHdpZHRoOiA1MHB4O1xcbiAgaGVpZ2h0OiAyN3B4O1xcbn1cXG5cXG4ud2F2ZSA+IGRpdiB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgd2lkdGg6IDZweDtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG5cXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBzdHJldGNoZGVsYXkgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG4gIGFuaW1hdGlvbjogc3RyZXRjaGRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7XFxufVxcblxcbi53YXZlIC5yZWN0MiB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMXM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0xLjFzO1xcbn1cXG5cXG4ud2F2ZSAucmVjdDMge1xcbiAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjBzO1xcbiAgYW5pbWF0aW9uLWRlbGF5OiAtMS4wcztcXG59XFxuXFxuLndhdmUgLnJlY3Q0IHtcXG4gIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC45cztcXG4gIGFuaW1hdGlvbi1kZWxheTogLTAuOXM7XFxufVxcblxcbi53YXZlIC5yZWN0NSB7XFxuICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOHM7XFxuICBhbmltYXRpb24tZGVsYXk6IC0wLjhzO1xcbn1cXG5cXG5ALXdlYmtpdC1rZXlmcmFtZXMgc3RyZXRjaGRlbGF5IHtcXG4gIDAlLCA0MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCkgfVxcbiAgMjAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgxLjApIH1cXG59XFxuXFxuQGtleWZyYW1lcyBzdHJldGNoZGVsYXkge1xcbiAgMCUsIDQwJSwgMTAwJSB7XFxuICAgIHRyYW5zZm9ybTogc2NhbGVZKDAuNCk7XFxuICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMC40KTtcXG4gIH0gMjAlIHtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZVkoMS4wKTtcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgxLjApO1xcbiAgfVxcbn1cXG5cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9yZWFjdC1zcGlua2l0L2Nzcy93YXZlLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg0OVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dvcmRwcmVzcy5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dvcmRwcmVzcy5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3dvcmRwcmVzcy5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0LXNwaW5raXQvY3NzL3dvcmRwcmVzcy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud29yZHByZXNzIHtcXG4gIGJhY2tncm91bmQ6ICMzMzM7XFxuICB3aWR0aDogMjdweDtcXG4gIGhlaWdodDogMjdweDtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIGJvcmRlci1yYWRpdXM6IDI3cHg7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICAtd2Via2l0LWFuaW1hdGlvbjogaW5uZXItY2lyY2xlIDFzIGxpbmVhciBpbmZpbml0ZTtcXG4gIGFuaW1hdGlvbjogaW5uZXItY2lyY2xlIDFzIGxpbmVhciBpbmZpbml0ZTtcXG59XFxuXFxuLmlubmVyLWNpcmNsZSB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIGJhY2tncm91bmQ6ICNmZmY7XFxuICB3aWR0aDogOHB4O1xcbiAgaGVpZ2h0OiA4cHg7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBib3JkZXItcmFkaXVzOiA4cHg7XFxuICB0b3A6IDVweDtcXG4gIGxlZnQ6IDVweDtcXG59XFxuXFxuQC13ZWJraXQta2V5ZnJhbWVzIGlubmVyLWNpcmNsZSB7XFxuICAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMCk7IH1cXG4gIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cXG59XFxuXFxuQGtleWZyYW1lcyBpbm5lci1jaXJjbGUge1xcbiAgMCUgeyB0cmFuc2Zvcm06IHJvdGF0ZSgwKTsgLXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDApOyB9XFxuICAxMDAlIHsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgLXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7IH1cXG59XFxuXFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vcmVhY3Qtc3BpbmtpdC9jc3Mvd29yZHByZXNzLmNzc1xuICoqIG1vZHVsZSBpZCA9IDg1MVxuICoqIG1vZHVsZSBjaHVua3MgPSAxXG4gKiovIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQdXJlUmVuZGVyTWl4aW4gZnJvbSAncmVhY3QtYWRkb25zLXB1cmUtcmVuZGVyLW1peGluJztcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHVyaWZ5Q29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc2hvdWxkQ29tcG9uZW50VXBkYXRlID0gUHVyZVJlbmRlck1peGluLnNob3VsZENvbXBvbmVudFVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgbmV3UHJvcHMgPSB7fTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLnByb3BzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChrZXkgIT09ICdjb21wb25lbnQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKEltbXV0YWJsZS5JdGVyYWJsZS5pc0l0ZXJhYmxlKHRoaXMucHJvcHNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJvcHNba2V5XSA9IHRoaXMucHJvcHNba2V5XS50b0pTKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJvcHNba2V5XSA9IHRoaXMucHJvcHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiA8dGhpcy5wcm9wcy5jb21wb25lbnQgey4uLm5ld1Byb3BzfSAvPjtcbiAgICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zaGFyZWQvY29tcG9uZW50cy9QdXJpZnlDb21wb25lbnQuanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ3JlYWN0L2xpYi9SZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4nKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC1hZGRvbnMtcHVyZS1yZW5kZXItbWl4aW4vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA4NTNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaGFsbG93Q29tcGFyZSA9IHJlcXVpcmUoJy4vc2hhbGxvd0NvbXBhcmUnKTtcblxuLyoqXG4gKiBJZiB5b3VyIFJlYWN0IGNvbXBvbmVudCdzIHJlbmRlciBmdW5jdGlvbiBpcyBcInB1cmVcIiwgZS5nLiBpdCB3aWxsIHJlbmRlciB0aGVcbiAqIHNhbWUgcmVzdWx0IGdpdmVuIHRoZSBzYW1lIHByb3BzIGFuZCBzdGF0ZSwgcHJvdmlkZSB0aGlzIG1peGluIGZvciBhXG4gKiBjb25zaWRlcmFibGUgcGVyZm9ybWFuY2UgYm9vc3QuXG4gKlxuICogTW9zdCBSZWFjdCBjb21wb25lbnRzIGhhdmUgcHVyZSByZW5kZXIgZnVuY3Rpb25zLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICB2YXIgUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluID1cbiAqICAgICByZXF1aXJlKCdSZWFjdENvbXBvbmVudFdpdGhQdXJlUmVuZGVyTWl4aW4nKTtcbiAqICAgUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICogICAgIG1peGluczogW1JlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbl0sXG4gKlxuICogICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gKiAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfT5mb288L2Rpdj47XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBOb3RlOiBUaGlzIG9ubHkgY2hlY2tzIHNoYWxsb3cgZXF1YWxpdHkgZm9yIHByb3BzIGFuZCBzdGF0ZS4gSWYgdGhlc2UgY29udGFpblxuICogY29tcGxleCBkYXRhIHN0cnVjdHVyZXMgdGhpcyBtaXhpbiBtYXkgaGF2ZSBmYWxzZS1uZWdhdGl2ZXMgZm9yIGRlZXBlclxuICogZGlmZmVyZW5jZXMuIE9ubHkgbWl4aW4gdG8gY29tcG9uZW50cyB3aGljaCBoYXZlIHNpbXBsZSBwcm9wcyBhbmQgc3RhdGUsIG9yXG4gKiB1c2UgYGZvcmNlVXBkYXRlKClgIHdoZW4geW91IGtub3cgZGVlcCBkYXRhIHN0cnVjdHVyZXMgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIFNlZSBodHRwczovL2ZhY2Vib29rLmdpdGh1Yi5pby9yZWFjdC9kb2NzL3B1cmUtcmVuZGVyLW1peGluLmh0bWxcbiAqL1xudmFyIFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbiA9IHtcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICByZXR1cm4gc2hhbGxvd0NvbXBhcmUodGhpcywgbmV4dFByb3BzLCBuZXh0U3RhdGUpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpbjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC9saWIvUmVhY3RDb21wb25lbnRXaXRoUHVyZVJlbmRlck1peGluLmpzXG4gKiogbW9kdWxlIGlkID0gODU0XG4gKiogbW9kdWxlIGNodW5rcyA9IDFcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4qIEBwcm92aWRlc01vZHVsZSBzaGFsbG93Q29tcGFyZVxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2hhbGxvd0VxdWFsID0gcmVxdWlyZSgnZmJqcy9saWIvc2hhbGxvd0VxdWFsJyk7XG5cbi8qKlxuICogRG9lcyBhIHNoYWxsb3cgY29tcGFyaXNvbiBmb3IgcHJvcHMgYW5kIHN0YXRlLlxuICogU2VlIFJlYWN0Q29tcG9uZW50V2l0aFB1cmVSZW5kZXJNaXhpblxuICogU2VlIGFsc28gaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy9zaGFsbG93LWNvbXBhcmUuaHRtbFxuICovXG5mdW5jdGlvbiBzaGFsbG93Q29tcGFyZShpbnN0YW5jZSwgbmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgcmV0dXJuICFzaGFsbG93RXF1YWwoaW5zdGFuY2UucHJvcHMsIG5leHRQcm9wcykgfHwgIXNoYWxsb3dFcXVhbChpbnN0YW5jZS5zdGF0ZSwgbmV4dFN0YXRlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaGFsbG93Q29tcGFyZTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdC9saWIvc2hhbGxvd0NvbXBhcmUuanNcbiAqKiBtb2R1bGUgaWQgPSA4NTVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImltcG9ydCBSZWFjdCwgeyBQcm9wVHlwZXMgYXMgVCB9IGZyb20gJ3JlYWN0JztcblxuaW1wb3J0IEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuXG5pbXBvcnQge1RhYmxlLCBDb2x1bW4sIENlbGx9IGZyb20gJ2ZpeGVkLWRhdGEtdGFibGUnO1xuXG5pbXBvcnQgRW5oYW5jZWRGaXhlZERhdGFUYWJsZSBmcm9tICdzaGFyZWQvY29tcG9uZW50cy9lbmhhbmNlZEZpeGVkRGF0YVRhYmxlL0VuaGFuY2VkRml4ZWREYXRhVGFibGUnO1xuXG5pbXBvcnQgY292ZXJ0U2FtcGxlRGF0YSBmcm9tICcuL2xpYi9jb252ZXJ0U2FtcGxlc0RhdGEnO1xuXG5leHBvcnQgY2xhc3MgQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXNUYWJsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIG15VGFibGVEYXRhOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnUnlsYW4nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnQW1lbGlhJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0VzdGV2YW4nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnRmxvcmVuY2UnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnVHJlc3NhJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb3ZlcnRTYW1wbGVEYXRhKHRoaXMucHJvcHMuZGF0YS50b0FycmF5KCkpO1xuXG4gICAgICAgIGNvbnN0IGNlbGxzID0gW107XG5cbiAgICAgICAgT2JqZWN0LmtleXMoZGF0YS5pdGVtcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gZGF0YS5pdGVtc1trZXldO1xuXG4gICAgICAgICAgICBkYXRhLmNvbHVtbnMuZm9yRWFjaCgoY29sKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbC5pZCBpbiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxzLnB1c2goeyBhdHRyX25hbWU6IGtleSwgYXR0cl9pZDogY29sLmlkLCBhdHRyX3ZhbDogaXRlbVtjb2wuaWRdIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxzLnB1c2goeyBhdHRyX25hbWU6IGtleSwgYXR0cl9pZDogY29sLmlkLCBhdHRyX3ZhbDogJ04vQScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGQgPSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBkYXRhLmNvbHVtbnMubWFwKChjb2wpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBhdHRyX2lkOiBjb2wuaWQsIGRhdGF0eXBlOiAnU1RSSU5HJywgZGlzcGxheV9uYW1lOiBjb2wuaWQgfTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZGF0YTogY2VsbHMsXG4gICAgICAgIH07XG5cbiAgICAgICAgZC5hdHRyaWJ1dGVzLnVuc2hpZnQoeyBhdHRyX2lkOiAnYXR0cl9uYW1lJywgZGF0YXR5cGU6ICdTVFJJTkcnLCBkaXNwbGF5X25hbWU6ICdBdHRyaWJ1dGUnIH0pO1xuXG4gICAgICAgIHJldHVybiA8RW5oYW5jZWRGaXhlZERhdGFUYWJsZSBpbnB1dD17ZH0gZ3JvdXBIZWFkZXI9e2ZhbHNlfSBmaWx0ZXI9XCJHTE9CQUxcIiByb3dIZWlnaHQ9ezMzfSBoZWFkZXJIZWlnaHQ9ezMzfSBkb3dubG9hZD1cIkFMTFwiIHVuaXF1ZUlkPVwiYXR0cl9uYW1lXCIgdGFibGVXaWR0aD17MTE5MH0gYXV0b0NvbHVtbldpZHRoPXt0cnVlfSAvPjtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENsaW5pY2FsSW5mb3JtYXRpb25TYW1wbGVzVGFibGU7XG5cblxuQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXNUYWJsZS5wcm9wVHlwZXMgPSB7XG4gICAgZGF0YTogVC5hbnkuaXNSZXF1aXJlZCxcbn07XG5cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vQ2xpbmljYWxJbmZvcm1hdGlvblNhbXBsZXMuanN4XG4gKiovIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBjb25zdCBvdXRwdXQgPSB7IGNvbHVtbnM6IFtdLCBpdGVtczoge30gfTtcblxuICAgIGRhdGEuZm9yRWFjaCgoc2FtcGxlKSA9PiB7XG4gICAgICAgIGNvbnN0IHNhbXBsZUlkID0gc2FtcGxlLmlkO1xuXG4gICAgICAgIG91dHB1dC5jb2x1bW5zLnB1c2goeyBpZDogc2FtcGxlSWQgfSk7XG5cbiAgICAgICAgc2FtcGxlLmNsaW5pY2FsRGF0YS5mb3JFYWNoKChkYXRhSXRlbSkgPT4ge1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXSA9IG91dHB1dC5pdGVtc1tkYXRhSXRlbS5pZF0gfHwge307XG4gICAgICAgICAgICBvdXRwdXQuaXRlbXNbZGF0YUl0ZW0uaWRdW3NhbXBsZUlkXSA9IGRhdGFJdGVtLnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBvdXRwdXQuaXRlbXNbZGF0YUl0ZW0uaWRdLm5hbWUgPSBkYXRhSXRlbS5uYW1lO1xuICAgICAgICAgICAgb3V0cHV0Lml0ZW1zW2RhdGFJdGVtLmlkXS5pZCA9IGRhdGFJdGVtLmlkO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9jbGluaWNhbEluZm9ybWF0aW9uL2xpYi9jb252ZXJ0U2FtcGxlc0RhdGEuanNcbiAqKi8iLCJpbXBvcnQge0xpc3R9IGZyb20gXCJpbW11dGFibGVcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7QnV0dG9uLCBPdmVybGF5VHJpZ2dlciwgUG9wb3Zlcn0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCBTYW1wbGVJbmxpbmUgZnJvbSAnLi9TYW1wbGVJbmxpbmUnO1xuaW1wb3J0IFRvb2x0aXBUYWJsZSBmcm9tICcuLi9jbGluaWNhbEluZm9ybWF0aW9uL0NsaW5pY2FsSW5mb3JtYXRpb25QYXRpZW50VGFibGUnO1xuaW1wb3J0ICogYXMgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgU3Bpbm5lciBmcm9tICdyZWFjdC1zcGlua2l0JztcbmltcG9ydCBPcmRlcmVkTWFwID0gSW1tdXRhYmxlLk9yZGVyZWRNYXA7XG5cbnR5cGUgVE9ETyA9IGFueTtcblxudHlwZSBTYW1wbGUgPSB7Y2xpbmljYWxEYXRhOlRPRE99O1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGllbnRIZWFkZXJQcm9wc1xue1xuICAgIHNhbXBsZXM6TGlzdDxTYW1wbGU+O1xuICAgIHN0YXR1czonZmV0Y2hpbmcnfCdjb21wbGV0ZSd8J2Vycm9yJztcbiAgICBwYXRpZW50OlRPRE87XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdGllbnRIZWFkZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UGF0aWVudEhlYWRlclByb3BzLCB7fT5cbntcbiAgICBnZXRQb3BvdmVyKHNhbXBsZTpTYW1wbGUsIG51bWJlcjpudW1iZXIpXG4gICAge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPFBvcG92ZXIga2V5PXtudW1iZXJ9IGlkPXsncG9wb3Zlci1zYW1wbGUtJyArIG51bWJlcn0+XG4gICAgICAgICAgICAgICAgPFRvb2x0aXBUYWJsZSBkYXRhPXtJbW11dGFibGUuZnJvbUpTKHNhbXBsZS5jbGluaWNhbERhdGEpfSAvPlxuICAgICAgICAgICAgPC9Qb3BvdmVyPlxuICAgICAgICApO1xuICAgIH1cblxuICAgIGRyYXdIZWFkZXIoKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2FtcGxlcyAmJiB0aGlzLnByb3BzLnNhbXBsZXMuc2l6ZSA+IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMucHJvcHMuc2FtcGxlcy5tYXAoKHNhbXBsZTpTYW1wbGUsIG51bWJlcjpudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGNsaW5pY2FsRGF0YSA9IHRoaXMucHJvcHMuc2FtcGxlcy5nZXQoJ2l0ZW1zJykua2V5cygpLm1hcChhdHRyX2lkID0+IHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICByZXR1cm4gT2JqZWN0KHsnaWQnOiB4LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgJ3ZhbHVlJzogdGhpcy5wcm9wcy5zYW1wbGVzLmdldCgnaXRlbXMnKS5nZXQoYXR0cl9pZCkuZ2V0KCdUQ0dBLVA2LUE1T0gtMDEnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgfSkgXG4gICAgICAgICAgICAgICAgICAgICAgICAvL30pLmZpbHRlcih4ID0+IHgudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2FtcGxlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8T3ZlcmxheVRyaWdnZXIgZGVsYXlIaWRlPXsxMDB9IGtleT17bnVtYmVyfSB0cmlnZ2VyPXtbJ2hvdmVyJywgJ2ZvY3VzJ119IHBsYWNlbWVudD1cImJvdHRvbVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVybGF5PXt0aGlzLmdldFBvcG92ZXIoc2FtcGxlLCBudW1iZXIrMSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxTYW1wbGVJbmxpbmUgc2FtcGxlPXtzYW1wbGV9IG51bWJlcj17bnVtYmVyKzF9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L092ZXJsYXlUcmlnZ2VyPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+VGhlcmUgd2FzIGFuIGVycm9yLjwvZGl2PjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpXG4gICAge1xuICAgICAgICBzd2l0Y2ggKHRoaXMucHJvcHMuc3RhdHVzKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlICdmZXRjaGluZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+PFNwaW5uZXIgc3Bpbm5lck5hbWU9XCJ0aHJlZS1ib3VuY2VcIiAvPjwvZGl2PjtcblxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYXdIZWFkZXIoKTtcblxuICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PlRoZXJlIHdhcyBhbiBlcnJvci48L2Rpdj47XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWdlcy9wYXRpZW50Vmlldy9wYXRpZW50SGVhZGVyL1BhdGllbnRIZWFkZXIudHN4XG4gKiovIiwiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtCdXR0b24sIE92ZXJsYXlUcmlnZ2VyLCBQb3BvdmVyfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgU2FtcGxlTGFiZWxIVE1MIH0gZnJvbSAnLi4vU2FtcGxlTGFiZWwnO1xuXG50eXBlIFRPRE8gPSBhbnk7XG5cbmludGVyZmFjZSBTYW1wbGVJbmxpbmVQcm9wc1xue1xuICAgIHNhbXBsZTogVE9ETztcbiAgICBudW1iZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2FtcGxlSW5saW5lIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFNhbXBsZUlubGluZVByb3BzLCB7fT5cbntcbiAgICByZW5kZXIoKVxuICAgIHtcbiAgICAgICAgY29uc3QgeyBzYW1wbGUsIG51bWJlciB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7XCJwYWRkaW5nUmlnaHRcIjpcIjEwcHhcIn19PlxuICAgICAgICAgICAgICAgIDxTYW1wbGVMYWJlbEhUTUwgY29sb3I9eydibGFjayd9IGxhYmVsPXsobnVtYmVyKS50b1N0cmluZygpfSAvPlxuICAgICAgICAgICAgICAgIHsnICcgKyBzYW1wbGUuaWR9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFnZXMvcGF0aWVudFZpZXcvcGF0aWVudEhlYWRlci9TYW1wbGVJbmxpbmUudHN4XG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/IXNhc3Mhc2Fzcy1yZXNvdXJjZXMhLi9sb2NhbC1zdHlsZXMuc2Nzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/IXNhc3Mhc2Fzcy1yZXNvdXJjZXMhLi9sb2NhbC1zdHlsZXMuc2Nzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz8hc2FzcyFzYXNzLXJlc291cmNlcyEuL2xvY2FsLXN0eWxlcy5zY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vc3R5bGUvbG9jYWwtc3R5bGVzLnNjc3NcbiAqKiBtb2R1bGUgaWQgPSA5MjFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiI2NvbnRlbnQgaDQge1xcbiAgbWFyZ2luLWJvdHRvbTogMTVweCAhaW1wb3J0YW50OyB9XFxuICAjY29udGVudCBoNDpudGgtY2hpbGQobisyKSB7XFxuICAgIG1hcmdpbi10b3A6IDIwcHg7IH1cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyPyEuL34vc2Fzcy1sb2FkZXIhLi9+L3Nhc3MtcmVzb3VyY2VzLWxvYWRlci9saWIvbG9hZGVyLmpzIS4vc3JjL3BhZ2VzL3BhdGllbnRWaWV3L2NsaW5pY2FsSW5mb3JtYXRpb24vc3R5bGUvbG9jYWwtc3R5bGVzLnNjc3NcbiAqKiBtb2R1bGUgaWQgPSA5MjJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMVxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=