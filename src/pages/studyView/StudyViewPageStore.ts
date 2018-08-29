import * as _ from 'lodash';
import {remoteData} from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {action, computed, observable, toJS, ObservableMap, reaction} from "mobx";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    CopyNumberCountByGene,
    CopyNumberGeneFilterElement,
    MutationCountByGene,
    Sample,
    SampleIdentifier,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    Gene,
    MolecularProfile,
    MolecularProfileFilter,
    Patient, PatientFilter
} from 'shared/api/generated/CBioPortalAPI';
import {PatientSurvival} from 'shared/model/PatientSurvival';
import {getPatientSurvivals} from 'pages/resultsView/SurvivalStoreHelper';
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';
import {
    getClinicalAttributeUniqueKey, isPreSelectedClinicalAttr, isFiltered,
    makePatientToClinicalAnalysisGroup
} from './StudyViewUtils';
import MobxPromise from 'mobxpromise';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { bind } from '../../../node_modules/bind-decorator';
import { updateGeneQuery } from 'pages/studyView/StudyViewUtils';
import { stringListToSet } from 'shared/lib/StringUtils';
import { unparseOQLQueryLine } from 'shared/lib/oql/oqlfilter';
import formSubmit from 'shared/lib/formSubmit';
import {IStudyViewScatterPlotData} from "./charts/scatterPlot/StudyViewScatterPlot";

export type ClinicalDataType = 'SAMPLE' | 'PATIENT'

export enum ChartType {
    PIE_CHART = 'PIE_CHART',
    BAR_CHART = 'BAR_CHART',
    SURVIVAL = 'SURVIVAL',
    TABLE = 'TABLE',
    SCATTER = 'SCATTER',
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE'
}

export enum UniqueKey {
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE',
    MUTATION_COUNT_CNA_FRACTION = 'MUTATION_COUNT_CNA_FRACTION',
    DISEASE_FREE_SURVIVAL = 'dfs_survival',
    OVERALL_SURVIVAL = 'os_survival'
}

export const MUTATION_COUNT = 'MUTATION_COUNT';
export const FRACTION_GENOME_ALTERED = 'FRACTION_GENOME_ALTERED';
export const OS_STATUS = "OS_STATUS";
export const OS_MONTHS = "OS_MONTHS";
export const DFS_STATUS = "DFS_STATUS";
export const DFS_MONTHS = "DFS_MONTHS";

export const SELECTED_ANALYSIS_GROUP_VALUE = "Selected";
export const UNSELECTED_ANALYSIS_GROUP_VALUE = "Unselected";

export type ClinicalDataCountWithColor = ClinicalDataCount & { color: string }
export type AnalysisGroup = { value:string, color:string, legendText?:string};
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export type SurvivalType = {
    id: string,
    title: string,
    associatedAttrs: ['OS_STATUS', 'OS_MONTHS'] | ['DFS_STATUS', 'DFS_MONTHS'],
    filter: string[],
    alteredGroup: PatientSurvival[]
    unalteredGroup: PatientSurvival[]
}

export type ChartMeta = {
    clinicalAttribute?: ClinicalAttribute,
    uniqueKey: string,
    displayName: string,
    description: string,
    chartType: ChartType
}

export type StudyWithSamples = CancerStudy & {
    uniqueSampleKeys : string[]
}

export class StudyViewPageStore {

    constructor() {
        reaction(()=>this.filters, ()=>this.clearAnalysisGroupsSettings()); // whenever any data filters change, reset survival analysis settings
    }

    public studyViewClinicalDataCountsCache = new StudyViewClinicalDataCountsCache()

    @observable studyIds: string[] = [];

    @observable sampleAttrIds: string[] = [];

    @observable patientAttrIds: string[] = [];

    private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable.ref private _mutatedGeneFilter: number[] = [];

    @observable.ref private _cnaGeneFilter: CopyNumberGeneFilterElement[] = [];

    @observable private _sampleIdentifiers:SampleIdentifier[];

    @observable private _chartVisibility = observable.map<boolean>();

    @observable geneQueryStr: string;

    @observable private geneQueries: SingleGeneQuery[] = [];

    @observable private queriedGeneSet = observable.map<boolean>();

    private clinicalDataCache:ClinicalDataCache = new ClinicalDataCache()

    @observable.ref private _analysisGroupsClinicalAttribute:ClinicalAttribute|undefined;
    @observable.ref private _analysisGroups:ReadonlyArray<AnalysisGroup>|undefined;

    @bind
    @action onCheckGene(hugoGeneSymbol: string) {
        //only update geneQueryStr whenever a table gene is clicked.
        this.geneQueryStr = updateGeneQuery(this.geneQueries, hugoGeneSymbol);
        this.queriedGeneSet.set(hugoGeneSymbol,!this.queriedGeneSet.get(hugoGeneSymbol));
    }

