import * as React from 'react';
import * as _ from 'lodash';
import {CancerTreeNode} from "../query/CancerStudyTreeData";
import {NodeMetadata} from "../query/CancerStudyTreeData";
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/generated/CBioPortalAPI";
import memoize from "memoize-weak-decorator";
import {QueryStore} from "../query/QueryStore";
import {computed, action} from "mobx";

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

export default class StudyListLogic
{
	constructor(readonly store:QueryStore)
	{
	}

	@computed get rootCancerType()
	{
		return this.store.treeData.rootCancerType;
	}

	getMetadata(node:CancerTreeNode)
	{
		return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
	}

	// filters out empty CancerType subtrees
	shouldConsiderNode(node:CancerTreeNode)
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			// ignore cancer types excluded by selection
			if (!this.store.showSelectedStudiesOnly && this.store.selectedCancerTypeIds.length)
			{
				let idToCancerType = (cancerTypeId:string) => this.store.treeData.map_cancerTypeId_cancerType.get(cancerTypeId) as CancerType;
				let selectedCancerTypes = this.store.selectedCancerTypeIds.map(idToCancerType);
				if (_.intersection(selectedCancerTypes, [node].concat(meta.ancestors)).length == 0)
					return false;
			}
			// ignore cancer types excluded by depth
			if (meta.ancestors.length > this.store.maxTreeDepth)
				return false;
			// ignore cancer types with no descendant studies
			if (meta.descendantStudies.length == 0)
				return false;

