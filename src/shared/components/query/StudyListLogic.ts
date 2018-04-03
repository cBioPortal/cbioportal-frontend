import * as _ from 'lodash';
import {CancerTreeNode} from "./CancerStudyTreeData";
import {NodeMetadata} from "./CancerStudyTreeData";
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/generated/CBioPortalAPI";
import {QueryStore} from "./QueryStore";
import {computed, action} from "mobx";
import {parse_search_query, perform_search_single, SearchResult} from "../../lib/textQueryUtils";
import {cached} from 'mobxpromise';

export default class StudyListLogic
{
	constructor(private readonly store:QueryStore)
	{
	}

	@cached get map_node_filterByDepth()
	{
		let map_node_filter = new Map<CancerTreeNode, boolean>();
		for (let [node, meta] of this.store.treeData.map_node_meta.entries())
		{
			let filter = true;
			if (meta.isCancerType)
			{
				// exclude cancer types beyond max depth, or those with no descendant studies
				if (meta.ancestors.length > this.store.maxTreeDepth || !meta.descendantStudies.length)
					filter = false;
			}
			map_node_filter.set(node, filter);
		}
		return map_node_filter;
	}

	@cached get map_node_filterBySearchText()
	{
		// first compute individual node match results
		let parsedQuery = parse_search_query(this.store.searchText);
		let map_node_searchResult = new Map<CancerTreeNode, SearchResult>();
		for (let [node, meta] of this.store.treeData.map_node_meta.entries())
			map_node_searchResult.set(node, perform_search_single(parsedQuery, meta.searchTerms));

		let map_node_filter = new Map<CancerTreeNode, boolean>();
		for (let [node, meta] of this.store.treeData.map_node_meta.entries())
		{
			if (map_node_filter.has(node))
				continue;

			let filter = false;
			for (let item of [node, ...meta.ancestors, ...meta.priorityCategories])
			{
				let result = map_node_searchResult.get(item) as SearchResult;
				if (!result.match && result.forced)
				{
					filter = false;
					break;
				}
				filter = filter || result.match;
			}
			map_node_filter.set(node, filter);

			// include ancestors of matching studies
			if (filter && !meta.isCancerType)
				for (let cancerTypes of [meta.ancestors, meta.priorityCategories])
					for (let cancerType of cancerTypes)
						map_node_filter.set(cancerType, true);
		}
		return map_node_filter;
	}

	@cached get map_node_filterBySelectedCancerTypes()
	{
		let map_node_filter = new Map<CancerTreeNode, boolean>();
		if (this.store.selectedCancerTypes.length)
		{
			for (let cancerType of this.store.selectedCancerTypes)
			{
				let meta = this.getMetadata(cancerType);

				// include selected cancerType and related nodes
				map_node_filter.set(cancerType, true);
				for (let nodes of [meta.ancestors, meta.descendantCancerTypes, meta.descendantStudies])
					for (let node of nodes)
						map_node_filter.set(node, true);
			}
		}
		else
		{
			// include everything if no cancer types are selected
			for (let node of this.store.treeData.map_node_meta.keys())
				map_node_filter.set(node, true);
		}
		return map_node_filter;
	}

	@cached get map_node_filterBySelectedStudies()
	{
		let map_node_filter = new Map<CancerTreeNode, boolean>();
		if (this.store.selectedStudies.length)
		{
			for (let study of this.store.selectedStudies)
			{
				let meta = this.store.treeData.map_node_meta.get(study) as NodeMetadata;

				// include selected study and related nodes
				map_node_filter.set(study, true);
				for (let nodes of [meta.descendantStudies, meta.ancestors, meta.priorityCategories])
					for (let node of nodes)
						map_node_filter.set(node, true);
			}
		}
		return map_node_filter;
	}

	getMetadata(node:CancerTreeNode)
	{
		return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
	}

	@computed get mainView()
	{
		return new FilteredCancerTreeView(
			this.store,
			[
				this.map_node_filterByDepth,
				this.map_node_filterBySearchText,
				this.map_node_filterBySelectedCancerTypes
			]
		);
	}

	@computed get cancerTypeListView()
	{
		return new FilteredCancerTreeView(
			this.store,
			[
				this.map_node_filterByDepth,
				this.map_node_filterBySearchText
			]
		);
	}

	@computed get selectedStudiesView()
	{
		return new FilteredCancerTreeView(
			this.store,
			[
				this.map_node_filterByDepth,
				this.map_node_filterBySelectedStudies,
				{get: (node:CancerTreeNode) => !this.getMetadata(node).isPriorityCategory}
			]
		);
	}