    @computed get selectedGenes(): string[] {
        return this.queriedGeneSet.keys().filter(gene=>!!this.queriedGeneSet.get(gene));
    }

    @action updateSelectedGenes(query: SingleGeneQuery[], genesInQuery: Gene[]) {
        this.geneQueries = query;
        this.queriedGeneSet = new ObservableMap(stringListToSet(genesInQuery.map(gene => gene.hugoGeneSymbol)))
    }

    @action
    clearGeneFilter() {
        this._mutatedGeneFilter = [];
    }
    @action
    clearCNAGeneFilter() {
        this._cnaGeneFilter = [];
    }
    @action
    clearCustomCasesFilter() {
        this._sampleIdentifiers = []
    }

    @action
    clearAllFilters() {
        this._clinicalDataEqualityFilterSet.clear()
        this.clearGeneFilter()
        this.clearCNAGeneFilter()
        this.clearCustomCasesFilter()
    }

    @action
    updateAnalysisGroupsSettings(attribute:ClinicalAttribute, groups:ReadonlyArray<AnalysisGroup>) {
        this._analysisGroupsClinicalAttribute = attribute;
        this._analysisGroups = groups;
    }

    @action
    clearAnalysisGroupsSettings() {
        this._analysisGroupsClinicalAttribute = undefined;
        this._analysisGroups = undefined;
    }

    @computed
    get analysisGroupsSettings() {
        if (this._analysisGroupsClinicalAttribute && this._analysisGroups) {
            return {
                clinicalAttribute: this._analysisGroupsClinicalAttribute,
                groups: this._analysisGroups
            };
        } else {
            // analysis groups for selected/unselected
            return {
                groups: [{
                    value: SELECTED_ANALYSIS_GROUP_VALUE,
                    color: "red",
                    legendText: "Selected patients"
                },{
                    value: UNSELECTED_ANALYSIS_GROUP_VALUE,
                    color: "blue",
                    legendText: "Unselected patients"
                }] as AnalysisGroup[]
            }
        }
    }

