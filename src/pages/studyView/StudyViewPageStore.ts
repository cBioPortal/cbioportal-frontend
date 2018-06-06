import * as React from 'react';
import * as _ from 'lodash';
import {remoteData} from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {action, computed, observable} from "mobx";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    MutationCountByGene,
    MutationGeneFilter,
    Sample,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataSingleStudyFilter,
    MolecularProfile,
    Patient
} from 'shared/api/generated/CBioPortalAPI';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import MobxPromise from 'mobxpromise';
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';


export enum ClinicalDataType {
    SAMPLE = "SAMPLE",
    PATIENT = "PATIENT"
}
export type ClinicalAttributeData = { [attrId: string]: ClinicalDataCount[] };
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export type SurvivalType = {
    id: string,
    associatedAttrs: ['OS_STATUS', 'OS_MONTHS']|['DFS_STATUS', 'DFS_MONTHS'],
    filter: string[],
    alteredGroup: PatientSurvival[]
    unalteredGroup: PatientSurvival[]
}

export class StudyViewPageStore {

    constructor() {}

    public studyViewClinicalDataCountsCache = new StudyViewClinicalDataCountsCache()

    @observable studyId: string;

    @observable sampleAttrIds: string[] = [];

    @observable patientAttrIds: string[] = [];

    private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable private _mutatedGeneFilter: MutationGeneFilter;

    @observable private _cnaGeneFilter: CopyNumberGeneFilter;

    private _attributeChartVisibility = observable.map<boolean>();

    @observable private _initialized = false;

	@computed get initialized()
	{
		return this._initialized;
    }
    
    set initialized(flag){
        if(!this._initialized && flag){
            _.forEach(this.initalClinicalDataCounts.result, (obj, key) => {
                if (obj.length < 2 || obj.length > 10) {
                    this.hideChart(key);
                }
            });
            this._initialized = true;
        }
    }

