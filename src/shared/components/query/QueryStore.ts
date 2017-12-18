import * as _ from 'lodash';
import client from "../../api/cbioportalClientInstance";
import {ObservableMap, toJS, observable, reaction, action, computed, whyRun, expr, isObservableMap} from "mobx";
import {
	TypeOfCancer as CancerType, MolecularProfile, CancerStudy, SampleList, Gene,
	Sample, SampleIdentifier, SampleFilter
} from "../../api/generated/CBioPortalAPI";
import {Geneset} from "../../api/generated/CBioPortalAPIInternal";
import CancerStudyTreeData from "./CancerStudyTreeData";
import {remoteData} from "../../api/remoteData";
import {labelMobxPromises, cached, debounceAsync} from "mobxpromise";
import internalClient from "../../api/cbioportalInternalClientInstance";
import oql_parser, {MUTCommand} from "../../lib/oql/oql-parser";
import memoize from "memoize-weak-decorator";
import AppConfig from 'appConfig';
import {gsUploadByGet} from "../../api/gsuploadwindow";
import {OQLQuery} from "../../lib/oql/oql-parser";
import {ComponentGetsStoreContext} from "../../lib/ContextUtils";
import URL from 'url';
import {buildCBioPortalUrl, BuildUrlParams, getHost, openStudySummaryFormSubmit} from "../../api/urls";
import {SyntaxError} from "../../lib/oql/oql-parser";
import StudyListLogic from "./StudyListLogic";
import {QuerySession} from "../../lib/QuerySession";
import {stringListToIndexSet, stringListToSet} from "../../lib/StringUtils";
import chunkMapReduce from "shared/lib/chunkMapReduce";
import {VirtualCohort} from "../../../config/IAppConfig";
import request, {Response} from "superagent";
import formSubmit from "shared/lib/formSubmit";
import {
	MolecularProfileQueryParams, NonMolecularProfileQueryParams, queryUrl,
	nonMolecularProfileParams, currentQueryParams, molecularProfileParams, queryParams
} from "./QueryStoreUtils";
import onMobxPromise from "shared/lib/onMobxPromise";
import VirtualCohorts, {LocalStorageVirtualCohort} from "../../lib/VirtualCohorts";
import getOverlappingStudies from "../../lib/getOverlappingStudies";
import MolecularProfilesInStudyCache from "../../cache/MolecularProfilesInStudyCache";
import {CacheData} from "../../lib/LazyMobXCache";
import { getHierarchyData } from "shared/lib/StoreUtils";

// interface for communicating
export type CancerStudyQueryUrlParams = {
	cancer_study_id: string,
	cancer_study_list?:string,
	genetic_profile_ids_PROFILE_MUTATION_EXTENDED: string,
	genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: string,
	genetic_profile_ids_PROFILE_MRNA_EXPRESSION: string,
	genetic_profile_ids_PROFILE_METHYLATION: string,
	genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: string,
	genetic_profile_ids_PROFILE_GENESET_SCORE: string,
	Z_SCORE_THRESHOLD: string,
	RPPA_SCORE_THRESHOLD: string,
	data_priority: '0'|'1'|'2',
	case_set_id: string,
	case_ids: string,
	gene_list: string,
	geneset_list?: string,
	tab_index: 'tab_download'|'tab_visualize',
	transpose_matrix?: 'on',
	Action: 'Submit',
};

export type GeneReplacement = {alias: string, genes: Gene[]};

export const CUSTOM_CASE_LIST_ID = '-1';
export const ALL_CASES_LIST_ID = 'all';

function isInteger(str:string)
{
	return Number.isInteger(Number(str));
}

export function normalizeQuery(geneQuery:string)
{
	return geneQuery.trim().replace(/^\s+|\s+$/g, '').replace(/[ \+]+/g, ' ').toUpperCase();
}

export type CancerStudyQueryParams = Pick<
	QueryStore,
	'searchText' |
	'selectedStudyIds' |
	'dataTypePriority' |
	'selectedProfileIds' |
	'zScoreThreshold' |
	'rppaScoreThreshold' |
	'selectedSampleListId' |
	'caseIds' |
	'caseIdsMode' |
	'geneQuery' |
	'genesetQuery'
>;
export const QueryParamsKeys:(keyof CancerStudyQueryParams)[] = [
	'searchText',
	'selectedStudyIds',
	'dataTypePriority',
	'selectedProfileIds',
	'zScoreThreshold',
	'rppaScoreThreshold',
	'selectedSampleListId',
	'caseIds',
	'caseIdsMode',
	'geneQuery',
	'genesetQuery',
];

type GenesetId = string;

// mobx observable
export class QueryStore
{
	public initialQueryParams:{
		pathname:string,
		nonMolecularProfileParams:NonMolecularProfileQueryParams,
		molecularProfileIds: ReadonlyArray<string>
	};

	constructor(_window:Window, urlWithInitialParams?:string)
	{
		this.loadSavedVirtualCohorts();

		labelMobxPromises(this);
		if (urlWithInitialParams)
			this.setParamsFromUrl(urlWithInitialParams);

		this.addParamsFromWindow(_window);

		// need to create initialNonMolecularProfileParams using caseIds obtained from page, because
		//	at this point asyncCustomCaseSet may not have resolved, and we dont want to wait for it
		//	to resolve to create the initial query record, because theres a (remote) chance the user
		//	could have modified the custom case set before the promise initially resolved, thus
		//	making it an imperfect record of the initial query. Using this.caseIds instead of
		//	asyncCustomCaseSet is the only failsafe way to make a copy of the initial query state
		let initialNonMolecularProfileParams = nonMolecularProfileParams(this, this.caseIds);

		this.initialQueryParams = {
			nonMolecularProfileParams: initialNonMolecularProfileParams,
			pathname: queryUrl(this, initialNonMolecularProfileParams),
			molecularProfileIds: this._selectedProfileIds || []
		};

		reaction(
			()=>this.allSelectedStudyIds,
			()=>{
				this.studiesHaveChangedSinceInitialization = true;
			}
		);
	}

	@observable studiesHaveChangedSinceInitialization:boolean = false;
	@observable savedVirtualCohorts:VirtualCohort[] = [];

	@action public deleteVirtualCohort(id:string) {
		VirtualCohorts.delete(id);

		this.loadSavedVirtualCohorts();
	}

	@action private loadSavedVirtualCohorts() {
		let localStorageVirtualCohorts:LocalStorageVirtualCohort[] = VirtualCohorts.get();
		this.savedVirtualCohorts = localStorageVirtualCohorts.map((x:any)=>{
			let samples:{studyId:string, sampleId:string}[] = [];
			const constituentStudyIds:string[] = [];
			for (const selectedCasesObj of x.selectedCases) {
				samples = samples.concat(selectedCasesObj.samples.map((sampleId:string)=>({studyId:selectedCasesObj.studyID, sampleId})));
				constituentStudyIds.push(selectedCasesObj.studyID);
			}
			return {
				id: x.virtualCohortID,
				name: x.studyName,
				description: x.description,
				samples,
				constituentStudyIds
			};
		});
	}