    readonly sampleToAnalysisGroup = remoteData({
        await:()=>{
            if (this.analysisGroupsSettings.clinicalAttribute) {
                return [this.sampleToClinicalAnalysisGroup];
            } else {
                return [this.samples, this.selectedSamples];
            }
        },
        invoke:()=>{
            if (this.analysisGroupsSettings.clinicalAttribute) {
                return Promise.resolve(this.sampleToClinicalAnalysisGroup.result!);
            } else {
                const selectedSamplesMap = _.keyBy(this.selectedSamples.result!, s=>s.uniqueSampleKey);
                return Promise.resolve(_.reduce(this.samples.result!, (map, nextSample)=>{
                    const sampleKey = nextSample.uniqueSampleKey;
                    if (sampleKey in selectedSamplesMap) {
                        map[sampleKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                    } else {
                        map[sampleKey] = UNSELECTED_ANALYSIS_GROUP_VALUE;
                    }
                    return map;
                }, {} as {[sampleKey:string]:string}));
            }
        }
    });

    readonly patientToAnalysisGroup = remoteData<{[patientKey:string]:string}>({
        await:()=>{
            if (this.analysisGroupsSettings.clinicalAttribute) {
                return [this.patientToClinicalAnalysisGroup];
            } else {
                return [this.samples, this.selectedPatientKeys];
            }
        },
        invoke:()=>{
            if (this.analysisGroupsSettings.clinicalAttribute) {
                return Promise.resolve(this.patientToClinicalAnalysisGroup.result!);
            } else {
                const selectedPatientsMap = _.keyBy(this.selectedPatientKeys.result!);
                return Promise.resolve(_.reduce(this.samples.result!, (map, nextSample)=>{
                    const patientKey = nextSample.uniquePatientKey;
                    if (patientKey in selectedPatientsMap) {
                        map[patientKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                    } else {
                        map[patientKey] = UNSELECTED_ANALYSIS_GROUP_VALUE;
                    }
                    return map;
                }, {} as {[patientKey:string]:string}));
            }
        }
    });

    readonly clinicalAnalysisGroupsData = remoteData({
        await:()=>[this.selectedSamples, this.selectedPatients],
        invoke:async()=>{
            if (this.analysisGroupsSettings.clinicalAttribute !== undefined) {
                const attr = this.analysisGroupsSettings.clinicalAttribute;
                const data = await defaultClient.fetchClinicalDataUsingPOST({
                    clinicalDataType: attr.patientAttribute ? "PATIENT" : "SAMPLE",
                    clinicalDataMultiStudyFilter:{
                        attributeIds: [attr.clinicalAttributeId],
                        identifiers: attr.patientAttribute ?
                            this.selectedPatients.result!.map(p=>({entityId:p.patientId, studyId:p.studyId})) :
                            this.selectedSamples.result!.map(p=>({entityId:p.sampleId, studyId:p.studyId}))
                    },
                    projection: "SUMMARY"
                });
                const ret = data.reduce((map, clinData)=>{
                    if (attr.patientAttribute) {
                        map[clinData.uniquePatientKey] = clinData.value;
                    } else {
                        map[clinData.uniqueSampleKey] = clinData.value;
                    }
                    return map;
                }, {} as {[caseKey:string]:string});
                // add NA entries
                if (attr.patientAttribute) {
                    for (const patient of this.selectedPatients.result!) {
                        if (!(patient.uniquePatientKey in ret)) {
                            ret[patient.uniquePatientKey] = "NA";
                        }
                    }
                } else {
                    for (const sample of this.selectedSamples.result!) {
                        if (!(sample.uniqueSampleKey in ret)) {
                            ret[sample.uniqueSampleKey] = "NA";
                        }
                    }
                }
                // by the end, there is an entry for every selected patient or selected sample (depending on whether its patient attribute)
                return {
                    patientAttribute: attr.patientAttribute,
                    caseToAnalysisGroup: ret
                }
            } else {
                return new Promise<any>(()=>{}); // stay pending
            }
        }
    });

    readonly patientToClinicalAnalysisGroup = remoteData({
        await:()=>[this.selectedSamples, this.clinicalAnalysisGroupsData],
        invoke:()=>{
            const data = this.clinicalAnalysisGroupsData.result!;
            if (data.patientAttribute) {
                return Promise.resolve(data.caseToAnalysisGroup);
            } else {
                return Promise.resolve(makePatientToClinicalAnalysisGroup(
                    this.selectedSamples.result!,
                    this.clinicalAnalysisGroupsData.result!.caseToAnalysisGroup
                ));
            }
        }
    });

    readonly sampleToClinicalAnalysisGroup = remoteData({
        await:()=>[this.selectedSamples, this.clinicalAnalysisGroupsData],
        invoke:()=>{
            const data = this.clinicalAnalysisGroupsData.result!;
            if (!data.patientAttribute) {
                return Promise.resolve(data.caseToAnalysisGroup);
            } else {
                const patientToAnalysisGroup = data.caseToAnalysisGroup;
                return Promise.resolve(_.reduce(this.selectedSamples.result!, (map, sample)=>{
                    map[sample.uniqueSampleKey] = patientToAnalysisGroup[sample.uniquePatientKey];
                    return map;
                }, {} as {[sampleKey:string]:string}));
            }
        }
    });

    @action
    updateClinicalDataEqualityFilters(chartMeta: ChartMeta, values: string[]) {
        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                clinicalDataType: chartMeta.clinicalAttribute!.patientAttribute ? 'PATIENT' : 'SAMPLE' as ClinicalDataType,
                values: values.sort()
            };
            this._clinicalDataEqualityFilterSet.set(chartMeta.uniqueKey, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @action
    updateGeneFilters(entrezGeneIds: number[]) {
        this._mutatedGeneFilter = _.xor(this._mutatedGeneFilter, entrezGeneIds);
    }

    @action resetGeneFilter() {
        this._mutatedGeneFilter = [];
    }

    @action
    updateCustomCasesFilter(cases: SampleIdentifier[], keepCurrent?:boolean) {
        const newSampleIdentifiers = _.map(cases, obj => {
            return {
                "sampleId": obj.sampleId,
                "studyId": obj.studyId
            }
        });
        const newSampleIdentifiersMap = _.keyBy(newSampleIdentifiers, s=>`${s.studyId}:${s.sampleId}`);
        if (keepCurrent) {
            // if we should keep the current selection, go through and add samples back, taking care not to duplicate
            for (const s of this._sampleIdentifiers) {
                if (!(`${s.studyId}:${s.sampleId}` in newSampleIdentifiersMap)) {
                    newSampleIdentifiers.push(s);
                }
            }
        }
        this._sampleIdentifiers = newSampleIdentifiers;
    }

    @action
    resetCustomCasesFilter() {
        this._sampleIdentifiers = [];
    };

    public getCustomCasesFilter() {
        return this._sampleIdentifiers;
    }

    @action
    updateCNAGeneFilters(filters: CopyNumberGeneFilterElement[]) {
        this._cnaGeneFilter = _.xor(this._cnaGeneFilter, filters);
    }

    @action
    resetCNAGeneFilter() {
        this._cnaGeneFilter = [];
    }

    @action changeChartVisibility(uniqueKey:string, visible: boolean) {
        this._chartVisibility.set(uniqueKey, visible);
    }

    @action
    resetFilterAndChangeChartVisibility(chartMeta: ChartMeta, visible: boolean) {
        if (!visible) {
            switch (chartMeta.chartType) {
                case ChartType.MUTATED_GENES_TABLE:
                    this.resetGeneFilter();
                    break;
                case ChartType.CNA_GENES_TABLE:
                    this.resetCNAGeneFilter();
                    break;
                case ChartType.SCATTER:
                    this.resetCustomCasesFilter();
                    break;
                case ChartType.SURVIVAL:
                    break;
                default:
                    this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
                    break;
            }
        }
        this.changeChartVisibility(chartMeta.uniqueKey, visible);
    }

    @computed private get emptyFilter(): StudyViewFilter {
        return { studyIds: this.studyIds } as any;
    }

    @computed get clinicalDataEqualityFilters() {
        return this._clinicalDataEqualityFilterSet.values();
    }

    @computed
    get filters() {
        let filters: StudyViewFilter = {} as any;

        const clinicalDataEqualityFilters = this.clinicalDataEqualityFilters;

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if (clinicalDataEqualityFilters.length > 0) {
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilters;
        }

        if (this._mutatedGeneFilter.length > 0) {
            filters.mutatedGenes = [{
                entrezGeneIds: this._mutatedGeneFilter
            }];
        }

        if (this._cnaGeneFilter.length > 0) {
            filters.cnaGenes = [{
                alterations: this._cnaGeneFilter
            }];
        }

        if(this._sampleIdentifiers && this._sampleIdentifiers.length>0) {
            filters.sampleIdentifiers = this._sampleIdentifiers;
        } else {
            filters.studyIds = this.studyIds
        }
        return filters;
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._mutatedGeneFilter;
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return this._cnaGeneFilter;
    }

    public getClinicalDataFiltersByUniqueKey(uniqueKey: string): string[] {
        let filter = _.find(this._clinicalDataEqualityFilterSet.values(), filter => _.isEqual(filter.clinicalDataType + '_' + filter.attributeId, uniqueKey));
        return filter ? filter.values : [];
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        invoke: async () => {
            return await defaultClient.fetchMolecularProfilesUsingPOST({
                molecularProfileFilter: {
                    studyIds: this.studyIds
                } as MolecularProfileFilter
            })
        },
        default: []
    });

    readonly studies = remoteData({
        invoke: async () => {
            return await defaultClient.fetchStudiesUsingPOST({
                studyIds: toJS(this.studyIds)
            })
        },
        default: []
    });

    readonly mutationProfiles = remoteData({
        await: ()=>[this.molecularProfiles],
        invoke:()=>Promise.resolve(
            this.molecularProfiles.result!.filter(profile => profile.molecularAlterationType === "MUTATION_EXTENDED")
        ),
        default: []
    });

    @computed
    get cnaProfileIds() {
        return this.molecularProfiles
            .result
            .filter(profile => profile.molecularAlterationType === "COPY_NUMBER_ALTERATION" && profile.datatype === "DISCRETE")
            .map(profile => profile.molecularProfileId);
    }

    readonly clinicalAttributes = remoteData({
        await: () => [this.studies],
        invoke: () => defaultClient.fetchClinicalAttributesUsingPOST({
            studyIds: this.studies.result.map(study => study.studyId)
        }),
        default: []
    });

    @computed get analysisGroupsPossible() {
        // analysis groups possible iff there are visible analysis groups-capable charts
        const analysisGroupsCharts =
            [UniqueKey.MUTATION_COUNT_CNA_FRACTION, UniqueKey.DISEASE_FREE_SURVIVAL, UniqueKey.OVERALL_SURVIVAL] as string[];
        let ret = false;
        for (const chartMeta of this.visibleAttributes) {
            if (analysisGroupsCharts.indexOf(chartMeta.uniqueKey) > -1) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    @computed
    get chartMetaSet(): { [id: string]: ChartMeta } {
        let _chartMetaSet: { [id: string]: ChartMeta } = {};
        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(this.clinicalAttributes.result, (acc: { [id: string]: ChartMeta }, attribute) => {
            const uniqueKey = getClinicalAttributeUniqueKey(attribute);
            //TODO: currently only piechart is handled
            if (attribute.datatype === 'STRING') {
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    chartType: ChartType.PIE_CHART,
                    description: attribute.description,
                    clinicalAttribute: attribute
                };
            }
            return acc
        }, _chartMetaSet);


        _.reduce(this.survivalPlots, (acc: { [id: string]: ChartMeta }, survivalPlot) => {
            acc[survivalPlot.id] = {
                uniqueKey: survivalPlot.id,
                chartType: ChartType.SURVIVAL,
                displayName: survivalPlot.title,
                description: ''
            };
            return acc;
        }, _chartMetaSet);

        if (!_.isEmpty(this.mutationProfiles.result!)) {
            _chartMetaSet[UniqueKey.MUTATED_GENES_TABLE] = {
                uniqueKey: UniqueKey.MUTATED_GENES_TABLE,
                chartType: ChartType.MUTATED_GENES_TABLE,
                displayName: 'Mutated Genes',
                description: ''
            };
        }

        if (!_.isEmpty(this.cnaProfileIds)) {
            _chartMetaSet[UniqueKey.CNA_GENES_TABLE] = {
                uniqueKey: UniqueKey.CNA_GENES_TABLE,
                chartType: ChartType.CNA_GENES_TABLE,
                displayName: 'CNA Genes',
                description: ''
            };
        }

        const scatterRequiredParams = _.reduce(this.clinicalAttributes.result, (acc, next) => {
            if (MUTATION_COUNT === next.clinicalAttributeId) {
                acc[MUTATION_COUNT] = true
            }
            if (FRACTION_GENOME_ALTERED === next.clinicalAttributeId) {
                acc[FRACTION_GENOME_ALTERED] = true
            }
            return acc;
        }, {[MUTATION_COUNT]: false, [FRACTION_GENOME_ALTERED]: false});

        if (scatterRequiredParams[MUTATION_COUNT] && scatterRequiredParams[FRACTION_GENOME_ALTERED]) {
            _chartMetaSet[UniqueKey.MUTATION_COUNT_CNA_FRACTION] = {
                uniqueKey: UniqueKey.MUTATION_COUNT_CNA_FRACTION,
                chartType: ChartType.SCATTER,
                displayName: 'Mutation count Vs. CNA',
                description: ''
            };
        }

        return _chartMetaSet;
    }

    @computed
    get visibleAttributes(): ChartMeta[] {
        const _keys = this._chartVisibility.keys();
        return _.reduce(this.chartMetaSet, (result:ChartMeta[], chartMeta:ChartMeta, uniqueKey:string) => {
            if(!_.includes(_keys, uniqueKey) || this._chartVisibility.get(uniqueKey)) {
                result.push(chartMeta);
            }
            return result;
        }, []);
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
            // Todo: its a temporary logic to show limited charts initially(10 sample and 10 patient attribute charts)
            // this logic will be updated later
            queriedAttributes.sort((a, b) => {
                if (isPreSelectedClinicalAttr(a.clinicalAttributeId)) {
                    if (isPreSelectedClinicalAttr(b.clinicalAttributeId)) {
                        return 0;
                    }
                    return -1;
                }
                if (isPreSelectedClinicalAttr(b.clinicalAttributeId)) {
                    return -1;
                }
                return 0;
            }).forEach(attribute => {
                const uniqueKey = getClinicalAttributeUniqueKey(attribute);
                if (attribute.patientAttribute) {
                    if (patientAttributeCount < 10) {
                        filterAttributes.push(attribute)
                        patientAttributeCount++;
                    } else {
                        this.changeChartVisibility(uniqueKey, false);
                    }
                } else {
                    if (sampleAttributeCount < 10) {
                        filterAttributes.push(attribute)
                        sampleAttributeCount++;
                    } else {
                        this.changeChartVisibility(uniqueKey, false);
                    }
                }
            });
            return filterAttributes;
        },
        default: []
    });

    readonly initialClinicalDataCounts = remoteData<{ [id: string]: ClinicalDataCount[] }>({
        await: () => {
            let promises = this.defaultVisibleAttributes.result.map(attribute => {
                return this.studyViewClinicalDataCountsCache.get({ attribute: attribute, filters: this.emptyFilter })
            })
            return [this.defaultVisibleAttributes, ...promises]
        },
        invoke: async () => {
            return _.reduce(this.defaultVisibleAttributes.result, (acc, next) => {
                const clinicalDataType: ClinicalDataType = next.patientAttribute ? 'PATIENT' : 'SAMPLE';
                const uniqueKey = clinicalDataType + '_' + next.clinicalAttributeId;
                acc[uniqueKey] = this.studyViewClinicalDataCountsCache
                    .get({ attribute: next, filters: this.emptyFilter })
                    .result!;
                return acc;
            }, {} as any);
        },
        default: {},
        onResult: (result) => {
            _.forEach(result, (obj, uniqueKey) => {
                //TODO: this is temporary. will be updated in next phase
                if (obj.length < 2 || obj.length > 100) {
                    this.changeChartVisibility(uniqueKey, false);
                } else {
                    this.changeChartVisibility(uniqueKey, true);
                }
            });
        }
    });

    private readonly samples = remoteData<Sample[]>({
        await: () => [this.clinicalAttributes],
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: this.emptyFilter
            })
        },
        default: []
    });

    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [this.studies, this.samples],
        invoke: async () => {
            let studySampleSet = _.groupBy(this.samples.result,(sample)=>sample.studyId)
            return this.studies.result.map(study=>{
                let samples = studySampleSet[study.studyId]||[];
                return {...study, uniqueSampleKeys:_.map(samples,sample=>sample.uniqueSampleKey)}
            });
        },
        default: []
    });

    readonly selectedSamples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly samplesWithNAInSelectedClinicalData = remoteData<Sample[]>({
        await:()=>[
            this.samples
        ],
        invoke: async() => {
            const samplesWithoutNA = await internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: Object.assign({}, this.emptyFilter, {
                    clinicalDataEqualityFilters: this.clinicalDataEqualityFilters.map(
                        f=>Object.assign({}, f, { values: ["NA"] })
                    ),
                    filterType: "EXCLUSION"
                }) as any as StudyViewFilter
            });
            const uniqueSampleKeysWithoutNA = _.keyBy(samplesWithoutNA, s=>s.uniqueSampleKey);
            const samplesWithNA = samplesWithoutNA.filter(s=>!(s.uniqueSampleKey in uniqueSampleKeysWithoutNA));
            return samplesWithNA;
        },
        default: []
    });

    readonly patientKeysWithNAInSelectedClinicalData = remoteData<string[]>({
        await:()=>[this.samplesWithNAInSelectedClinicalData],
        invoke:()=>{
            return Promise.resolve(
                _.uniq(this.samplesWithNAInSelectedClinicalData.result!.map(s=>s.uniquePatientKey))
            );
        }
    });

    @computed
    get selectedSamplesMap() {
        return _.keyBy(this.selectedSamples.result!, s=>s.uniqueSampleKey);
    }

    readonly selectedPatientKeys = remoteData<string[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            return _.uniq(this.selectedSamples.result.map(sample => sample.uniquePatientKey));
        },
        default: []
    });

    readonly selectedPatients = remoteData<Patient[]>({
        await:()=>[this.selectedSamples],
        invoke:()=>{
            return defaultClient.fetchPatientsUsingPOST({
                patientFilter: {
                    uniquePatientKeys: this.selectedSamples.result!.map(s=>s.uniquePatientKey)
                } as PatientFilter
            });
        }
    });

    readonly unSelectedPatientKeys = remoteData<string[]>({
        await: () => [this.samples, this.selectedPatientKeys],
        invoke: async () => {

            const unselectedPatientSet = _.reduce(this.samples.result, (acc: { [id: string]: boolean }, next) => {
                if (!_.includes(this.selectedPatientKeys.result, next.uniquePatientKey)) {
                    acc[next.uniquePatientKey] = true;
                }
                return acc;
            }, {});
            return Object.keys(unselectedPatientSet);
        },
        default: []
    });

    readonly mutatedGeneData = remoteData<MutatedGenesData>({
        await:()=>[this.mutationProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfiles.result!)) {
                //TDOD: get data for all profiles
                return internalClient.fetchMutatedGenesUsingPOST({
                    studyViewFilter: this.filters
                });
            } else {
                return [];
            }
        },
        default: []
    });

    readonly cnaGeneData = remoteData<CNAGenesData>({
        invoke: async () => {
            if (!_.isEmpty(this.cnaProfileIds)) {
                //TDOD: get data for all profiles
                return internalClient.fetchCNAGenesUsingPOST({
                    studyViewFilter: this.filters
                });
            } else {
                return [];
            }
        },
        default: []
    });

    @computed private get survivalPlots() {
        let osStatusFlag = false;
        let osMonthsFlag = false;
        let dfsStatusFlag = false;
        let dfsMonthsFlag = false;
        let survivalTypes: SurvivalType[] = [];

        this.clinicalAttributes.result.forEach(obj => {
            if (obj.clinicalAttributeId === OS_STATUS) {
                osStatusFlag = true;
            } else if (obj.clinicalAttributeId === OS_MONTHS) {
                osMonthsFlag = true;
            } else if (obj.clinicalAttributeId === DFS_STATUS) {
                dfsStatusFlag = true;
            } else if (obj.clinicalAttributeId === DFS_MONTHS) {
                dfsMonthsFlag = true;
            }
        });

        if (osStatusFlag && osMonthsFlag) {
            survivalTypes.push({
                id: UniqueKey.OVERALL_SURVIVAL,
                title: 'Overall Survival',
                associatedAttrs: [OS_STATUS, OS_MONTHS],
                filter: ['DECEASED'],
                alteredGroup: [],
                unalteredGroup: []
            });

        }
        if (dfsStatusFlag && dfsMonthsFlag) {
            survivalTypes.push({
                id: UniqueKey.DISEASE_FREE_SURVIVAL,
                title: 'Disease Free Survival',
                associatedAttrs: [DFS_STATUS, DFS_MONTHS],
                filter: ['Recurred/Progressed', 'Recurred'],
                alteredGroup: [],
                unalteredGroup: []
            });
        }

        return survivalTypes;
    }

    public getSurvivalData(chartMeta: ChartMeta):MobxPromise<any> {
        return remoteData<any>({
            await: () => [this.survivalPlotData],
            invoke: async () => {
                return _.find(this.survivalPlots, (survivalPlot) => {
                    return survivalPlot.id === chartMeta.uniqueKey;
                }) || {};
            },
            default: {}
        });
    }
    readonly survivalPlotData = remoteData<SurvivalType[]>({
        await: () => [this.survivalData, this.selectedPatientKeys, this.unSelectedPatientKeys],
        invoke: async () => {

            return this.survivalPlots.map(obj => {
                obj.alteredGroup = getPatientSurvivals(
                    this.survivalData.result,
                    this.selectedPatientKeys.result!, obj.associatedAttrs[0], obj.associatedAttrs[1], s => obj.filter.indexOf(s) !== -1);
                obj.unalteredGroup = getPatientSurvivals(
                    this.survivalData.result,
                    this.unSelectedPatientKeys.result!, obj.associatedAttrs[0], obj.associatedAttrs[1], s => obj.filter.indexOf(s) !== -1);
                return obj
            });
        },
        default: []
    });

    readonly survivalData = remoteData<{ [id: string]: ClinicalData[] }>({
        await: () => [this.clinicalAttributes, this.samples],
        invoke: async () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: _.flatten(this.survivalPlots.map(obj => obj.associatedAttrs)),
                identifiers: _.map(this.samples.result!, obj => {
                    return {
                        "entityId": obj.patientId,
                        "studyId": obj.studyId
                    }
                })
            };

            let data = await defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: "PATIENT",
                clinicalDataMultiStudyFilter: filter
            })

            return _.groupBy(data, 'uniquePatientKey')
        },
        default: {}
    });

    readonly mutationCountVsFractionGenomeAlteredData = remoteData({
        await:()=>[this.clinicalAttributes, this.samples],
        invoke: async ()=>{
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: [MUTATION_COUNT, FRACTION_GENOME_ALTERED],
                identifiers: _.map(this.samples.result!, obj => {
                    return {
                        "entityId": obj.sampleId,
                        "studyId": obj.studyId
                    }
                })
            };

            let data:ClinicalData[] = await defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: "SAMPLE",
                clinicalDataMultiStudyFilter: filter
            });

            return _.reduce(_.groupBy(data, datum => datum.uniqueSampleKey), (acc, data) => {
                if (data.length == 2) { // 2 => number of attribute ids
                    let _datum: IStudyViewScatterPlotData = {
                        studyId: data[0].studyId,
                        sampleId: data[0].sampleId,
                        patientId: data[0].patientId,
                        uniqueSampleKey: data[0].uniqueSampleKey,
                        x: 0,
                        y: 0
                    };
                    _.forEach(data, datum => {
                        if (datum.clinicalAttributeId === MUTATION_COUNT) {
                            _datum.y = Number(datum.value)
                        } else if (datum.clinicalAttributeId === FRACTION_GENOME_ALTERED) {
                            _datum.x = Number(datum.value)
                        }
                    });
                    acc.push(_datum)
                }
                return acc
            }, [] as IStudyViewScatterPlotData[]);
        }
    });

    readonly getDataForClinicalDataTab = remoteData({
        await: () => [this.clinicalAttributes, this.selectedSamples],
        invoke: async () => {
            // { [attributeId: string]: { [attributeId: string]: string; } }
            let sampleClinicalDataMap: { [attributeId: string]: { [attributeId: string]: string; } } = await this.clinicalDataCache.get(this.selectedSamples.result)
            return _.reduce(this.selectedSamples.result, (acc, next) => {

                let sampleData: { [attributeId: string]: string; } = {
                    studyId: next.studyId,
                    patientId: next.patientId,
                    sampleId: next.sampleId,
                    ...(sampleClinicalDataMap[next.uniqueSampleKey] || {})
                };

                acc.push(sampleData);
                return acc;
            }, [] as { [id: string]: string }[]);
        },
        default: []
    });

    @bind
    public async getDownloadDataPromise() {

        let sampleClinicalDataMap = await this.clinicalDataCache.get(this.selectedSamples.result)

        let clinicalAttributesNameSet = _.reduce(this.clinicalAttributes.result, (acc, next) => {
            let id = (next.patientAttribute ? 'PATIENT' : 'SAMPLE') + '_' + next.clinicalAttributeId;
            acc[id] = next.displayName;
            return acc;
        }, {
            studyId: 'Study ID',
            patientId: 'Patient ID',
            sampleId: 'Sample ID',
        } as { [id: string]: string })

        let dataRows = _.reduce(this.selectedSamples.result, (acc, next) => {

            let sampleData: { [attributeId: string]: string; } = {
                studyId: next.studyId,
                patientId: next.patientId,
                sampleId: next.sampleId,
                ...(sampleClinicalDataMap[next.uniqueSampleKey] || {})
            };

            acc.push(
                _.map(Object.keys(clinicalAttributesNameSet), (attributrId) => {
                    return sampleData[attributrId] || 'NA';
                })
            );
            return acc;
        }, [_.values(clinicalAttributesNameSet)]);

        return dataRows.map(mutation => mutation.join('\t')).join('\n');
    }

    @bind
    onSubmitQuery() {

        //TODO: support virtual study. wait for https://github.com/cBioPortal/cbioportal-frontend/pull/1386
        let formOps: { [id: string]: string } = {
            cancer_study_list: this.studyIds.join(','),
            tab_index: 'tab_visualize',
        }

        if (this.studyIds.length === 1) {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                formOps['genetic_profile_ids_PROFILE_MUTATION_EXTENDED'] = this.mutationProfiles.result[0].molecularProfileId
            }
            if (!_.isEmpty(this.cnaProfileIds)) {
                formOps['genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'] = this.cnaProfileIds[0]
            }
        } else {

            let data_priority = '0';
            let { mutation, cna } = {
                mutation: !_.isEmpty(this.mutationProfiles.result),
                cna: !_.isEmpty(this.cnaProfileIds)
            };
            if (mutation && cna)
                data_priority = '0';
            else if (mutation)
                data_priority = '1';
            else if (cna)
                data_priority = '2';
            formOps.data_priority = data_priority;
        }

        if (isFiltered(this.filters)) {
            formOps.case_set_id = '-1'
            formOps.case_ids = _.map(this.selectedSamples.result, sample => {
                return sample.studyId + ":" + sample.sampleId;
            }).join('+');
        } else {
            if (this.studyIds.length === 1) {
                formOps.case_set_id = this.studyIds[0] + '_all';
            } else {
                formOps.case_set_id = 'all';
            }
        }

        if (!_.isEmpty(this.geneQueries)) {
            formOps.Action = 'Submit';
            formOps.gene_list = this.geneQueries.map(query => unparseOQLQueryLine(query)).join('\n');
        }

        formSubmit('index.do', formOps, "_blank", 'post');
    }
}


