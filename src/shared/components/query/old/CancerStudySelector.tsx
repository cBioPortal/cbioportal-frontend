import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../../api/CBioPortalAPI";
import {ITreeDescriptor, default as DescriptorTree} from "../../tree/DescriptorTree";
import {BootstrapTable} from "react-bootstrap-table";
import {TableHeaderColumn} from "react-bootstrap-table";
import "react-bootstrap-table/css/react-bootstrap-table.css";
import FontAwesome from "react-fontawesome";
import {FlexCol, FlexRow} from "../../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import memoize, {memoizeWith} from "../../../lib/memoize";
import HTMLAttributes = __React.HTMLAttributes;
import classNames from "../../../lib/classNames";
import firstDefinedValue from "../../../lib/firstDefinedValue";
import CancerStudyTreeData from "../CancerStudyTreeData";
import {CancerTreeNode, NodeMetadata} from "../CancerStudyTreeData";
import LabeledCheckbox from "../../labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';

const CancerTree = DescriptorTree.of<CancerTreeNode>();

const styles = styles_any as {
	CancerStudySelector: string,
	treeNodeContent: string,
	selectable: string,
	selected: string,
	treeNodeLabel: string,
	treeWithStudies: string,
	cancerTypeTreeNode: string,
	cancerStudyName: string,
	cancerStudySamples: string,
	matchingNodeText: string,
	nonMatchingNodeText: string,
	studyHeader: string,
	selectCancerStudyHeader: string,
	selectCancerStudyRow: string,
	searchTextInput: string,
	showHideTreeLink: string,
};

function matchesSearchText(input:string, searchText:string):boolean
{
	input = input.toLocaleLowerCase();
	searchText = searchText.toLocaleLowerCase();

	return searchText.split(' ').every(filter => {
		let desired = true;
		if (filter.startsWith('-'))
		{
			filter = filter.substr(1);
			desired = false;
		}

		let found = input.indexOf(filter) >= 0;
		return found == desired;
	});
}

export type ICancerStudySelectorProps = {
	style?: React.CSSProperties;

	searchTextPresets: string[];
	cancerTypes: CancerType[];
	studies: CancerStudy[];

	onStateChange?: (newState:ICancerStudySelectorState) => void;
} & ICancerStudySelectorExperimentalOptions & ICancerStudySelectorState;

export interface ICancerStudySelectorExperimentalOptions
{
	showAllStudiesByDefault?: boolean;
	showRoot?: boolean;
	maxTreeDepth?: number;
	filterBySelection?: boolean;
	showStudiesInTree?: boolean;
	clickAgainToDeselectSingle?: boolean;
}

export interface ICancerStudySelectorState
{
	hideTree?: boolean;
	searchText?: string;
	selectedCancerTypeIds?: string[];
	selectedStudyIds?: string[];
}

export default class CancerStudySelector extends React.Component<ICancerStudySelectorProps, ICancerStudySelectorState>
{
	static get defaultProps():Partial<ICancerStudySelectorProps>
	{
		return {
			maxTreeDepth: 9,
			showAllStudiesByDefault: true,
			clickAgainToDeselectSingle: true,
		};
	}

	tree:DescriptorTree<CancerTreeNode>;

	constructor(props: ICancerStudySelectorProps)
	{
		super(props);
		this.state = {};
	}

	componentDidMount()
	{
	}

	get selectableTreeNodes()
	{
		return !this.props.filterBySelection && !this.props.showStudiesInTree;
	}

	get searchText()
	{
		return firstDefinedValue(this.props.searchText, this.state.searchText || '');
	}

	get maxTreeDepth()
	{
		if (firstDefinedValue(this.props.hideTree, this.state.hideTree))
			return 0;
		return this.props.maxTreeDepth;
	}

	get selectedCancerTypeIds()
	{
		return firstDefinedValue(this.props.selectedCancerTypeIds, this.state.selectedCancerTypeIds || []);
	}