    @action
    updateClinicalDataEqualityFilters(attributeId: string,
                                      clinicalDataType: ClinicalDataType,
                                      values: string[]) {

        let id = [clinicalDataType, attributeId].join('_');

        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: attributeId,
                clinicalDataType: clinicalDataType,
                values: values
            };
            this._clinicalDataEqualityFilterSet.set(id, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(id);
        }
    }

    @action
    updateGeneFilter(entrezGeneId: number) {
        let mutatedGeneFilter = this._mutatedGeneFilter;
        if (!mutatedGeneFilter) {
            //TODO: all elements instead of one
            mutatedGeneFilter = {molecularProfileId: this.mutationProfileIds[0], entrezGeneIds: []};
        }
        let _index = mutatedGeneFilter.entrezGeneIds.indexOf(entrezGeneId);
        if (_index === -1) {
            mutatedGeneFilter.entrezGeneIds.push(entrezGeneId);
        } else {
            mutatedGeneFilter.entrezGeneIds.splice(_index, 1);
        }
        this._mutatedGeneFilter = mutatedGeneFilter;
    }

    @action
    updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        let _cnaGeneFilter = this._cnaGeneFilter;
        if (!_cnaGeneFilter) {
             //TODO: all elements instead of one
            _cnaGeneFilter = {
                alterations: [],
                molecularProfileId: this.cnaProfileIds[0]
            }
        }
        var _index = -1;
        _.every(_cnaGeneFilter.alterations, (val: CopyNumberGeneFilterElement, index: number) => {
            if (val.entrezGeneId === entrezGeneId && val.alteration === alteration) {
                _index = index;
                return false;
            }
        });
        if (_index === -1) {
            _cnaGeneFilter.alterations.push({
                entrezGeneId: entrezGeneId,
                alteration: alteration
            });
        } else {
            _cnaGeneFilter.alterations.splice(_index, 1);
        }
        this._cnaGeneFilter = _cnaGeneFilter;
    }

    @action hideChart(attributeId: string) {
        this._attributeChartVisibility.set(attributeId, false);
    }

    @computed
    get filters() {
        let filters: StudyViewFilter = {} as any;
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilterSet.values();

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if (clinicalDataEqualityFilter.length > 0) {
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilter;
        }

        if (this._mutatedGeneFilter && this._mutatedGeneFilter.entrezGeneIds.length > 0) {
            filters.mutatedGenes = [this._mutatedGeneFilter];
        }

        if (this._cnaGeneFilter && this._cnaGeneFilter.alterations.length > 0) {
            filters.cnaGenes = [this._cnaGeneFilter];
        }

        return filters;
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._mutatedGeneFilter ? this._mutatedGeneFilter.entrezGeneIds : [];
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return this._cnaGeneFilter ? this._cnaGeneFilter.alterations : [];
    }

    public getClinicalDataEqualityFilters(clinicalAttribute: ClinicalAttribute): string[] {
        let id = [clinicalAttribute.patientAttribute?'PATIENT':'SAMPLE', clinicalAttribute.clinicalAttributeId].join('_');
        const filters = this._clinicalDataEqualityFilterSet.get(id);
        return _.isUndefined(filters) ? [] as any : filters.values;
    }

    private getPatientBySample(sample: Sample): Patient {
        return {
            patientId: sample.patientId,
            studyId: sample.studyId,
            uniquePatientKey: sample.patientId,
            uniqueSampleKey: sample.sampleId
        };
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        invoke: async () => {
            return await defaultClient.getAllMolecularProfilesInStudyUsingGET({
                studyId: this.studyId
            });
        },
        default: []
    });

    readonly studyMetaData = remoteData({
        invoke: async() => defaultClient.getStudyUsingGET({studyId: this.studyId})
    });

    @computed
    get mutationProfileIds() {
        return this.molecularProfiles
            .result
            .filter(profile=> profile.molecularAlterationType === "MUTATION_EXTENDED")
            .map(profile=>profile.molecularProfileId);
    }

    @computed
    get cnaProfileIds() {
        return this.molecularProfiles
            .result
            .filter(profile=> profile.molecularAlterationType === "COPY_NUMBER_ALTERATION" && profile.datatype === "DISCRETE")
            .map(profile=>profile.molecularProfileId);
    }

    readonly clinicalAttributes = remoteData({
        invoke: () => {
            return defaultClient.getAllClinicalAttributesInStudyUsingGET({
                studyId: this.studyId
            })
        },
        default: [],
        onResult:(attributes:ClinicalAttribute[])=>{
            attributes.forEach(attribute=>{
                this._attributeChartVisibility.set(attribute.clinicalAttributeId,false);
            })
        }
    });

    readonly clinicalAttributeSet = remoteData<{[id:string]:ClinicalAttribute}>({
        await: () => [this.clinicalAttributes],
        invoke: () => Promise.resolve(_.keyBy(this.clinicalAttributes.result, x=>x.clinicalAttributeId))
    },{});

    @computed get visibleAttributes(){
        const attributes = this.clinicalAttributeSet.result
        return _.reduce(this._attributeChartVisibility.toJS(),(acc:ClinicalAttribute[],next,key)=>{
            if(next && attributes[key]){
                acc.push(attributes[key])
            }
            return acc;
        },[])
    }

    //TODO:cleanup
    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {

            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            let queriedAttributes = this.clinicalAttributes.result
            if (!_.isEmpty(selectedAttrIds)) {
                queriedAttributes = this.clinicalAttributes.result.filter(attribute => {
                    return _.includes(selectedAttrIds, attribute.clinicalAttributeId);
                });
            }

            let sampleAttributeCount = 0;
            let patientAttributeCount = 0;
            let filterAttributes: ClinicalAttribute[] = []
            queriedAttributes.forEach(attribute => {
                if(attribute.patientAttribute){
                    if(patientAttributeCount<10){
                        filterAttributes.push(attribute)
                        patientAttributeCount++;
                    }
                } else{
                    if(sampleAttributeCount<10){
                        filterAttributes.push(attribute)
                        sampleAttributeCount++;
                    }
                }
            });
            return filterAttributes;
        },
        default: [],
        onResult:(attributes:ClinicalAttribute[])=>{
            attributes.forEach(attribute=>{
                this._attributeChartVisibility.set(attribute.clinicalAttributeId,true);
            })
        }
    });

    readonly initalClinicalDataCounts = remoteData<{[id:string]:ClinicalDataCount[]}>({
        await: () => {
            return this.defaultVisibleAttributes.result.map(attribute => {
                return this.studyViewClinicalDataCountsCache.get({ attribute: attribute, filters: {} as any })
            })
        },
        invoke: async () => {
            return _.reduce(this.defaultVisibleAttributes.result, (acc, next) => {

                acc[next.clinicalAttributeId] = this.studyViewClinicalDataCountsCache
                    .get({ attribute: next, filters: {} as any })
                    .result!;
                return acc;
            }, {} as any);
        },
        default: {},
        onResult:() => {
            this.initialized=true;
        }
    });

    private readonly samples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchSampleIdsUsingPOST({
                studyId: this.studyId,
                studyViewFilter: {} as any
            })
        },
        default: []
    })

    readonly selectedSamples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchSampleIdsUsingPOST({
                studyId: this.studyId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly patientIds = remoteData<string[]>({
        await: () => [this.samples],
        invoke: async () => {
            return _.uniq(this.samples.result.map(sample => sample.patientId));
        },
        default: []
    });

    readonly selectedPatientIds = remoteData<string[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            return _.uniq(this.selectedSamples.result.map(sample => sample.patientId));
        },
        default: []
    });

    readonly unSelectedPatientIds = remoteData<string[]>({
        await: () => [this.patientIds, this.selectedPatientIds],
        invoke: async () => {
            return this.patientIds.result.filter(patientId => !_.includes(this.selectedPatientIds.result, patientId));
        },
        default: []
    });

    readonly mutatedGeneData = remoteData<MutatedGenesData>({
        invoke: async () => {
            if(!_.isEmpty(this.mutationProfileIds)){
                //TDOD: get data for all profiles
                return internalClient.fetchMutatedGenesUsingPOST({
                    molecularProfileId: this.mutationProfileIds[0],
                    studyViewFilter: this.filters
                });
            } else{
                return [];
            } 
        },
        default: []
    });

    readonly cnaGeneData = remoteData<CNAGenesData>({
        invoke: async () => {
            if(!_.isEmpty(this.cnaProfileIds)){
                //TDOD: get data for all profiles
                return internalClient.fetchCNAGenesUsingPOST({
                    molecularProfileId: this.cnaProfileIds[0],
                    studyViewFilter: this.filters
                });
            } else{
                return [];
            }
        },
        default: []
    });

   @computed private get survivalPlots(){
        let osStatusFlag = false;
        let osMonthsFlag = false;
        let dfsStatusFlag = false;
        let dfsMonthsFlag = false;
        let survivalTypes: SurvivalType[] = [];

        this.clinicalAttributes.result.forEach(obj => {
            if (obj.clinicalAttributeId === 'OS_STATUS') {
                osStatusFlag = true;
            } else if (obj.clinicalAttributeId === 'OS_MONTHS') {
                osMonthsFlag = true;
            } else if (obj.clinicalAttributeId === 'DFS_STATUS') {
                dfsStatusFlag = true;
            } else if (obj.clinicalAttributeId === 'DFS_MONTHS') {
                dfsMonthsFlag = true;
            }
        });

        if (osStatusFlag && osMonthsFlag) {
            survivalTypes.push({
                id: 'os_survival',
                associatedAttrs: ['OS_STATUS', 'OS_MONTHS'],
                filter: ['DECEASED'],
                alteredGroup: [],
                unalteredGroup: []
            });

        }
        if (dfsStatusFlag && dfsMonthsFlag) {
            survivalTypes.push({
                id: 'dfs_survival',
                associatedAttrs: ['DFS_STATUS', 'DFS_MONTHS'],
                filter: ['Recurred/Progressed', 'Recurred'],
                alteredGroup: [],
                unalteredGroup: []
            });
        }

        return survivalTypes;
    }

    readonly survivalPlotData = remoteData<SurvivalType[]>({
        await: () => [this.survivalData, this.selectedPatientIds, this.unSelectedPatientIds],
        invoke: async () => {

            return this.survivalPlots.map(obj => {
                obj.alteredGroup = getPatientSurvivals(
                    this.survivalData.result,
                    this.selectedPatientIds.result!, obj.associatedAttrs[0], obj.associatedAttrs[1], s => obj.filter.indexOf(s) !== -1);
                obj.unalteredGroup = getPatientSurvivals(
                    this.survivalData.result,
                    this.unSelectedPatientIds.result!, obj.associatedAttrs[0], obj.associatedAttrs[1], s => obj.filter.indexOf(s) !== -1);
                return obj
            });
        },
        default: []
    });

    readonly survivalData = remoteData<{[id:string]:ClinicalData[]}>({
        await: () => [this.patientIds],
        invoke: async () => {
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: _.flatten(this.survivalPlots.map(obj=>obj.associatedAttrs)),
                ids: this.patientIds.result
            };
            let data = await defaultClient.fetchAllClinicalDataInStudyUsingPOST({
                studyId: this.studyId,
                clinicalDataSingleStudyFilter: filter,
                clinicalDataType: "PATIENT"
            })

            return _.groupBy(data, 'patientId')
        },
        default: {}
    });
}