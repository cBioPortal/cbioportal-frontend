"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var _ = require("lodash");
var React = require("react");
var DescriptorTreeNode_1 = require("../tree/DescriptorTreeNode");
var ReactBootstrap = require("react-bootstrap");
var react_bootstrap_table_1 = require("react-bootstrap-table");
var react_bootstrap_table_2 = require("react-bootstrap-table");
require("react-bootstrap-table/css/react-bootstrap-table.css");
var react_fontawesome_1 = require("react-fontawesome");
var Checkbox = ReactBootstrap.Checkbox;
var FlexBox_1 = require("../flexbox/FlexBox");
var styles_any = require("./styles.module.scss");
var memoize_1 = require("../../lib/memoize");
var classNames_1 = require("../../lib/classNames");
var firstDefinedValue_1 = require("../../lib/firstDefinedValue");
var styles = styles_any;
exports.CANCER_TYPE_ROOT = 'tissue';
function sortNodes(nodes) {
    return _.sortBy(nodes, function (node) { return node.name; });
}
function matchesSearchText(input, searchText) {
    input = input.toLocaleLowerCase();
    searchText = searchText.toLocaleLowerCase();
    return searchText.split(' ').every(function (filter) {
        var desired = true;
        if (filter.startsWith('-')) {
            filter = filter.substr(1);
            desired = false;
        }
        var found = input.indexOf(filter) >= 0;
        return found == desired;
    });
}
var CancerStudySelector = (function (_super) {
    __extends(CancerStudySelector, _super);
    function CancerStudySelector(props) {
        var _this = _super.call(this, props) || this;
        // these parameters determine when to recompute the tree info
        _this.getMemoizeParams = function () { return [_this.props.cancerTypes, _this.props.studies]; };
        _this.getNodeFilterMemoizeParams = function () { return [_this.props.searchText, _this.props.treeDepth].concat(_this.getMemoizeParams()); };
        _this.getListItemProps = function (node) {
            var meta = _this.getTreeInfo().map_node_meta.get(node);
            return {
                className: classNames_1.default((_a = {},
                    _a[styles.selectable] = _this.selectableTreeNodes,
                    _a[styles.selected] = _this.selectableTreeNodes && meta.isCancerType && _.includes(_this.selectedCancerTypeIds, node.cancerTypeId),
                    _a))
            };
            var _a;
        };
        _this.renderCancerTypeTreeNode = function (cancerType) {
            var treeInfo = _this.getTreeInfo();
            var desc = _this.getTreeDescriptor();
            var meta = treeInfo.map_node_meta.get(cancerType);
            var selectedChildStudies = _.intersection(_this.selectedStudyIds, meta.descendantStudies.map(function (study) { return study.studyId; }));
            var checked = selectedChildStudies.length > 0;
            var indeterminate = checked && selectedChildStudies.length != meta.descendantStudies.length;
            var label = (<span className={classNames_1.default(styles.treeNodeLabel, _this.getMatchingNodeClassNames(cancerType))} style={{ flex: 1 }} onMouseDown={_this.selectableTreeNodes ? _this.getTreeSelectHandler(cancerType) : undefined}>
				{cancerType.name + " (" + meta.descendantStudies.filter(desc.nodeFilter).length + ")"}
			</span>);
            return (<FlexBox_1.FlexRow overflow className={classNames_1.default(styles.cancerTypeTreeNode, styles.treeNodeContent)}>
				<Checkbox onChange={_this.getOnCheckHandler(cancerType)} checked={checked} inputRef={function (input) {
                if (input)
                    input.indeterminate = indeterminate;
            }}>
					{_this.selectableTreeNodes ? null : label}
				</Checkbox>

				{_this.selectableTreeNodes ? label : null}
			</FlexBox_1.FlexRow>);
        };
        _this.renderCancerStudyTreeNode = function (study) {
            return (<FlexBox_1.FlexRow overflow padded className={styles.treeNodeContent}>
				{_this.renderStudyName(study.name, study)}
				<span className={styles.cancerStudySamples}>
					{study.allSampleCount + " samples"}
				</span>
				{_this.renderStudyLinks(study)}
			</FlexBox_1.FlexRow>);
        };
        _this.renderStudyName = function (name, study) {
            var checked = !!_.find(_this.selectedStudyIds, function (id) { return id == study.studyId; });
            return (<Checkbox className={styles.cancerStudyName} onChange={_this.getOnCheckHandler(study)} checked={checked}>
				<span className={_this.getMatchingNodeClassNames(study)}>
					{name}
				</span>
			</Checkbox>);
        };
        _this.renderStudyLinks = function (study) {
            var links = [];
            if (study.studyId)
                links.push({ icon: 'cube', url: "/study?id=" + study.studyId + "#summary" });
            if (study.pmid)
                links.push({ icon: 'book', url: "http://www.ncbi.nlm.nih.gov/pubmed/" + study.pmid });
            return links.map(function (link, i) { return (<a key={i} href={link.url}>
				<react_fontawesome_1.default name={link.icon}/>
			</a>); });
        };
        _this.renderStudyLinksTableCell = function (id, study) {
            return (<FlexBox_1.FlexRow overflow padded>
				{_this.renderStudyLinks(study)}
			</FlexBox_1.FlexRow>);
        };
        _this.handleTreeRef = function (ref) { return _this.tree = ref; };
        _this.state = {};
        return _this;
    }
    Object.defineProperty(CancerStudySelector, "defaultProps", {
        get: function () {
            return {
                treeDepth: 9,
                showAllStudiesByDefault: true,
                clickAgainToDeselectSingle: true,
            };
        },
        enumerable: true,
        configurable: true
    });
    CancerStudySelector.prototype.componentDidMount = function () {
    };
    Object.defineProperty(CancerStudySelector.prototype, "selectableTreeNodes", {
        get: function () {
            return !this.props.filterBySelection && !this.props.showStudiesInTree;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CancerStudySelector.prototype, "selectedCancerTypeIds", {
        get: function () {
            return firstDefinedValue_1.default(this.props.selectedCancerTypeIds, this.state.selectedCancerTypeIds || []);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CancerStudySelector.prototype, "selectedStudyIds", {
        get: function () {
            return firstDefinedValue_1.default(this.props.selectedStudyIds, this.state.selectedStudyIds || []);
        },
        enumerable: true,
        configurable: true
    });
    CancerStudySelector.prototype.updateState = function (newState) {
        this.setState(newState);
        if (this.tree)
            this.tree.forceUpdate();
        if (this.props.onStateChange) {
            this.props.onStateChange(__assign({ selectedCancerTypeIds: this.selectedCancerTypeIds, selectedStudyIds: this.selectedStudyIds }, newState));
        }
    };
    CancerStudySelector.prototype.getTreeInfo = function () {
        var _a = this.props, cancerTypes = _a.cancerTypes, studies = _a.studies;
        var rootCancerType = {
            clinicalTrialKeywords: '',
            dedicatedColor: '',
            name: 'All',
            parent: '',
            shortName: 'All',
            cancerTypeId: exports.CANCER_TYPE_ROOT
        };
        cancerTypes = [rootCancerType].concat(cancerTypes);
        var map_node_meta = new Map();
        var map_cancerTypeId_cancerType = new Map();
        var map_studyId_cancerStudy = new Map();
        var node, nodes, meta;
        // initialize lookups and metadata entries
        for (var _i = 0, _b = [cancerTypes, studies]; _i < _b.length; _i++) {
            nodes = _b[_i];
            for (var _c = 0, nodes_1 = nodes; _c < nodes_1.length; _c++) {
                node = nodes_1[_c];
                if (nodes == cancerTypes)
                    map_cancerTypeId_cancerType.set(node.cancerTypeId, node);
                else
                    map_studyId_cancerStudy.set(node.studyId, node);
                map_node_meta.set(node, {
                    isCancerType: nodes == cancerTypes,
                    childCancerTypes: [],
                    childStudies: [],
                    descendantStudies: [],
                    descendantCancerTypes: [],
                    ancestors: [],
                    siblings: [],
                });
            }
        }
        // fill in metadata values
        for (var _d = 0, _e = [cancerTypes, studies]; _d < _e.length; _d++) {
            nodes = _e[_d];
            for (var _f = 0, nodes_2 = nodes; _f < nodes_2.length; _f++) {
                node = nodes_2[_f];
                meta = map_node_meta.get(node);
                var parent_1 = void 0;
                if (meta.isCancerType)
                    parent_1 = map_cancerTypeId_cancerType.get(node.parent);
                else
                    parent_1 = map_cancerTypeId_cancerType.get(node.cancerTypeId);
                var parentMeta = parent_1 && map_node_meta.get(parent_1);
                if (parentMeta) {
                    if (meta.isCancerType)
                        parentMeta.childCancerTypes.push(node);
                    else
                        parentMeta.childStudies.push(node);
                }
                while (parent_1 && parentMeta) {
                    meta.ancestors.push(parent_1);
                    if (meta.isCancerType)
                        parentMeta.descendantCancerTypes.push(node);
                    else
                        parentMeta.descendantStudies.push(node);
                    parent_1 = map_cancerTypeId_cancerType.get(parent_1.parent);
                    parentMeta = parent_1 && map_node_meta.get(parent_1);
                }
            }
        }
        // final pass
        for (var _g = 0, _h = [cancerTypes, studies]; _g < _h.length; _g++) {
            nodes = _h[_g];
            for (var _j = 0, nodes_3 = nodes; _j < nodes_3.length; _j++) {
                node = nodes_3[_j];
                meta = map_node_meta.get(node);
                // sort related node lists (except ancestors)
                meta.descendantCancerTypes = sortNodes(meta.descendantCancerTypes);
                meta.descendantStudies = sortNodes(meta.descendantStudies);
                meta.childCancerTypes = sortNodes(meta.childCancerTypes);
                meta.childStudies = sortNodes(meta.childStudies);
                // get sibling studies
                if (!meta.isCancerType) {
                    var firstLevelAncestor = meta.ancestors[meta.ancestors.length - 2];
                    if (firstLevelAncestor) {
                        var ancestorMeta = map_node_meta.get(firstLevelAncestor);
                        meta.siblings = ancestorMeta.descendantStudies;
                    }
                }
            }
        }
        return {
            rootCancerType: rootCancerType,
            map_node_meta: map_node_meta,
            map_cancerTypeId_cancerType: map_cancerTypeId_cancerType,
            map_studyId_cancerStudy: map_studyId_cancerStudy,
        };
    };
    CancerStudySelector.prototype.getTreeDescriptor = function () {
        var _this = this;
        var _a = this.getTreeInfo(), rootCancerType = _a.rootCancerType, map_node_meta = _a.map_node_meta, map_cancerTypeId_cancerType = _a.map_cancerTypeId_cancerType, map_studyId_cancerStudy = _a.map_studyId_cancerStudy;
        var map_cancerType_expanded = new Map();
        map_cancerType_expanded.set(rootCancerType, true);
        // filters out empty CancerType subtrees
        var shouldConsiderNode = function (node) {
            var meta = map_node_meta.get(node);
            if (meta.isCancerType) {
                // ignore cancer types excluded by depth
                if (meta.ancestors.length > _this.props.treeDepth)
                    return false;
                // ignore cancer types with no descendant studies
                if (meta.descendantStudies.length == 0)
                    return false;
            }
            return true;
        };
        // returns true if the node or any related nodes match
        var nodeFilter = memoize_1.default({
            getAdditionalArgs: function () { return [_this.props.treeDepth, _this.props.searchText]; },
            fixedArgsLength: 1,
            function: function (node) {
                var meta = map_node_meta.get(node);
                if (!shouldConsiderNode(node))
                    return false;
                // if no search text is entered, include all nodes
                if (!_this.props.searchText)
                    return true;
                // check for matching text in this node and related nodes
                for (var _i = 0, _a = [[node], meta.descendantCancerTypes, meta.descendantStudies, meta.ancestors]; _i < _a.length; _i++) {
                    var nodes = _a[_i];
                    for (var _b = 0, nodes_4 = nodes; _b < nodes_4.length; _b++) {
                        var node_1 = nodes_4[_b];
                        if (shouldConsiderNode(node_1) && matchesSearchText(node_1.name, _this.props.searchText))
                            return true;
                    }
                }
                // no match
                return false;
            }
        });
        var hasChildren = function (node) {
            var meta = map_node_meta.get(node);
            if (meta.isCancerType) {
                // ignore cancer types excluded by depth
                if (meta.ancestors.length > _this.props.treeDepth)
                    return false;
                return meta.descendantStudies.some(nodeFilter);
            }
            return false;
        };
        var isExpanded = function (node) {
            var meta = map_node_meta.get(node);
            if (!meta.isCancerType)
                return false;
            if (map_cancerType_expanded.get(node))
                return true;
            // if user wants to search, expand all ancestors of matching nodes
            if (_this.props.searchText) {
                if (meta.descendantCancerTypes.some(nodeFilter))
                    return true;
                if (meta.descendantStudies.some(nodeFilter))
                    return true;
                // in fact, we want everything shown to be expanded
                return true;
            }
            return false;
        };
        function setExpanded(node, value, event) {
            map_cancerType_expanded.set(node, value);
            if (event.ctrlKey || event.metaKey) {
                var meta = map_node_meta.get(node);
                for (var _i = 0, _a = meta.childCancerTypes; _i < _a.length; _i++) {
                    var child = _a[_i];
                    setExpanded(child, value, event);
                }
            }
        }
        var getChildren = function (node) {
            if (!hasChildren(node))
                return undefined;
            var meta = map_node_meta.get(node);
            var children = meta.childCancerTypes;
            if (_this.props.showStudiesInTree) {
                var childStudies = meta.ancestors.length == _this.props.treeDepth ? meta.descendantStudies : meta.childStudies;
                children = children.concat(childStudies);
            }
            return children.filter(nodeFilter);
        };
        var getContent = function (node) {
            var meta = map_node_meta.get(node);
            if (meta.isCancerType)
                return _this.renderCancerTypeTreeNode(node);
            else
                return _this.renderCancerStudyTreeNode(node);
        };
        return {
            rootNode: rootCancerType,
            isExpanded: isExpanded,
            setExpanded: setExpanded,
            getChildren: getChildren,
            getContent: getContent,
            getListItemProps: this.getListItemProps,
            nodeFilter: nodeFilter,
        };
    };
    CancerStudySelector.prototype.getTreeSelectHandler = function (node) {
        var _this = this;
        if (!node)
            throw new Error('what');
        return function (event) {
            // stop if we clicked on the checkbox
            if (event.target instanceof HTMLInputElement)
                return;
            event.stopPropagation();
            var clickedCancerTypeId = node.cancerTypeId;
            var selectedCancerTypeIds = _this.selectedCancerTypeIds;
            if (event.ctrlKey) {
                if (_.includes(selectedCancerTypeIds, clickedCancerTypeId))
                    selectedCancerTypeIds = _.difference(selectedCancerTypeIds, [clickedCancerTypeId]);
                else
                    selectedCancerTypeIds = _.union(selectedCancerTypeIds, [clickedCancerTypeId]);
            }
            else if (_this.props.clickAgainToDeselectSingle && _.isEqual(selectedCancerTypeIds, [clickedCancerTypeId])) {
                selectedCancerTypeIds = [];
            }
            else {
                selectedCancerTypeIds = [clickedCancerTypeId];
            }
            _this.updateState({ selectedCancerTypeIds: selectedCancerTypeIds });
        };
    };
    CancerStudySelector.prototype.getOnCheckHandler = function (node) {
        var _this = this;
        return function (event) {
            var clickedStudyIds;
            var treeInfo = _this.getTreeInfo();
            var meta = treeInfo.map_node_meta.get(node);
            if (meta.isCancerType)
                clickedStudyIds = meta.descendantStudies.map(function (study) { return study.studyId; });
            else
                clickedStudyIds = [node.studyId];
            var selectedStudyIds = _this.selectedStudyIds;
            if (event.target.checked)
                selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
            else
                selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);
            _this.updateState({ selectedStudyIds: selectedStudyIds });
        };
    };
    CancerStudySelector.prototype.getMatchingNodeClassNames = function (node) {
        var meta = this.getTreeInfo().map_node_meta.get(node);
        var matchingNode = !!this.props.searchText && matchesSearchText(node.name, this.props.searchText);
        return classNames_1.default((_a = {},
            _a[styles.matchingNodeText] = !!this.props.searchText && matchingNode,
            _a[styles.nonMatchingNodeText] = !!this.props.searchText && !matchingNode,
            _a));
        var _a;
    };
    CancerStudySelector.prototype.render = function () {
        var treeInfo = this.getTreeInfo();
        var treeDesc = this.getTreeDescriptor();
        var selectedCancerTypes = this.selectedCancerTypeIds.map(function (cancerTypeId) { return treeInfo.map_cancerTypeId_cancerType.get(cancerTypeId); });
        // show all descendant studies of selected cancer types
        function getDescendantStudies(cancerType) {
            var meta = treeInfo.map_node_meta.get(cancerType);
            return meta ? meta.descendantStudies : [];
        }
        var studies = _.union.apply(_, selectedCancerTypes.map(getDescendantStudies));
        // if filtering by selection, expand studies list to include siblings
        if (this.props.filterBySelection && this.props.treeDepth) {
            function getSiblings(studyId) {
                var study = treeInfo.map_studyId_cancerStudy.get(studyId);
                var meta = treeInfo.map_node_meta.get(study);
                return meta.siblings;
            }
            studies = _.union.apply(_, this.selectedStudyIds.map(getSiblings));
        }
        // handle case where there are no descendant studies
        if ((studies.length == 0 && this.props.showAllStudiesByDefault) || !this.props.treeDepth) {
            var rootMeta = treeInfo.map_node_meta.get(treeInfo.rootCancerType);
            studies = rootMeta.descendantStudies;
        }
        // filter and sort studies list
        studies = sortNodes(studies.filter(treeDesc.nodeFilter));
        return (<FlexBox_1.FlexRow className={styles['cancerStudySelector']} padded flex={1} style={this.props.style}>
				{this.props.treeDepth > 0 || this.props.showStudiesInTree
            ? <FlexBox_1.FlexCol flex={1}>
							<DescriptorTreeNode_1.default className={this.props.showStudiesInTree ? styles.treeWithStudies : undefined} ref={this.handleTreeRef} treeDescriptor={treeDesc} node={treeDesc.rootNode} onExpand={treeDesc.setExpanded} showRoot={!!this.props.showRoot}/>
						</FlexBox_1.FlexCol>
            : null}
				<FlexBox_1.FlexCol flex={1}>
					{this.props.showStudiesInTree
            ? null
            : <FlexBox_1.FlexCol flex={2}>
								<react_bootstrap_table_1.BootstrapTable keyField="cancerStudyId" data={studies}>
									<react_bootstrap_table_2.TableHeaderColumn width="70%" dataField='name' dataSort dataFormat={this.renderStudyName}>Study</react_bootstrap_table_2.TableHeaderColumn>
									<react_bootstrap_table_2.TableHeaderColumn width="15%" dataField='allSampleCount' dataSort dataAlign="right">Samples</react_bootstrap_table_2.TableHeaderColumn>
									<react_bootstrap_table_2.TableHeaderColumn width="15%" dataField='studyId' dataSort dataFormat={this.renderStudyLinksTableCell}>Links</react_bootstrap_table_2.TableHeaderColumn>
								</react_bootstrap_table_1.BootstrapTable>
							</FlexBox_1.FlexCol>}
					<pre style={{ flex: 1, height: 200 }}>
						{JSON.stringify(this.selectedCancerTypeIds, null, 4)}
					</pre>
				</FlexBox_1.FlexCol>
			</FlexBox_1.FlexRow>);
    };
    return CancerStudySelector;
}(React.Component));
__decorate([
    memoize_1.memoizeWith('getMemoizeParams')
], CancerStudySelector.prototype, "getTreeInfo", null);
__decorate([
    memoize_1.memoizeWith('getMemoizeParams')
], CancerStudySelector.prototype, "getTreeDescriptor", null);
__decorate([
    memoize_1.default
], CancerStudySelector.prototype, "getTreeSelectHandler", null);
__decorate([
    memoize_1.default
], CancerStudySelector.prototype, "getOnCheckHandler", null);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CancerStudySelector;
