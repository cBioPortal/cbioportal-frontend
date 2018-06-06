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
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';

export type ClinicalDataType = 'SAMPLE' | 'PATIENT'

export enum ChartType {
    PIE_CHART='PIE_CHART',
    BAR_CHART='BAR_CHART',
    SURVIVAL='SURVIVAL',
    TABLE='TABLE',
    SCATTER='SCATTER'
}

export type ClinicalDataCountWithColor = ClinicalDataCount & {color: string}
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export type SurvivalType = {
    id: string,
    title: string,
    associatedAttrs: ['OS_STATUS', 'OS_MONTHS']|['DFS_STATUS', 'DFS_MONTHS'],
    filter: string[],
    alteredGroup: PatientSurvival[]
    unalteredGroup: PatientSurvival[]
}

export type ChartMeta = {
    clinicalAttribute : ClinicalAttribute,
    uniqueKey         : string,
    chartType         : ChartType,
    defaultChartType  : ChartType,
    visible?          : boolean,
    position?         : number
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

    @observable private _initialized = false;

    @observable private _chartVisibility = observable.map<boolean>();

    @observable private _clinicalAttributesMetaSet = observable.map<ChartMeta>();;

	@computed get initialized()
	{
        return this.initalClinicalDataCounts.isComplete && this._initialized;
    }

    @action
    updateClinicalDataEqualityFilters(chartMeta : ChartMeta,
                                      values: string[]) {

        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: chartMeta.clinicalAttribute.clinicalAttributeId,
                clinicalDataType: chartMeta.clinicalAttribute.patientAttribute? 'PATIENT' : 'SAMPLE' as ClinicalDataType,
                values: values.sort()
            };
            this._clinicalDataEqualityFilterSet.set(chartMeta.uniqueKey, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @action
    updateGeneFilter(entrezGeneId: number) {
        let mutatedGeneFilter = this._mutatedGeneFilter;
        if (!mutatedGeneFilter) {
            //TODO: all elements instead of one
            mutatedGeneFilter = { entrezGeneIds: []};
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
                alterations: []
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

    @action changeChartVisibility(uniqueKey: string, visibility:boolean) {
        if(!visibility){
            //TODO: Currently clears only clinicalDataEqualityFilters,Need to implement for others
            this._clinicalDataEqualityFilterSet.delete(uniqueKey);
        }
        this._chartVisibility.set(uniqueKey, visibility);
    }

    @action changeChartType(uniqueKey: string, chartType:ChartType, updateDefaultType?:boolean){
        let chartMetaObject = this._clinicalAttributesMetaSet.get(uniqueKey);
        if(chartMetaObject){
            chartMetaObject.chartType = chartType;
            if(updateDefaultType){
                chartMetaObject.defaultChartType = chartType
            }
            this._clinicalAttributesMetaSet.set(uniqueKey, chartMetaObject);
        }
    }
    @action onChangeSelectedClinicalChart(options: {label: string; value: string;}[]) {
        this._chartVisibility.clear();
        for (const option of options) {
            this.changeChartVisibility(option.value, true)
        }
    }

    @computed get clinicalChartOptions() {
        return _.map(this.clinicalAttributesMeta.result, clinicalAttributeMeta=>({
            label: clinicalAttributeMeta.clinicalAttribute.displayName,
            value: clinicalAttributeMeta.uniqueKey
        }));
    }

    @computed get selectedClinicalCharts() {
        return _.reduce(this._chartVisibility.keys(),(acc:{label: string; value: string;}[], next)=>{
            if(this._chartVisibility.get(next)) {
                let chartMeta = this._clinicalAttributesMetaSet.get(next)
                if(chartMeta){
                    acc.push({
                        label: chartMeta.clinicalAttribute.displayName,
                        value: chartMeta.uniqueKey
                    })
                }
            }
            return acc;
        },[]);
    }

    @computed get emptyFilters() {
        let filters: StudyViewFilter = {} as any;
        filters.studyIds = [this.studyId]
        return filters
    }

    @computed
    get filters() {
        let filters: StudyViewFilter = _.assign({},this.emptyFilters);

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
        default: []
    });

    readonly clinicalAttributesMeta = remoteData<ChartMeta[]>({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            let attributes = this.clinicalAttributes.result
            //TODO: remove this once bar chart is implemented
            let filteredAttributes = _.filter(attributes,attribute=> attribute.datatype === 'STRING')
            return _.map(filteredAttributes, attribute => {
                const clinicalDataType : ClinicalDataType = attribute.patientAttribute? 'PATIENT' : 'SAMPLE';
                const uniqueKey = clinicalDataType + '_'+ attribute.clinicalAttributeId;
                const chartType = attribute.datatype === 'STRING' ? ChartType.PIE_CHART : ChartType.BAR_CHART;
                return { clinicalAttribute:attribute, uniqueKey: uniqueKey, chartType: chartType, defaultChartType: chartType, visible: false }
            });
        },
        default: [],
        onResult:(result)=>{
            _.forEach(result,obj=>{
                this._clinicalAttributesMetaSet.set(obj.uniqueKey, obj)
            });
        }
    });

    @computed get visibleAttributes():ChartMeta[]{
        if(this.initialized){
            return _.reduce(this._chartVisibility.keys(),(acc:ChartMeta[], next)=>{
                if(this._chartVisibility.get(next)) {
                    let chartMeta = this._clinicalAttributesMetaSet.get(next)
                    if(chartMeta){
                        acc.push(chartMeta)
                    }
                }
                return acc;
            },[]);
        }
        return [];
    }

    //TODO:cleanup
    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributesMeta],
        invoke: async () => {
            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            let queriedAttributes = this.clinicalAttributesMeta.result
            if (!_.isEmpty(selectedAttrIds)) {
                queriedAttributes = this.clinicalAttributesMeta.result.filter(attribute => {
                    return _.includes(selectedAttrIds, attribute.clinicalAttribute.clinicalAttributeId);
                });
            }

            let sampleAttributeCount = 0;
            let patientAttributeCount = 0;
            let filterAttributes: ChartMeta[] = []
            queriedAttributes.forEach(attribute => {
                if(attribute.clinicalAttribute.patientAttribute){
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
        default: []
    });

    readonly initalClinicalDataCounts = remoteData<{[id:string]:ClinicalDataCount[]}>({
        await: () => {
            let promises =  this.defaultVisibleAttributes.result.map(attributeMata => {
                    return this.studyViewClinicalDataCountsCache.get({ attribute: attributeMata.clinicalAttribute, filters: this.emptyFilters })
            })
            return [this.defaultVisibleAttributes, ...promises]
        },
        invoke: async () => {
            return _.reduce(this.defaultVisibleAttributes.result, (acc, next) => {
                
                acc[next.uniqueKey] = this.studyViewClinicalDataCountsCache
                    .get({ attribute: next.clinicalAttribute, filters: this.emptyFilters })
                    .result!;
                return acc;
            }, {} as any);
        },
        default: {},
        onResult:(result) => {
            if(!this._initialized){
                _.forEach(result, (obj, uniqueKey) => {
                    let chartMeta = this._clinicalAttributesMetaSet.get(uniqueKey);
                    //TODO: this is temporary. will be updated in next phase
                    if(chartMeta){
                        if (obj.length < 2 || obj.length > 100) {
                            this.changeChartVisibility(uniqueKey, false);
                        } else {
                            if (obj.length > 20) {
                                this.changeChartType(uniqueKey, ChartType.TABLE);
                            }
                            this.changeChartVisibility(uniqueKey, true);
                        }
                    }
                });
                this._initialized = true;
            }
        }
    });

    private readonly samples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: this.emptyFilters
            })
        },
        default: []
    })

    readonly selectedSamples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
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
                title: 'Overall Survival',
                associatedAttrs: ['OS_STATUS', 'OS_MONTHS'],
                filter: ['DECEASED'],
                alteredGroup: [],
                unalteredGroup: []
            });

        }
        if (dfsStatusFlag && dfsMonthsFlag) {
            survivalTypes.push({
                id: 'dfs_survival',
                title: 'Disease Free Survival',
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
        await: () => [this.clinicalAttributes, this.patientIds],
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