	get selectedStudyIds()
	{
		return firstDefinedValue(this.props.selectedStudyIds, this.state.selectedStudyIds || []);
	}

	updateState(newState:ICancerStudySelectorState)
	{
		this.setState(newState);
		if (this.tree)
			this.tree.forceUpdate();

		if (this.props.onStateChange)
		{
			this.props.onStateChange({
				selectedCancerTypeIds: this.selectedCancerTypeIds,
				selectedStudyIds: this.selectedStudyIds,
				...newState
			});
		}
	}

	// these parameters determine when to recompute the tree info
	getMemoizeParams = ():any[] => [this.props.cancerTypes, this.props.studies];

	@memoizeWith('getMemoizeParams')
	getTreeInfo()
	{
		return new CancerStudyTreeData(this.props);
	}

	@memoizeWith('getMemoizeParams')
	getTreeDescriptor():ITreeDescriptor<CancerType|CancerStudy> & {rootNode: CancerType, setExpanded: (node:CancerTreeNode, value:boolean, event:React.MouseEvent) => void, nodeFilter: (node:CancerTreeNode) => boolean}
	{
		let {
			rootCancerType,
			map_node_meta,
		} = this.getTreeInfo();

		let map_cancerType_expanded = new Map<CancerTreeNode, boolean>();
		map_cancerType_expanded.set(rootCancerType, true);

		// filters out empty CancerType subtrees
		let shouldConsiderNode = (node:CancerTreeNode) =>
		{
			let meta = map_node_meta.get(node) as NodeMetadata;
			if (meta.isCancerType)
			{
				// ignore cancer types excluded by depth
				if (meta.ancestors.length > this.maxTreeDepth)
					return false;
				// ignore cancer types with no descendant studies
				if (meta.descendantStudies.length == 0)
					return false;
			}
			return true;
		}

		// returns true if the node or any related nodes match
		let nodeFilter = memoize({
			getAdditionalArgs: () => [this.maxTreeDepth, this.searchText],
			fixedArgsLength: 1,
			function: (node:CancerTreeNode):boolean =>
			{
				let meta = map_node_meta.get(node) as NodeMetadata;

				if (!shouldConsiderNode(node))
					return false;

				// if no search text is entered, include all nodes
				if (!this.searchText)
					return true;

				// check for matching text in this node and related nodes
				for (let nodes of [[node], meta.descendantCancerTypes, meta.descendantStudies, meta.ancestors])
					for (let node of nodes)
						if (shouldConsiderNode(node) && matchesSearchText(node.name, this.searchText))
							return true;

				// no match
				return false;
			}
		});

		let hasChildren = (node:CancerTreeNode):boolean =>
		{
			let meta = map_node_meta.get(node) as NodeMetadata;
			if (meta.isCancerType)
			{
				// ignore cancer types excluded by depth
				if (meta.ancestors.length > this.maxTreeDepth)
					return false;

				return meta.descendantStudies.some(nodeFilter);
			}

			return false;
		}

		let isExpanded = (node:CancerTreeNode) =>
		{
			let meta = map_node_meta.get(node) as NodeMetadata;
			if (!meta.isCancerType)
				return false;

			if (map_cancerType_expanded.get(node))
				return true;

			// if user wants to search, expand all ancestors of matching nodes
			if (this.searchText)
			{
				if (meta.descendantCancerTypes.some(nodeFilter))
					return true;

				if (meta.descendantStudies.some(nodeFilter))
					return true;

				// in fact, we want everything shown to be expanded
				return true;
			}

			return false;
		}

		function setExpanded(node:CancerTreeNode, value:boolean, event:React.MouseEvent):void
		{
			map_cancerType_expanded.set(node, value);
			if (event.ctrlKey || event.metaKey)
			{
				let meta = map_node_meta.get(node) as NodeMetadata;
				for (let child of meta.childCancerTypes)
					setExpanded(child, value, event);
			}
		}

		let getChildren = (node:CancerTreeNode):CancerTreeNode[]|undefined =>
		{
			if (!hasChildren(node))
				return undefined;

			let meta = map_node_meta.get(node) as NodeMetadata;
			let children:CancerTreeNode[] = meta.childCancerTypes;
			if (this.props.showStudiesInTree)
			{
				let childStudies = meta.ancestors.length == this.maxTreeDepth ? meta.descendantStudies : meta.childStudies;
				children = children.concat(childStudies);
			}
			return children.filter(nodeFilter);
		}

		let getContent = (node:CancerTreeNode) =>
		{
			let meta = map_node_meta.get(node) as NodeMetadata;
			if (meta.isCancerType)
				return this.renderCancerTypeTreeNode(node as CancerType);
			else
				return this.renderCancerStudyTreeNode(node as CancerStudy);
		}

		return {
			rootNode: rootCancerType,
			isExpanded,
			setExpanded,
			getChildren,
			getContent,
			getListItemProps: this.getListItemProps,
			nodeFilter,
		};
	}

