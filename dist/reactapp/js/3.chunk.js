webpackJsonp([3],{

/***/ 928:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	
	var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.DataSetPageUnconnected = undefined;
	
	var _index = __webpack_require__(179);
	
	var _index2 = _interopRequireDefault(_index);
	
	var _index3 = __webpack_require__(184);
	
	var _index4 = _interopRequireDefault(_index3);
	
	var _react2 = __webpack_require__(15);
	
	var React = _interopRequireWildcard(_react2);
	
	var _index5 = __webpack_require__(185);
	
	var _index6 = _interopRequireDefault(_index5);
	
	var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	    return typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
	} : function (obj) {
	    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
	};
	
	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();
	
	var _duck = __webpack_require__(661);
	
	var _reactRedux = __webpack_require__(395);
	
	var _reactable = __webpack_require__(929);
	
	var _underscore = __webpack_require__(332);
	
	var _ = _interopRequireWildcard(_underscore);
	
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
	    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof2(call)) === "object" || typeof call === "function") ? call : self;
	}
	
	function _inherits(subClass, superClass) {
	    if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof2(superClass)));
	    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}
	
	var _components = {
	    DataSetPageUnconnected: {
	        displayName: 'DataSetPageUnconnected'
	    }
	};
	
	var _UsersJiaojiaoReposCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2 = (0, _index6.default)({
	    filename: '/Users/jiaojiao/repos/cbioportal-frontend/src/pages/datasetView/DatasetPage.jsx',
	    components: _components,
	    locals: [module],
	    imports: [React.default]
	});
	
	var _UsersJiaojiaoReposCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2 = (0, _index4.default)({
	    filename: '/Users/jiaojiao/repos/cbioportal-frontend/src/pages/datasetView/DatasetPage.jsx',
	    components: _components,
	    locals: [],
	    imports: [React.default, _index2.default]
	});
	
	function _wrapComponent(id) {
	    return function (Component) {
	        return _UsersJiaojiaoReposCbioportalFrontendNode_modulesReactTransformHmrLibIndexJs2(_UsersJiaojiaoReposCbioportalFrontendNode_modulesReactTransformCatchErrorsLibIndexJs2(Component, id), id);
	    };
	}
	
	var DataSetPageUnconnected = exports.DataSetPageUnconnected = _wrapComponent('DataSetPageUnconnected')(function (_React$Component) {
	    _inherits(DataSetPageUnconnected, _React$Component);
	
	    function DataSetPageUnconnected() {
	        _classCallCheck(this, DataSetPageUnconnected);
	
	        return _possibleConstructorReturn(this, (DataSetPageUnconnected.__proto__ || Object.getPrototypeOf(DataSetPageUnconnected)).apply(this, arguments));
	    }
	
	    _createClass(DataSetPageUnconnected, [{
	        key: 'componentDidMount',
	        value: function componentDidMount() {
	
	            this.props.loadDatasetsInfo();
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            var _this2 = this;
	
	            if (this.props.datasets) {
	                var tempObj;
	
	                var _ret = function () {
	                    var rows = [];
	                    var studies = [];
	                    tempObj = {};
	
	                    _this2.props.datasets.forEach(function (item) {
	                        if (studies.indexOf(item.cancer_study_identifier) === -1) {
	                            studies.push(item.cancer_study_identifier);
	                            tempObj = { CancerStudy: (0, _reactable.unsafe)("<a href='http://www.cbioportal.org/study?id=" + item.cancer_study_identifier + "#summary' target='_blank'>" + item.name + "</a>  <a href='https://github.com/cBioPortal/datahub/blob/master/public/" + item.cancer_study_identifier + ".tar.gz' download><i class='fa fa-download'></i></a>") };
	                            if (!_.isNull(item.citation)) {
	                                tempObj.Reference = (0, _reactable.unsafe)("<a target='_blank' href='https://www.ncbi.nlm.nih.gov/pubmed/" + item.pmid + "'>" + item.citation + "</a>");
	                            }
	                            rows.push(tempObj);
	                        }
	                        tempObj = rows[studies.indexOf(item.cancer_study_identifier)];
	                        if (item.stable_id.endsWith("_all")) {
	                            tempObj.All = item.count;
	                        } else if (item.stable_id.endsWith("_sequenced")) {
	                            tempObj.Sequenced = item.count;
	                        } else if (item.stable_id.endsWith("_cna")) {
	                            tempObj.CNA = item.count;
	                        } else if (item.stable_id.endsWith("rna_seq_v2_mrna")) {
	                            tempObj["Tumor mRNA (RNA-Seq V2)"] = item.count;
	                        } else if (item.stable_id.endsWith("_microrna")) {
	                            tempObj["Tumor mRNA (microarray)"] = item.count;
	                        } else if (item.stable_id.endsWith("mrna")) {
	                            tempObj["Tumor miRNA"] = item.count;
	                        } else if (item.stable_id.endsWith("methylation_hm27")) {
	                            tempObj["Methylation (HM27)"] = item.count;
	                        } else if (item.stable_id.endsWith("_rppa")) {
	                            tempObj.RPPA = item.count;
	                        } else if (item.stable_id.endsWith("_complete")) {
	                            tempObj.Complete = item.count;
	                        }
	                    });
	
	                    //    return <Table className="table" data={rows} sortable={true} filterable={['Name', 'Reference', 'All', 'Sequenced', 'CNA', 'Tumor_RNA_seq', 'Tumor_RNA_microarray', 'Tumor_miRNA', 'Methylation', 'RPPA', 'Complete']}/>;
	                    return {
	                        v: React.createElement(_reactable.Table, { className: 'table', data: rows, sortable: true, filterable: ['CancerStudy', 'Reference', 'All', 'Sequenced', 'CNA', 'Tumor mRNA (RNA-Seq V2)', 'Tumor mRNA (microarray)', 'Tumor miRNA', 'Methylation (HM27)', 'RPPA', 'Complete'] })
	                    };
	                }();
	
	                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	            } else {
	                return React.createElement('div', null, 'loading');
	            }
	        }
	    }]);
	
	    return DataSetPageUnconnected;
	}(React.Component));
	
	;
	
	exports.default = (0, _reactRedux.connect)(_duck.mapStateToProps, _duck.actionCreators)(DataSetPageUnconnected);
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(178)(module)))

/***/ },

/***/ 929:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactableTable = __webpack_require__(930);
	
	var _reactableTr = __webpack_require__(938);
	
	var _reactableTd = __webpack_require__(939);
	
	var _reactableTh = __webpack_require__(936);
	
	var _reactableTfoot = __webpack_require__(942);
	
	var _reactableThead = __webpack_require__(935);
	
	var _reactableSort = __webpack_require__(944);
	
	var _reactableUnsafe = __webpack_require__(934);
	
	_react2['default'].Children.children = function (children) {
	    return _react2['default'].Children.map(children, function (x) {
	        return x;
	    }) || [];
	};
	
	// Array.prototype.find polyfill - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	if (!Array.prototype.find) {
	    Object.defineProperty(Array.prototype, 'find', {
	        enumerable: false,
	        configurable: true,
	        writable: true,
	        value: function value(predicate) {
	            if (this === null) {
	                throw new TypeError('Array.prototype.find called on null or undefined');
	            }
	            if (typeof predicate !== 'function') {
	                throw new TypeError('predicate must be a function');
	            }
	            var list = Object(this);
	            var length = list.length >>> 0;
	            var thisArg = arguments[1];
	            var value;
	            for (var i = 0; i < length; i++) {
	                if (i in list) {
	                    value = list[i];
	                    if (predicate.call(thisArg, value, i, list)) {
	                        return value;
	                    }
	                }
	            }
	            return undefined;
	        }
	    });
	}
	
	var Reactable = { Table: _reactableTable.Table, Tr: _reactableTr.Tr, Td: _reactableTd.Td, Th: _reactableTh.Th, Tfoot: _reactableTfoot.Tfoot, Thead: _reactableThead.Thead, Sort: _reactableSort.Sort, unsafe: _reactableUnsafe.unsafe };
	
	exports['default'] = Reactable;
	
	if (typeof window !== 'undefined') {
	    window.Reactable = Reactable;
	}
	module.exports = exports['default'];


/***/ },

