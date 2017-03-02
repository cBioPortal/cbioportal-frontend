import {CancerStudy, TypeOfCancer as CancerType} from "../../api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import {PriorityStudies} from "config/IAppConfig";

export const CANCER_TYPE_ROOT = 'tissue';

export type CancerTreeNode = CancerType|CancerStudy;
export type NodeMetadata = {
	isCancerType:boolean,
	childCancerTypes:CancerType[],
	childStudies:CancerStudy[],
	descendantStudies:CancerStudy[],
	descendantCancerTypes:CancerType[],
	ancestors:CancerType[], // in order of ascending distance from node, ending in root node
	siblings:CancerStudy[], // descendants of highest level non-root ancestor
};

export default class CancerStudyTreeData
{
	static sortNodes<T extends CancerTreeNode[]>(nodes:T):T
	{
		return _.sortBy(nodes, node => node.name) as T;
	}

	rootCancerType:CancerType = {
		clinicalTrialKeywords: '',
		dedicatedColor: '',
		name: 'All',
		parent: '',
		shortName: 'All',
		cancerTypeId: CANCER_TYPE_ROOT
	};

	map_node_meta = new Map<CancerTreeNode, NodeMetadata>();
	map_cancerTypeId_cancerType = new Map<string, CancerType>();
	map_studyId_cancerStudy = new Map<string, CancerStudy>();

	constructor({cancerTypes = [], studies = [], priorityStudies = {}}: {cancerTypes: CancerType[], studies: CancerStudy[], priorityStudies?:PriorityStudies})
	{
		let nodes:CancerTreeNode[];
		let node:CancerTreeNode;
		let meta:NodeMetadata;

		// sort by name
		cancerTypes = CancerStudyTreeData.sortNodes(cancerTypes);
		studies = CancerStudyTreeData.sortNodes(studies);

		let priorityCategories:CancerType[] = [];
		for (let name in priorityStudies)
		{
			priorityCategories.push({
				clinicalTrialKeywords: '',
				dedicatedColor: '',
				name,
				parent: CANCER_TYPE_ROOT,
				shortName: name,
				cancerTypeId: name
			});
		}
		cancerTypes = priorityCategories.concat(this.rootCancerType, cancerTypes);

		// initialize lookups and metadata entries
		for (nodes of [cancerTypes, studies])
		{
			for (node of nodes)
			{
				if (nodes == cancerTypes)
				{
					this.map_cancerTypeId_cancerType.set(node.cancerTypeId, node as CancerType);
				}
				else
				{
					this.map_studyId_cancerStudy.set((node as CancerStudy).studyId, node as CancerStudy);
				}

				this.map_node_meta.set(node, {
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

		// fill in childStudies for priorityCategories using existing CancerStudy objects
		for (let category of priorityCategories)
		{
			meta = this.map_node_meta.get(category) as NodeMetadata;
			for (let studyId of priorityStudies[category.cancerTypeId])
			{
				let study = this.map_studyId_cancerStudy.get(studyId);
				if (study)
				{
					meta.childStudies.push(study);
					meta.descendantStudies.push(study);
				}
			}
		}

		// fill in metadata values
		for (nodes of [cancerTypes, studies])
		{
			for (node of nodes)
			{
				meta = this.map_node_meta.get(node) as NodeMetadata;
				let parent;
				if (meta.isCancerType)
					parent = this.map_cancerTypeId_cancerType.get((node as CancerType).parent);
				else
					parent = this.map_cancerTypeId_cancerType.get(node.cancerTypeId);

				let parentMeta = parent && this.map_node_meta.get(parent);
				if (parentMeta)
				{
					if (meta.isCancerType)
						parentMeta.childCancerTypes.push(node as CancerType);
					else
						parentMeta.childStudies.push(node as CancerStudy);
				}

				while (parent && parentMeta)
				{
					meta.ancestors.push(parent);
					if (meta.isCancerType)
						parentMeta.descendantCancerTypes.push(node as CancerType);
					else
						parentMeta.descendantStudies.push(node as CancerStudy);

					parent = this.map_cancerTypeId_cancerType.get(parent.parent);
					parentMeta = parent && this.map_node_meta.get(parent);
				}
			}
		}

		// get sibling studies
		for (node of studies)
		{
			meta = this.map_node_meta.get(node) as NodeMetadata;
			// firstLevelAncestor is the ancestor below the rootCancerType
			let firstLevelAncestor = meta.ancestors[meta.ancestors.length - 2];
			if (firstLevelAncestor)
			{
				let ancestorMeta = this.map_node_meta.get(firstLevelAncestor) as NodeMetadata;
				meta.siblings = ancestorMeta.descendantStudies;
			}
		}
	}
}