	@memoize
	getTreeSelectHandler(node:CancerTreeNode)
	{
		return (event:React.MouseEvent) => {
			// stop if we clicked on the checkbox
			if (event.target instanceof HTMLInputElement)
				return;

			event.stopPropagation();

			let clickedCancerTypeId = node.cancerTypeId;

			let selectedCancerTypeIds = this.selectedCancerTypeIds;
			if (event.ctrlKey)
			{
				if (_.includes(selectedCancerTypeIds, clickedCancerTypeId))
					selectedCancerTypeIds = _.difference(selectedCancerTypeIds, [clickedCancerTypeId]);
				else
					selectedCancerTypeIds = _.union(selectedCancerTypeIds, [clickedCancerTypeId]);
			}
			else if (this.props.clickAgainToDeselectSingle && _.isEqual(selectedCancerTypeIds, [clickedCancerTypeId]))
			{
				selectedCancerTypeIds = [];
			}
			else
			{
				selectedCancerTypeIds = [clickedCancerTypeId];
			}

			this.updateState({selectedCancerTypeIds});
		};
	}

	@memoize
	getOnCheckHandler(node:CancerTreeNode)
	{
		return (event:React.FormEvent) => {
			let clickedStudyIds:string[];
			let treeInfo = this.getTreeInfo();
			let meta = treeInfo.map_node_meta.get(node) as NodeMetadata;
			if (meta.isCancerType)
				clickedStudyIds = meta.descendantStudies.map(study => study.studyId);
			else
				clickedStudyIds = [(node as CancerStudy).studyId];
			this.handleStudiesCheckbox(event, clickedStudyIds);
		};
	}

