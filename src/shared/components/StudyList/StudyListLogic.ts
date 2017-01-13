import * as React from 'react';
import * as _ from 'lodash';
import {IStudyListLogic} from "./StudyList";
import CancerStudyTreeData from "../query/CancerStudyTreeData";
import {CancerTreeNode} from "../query/CancerStudyTreeData";
import {NodeMetadata} from "../query/CancerStudyTreeData";
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import memoize from "../../lib/memoize";

export function matchesSearchText(input:string, searchText:string):boolean
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

export default class StudyListLogic implements IStudyListLogic
{
	state:{
		'searchText': string,
		'selectedStudyIds': string[],
		'selectedCancerTypeIds': string[],
		'maxTreeDepth': number,
	};

	treeData: CancerStudyTreeData;
	handleSelectedStudiesChange: (selectedStudyIds: string[]) => void

	constructor(params: Pick<StudyListLogic, 'state' | 'treeData' | 'handleSelectedStudiesChange'>)
	{
		this.state = params.state;
		this.treeData = params.treeData;
		this.handleSelectedStudiesChange = params.handleSelectedStudiesChange;
	}

	getRootCancerType()
	{
		return this.treeData.rootCancerType;
	}

	getMetadata(node:CancerTreeNode)
	{
		return this.treeData.map_node_meta.get(node) as NodeMetadata;
	}

	// filters out empty CancerType subtrees
	shouldConsiderNode(node:CancerTreeNode)
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			// ignore cancer types excluded by selection
			if (this.state.selectedCancerTypeIds.length)
			{
				let idToCancerType = (cancerTypeId:string) => this.treeData.map_cancerTypeId_cancerType.get(cancerTypeId) as CancerType;
				let selectedCancerTypes = this.state.selectedCancerTypeIds.map(idToCancerType);
				if (_.intersection(selectedCancerTypes, [node].concat(meta.ancestors)).length == 0)
					return false;
			}
			// ignore cancer types excluded by depth
			if (meta.ancestors.length > this.state.maxTreeDepth)
				return false;
			// ignore cancer types with no descendant studies
			if (meta.descendantStudies.length == 0)
				return false;
		}
		return true;
	}

	// returns true if the node or any related nodes match
	nodeFilter = memoize({
		getAdditionalArgs: () => [this.treeData, this.state.maxTreeDepth, this.state.searchText],
		fixedArgsLength: 1,
		function: (node:CancerTreeNode):boolean =>
		{
			let meta = this.getMetadata(node);

			if (!this.shouldConsiderNode(node))
				return false;

			// if no search text is entered, include all nodes
			if (!this.state.searchText)
				return true;

			// check for matching text in this node and related nodes
			for (let nodes of [[node], meta.descendantCancerTypes, meta.descendantStudies, meta.ancestors])
				for (let node of nodes)
					if (this.shouldConsiderNode(node) && matchesSearchText(node.name, this.state.searchText))
						return true;

			// no match
			return false;
		}
	});

	getChildCancerTypes(cancerType:CancerType):CancerType[]
	{
		let meta = this.getMetadata(cancerType);
		let childTypes = meta.ancestors.length < this.state.maxTreeDepth ? meta.childCancerTypes : [];
		return childTypes.filter(this.nodeFilter);
	}

	getChildCancerStudies(cancerType:CancerType):CancerStudy[]
	{
		let meta = this.getMetadata(cancerType);
		let studies = meta.ancestors.length < this.state.maxTreeDepth ? meta.childStudies : meta.descendantStudies;
		return studies.filter(this.nodeFilter);
	}

	getDescendantCancerStudies(node:CancerTreeNode):CancerStudy[]
	{
		let meta = this.getMetadata(node);
		return meta.descendantStudies.filter(this.nodeFilter);
	}

	getDepth(node:CancerType):number
	{
		let meta = this.getMetadata(node);
		return meta.ancestors.length;
	}

	isHighlighted(node:CancerTreeNode):boolean
	{
		return !!this.state.searchText && matchesSearchText(node.name, this.state.searchText);
	}

	getCheckboxProps(node: CancerTreeNode): {checked: boolean, indeterminate?: boolean}
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			let selectedStudyIds = this.state.selectedStudyIds || [];
			let selectedStudies = selectedStudyIds.map(studyId => this.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
			let shownStudies = this.getDescendantCancerStudies(node);
			let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
			let checked = shownAndSelectedStudies.length > 0;
			let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;

			return {checked, indeterminate};
		}
		else
		{
			let study = node as CancerStudy;
			let checked = !!this.state.selectedStudyIds.find(id => id == study.studyId);
			return {checked};
		}
	}

	onCheck(node:CancerTreeNode, event:React.FormEvent/*<HTMLInputElement>*/): void
	{
		let clickedStudyIds:string[];
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
			clickedStudyIds = this.getDescendantCancerStudies(node).map(study => study.studyId);
		else
			clickedStudyIds = [(node as CancerStudy).studyId];
		this.handleCheckboxStudyIds(event, clickedStudyIds);
	}

	handleCheckboxStudyIds(event:React.FormEvent/*<HTMLInputElement>*/, clickedStudyIds:string[])
	{
		let selectedStudyIds = this.state.selectedStudyIds;
		if ((event.target as HTMLInputElement).checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.handleSelectedStudiesChange(selectedStudyIds);
	}
}