/***/ 930:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _libFilter_props_from = __webpack_require__(931);
	
	var _libExtract_data_from = __webpack_require__(932);
	
	var _unsafe = __webpack_require__(934);
	
	var _thead = __webpack_require__(935);
	
	var _th = __webpack_require__(936);
	
	var _tr = __webpack_require__(938);
	
	var _tfoot = __webpack_require__(942);
	
	var _paginator = __webpack_require__(943);
	
	var Table = (function (_React$Component) {
	    _inherits(Table, _React$Component);
	
	    function Table(props) {
	        _classCallCheck(this, Table);
	
	        _get(Object.getPrototypeOf(Table.prototype), 'constructor', this).call(this, props);
	
	        this.state = {
	            currentPage: this.props.currentPage ? this.props.currentPage : 0,
	            currentSort: {
	                column: null,
	                direction: this.props.defaultSortDescending ? -1 : 1
	            },
	            filter: ''
	        };
	
	        // Set the state of the current sort to the default sort
	        if (props.sortBy !== false || props.defaultSort !== false) {
	            var sortingColumn = props.sortBy || props.defaultSort;
	            this.state.currentSort = this.getCurrentSort(sortingColumn);
	        }
	    }
	
	    _createClass(Table, [{
	        key: 'filterBy',
	        value: function filterBy(filter) {
	            this.setState({ filter: filter });
	        }
	
	        // Translate a user defined column array to hold column objects if strings are specified
	        // (e.g. ['column1'] => [{key: 'column1', label: 'column1'}])
	    }, {
	        key: 'translateColumnsArray',
	        value: function translateColumnsArray(columns) {
	            return columns.map((function (column, i) {
	                if (typeof column === 'string') {
	                    return {
	                        key: column,
	                        label: column
	                    };
	                } else {
	                    if (typeof column.sortable !== 'undefined') {
	                        var sortFunction = column.sortable === true ? 'default' : column.sortable;
	                        this._sortable[column.key] = sortFunction;
	                    }
	
	                    return column;
	                }
	            }).bind(this));
	        }
	    }, {
	        key: 'parseChildData',
	        value: function parseChildData(props) {
	            var data = [],
	                tfoot = undefined;
	
	            // Transform any children back to a data array
	            if (typeof props.children !== 'undefined') {
	                _react2['default'].Children.forEach(props.children, (function (child) {
	                    if (typeof child === 'undefined' || child === null) {
	                        return;
	                    }
	
	                    switch (child.type) {
	                        case _thead.Thead:
	                            break;
	                        case _tfoot.Tfoot:
	                            if (typeof tfoot !== 'undefined') {
	                                console.warn('You can only have one <Tfoot>, but more than one was specified.' + 'Ignoring all but the last one');
	                            }
	                            tfoot = child;
	                            break;
	                        case _tr.Tr:
	                            var childData = child.props.data || {};
	
	                            _react2['default'].Children.forEach(child.props.children, function (descendant) {
	                                // TODO
	                                /* if (descendant.type.ConvenienceConstructor === Td) { */
	                                if (typeof descendant !== 'object' || descendant == null) {
	                                    return;
	                                } else if (typeof descendant.props.column !== 'undefined') {
	                                    var value = undefined;
	
	                                    if (typeof descendant.props.data !== 'undefined') {
	                                        value = descendant.props.data;
	                                    } else if (typeof descendant.props.children !== 'undefined') {
	                                        value = descendant.props.children;
	                                    } else {
	                                        console.warn('exports.Td specified without ' + 'a `data` property or children, ' + 'ignoring');
	                                        return;
	                                    }
	
	                                    childData[descendant.props.column] = {
	                                        value: value,
	                                        props: (0, _libFilter_props_from.filterPropsFrom)(descendant.props),
	                                        __reactableMeta: true
	                                    };
	                                } else {
	                                    console.warn('exports.Td specified without a ' + '`column` property, ignoring');
	                                }
	                            });
	
	                            data.push({
	                                data: childData,
	                                props: (0, _libFilter_props_from.filterPropsFrom)(child.props),
	                                __reactableMeta: true
	                            });
	                            break;
	
	                        default:
	                            console.warn('The only possible children of <Table> are <Thead>, <Tr>, ' + 'or one <Tfoot>.');
	                    }
	                }).bind(this));
	            }
	
	            return { data: data, tfoot: tfoot };
	        }
	    }, {
	        key: 'initialize',
	        value: function initialize(props) {
	            this.data = props.data || [];
	
	            var _parseChildData = this.parseChildData(props);
	
	            var data = _parseChildData.data;
	            var tfoot = _parseChildData.tfoot;
	
	            this.data = this.data.concat(data);
	            this.tfoot = tfoot;
	
	            this.initializeSorts(props);
	            this.initializeFilters(props);
	        }
	    }, {
	        key: 'initializeFilters',
	        value: function initializeFilters(props) {
	            this._filterable = {};
	            // Transform filterable properties into a more friendly list
	            for (var i in props.filterable) {
	                var column = props.filterable[i];
	                var columnName = undefined,
	                    filterFunction = undefined;
	
	                if (column instanceof Object) {
	                    if (typeof column.column !== 'undefined') {
	                        columnName = column.column;
	                    } else {
	                        console.warn('Filterable column specified without column name');
	                        continue;
	                    }
	
	                    if (typeof column.filterFunction === 'function') {
	                        filterFunction = column.filterFunction;
	                    } else {
	                        filterFunction = 'default';
	                    }
	                } else {
	                    columnName = column;
	                    filterFunction = 'default';
	                }
	
	                this._filterable[columnName] = filterFunction;
	            }
	        }
	    }, {
	        key: 'initializeSorts',
	        value: function initializeSorts(props) {
	            this._sortable = {};
	            // Transform sortable properties into a more friendly list
	            for (var i in props.sortable) {
	                var column = props.sortable[i];
	                var columnName = undefined,
	                    sortFunction = undefined;
	
	                if (column instanceof Object) {
	                    if (typeof column.column !== 'undefined') {
	                        columnName = column.column;
	                    } else {
	                        console.warn('Sortable column specified without column name');
	                        return;
	                    }
	
	                    if (typeof column.sortFunction === 'function') {
	                        sortFunction = column.sortFunction;
	                    } else {
	                        sortFunction = 'default';
	                    }
	                } else {
	                    columnName = column;
	                    sortFunction = 'default';
	                }
	
	                this._sortable[columnName] = sortFunction;
	            }
	        }
	    }, {
	        key: 'getCurrentSort',
	        value: function getCurrentSort(column) {
	            var columnName = undefined,
	                sortDirection = undefined;
	
	            if (column instanceof Object) {
	                if (typeof column.column !== 'undefined') {
	                    columnName = column.column;
	                } else {
	                    console.warn('Default column specified without column name');
	                    return;
	                }
	
	                if (typeof column.direction !== 'undefined') {
	                    if (column.direction === 1 || column.direction === 'asc') {
	                        sortDirection = 1;
	                    } else if (column.direction === -1 || column.direction === 'desc') {
	                        sortDirection = -1;
	                    } else {
	                        var defaultDirection = this.props.defaultSortDescending ? 'descending' : 'ascending';
	
	                        console.warn('Invalid default sort specified. Defaulting to ' + defaultDirection);
	                        sortDirection = this.props.defaultSortDescending ? -1 : 1;
	                    }
	                } else {
	                    sortDirection = this.props.defaultSortDescending ? -1 : 1;
	                }
	            } else {
	                columnName = column;
	                sortDirection = this.props.defaultSortDescending ? -1 : 1;
	            }
	
	            return {
	                column: columnName,
	                direction: sortDirection
	            };
	        }
	    }, {
	        key: 'updateCurrentSort',
	        value: function updateCurrentSort(sortBy) {
	            if (sortBy !== false && sortBy.column !== this.state.currentSort.column && sortBy.direction !== this.state.currentSort.direction) {
	
	                this.setState({ currentSort: this.getCurrentSort(sortBy) });
	            }
	        }
	    }, {
	        key: 'updateCurrentPage',
	        value: function updateCurrentPage(nextPage) {
	            if (typeof nextPage !== 'undefined' && nextPage !== this.state.currentPage) {
	                this.setState({ currentPage: nextPage });
	            }
	        }
	    }, {
	        key: 'componentWillMount',
	        value: function componentWillMount() {
	            this.initialize(this.props);
	            this.sortByCurrentSort();
	            this.filterBy(this.props.filterBy);
	        }
	    }, {
	        key: 'componentWillReceiveProps',
	        value: function componentWillReceiveProps(nextProps) {
	            this.initialize(nextProps);
	            this.updateCurrentPage(nextProps.currentPage);
	            this.updateCurrentSort(nextProps.sortBy);
	            this.sortByCurrentSort();
	            this.filterBy(nextProps.filterBy);
	        }
	    }, {
	        key: 'applyFilter',
	        value: function applyFilter(filter, children) {
	            // Helper function to apply filter text to a list of table rows
	            filter = filter.toLowerCase();
	            var matchedChildren = [];
	
	            for (var i = 0; i < children.length; i++) {
	                var data = children[i].props.data;
	
	                for (var filterColumn in this._filterable) {
	                    if (typeof data[filterColumn] !== 'undefined') {
	                        // Default filter
	                        if (typeof this._filterable[filterColumn] === 'undefined' || this._filterable[filterColumn] === 'default') {
	                            if ((0, _libExtract_data_from.extractDataFrom)(data, filterColumn).toString().toLowerCase().indexOf(filter) > -1) {
	                                matchedChildren.push(children[i]);
	                                break;
	                            }
	                        } else {
	                            // Apply custom filter
	                            if (this._filterable[filterColumn]((0, _libExtract_data_from.extractDataFrom)(data, filterColumn).toString(), filter)) {
	                                matchedChildren.push(children[i]);
	                                break;
	                            }
	                        }
	                    }
	                }
	            }
	
	            return matchedChildren;
	        }
	    }, {
	        key: 'sortByCurrentSort',
	        value: function sortByCurrentSort() {
	            // Apply a sort function according to the current sort in the state.
	            // This allows us to perform a default sort even on a non sortable column.
	            var currentSort = this.state.currentSort;
	
	            if (currentSort.column === null) {
	                return;
	            }
	
	            this.data.sort((function (a, b) {
	                var keyA = (0, _libExtract_data_from.extractDataFrom)(a, currentSort.column);
	                keyA = (0, _unsafe.isUnsafe)(keyA) ? keyA.toString() : keyA || '';
	                var keyB = (0, _libExtract_data_from.extractDataFrom)(b, currentSort.column);
	                keyB = (0, _unsafe.isUnsafe)(keyB) ? keyB.toString() : keyB || '';
	
	                // Default sort
	                if (typeof this._sortable[currentSort.column] === 'undefined' || this._sortable[currentSort.column] === 'default') {
	
	                    // Reverse direction if we're doing a reverse sort
	                    if (keyA < keyB) {
	                        return -1 * currentSort.direction;
	                    }
	
	                    if (keyA > keyB) {
	                        return 1 * currentSort.direction;
	                    }
	
	                    return 0;
	                } else {
	                    // Reverse columns if we're doing a reverse sort
	                    if (currentSort.direction === 1) {
	                        return this._sortable[currentSort.column](keyA, keyB);
	                    } else {
	                        return this._sortable[currentSort.column](keyB, keyA);
	                    }
	                }
	            }).bind(this));
	        }
	    }, {
	        key: 'onSort',
	        value: function onSort(column) {
	            // Don't perform sort on unsortable columns
	            if (typeof this._sortable[column] === 'undefined') {
	                return;
	            }
	
	            var currentSort = this.state.currentSort;
	
	            if (currentSort.column === column) {
	                currentSort.direction *= -1;
	            } else {
	                currentSort.column = column;
	                currentSort.direction = this.props.defaultSortDescending ? -1 : 1;
	            }
	
	            // Set the current sort and pass it to the sort function
	            this.setState({ currentSort: currentSort });
	            this.sortByCurrentSort();
	
	            if (typeof this.props.onSort === 'function') {
	                this.props.onSort(currentSort);
	            }
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            var _this = this;
	
	            var children = [];
	            var columns = undefined;
	            var userColumnsSpecified = false;
	            var showHeaders = typeof this.props.hideTableHeader === 'undefined';
	
	            var firstChild = null;
	
	            if (this.props.children) {
	                if (this.props.children.length > 0 && this.props.children[0] && this.props.children[0].type === _thead.Thead) {
	                    firstChild = this.props.children[0];
	                } else if (this.props.children.type === _thead.Thead) {
	                    firstChild = this.props.children;
	                }
	            }
	
	            if (firstChild !== null) {
	                columns = _thead.Thead.getColumns(firstChild);
	            } else {
	                columns = this.props.columns || [];
	            }
	
	            if (columns.length > 0) {
	                userColumnsSpecified = true;
	                columns = this.translateColumnsArray(columns);
	            }
	
	            // Build up table rows
	            if (this.data && typeof this.data.map === 'function') {
	                // Build up the columns array
	                children = children.concat(this.data.map((function (rawData, i) {
	                    var data = rawData;
	                    var props = {};
	                    if (rawData.__reactableMeta === true) {
	                        data = rawData.data;
	                        props = rawData.props;
	                    }
	
	                    // Loop through the keys in each data row and build a td for it
	                    for (var k in data) {
	                        if (data.hasOwnProperty(k)) {
	                            // Update the columns array with the data's keys if columns were not
	                            // already specified
	                            if (userColumnsSpecified === false) {
	                                (function () {
	                                    var column = {
	                                        key: k,
	                                        label: k
	                                    };
	
	                                    // Only add a new column if it doesn't already exist in the columns array
	                                    if (columns.find(function (element) {
	                                        return element.key === column.key;
	                                    }) === undefined) {
	                                        columns.push(column);
	                                    }
	                                })();
	                            }
	                        }
	                    }
	
	                    return _react2['default'].createElement(_tr.Tr, _extends({ columns: columns, key: i, data: data }, props));
	                }).bind(this)));
	            }
	
	            if (this.props.sortable === true) {
	                for (var i = 0; i < columns.length; i++) {
	                    this._sortable[columns[i].key] = 'default';
	                }
	            }
	
	            // Determine if we render the filter box
	            var filtering = false;
	            if (this.props.filterable && Array.isArray(this.props.filterable) && this.props.filterable.length > 0 && !this.props.hideFilterInput) {
	                filtering = true;
	            }
	
	            // Apply filters
	            var filteredChildren = children;
	            if (this.state.filter !== '') {
	                filteredChildren = this.applyFilter(this.state.filter, filteredChildren);
	            }
	
	            // Determine pagination properties and which columns to display
	            var itemsPerPage = 0;
	            var pagination = false;
	            var numPages = undefined;
	            var currentPage = this.state.currentPage;
	            var pageButtonLimit = this.props.pageButtonLimit || 10;
	
	            var currentChildren = filteredChildren;
	            if (this.props.itemsPerPage > 0) {
	                itemsPerPage = this.props.itemsPerPage;
	                numPages = Math.ceil(filteredChildren.length / itemsPerPage);
	
	                if (currentPage > numPages - 1) {
	                    currentPage = numPages - 1;
	                }
	
	                pagination = true;
	                currentChildren = filteredChildren.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
	            }
	
	            // Manually transfer props
	            var props = (0, _libFilter_props_from.filterPropsFrom)(this.props);
	
	            var noDataText = this.props.noDataText ? _react2['default'].createElement(
	                'tr',
	                { className: 'reactable-no-data' },
	                _react2['default'].createElement(
	                    'td',
	                    { colSpan: columns.length },
	                    this.props.noDataText
	                )
	            ) : null;
	
	            var tableHeader = null;
	            if (columns && columns.length > 0 && showHeaders) {
	                tableHeader = _react2['default'].createElement(_thead.Thead, { columns: columns,
	                    filtering: filtering,
	                    onFilter: function (filter) {
	                        _this.setState({ filter: filter });
	                        if (_this.props.onFilter) {
	                            _this.props.onFilter(filter);
	                        }
	                    },
	                    filterPlaceholder: this.props.filterPlaceholder,
	                    filterClassName: this.props.filterClassName,
	                    currentFilter: this.state.filter,
	                    sort: this.state.currentSort,
	                    sortableColumns: this._sortable,
	                    onSort: this.onSort.bind(this),
	                    key: 'thead' });
	            }
	            return _react2['default'].createElement(
	                'table',
	                props,
	                tableHeader,
	                _react2['default'].createElement(
	                    'tbody',
	                    { className: 'reactable-data', key: 'tbody' },
	                    currentChildren.length > 0 ? currentChildren : noDataText
	                ),
	                pagination === true ? _react2['default'].createElement(_paginator.Paginator, { colSpan: columns.length,
	                    pageButtonLimit: pageButtonLimit,
	                    numPages: numPages,
	                    currentPage: currentPage,
	                    onPageChange: function (page) {
	                        _this.setState({ currentPage: page });
	                        if (_this.props.onPageChange) {
	                            _this.props.onPageChange(page);
	                        }
	                    },
	                    previousPageLabel: this.props.previousPageLabel,
	                    nextPageLabel: this.props.nextPageLabel,
	                    key: 'paginator' }) : null,
	                this.tfoot
	            );
	        }
	    }]);
	
	    return Table;
	})(_react2['default'].Component);
	
	exports.Table = Table;
	
	Table.defaultProps = {
	    sortBy: false,
	    defaultSort: false,
	    defaultSortDescending: false,
	    itemsPerPage: 0,
	    filterBy: '',
	    hideFilterInput: false
	};


/***/ },

/***/ 931:
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.filterPropsFrom = filterPropsFrom;
	var internalProps = {
	    column: true,
	    columns: true,
	    sortable: true,
	    filterable: true,
	    filtering: true,
	    onFilter: true,
	    filterPlaceholder: true,
	    filterClassName: true,
	    currentFilter: true,
	    sort: true,
	    sortBy: true,
	    sortableColumns: true,
	    onSort: true,
	    defaultSort: true,
	    defaultSortDescending: true,
	    itemsPerPage: true,
	    filterBy: true,
	    hideFilterInput: true,
	    noDataText: true,
	    currentPage: true,
	    pageButtonLimit: true,
	    childNode: true,
	    data: true,
	    children: true
	};
	
	function filterPropsFrom(baseProps) {
	    baseProps = baseProps || {};
	    var props = {};
	    for (var key in baseProps) {
	        if (!(key in internalProps)) {
	            props[key] = baseProps[key];
	        }
	    }
	
	    return props;
	}


/***/ },

/***/ 932:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.extractDataFrom = extractDataFrom;
	
	var _stringable = __webpack_require__(933);
	
	function extractDataFrom(key, column) {
	    var value;
	    if (typeof key !== 'undefined' && key !== null && key.__reactableMeta === true) {
	        value = key.data[column];
	    } else {
	        value = key[column];
	    }
	
	    if (typeof value !== 'undefined' && value !== null && value.__reactableMeta === true) {
	        value = typeof value.props.value !== 'undefined' && value.props.value !== null ? value.props.value : value.value;
	    }
	
	    return (0, _stringable.stringable)(value) ? value : '';
	}


/***/ },

/***/ 933:
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.stringable = stringable;
	
	function stringable(thing) {
	    return thing !== null && typeof thing !== 'undefined' && typeof (thing.toString === 'function');
	}


/***/ },

/***/ 934:
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	exports.unsafe = unsafe;
	exports.isUnsafe = isUnsafe;
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Unsafe = (function () {
	    function Unsafe(content) {
	        _classCallCheck(this, Unsafe);
	
	        this.content = content;
	    }
	
	    _createClass(Unsafe, [{
	        key: "toString",
	        value: function toString() {
	            return this.content;
	        }
	    }]);
	
	    return Unsafe;
	})();
	
	function unsafe(str) {
	    return new Unsafe(str);
	}
	
	;
	
	function isUnsafe(obj) {
	    return obj instanceof Unsafe;
	}
	
	;


/***/ },

