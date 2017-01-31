import * as _ from 'lodash';
import client from "../../api/cbioportalClientInstance";
import {toJS, observable, action, computed, whyRun, expr} from "../../../../node_modules/mobx/lib/mobx";
import {TypeOfCancer as CancerType, GeneticProfile} from "../../api/CBioPortalAPI";
import CancerStudyTreeData from "./CancerStudyTreeData";
import StudyListLogic from "../StudyList/StudyListLogic";
import MobxPromise from "../../api/MobxPromise";

// mobx observable
export class QueryStore
{
	@observable cancerTypes = new MobxPromise(client.getAllCancerTypesUsingGET({}));
	@observable cancerStudies = new MobxPromise(client.getAllStudiesUsingGET({}));
	@observable geneticProfiles = new MobxPromise(() => {
		let studyIds = this.selectedCancerStudyIds;
		if (studyIds && studyIds.length == 1)
			return client.getAllGeneticProfilesInStudyUsingGET({studyId: studyIds[0]});
		else
			return Promise.resolve([]);
	});

	@observable searchText:string = '';
	@observable.shallow searchTextPresets = ['lung', 'serous', 'tcga', 'tcga -provisional'];
	@observable.shallow selectedCancerStudyIds:string[] = [];
	@observable.shallow selectedProfileIds:string[] = [];
	@observable zScoreThreshold:string = '2.0';

	@computed get selectedProfiles()
	{
		let idToProfile = expr(() => _.keyBy(this.geneticProfiles.result || [], profile => profile.geneticProfileId));
		return this.selectedProfileIds.map(id => idToProfile[id]);
	}

	// experimental options
	@observable.shallow selectedCancerTypeIds:string[] = [];
	@observable maxTreeDepth:number = 9;
	@observable clickAgainToDeselectSingle:boolean = true;

	@computed get treeData()
	{
		return new CancerStudyTreeData({
			cancerTypes: this.cancerTypes.result || [],
			studies: this.cancerStudies.result || []
		});
	}

	@computed get studyListLogic()
	{
		return new StudyListLogic({
			treeData: this.treeData,
			state: {
				maxTreeDepth: this.maxTreeDepth,
				searchText: this.searchText,
				selectedCancerTypeIds: this.selectedCancerTypeIds,
				selectedStudyIds: this.selectedCancerStudyIds,
			},
			handleSelectedStudiesChange: selectedStudyIds => this.selectedCancerStudyIds = selectedStudyIds,
		});
	}

	@action selectCancerType(cancerType:CancerType, multiSelect?:boolean)
	{
		let clickedCancerTypeId = cancerType.cancerTypeId;

		if (multiSelect)
		{
			if (_.includes(this.selectedCancerTypeIds, clickedCancerTypeId))
				this.selectedCancerTypeIds = _.difference(this.selectedCancerTypeIds, [clickedCancerTypeId]);
			else
				this.selectedCancerTypeIds = _.union(this.selectedCancerTypeIds, [clickedCancerTypeId]);
		}
		else if (this.clickAgainToDeselectSingle && _.isEqual(toJS(this.selectedCancerTypeIds), [clickedCancerTypeId]))
		{
			this.selectedCancerTypeIds = [];
		}
		else
		{
			this.selectedCancerTypeIds = [clickedCancerTypeId];
		}
	}
}

const queryStore = new QueryStore();
export default queryStore;