	@computed get virtualCohorts():VirtualCohort[] {
		const ret:VirtualCohort[] = [];
		// if (this.temporaryVirtualCohort.result) {
		// 	ret.push(this.temporaryVirtualCohort.result);
		// }
		// for (let i=0; i<this.savedVirtualCohorts.length; i++) {
		// 	ret.push(this.savedVirtualCohorts[i]);
		// }
		return ret;
	}

	@computed get virtualCohortsSet():{[id:string]:VirtualCohort} {
		return this.virtualCohorts.reduce((acc:{[id:string]:VirtualCohort}, next:VirtualCohort)=>{
			acc[next.id] = next;
			return acc;
		}, {});
	}

	@computed get studyIdsInSelection():string[] {
		// Gives selected study ids and study ids that are in selected virtual cohorts
		const virtualCohortsSet = this.virtualCohortsSet;
		const ret:{[id:string]:boolean} = {};
		for (const studyId of this.selectedStudyIds) {
			const vc = virtualCohortsSet[studyId];
			if (vc) {
				for (const constStudyId of vc.constituentStudyIds) {
					ret[constStudyId] = true;
				}
			} else {
				ret[studyId] = true;
			}
		}
		return Object.keys(ret);
	}

	readonly temporaryVirtualCohortId = remoteData({
		await:()=>[this.cancerStudies],
		invoke: async ()=>{
			const knownStudies:{[studyId:string]:boolean} = {};
			for (const study of this.cancerStudies.result) {
				knownStudies[study.studyId] = true;
			}
			for (const study of this.savedVirtualCohorts) {
				knownStudies[study.id] = true;
			}
			const candidates = ((window as any).cohortIdsList as string[]) || [];
			const temporary = candidates.filter(x=>!knownStudies[x]);
			if (temporary.length === 0) {
				return undefined;
			} else {
				return temporary[0];
			}
		}
	});

	readonly temporaryVirtualCohort = remoteData<VirtualCohort|undefined>({
		await: ()=>[this.temporaryVirtualCohortId],
		invoke: async ()=>{
			if (!this.temporaryVirtualCohortId.result) {
				return undefined;
			}
			try {
				const virtualCohortData:Response = await request.get(`${window.location.protocol}//${getHost()}/api-legacy/proxy/session-service/virtual_cohort/${this.temporaryVirtualCohortId.result}`);
				const virtualCohortJSON = JSON.parse(virtualCohortData.text);
				const name:string = virtualCohortJSON.data.studyName as string;
				const description:string = virtualCohortJSON.data.description as string;
				let samples:{sampleId:string, studyId:string}[] = [];
				const constituentStudyIds:string[] = [];
				for (const selectedCasesObj of virtualCohortJSON.data.selectedCases) {
					samples = samples.concat(selectedCasesObj.samples.map((sampleId:string)=>({studyId:selectedCasesObj.studyID, sampleId})));
					constituentStudyIds.push(selectedCasesObj.studyID);
				}
				return {
					id: this.temporaryVirtualCohortId.result,
					name,
					description,
					samples,
					constituentStudyIds
				};
			} catch (e) {
				// In case anything related to fetching this data fails
				return undefined;
			}
		},
		onResult:(vc?:VirtualCohort)=>{
			if (vc) {
				this.selectedSampleListId = CUSTOM_CASE_LIST_ID;
				this.caseIdsMode = "sample";
				this.caseIds = vc.samples.map(sample=>`${sample.studyId}:${sample.sampleId}`).join("\n");
			}
		}
	});

	copyFrom(other:CancerStudyQueryParams)
	{
		// download tab does not appear anywhere except home page
		this.forDownloadTab = false;

		for (let key of QueryParamsKeys)
			this[key] = other[key];
	}

	@computed get stateToSerialize()
	{
		return _.pick(this, QueryParamsKeys);
	}

	////////////////////////////////////////////////////////////////////////////////
	// QUERY PARAMETERS
	////////////////////////////////////////////////////////////////////////////////

	@observable forDownloadTab:boolean = false;

	@observable transposeDataMatrix = false;

	@observable searchText:string = '';

	@observable private _selectedStudyIds:ObservableMap<boolean> = observable.map<boolean>();

	@computed get allSelectedStudyIds():string[] {
		return this._selectedStudyIds.keys();
	}

	@computed get selectedStudyIds():string[]
	{
		let ids:string[] = this._selectedStudyIds.keys();
		const selectableStudies = this.selectableStudiesSet;
		ids = ids.filter(id=>!!selectableStudies[id]);
		return this.forDownloadTab ? ids.slice(-1) : ids;
	}

	set selectedStudyIds(val:string[]) {
		this._selectedStudyIds = observable.map(stringListToSet(val));
	}

	@action public setStudyIdSelected(studyId:string, selected:boolean) {
		if (this.forDownloadTab) {
			// only one can be selected at a time
			let newMap:{[studyId:string]:boolean} = {};
			if (selected) {
				newMap[studyId] = selected;
			}
			this._selectedStudyIds = observable.map(newMap);
		} else {
			if (selected) {
				this._selectedStudyIds.set(studyId, true);
			} else {
				this._selectedStudyIds.delete(studyId);
			}
		}
	}
	private isStudyIdSelected(studyId:string):boolean {
		return !!this._selectedStudyIds.get(studyId);
	}

	@observable dataTypePriority = {mutation: true, cna: true};

	// molecular profile ids
	@observable.ref private _selectedProfileIds?:ReadonlyArray<string> = undefined; // user selection
	@computed get selectedProfileIds():ReadonlyArray<string>
	{
		let selectedIds;

		if (this._selectedProfileIds !== undefined)
		{
			selectedIds = this._selectedProfileIds;
		}
		else
		{
			// compute default selection
			const altTypes:MolecularProfile['molecularAlterationType'][] = [
				'MUTATION_EXTENDED',
				'COPY_NUMBER_ALTERATION',
			];
			selectedIds = [];
			for (let altType of altTypes)
			{
				let profiles = this.getFilteredProfiles(altType);
				if (profiles.length)
					selectedIds.push(profiles[0].molecularProfileId);
			}
		}

		// download tab only allows one selected profile
		if (this.forDownloadTab)
			return selectedIds.slice(0, 1);

		// query tab only allows selecting profiles with showProfileInAnalysisTab=true
		return selectedIds.filter(id => {
			let profile = this.dict_molecularProfileId_molecularProfile[id];
			return profile && profile.showProfileInAnalysisTab;
		});
	}
	set selectedProfileIds(value)
	{
		this._selectedProfileIds = value;
	}

	@observable zScoreThreshold:string = '2.0';

	@observable rppaScoreThreshold:string = '2.0';

	// sample list id
	@observable private _selectedSampleListId?:string = undefined; // user selection
	@computed get selectedSampleListId()
	{
		if (this._selectedSampleListId !== undefined)
			return this._selectedSampleListId;
		return this.defaultSelectedSampleListId;
	}
	set selectedSampleListId(value)
	{
		this._selectedSampleListId = value;
	}

