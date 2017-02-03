import * as _ from 'lodash';
import client from "../../api/cbioportalClientInstance";
import {toJS, observable, action, computed, whyRun, expr} from "../../../../node_modules/mobx/lib/mobx";
import {TypeOfCancer as CancerType, GeneticProfile, CancerStudy} from "../../api/CBioPortalAPI";
import CancerStudyTreeData from "./CancerStudyTreeData";
import StudyListLogic from "../StudyList/StudyListLogic";
import {remoteData} from "../../api/remoteData";

// mobx observable
export class QueryStore
{
	readonly cancerTypes = remoteData(client.getAllCancerTypesUsingGET({}), []);
	readonly cancerStudies = remoteData(client.getAllStudiesUsingGET({}), []);
	readonly geneticProfiles = remoteData(() => {
		let studyIds = this.selectedStudyIds;
		if (studyIds && studyIds.length == 1)
			return client.getAllGeneticProfilesInStudyUsingGET({studyId: studyIds[0]});
		else
			return Promise.resolve([]);
	}, []);

	@observable searchText:string = '';
	@observable.ref searchTextPresets:ReadonlyArray<string> = ['lung', 'serous', 'tcga', 'tcga -provisional'];
	@observable.ref selectedStudyIds:ReadonlyArray<string> = [];
	@observable.ref selectedProfileIds:ReadonlyArray<string> = [];
	@observable zScoreThreshold:string = '2.0';
	@observable.ref showingSelected:boolean;

	@computed get selectedProfiles()
	{
		let idToProfile = expr(() => _.keyBy(this.geneticProfiles.result, profile => profile.geneticProfileId));
		return this.selectedProfileIds.map(id => idToProfile[id]);
	}

	// experimental options
	@observable.shallow selectedCancerTypeIds:string[] = [];
	@observable maxTreeDepth:number = 9;
	@observable clickAgainToDeselectSingle:boolean = true;

	@computed get treeData()
	{
		return new CancerStudyTreeData({
			cancerTypes: this.cancerTypes.result,
			studies: this.cancerStudies.result
		});
	}

	@computed get studyListLogic()
	{
		// hack - dependencies
		this.treeData;
		this.maxTreeDepth;
		this.searchText;
		this.selectedCancerTypeIds;
		this.selectedStudyIds;
		this.showingSelected;

		return new StudyListLogic(this);
	}

	@computed get selectedStudies()
	{
		return this.selectedStudyIds.map(id => this.treeData.map_studyId_cancerStudy.get(id));
	}

	@computed get totalSelectedSampleCount()
	{
		return this.selectedStudies.reduce((sum:number, study:CancerStudy) => sum + study.allSampleCount, 0);
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