/***/ 935:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _th = __webpack_require__(936);
	
	var _filterer = __webpack_require__(937);
	
	var _libFilter_props_from = __webpack_require__(931);
	
	var Thead = (function (_React$Component) {
	    _inherits(Thead, _React$Component);
	
	    function Thead() {
	        _classCallCheck(this, Thead);
	
	        _get(Object.getPrototypeOf(Thead.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Thead, [{
	        key: 'handleClickTh',
	        value: function handleClickTh(column) {
	            this.props.onSort(column.key);
	        }
	    }, {
	        key: 'handleKeyDownTh',
	        value: function handleKeyDownTh(column, event) {
	            if (event.keyCode === 13) {
	                this.props.onSort(column.key);
	            }
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            // Declare the list of Ths
	            var Ths = [];
	            for (var index = 0; index < this.props.columns.length; index++) {
	                var column = this.props.columns[index];
	                var thClass = 'reactable-th-' + column.key.replace(/\s+/g, '-').toLowerCase();
	                var sortClass = '';
	                var thRole = null;
	
	                if (this.props.sortableColumns[column.key]) {
	                    sortClass += 'reactable-header-sortable ';
	                    thRole = 'button';
	                }
	
	                if (this.props.sort.column === column.key) {
	                    sortClass += 'reactable-header-sort';
	                    if (this.props.sort.direction === 1) {
	                        sortClass += '-asc';
	                    } else {
	                        sortClass += '-desc';
	                    }
	                }
	
	                if (sortClass.length > 0) {
	                    thClass += ' ' + sortClass;
	                }
	
	                if (typeof column.props === 'object' && typeof column.props.className === 'string') {
	                    thClass += ' ' + column.props.className;
	                }
	
	                Ths.push(_react2['default'].createElement(
	                    _th.Th,
	                    _extends({}, column.props, {
	                        className: thClass,
	                        key: index,
	                        onClick: this.handleClickTh.bind(this, column),
	                        onKeyDown: this.handleKeyDownTh.bind(this, column),
	                        role: thRole,
	                        tabIndex: '0' }),
	                    column.label
	                ));
	            }
	
	            // Manually transfer props
	            var props = (0, _libFilter_props_from.filterPropsFrom)(this.props);
	
	            return _react2['default'].createElement(
	                'thead',
	                props,
	                this.props.filtering === true ? _react2['default'].createElement(_filterer.Filterer, {
	                    colSpan: this.props.columns.length,
	                    onFilter: this.props.onFilter,
	                    placeholder: this.props.filterPlaceholder,
	                    value: this.props.currentFilter,
	                    className: this.props.filterClassName
	                }) : null,
	                _react2['default'].createElement(
	                    'tr',
	                    { className: 'reactable-column-header' },
	                    Ths
	                )
	            );
	        }
	    }], [{
	        key: 'getColumns',
	        value: function getColumns(component) {
	            // Can't use React.Children.map since that doesn't return a proper array
	            var columns = [];
	            _react2['default'].Children.forEach(component.props.children, function (th) {
	                var column = {};
	                if (typeof th.props !== 'undefined') {
	                    column.props = (0, _libFilter_props_from.filterPropsFrom)(th.props);
	
	                    // use the content as the label & key
	                    if (typeof th.props.children !== 'undefined') {
	                        column.label = th.props.children;
	                        column.key = column.label;
	                    }
	
	                    // the key in the column attribute supersedes the one defined previously
	                    if (typeof th.props.column === 'string') {
	                        column.key = th.props.column;
	
	                        // in case we don't have a label yet
	                        if (typeof column.label === 'undefined') {
	                            column.label = column.key;
	                        }
	                    }
	                }
	
	                if (typeof column.key === 'undefined') {
	                    throw new TypeError('<th> must have either a "column" property or a string ' + 'child');
	                } else {
	                    columns.push(column);
	                }
	            });
	
	            return columns;
	        }
	    }]);
	
	    return Thead;
	})(_react2['default'].Component);
	
	exports.Thead = Thead;
	;


/***/ },

/***/ 936:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _unsafe = __webpack_require__(934);
	
	var _libFilter_props_from = __webpack_require__(931);
	
	var Th = (function (_React$Component) {
	    _inherits(Th, _React$Component);
	
	    function Th() {
	        _classCallCheck(this, Th);
	
	        _get(Object.getPrototypeOf(Th.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Th, [{
	        key: 'render',
	        value: function render() {
	            var childProps = undefined;
	
	            if ((0, _unsafe.isUnsafe)(this.props.children)) {
	                return _react2['default'].createElement('th', _extends({}, (0, _libFilter_props_from.filterPropsFrom)(this.props), {
	                    dangerouslySetInnerHTML: { __html: this.props.children.toString() } }));
	            } else {
	                return _react2['default'].createElement(
	                    'th',
	                    (0, _libFilter_props_from.filterPropsFrom)(this.props),
	                    this.props.children
	                );
	            }
	        }
	    }]);
	
	    return Th;
	})(_react2['default'].Component);
	
	exports.Th = Th;
	;


/***/ },

/***/ 937:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(44);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var FiltererInput = (function (_React$Component) {
	    _inherits(FiltererInput, _React$Component);
	
	    function FiltererInput() {
	        _classCallCheck(this, FiltererInput);
	
	        _get(Object.getPrototypeOf(FiltererInput.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(FiltererInput, [{
	        key: 'onChange',
	        value: function onChange() {
	            this.props.onFilter(_reactDom2['default'].findDOMNode(this).value);
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            return _react2['default'].createElement('input', { type: 'text',
	                className: this.props.className,
	                placeholder: this.props.placeholder,
	                value: this.props.value,
	                onKeyUp: this.onChange.bind(this),
	                onChange: this.onChange.bind(this) });
	        }
	    }]);
	
	    return FiltererInput;
	})(_react2['default'].Component);
	
	exports.FiltererInput = FiltererInput;
	;
	
	var Filterer = (function (_React$Component2) {
	    _inherits(Filterer, _React$Component2);
	
	    function Filterer() {
	        _classCallCheck(this, Filterer);
	
	        _get(Object.getPrototypeOf(Filterer.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Filterer, [{
	        key: 'render',
	        value: function render() {
	            if (typeof this.props.colSpan === 'undefined') {
	                throw new TypeError('Must pass a colSpan argument to Filterer');
	            }
	
	            return _react2['default'].createElement(
	                'tr',
	                { className: 'reactable-filterer' },
	                _react2['default'].createElement(
	                    'td',
	                    { colSpan: this.props.colSpan },
	                    _react2['default'].createElement(FiltererInput, { onFilter: this.props.onFilter,
	                        value: this.props.value,
	                        placeholder: this.props.placeholder,
	                        className: this.props.className ? 'reactable-filter-input ' + this.props.className : 'reactable-filter-input' })
	                )
	            );
	        }
	    }]);
	
	    return Filterer;
	})(_react2['default'].Component);
	
	exports.Filterer = Filterer;
	;


/***/ },

/***/ 938:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _td = __webpack_require__(939);
	
	var _libTo_array = __webpack_require__(941);
	
	var _libFilter_props_from = __webpack_require__(931);
	
	var Tr = (function (_React$Component) {
	    _inherits(Tr, _React$Component);
	
	    function Tr() {
	        _classCallCheck(this, Tr);
	
	        _get(Object.getPrototypeOf(Tr.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Tr, [{
	        key: 'render',
	        value: function render() {
	            var children = (0, _libTo_array.toArray)(_react2['default'].Children.children(this.props.children));
	
	            if (this.props.data && this.props.columns && typeof this.props.columns.map === 'function') {
	                if (typeof children.concat === 'undefined') {
	                    console.log(children);
	                }
	
	                children = children.concat(this.props.columns.map((function (column, i) {
	                    if (this.props.data.hasOwnProperty(column.key)) {
	                        var value = this.props.data[column.key];
	                        var props = {};
	
	                        if (typeof value !== 'undefined' && value !== null && value.__reactableMeta === true) {
	                            props = value.props;
	                            value = value.value;
	                        }
	
	                        return _react2['default'].createElement(
	                            _td.Td,
	                            _extends({ column: column, key: column.key }, props),
	                            value
	                        );
	                    } else {
	                        return _react2['default'].createElement(_td.Td, { column: column, key: column.key });
	                    }
	                }).bind(this)));
	            }
	
	            // Manually transfer props
	            var props = (0, _libFilter_props_from.filterPropsFrom)(this.props);
	
	            return _react2['default'].DOM.tr(props, children);
	        }
	    }]);
	
	    return Tr;
	})(_react2['default'].Component);
	
	exports.Tr = Tr;
	;
	
	Tr.childNode = _td.Td;
	Tr.dataType = 'object';


/***/ },

/***/ 939:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _libIs_react_component = __webpack_require__(940);
	
	var _libStringable = __webpack_require__(933);
	
	var _unsafe = __webpack_require__(934);
	
	var _libFilter_props_from = __webpack_require__(931);
	
	var Td = (function (_React$Component) {
	    _inherits(Td, _React$Component);
	
	    function Td() {
	        _classCallCheck(this, Td);
	
	        _get(Object.getPrototypeOf(Td.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Td, [{
	        key: 'stringifyIfNotReactComponent',
	        value: function stringifyIfNotReactComponent(object) {
	            if (!(0, _libIs_react_component.isReactComponent)(object) && (0, _libStringable.stringable)(object) && typeof object !== 'undefined') {
	                return object.toString();
	            }
	            return null;
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            // Attach any properties on the column to this Td object to allow things like custom event handlers
	            var mergedProps = (0, _libFilter_props_from.filterPropsFrom)(this.props);
	            if (typeof this.props.column === 'object') {
	                for (var key in this.props.column) {
	                    if (key !== 'key' && key !== 'name') {
	                        mergedProps[key] = this.props.column[key];
	                    }
	                }
	            }
	            // handleClick aliases onClick event
	            mergedProps.onClick = this.props.handleClick;
	
	            var stringifiedChildProps;
	
	            if (typeof this.props.data === 'undefined') {
	                stringifiedChildProps = this.stringifyIfNotReactComponent(this.props.children);
	            }
	
	            if ((0, _unsafe.isUnsafe)(this.props.children)) {
	                return _react2['default'].createElement('td', _extends({}, mergedProps, {
	                    dangerouslySetInnerHTML: { __html: this.props.children.toString() } }));
	            } else {
	                return _react2['default'].createElement(
	                    'td',
	                    mergedProps,
	                    stringifiedChildProps || this.props.children
	                );
	            }
	        }
	    }]);
	
	    return Td;
	})(_react2['default'].Component);
	
	exports.Td = Td;
	;


/***/ },

/***/ 940:
/***/ function(module, exports) {

	// this is a bit hacky - it'd be nice if React exposed an API for this
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.isReactComponent = isReactComponent;
	
	function isReactComponent(thing) {
	    return thing !== null && typeof thing === 'object' && typeof thing.props !== 'undefined';
	}


/***/ },

/***/ 941:
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.toArray = toArray;
	
	function toArray(obj) {
	    var ret = [];
	    for (var attr in obj) {
	        ret[attr] = obj;
	    }
	
	    return ret;
	}


/***/ },

/***/ 942:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	var Tfoot = (function (_React$Component) {
	    _inherits(Tfoot, _React$Component);
	
	    function Tfoot() {
	        _classCallCheck(this, Tfoot);
	
	        _get(Object.getPrototypeOf(Tfoot.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Tfoot, [{
	        key: 'render',
	        value: function render() {
	            return _react2['default'].createElement('tfoot', this.props);
	        }
	    }]);
	
	    return Tfoot;
	})(_react2['default'].Component);
	
	exports.Tfoot = Tfoot;


/***/ },

/***/ 943:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(15);
	
	var _react2 = _interopRequireDefault(_react);
	
	function pageHref(num) {
	    return '#page-' + (num + 1);
	}
	
	var Paginator = (function (_React$Component) {
	    _inherits(Paginator, _React$Component);
	
	    function Paginator() {
	        _classCallCheck(this, Paginator);
	
	        _get(Object.getPrototypeOf(Paginator.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(Paginator, [{
	        key: 'handlePrevious',
	        value: function handlePrevious(e) {
	            e.preventDefault();
	            this.props.onPageChange(this.props.currentPage - 1);
	        }
	    }, {
	        key: 'handleNext',
	        value: function handleNext(e) {
	            e.preventDefault();
	            this.props.onPageChange(this.props.currentPage + 1);
	        }
	    }, {
	        key: 'handlePageButton',
	        value: function handlePageButton(page, e) {
	            e.preventDefault();
	            this.props.onPageChange(page);
	        }
	    }, {
	        key: 'renderPrevious',
	        value: function renderPrevious() {
	            if (this.props.currentPage > 0) {
	                return _react2['default'].createElement(
	                    'a',
	                    { className: 'reactable-previous-page',
	                        href: pageHref(this.props.currentPage - 1),
	                        onClick: this.handlePrevious.bind(this) },
	                    this.props.previousPageLabel || 'Previous'
	                );
	            }
	        }
	    }, {
	        key: 'renderNext',
	        value: function renderNext() {
	            if (this.props.currentPage < this.props.numPages - 1) {
	                return _react2['default'].createElement(
	                    'a',
	                    { className: 'reactable-next-page',
	                        href: pageHref(this.props.currentPage + 1),
	                        onClick: this.handleNext.bind(this) },
	                    this.props.nextPageLabel || 'Next'
	                );
	            }
	        }
	    }, {
	        key: 'renderPageButton',
	        value: function renderPageButton(className, pageNum) {
	
	            return _react2['default'].createElement(
	                'a',
	                { className: className,
	                    key: pageNum,
	                    href: pageHref(pageNum),
	                    onClick: this.handlePageButton.bind(this, pageNum) },
	                pageNum + 1
	            );
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            if (typeof this.props.colSpan === 'undefined') {
	                throw new TypeError('Must pass a colSpan argument to Paginator');
	            }
	
	            if (typeof this.props.numPages === 'undefined') {
	                throw new TypeError('Must pass a non-zero numPages argument to Paginator');
	            }
	
	            if (typeof this.props.currentPage === 'undefined') {
	                throw new TypeError('Must pass a currentPage argument to Paginator');
	            }
	
	            var pageButtons = [];
	            var pageButtonLimit = this.props.pageButtonLimit;
	            var currentPage = this.props.currentPage;
	            var numPages = this.props.numPages;
	            var lowerHalf = Math.round(pageButtonLimit / 2);
	            var upperHalf = pageButtonLimit - lowerHalf;
	
	            for (var i = 0; i < this.props.numPages; i++) {
	                var showPageButton = false;
	                var pageNum = i;
	                var className = "reactable-page-button";
	                if (currentPage === i) {
	                    className += " reactable-current-page";
	                }
	                pageButtons.push(this.renderPageButton(className, pageNum));
	            }
	
	            if (currentPage - pageButtonLimit + lowerHalf > 0) {
	                if (currentPage > numPages - lowerHalf) {
	                    pageButtons.splice(0, numPages - pageButtonLimit);
	                } else {
	                    pageButtons.splice(0, currentPage - pageButtonLimit + lowerHalf);
	                }
	            }
	
	            if (numPages - currentPage > upperHalf) {
	                pageButtons.splice(pageButtonLimit, pageButtons.length - pageButtonLimit);
	            }
	
	            return _react2['default'].createElement(
	                'tbody',
	                { className: 'reactable-pagination' },
	                _react2['default'].createElement(
	                    'tr',
	                    null,
	                    _react2['default'].createElement(
	                        'td',
	                        { colSpan: this.props.colSpan },
	                        this.renderPrevious(),
	                        pageButtons,
	                        this.renderNext()
	                    )
	                )
	            );
	        }
	    }]);
	
	    return Paginator;
	})(_react2['default'].Component);
	
	exports.Paginator = Paginator;
	;


/***/ },

/***/ 944:
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	var Sort = {
	    Numeric: function Numeric(a, b) {
	        var valA = parseFloat(a.toString().replace(/,/g, ''));
	        var valB = parseFloat(b.toString().replace(/,/g, ''));
	
	        // Sort non-numeric values alphabetically at the bottom of the list
	        if (isNaN(valA) && isNaN(valB)) {
	            valA = a;
	            valB = b;
	        } else {
	            if (isNaN(valA)) {
	                return 1;
	            }
	            if (isNaN(valB)) {
	                return -1;
	            }
	        }
	
	        if (valA < valB) {
	            return -1;
	        }
	        if (valA > valB) {
	            return 1;
	        }
	
	        return 0;
	    },
	
	    NumericInteger: function NumericInteger(a, b) {
	        if (isNaN(a) || isNaN(b)) {
	            return a > b ? 1 : -1;
	        }
	
	        return a - b;
	    },
	
	    Currency: function Currency(a, b) {
	        // Parse out dollar signs, then do a regular numeric sort
	        a = a.replace(/[^0-9\.\-\,]+/g, '');
	        b = b.replace(/[^0-9\.\-\,]+/g, '');
	
	        return exports.Sort.Numeric(a, b);
	    },
	
	    Date: (function (_Date) {
	        function Date(_x, _x2) {
	            return _Date.apply(this, arguments);
	        }
	
	        Date.toString = function () {
	            return _Date.toString();
	        };
	
	        return Date;
	    })(function (a, b) {
	        // Note: this function tries to do a standard javascript string -> date conversion
	        // If you need more control over the date string format, consider using a different
	        // date library and writing your own function
	        var valA = Date.parse(a);
	        var valB = Date.parse(b);
	
	        // Handle non-date values with numeric sort
	        // Sort non-numeric values alphabetically at the bottom of the list
	        if (isNaN(valA) || isNaN(valB)) {
	            return exports.Sort.Numeric(a, b);
	        }
	
	        if (valA > valB) {
	            return 1;
	        }
	        if (valB > valA) {
	            return -1;
	        }
	
	        return 0;
	    }),
	
	    CaseInsensitive: function CaseInsensitive(a, b) {
	        return a.toLowerCase().localeCompare(b.toLowerCase());
	    }
	};
	exports.Sort = Sort;


/***/ }

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGFnZXMvZGF0YXNldFZpZXcvRGF0YXNldFBhZ2UuanN4Iiwid2VicGFjazovLy8uL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90YWJsZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2xpYi9maWx0ZXJfcHJvcHNfZnJvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2xpYi9leHRyYWN0X2RhdGFfZnJvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2xpYi9zdHJpbmdhYmxlLmpzIiwid2VicGFjazovLy8uL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvdW5zYWZlLmpzIiwid2VicGFjazovLy8uL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvdGhlYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90aC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2ZpbHRlcmVyLmpzIiwid2VicGFjazovLy8uL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvdHIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90ZC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2xpYi9pc19yZWFjdF9jb21wb25lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS9saWIvdG9fYXJyYXkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90Zm9vdC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL3BhZ2luYXRvci5qcyIsIndlYnBhY2s6Ly8vLi9+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QUFDQSxrQkFBaUI7QUFDakI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esa0JBQWlCLG9DQUFvQztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQXlCLDhCQUE4QjtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQSxFQUFDOztBQUVEO0FBQ0E7Ozs7Ozs7O0FDNUpBOztBQUVBO0FBQ0E7QUFDQSxFQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InJlYWN0YXBwL2pzLzMuY2h1bmsuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IGFjdGlvbkNyZWF0b3JzLCBtYXBTdGF0ZVRvUHJvcHMgfSBmcm9tICcuL2R1Y2snO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IFRhYmxlLCB1bnNhZmUgfSAgZnJvbSAncmVhY3RhYmxlJztcbmltcG9ydCAqIGFzIF8gZnJvbSAndW5kZXJzY29yZSc7XG5leHBvcnQgY2xhc3MgRGF0YVNldFBhZ2VVbmNvbm5lY3RlZCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpe1xuXG4gICAgICAgIHRoaXMucHJvcHMubG9hZERhdGFzZXRzSW5mbygpO1xuXG4gICAgfVxuXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmRhdGFzZXRzKSB7XG4gICAgICAgICAgICBjb25zdCByb3dzID0gW107XG4gICAgICAgICAgICBjb25zdCBzdHVkaWVzID0gW107XG4gICAgICAgICAgICB2YXIgdGVtcE9iaiA9IHt9O1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5kYXRhc2V0cy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoc3R1ZGllcy5pbmRleE9mKGl0ZW0uY2FuY2VyX3N0dWR5X2lkZW50aWZpZXIpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIHN0dWRpZXMucHVzaChpdGVtLmNhbmNlcl9zdHVkeV9pZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGVtcE9iaiA9IHtDYW5jZXJTdHVkeTogdW5zYWZlKFwiPGEgaHJlZj0naHR0cDovL3d3dy5jYmlvcG9ydGFsLm9yZy9zdHVkeT9pZD1cIiArIGl0ZW0uY2FuY2VyX3N0dWR5X2lkZW50aWZpZXIgKyBcIiNzdW1tYXJ5JyB0YXJnZXQ9J19ibGFuayc+XCIgKyBpdGVtLm5hbWUgKyBcIjwvYT4gIDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9jQmlvUG9ydGFsL2RhdGFodWIvYmxvYi9tYXN0ZXIvcHVibGljL1wiICsgaXRlbS5jYW5jZXJfc3R1ZHlfaWRlbnRpZmllciArIFwiLnRhci5neicgZG93bmxvYWQ+PGkgY2xhc3M9J2ZhIGZhLWRvd25sb2FkJz48L2k+PC9hPlwiKX07XG4gICAgICAgICAgICAgICAgICAgIGlmKCFfLmlzTnVsbChpdGVtLmNpdGF0aW9uKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wT2JqLlJlZmVyZW5jZSA9IHVuc2FmZShcIjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwczovL3d3dy5uY2JpLm5sbS5uaWguZ292L3B1Ym1lZC9cIiArIGl0ZW0ucG1pZCArIFwiJz5cIiArIGl0ZW0uY2l0YXRpb24gKyBcIjwvYT5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHRlbXBPYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wT2JqID0gcm93c1tzdHVkaWVzLmluZGV4T2YoaXRlbS5jYW5jZXJfc3R1ZHlfaWRlbnRpZmllcildO1xuICAgICAgICAgICAgICAgIGlmKGl0ZW0uc3RhYmxlX2lkLmVuZHNXaXRoKFwiX2FsbFwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBPYmouQWxsID0gaXRlbS5jb3VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihpdGVtLnN0YWJsZV9pZC5lbmRzV2l0aChcIl9zZXF1ZW5jZWRcIikpe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wT2JqLlNlcXVlbmNlZCA9IGl0ZW0uY291bnQ7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoaXRlbS5zdGFibGVfaWQuZW5kc1dpdGgoXCJfY25hXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgdGVtcE9iai5DTkEgPSBpdGVtLmNvdW50O1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKGl0ZW0uc3RhYmxlX2lkLmVuZHNXaXRoKFwicm5hX3NlcV92Ml9tcm5hXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgdGVtcE9ialtcIlR1bW9yIG1STkEgKFJOQS1TZXEgVjIpXCJdID0gaXRlbS5jb3VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihpdGVtLnN0YWJsZV9pZC5lbmRzV2l0aChcIl9taWNyb3JuYVwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBPYmpbXCJUdW1vciBtUk5BIChtaWNyb2FycmF5KVwiXSA9IGl0ZW0uY291bnQ7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoaXRlbS5zdGFibGVfaWQuZW5kc1dpdGgoXCJtcm5hXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgdGVtcE9ialtcIlR1bW9yIG1pUk5BXCJdID0gaXRlbS5jb3VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihpdGVtLnN0YWJsZV9pZC5lbmRzV2l0aChcIm1ldGh5bGF0aW9uX2htMjdcIikpe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wT2JqW1wiTWV0aHlsYXRpb24gKEhNMjcpXCJdID0gaXRlbS5jb3VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihpdGVtLnN0YWJsZV9pZC5lbmRzV2l0aChcIl9ycHBhXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgdGVtcE9iai5SUFBBID0gaXRlbS5jb3VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihpdGVtLnN0YWJsZV9pZC5lbmRzV2l0aChcIl9jb21wbGV0ZVwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBPYmouQ29tcGxldGUgPSBpdGVtLmNvdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vICAgIHJldHVybiA8VGFibGUgY2xhc3NOYW1lPVwidGFibGVcIiBkYXRhPXtyb3dzfSBzb3J0YWJsZT17dHJ1ZX0gZmlsdGVyYWJsZT17WydOYW1lJywgJ1JlZmVyZW5jZScsICdBbGwnLCAnU2VxdWVuY2VkJywgJ0NOQScsICdUdW1vcl9STkFfc2VxJywgJ1R1bW9yX1JOQV9taWNyb2FycmF5JywgJ1R1bW9yX21pUk5BJywgJ01ldGh5bGF0aW9uJywgJ1JQUEEnLCAnQ29tcGxldGUnXX0vPjtcbiAgICAgICAgICAgIHJldHVybiA8VGFibGUgY2xhc3NOYW1lPVwidGFibGVcIiBkYXRhPXtyb3dzfSBzb3J0YWJsZT17dHJ1ZX0gZmlsdGVyYWJsZT17WydDYW5jZXJTdHVkeScsJ1JlZmVyZW5jZScsJ0FsbCcsJ1NlcXVlbmNlZCcsJ0NOQScsJ1R1bW9yIG1STkEgKFJOQS1TZXEgVjIpJywnVHVtb3IgbVJOQSAobWljcm9hcnJheSknLCdUdW1vciBtaVJOQScsJ01ldGh5bGF0aW9uIChITTI3KScsJ1JQUEEnLCdDb21wbGV0ZSddfS8+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+bG9hZGluZzwvZGl2PlxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsYWN0aW9uQ3JlYXRvcnMpKERhdGFTZXRQYWdlVW5jb25uZWN0ZWQpO1xuXG5cblxuXG5cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhZ2VzL2RhdGFzZXRWaWV3L0RhdGFzZXRQYWdlLmpzeFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RhYmxlVGFibGUgPSByZXF1aXJlKCcuL3JlYWN0YWJsZS90YWJsZScpO1xuXG52YXIgX3JlYWN0YWJsZVRyID0gcmVxdWlyZSgnLi9yZWFjdGFibGUvdHInKTtcblxudmFyIF9yZWFjdGFibGVUZCA9IHJlcXVpcmUoJy4vcmVhY3RhYmxlL3RkJyk7XG5cbnZhciBfcmVhY3RhYmxlVGggPSByZXF1aXJlKCcuL3JlYWN0YWJsZS90aCcpO1xuXG52YXIgX3JlYWN0YWJsZVRmb290ID0gcmVxdWlyZSgnLi9yZWFjdGFibGUvdGZvb3QnKTtcblxudmFyIF9yZWFjdGFibGVUaGVhZCA9IHJlcXVpcmUoJy4vcmVhY3RhYmxlL3RoZWFkJyk7XG5cbnZhciBfcmVhY3RhYmxlU29ydCA9IHJlcXVpcmUoJy4vcmVhY3RhYmxlL3NvcnQnKTtcblxudmFyIF9yZWFjdGFibGVVbnNhZmUgPSByZXF1aXJlKCcuL3JlYWN0YWJsZS91bnNhZmUnKTtcblxuX3JlYWN0MlsnZGVmYXVsdCddLkNoaWxkcmVuLmNoaWxkcmVuID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH0pIHx8IFtdO1xufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLmZpbmQgcG9seWZpbGwgLSBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZmluZFxuaWYgKCFBcnJheS5wcm90b3R5cGUuZmluZCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdmaW5kJywge1xuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHZhbHVlKHByZWRpY2F0ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcnJheS5wcm90b3R5cGUuZmluZCBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxpc3QgPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSBpbiBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG52YXIgUmVhY3RhYmxlID0geyBUYWJsZTogX3JlYWN0YWJsZVRhYmxlLlRhYmxlLCBUcjogX3JlYWN0YWJsZVRyLlRyLCBUZDogX3JlYWN0YWJsZVRkLlRkLCBUaDogX3JlYWN0YWJsZVRoLlRoLCBUZm9vdDogX3JlYWN0YWJsZVRmb290LlRmb290LCBUaGVhZDogX3JlYWN0YWJsZVRoZWFkLlRoZWFkLCBTb3J0OiBfcmVhY3RhYmxlU29ydC5Tb3J0LCB1bnNhZmU6IF9yZWFjdGFibGVVbnNhZmUudW5zYWZlIH07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IFJlYWN0YWJsZTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LlJlYWN0YWJsZSA9IFJlYWN0YWJsZTtcbn1cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUuanNcbiAqKiBtb2R1bGUgaWQgPSA5MjlcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3gsIF94MiwgX3gzKSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94LCBwcm9wZXJ0eSA9IF94MiwgcmVjZWl2ZXIgPSBfeDM7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3ggPSBwYXJlbnQ7IF94MiA9IHByb3BlcnR5OyBfeDMgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfbGliRmlsdGVyX3Byb3BzX2Zyb20gPSByZXF1aXJlKCcuL2xpYi9maWx0ZXJfcHJvcHNfZnJvbScpO1xuXG52YXIgX2xpYkV4dHJhY3RfZGF0YV9mcm9tID0gcmVxdWlyZSgnLi9saWIvZXh0cmFjdF9kYXRhX2Zyb20nKTtcblxudmFyIF91bnNhZmUgPSByZXF1aXJlKCcuL3Vuc2FmZScpO1xuXG52YXIgX3RoZWFkID0gcmVxdWlyZSgnLi90aGVhZCcpO1xuXG52YXIgX3RoID0gcmVxdWlyZSgnLi90aCcpO1xuXG52YXIgX3RyID0gcmVxdWlyZSgnLi90cicpO1xuXG52YXIgX3Rmb290ID0gcmVxdWlyZSgnLi90Zm9vdCcpO1xuXG52YXIgX3BhZ2luYXRvciA9IHJlcXVpcmUoJy4vcGFnaW5hdG9yJyk7XG5cbnZhciBUYWJsZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhUYWJsZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBUYWJsZShwcm9wcykge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVGFibGUpO1xuXG4gICAgICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRhYmxlLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcywgcHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBjdXJyZW50UGFnZTogdGhpcy5wcm9wcy5jdXJyZW50UGFnZSA/IHRoaXMucHJvcHMuY3VycmVudFBhZ2UgOiAwLFxuICAgICAgICAgICAgY3VycmVudFNvcnQ6IHtcbiAgICAgICAgICAgICAgICBjb2x1bW46IG51bGwsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLnByb3BzLmRlZmF1bHRTb3J0RGVzY2VuZGluZyA/IC0xIDogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpbHRlcjogJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZXQgdGhlIHN0YXRlIG9mIHRoZSBjdXJyZW50IHNvcnQgdG8gdGhlIGRlZmF1bHQgc29ydFxuICAgICAgICBpZiAocHJvcHMuc29ydEJ5ICE9PSBmYWxzZSB8fCBwcm9wcy5kZWZhdWx0U29ydCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHZhciBzb3J0aW5nQ29sdW1uID0gcHJvcHMuc29ydEJ5IHx8IHByb3BzLmRlZmF1bHRTb3J0O1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50U29ydCA9IHRoaXMuZ2V0Q3VycmVudFNvcnQoc29ydGluZ0NvbHVtbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoVGFibGUsIFt7XG4gICAgICAgIGtleTogJ2ZpbHRlckJ5JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZpbHRlckJ5KGZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGZpbHRlcjogZmlsdGVyIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJhbnNsYXRlIGEgdXNlciBkZWZpbmVkIGNvbHVtbiBhcnJheSB0byBob2xkIGNvbHVtbiBvYmplY3RzIGlmIHN0cmluZ3MgYXJlIHNwZWNpZmllZFxuICAgICAgICAvLyAoZS5nLiBbJ2NvbHVtbjEnXSA9PiBbe2tleTogJ2NvbHVtbjEnLCBsYWJlbDogJ2NvbHVtbjEnfV0pXG4gICAgfSwge1xuICAgICAgICBrZXk6ICd0cmFuc2xhdGVDb2x1bW5zQXJyYXknLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdHJhbnNsYXRlQ29sdW1uc0FycmF5KGNvbHVtbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5zLm1hcCgoZnVuY3Rpb24gKGNvbHVtbiwgaSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBjb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uc29ydGFibGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc29ydEZ1bmN0aW9uID0gY29sdW1uLnNvcnRhYmxlID09PSB0cnVlID8gJ2RlZmF1bHQnIDogY29sdW1uLnNvcnRhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc29ydGFibGVbY29sdW1uLmtleV0gPSBzb3J0RnVuY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdwYXJzZUNoaWxkRGF0YScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZUNoaWxkRGF0YShwcm9wcykge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBbXSxcbiAgICAgICAgICAgICAgICB0Zm9vdCA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgLy8gVHJhbnNmb3JtIGFueSBjaGlsZHJlbiBiYWNrIHRvIGEgZGF0YSBhcnJheVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wcy5jaGlsZHJlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uZm9yRWFjaChwcm9wcy5jaGlsZHJlbiwgKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkID09PSAndW5kZWZpbmVkJyB8fCBjaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaGlsZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIF90aGVhZC5UaGVhZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgX3Rmb290LlRmb290OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGZvb3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbiBvbmx5IGhhdmUgb25lIDxUZm9vdD4sIGJ1dCBtb3JlIHRoYW4gb25lIHdhcyBzcGVjaWZpZWQuJyArICdJZ25vcmluZyBhbGwgYnV0IHRoZSBsYXN0IG9uZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Zm9vdCA9IGNoaWxkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBfdHIuVHI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkRGF0YSA9IGNoaWxkLnByb3BzLmRhdGEgfHwge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uZm9yRWFjaChjaGlsZC5wcm9wcy5jaGlsZHJlbiwgZnVuY3Rpb24gKGRlc2NlbmRhbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBpZiAoZGVzY2VuZGFudC50eXBlLkNvbnZlbmllbmNlQ29uc3RydWN0b3IgPT09IFRkKSB7ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY2VuZGFudCAhPT0gJ29iamVjdCcgfHwgZGVzY2VuZGFudCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc2NlbmRhbnQucHJvcHMuY29sdW1uICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NlbmRhbnQucHJvcHMuZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlc2NlbmRhbnQucHJvcHMuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc2NlbmRhbnQucHJvcHMuY2hpbGRyZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZXNjZW5kYW50LnByb3BzLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2V4cG9ydHMuVGQgc3BlY2lmaWVkIHdpdGhvdXQgJyArICdhIGBkYXRhYCBwcm9wZXJ0eSBvciBjaGlsZHJlbiwgJyArICdpZ25vcmluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGREYXRhW2Rlc2NlbmRhbnQucHJvcHMuY29sdW1uXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM6ICgwLCBfbGliRmlsdGVyX3Byb3BzX2Zyb20uZmlsdGVyUHJvcHNGcm9tKShkZXNjZW5kYW50LnByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3JlYWN0YWJsZU1ldGE6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2V4cG9ydHMuVGQgc3BlY2lmaWVkIHdpdGhvdXQgYSAnICsgJ2Bjb2x1bW5gIHByb3BlcnR5LCBpZ25vcmluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjaGlsZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzOiAoMCwgX2xpYkZpbHRlcl9wcm9wc19mcm9tLmZpbHRlclByb3BzRnJvbSkoY2hpbGQucHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3JlYWN0YWJsZU1ldGE6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBvbmx5IHBvc3NpYmxlIGNoaWxkcmVuIG9mIDxUYWJsZT4gYXJlIDxUaGVhZD4sIDxUcj4sICcgKyAnb3Igb25lIDxUZm9vdD4uJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgZGF0YTogZGF0YSwgdGZvb3Q6IHRmb290IH07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2luaXRpYWxpemUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdGlhbGl6ZShwcm9wcykge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gcHJvcHMuZGF0YSB8fCBbXTtcblxuICAgICAgICAgICAgdmFyIF9wYXJzZUNoaWxkRGF0YSA9IHRoaXMucGFyc2VDaGlsZERhdGEocHJvcHMpO1xuXG4gICAgICAgICAgICB2YXIgZGF0YSA9IF9wYXJzZUNoaWxkRGF0YS5kYXRhO1xuICAgICAgICAgICAgdmFyIHRmb290ID0gX3BhcnNlQ2hpbGREYXRhLnRmb290O1xuXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEuY29uY2F0KGRhdGEpO1xuICAgICAgICAgICAgdGhpcy50Zm9vdCA9IHRmb290O1xuXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVTb3J0cyhwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVGaWx0ZXJzKHByb3BzKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnaW5pdGlhbGl6ZUZpbHRlcnMnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdGlhbGl6ZUZpbHRlcnMocHJvcHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbHRlcmFibGUgPSB7fTtcbiAgICAgICAgICAgIC8vIFRyYW5zZm9ybSBmaWx0ZXJhYmxlIHByb3BlcnRpZXMgaW50byBhIG1vcmUgZnJpZW5kbHkgbGlzdFxuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBwcm9wcy5maWx0ZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHByb3BzLmZpbHRlcmFibGVbaV07XG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbk5hbWUgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlckZ1bmN0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtbiBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5jb2x1bW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW5OYW1lID0gY29sdW1uLmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmlsdGVyYWJsZSBjb2x1bW4gc3BlY2lmaWVkIHdpdGhvdXQgY29sdW1uIG5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmlsdGVyRnVuY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlckZ1bmN0aW9uID0gY29sdW1uLmZpbHRlckZ1bmN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyRnVuY3Rpb24gPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb2x1bW5OYW1lID0gY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJGdW5jdGlvbiA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJhYmxlW2NvbHVtbk5hbWVdID0gZmlsdGVyRnVuY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2luaXRpYWxpemVTb3J0cycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0aWFsaXplU29ydHMocHJvcHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvcnRhYmxlID0ge307XG4gICAgICAgICAgICAvLyBUcmFuc2Zvcm0gc29ydGFibGUgcHJvcGVydGllcyBpbnRvIGEgbW9yZSBmcmllbmRseSBsaXN0XG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIHByb3BzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHByb3BzLnNvcnRhYmxlW2ldO1xuICAgICAgICAgICAgICAgIHZhciBjb2x1bW5OYW1lID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBzb3J0RnVuY3Rpb24gPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoY29sdW1uIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmNvbHVtbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbk5hbWUgPSBjb2x1bW4uY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdTb3J0YWJsZSBjb2x1bW4gc3BlY2lmaWVkIHdpdGhvdXQgY29sdW1uIG5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLnNvcnRGdW5jdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydEZ1bmN0aW9uID0gY29sdW1uLnNvcnRGdW5jdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRGdW5jdGlvbiA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbk5hbWUgPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNvcnRGdW5jdGlvbiA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zb3J0YWJsZVtjb2x1bW5OYW1lXSA9IHNvcnRGdW5jdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZ2V0Q3VycmVudFNvcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q3VycmVudFNvcnQoY29sdW1uKSB7XG4gICAgICAgICAgICB2YXIgY29sdW1uTmFtZSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBzb3J0RGlyZWN0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoY29sdW1uIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uY29sdW1uICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBjb2x1bW5OYW1lID0gY29sdW1uLmNvbHVtbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RlZmF1bHQgY29sdW1uIHNwZWNpZmllZCB3aXRob3V0IGNvbHVtbiBuYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5kaXJlY3Rpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2x1bW4uZGlyZWN0aW9uID09PSAxIHx8IGNvbHVtbi5kaXJlY3Rpb24gPT09ICdhc2MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0RGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb2x1bW4uZGlyZWN0aW9uID09PSAtMSB8fCBjb2x1bW4uZGlyZWN0aW9uID09PSAnZGVzYycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnREaXJlY3Rpb24gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0RGlyZWN0aW9uID0gdGhpcy5wcm9wcy5kZWZhdWx0U29ydERlc2NlbmRpbmcgPyAnZGVzY2VuZGluZycgOiAnYXNjZW5kaW5nJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGRlZmF1bHQgc29ydCBzcGVjaWZpZWQuIERlZmF1bHRpbmcgdG8gJyArIGRlZmF1bHREaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydERpcmVjdGlvbiA9IHRoaXMucHJvcHMuZGVmYXVsdFNvcnREZXNjZW5kaW5nID8gLTEgOiAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc29ydERpcmVjdGlvbiA9IHRoaXMucHJvcHMuZGVmYXVsdFNvcnREZXNjZW5kaW5nID8gLTEgOiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sdW1uTmFtZSA9IGNvbHVtbjtcbiAgICAgICAgICAgICAgICBzb3J0RGlyZWN0aW9uID0gdGhpcy5wcm9wcy5kZWZhdWx0U29ydERlc2NlbmRpbmcgPyAtMSA6IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29sdW1uOiBjb2x1bW5OYW1lLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogc29ydERpcmVjdGlvblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAndXBkYXRlQ3VycmVudFNvcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlQ3VycmVudFNvcnQoc29ydEJ5KSB7XG4gICAgICAgICAgICBpZiAoc29ydEJ5ICE9PSBmYWxzZSAmJiBzb3J0QnkuY29sdW1uICE9PSB0aGlzLnN0YXRlLmN1cnJlbnRTb3J0LmNvbHVtbiAmJiBzb3J0QnkuZGlyZWN0aW9uICE9PSB0aGlzLnN0YXRlLmN1cnJlbnRTb3J0LmRpcmVjdGlvbikge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGN1cnJlbnRTb3J0OiB0aGlzLmdldEN1cnJlbnRTb3J0KHNvcnRCeSkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZUN1cnJlbnRQYWdlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUN1cnJlbnRQYWdlKG5leHRQYWdlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG5leHRQYWdlICE9PSAndW5kZWZpbmVkJyAmJiBuZXh0UGFnZSAhPT0gdGhpcy5zdGF0ZS5jdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBjdXJyZW50UGFnZTogbmV4dFBhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2NvbXBvbmVudFdpbGxNb3VudCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemUodGhpcy5wcm9wcyk7XG4gICAgICAgICAgICB0aGlzLnNvcnRCeUN1cnJlbnRTb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmZpbHRlckJ5KHRoaXMucHJvcHMuZmlsdGVyQnkpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemUobmV4dFByb3BzKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudFBhZ2UobmV4dFByb3BzLmN1cnJlbnRQYWdlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudFNvcnQobmV4dFByb3BzLnNvcnRCeSk7XG4gICAgICAgICAgICB0aGlzLnNvcnRCeUN1cnJlbnRTb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmZpbHRlckJ5KG5leHRQcm9wcy5maWx0ZXJCeSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2FwcGx5RmlsdGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFwcGx5RmlsdGVyKGZpbHRlciwgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBhcHBseSBmaWx0ZXIgdGV4dCB0byBhIGxpc3Qgb2YgdGFibGUgcm93c1xuICAgICAgICAgICAgZmlsdGVyID0gZmlsdGVyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgbWF0Y2hlZENoaWxkcmVuID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGNoaWxkcmVuW2ldLnByb3BzLmRhdGE7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBmaWx0ZXJDb2x1bW4gaW4gdGhpcy5fZmlsdGVyYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGFbZmlsdGVyQ29sdW1uXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgZmlsdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2ZpbHRlcmFibGVbZmlsdGVyQ29sdW1uXSA9PT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy5fZmlsdGVyYWJsZVtmaWx0ZXJDb2x1bW5dID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKDAsIF9saWJFeHRyYWN0X2RhdGFfZnJvbS5leHRyYWN0RGF0YUZyb20pKGRhdGEsIGZpbHRlckNvbHVtbikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZmlsdGVyKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRDaGlsZHJlbi5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbHRlcmFibGVbZmlsdGVyQ29sdW1uXSgoMCwgX2xpYkV4dHJhY3RfZGF0YV9mcm9tLmV4dHJhY3REYXRhRnJvbSkoZGF0YSwgZmlsdGVyQ29sdW1uKS50b1N0cmluZygpLCBmaWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRDaGlsZHJlbi5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlZENoaWxkcmVuO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzb3J0QnlDdXJyZW50U29ydCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzb3J0QnlDdXJyZW50U29ydCgpIHtcbiAgICAgICAgICAgIC8vIEFwcGx5IGEgc29ydCBmdW5jdGlvbiBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgc29ydCBpbiB0aGUgc3RhdGUuXG4gICAgICAgICAgICAvLyBUaGlzIGFsbG93cyB1cyB0byBwZXJmb3JtIGEgZGVmYXVsdCBzb3J0IGV2ZW4gb24gYSBub24gc29ydGFibGUgY29sdW1uLlxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTb3J0ID0gdGhpcy5zdGF0ZS5jdXJyZW50U29ydDtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3J0LmNvbHVtbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5kYXRhLnNvcnQoKGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleUEgPSAoMCwgX2xpYkV4dHJhY3RfZGF0YV9mcm9tLmV4dHJhY3REYXRhRnJvbSkoYSwgY3VycmVudFNvcnQuY29sdW1uKTtcbiAgICAgICAgICAgICAgICBrZXlBID0gKDAsIF91bnNhZmUuaXNVbnNhZmUpKGtleUEpID8ga2V5QS50b1N0cmluZygpIDoga2V5QSB8fCAnJztcbiAgICAgICAgICAgICAgICB2YXIga2V5QiA9ICgwLCBfbGliRXh0cmFjdF9kYXRhX2Zyb20uZXh0cmFjdERhdGFGcm9tKShiLCBjdXJyZW50U29ydC5jb2x1bW4pO1xuICAgICAgICAgICAgICAgIGtleUIgPSAoMCwgX3Vuc2FmZS5pc1Vuc2FmZSkoa2V5QikgPyBrZXlCLnRvU3RyaW5nKCkgOiBrZXlCIHx8ICcnO1xuXG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCBzb3J0XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9zb3J0YWJsZVtjdXJyZW50U29ydC5jb2x1bW5dID09PSAndW5kZWZpbmVkJyB8fCB0aGlzLl9zb3J0YWJsZVtjdXJyZW50U29ydC5jb2x1bW5dID09PSAnZGVmYXVsdCcpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXZlcnNlIGRpcmVjdGlvbiBpZiB3ZSdyZSBkb2luZyBhIHJldmVyc2Ugc29ydFxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5QSA8IGtleUIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMSAqIGN1cnJlbnRTb3J0LmRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXlBID4ga2V5Qikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEgKiBjdXJyZW50U29ydC5kaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXZlcnNlIGNvbHVtbnMgaWYgd2UncmUgZG9pbmcgYSByZXZlcnNlIHNvcnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3J0LmRpcmVjdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvcnRhYmxlW2N1cnJlbnRTb3J0LmNvbHVtbl0oa2V5QSwga2V5Qik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29ydGFibGVbY3VycmVudFNvcnQuY29sdW1uXShrZXlCLCBrZXlBKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdvblNvcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25Tb3J0KGNvbHVtbikge1xuICAgICAgICAgICAgLy8gRG9uJ3QgcGVyZm9ybSBzb3J0IG9uIHVuc29ydGFibGUgY29sdW1uc1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9zb3J0YWJsZVtjb2x1bW5dID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTb3J0ID0gdGhpcy5zdGF0ZS5jdXJyZW50U29ydDtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3J0LmNvbHVtbiA9PT0gY29sdW1uKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFNvcnQuZGlyZWN0aW9uICo9IC0xO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50U29ydC5jb2x1bW4gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgY3VycmVudFNvcnQuZGlyZWN0aW9uID0gdGhpcy5wcm9wcy5kZWZhdWx0U29ydERlc2NlbmRpbmcgPyAtMSA6IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldCB0aGUgY3VycmVudCBzb3J0IGFuZCBwYXNzIGl0IHRvIHRoZSBzb3J0IGZ1bmN0aW9uXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgY3VycmVudFNvcnQ6IGN1cnJlbnRTb3J0IH0pO1xuICAgICAgICAgICAgdGhpcy5zb3J0QnlDdXJyZW50U29ydCgpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMub25Tb3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNvcnQoY3VycmVudFNvcnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW5kZXInLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgICAgICB2YXIgY29sdW1ucyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHZhciB1c2VyQ29sdW1uc1NwZWNpZmllZCA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHNob3dIZWFkZXJzID0gdHlwZW9mIHRoaXMucHJvcHMuaGlkZVRhYmxlSGVhZGVyID09PSAndW5kZWZpbmVkJztcblxuICAgICAgICAgICAgdmFyIGZpcnN0Q2hpbGQgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmNoaWxkcmVuLmxlbmd0aCA+IDAgJiYgdGhpcy5wcm9wcy5jaGlsZHJlblswXSAmJiB0aGlzLnByb3BzLmNoaWxkcmVuWzBdLnR5cGUgPT09IF90aGVhZC5UaGVhZCkge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdENoaWxkID0gdGhpcy5wcm9wcy5jaGlsZHJlblswXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuY2hpbGRyZW4udHlwZSA9PT0gX3RoZWFkLlRoZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hpbGQgPSB0aGlzLnByb3BzLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZpcnN0Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5zID0gX3RoZWFkLlRoZWFkLmdldENvbHVtbnMoZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbHVtbnMgPSB0aGlzLnByb3BzLmNvbHVtbnMgfHwgW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb2x1bW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB1c2VyQ29sdW1uc1NwZWNpZmllZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29sdW1ucyA9IHRoaXMudHJhbnNsYXRlQ29sdW1uc0FycmF5KGNvbHVtbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCdWlsZCB1cCB0YWJsZSByb3dzXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhICYmIHR5cGVvZiB0aGlzLmRhdGEubWFwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gQnVpbGQgdXAgdGhlIGNvbHVtbnMgYXJyYXlcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLmNvbmNhdCh0aGlzLmRhdGEubWFwKChmdW5jdGlvbiAocmF3RGF0YSwgaSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJhd0RhdGE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBpZiAocmF3RGF0YS5fX3JlYWN0YWJsZU1ldGEgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSByYXdEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IHJhd0RhdGEucHJvcHM7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggdGhlIGtleXMgaW4gZWFjaCBkYXRhIHJvdyBhbmQgYnVpbGQgYSB0ZCBmb3IgaXRcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgY29sdW1ucyBhcnJheSB3aXRoIHRoZSBkYXRhJ3Mga2V5cyBpZiBjb2x1bW5zIHdlcmUgbm90XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlckNvbHVtbnNTcGVjaWZpZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sdW1uID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDoga1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBhZGQgYSBuZXcgY29sdW1uIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29sdW1ucyBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbHVtbnMuZmluZChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmtleSA9PT0gY29sdW1uLmtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX3RyLlRyLCBfZXh0ZW5kcyh7IGNvbHVtbnM6IGNvbHVtbnMsIGtleTogaSwgZGF0YTogZGF0YSB9LCBwcm9wcykpO1xuICAgICAgICAgICAgICAgIH0pLmJpbmQodGhpcykpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuc29ydGFibGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc29ydGFibGVbY29sdW1uc1tpXS5rZXldID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHdlIHJlbmRlciB0aGUgZmlsdGVyIGJveFxuICAgICAgICAgICAgdmFyIGZpbHRlcmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZmlsdGVyYWJsZSAmJiBBcnJheS5pc0FycmF5KHRoaXMucHJvcHMuZmlsdGVyYWJsZSkgJiYgdGhpcy5wcm9wcy5maWx0ZXJhYmxlLmxlbmd0aCA+IDAgJiYgIXRoaXMucHJvcHMuaGlkZUZpbHRlcklucHV0KSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgZmlsdGVyc1xuICAgICAgICAgICAgdmFyIGZpbHRlcmVkQ2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmZpbHRlciAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZENoaWxkcmVuID0gdGhpcy5hcHBseUZpbHRlcih0aGlzLnN0YXRlLmZpbHRlciwgZmlsdGVyZWRDaGlsZHJlbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERldGVybWluZSBwYWdpbmF0aW9uIHByb3BlcnRpZXMgYW5kIHdoaWNoIGNvbHVtbnMgdG8gZGlzcGxheVxuICAgICAgICAgICAgdmFyIGl0ZW1zUGVyUGFnZSA9IDA7XG4gICAgICAgICAgICB2YXIgcGFnaW5hdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIG51bVBhZ2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRQYWdlID0gdGhpcy5zdGF0ZS5jdXJyZW50UGFnZTtcbiAgICAgICAgICAgIHZhciBwYWdlQnV0dG9uTGltaXQgPSB0aGlzLnByb3BzLnBhZ2VCdXR0b25MaW1pdCB8fCAxMDtcblxuICAgICAgICAgICAgdmFyIGN1cnJlbnRDaGlsZHJlbiA9IGZpbHRlcmVkQ2hpbGRyZW47XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5pdGVtc1BlclBhZ2UgPiAwKSB7XG4gICAgICAgICAgICAgICAgaXRlbXNQZXJQYWdlID0gdGhpcy5wcm9wcy5pdGVtc1BlclBhZ2U7XG4gICAgICAgICAgICAgICAgbnVtUGFnZXMgPSBNYXRoLmNlaWwoZmlsdGVyZWRDaGlsZHJlbi5sZW5ndGggLyBpdGVtc1BlclBhZ2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gbnVtUGFnZXMgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlID0gbnVtUGFnZXMgLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhZ2luYXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDaGlsZHJlbiA9IGZpbHRlcmVkQ2hpbGRyZW4uc2xpY2UoY3VycmVudFBhZ2UgKiBpdGVtc1BlclBhZ2UsIChjdXJyZW50UGFnZSArIDEpICogaXRlbXNQZXJQYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFudWFsbHkgdHJhbnNmZXIgcHJvcHNcbiAgICAgICAgICAgIHZhciBwcm9wcyA9ICgwLCBfbGliRmlsdGVyX3Byb3BzX2Zyb20uZmlsdGVyUHJvcHNGcm9tKSh0aGlzLnByb3BzKTtcblxuICAgICAgICAgICAgdmFyIG5vRGF0YVRleHQgPSB0aGlzLnByb3BzLm5vRGF0YVRleHQgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAndHInLFxuICAgICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAncmVhY3RhYmxlLW5vLWRhdGEnIH0sXG4gICAgICAgICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgICAgICd0ZCcsXG4gICAgICAgICAgICAgICAgICAgIHsgY29sU3BhbjogY29sdW1ucy5sZW5ndGggfSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5ub0RhdGFUZXh0XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSA6IG51bGw7XG5cbiAgICAgICAgICAgIHZhciB0YWJsZUhlYWRlciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoY29sdW1ucyAmJiBjb2x1bW5zLmxlbmd0aCA+IDAgJiYgc2hvd0hlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB0YWJsZUhlYWRlciA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF90aGVhZC5UaGVhZCwgeyBjb2x1bW5zOiBjb2x1bW5zLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJpbmc6IGZpbHRlcmluZyxcbiAgICAgICAgICAgICAgICAgICAgb25GaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNldFN0YXRlKHsgZmlsdGVyOiBmaWx0ZXIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMucHJvcHMub25GaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9wcy5vbkZpbHRlcihmaWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJQbGFjZWhvbGRlcjogdGhpcy5wcm9wcy5maWx0ZXJQbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyQ2xhc3NOYW1lOiB0aGlzLnByb3BzLmZpbHRlckNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZpbHRlcjogdGhpcy5zdGF0ZS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNvcnQ6IHRoaXMuc3RhdGUuY3VycmVudFNvcnQsXG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlQ29sdW1uczogdGhpcy5fc29ydGFibGUsXG4gICAgICAgICAgICAgICAgICAgIG9uU29ydDogdGhpcy5vblNvcnQuYmluZCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiAndGhlYWQnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICd0YWJsZScsXG4gICAgICAgICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgICAgICAgdGFibGVIZWFkZXIsXG4gICAgICAgICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgICAgICd0Ym9keScsXG4gICAgICAgICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAncmVhY3RhYmxlLWRhdGEnLCBrZXk6ICd0Ym9keScgfSxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudENoaWxkcmVuLmxlbmd0aCA+IDAgPyBjdXJyZW50Q2hpbGRyZW4gOiBub0RhdGFUZXh0XG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBwYWdpbmF0aW9uID09PSB0cnVlID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX3BhZ2luYXRvci5QYWdpbmF0b3IsIHsgY29sU3BhbjogY29sdW1ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VCdXR0b25MaW1pdDogcGFnZUJ1dHRvbkxpbWl0LFxuICAgICAgICAgICAgICAgICAgICBudW1QYWdlczogbnVtUGFnZXMsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBjdXJyZW50UGFnZSxcbiAgICAgICAgICAgICAgICAgICAgb25QYWdlQ2hhbmdlOiBmdW5jdGlvbiAocGFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2V0U3RhdGUoeyBjdXJyZW50UGFnZTogcGFnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5wcm9wcy5vblBhZ2VDaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9wcy5vblBhZ2VDaGFuZ2UocGFnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzUGFnZUxhYmVsOiB0aGlzLnByb3BzLnByZXZpb3VzUGFnZUxhYmVsLFxuICAgICAgICAgICAgICAgICAgICBuZXh0UGFnZUxhYmVsOiB0aGlzLnByb3BzLm5leHRQYWdlTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ3BhZ2luYXRvcicgfSkgOiBudWxsLFxuICAgICAgICAgICAgICAgIHRoaXMudGZvb3RcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gVGFibGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0cy5UYWJsZSA9IFRhYmxlO1xuXG5UYWJsZS5kZWZhdWx0UHJvcHMgPSB7XG4gICAgc29ydEJ5OiBmYWxzZSxcbiAgICBkZWZhdWx0U29ydDogZmFsc2UsXG4gICAgZGVmYXVsdFNvcnREZXNjZW5kaW5nOiBmYWxzZSxcbiAgICBpdGVtc1BlclBhZ2U6IDAsXG4gICAgZmlsdGVyQnk6ICcnLFxuICAgIGhpZGVGaWx0ZXJJbnB1dDogZmFsc2Vcbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90YWJsZS5qc1xuICoqIG1vZHVsZSBpZCA9IDkzMFxuICoqIG1vZHVsZSBjaHVua3MgPSAzXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZmlsdGVyUHJvcHNGcm9tID0gZmlsdGVyUHJvcHNGcm9tO1xudmFyIGludGVybmFsUHJvcHMgPSB7XG4gICAgY29sdW1uOiB0cnVlLFxuICAgIGNvbHVtbnM6IHRydWUsXG4gICAgc29ydGFibGU6IHRydWUsXG4gICAgZmlsdGVyYWJsZTogdHJ1ZSxcbiAgICBmaWx0ZXJpbmc6IHRydWUsXG4gICAgb25GaWx0ZXI6IHRydWUsXG4gICAgZmlsdGVyUGxhY2Vob2xkZXI6IHRydWUsXG4gICAgZmlsdGVyQ2xhc3NOYW1lOiB0cnVlLFxuICAgIGN1cnJlbnRGaWx0ZXI6IHRydWUsXG4gICAgc29ydDogdHJ1ZSxcbiAgICBzb3J0Qnk6IHRydWUsXG4gICAgc29ydGFibGVDb2x1bW5zOiB0cnVlLFxuICAgIG9uU29ydDogdHJ1ZSxcbiAgICBkZWZhdWx0U29ydDogdHJ1ZSxcbiAgICBkZWZhdWx0U29ydERlc2NlbmRpbmc6IHRydWUsXG4gICAgaXRlbXNQZXJQYWdlOiB0cnVlLFxuICAgIGZpbHRlckJ5OiB0cnVlLFxuICAgIGhpZGVGaWx0ZXJJbnB1dDogdHJ1ZSxcbiAgICBub0RhdGFUZXh0OiB0cnVlLFxuICAgIGN1cnJlbnRQYWdlOiB0cnVlLFxuICAgIHBhZ2VCdXR0b25MaW1pdDogdHJ1ZSxcbiAgICBjaGlsZE5vZGU6IHRydWUsXG4gICAgZGF0YTogdHJ1ZSxcbiAgICBjaGlsZHJlbjogdHJ1ZVxufTtcblxuZnVuY3Rpb24gZmlsdGVyUHJvcHNGcm9tKGJhc2VQcm9wcykge1xuICAgIGJhc2VQcm9wcyA9IGJhc2VQcm9wcyB8fCB7fTtcbiAgICB2YXIgcHJvcHMgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gYmFzZVByb3BzKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBpbnRlcm5hbFByb3BzKSkge1xuICAgICAgICAgICAgcHJvcHNba2V5XSA9IGJhc2VQcm9wc1trZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BzO1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvbGliL2ZpbHRlcl9wcm9wc19mcm9tLmpzXG4gKiogbW9kdWxlIGlkID0gOTMxXG4gKiogbW9kdWxlIGNodW5rcyA9IDNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmV4dHJhY3REYXRhRnJvbSA9IGV4dHJhY3REYXRhRnJvbTtcblxudmFyIF9zdHJpbmdhYmxlID0gcmVxdWlyZSgnLi9zdHJpbmdhYmxlJyk7XG5cbmZ1bmN0aW9uIGV4dHJhY3REYXRhRnJvbShrZXksIGNvbHVtbikge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3VuZGVmaW5lZCcgJiYga2V5ICE9PSBudWxsICYmIGtleS5fX3JlYWN0YWJsZU1ldGEgPT09IHRydWUpIHtcbiAgICAgICAgdmFsdWUgPSBrZXkuZGF0YVtjb2x1bW5dO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0ga2V5W2NvbHVtbl07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgIT09IG51bGwgJiYgdmFsdWUuX19yZWFjdGFibGVNZXRhID09PSB0cnVlKSB7XG4gICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlLnByb3BzLnZhbHVlICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZS5wcm9wcy52YWx1ZSAhPT0gbnVsbCA/IHZhbHVlLnByb3BzLnZhbHVlIDogdmFsdWUudmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuICgwLCBfc3RyaW5nYWJsZS5zdHJpbmdhYmxlKSh2YWx1ZSkgPyB2YWx1ZSA6ICcnO1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvbGliL2V4dHJhY3RfZGF0YV9mcm9tLmpzXG4gKiogbW9kdWxlIGlkID0gOTMyXG4gKiogbW9kdWxlIGNodW5rcyA9IDNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnN0cmluZ2FibGUgPSBzdHJpbmdhYmxlO1xuXG5mdW5jdGlvbiBzdHJpbmdhYmxlKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nICE9PSBudWxsICYmIHR5cGVvZiB0aGluZyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICh0aGluZy50b1N0cmluZyA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS9saWIvc3RyaW5nYWJsZS5qc1xuICoqIG1vZHVsZSBpZCA9IDkzM1xuICoqIG1vZHVsZSBjaHVua3MgPSAzXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5leHBvcnRzLnVuc2FmZSA9IHVuc2FmZTtcbmV4cG9ydHMuaXNVbnNhZmUgPSBpc1Vuc2FmZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIFVuc2FmZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVW5zYWZlKGNvbnRlbnQpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFVuc2FmZSk7XG5cbiAgICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudDtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoVW5zYWZlLCBbe1xuICAgICAgICBrZXk6IFwidG9TdHJpbmdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudDtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBVbnNhZmU7XG59KSgpO1xuXG5mdW5jdGlvbiB1bnNhZmUoc3RyKSB7XG4gICAgcmV0dXJuIG5ldyBVbnNhZmUoc3RyKTtcbn1cblxuO1xuXG5mdW5jdGlvbiBpc1Vuc2FmZShvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgVW5zYWZlO1xufVxuXG47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS91bnNhZmUuanNcbiAqKiBtb2R1bGUgaWQgPSA5MzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3gsIF94MiwgX3gzKSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94LCBwcm9wZXJ0eSA9IF94MiwgcmVjZWl2ZXIgPSBfeDM7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3ggPSBwYXJlbnQ7IF94MiA9IHByb3BlcnR5OyBfeDMgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfdGggPSByZXF1aXJlKCcuL3RoJyk7XG5cbnZhciBfZmlsdGVyZXIgPSByZXF1aXJlKCcuL2ZpbHRlcmVyJyk7XG5cbnZhciBfbGliRmlsdGVyX3Byb3BzX2Zyb20gPSByZXF1aXJlKCcuL2xpYi9maWx0ZXJfcHJvcHNfZnJvbScpO1xuXG52YXIgVGhlYWQgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgICBfaW5oZXJpdHMoVGhlYWQsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gICAgZnVuY3Rpb24gVGhlYWQoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUaGVhZCk7XG5cbiAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoVGhlYWQucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoVGhlYWQsIFt7XG4gICAgICAgIGtleTogJ2hhbmRsZUNsaWNrVGgnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlQ2xpY2tUaChjb2x1bW4pIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25Tb3J0KGNvbHVtbi5rZXkpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdoYW5kbGVLZXlEb3duVGgnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaGFuZGxlS2V5RG93blRoKGNvbHVtbiwgZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25Tb3J0KGNvbHVtbi5rZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW5kZXInLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICAgICAgLy8gRGVjbGFyZSB0aGUgbGlzdCBvZiBUaHNcbiAgICAgICAgICAgIHZhciBUaHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLnByb3BzLmNvbHVtbnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMucHJvcHMuY29sdW1uc1tpbmRleF07XG4gICAgICAgICAgICAgICAgdmFyIHRoQ2xhc3MgPSAncmVhY3RhYmxlLXRoLScgKyBjb2x1bW4ua2V5LnJlcGxhY2UoL1xccysvZywgJy0nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHZhciBzb3J0Q2xhc3MgPSAnJztcbiAgICAgICAgICAgICAgICB2YXIgdGhSb2xlID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLnNvcnRhYmxlQ29sdW1uc1tjb2x1bW4ua2V5XSkge1xuICAgICAgICAgICAgICAgICAgICBzb3J0Q2xhc3MgKz0gJ3JlYWN0YWJsZS1oZWFkZXItc29ydGFibGUgJztcbiAgICAgICAgICAgICAgICAgICAgdGhSb2xlID0gJ2J1dHRvbic7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuc29ydC5jb2x1bW4gPT09IGNvbHVtbi5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgc29ydENsYXNzICs9ICdyZWFjdGFibGUtaGVhZGVyLXNvcnQnO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5zb3J0LmRpcmVjdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydENsYXNzICs9ICctYXNjJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRDbGFzcyArPSAnLWRlc2MnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNvcnRDbGFzcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoQ2xhc3MgKz0gJyAnICsgc29ydENsYXNzO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLnByb3BzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgY29sdW1uLnByb3BzLmNsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhDbGFzcyArPSAnICcgKyBjb2x1bW4ucHJvcHMuY2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIFRocy5wdXNoKF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICBfdGguVGgsXG4gICAgICAgICAgICAgICAgICAgIF9leHRlbmRzKHt9LCBjb2x1bW4ucHJvcHMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogdGhDbGFzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrVGguYmluZCh0aGlzLCBjb2x1bW4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duOiB0aGlzLmhhbmRsZUtleURvd25UaC5iaW5kKHRoaXMsIGNvbHVtbiksXG4gICAgICAgICAgICAgICAgICAgICAgICByb2xlOiB0aFJvbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWJJbmRleDogJzAnIH0pLFxuICAgICAgICAgICAgICAgICAgICBjb2x1bW4ubGFiZWxcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFudWFsbHkgdHJhbnNmZXIgcHJvcHNcbiAgICAgICAgICAgIHZhciBwcm9wcyA9ICgwLCBfbGliRmlsdGVyX3Byb3BzX2Zyb20uZmlsdGVyUHJvcHNGcm9tKSh0aGlzLnByb3BzKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICd0aGVhZCcsXG4gICAgICAgICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5maWx0ZXJpbmcgPT09IHRydWUgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfZmlsdGVyZXIuRmlsdGVyZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgY29sU3BhbjogdGhpcy5wcm9wcy5jb2x1bW5zLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgb25GaWx0ZXI6IHRoaXMucHJvcHMub25GaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLnByb3BzLmZpbHRlclBsYWNlaG9sZGVyLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wcm9wcy5jdXJyZW50RmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IHRoaXMucHJvcHMuZmlsdGVyQ2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgfSkgOiBudWxsLFxuICAgICAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICAndHInLFxuICAgICAgICAgICAgICAgICAgICB7IGNsYXNzTmFtZTogJ3JlYWN0YWJsZS1jb2x1bW4taGVhZGVyJyB9LFxuICAgICAgICAgICAgICAgICAgICBUaHNcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogJ2dldENvbHVtbnMnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q29sdW1ucyhjb21wb25lbnQpIHtcbiAgICAgICAgICAgIC8vIENhbid0IHVzZSBSZWFjdC5DaGlsZHJlbi5tYXAgc2luY2UgdGhhdCBkb2Vzbid0IHJldHVybiBhIHByb3BlciBhcnJheVxuICAgICAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcbiAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5DaGlsZHJlbi5mb3JFYWNoKGNvbXBvbmVudC5wcm9wcy5jaGlsZHJlbiwgZnVuY3Rpb24gKHRoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHt9O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGgucHJvcHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbi5wcm9wcyA9ICgwLCBfbGliRmlsdGVyX3Byb3BzX2Zyb20uZmlsdGVyUHJvcHNGcm9tKSh0aC5wcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdXNlIHRoZSBjb250ZW50IGFzIHRoZSBsYWJlbCAmIGtleVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoLnByb3BzLmNoaWxkcmVuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uLmxhYmVsID0gdGgucHJvcHMuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW4ua2V5ID0gY29sdW1uLmxhYmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGtleSBpbiB0aGUgY29sdW1uIGF0dHJpYnV0ZSBzdXBlcnNlZGVzIHRoZSBvbmUgZGVmaW5lZCBwcmV2aW91c2x5XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGgucHJvcHMuY29sdW1uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uLmtleSA9IHRoLnByb3BzLmNvbHVtbjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gY2FzZSB3ZSBkb24ndCBoYXZlIGEgbGFiZWwgeWV0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5sYWJlbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW4ubGFiZWwgPSBjb2x1bW4ua2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4ua2V5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCc8dGg+IG11c3QgaGF2ZSBlaXRoZXIgYSBcImNvbHVtblwiIHByb3BlcnR5IG9yIGEgc3RyaW5nICcgKyAnY2hpbGQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGNvbHVtbnM7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gVGhlYWQ7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0cy5UaGVhZCA9IFRoZWFkO1xuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcmVhY3RhYmxlL2xpYi9yZWFjdGFibGUvdGhlYWQuanNcbiAqKiBtb2R1bGUgaWQgPSA5MzVcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3gsIF94MiwgX3gzKSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94LCBwcm9wZXJ0eSA9IF94MiwgcmVjZWl2ZXIgPSBfeDM7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3ggPSBwYXJlbnQ7IF94MiA9IHByb3BlcnR5OyBfeDMgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfdW5zYWZlID0gcmVxdWlyZSgnLi91bnNhZmUnKTtcblxudmFyIF9saWJGaWx0ZXJfcHJvcHNfZnJvbSA9IHJlcXVpcmUoJy4vbGliL2ZpbHRlcl9wcm9wc19mcm9tJyk7XG5cbnZhciBUaCA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhUaCwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBUaCgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRoKTtcblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUaC5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhUaCwgW3tcbiAgICAgICAga2V5OiAncmVuZGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZFByb3BzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoKDAsIF91bnNhZmUuaXNVbnNhZmUpKHRoaXMucHJvcHMuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCd0aCcsIF9leHRlbmRzKHt9LCAoMCwgX2xpYkZpbHRlcl9wcm9wc19mcm9tLmZpbHRlclByb3BzRnJvbSkodGhpcy5wcm9wcyksIHtcbiAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHsgX19odG1sOiB0aGlzLnByb3BzLmNoaWxkcmVuLnRvU3RyaW5nKCkgfSB9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgJ3RoJyxcbiAgICAgICAgICAgICAgICAgICAgKDAsIF9saWJGaWx0ZXJfcHJvcHNfZnJvbS5maWx0ZXJQcm9wc0Zyb20pKHRoaXMucHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBUaDtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzLlRoID0gVGg7XG47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90aC5qc1xuICoqIG1vZHVsZSBpZCA9IDkzNlxuICoqIG1vZHVsZSBjaHVua3MgPSAzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeCwgX3gyLCBfeDMpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3gsIHByb3BlcnR5ID0gX3gyLCByZWNlaXZlciA9IF94MzsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeCA9IHBhcmVudDsgX3gyID0gcHJvcGVydHk7IF94MyA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBkZXNjID0gcGFyZW50ID0gdW5kZWZpbmVkOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdERvbSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpO1xuXG52YXIgX3JlYWN0RG9tMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0RG9tKTtcblxudmFyIEZpbHRlcmVySW5wdXQgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgICBfaW5oZXJpdHMoRmlsdGVyZXJJbnB1dCwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBGaWx0ZXJlcklucHV0KCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRmlsdGVyZXJJbnB1dCk7XG5cbiAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoRmlsdGVyZXJJbnB1dC5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhGaWx0ZXJlcklucHV0LCBbe1xuICAgICAgICBrZXk6ICdvbkNoYW5nZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaWx0ZXIoX3JlYWN0RG9tMlsnZGVmYXVsdCddLmZpbmRET01Ob2RlKHRoaXMpLnZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVuZGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnaW5wdXQnLCB7IHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLnByb3BzLnBsYWNlaG9sZGVyLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLnZhbHVlLFxuICAgICAgICAgICAgICAgIG9uS2V5VXA6IHRoaXMub25DaGFuZ2UuYmluZCh0aGlzKSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZS5iaW5kKHRoaXMpIH0pO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEZpbHRlcmVySW5wdXQ7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0cy5GaWx0ZXJlcklucHV0ID0gRmlsdGVyZXJJbnB1dDtcbjtcblxudmFyIEZpbHRlcmVyID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50Mikge1xuICAgIF9pbmhlcml0cyhGaWx0ZXJlciwgX1JlYWN0JENvbXBvbmVudDIpO1xuXG4gICAgZnVuY3Rpb24gRmlsdGVyZXIoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBGaWx0ZXJlcik7XG5cbiAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoRmlsdGVyZXIucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoRmlsdGVyZXIsIFt7XG4gICAgICAgIGtleTogJ3JlbmRlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMuY29sU3BhbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdNdXN0IHBhc3MgYSBjb2xTcGFuIGFyZ3VtZW50IHRvIEZpbHRlcmVyJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAndHInLFxuICAgICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAncmVhY3RhYmxlLWZpbHRlcmVyJyB9LFxuICAgICAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICAndGQnLFxuICAgICAgICAgICAgICAgICAgICB7IGNvbFNwYW46IHRoaXMucHJvcHMuY29sU3BhbiB9LFxuICAgICAgICAgICAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChGaWx0ZXJlcklucHV0LCB7IG9uRmlsdGVyOiB0aGlzLnByb3BzLm9uRmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5wcm9wcy5wbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUgPyAncmVhY3RhYmxlLWZpbHRlci1pbnB1dCAnICsgdGhpcy5wcm9wcy5jbGFzc05hbWUgOiAncmVhY3RhYmxlLWZpbHRlci1pbnB1dCcgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEZpbHRlcmVyO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHMuRmlsdGVyZXIgPSBGaWx0ZXJlcjtcbjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL2ZpbHRlcmVyLmpzXG4gKiogbW9kdWxlIGlkID0gOTM3XG4gKiogbW9kdWxlIGNodW5rcyA9IDNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94LCBfeDIsIF94MykgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeCwgcHJvcGVydHkgPSBfeDIsIHJlY2VpdmVyID0gX3gzOyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94ID0gcGFyZW50OyBfeDIgPSBwcm9wZXJ0eTsgX3gzID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGRlc2MgPSBwYXJlbnQgPSB1bmRlZmluZWQ7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKCd2YWx1ZScgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3RkID0gcmVxdWlyZSgnLi90ZCcpO1xuXG52YXIgX2xpYlRvX2FycmF5ID0gcmVxdWlyZSgnLi9saWIvdG9fYXJyYXknKTtcblxudmFyIF9saWJGaWx0ZXJfcHJvcHNfZnJvbSA9IHJlcXVpcmUoJy4vbGliL2ZpbHRlcl9wcm9wc19mcm9tJyk7XG5cbnZhciBUciA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhUciwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBUcigpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRyKTtcblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUci5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhUciwgW3tcbiAgICAgICAga2V5OiAncmVuZGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9ICgwLCBfbGliVG9fYXJyYXkudG9BcnJheSkoX3JlYWN0MlsnZGVmYXVsdCddLkNoaWxkcmVuLmNoaWxkcmVuKHRoaXMucHJvcHMuY2hpbGRyZW4pKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZGF0YSAmJiB0aGlzLnByb3BzLmNvbHVtbnMgJiYgdHlwZW9mIHRoaXMucHJvcHMuY29sdW1ucy5tYXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkcmVuLmNvbmNhdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW4uY29uY2F0KHRoaXMucHJvcHMuY29sdW1ucy5tYXAoKGZ1bmN0aW9uIChjb2x1bW4sIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZGF0YS5oYXNPd25Qcm9wZXJ0eShjb2x1bW4ua2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5wcm9wcy5kYXRhW2NvbHVtbi5rZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlLl9fcmVhY3RhYmxlTWV0YSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzID0gdmFsdWUucHJvcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90ZC5UZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZXh0ZW5kcyh7IGNvbHVtbjogY29sdW1uLCBrZXk6IGNvbHVtbi5rZXkgfSwgcHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF90ZC5UZCwgeyBjb2x1bW46IGNvbHVtbiwga2V5OiBjb2x1bW4ua2V5IH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkuYmluZCh0aGlzKSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYW51YWxseSB0cmFuc2ZlciBwcm9wc1xuICAgICAgICAgICAgdmFyIHByb3BzID0gKDAsIF9saWJGaWx0ZXJfcHJvcHNfZnJvbS5maWx0ZXJQcm9wc0Zyb20pKHRoaXMucHJvcHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLkRPTS50cihwcm9wcywgY2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFRyO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHMuVHIgPSBUcjtcbjtcblxuVHIuY2hpbGROb2RlID0gX3RkLlRkO1xuVHIuZGF0YVR5cGUgPSAnb2JqZWN0JztcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL3RyLmpzXG4gKiogbW9kdWxlIGlkID0gOTM4XG4gKiogbW9kdWxlIGNodW5rcyA9IDNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94LCBfeDIsIF94MykgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeCwgcHJvcGVydHkgPSBfeDIsIHJlY2VpdmVyID0gX3gzOyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94ID0gcGFyZW50OyBfeDIgPSBwcm9wZXJ0eTsgX3gzID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGRlc2MgPSBwYXJlbnQgPSB1bmRlZmluZWQ7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKCd2YWx1ZScgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX2xpYklzX3JlYWN0X2NvbXBvbmVudCA9IHJlcXVpcmUoJy4vbGliL2lzX3JlYWN0X2NvbXBvbmVudCcpO1xuXG52YXIgX2xpYlN0cmluZ2FibGUgPSByZXF1aXJlKCcuL2xpYi9zdHJpbmdhYmxlJyk7XG5cbnZhciBfdW5zYWZlID0gcmVxdWlyZSgnLi91bnNhZmUnKTtcblxudmFyIF9saWJGaWx0ZXJfcHJvcHNfZnJvbSA9IHJlcXVpcmUoJy4vbGliL2ZpbHRlcl9wcm9wc19mcm9tJyk7XG5cbnZhciBUZCA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhUZCwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBUZCgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRkKTtcblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUZC5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhUZCwgW3tcbiAgICAgICAga2V5OiAnc3RyaW5naWZ5SWZOb3RSZWFjdENvbXBvbmVudCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdHJpbmdpZnlJZk5vdFJlYWN0Q29tcG9uZW50KG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKCEoMCwgX2xpYklzX3JlYWN0X2NvbXBvbmVudC5pc1JlYWN0Q29tcG9uZW50KShvYmplY3QpICYmICgwLCBfbGliU3RyaW5nYWJsZS5zdHJpbmdhYmxlKShvYmplY3QpICYmIHR5cGVvZiBvYmplY3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdC50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbmRlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICAgICAgICAvLyBBdHRhY2ggYW55IHByb3BlcnRpZXMgb24gdGhlIGNvbHVtbiB0byB0aGlzIFRkIG9iamVjdCB0byBhbGxvdyB0aGluZ3MgbGlrZSBjdXN0b20gZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICAgIHZhciBtZXJnZWRQcm9wcyA9ICgwLCBfbGliRmlsdGVyX3Byb3BzX2Zyb20uZmlsdGVyUHJvcHNGcm9tKSh0aGlzLnByb3BzKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5jb2x1bW4gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMucHJvcHMuY29sdW1uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgIT09ICdrZXknICYmIGtleSAhPT0gJ25hbWUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXJnZWRQcm9wc1trZXldID0gdGhpcy5wcm9wcy5jb2x1bW5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGhhbmRsZUNsaWNrIGFsaWFzZXMgb25DbGljayBldmVudFxuICAgICAgICAgICAgbWVyZ2VkUHJvcHMub25DbGljayA9IHRoaXMucHJvcHMuaGFuZGxlQ2xpY2s7XG5cbiAgICAgICAgICAgIHZhciBzdHJpbmdpZmllZENoaWxkUHJvcHM7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5kYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmaWVkQ2hpbGRQcm9wcyA9IHRoaXMuc3RyaW5naWZ5SWZOb3RSZWFjdENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCgwLCBfdW5zYWZlLmlzVW5zYWZlKSh0aGlzLnByb3BzLmNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgndGQnLCBfZXh0ZW5kcyh7fSwgbWVyZ2VkUHJvcHMsIHtcbiAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHsgX19odG1sOiB0aGlzLnByb3BzLmNoaWxkcmVuLnRvU3RyaW5nKCkgfSB9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgJ3RkJyxcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VkUHJvcHMsXG4gICAgICAgICAgICAgICAgICAgIHN0cmluZ2lmaWVkQ2hpbGRQcm9wcyB8fCB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBUZDtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzLlRkID0gVGQ7XG47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90ZC5qc1xuICoqIG1vZHVsZSBpZCA9IDkzOVxuICoqIG1vZHVsZSBjaHVua3MgPSAzXG4gKiovIiwiLy8gdGhpcyBpcyBhIGJpdCBoYWNreSAtIGl0J2QgYmUgbmljZSBpZiBSZWFjdCBleHBvc2VkIGFuIEFQSSBmb3IgdGhpc1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5pc1JlYWN0Q29tcG9uZW50ID0gaXNSZWFjdENvbXBvbmVudDtcblxuZnVuY3Rpb24gaXNSZWFjdENvbXBvbmVudCh0aGluZykge1xuICAgIHJldHVybiB0aGluZyAhPT0gbnVsbCAmJiB0eXBlb2YgdGhpbmcgPT09ICdvYmplY3QnICYmIHR5cGVvZiB0aGluZy5wcm9wcyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS9saWIvaXNfcmVhY3RfY29tcG9uZW50LmpzXG4gKiogbW9kdWxlIGlkID0gOTQwXG4gKiogbW9kdWxlIGNodW5rcyA9IDNcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50b0FycmF5ID0gdG9BcnJheTtcblxuZnVuY3Rpb24gdG9BcnJheShvYmopIHtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgZm9yICh2YXIgYXR0ciBpbiBvYmopIHtcbiAgICAgICAgcmV0W2F0dHJdID0gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS9saWIvdG9fYXJyYXkuanNcbiAqKiBtb2R1bGUgaWQgPSA5NDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3gsIF94MiwgX3gzKSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94LCBwcm9wZXJ0eSA9IF94MiwgcmVjZWl2ZXIgPSBfeDM7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3ggPSBwYXJlbnQ7IF94MiA9IHByb3BlcnR5OyBfeDMgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBUZm9vdCA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhUZm9vdCwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBUZm9vdCgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRmb290KTtcblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUZm9vdC5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhUZm9vdCwgW3tcbiAgICAgICAga2V5OiAncmVuZGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgndGZvb3QnLCB0aGlzLnByb3BzKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBUZm9vdDtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzLlRmb290ID0gVGZvb3Q7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS90Zm9vdC5qc1xuICoqIG1vZHVsZSBpZCA9IDk0MlxuICoqIG1vZHVsZSBjaHVua3MgPSAzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeCwgX3gyLCBfeDMpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3gsIHByb3BlcnR5ID0gX3gyLCByZWNlaXZlciA9IF94MzsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeCA9IHBhcmVudDsgX3gyID0gcHJvcGVydHk7IF94MyA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBkZXNjID0gcGFyZW50ID0gdW5kZWZpbmVkOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxuZnVuY3Rpb24gcGFnZUhyZWYobnVtKSB7XG4gICAgcmV0dXJuICcjcGFnZS0nICsgKG51bSArIDEpO1xufVxuXG52YXIgUGFnaW5hdG9yID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gICAgX2luaGVyaXRzKFBhZ2luYXRvciwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBQYWdpbmF0b3IoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQYWdpbmF0b3IpO1xuXG4gICAgICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFBhZ2luYXRvci5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhQYWdpbmF0b3IsIFt7XG4gICAgICAgIGtleTogJ2hhbmRsZVByZXZpb3VzJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZVByZXZpb3VzKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25QYWdlQ2hhbmdlKHRoaXMucHJvcHMuY3VycmVudFBhZ2UgLSAxKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnaGFuZGxlTmV4dCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVOZXh0KGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25QYWdlQ2hhbmdlKHRoaXMucHJvcHMuY3VycmVudFBhZ2UgKyAxKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnaGFuZGxlUGFnZUJ1dHRvbicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVQYWdlQnV0dG9uKHBhZ2UsIGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25QYWdlQ2hhbmdlKHBhZ2UpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW5kZXJQcmV2aW91cycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXJQcmV2aW91cygpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmN1cnJlbnRQYWdlID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgJ2EnLFxuICAgICAgICAgICAgICAgICAgICB7IGNsYXNzTmFtZTogJ3JlYWN0YWJsZS1wcmV2aW91cy1wYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6IHBhZ2VIcmVmKHRoaXMucHJvcHMuY3VycmVudFBhZ2UgLSAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuaGFuZGxlUHJldmlvdXMuYmluZCh0aGlzKSB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnByZXZpb3VzUGFnZUxhYmVsIHx8ICdQcmV2aW91cydcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW5kZXJOZXh0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlck5leHQoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5jdXJyZW50UGFnZSA8IHRoaXMucHJvcHMubnVtUGFnZXMgLSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICAnYScsXG4gICAgICAgICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiAncmVhY3RhYmxlLW5leHQtcGFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiBwYWdlSHJlZih0aGlzLnByb3BzLmN1cnJlbnRQYWdlICsgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiB0aGlzLmhhbmRsZU5leHQuYmluZCh0aGlzKSB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm5leHRQYWdlTGFiZWwgfHwgJ05leHQnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVuZGVyUGFnZUJ1dHRvbicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXJQYWdlQnV0dG9uKGNsYXNzTmFtZSwgcGFnZU51bSkge1xuXG4gICAgICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgJ2EnLFxuICAgICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGtleTogcGFnZU51bSxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogcGFnZUhyZWYocGFnZU51bSksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuaGFuZGxlUGFnZUJ1dHRvbi5iaW5kKHRoaXMsIHBhZ2VOdW0pIH0sXG4gICAgICAgICAgICAgICAgcGFnZU51bSArIDFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbmRlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMuY29sU3BhbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdNdXN0IHBhc3MgYSBjb2xTcGFuIGFyZ3VtZW50IHRvIFBhZ2luYXRvcicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMubnVtUGFnZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTXVzdCBwYXNzIGEgbm9uLXplcm8gbnVtUGFnZXMgYXJndW1lbnQgdG8gUGFnaW5hdG9yJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5jdXJyZW50UGFnZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdNdXN0IHBhc3MgYSBjdXJyZW50UGFnZSBhcmd1bWVudCB0byBQYWdpbmF0b3InKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBhZ2VCdXR0b25zID0gW107XG4gICAgICAgICAgICB2YXIgcGFnZUJ1dHRvbkxpbWl0ID0gdGhpcy5wcm9wcy5wYWdlQnV0dG9uTGltaXQ7XG4gICAgICAgICAgICB2YXIgY3VycmVudFBhZ2UgPSB0aGlzLnByb3BzLmN1cnJlbnRQYWdlO1xuICAgICAgICAgICAgdmFyIG51bVBhZ2VzID0gdGhpcy5wcm9wcy5udW1QYWdlcztcbiAgICAgICAgICAgIHZhciBsb3dlckhhbGYgPSBNYXRoLnJvdW5kKHBhZ2VCdXR0b25MaW1pdCAvIDIpO1xuICAgICAgICAgICAgdmFyIHVwcGVySGFsZiA9IHBhZ2VCdXR0b25MaW1pdCAtIGxvd2VySGFsZjtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BzLm51bVBhZ2VzOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hvd1BhZ2VCdXR0b24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgcGFnZU51bSA9IGk7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZSA9IFwicmVhY3RhYmxlLXBhZ2UtYnV0dG9uXCI7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRQYWdlID09PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSBcIiByZWFjdGFibGUtY3VycmVudC1wYWdlXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhZ2VCdXR0b25zLnB1c2godGhpcy5yZW5kZXJQYWdlQnV0dG9uKGNsYXNzTmFtZSwgcGFnZU51bSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudFBhZ2UgLSBwYWdlQnV0dG9uTGltaXQgKyBsb3dlckhhbGYgPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gbnVtUGFnZXMgLSBsb3dlckhhbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFnZUJ1dHRvbnMuc3BsaWNlKDAsIG51bVBhZ2VzIC0gcGFnZUJ1dHRvbkxpbWl0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYWdlQnV0dG9ucy5zcGxpY2UoMCwgY3VycmVudFBhZ2UgLSBwYWdlQnV0dG9uTGltaXQgKyBsb3dlckhhbGYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG51bVBhZ2VzIC0gY3VycmVudFBhZ2UgPiB1cHBlckhhbGYpIHtcbiAgICAgICAgICAgICAgICBwYWdlQnV0dG9ucy5zcGxpY2UocGFnZUJ1dHRvbkxpbWl0LCBwYWdlQnV0dG9ucy5sZW5ndGggLSBwYWdlQnV0dG9uTGltaXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgJ3Rib2R5JyxcbiAgICAgICAgICAgICAgICB7IGNsYXNzTmFtZTogJ3JlYWN0YWJsZS1wYWdpbmF0aW9uJyB9LFxuICAgICAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAgICAgICAndHInLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgICAgICd0ZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGNvbFNwYW46IHRoaXMucHJvcHMuY29sU3BhbiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQcmV2aW91cygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUJ1dHRvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlck5leHQoKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3I7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0cy5QYWdpbmF0b3IgPSBQYWdpbmF0b3I7XG47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yZWFjdGFibGUvbGliL3JlYWN0YWJsZS9wYWdpbmF0b3IuanNcbiAqKiBtb2R1bGUgaWQgPSA5NDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbnZhciBTb3J0ID0ge1xuICAgIE51bWVyaWM6IGZ1bmN0aW9uIE51bWVyaWMoYSwgYikge1xuICAgICAgICB2YXIgdmFsQSA9IHBhcnNlRmxvYXQoYS50b1N0cmluZygpLnJlcGxhY2UoLywvZywgJycpKTtcbiAgICAgICAgdmFyIHZhbEIgPSBwYXJzZUZsb2F0KGIudG9TdHJpbmcoKS5yZXBsYWNlKC8sL2csICcnKSk7XG5cbiAgICAgICAgLy8gU29ydCBub24tbnVtZXJpYyB2YWx1ZXMgYWxwaGFiZXRpY2FsbHkgYXQgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdFxuICAgICAgICBpZiAoaXNOYU4odmFsQSkgJiYgaXNOYU4odmFsQikpIHtcbiAgICAgICAgICAgIHZhbEEgPSBhO1xuICAgICAgICAgICAgdmFsQiA9IGI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaXNOYU4odmFsQSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTih2YWxCKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWxBIDwgdmFsQikge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWxBID4gdmFsQikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9LFxuXG4gICAgTnVtZXJpY0ludGVnZXI6IGZ1bmN0aW9uIE51bWVyaWNJbnRlZ2VyKGEsIGIpIHtcbiAgICAgICAgaWYgKGlzTmFOKGEpIHx8IGlzTmFOKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogLTE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgfSxcblxuICAgIEN1cnJlbmN5OiBmdW5jdGlvbiBDdXJyZW5jeShhLCBiKSB7XG4gICAgICAgIC8vIFBhcnNlIG91dCBkb2xsYXIgc2lnbnMsIHRoZW4gZG8gYSByZWd1bGFyIG51bWVyaWMgc29ydFxuICAgICAgICBhID0gYS5yZXBsYWNlKC9bXjAtOVxcLlxcLVxcLF0rL2csICcnKTtcbiAgICAgICAgYiA9IGIucmVwbGFjZSgvW14wLTlcXC5cXC1cXCxdKy9nLCAnJyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuU29ydC5OdW1lcmljKGEsIGIpO1xuICAgIH0sXG5cbiAgICBEYXRlOiAoZnVuY3Rpb24gKF9EYXRlKSB7XG4gICAgICAgIGZ1bmN0aW9uIERhdGUoX3gsIF94Mikge1xuICAgICAgICAgICAgcmV0dXJuIF9EYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICBEYXRlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9EYXRlLnRvU3RyaW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIERhdGU7XG4gICAgfSkoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgLy8gTm90ZTogdGhpcyBmdW5jdGlvbiB0cmllcyB0byBkbyBhIHN0YW5kYXJkIGphdmFzY3JpcHQgc3RyaW5nIC0+IGRhdGUgY29udmVyc2lvblxuICAgICAgICAvLyBJZiB5b3UgbmVlZCBtb3JlIGNvbnRyb2wgb3ZlciB0aGUgZGF0ZSBzdHJpbmcgZm9ybWF0LCBjb25zaWRlciB1c2luZyBhIGRpZmZlcmVudFxuICAgICAgICAvLyBkYXRlIGxpYnJhcnkgYW5kIHdyaXRpbmcgeW91ciBvd24gZnVuY3Rpb25cbiAgICAgICAgdmFyIHZhbEEgPSBEYXRlLnBhcnNlKGEpO1xuICAgICAgICB2YXIgdmFsQiA9IERhdGUucGFyc2UoYik7XG5cbiAgICAgICAgLy8gSGFuZGxlIG5vbi1kYXRlIHZhbHVlcyB3aXRoIG51bWVyaWMgc29ydFxuICAgICAgICAvLyBTb3J0IG5vbi1udW1lcmljIHZhbHVlcyBhbHBoYWJldGljYWxseSBhdCB0aGUgYm90dG9tIG9mIHRoZSBsaXN0XG4gICAgICAgIGlmIChpc05hTih2YWxBKSB8fCBpc05hTih2YWxCKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV4cG9ydHMuU29ydC5OdW1lcmljKGEsIGIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbEEgPiB2YWxCKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsQiA+IHZhbEEpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwO1xuICAgIH0pLFxuXG4gICAgQ2FzZUluc2Vuc2l0aXZlOiBmdW5jdGlvbiBDYXNlSW5zZW5zaXRpdmUoYSwgYikge1xuICAgICAgICByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKTtcbiAgICB9XG59O1xuZXhwb3J0cy5Tb3J0ID0gU29ydDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JlYWN0YWJsZS9saWIvcmVhY3RhYmxlL3NvcnQuanNcbiAqKiBtb2R1bGUgaWQgPSA5NDRcbiAqKiBtb2R1bGUgY2h1bmtzID0gM1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=