	@observable caseIds = '';

	@observable _caseIdsMode:'sample'|'patient' = 'sample';
	@computed get caseIdsMode()
	{
		return this.selectedSampleListId === CUSTOM_CASE_LIST_ID ? this._caseIdsMode : 'sample';
	}
	set caseIdsMode(value)
	{
		this._caseIdsMode = value;
	}

	@observable _geneQuery = '';
	get geneQuery()
	{
		return this._geneQuery;
	}
	set geneQuery(value:string)
	{
		// clear error when gene query is modified
		this.geneQueryErrorDisplayStatus = 'unfocused';
		this._geneQuery = value;
	}
	
	@observable _genesetQuery = '';
    get genesetQuery()
    {
        return this._genesetQuery.toUpperCase();
    }
    set genesetQuery(value:string)
    {
        // clear error when gene query is modified
        this.genesetQueryErrorDisplayStatus = 'unfocused';
        this._genesetQuery = value;
    }

	////////////////////////////////////////////////////////////////////////////////
	// VISUAL OPTIONS
	////////////////////////////////////////////////////////////////////////////////

	@observable geneQueryErrorDisplayStatus:'unfocused'|'shouldFocus'|'focused' = 'unfocused';
    @observable genesetQueryErrorDisplayStatus: 'unfocused'|'shouldFocus'|'focused' = 'unfocused';
	@observable showMutSigPopup = false;
	@observable showGisticPopup = false;
	@observable showGenesetsHierarchyPopup = false;
	@observable showGenesetsVolcanoPopup = false;
	@observable.ref searchTextPresets:ReadonlyArray<string> = AppConfig.skinExampleStudyQueries;
	@observable priorityStudies = AppConfig.priorityStudies;
	@observable showSelectedStudiesOnly:boolean = false;
	@observable.shallow selectedCancerTypeIds:string[] = [];
	@observable clickAgainToDeselectSingle:boolean = true;
	@observable searchExampleMessage = "";
	@observable volcanoPlotSelectedPercentile: {label: string, value: string} = {label: '75%', value: '75'};
	

	@observable private _maxTreeDepth:number = AppConfig.maxTreeDepth;
	@computed get maxTreeDepth()
	{
		return (this.forDownloadTab && this._maxTreeDepth > 0) ? 1 : this._maxTreeDepth;
	}
	set maxTreeDepth(value)
	{
		this._maxTreeDepth = value;
	}


	////////////////////////////////////////////////////////////////////////////////
	// REMOTE DATA
	////////////////////////////////////////////////////////////////////////////////

	readonly cancerTypes = remoteData({
		invoke: async () => {
			return client.getAllCancerTypesUsingGET({}).then((data)=>{
				// all types should have parent. this is a correction for a data issue
				// where there IS a top level (parent=null) item
				return data.filter(cancerType => {
					return cancerType.parent !== 'null';
				});
			});
		}
	}, []);

	readonly cancerStudies = remoteData(client.getAllStudiesUsingGET({}), []);
	readonly cancerStudyIdsSet = remoteData<{[studyId:string]:boolean}>({
		await: ()=>[this.cancerStudies],
		invoke: async ()=>{
			return stringListToSet(this.cancerStudies.result.map(x=>x.studyId));
		},
		default: {},
	});

	@computed get selectableStudiesSet():{[studyId:string]:boolean} {
		const ret = Object.assign({}, this.cancerStudyIdsSet.result);
		for (const cohort of this.virtualCohorts) {
			ret[cohort.id] = true;
		}
		return ret;
	}

	readonly molecularProfiles = remoteData<MolecularProfile[]>({
		invoke: async () => {
			if (!this.singleSelectedStudyId)
				return [];
			return await client.getAllMolecularProfilesInStudyUsingGET({
				studyId: this.singleSelectedStudyId
			});
		},
		default: [],
		onResult: () => {
			if (!this.initiallySelected.profileIds || this.studiesHaveChangedSinceInitialization) {
				this._selectedProfileIds = undefined;
			}
		}
	});

	readonly molecularProfilesInSelectedStudies = remoteData<MolecularProfile[]>({
		invoke: async()=>{
			const profiles:CacheData<MolecularProfile[], string>[] =
				await this.molecularProfilesInStudyCache.getPromise(this.selectedStudyIds, true);
			return _.flatten(profiles.map(d=>(d.data ? d.data : [])));
		}
	});

	readonly sampleLists = remoteData({
		invoke: async () => {
			if (!this.isSingleNonVirtualStudySelected) {
				return [];
			}
			let sampleLists = await client.getAllSampleListsInStudyUsingGET({
				studyId: this.selectedStudyIds[0],
				projection: 'DETAILED'
			});
			return _.sortBy(sampleLists, sampleList => sampleList.name);
		},
		default: [],
		onResult: () => {
			if (!this.initiallySelected.sampleListId || this.studiesHaveChangedSinceInitialization) {
				this._selectedSampleListId = undefined;
			}
		}
	});

	readonly mutSigForSingleStudy = remoteData({
		invoke: async () => {
			if (!this.isSingleNonVirtualStudySelected) {
				return [];
			}
			return await internalClient.getSignificantlyMutatedGenesUsingGET({
				studyId: this.selectedStudyIds[0]
			});
		},
		default: []
	});

	readonly gisticForSingleStudy = remoteData({
		invoke: async () => {
			if (!this.isSingleNonVirtualStudySelected) {
				return [];
			}
			return await internalClient.getSignificantCopyNumberRegionsUsingGET({
				studyId: this.selectedStudyIds[0]
			});
		},
		default: []
	});

	readonly genes = remoteData({
		invoke: () => this.invokeGenesLater(this.geneIds),
		default: {found: [], suggestions: []}
	});
	
	readonly genesets = remoteData({
	    invoke: () => this.invokeGenesetsLater(this.genesetIds),
	    default: {found: [], invalid: []}
	});
	
	private invokeGenesLater = debounceAsync(
		async (geneIds:string[]):Promise<{found: Gene[], suggestions: GeneReplacement[]}> =>
		{
			let [entrezIds, hugoIds] = _.partition(_.uniq(geneIds), isInteger);

			let getEntrezResults = async () => {
				let found:Gene[];
				if (entrezIds.length)
					found = await client.fetchGenesUsingPOST({geneIdType: "ENTREZ_GENE_ID", geneIds: entrezIds});
				else
					found = [];
				let missingIds = _.difference(entrezIds, found.map(gene => gene.entrezGeneId + ''));
				let removals = missingIds.map(entrezId => ({alias: entrezId, genes: []}));
				let replacements = found.map(gene => ({alias: gene.entrezGeneId + '', genes: [gene]}));
				let suggestions = [...removals, ...replacements];
				return {found, suggestions};
			};

			let getHugoResults = async () => {
				let found:Gene[];
				if (hugoIds.length)
					found = await client.fetchGenesUsingPOST({geneIdType: "HUGO_GENE_SYMBOL", geneIds: hugoIds});
				else
					found = [];
				let missingIds = _.difference(hugoIds, found.map(gene => gene.hugoGeneSymbol));
				let suggestions = await Promise.all(missingIds.map(alias => this.getGeneSuggestions(alias)));
				return {found, suggestions};
			};

			let [entrezResults, hugoResults] = await Promise.all([getEntrezResults(), getHugoResults()]);
			return {
				found: [...entrezResults.found, ...hugoResults.found],
				suggestions: [...entrezResults.suggestions, ...hugoResults.suggestions]
			};
		},
		500
	);
	