	cancerTypeContainsSelectedStudies(cancerType:CancerType):boolean
	{
		let descendantStudies = this.getMetadata(cancerType).descendantStudies;
		return _.intersection(this.store.selectedStudies, descendantStudies).length > 0;
	}

	getDepth(node:CancerType):number
	{
		let meta = this.getMetadata(node);
		return meta.ancestors.length;
	}

	isHighlighted(node:CancerTreeNode):boolean
	{
		return !!this.store.searchText && !!this.map_node_filterBySearchText.get(node);
	}
}

export class FilteredCancerTreeView
{
	constructor(
		private store:QueryStore,
		private filters:Pick<Map<CancerTreeNode, boolean>, 'get'>[]
	){}

	nodeFilter = (node:CancerTreeNode):boolean =>
	{
		return this.filters.every(map => !!map.get(node));
	}

	getMetadata(node:CancerTreeNode)
	{
		return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
	}

	getChildCancerTypes(cancerType:CancerType):CancerType[]
	{
		let meta = this.getMetadata(cancerType);
		let childTypes = meta.ancestors.length < this.store.maxTreeDepth ? meta.childCancerTypes : [];
		return childTypes.filter(this.nodeFilter);
	}

	getChildCancerStudies(cancerType:CancerType):CancerStudy[]
	{
		let meta = this.getMetadata(cancerType);
		let studies = meta.ancestors.length < this.store.maxTreeDepth ? meta.childStudies : meta.descendantStudies;
		return studies.filter(this.nodeFilter);
	}

	getDescendantCancerStudies(node:CancerTreeNode):CancerStudy[]
	{
		let meta = this.getMetadata(node);
		return meta.descendantStudies.filter(this.nodeFilter);
	}

	getCheckboxProps(node: CancerTreeNode): {checked: boolean, indeterminate?: boolean, disabled?: boolean}
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			let selectedStudyIds = this.store.selectedStudyIds || [];
			let selectedStudies = selectedStudyIds.map(studyId => this.store.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
			let shownStudies = this.getDescendantCancerStudies(node);
			let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
			let checked = shownAndSelectedStudies.length > 0;
			let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;

			return {checked, indeterminate};
		}
		else
		{
			let study = node as CancerStudy;
			let checked = !!this.store.selectedStudyIds.find(id => id == study.studyId);
			let disabled = this.store.isDeletedVirtualStudy(study.studyId);
			return {checked,disabled};
		}
	}

	isCheckBoxDisabled(node: CancerTreeNode):boolean {
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			return false;
		}
		else
		{
			let study = node as CancerStudy;
			if(this.store.isDeletedVirtualStudy(study.studyId)) {
				return true;
			}
			return false;
		}

	}

	@action clearAllSelection(): void
	{
        this.store.selectedStudyIds = []
	}


	@action onCheck(node:CancerTreeNode, checked:boolean): void
	{
		let clickedStudyIds;
		let meta = this.getMetadata(node);

		if (meta.isCancerType)
		{
			if (!this.store.forDownloadTab)
				clickedStudyIds = this.getDescendantCancerStudies(node).map(study => study.studyId);
		}
		else
		{
			clickedStudyIds = [(node as CancerStudy).studyId];
		}

		if (clickedStudyIds)
			this.handleCheckboxStudyIds(clickedStudyIds, checked);
	}

	getSelectionReport(){

        let selectedStudyIds = this.store.selectedStudyIds || [];
        let selectedStudies = selectedStudyIds.map(studyId => this.store.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
        let shownStudies = this.getDescendantCancerStudies(this.store.treeData.rootCancerType);
        let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies) as CancerStudy[];

		return {
            selectedStudyIds,
			selectedStudies,
			shownStudies,
			shownAndSelectedStudies
		}

    }

    @action toggleAllFiltered(){

        const {selectedStudyIds, selectedStudies, shownStudies, shownAndSelectedStudies} = this.getSelectionReport();

        if (shownStudies.length === shownAndSelectedStudies.length) { // deselect
            this.store.selectedStudyIds = _.without(this.store.selectedStudyIds, ... shownStudies.map((study:CancerStudy)=>study.studyId));
        } else {
            this.store.selectedStudyIds = _.union(this.store.selectedStudyIds, shownStudies.map((study:CancerStudy)=>study.studyId));
        }

    }

	private handleCheckboxStudyIds(clickedStudyIds:string[], checked:boolean)
	{
		let selectedStudyIds = this.store.selectedStudyIds;
		if (checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.store.selectedStudyIds = selectedStudyIds;
	}
}