			return true;
		}

		// cancer study
		if (this.store.showSelectedStudiesOnly && !_.includes(this.store.selectedStudies, node as CancerStudy))
			return false;
		return true;
	}

	// returns true if the node or any related nodes match
	nodeFilter = memoize({
		getAdditionalArgs: () => [this.store.treeData, this.store.maxTreeDepth, this.store.searchText],
		fixedArgsLength: 1,
		function: (node:CancerTreeNode):boolean =>
		{
			//TODO this logic is broken - search for 'eas' and then select/deselect Breast cancer type to see bug

			let meta = this.getMetadata(node);

			if (!this.shouldConsiderNode(node))
				return false;

			// hack - shouldConsiderNode() call above does all the required filtering
			if (this.store.showSelectedStudiesOnly)
				return true;

			// if no search text is entered, include all nodes
			if (!this.store.searchText)
				return true;

			// check for matching text in this node and related nodes
			for (let others of [[node], meta.descendantCancerTypes, meta.descendantStudies, meta.ancestors])
				for (let other of others)
					if (this.shouldConsiderNode(other) && matchesSearchText(other.name, this.store.searchText))
						return true;

			// no match
			return false;
		}
	});

	cancerTypeContainsSelectedStudies(cancerType:CancerType):boolean
	{
		let descendantStudies = this.getMetadata(cancerType).descendantStudies;
		return _.intersection(this.store.selectedStudies, descendantStudies).length > 0;
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
		if (node === this.rootCancerType)
			return this.hack_getAllStudies();

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
		return !!this.store.searchText && matchesSearchText(node.name, this.store.searchText);
	}

	getCheckboxProps(node: CancerTreeNode): {checked: boolean, indeterminate?: boolean}
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
			return {checked};
		}
	}

	hack_getAllStudies()
	{
		return _.union(...(
			this.getChildCancerTypes(this.rootCancerType)
				.map(cancerType => this.getDescendantCancerStudies(cancerType))
		));
	}

	@action hack_handleSelectAll(checked:boolean)
	{
		let selectedStudyIds = this.store.selectedStudyIds;
		let clickedStudyIds = this.hack_getAllStudies().map(study => study.studyId);
		if (checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.store.selectedStudyIds = selectedStudyIds;

		if (!this.store.selectedStudyIds.length)
			this.store.showSelectedStudiesOnly = false;
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
/*
type SearchClause = (
	{type: 'not', data: string} |
	{type: 'and', data: string[]}
);
function parse_search_query(query:string):SearchClause[]
{
	// First eliminate trailing whitespace and reduce every whitespace
	//	to a single space.
	query = query.toLowerCase().trim().split(/\s+/g).join(' ');
	// Now factor out quotation marks and inter-token spaces
	let phrases = [];
	let currInd = 0;
	let nextSpace, nextQuote;
	while (currInd < query.length)
	{
		if (query[currInd] === '"')
		{
			nextQuote = query.indexOf('"', currInd + 1);
			if (nextQuote === -1)
			{
				phrases.push(query.substring(currInd + 1));
				currInd = query.length;
			}
			else
			{
				phrases.push(query.substring(currInd + 1, nextQuote));
				currInd = nextQuote + 1;
			}
		}
		else if (query[currInd] === ' ')
		{
			currInd += 1;
		}
		else if (query[currInd] === '-')
		{
			phrases.push('-');
			currInd += 1;
		}
		else
		{
			nextSpace = query.indexOf(' ', currInd);
			if (nextSpace === -1)
			{
				phrases.push(query.substring(currInd));
				currInd = query.length;
			}
			else
			{
				phrases.push(query.substring(currInd, nextSpace));
				currInd = nextSpace + 1;
			}
		}
	}
	// Now get the conjunctive clauses, and the negative clauses
	let clauses:SearchClause[] = [];
	currInd = 0;
	let nextOr, nextDash;
	while (currInd < phrases.length)
	{
		if (phrases[currInd] === '-')
		{
			if (currInd < phrases.length - 1)
			{
				clauses.push({"type": "not", "data": phrases[currInd + 1]});
			}
			currInd = currInd + 2;
		}
		else
		{
			nextOr = phrases.indexOf('or', currInd);
			nextDash = phrases.indexOf('-', currInd);
			if (nextOr === -1 && nextDash === -1)
			{
				clauses.push({"type": "and", "data": phrases.slice(currInd)});
				currInd = phrases.length;
			}
			else if (nextOr === -1 && nextDash > 0)
			{
				clauses.push({"type": "and", "data": phrases.slice(currInd, nextDash)});
				currInd = nextDash;
			}
			else if (nextOr > 0 && nextDash === -1)
			{
				clauses.push({"type": "and", "data": phrases.slice(currInd, nextOr)});
				currInd = nextOr + 1;
			}
			else
			{
				if (nextOr < nextDash)
				{
					clauses.push({"type": "and", "data": phrases.slice(currInd, nextOr)});
					currInd = nextOr + 1;
				}
				else
				{
					clauses.push({"type": "and", "data": phrases.slice(currInd, nextDash)});
					currInd = nextDash;
				}
			}
		}
	}
	return clauses;
}

function matchPhrase(phrase:string, node)
{
	phrase = phrase.toLowerCase();
	return !!(
		(item && item.name && item.name.toLowerCase().indexOf(phrase) > -1)
		|| (item && item.description && item.description.toLowerCase().indexOf(phrase) > -1)
		|| (item && item.search_terms && item.search_terms.toLowerCase().indexOf(phrase) > -1)
	);
}

function perform_search_single(parsed_query, node)
{
	// in: a jstree node
	// text to search is node.text and item.description and item.search_terms
	// return true iff the query, considering quotation marks, 'and' and 'or' logic, matches
	let match = false;
	let hasPositiveClauseType = false;
	let forced = false;

	for (let clause of parsed_query)
	{
		if (clause.type !== 'not')
		{
			hasPositiveClauseType = true;
			return 0;
		}
	}
	if (!hasPositiveClauseType)
	{
		// if only negative clauses, match by default
		match = true;
	}
	for (let clause of parsed_query)
	{
		if (clause.type === 'not')
		{
			if (matchPhrase(clause.data, node))
			{
				match = false;
				forced = true;
				return 0;
			}
		}
		else if (clause.type === 'and')
		{
			hasPositiveClauseType = true;
			let clauseMatch = true;
			for (let phrase of clause.data)
			{
				clauseMatch = clauseMatch && matchPhrase(phrase, node);
			}
			match = match || clauseMatch;
		}
	}
	return {result: match, forced: forced};
};
*/