	handleStudiesCheckbox(event:React.FormEvent, clickedStudyIds:string[])
	{
		let selectedStudyIds = this.selectedStudyIds;
		if ((event.target as HTMLInputElement).checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.updateState({selectedStudyIds});
	}

	getListItemProps = (node:CancerTreeNode):HTMLAttributes =>
	{
		let meta = this.getTreeInfo().map_node_meta.get(node) as NodeMetadata;
		return {
			className: classNames({
				[styles.selectable]: this.selectableTreeNodes,
				[styles.selected]: this.selectableTreeNodes && meta.isCancerType && _.includes(this.selectedCancerTypeIds, node.cancerTypeId),
			})
		};
	};

	getMatchingNodeClassNames(node:CancerTreeNode):string
	{
		let matchingNode = !!this.searchText && matchesSearchText(node.name, this.searchText);
		return classNames({
			[styles.matchingNodeText]: !!this.searchText && matchingNode,
			[styles.nonMatchingNodeText]: !!this.searchText && !matchingNode,
		});
	}

	renderCancerTypeTreeNode = (cancerType:CancerType) =>
	{
		let treeInfo = this.getTreeInfo();
		let desc = this.getTreeDescriptor();
		let meta = treeInfo.map_node_meta.get(cancerType) as NodeMetadata;
		let selectedChildStudies = _.intersection(this.selectedStudyIds, meta.descendantStudies.map(study => study.studyId));
		let checked = selectedChildStudies.length > 0;
		let indeterminate = checked && selectedChildStudies.length != meta.descendantStudies.length;

		let label = (
			<span
				className={classNames(styles.treeNodeLabel, this.getMatchingNodeClassNames(cancerType))}
				onMouseDown={this.selectableTreeNodes ? this.getTreeSelectHandler(cancerType) : undefined}
			>
				{`${cancerType.name} (${meta.descendantStudies.filter(desc.nodeFilter).length})`}
			</span>
		);

		return (
			<FlexRow overflow className={classNames(styles.cancerTypeTreeNode, styles.treeNodeContent)}>
				<LabeledCheckbox
					checked={checked}
					indeterminate={indeterminate}
					inputProps={{
						onChange: this.getOnCheckHandler(cancerType)
					}}
				>
					{this.selectableTreeNodes ? null : label}
				</LabeledCheckbox>

				{this.selectableTreeNodes ? label : null}
			</FlexRow>
		);
	}

	getShownStudies():CancerStudy[]
	{
		let treeInfo = this.getTreeInfo();
		let treeDesc = this.getTreeDescriptor();

		let selectedCancerTypes = this.selectedCancerTypeIds.map(cancerTypeId => treeInfo.map_cancerTypeId_cancerType.get(cancerTypeId) as CancerType);

		// show all descendant studies of selected cancer types
		function getDescendantStudies(cancerType:CancerType)
		{
			let meta = treeInfo.map_node_meta.get(cancerType);
			return meta ? meta.descendantStudies : [];
		}
		let studies:CancerStudy[] = _.union.apply(_, selectedCancerTypes.map(getDescendantStudies));

		// if filtering by selection, expand studies list to include siblings
		if (this.props.filterBySelection && this.maxTreeDepth)
		{
			function getSiblings(studyId:string)
			{
				let study = treeInfo.map_studyId_cancerStudy.get(studyId) as CancerStudy;
				let meta = treeInfo.map_node_meta.get(study) as NodeMetadata;
				return meta.siblings;
			}
			studies = _.union.apply(_, this.selectedStudyIds.map(getSiblings));
		}

		// handle case where there are no descendant studies
		if ((studies.length == 0 && this.props.showAllStudiesByDefault) || !this.maxTreeDepth)
		{
			let rootMeta = treeInfo.map_node_meta.get(treeInfo.rootCancerType) as NodeMetadata;
			studies = rootMeta.descendantStudies;
		}

		// filter and sort studies list
		return CancerStudyTreeData.sortNodes(studies.filter(treeDesc.nodeFilter));
	}

	renderStudyHeaderCheckbox = (shownStudies:CancerStudy[]) =>
	{
		let treeInfo = this.getTreeInfo();
		let selectedStudies = this.selectedStudyIds.map(studyId => treeInfo.map_studyId_cancerStudy.get(studyId) as CancerStudy);
		let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
		let checked = shownAndSelectedStudies.length > 0;
		let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;
		return (
			<LabeledCheckbox
				checked={checked}
				indeterminate={indeterminate}
				labelProps={{
					onClick: (event:React.MouseEvent) => event.stopPropagation()
				}}
				inputProps={{
					onChange: event => {
						let shownStudyIds = shownStudies.map(study => study.studyId);
						this.handleStudiesCheckbox(event, shownStudyIds);
					}
				}}
			/>
		);
	}

	renderCancerStudyTreeNode = (study:CancerStudy) =>
	{
		return (
			<FlexRow overflow padded className={styles.treeNodeContent}>
				{this.renderStudyName(study.name, study)}
				<span className={styles.cancerStudySamples}>
					{`${study.allSampleCount} samples`}
				</span>
				{this.renderStudyLinks(study)}
			</FlexRow>
		);
	}

	renderStudyName = (name:string, study:CancerStudy) =>
	{
		let checked = !!_.find(this.selectedStudyIds, id => id == study.studyId);
		return (
			<LabeledCheckbox
				className={styles.cancerStudyName}
				checked={checked}
				inputProps={{
					onChange: this.getOnCheckHandler(study)
				}}
			>
				<span className={this.getMatchingNodeClassNames(study)}>
					{name}
				</span>
			</LabeledCheckbox>
		);
	}

	renderStudyLinks = (study:CancerStudy) =>
	{
		let links = [];
		if (study.studyId)
			links.push({icon: 'cube', url: `/study?id=${study.studyId}#summary`});
		if (study.pmid)
			links.push({icon: 'book', url: `http://www.ncbi.nlm.nih.gov/pubmed/${study.pmid}`});
		return links.map((link, i) => (
			<a key={i} href={link.url}>
				<FontAwesome name={link.icon}/>
			</a>
		));
	}

	renderStudyLinksTableCell = (id:string, study:CancerStudy) =>
	{
		return (
			<FlexRow overflow padded>
				{this.renderStudyLinks(study)}
			</FlexRow>
		);
	}

	render()
	{
		let treeDesc = this.getTreeDescriptor();
		let shownStudies = this.getShownStudies();

		let searchTextOptions = this.props.searchTextPresets;
		if (this.searchText && searchTextOptions.indexOf(this.searchText) < 0)
			searchTextOptions = [this.searchText].concat(searchTextOptions);

		return (
			<FlexCol className={styles.CancerStudySelector} padded flex={1} style={this.props.style}>
				<FlexRow padded overflow className={styles.selectCancerStudyRow}>
					<span className={styles.selectCancerStudyHeader}>Select Cancer Study:</span>
					<ReactSelect
						className={styles.searchTextInput}
						value={this.searchText}
						autofocus={true}
						options={searchTextOptions.map(str => ({label: str, value: str}))}
						promptTextCreator={(label:string) => `Search for "${label}"`}
						placeholder='Search...'
						noResultsText={false}
						onCloseResetsInput={false}
						onInputChange={(searchText:string) => this.setState({searchText})}
						onChange={(option:{value:string}) => this.setState({searchText: option ? option.value || '' : ''})}
					/>
					<a className={styles.showHideTreeLink} onClick={() => this.setState({hideTree: !!this.maxTreeDepth})}>
						{this.state.hideTree ? 'Show Tree' : 'Hide Tree'}
					</a>
					<div style={{flex: 1}}/>
					Number of Studies Selected: {this.selectedStudyIds.length}
				</FlexRow>
				<FlexRow padded flex={1}>
					{
						this.maxTreeDepth > 0 || this.props.showStudiesInTree
						?   <FlexCol flex={1}>
								<CancerTree
									className={this.props.showStudiesInTree ? styles.treeWithStudies : undefined}
									ref={this.handleTreeRef}
									treeDescriptor={treeDesc}
									node={treeDesc.rootNode}
									onExpand={treeDesc.setExpanded}
									showRoot={!!this.props.showRoot}
								/>
							</FlexCol>
						:   null
					}
					{
						this.props.showStudiesInTree
						?   null
						:   <FlexCol flex={2}>
								<BootstrapTable keyField="cancerStudyId" data={shownStudies}>
									<TableHeaderColumn width="70%" dataField='name' dataSort dataFormat={this.renderStudyName}>
										<div className={styles.studyHeader}>
											{this.renderStudyHeaderCheckbox(shownStudies)}
											{'Study'}
										</div>
									</TableHeaderColumn>

									<TableHeaderColumn width="15%" dataField='allSampleCount' dataSort dataAlign="right">
										{'Samples'}
									</TableHeaderColumn>

									<TableHeaderColumn width="15%" dataField='studyId' dataSort dataFormat={this.renderStudyLinksTableCell}>
										{'Links'}
									</TableHeaderColumn>
								</BootstrapTable>
							</FlexCol>
					}
				</FlexRow>
			</FlexCol>
		);
	}

	handleTreeRef = (ref:DescriptorTree<CancerTreeNode>) => this.tree = ref;
}