	private invokeGenesetsLater = debounceAsync(
			async (genesetIds:string[]):Promise<{found: Geneset[], invalid: string[]}> =>
			{
				if (genesetIds.length > 0) {
					const found = await internalClient.fetchGenesetsUsingPOST({genesetIds: genesetIds});
					const invalid = _.difference(genesetIds, found.map(geneset => geneset.genesetId));
					return {found, invalid};
				} else {
					return Promise.resolve({found:[], invalid:[]});
				}
			},
			500
	);

	@memoize
	async getGeneSuggestions(alias:string):Promise<GeneReplacement>
	{
		return {
			alias,
			genes: await client.getAllGenesUsingGET({alias})
		};
	}

	@memoize
	getSamplesForStudyAndPatient(studyId:string, patientId:string)
	{
		return client.getAllSamplesOfPatientInStudyUsingGET({studyId, patientId})
			.then(
				samples => ({studyId, patientId, samples, error: undefined}),
				error => ({studyId, patientId, samples: [] as Sample[], error})
			);
	}

	readonly asyncCustomCaseSetUrlParam = remoteData({
		await: ()=>[this.asyncCustomCaseSet],
		invoke: async ()=>{
			return this.asyncCustomCaseSet.result.map(x=>`${x.studyId}\t${x.sampleId}`).join('\r\n');
		},
		default: ''
	});

	readonly asyncCustomCaseSet = remoteData<{sampleId:string, studyId:string}[]>({
		invoke: async () => {
			if (this.selectedSampleListId !== CUSTOM_CASE_LIST_ID || (this.caseIds.trim().length === 0))
				return [];
			return this.invokeCustomCaseSetLater({
				singleSelectedStudyId: this.singleSelectedStudyId,
				isVirtualCohortSelected: this.isVirtualCohortSelected,
				caseIds: this.caseIds,
				caseIdsMode: this.caseIdsMode,
			})
		},
		default: []
	});

	private invokeCustomCaseSetLater = debounceAsync(
		async (params:Pick<this, 'singleSelectedStudyId' | 'isVirtualCohortSelected' | 'caseIds' | 'caseIdsMode'>) => {
			let singleSelectedStudyId = '';
			if (this.isSingleNonVirtualStudySelected) {
				singleSelectedStudyId = this.selectedStudyIds[0];
			}
			let entities = params.caseIds.trim().split(/\s+/g);
			const studyIdsInSelectionSet = stringListToSet(this.studyIdsInSelection);
			const cases:{id:string, study:string}[] = entities.map(entity=>{
				let splitEntity = entity.split(':');
				if (splitEntity.length === 1) {
					// no study specified
					if (singleSelectedStudyId) {
						// if only one study selected, fill it in
						return {
							id: entity,
							study: singleSelectedStudyId
						};
					} else {
						// otherwise, throw error
						throw new Error(`No study specified for ${this.caseIdsMode} id: ${entity}, and more than one study selected for query.`);
					}
				} else if (splitEntity.length === 2) {
					const study = splitEntity[0];
					const id = splitEntity[1];
					if (!studyIdsInSelectionSet[study]) {
						let virtualCohortMessagePart = '';
						if (this.isVirtualCohortSelected) {
							virtualCohortMessagePart = ', nor part of a selected Saved Cohort';
						}
						throw new Error(`Study ${study} is not selected${virtualCohortMessagePart}.`);
					}
					return {
						id,
						study
					};
				} else {
					throw new Error(`Input error for entity: ${entity}.`);
				}
			});
			const caseOrder = stringListToIndexSet(cases.map(x=>`${x.study}:${x.id}`));
			let retSamples:{sampleId:string, studyId:string}[] = [];
			const validIds:{[studyColonId:string]:boolean} = {};
			let invalidIds:{id:string, study:string}[] = [];
			if (params.caseIdsMode === 'sample')
			{
				const sampleIdentifiers = cases.map(c => ({studyId: c.study, sampleId: c.id}));
				if (sampleIdentifiers.length)
				{
					let sampleObjs = await chunkMapReduce(sampleIdentifiers, chunk=>client.fetchSamplesUsingPOST({
						sampleFilter: {
							sampleIdentifiers:chunk
						} as SampleFilter,
						projection: "SUMMARY"
					}), 990);
					// sort by input order
					sampleObjs = _.sortBy(sampleObjs, sampleObj=>caseOrder[`${sampleObj.studyId}:${sampleObj.sampleId}`]);

					for (const sample of sampleObjs) {
						retSamples.push({studyId: sample.studyId, sampleId: sample.sampleId});
						validIds[`${sample.studyId}:${sample.sampleId}`] = true;
					}
				}
			}
			else
			{
				// convert patient IDs to sample IDs
				const samplesPromises = cases.map(c => this.getSamplesForStudyAndPatient(c.study, c.id));
				let result:{studyId:string, patientId:string, samples:Sample[], error?:Error}[] = await Promise.all(samplesPromises);
				// sort by input order
				result = _.sortBy(result, obj=>caseOrder[`${obj.studyId}:${obj.patientId}`]);

				for (const {studyId, patientId, samples, error} of result)
				{
					if (!error && samples.length) {
						retSamples = retSamples.concat(samples.map(sample=>{
							validIds[`${sample.studyId}:${sample.patientId}`] = true;
							return {
								studyId:sample.studyId,
								sampleId:sample.sampleId
							};
						}));
					}
				}
			}

			invalidIds = invalidIds.concat(cases.filter(x=>(!validIds[`${x.study}:${x.id}`])));

			if (invalidIds.length) {
				if (this.isSingleNonVirtualStudySelected) {
					throw new Error(
						`Invalid ${
							params.caseIdsMode
						}${
							invalidIds.length > 1 ? 's' : ''
						} for the selected cancer study: ${
							invalidIds.map(x=>x.id).join(', ')
						}`
					);
				} else {
					throw new Error(
						`Invalid (study, ${
							params.caseIdsMode
						}) pair${
						invalidIds.length > 1 ? 's' : ''
						}: ${invalidIds.map(x=>`(${x.study}, ${x.id})`).join(', ')}
						`
					);
				}
			}

			return retSamples;
		},
		500
	);


	////////////////////////////////////////////////////////////////////////////////
	// DERIVED DATA
	////////////////////////////////////////////////////////////////////////////////

