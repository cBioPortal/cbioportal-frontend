import {CancerStudy, TypeOfCancer as CancerType} from "../../api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import {PriorityStudies} from "config/IAppConfig";
import {VirtualStudy} from "shared/model/VirtualStudy";

export const CANCER_TYPE_ROOT = 'tissue';
export const VIRTUAL_STUDY_NAME= 'My Virtual Studies';

export type CancerTreeNode = CancerType|CancerStudy;
export type NodeMetadata = {
	isCancerType:boolean,
	isPriorityCategory:boolean,
	priorityCategories:CancerType[],
	childCancerTypes:CancerType[],
	childStudies:CancerStudy[],
	descendantStudies:CancerStudy[],
	descendantCancerTypes:CancerType[],
	ancestors:CancerType[], // in order of ascending distance from node, ending in root node
	siblings:CancerStudy[], // descendants of highest level non-root ancestor
	searchTerms:string, // all related text in a single string for easy searching
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

	virtualStudyCategory:CancerType = {
		clinicalTrialKeywords: '',
		dedicatedColor       : '',
		name                 : VIRTUAL_STUDY_NAME,
		parent               : CANCER_TYPE_ROOT,
		shortName            : VIRTUAL_STUDY_NAME,
		cancerTypeId         : VIRTUAL_STUDY_NAME
	};

	priorityCategories:CancerType[] = [];
	map_node_meta = new Map<CancerTreeNode, NodeMetadata>();
	map_cancerTypeId_cancerType = new Map<string, CancerType>();
	map_studyId_cancerStudy = new Map<string, CancerStudy>();

	constructor({cancerTypes = [], studies = [], priorityStudies = {}, virtualStudies=[]}: {cancerTypes: CancerType[], studies: CancerStudy[], priorityStudies?:PriorityStudies, virtualStudies?:VirtualStudy[]})
	{
		let nodes:CancerTreeNode[];
		let node:CancerTreeNode;
		let meta:NodeMetadata;

		// sort by name
		cancerTypes = CancerStudyTreeData.sortNodes(cancerTypes);

		//map virtual study to cancer study
		const _virtualStudies = virtualStudies.map(virtualstudy => {
			return {
				allSampleCount: _.sumBy(virtualstudy.data.studies, study=>study.samples.length),
				studyId       : virtualstudy.id,
				name          : virtualstudy.data.name,
				description   : virtualstudy.data.description,
				cancerTypeId  : VIRTUAL_STUDY_NAME
			} as CancerStudy;
		});

		// add priority categories
		for (let name in priorityStudies)
		{
			this.priorityCategories.push({
				clinicalTrialKeywords: '',
				dedicatedColor: '',
				name,
				parent: CANCER_TYPE_ROOT,
				shortName: name,
				cancerTypeId: name
			});
		}
		// add virtual study category, and studies
		cancerTypes = [this.virtualStudyCategory, ...this.priorityCategories, this.rootCancerType, ...cancerTypes];
		studies     = CancerStudyTreeData.sortNodes([..._virtualStudies, ...studies]);

		// initialize lookups and metadata entries
		for (nodes of [cancerTypes, studies])
		{
			for (node of nodes)
			{
				let isCancerType = nodes == cancerTypes;
				if (isCancerType)
				{
					this.map_cancerTypeId_cancerType.set(node.cancerTypeId, node as CancerType);
				}
				else
				{
					this.map_studyId_cancerStudy.set((node as CancerStudy).studyId, node as CancerStudy);
				}

				let searchTerms = isCancerType ? node.name : [node.name, (node as CancerStudy).description].join('\n');
				this.map_node_meta.set(node, {
					isCancerType,
					isPriorityCategory: false,
					priorityCategories: [],
					childCancerTypes: [],
					childStudies: [],
					descendantStudies: [],
					descendantCancerTypes: [],
					ancestors: [],
					siblings: [],
					searchTerms,
				});
			}
		}

		// fill in childStudies for priorityCategories using existing CancerStudy objects
		for (let category of this.priorityCategories)
		{
			meta = this.map_node_meta.get(category) as NodeMetadata;
			meta.isPriorityCategory = true;
			for (let studyId of priorityStudies[category.cancerTypeId])
			{
				let study = this.map_studyId_cancerStudy.get(studyId);
				if (study)
				{
					meta.childStudies.push(study);
					meta.descendantStudies.push(study);
					let studyMeta = this.map_node_meta.get(study) as NodeMetadata;
					studyMeta.priorityCategories.push(category);
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

				let moreSearchTerms = [...meta.ancestors, ...meta.priorityCategories].map(cancerType => cancerType.name);
				meta.searchTerms = [meta.searchTerms, ...moreSearchTerms].join('\n');
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
