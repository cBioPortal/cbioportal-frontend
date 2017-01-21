import RemoteData from "../../api/RemoteData";
import client from "../../api/cbioportalClientInstance";
import {reaction, toJS, observable} from "../../../../node_modules/mobx/lib/mobx";

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
}

const queryStore = new QueryStore();
export default queryStore;