	// CANCER STUDY

	@cached get treeData()
	{
		return new CancerStudyTreeData({
			cancerTypes: this.cancerTypes.result,
			studies: this.cancerStudies.result,
			priorityStudies: this.priorityStudies,
			virtualCohorts: this.virtualCohorts
		});
	}

	readonly studyListLogic = new StudyListLogic(this);

	@computed get selectedCancerTypes()
	{
		return this.selectedCancerTypeIds.map(id => this.treeData.map_cancerTypeId_cancerType.get(id) as CancerType).filter(_.identity);
	}

	@computed get singleSelectedStudyId()
	{
		return this.selectedStudyIds.length == 1 ? this.selectedStudyIds[0] : undefined;
	}

	@computed get selectedStudies()
	{
		return this.selectedStudyIds.map(id => this.treeData.map_studyId_cancerStudy.get(id) as CancerStudy).filter(_.identity);
	}

	@computed get unknownStudyIds()
	{
		let ids:string[] = this._selectedStudyIds.keys();
		const selectableStudies = this.selectableStudiesSet;
		ids = ids.filter(id=>!(id in selectableStudies));
		return ids;
	}

	@computed get selectedStudies_totalSampleCount()
	{
		return this.selectedStudies.reduce((sum:number, study:CancerStudy) => sum + study.allSampleCount, 0);
	}

	public isVirtualCohort(studyId:string):boolean {
		// if the study id doesn't correspond to one in this.cancerStudies, then its a virtual cohort
		return !this.cancerStudyIdsSet.result[studyId];
	}

	public isTemporaryVirtualCohort(studyId:string):boolean {
		return this.temporaryVirtualCohortId.isComplete && this.temporaryVirtualCohortId.result === studyId;
	}

	private isSingleStudySelected(shouldBeVirtualCohort:boolean) {
		if (this.selectedStudyIds.length !== 1) {
			return false;
		}
		const selectedStudyId = this.selectedStudyIds[0];
		return (this.isVirtualCohort(selectedStudyId) === shouldBeVirtualCohort);
	}

	@computed public get isSingleVirtualCohortSelected() {
		return this.isSingleStudySelected(true);
	}

	@computed public get isSingleNonVirtualStudySelected() {
		return this.isSingleStudySelected(false);
	}

	@computed public get getOverlappingStudiesMap() {
		const overlappingStudyGroups = getOverlappingStudies(this.selectedStudies);
		return _.chain(overlappingStudyGroups)
			.flatten()
			.keyBy((study:CancerStudy)=>study.studyId)
			.value();
	}

	@computed public get isVirtualCohortSelected() {
		let ret = false;
		const virtualCohorts = this.virtualCohortsSet;
		for (const studyId of this.selectedStudyIds) {
			if (virtualCohorts[studyId]) {
				ret = true;
				break;
			}
		}
		return ret;
	}

	@computed public get isVirtualCohortQuery() {
		if (this.selectedStudyIds.length === 0) {
			return false;
		} else if (this.selectedStudyIds.length > 1) {
			return true;
		} else {
			return this.isSingleVirtualCohortSelected;
		}
	}

	// DATA TYPE PRIORITY

	private calculateDataTypePriorityCode(dataTypePriority:{mutation: boolean, cna: boolean}): '0'|'1'|'2'
	{
		let {mutation, cna} = dataTypePriority;
		if (mutation && cna)
			return '0';
		if (mutation)
			return '1';
		if (cna)
			return '2';

		return '0';
	}

	set dataTypePriorityCode(code:'0'|'1'|'2')
	{
		switch (code)
		{
			default:
			case '0':
				this.dataTypePriority = {mutation: true, cna: true};
				break;
			case '1':
				this.dataTypePriority = {mutation: true, cna: false};
				break;
			case '2':
				this.dataTypePriority = {mutation: false, cna: true};
				break;
		}
	}

	@computed get dataTypePriorityCode(): '0'|'1'|'2'
	{
		return this.calculateDataTypePriorityCode(this.dataTypePriority);
	}

	// MOLECULAR PROFILE

	@computed get dict_molecularProfileId_molecularProfile():_.Dictionary<MolecularProfile | undefined>
	{
		return _.keyBy(this.molecularProfiles.result, profile => profile.molecularProfileId);
	}

	getFilteredProfiles(molecularAlterationType:MolecularProfile['molecularAlterationType'])
	{
		return this.molecularProfiles.result.filter(profile => {
			if (profile.molecularAlterationType != molecularAlterationType)
				return false;

			return profile.showProfileInAnalysisTab || this.forDownloadTab;
		});
	}

	isProfileSelected(molecularProfileId:string)
	{
		return _.includes(this.selectedProfileIds, molecularProfileId);
	}

	getSelectedProfileIdFromMolecularAlterationType(molecularAlterationType:MolecularProfile['molecularAlterationType'], selectedProfileIds?: ReadonlyArray<string>):string
	{
		for (let profileId of (selectedProfileIds || this.selectedProfileIds))
		{
			let profile = this.dict_molecularProfileId_molecularProfile[profileId];
			if (profile && profile.molecularAlterationType === molecularAlterationType)
				return profile.molecularProfileId;
		}
		return '';
	}
	
	get isGenesetProfileSelected() 
	{
        let result = false;
        if (this.getFilteredProfiles("GENESET_SCORE")[0]) {
            for (const selectedProfileId in this.selectedProfileIds) {
                if (this.selectedProfileIds[selectedProfileId] === this.getFilteredProfiles("GENESET_SCORE")[0].molecularProfileId) {
                    result = true;
                }
            }
        }
        return result;
    }

	// SAMPLE LIST