//this could be used in clinical data tab
class ClinicalDataCache {

    private cache: { [uniqueSampleKey: string]: { [attributeId: string]: string } } = {};

    private fetchedSamplesUniqueKeySet: { [id: string]: boolean } = {};

    public async get(samples: Sample[]) {
        const samplesToFetchData = _.filter(samples, sample => {
            return _.isUndefined(this.fetchedSamplesUniqueKeySet[sample.uniqueSampleKey]);
        })

        if (!_.isEmpty(samplesToFetchData)) { // empty indicates data is already fetched

            let sampleClinicalData = await defaultClient.fetchClinicalDataUsingPOST({
                'clinicalDataType': "SAMPLE",
                'clinicalDataMultiStudyFilter': {
                    'identifiers': _.map(samplesToFetchData, sample => {
                        return {
                            entityId: sample.sampleId,
                            studyId: sample.studyId
                        }
                    })
                } as ClinicalDataMultiStudyFilter
            });

            _.forEach(sampleClinicalData, clinicalData => {
                this.cache[clinicalData.uniqueSampleKey] = { ...(this.cache[clinicalData.uniqueSampleKey] || {}), ['SAMPLE_' + clinicalData.clinicalAttributeId]: clinicalData.value };
            })

            let patientClinicalData = await defaultClient.fetchClinicalDataUsingPOST({
                'clinicalDataType': "PATIENT",
                'clinicalDataMultiStudyFilter': {
                    'identifiers': _.map(samplesToFetchData, sample => {
                        return {
                            entityId: sample.patientId,
                            studyId: sample.studyId
                        }
                    })
                } as ClinicalDataMultiStudyFilter
            });

            const patientSamplesMap = _.groupBy(samples, sample => sample.uniquePatientKey);

            _.forEach(patientClinicalData, clinicalData => {
                (patientSamplesMap[clinicalData.uniquePatientKey] || []).forEach(sample => {
                    this.cache[sample.uniqueSampleKey] = { ...(this.cache[sample.uniqueSampleKey] || {}), ['PATIENT_' + clinicalData.clinicalAttributeId]: clinicalData.value };
                });
            })

            //update fetched samples set
            samplesToFetchData.forEach(sample => {
                this.fetchedSamplesUniqueKeySet[sample.uniqueSampleKey] = true;
            })
        }

        return _.reduce(samples, (acc, sample) => {
            if (!_.isUndefined(this.cache[sample.uniqueSampleKey])) {
                acc[sample.uniqueSampleKey] = this.cache[sample.uniqueSampleKey]
            }
            return acc
        }, {} as { [key: string]: { [attributeId: string]: string } })

    }
}