import * as _ from 'lodash';
import RemoteData from "../../api/RemoteData";
import client from "../../api/cbioportalClientInstance";
import {reaction, toJS, observable, action, computed, whyRun} from "../../../../node_modules/mobx/lib/mobx";
import {TypeOfCancer as CancerType} from "../../api/CBioPortalAPI";

// mobx observable
export class QueryStore
{
	constructor()
	{
		reaction(
			() => toJS(this.selectedCancerStudyIds),
			studyIds => {
				if (studyIds && studyIds.length == 1)
					this.geneticProfiles.params = {studyId: studyIds[0]};
				else
					this.geneticProfiles.cancel();
			},
			{
				name: 'refreshGeneticProfiles',
				compareStructural: true
			}
		);
	}

	@observable cancerTypes = new RemoteData(client, client.getAllCancerTypesUsingGET, {});
	@observable cancerStudies = new RemoteData(client, client.getAllStudiesUsingGET, {});
	@observable geneticProfiles = new RemoteData(client, client.getAllGeneticProfilesInStudyUsingGET);

	@observable searchText:string = '';
	@observable.shallow searchTextPresets = ['lung', 'serous', 'tcga', 'tcga -provisional'];
	@observable.shallow selectedCancerStudyIds:string[] = [];

	// experimental options
	@observable.shallow selectedCancerTypeIds:string[] = [];
	@observable maxTreeDepth:number = 9;
	@observable clickAgainToDeselectSingle:boolean = true;

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