	@computed get defaultSelectedSampleListId()
	{
		if (this.isVirtualCohortQuery) {
			return ALL_CASES_LIST_ID;
		}

		let studyId = this.singleSelectedStudyId;
		if (!studyId)
			return undefined;

		let mutSelect = this.getSelectedProfileIdFromMolecularAlterationType('MUTATION_EXTENDED');
		let cnaSelect = this.getSelectedProfileIdFromMolecularAlterationType('COPY_NUMBER_ALTERATION');
		let expSelect = this.getSelectedProfileIdFromMolecularAlterationType('MRNA_EXPRESSION');
		let rppaSelect = this.getSelectedProfileIdFromMolecularAlterationType('PROTEIN_LEVEL');
		let sampleListId = studyId + "_all";

		if (mutSelect && cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_cnaseq";
		else if (mutSelect && !cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_sequenced";
		else if (!mutSelect && cnaSelect && !expSelect && !rppaSelect)
			sampleListId = studyId + "_acgh";
		else if (!mutSelect && !cnaSelect && expSelect && !rppaSelect)
		{
			if (this.isProfileSelected(studyId + '_mrna_median_Zscores'))
				sampleListId = studyId + "_mrna";
			else if (this.isProfileSelected(studyId + '_rna_seq_mrna_median_Zscores'))
				sampleListId = studyId + "_rna_seq_mrna";
			else if (this.isProfileSelected(studyId + '_rna_seq_v2_mrna_median_Zscores'))
				sampleListId = studyId + "_rna_seq_v2_mrna";
		}
		else if ((mutSelect || cnaSelect) && expSelect && !rppaSelect)
			sampleListId = studyId + "_3way_complete";
		else if (!mutSelect && !cnaSelect && !expSelect && rppaSelect)
			sampleListId = studyId + "_rppa";

		// BEGIN HACK if not found
		if (!this.dict_sampleListId_sampleList[sampleListId])
		{
			if (sampleListId === studyId + '_cnaseq')
				sampleListId = studyId + '_cna_seq';
			else if (sampleListId === studyId + "_3way_complete")
				sampleListId = studyId + "_complete";
		}
		// END HACK

		// if still not found
		if (!this.dict_sampleListId_sampleList[sampleListId])
			sampleListId = studyId + '_all';

		return sampleListId;
	}

	@computed get dict_sampleListId_sampleList():_.Dictionary<SampleList | undefined>
	{
		return _.keyBy(this.sampleLists.result, sampleList => sampleList.sampleListId);
	}

	// GENES

	@computed get oql():{ query: OQLQuery, error?: { start: number, end: number, message: string } }
	{
		try
		{
			return {
				query: this.geneQuery && oql_parser.parse(this.geneQuery.trim().toUpperCase()) || [],
				error: undefined
			};
		}
		catch (error)
		{
			if (error.name !== 'SyntaxError')
				return {
					query: [],
					error: {start: 0, end: 0, message: `Unexpected ${error}`}
				};

			let {offset} = error as SyntaxError;
			let near, start, end;
			if (offset === this.geneQuery.length)
				[near, start, end] = ['after', offset - 1, offset];
			else if (offset === 0)
				[near, start, end] = ['before', offset, offset + 1];
			else
				[near, start, end] = ['at', offset, offset + 1];
			let message = `OQL syntax error ${near} selected character; please fix and submit again.`;
			return {
				query: [],
				error: {start, end, message}
			};
		}
	}

	@computed get geneIds():string[]
	{
		try
		{
			return this.oql.query.map(line => line.gene).filter(gene => gene && gene !== 'DATATYPES');
		}
		catch (e)
		{
			return [];
		}
	}
	
	// GENE SETS
	@computed get genesetIdsQuery():{ query: GenesetId[], error?: { start: number, end: number, message: string } }
    {
        try
        {
            const queriedGenesets: GenesetId[] = this.genesetQuery ? this.genesetQuery.split(/[ \n]+/) : [];
            return {
                query: queriedGenesets,
                error: undefined
            };
        }
        catch (error)
        {
            if (error.name !== 'SyntaxError')
                return {
                    query: [],
                    error: {start: 0, end: 0, message: `Unexpected ${error}`}
                };

            let {offset} = error as SyntaxError;
            let near, start, end;
            if (offset === this.geneQuery.length)
                [near, start, end] = ['after', offset - 1, offset];
            else if (offset === 0)
                [near, start, end] = ['before', offset, offset + 1];
            else
                [near, start, end] = ['at', offset, offset + 1];
            const message = `OQL syntax error ${near} selected character; please fix and submit again.`;
            return {
                query: [],
                error: {start, end, message}
            };
        }
    }
    
    @computed get genesetIds():GenesetId[]
    {
        return this.genesetIdsQuery.query;
    }
    
    readonly volcanoPlotTableData = remoteData<Geneset[]>({
        invoke: async()=>{
            const tableData: Geneset[] = [];
            const hierarchyData = await getHierarchyData(
                    this.getFilteredProfiles("GENESET_SCORE")[0].molecularProfileId, 
                    Number(this.volcanoPlotSelectedPercentile.value),
                    0, 1, this.defaultSelectedSampleListId);
            for (const node of hierarchyData) {
                if (_.has(node, 'genesets')) {
                    for (const geneset of node.genesets) {
                        tableData.push({
                            genesetId: geneset.genesetId,
                            name: geneset.genesetId,
                            description : geneset.description,
                            representativeScore : geneset.representativeScore,
                            representativePvalue : geneset.representativePvalue,
                            refLink : geneset.refLink,
                        });
                    }
                }
            }
            return tableData;
        }
    });
    
    @computed get maxYVolcanoPlot(): number|undefined
    {
        if (this.volcanoPlotTableData.result) {
            let genesetWithMaxY = _.maxBy(this.volcanoPlotTableData.result!);
            return genesetWithMaxY!.representativePvalue;
        } else {
            return undefined;
            //throw new Error("Function called before volcanoPlotTableData was called.");
        }
    }
    
    @observable map_genesets_selected_volcano = new ObservableMap<boolean>();
    
    @computed get volcanoPlotGraphData(): {x: number, y: number, fill: string}[]|undefined
    {
        let graphData: {x: number, y: number, fill: string}[]|undefined = undefined;
        if (this.volcanoPlotTableData.result) {
            const tableData = this.volcanoPlotTableData.result!;
            graphData = tableData.map(({representativeScore, representativePvalue, name}) => {
                    const xValue = representativeScore;
                    const yValue = -(Math.log(representativePvalue)/Math.log(10));
                    const fillColor = this.map_genesets_selected_volcano.get(name) ? "tomato" : "3786C2";
                    return {x: xValue, y: yValue, fill: fillColor};
            });
        } else {
            return undefined;
            //throw new Error("Function called before volcanoPlotTableData was called.");
        }
        return graphData;
    }

	// SUBMIT

	@computed get submitEnabled()
	{
		return (
			!this.submitError &&
			(this.genes.isComplete || this.genesets.isComplete) &&
			this.asyncUrlParams.isComplete
		) || (!!this.oql.error || !!this.genesetIdsQuery.error); // to make "Please click 'Submit' to see location of error." possible
	}

	@computed get summaryEnabled() {
		return this.selectedStudyIds.length > 0;
	}

	@computed get oqlMessages():string[] {
		let unrecognizedMutations = _.flatten(this.oql.query.map(result => {
			return (result.alterations || []).filter(alt => (alt.alteration_type === 'mut' && (alt.info as any).unrecognized)) as MUTCommand<any>[];
		}));
		return unrecognizedMutations.map(mutCommand=>{
			return `Unrecognized input "${(mutCommand as any).constr_val}" is interpreted as a mutation code.`;
		});
	}

	@computed get submitError()
	{
		let haveExpInQuery = this.oql.query.some(result => {
			return (result.alterations || []).some(alt => alt.alteration_type === 'exp');
		});

		const haveProtInQuery = this.oql.query.some(result => {
			return (result.alterations || []).some(alt => alt.alteration_type === 'prot');
		});

		if (!this.selectedStudyIds.length)
			return "Please select one or more cancer studies.";

		if (this.isSingleNonVirtualStudySelected)
		{
			if (!this.selectedProfileIds.length)
				return "Please select one or more molecular profiles.";

			let expProfileSelected = this.getSelectedProfileIdFromMolecularAlterationType('MRNA_EXPRESSION');
			if (haveExpInQuery && !expProfileSelected)
				return "Expression specified in the list of genes, but not selected in the Molecular Profile Checkboxes.";

		}
		if (this.selectedStudyIds.length && this.selectedSampleListId === CUSTOM_CASE_LIST_ID)
		{
			if (this.asyncCustomCaseSet.isComplete && !this.asyncCustomCaseSet.result.length)
				return "Please enter at least one ID in your custom case set.";
			if (this.asyncCustomCaseSet.error)
				return "Error in custom case set.";
		}
		else if (haveExpInQuery && this.selectedStudyIds.length > 1)
		{
			return "Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.";
		}
		else if (haveProtInQuery && this.selectedStudyIds.length > 1)
		{
			return "Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.";
		}

		if (this.selectedProfileIds.length !== 0) {
		    if (this.selectedProfileIds.length === 1) 
            {
	            if (this.isGenesetProfileSelected)
                { //Only geneset profile selected
                    if (!this.genesetQuery.length) 
                    {
                        return "Please enter one or more gene sets or deselect gene set profiles.";
                    }
                    if (this.oql.query.length)
                    {
                        return "Please select genetic profiles or remove the genes from the query.";
                    }
                }
                else
                { 
                    if (!this.oql.query.length) 
                    {
                        return "Please enter one or more gene symbols.";
                    }
                }
            }
	        else
	        {
                //Geneset and other genetic profiles selected
	            if (this.isGenesetProfileSelected)
	            {
	                if (!this.genesetQuery.length && !this.oql.query.length)
	                {
	                    return "Please enter one or more gene symbols and gene sets.";
	                }
	                else if (!this.oql.query.length && this.genesetQuery.length)
	                {
	                    return "Please enter one or more gene symbols or deselect genetic profiles.";
	                }
	                else if (!this.genesetQuery.length && this.oql.query.length) {
	                    return "Please enter one or more gene sets or deselect gene set profiles.";
	                }
	            }
	            else if (!this.oql.query.length)
	            {
	                return "Please enter one or more gene symbols.";
	            }
            }
        } else {
			if (!this.oql.query.length) {
				return "Please enter one or more gene symbols.";
			}
		}
		
		

		if (this.genes.result.suggestions.length)
			return "Please edit the gene symbols.";
	}

	private readonly dict_molecularAlterationType_filenameSuffix:{[K in MolecularProfile['molecularAlterationType']]?: string} = {
		"MUTATION_EXTENDED": 'mutations',
		"COPY_NUMBER_ALTERATION": 'cna',
		"MRNA_EXPRESSION": 'mrna',
		"METHYLATION": 'methylation',
		"METHYLATION_BINARY": 'methylation',
		"PROTEIN_LEVEL": 'rppa',
	};

	@computed get downloadDataFilename()
	{
		let study = this.singleSelectedStudyId && this.treeData.map_studyId_cancerStudy.get(this.singleSelectedStudyId);
		let profile = this.dict_molecularProfileId_molecularProfile[this.selectedProfileIds[0] as string];

		if (!this.forDownloadTab || !study || !profile)
			return 'cbioportal-data.txt';

		let suffix = this.dict_molecularAlterationType_filenameSuffix[profile.molecularAlterationType] || profile.molecularAlterationType.toLowerCase();
		return `cbioportal-${study.studyId}-${suffix}.txt`;
	}

	readonly asyncUrlParams = remoteData({
		await: () => [this.asyncCustomCaseSet],
		invoke: async () => currentQueryParams(this)
	});

	////////////////////////////////////////////////////////////////////////////////
	// ACTIONS
	////////////////////////////////////////////////////////////////////////////////

	/**
	 * This is used to prevent selections from being cleared automatically when new data is downloaded.
	 */
	private readonly initiallySelected = {
		profileIds: false,
		sampleListId: false
	};

	@action addParamsFromWindow(_window:Window)
	{
		if ((_window as any).serverVars) {
			// Populate OQL
			this.geneQuery = normalizeQuery((_window as any).serverVars.theQuery);
			this.genesetQuery = normalizeQuery((_window as any).serverVars.genesetIds);
			const dataPriority = (_window as any).serverVars.dataPriority;
			if (typeof dataPriority !== "undefined") {
				this.dataTypePriorityCode = (dataPriority + '') as '0'|'1'|'2';
			}

            const selectedMolecularProfiles = (_window as any).serverVars.molecularProfiles;
            if (selectedMolecularProfiles !== undefined) {
                this.selectedProfileIds = selectedMolecularProfiles;
            }

            const zScoreThreshold =  (_window as any).serverVars.zScoreThreshold;
            if (zScoreThreshold !== undefined) {
                this.zScoreThreshold = zScoreThreshold;
            }

			const rppaScoreThreshold =  (_window as any).serverVars.rppaScoreThreshold;
			if (rppaScoreThreshold !== undefined) {
				this.rppaScoreThreshold = rppaScoreThreshold;
			}

			const caseSetId =  (_window as any).serverVars.caseSetProperties.case_set_id;
			if (caseSetId !== undefined) {
				this.selectedSampleListId = caseSetId;
				this.initiallySelected.sampleListId = true;
			}

			const studySampleMap = (_window as any).serverVars.studySampleObj;
			if (studySampleMap) {
				if (caseSetId === CUSTOM_CASE_LIST_ID) {
					this.caseIdsMode = 'sample';
					this.caseIds = _.flatten<string>(Object.keys(studySampleMap).map(studyId=>{
						return studySampleMap[studyId].map((sampleId:string)=>`${studyId}:${sampleId}`);
					})).join("\n");
				}
			}
		}

		// Select studies from _window
		const windowStudyId = (_window as any).selectedCancerStudyId;
		if (windowStudyId) {
			this.setStudyIdSelected(windowStudyId, true);
		}

		const cohortIdsList:string[] = ((_window as any).cohortIdsList as string[]) || [];
		for (const studyId of cohortIdsList) {
			if (studyId !== "null") {
				this.setStudyIdSelected(studyId, true);
			}
		}

		const windowSampleIds:string = (_window as any).selectedSampleIds;
		if (windowSampleIds) {
			this.selectedSampleListId = CUSTOM_CASE_LIST_ID;
			this.caseIdsMode = 'sample';
			this.caseIds = windowSampleIds.split(/\s+/).join("\n");
			this.initiallySelected.sampleListId = true;
		}
	}

	@action setParamsFromUrl(url:string)
	{
		let urlParts = URL.parse(url, true);
		let params = urlParts.query as Partial<CancerStudyQueryUrlParams>;
		let profileIds = [
			params.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
			params.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
			params.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
			params.genetic_profile_ids_PROFILE_METHYLATION,
			params.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
			params.genetic_profile_ids_PROFILE_GENESET_SCORE,
		];

		this.selectedStudyIds = params.cancer_study_list ? params.cancer_study_list.split(",") : (params.cancer_study_id ? [params.cancer_study_id] : []);
		this._selectedProfileIds = profileIds.every(id => id === undefined) ? undefined : profileIds.filter(_.identity) as string[];
		this.zScoreThreshold = params.Z_SCORE_THRESHOLD || '2.0';
		this.rppaScoreThreshold = params.RPPA_SCORE_THRESHOLD || '2.0';
		this.dataTypePriorityCode = params.data_priority || '0';
		this.selectedSampleListId = params.case_set_id !== "-1" ? params.case_set_id : '';
		this.caseIds = params.case_ids || '';
		this.caseIdsMode = 'sample'; // url always contains sample IDs
		this.geneQuery = normalizeQuery(params.gene_list || '');
		this.forDownloadTab = params.tab_index === 'tab_download';
		this.initiallySelected.profileIds = true;
		this.initiallySelected.sampleListId = true;
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

	@action setSearchText(searchText: string) {
		this.clearSelectedCancerType();
		this.searchText = searchText;
	}

	@action clearSelectedCancerType(){
		this.selectedCancerTypeIds = [];
	}

	@action selectMolecularProfile(profile:MolecularProfile, checked:boolean)
	{
		let groupProfiles = this.getFilteredProfiles(profile.molecularAlterationType);
		let groupProfileIds = groupProfiles.map(profile => profile.molecularProfileId);
		if (this.forDownloadTab)
		{
			// download tab only allows a single selection
			this._selectedProfileIds = [profile.molecularProfileId];
		}
		else
		{
			let difference = _.difference(this.selectedProfileIds, groupProfileIds);
			if (checked)
				this._selectedProfileIds = _.union(difference, [profile.molecularProfileId]);
			else
				this._selectedProfileIds = difference;
		}
	}

	@action replaceGene(oldSymbol:string, newSymbol:string)
	{
		this.geneQuery = normalizeQuery(this.geneQuery.toUpperCase().replace(new RegExp(`\\b${oldSymbol.toUpperCase()}\\b`, 'g'), () => newSymbol.toUpperCase()));
	}
	
	@action replaceGeneset(oldGeneset:string, newGeneset:string)
    {
        this.genesetQuery = normalizeQuery(this.genesetQuery.toUpperCase().replace(new RegExp(`\\b${oldGeneset.toUpperCase()}\\b`, 'g'), () => newGeneset.toUpperCase()));
    }

	@action applyGeneSelection(map_geneSymbol_selected:ObservableMap<boolean>)
	{
		let [toAppend, toRemove] = _.partition(map_geneSymbol_selected.keys(), geneSymbol => map_geneSymbol_selected.get(geneSymbol));
		toAppend = _.difference(toAppend, this.geneIds);
		toRemove = _.intersection(toRemove, this.geneIds);
		for (let geneSymbol of toRemove)
			this.replaceGene(geneSymbol, '');
		this.geneQuery = normalizeQuery([this.geneQuery, ...toAppend].join(' '));
	}
	
	@action addToGenesetSelection(map_geneset_selected:ObservableMap<boolean>)
    {
	    let [toAppend, toRemove] = _.partition(map_geneset_selected.keys(), geneSet => map_geneset_selected.get(geneSet));
	    const genesetQuery = _.union(toAppend, this.genesetIds).join(' ');
        this.genesetQuery = normalizeQuery(genesetQuery);
    }
	
	@action applyGenesetSelection(map_geneset_selected:ObservableMap<boolean>)
    {
        const [toAppend, toRemove] = _.partition(map_geneset_selected.keys(), geneSet => map_geneset_selected.get(geneSet));
        let genesetQuery = this.genesetQuery;
        if (toAppend.length > 0) {
            let genesetList: string[] = [];
            for (const geneset of toAppend) 
            {
                genesetList.push(geneset);
            }
            genesetQuery = genesetList.join(" ");
        }
        if (toRemove.length > 0) {
            let genesetList = genesetQuery.split(" ");
            for (const removeGeneset of toRemove) {
                for (const geneset of genesetList) {
                    if (removeGeneset === geneset) {
                        const index = genesetList.indexOf(geneset);
                        if (index >= 0) {
                          genesetList.splice( index, 1 );
                        }
                    }
                }
            }
            genesetQuery = genesetList.join(" ");
        }
        genesetQuery = normalizeQuery(genesetQuery);
        this.genesetQuery = genesetQuery;
    }


	@action submit()
	{
		if (this.oql.error)
		{
			this.geneQueryErrorDisplayStatus = 'shouldFocus';
			this.genesetQueryErrorDisplayStatus = 'shouldFocus';
			return;
		}

		if (!this.submitEnabled || !this.asyncUrlParams.isComplete)
			return;

		let urlParams = this.asyncUrlParams.result;

		//TODO this is currently broken because of mobx-react-router
		// this is supposed to allow you to go back in the browser history to
		// return to the query page and restore the QueryStore state from the URL.
		/*let historyUrl = URL.format({...urlParams, pathname: window.location.href.split('?')[0]});

		// TODO remove this temporary HACK to make back button work
		historyUrl = historyUrl.split('#crosscancer').join('#/home#crosscancer');

		let newUrl = buildCBioPortalUrl(urlParams);
		if (historyUrl != newUrl)
			window.history.pushState(null, window.document.title, historyUrl);*/

		formSubmit(urlParams.pathname, urlParams.query, undefined, "smart");
	}

	@action openSummary() {

		if (!this.summaryEnabled) {
			return;
		}

		openStudySummaryFormSubmit(this.selectedStudyIds);
	}

	@action addGenesAndSubmit(genes:string[]) {
		onMobxPromise(this.molecularProfiles, ()=>{
			const nonProfileParams = _.cloneDeep(this.initialQueryParams.nonMolecularProfileParams);
			nonProfileParams.gene_list = normalizeQuery(nonProfileParams.gene_list + "\n" + genes.join(" "));
			nonProfileParams.geneset_list = normalizeQuery(nonProfileParams.geneset_list ? nonProfileParams.geneset_list : "");

			const profileParams = molecularProfileParams(this, this.initialQueryParams.molecularProfileIds);

			const urlParams = queryParams(nonProfileParams, profileParams, this.initialQueryParams.pathname);

			formSubmit(urlParams.pathname, urlParams.query);
		});
	}

	@action sendToGenomeSpace()
	{
		if (!this.submitEnabled || !this.asyncUrlParams.isComplete)
			return;

		gsUploadByGet({
			url: buildCBioPortalUrl(this.asyncUrlParams.result),
			filename: this.downloadDataFilename,
			successCallback: savePath => alert('Saved to GenomeSpace as ' + savePath),
			errorCallback: savePath => alert('ERROR saving to GenomeSpace as ' + savePath),
		});
	}

	@cached get molecularProfilesInStudyCache() {
		return new MolecularProfilesInStudyCache();
		
	}
}

export const QueryStoreComponent = ComponentGetsStoreContext(QueryStore);

const selectedGeneSets = '';
export default selectedGeneSets;
