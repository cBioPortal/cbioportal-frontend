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
var React = require("react");
var QueryConnector_1 = require("./QueryConnector");
var react_spinkit_1 = require("react-spinkit");
var CancerStudySelector_1 = require("./CancerStudySelector");
var FlexBox_1 = require("../flexbox/FlexBox");
var ExperimentalControls_1 = require("../ExperimentalControls");
var styles = require("./styles.module.scss");
var QueryContainer = (function (_super) {
    __extends(QueryContainer, _super);
    function QueryContainer(props) {
        var _this = _super.call(this, props) || this;
        // for demo only
        _this.onStateChange = function (selectionState) {
            _this.setState({ selectionState: selectionState });
        };
        _this.state = {};
        return _this;
    }
    QueryContainer.prototype.componentDidMount = function () {
        if (this.props.loadQueryData)
            this.props.loadQueryData();
    };
    QueryContainer.prototype.render = function () {
        var _this = this;
        if (this.props.data && this.props.data.status == 'fetching')
            return <react_spinkit_1.default />;
        if (!this.props.data || !this.props.data.cancerTypes || !this.props.data.studies)
            return <span>No data</span>;
        var selectionState = this.state.selectionState || {};
        return (<FlexBox_1.FlexCol padded flex={1} style={{ width: '100%', height: '100%' }}>

                
                <CancerStudySelector_1.default style={{ height: 400 }} cancerTypes={this.props.data.cancerTypes} studies={this.props.data.studies} onStateChange={this.onStateChange} showStudiesInTree={this.state.showStudiesInTree} {...this.state} {...this.state.selectionState}/>

                <FlexBox_1.FlexRow padded>
					
                	<FlexBox_1.FlexCol className={styles.cancerStudySelector} padded style={{ border: '1px solid #ddd', borderRadius: 5, padding: 5 }}>
						<label>
							Filter cancer studies: <input onChange={function (event) {
            _this.setState({
                searchText: event.target.value,
                selectionState: __assign({}, _this.state.selectionState, { selectedCancerTypeIds: [] })
            });
        }}/>
						</label>
                		<ExperimentalControls_1.StateToggle label='Show all studies when nothing is selected' target={this} name='showAllStudiesByDefault' defaultValue={!!CancerStudySelector_1.default.defaultProps.showAllStudiesByDefault}/>
                		<ExperimentalControls_1.StateToggle label='Show root node ("All")' target={this} name='showRoot' defaultValue={!!CancerStudySelector_1.default.defaultProps.showRoot}/>
                		<ExperimentalControls_1.StateToggle label='Click tree node again to deselect' target={this} name='clickAgainToDeselectSingle' defaultValue={!!CancerStudySelector_1.default.defaultProps.clickAgainToDeselectSingle}/>
                		<ExperimentalControls_1.StateToggle label='Filter studies list by tree checkboxes' target={this} name='filterBySelection' defaultValue={!!CancerStudySelector_1.default.defaultProps.filterBySelection}/>
                		<ExperimentalControls_1.StateToggle label='Show studies in tree' target={this} name='showStudiesInTree' defaultValue={!!CancerStudySelector_1.default.defaultProps.showStudiesInTree}/>
						<ExperimentalControls_1.Select label="Tree depth: " selected={ExperimentalControls_1.valueOrDefault(this.state.treeDepth, CancerStudySelector_1.default.defaultProps.treeDepth)} options={[
            { label: "0" },
            { label: "1" },
            { label: "2" },
            { label: "3" },
            { label: "4" },
            { label: "5" },
            { label: "6" },
            { label: "7" },
            { label: "8" },
            { label: "9" },
        ]} onChange={function (option) { return _this.setState({
            treeDepth: parseInt(option.label)
        }); }}/>
						<span>Note: Use cmd+click tree node arrow to expand/collapse entire subtree.</span>
						{this.state.filterBySelection || this.state.showStudiesInTree
            ? <span>&nbsp;</span>
            : <span>Note: Use cmd+click to select/deselect multiple tree nodes.</span>}
					</FlexBox_1.FlexCol>

					
					<pre style={{ flex: 1, height: 200 }}>
						{JSON.stringify(this.state.selectionState, null, 4)}
					</pre>
				</FlexBox_1.FlexRow>

            </FlexBox_1.FlexCol>);
    };
    return QueryContainer;
}(React.Component));
QueryContainer = __decorate([
    QueryConnector_1.default.decorator
], QueryContainer);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QueryContainer;
