import * as _ from 'lodash';
import {remoteData} from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {action, computed, observable, ObservableMap, reaction} from "mobx";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    ClinicalDataIntervalFilter,
    ClinicalDataIntervalFilterValue,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    DataBin,
    MolecularProfileSampleCount,
    MutationCountByGene,
    MutationGeneFilter,
    Sample,
    SampleIdentifier,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeFilter,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    Gene,
    MolecularProfile,
    MolecularProfileFilter,
    Patient,
    PatientFilter,
    SampleFilter
} from 'shared/api/generated/CBioPortalAPI';
import {PatientSurvival} from 'shared/model/PatientSurvival';
import {getPatientSurvivals} from 'pages/resultsView/SurvivalStoreHelper';
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';
import StudyViewClinicalDataBinCountsCache from "shared/cache/StudyViewClinicalDataBinCountsCache";
import {
    ALWAYS_SHOWN_ATTRS,
    calculateLayout,
    getClinicalAttributeUniqueKey,
    getClinicalDataIntervalFilterValues,
    getClinicalDataType,
    getCNAByAlteration,
    getDefaultChartTypeByClinicalAttribute,
    getDefaultPriorityByUniqueKey,
    getQValue,
    isFiltered,
    isLogScaleByDataBins,
    isPreSelectedClinicalAttr,
    makePatientToClinicalAnalysisGroup,
    generateScatterPlotDownloadData,
    NA_DATA, ONE_GRID_TABLE_ROWS, PIE_TO_TABLE_LIMIT,
    COLORS, NA_COLOR,
    getSamplesByExcludingFiltersOnChart,
    getFilteredSampleIdentifiers,
    UNSELECTED_GROUP_COLOR, SELECTED_GROUP_COLOR,
    showOriginStudiesInSummaryDescription,
    getFilteredStudiesWithSamples,
    submitToPage
} from './StudyViewUtils';
import MobxPromise from 'mobxpromise';
import {SingleGeneQuery} from 'shared/lib/oql/oql-parser';
import {bind} from '../../../node_modules/bind-decorator';
import {updateGeneQuery} from 'pages/studyView/StudyViewUtils';
import {stringListToSet} from 'shared/lib/StringUtils';
import {unparseOQLQueryLine} from 'shared/lib/oql/oqlfilter';
import {IStudyViewScatterPlotData} from "./charts/scatterPlot/StudyViewScatterPlot";
import sessionServiceClient from "shared/api//sessionServiceInstance";
import {VirtualStudy} from 'shared/model/VirtualStudy';
import windowStore from 'shared/components/window/WindowStore';
import {Layout} from 'react-grid-layout';
import {getHeatmapMeta} from "../../shared/lib/MDACCUtils";

export type ClinicalDataType = 'SAMPLE' | 'PATIENT';

export enum ChartTypeEnum {
    PIE_CHART = 'PIE_CHART',
    BAR_CHART = 'BAR_CHART',
    SURVIVAL = 'SURVIVAL',
    TABLE = 'TABLE',
    SCATTER = 'SCATTER',
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE',
    NONE = 'NONE'
}

export type ChartType = 'PIE_CHART' | 'BAR_CHART' | 'SURVIVAL' | 'TABLE' | 'SCATTER' | 'MUTATED_GENES_TABLE' | 'CNA_GENES_TABLE' | 'NONE';

export enum UniqueKey {
    SELECT_CASES_BY_IDS = 'CUSTOM_FILTERS',
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE',
    MUTATION_COUNT_CNA_FRACTION = 'MUTATION_COUNT_CNA_FRACTION',
    DISEASE_FREE_SURVIVAL = 'DFS_SURVIVAL',
    OVERALL_SURVIVAL = 'OS_SURVIVAL',
    SAMPLES_PER_PATIENT = 'SAMPLES_PER_PATIENT',
    WITH_MUTATION_DATA = 'WITH_MUTATION_DATA',
    WITH_CNA_DATA = 'WITH_CNA_DATA'
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
    dimension: ChartDimension,
    priority: number,
    chartType: ChartType
}

export const CUSTOM_CHART_KEYS = [UniqueKey.SAMPLES_PER_PATIENT, UniqueKey.WITH_CNA_DATA, UniqueKey.WITH_MUTATION_DATA];

export const SpecialCharts: ChartMeta[] = [{
    uniqueKey: UniqueKey.SELECT_CASES_BY_IDS,
    displayName: 'Select by IDs',
    description: 'Select by IDs',
    dimension: {
        w: 0,
        h: 0
    },
    priority: 0,
    chartType: ChartTypeEnum.NONE
},{
    uniqueKey: UniqueKey.SAMPLES_PER_PATIENT,
    displayName: '# of Samples Per Patient',
    description: '# of Samples Per Patient',
    chartType: ChartTypeEnum.PIE_CHART,
    dimension: {
        w: 1,
        h: 1
    },
    priority: 0
},
{
    uniqueKey: UniqueKey.WITH_MUTATION_DATA,
    displayName: 'With Mutation Data',
    description: 'With Mutation Data',
    chartType: ChartTypeEnum.PIE_CHART,
    dimension: {
        w: 1,
        h: 1
    },
    priority: 0
},
{
    uniqueKey: UniqueKey.WITH_CNA_DATA,
    displayName: 'With CNA Data',
    description: 'With CNA Data',
    chartType: ChartTypeEnum.PIE_CHART,
    dimension: {
        w: 1,
        h: 1
    },
    priority: 0
}];

export type ChartDimension = {
    w: number,
    h: number
}

export type StudyViewPageLayoutProps = {
    layout: Layout[],
    cols: number,
    rowHeight: number,
    grid: ChartDimension,
    dimensions:  {[chartType in ChartType]: ChartDimension}
}

export const DEFAULT_LAYOUT_PROPS:StudyViewPageLayoutProps ={
    layout: [],
    cols: 6,
    rowHeight: 200,
    grid: {
        w: 205,
        h: 200
    },
    dimensions: {
        [ChartTypeEnum.PIE_CHART]: {
            w: 1,
            h: 1
        },
        [ChartTypeEnum.BAR_CHART]: {
            w: 2,
            h: 1
        },
        [ChartTypeEnum.SCATTER]: {
            w: 2,
            h: 2
        },
        [ChartTypeEnum.TABLE]: {
            w: 2,
            h: 2
        },
        [ChartTypeEnum.SURVIVAL]: {
            w: 2,
            h: 2
        },
        [ChartTypeEnum.MUTATED_GENES_TABLE]: {
            w: 2,
            h: 2
        },
        [ChartTypeEnum.CNA_GENES_TABLE]: {
            w: 2,
            h: 2
        },
        [ChartTypeEnum.NONE]: {
            w: 0,
            h: 0
        }
    }
};
export type StudyWithSamples = CancerStudy & {
    uniqueSampleKeys : string[]
}
export const ClinicalDataTypeConstants: {[key: string]: ClinicalDataType}= {
    SAMPLE: 'SAMPLE',
    PATIENT: 'PATIENT'
};

export const ClinicalAttributeDataTypeConstants = {
    STRING: 'STRING',
    NUMBER: 'NUMBER'
};

export const DataBinMethodConstants: {[key: string]: 'DYNAMIC' | 'STATIC'}= {
    STATIC: 'STATIC',
    DYNAMIC: 'DYNAMIC'
};

export type StudyViewFilterWithSampleIdentifierFilters = StudyViewFilter & {
    sampleIdentifiersSet: { [id: string]: SampleIdentifier[] }
}

export class StudyViewPageStore {

    constructor() {
        reaction(()=>this.filters, ()=>this.clearAnalysisGroupsSettings()); // whenever any data filters change, reset survival analysis settings
    }

    public studyViewClinicalDataCountsCache = new StudyViewClinicalDataCountsCache();
    public studyViewClinicalDataBinCountsCache = new StudyViewClinicalDataBinCountsCache();

    @observable studyIds: string[] = [];

    @computed get studyIdsSet() {
        return stringListToSet(this.studyIds);
    }

    private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();
    private _clinicalDataIntervalFilterSet = observable.map<ClinicalDataIntervalFilter>();

    @observable private logScaleState = observable.map<boolean>();

    @observable.ref private _mutatedGeneFilter: MutationGeneFilter[] = [];

    @observable.ref private _cnaGeneFilter: CopyNumberGeneFilter[] = [];

    @observable private _chartVisibility = observable.map<boolean>();

    @observable geneQueryStr: string;

    @observable private geneQueries: SingleGeneQuery[] = [];

    @observable private queriedGeneSet = observable.map<boolean>();

    @observable private chartsDimension = observable.map<ChartDimension>();

    @observable private chartsType = observable.map<ChartType>();

    @computed
    get containerWidth(): number {
        return this.studyViewPageLayoutProps.cols * DEFAULT_LAYOUT_PROPS.grid.w;
    }

    @computed
    get studyViewPageLayoutProps(): StudyViewPageLayoutProps {
        let cols:number = Math.floor(windowStore.size.width / DEFAULT_LAYOUT_PROPS.grid.w);
        return {
            cols: cols,
            rowHeight: DEFAULT_LAYOUT_PROPS.grid.h,
            grid: DEFAULT_LAYOUT_PROPS.grid,
            layout: calculateLayout(this.visibleAttributes, cols),
            dimensions: DEFAULT_LAYOUT_PROPS.dimensions
        };
    }

    private clinicalDataCache:ClinicalDataCache = new ClinicalDataCache()

    @observable.ref private _analysisGroupsClinicalAttribute:ClinicalAttribute|undefined;
    @observable.ref private _analysisGroups:ReadonlyArray<AnalysisGroup>|undefined;

    private _chartSampleIdentifiersFilterSet =  observable.map<SampleIdentifier[]>();

    private _customChartFilterSet =  observable.map<string[]>();

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
    clearChartSampleIdentifierFilter(chartMeta: ChartMeta) {
        this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
        this._customChartFilterSet.delete(chartMeta.uniqueKey)
    }

    @action
    clearAllFilters() {
        this._clinicalDataEqualityFilterSet.clear();
        this._clinicalDataIntervalFilterSet.clear();
        this.clearGeneFilter();
        this.clearCNAGeneFilter();
        this._chartSampleIdentifiersFilterSet.clear();
        this._customChartFilterSet.clear();
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
            // unselected goes on bottom, selected should be rendered on top
            return {
                groups: [{
                    value: UNSELECTED_ANALYSIS_GROUP_VALUE,
                    color: UNSELECTED_GROUP_COLOR,
                    legendText: "Unselected patients"
                },{
                    value: SELECTED_ANALYSIS_GROUP_VALUE,
                    color: SELECTED_GROUP_COLOR,
                    legendText: "Selected patients"
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
                clinicalDataType: getClinicalDataType(chartMeta.clinicalAttribute!.patientAttribute),
                values: values.sort()
            };
            this._clinicalDataEqualityFilterSet.set(chartMeta.uniqueKey, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @action
    updateClinicalDataIntervalFilters(chartMeta: ChartMeta, dataBins: DataBin[]) {
        const values: ClinicalDataIntervalFilterValue[] = getClinicalDataIntervalFilterValues(dataBins);
        this.updateClinicalDataIntervalFiltersByValues(chartMeta, values);
    }

    @action
    updateClinicalDataIntervalFiltersByValues(chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) {
        if (values.length > 0) {
            const clinicalDataIntervalFilter = {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                clinicalDataType: getClinicalDataType(chartMeta.clinicalAttribute!.patientAttribute),
                values: values
            };
            this._clinicalDataIntervalFilterSet.set(chartMeta.uniqueKey, clinicalDataIntervalFilter);

        } else {
            this._clinicalDataIntervalFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @action
    addGeneFilters(entrezGeneIds: number[]) {
        this._mutatedGeneFilter = [...this._mutatedGeneFilter, {entrezGeneIds: entrezGeneIds}];
    }

    @action
    removeGeneFilter(toBeRemoved: number) {
        this._mutatedGeneFilter = _.reduce(this._mutatedGeneFilter, (acc, next) => {
            const newGroup = _.reduce(next.entrezGeneIds, (list, entrezGeneId) => {
                if (entrezGeneId !== toBeRemoved) {
                    list.push(entrezGeneId);
                }
                return list;
            }, [] as number[]);
            if (newGroup.length > 0) {
                acc.push({
                    entrezGeneIds: newGroup
                });
            }
            return acc;
        }, [] as MutationGeneFilter[]);
    }

    @action resetGeneFilter() {
        if(this._mutatedGeneFilter.length > 0) {
            this._mutatedGeneFilter = [];
        }
    }

    @action
    updateChartSampleIdentifierFilter(chartKey:string, cases: SampleIdentifier[], keepCurrent?:boolean) {

        let newSampleIdentifiers:SampleIdentifier[] = cases;
        const newSampleIdentifiersMap = _.keyBy(newSampleIdentifiers, s=>`${s.studyId}:${s.sampleId}`);
        if (keepCurrent) {
            // if we should keep the current selection, go through and add samples back, taking care not to duplicate
            newSampleIdentifiers = _.reduce(this._chartSampleIdentifiersFilterSet.get(chartKey)|| [],(acc, s)=>{
                if (!(`${s.studyId}:${s.sampleId}` in newSampleIdentifiersMap)) {
                    acc.push(s);
                }
                return acc
            }, newSampleIdentifiers);
        }

        if(_.isEmpty(newSampleIdentifiers)){
            this._chartSampleIdentifiersFilterSet.delete(chartKey)
        } else {
            this._chartSampleIdentifiersFilterSet.set(chartKey,newSampleIdentifiers)
        }
    }

    public getChartSampleIdentifiersFilter(chartKey:string) {
        //return this._sampleIdentifiers;
        return this._chartSampleIdentifiersFilterSet.get(chartKey)|| [];
    }

    public getCustomChartFilters(chartKey:string) {
        return this._customChartFilterSet.get(chartKey)|| [];
    }

    @action
    addCNAGeneFilters(filters: CopyNumberGeneFilterElement[]) {
        this._cnaGeneFilter = [...this._cnaGeneFilter, {alterations: filters}];
    }

    @action
    removeCNAGeneFilters(toBeRemoved: CopyNumberGeneFilterElement) {
        this._cnaGeneFilter = _.reduce(this._cnaGeneFilter, (acc, next) => {
            const newGroup = _.reduce(next.alterations, (list, filter) => {
                if (filter.entrezGeneId !== toBeRemoved.entrezGeneId && filter.alteration !== toBeRemoved.alteration) {
                    list.push(filter);
                }
                return list;
            }, [] as CopyNumberGeneFilterElement[]);
            if (newGroup.length > 0) {
                acc.push({
                    alterations: newGroup
                });
            }
            return acc;
        }, [] as CopyNumberGeneFilter[]);
    }

    @action
    resetCNAGeneFilter() {
        if(this._cnaGeneFilter.length > 0) {
            this._cnaGeneFilter = [];
        }
    }

    @action
    changeChartVisibility(uniqueKey:string, visible: boolean) {
        if(visible){
            this._chartVisibility.set(uniqueKey, true);
        } else {
            this._chartVisibility.delete(uniqueKey);
        }
    }

    @action
    resetFilterAndChangeChartVisibility(chartMeta: ChartMeta, visible: boolean) {
        if (!visible) {
            switch (chartMeta.chartType) {
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                    this.resetGeneFilter();
                    break;
                case ChartTypeEnum.CNA_GENES_TABLE:
                    this.resetCNAGeneFilter();
                    break;
                case ChartTypeEnum.SCATTER:
                    this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
                    break;
                case ChartTypeEnum.SURVIVAL:
                    break;
                default:
                    this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
                    this._clinicalDataIntervalFilterSet.delete(chartMeta.uniqueKey);
                    break;
            }
        }
        this.changeChartVisibility(chartMeta.uniqueKey, visible);
    }

    @action
    toggleLogScale(chartMeta: ChartMeta) {
        // reset filters before toggling
        this.updateClinicalDataIntervalFilters(chartMeta, []);

        // then toggle
        if (this.logScaleState.get(chartMeta.uniqueKey) === undefined) {
            this.logScaleState.set(chartMeta.uniqueKey, false);
        }
        else {
            this.logScaleState.set(chartMeta.uniqueKey, !this.logScaleState.get(chartMeta.uniqueKey));
        }
    }

    public isLogScaleToggleVisible(uniqueKey: string, dataBins?: DataBin[]) {
        return (
            this.logScaleState.get(uniqueKey) !== undefined ||
            isLogScaleByDataBins(dataBins)
        );
    }

    public isLogScaleDisabled(uniqueKey: string) {
        return this.logScaleState.get(uniqueKey) === false;
    }

    public isLogScaleChecked(uniqueKey: string) {
        return this.logScaleState.get(uniqueKey) !== false;
    }

    @action updateChartsVisibility(visibleChartIds:string[]){
        _.each(this._chartVisibility.keys(),chartId=>{
            if(!_.includes(visibleChartIds,chartId) || !this._chartVisibility.get(chartId)){
                // delete it instead of setting it to false
                // because adding chart back would insert in middle instead of appending at last
                this._chartVisibility.delete(chartId);
            }
        })
        _.each(visibleChartIds,attributeId=>{
            this._chartVisibility.set(attributeId,true);
        })
    }

    @computed get clinicalDataEqualityFilters() {
        return this._clinicalDataEqualityFilterSet.values();
    }

    @computed get clinicalDataIntervalFilters() {
        return this._clinicalDataIntervalFilterSet.values();
    }

    @computed
    get filters(): StudyViewFilter {
        const filters: Partial<StudyViewFilter> = {};

        const clinicalDataEqualityFilters = this.clinicalDataEqualityFilters;
        const clinicalDataIntervalFilters = this.clinicalDataIntervalFilters;

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if (clinicalDataEqualityFilters.length > 0) {
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilters;
        }

        if (clinicalDataIntervalFilters.length > 0) {
            filters.clinicalDataIntervalFilters = clinicalDataIntervalFilters;
        }

        if (this._mutatedGeneFilter.length > 0) {
            filters.mutatedGenes = this._mutatedGeneFilter;;
        }

        if (this._cnaGeneFilter.length > 0) {
            filters.cnaGenes = this._cnaGeneFilter;
        }

        let _sampleIdentifiers =_.reduce(this._chartSampleIdentifiersFilterSet.entries(),(acc, next, key)=>{
            let [chartKey,sampleIdentifiers] = next
            if(key === 0){
                acc = sampleIdentifiers
            } else {
                acc = _.intersectionWith(acc,sampleIdentifiers, _.isEqual) as SampleIdentifier[];
            }
            return acc
        },[] as SampleIdentifier[]);

        if(_sampleIdentifiers && _sampleIdentifiers.length>0) {
            filters.sampleIdentifiers = _sampleIdentifiers;
        } else {
            if(_.isEmpty(this.queriedSampleIdentifiers.result)){
                filters.studyIds = this.queriedPhysicalStudyIds.result;
            } else {
                filters.sampleIdentifiers = this.queriedSampleIdentifiers.result;
            }
        }

        return filters as StudyViewFilter;
    }

    @computed
    get userSelections() {

        let sampleIdentifiersSet:{[id:string]:SampleIdentifier[]} = this._chartSampleIdentifiersFilterSet.toJS()
        //let filters:StudyViewFilterWithCustomFilters =  Object.assign({}, this.filters,  {sampleIdentifiersSet:sampleIdentifiersSet})

        return {...this.filters, sampleIdentifiersSet}

    }

    public getMutatedGenesTableFilters(): number[] {
        return _.flatMap(this._mutatedGeneFilter, filter => filter.entrezGeneIds);
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return _.flatMap(this._cnaGeneFilter, filter => filter.alterations);
    }

    public getClinicalDataFiltersByUniqueKey(uniqueKey: string): string[] {
        const filter = this._clinicalDataEqualityFilterSet.get(uniqueKey);
        return filter ? filter.values : [];
    }

    public getClinicalDataIntervalFiltersByUniqueKey(uniqueKey: string): ClinicalDataIntervalFilterValue[] {
        const result = this._clinicalDataIntervalFilterSet.get(uniqueKey);
        return result ? result.values : [];
    }

    public getDefaultInitialDataBinCounts(attribute: ClinicalAttribute) {
        return this.studyViewClinicalDataBinCountsCache.get(
            { attribute: attribute, filters: { studyIds: this.queriedPhysicalStudyIds.result } as any, method: DataBinMethodConstants.STATIC, disableLogScale: false });
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        await: ()=>[this.queriedPhysicalStudyIds],
        invoke: async () => {
            return await defaultClient.fetchMolecularProfilesUsingPOST({
                molecularProfileFilter: {
                    studyIds: this.queriedPhysicalStudyIds.result
                } as MolecularProfileFilter
            })
        },
        default: []
    });


    readonly allPhysicalStudies = remoteData({
        invoke: async () => {
            return await defaultClient.getAllStudiesUsingGET({ projection: 'SUMMARY' });
        },
        default: []
    });

    readonly physicalStudiesSet = remoteData<{[id:string]:CancerStudy}>({
        await: ()=>[this.allPhysicalStudies],
        invoke: async () => {
            return _.keyBy(this.allPhysicalStudies.result, s=>s.studyId);
        },
        default: {}
    });

    // contains queried physical studies
    readonly filteredPhysicalStudies = remoteData({
        await: ()=>[this.physicalStudiesSet],
        invoke: async () => {
            const physicalStudiesSet = this.physicalStudiesSet.result;
            return _.reduce(this.studyIds, (acc: CancerStudy[], next) => {
                if (physicalStudiesSet[next]) {
                    acc.push(physicalStudiesSet[next]);
                }
                return acc;
            }, []);
        },
        default: []
    });

    // contains queried vaild virtual studies
    readonly filteredVirtualStudies = remoteData({
        await: () => [this.filteredPhysicalStudies],
        invoke: async () => {
            if (this.filteredPhysicalStudies.result.length === this.studyIds.length) {
                return [];
            }
            let filteredVirtualStudies: VirtualStudy[] = [];
            let validFilteredPhysicalStudyIds = this.filteredPhysicalStudies.result.map(study => study.studyId);
            let virtualStudyIds = _.filter(this.studyIds, id => !_.includes(validFilteredPhysicalStudyIds, id));

            await Promise.all(virtualStudyIds.map(id =>
                sessionServiceClient
                    .getVirtualStudy(id)
                    .then((res) => {
                        filteredVirtualStudies.push(res);
                    })
                    .catch(error => { /*do nothing*/ })
            ));
            return filteredVirtualStudies;
        },
        default: []
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudies = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {

            const physicalStudiesSet = this.physicalStudiesSet.result;

            let studies = _.reduce(this.filteredPhysicalStudies.result, (acc, next) => {
                acc[next.studyId] = physicalStudiesSet[next.studyId];
                return acc;
            }, {} as { [id: string]: CancerStudy })

            this.filteredVirtualStudies.result.forEach(virtualStudy => {
                virtualStudy.data.studies.forEach(study => {
                    if (!studies[study.id]) {
                        studies[study.id] = physicalStudiesSet[study.id];
                    }
                })
            });
            return _.values(studies);
        },
        default: []
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudyIds = remoteData({
        await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            return Promise.resolve(_.map(this.queriedPhysicalStudies.result, study => study.studyId));
        },
        default: []
    });

    readonly queriedSampleIdentifiers = remoteData<SampleIdentifier[]>({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {

            let result = _.reduce(this.filteredVirtualStudies.result, (acc, next) => {
                next.data.studies.forEach(study => {
                    let samples = study.samples;
                    if (acc[study.id]) {
                        samples = _.union(acc[study.id], samples);
                    }
                    acc[study.id] = samples;
                })
                return acc;
            }, {} as { [id: string]: string[] });

            if (!_.isEmpty(result)) {

                result = _.reduce(this.filteredPhysicalStudies.result, (acc, next) => {
                    acc[next.studyId] = [];
                    return acc;
                }, result);

                let studySamplesToFetch = _.reduce(result, (acc, samples, studyId) => {
                    if (samples.length === 0) {
                        acc.push(studyId);
                    }
                    return acc;
                }, [] as string[])

                await Promise.all(_.map(studySamplesToFetch, studyId => {
                    return defaultClient.getAllSamplesInStudyUsingGET({
                        studyId: studyId
                    }).then(samples => {
                        result[studyId] = samples.map(sample => sample.sampleId);
                    })
                }))
            }

            return _.flatten(_.map(result, (samples, studyId) =>
                samples.map(sampleId => {
                    return {
                        sampleId,
                        studyId
                    }
                })
            ));
        },
        default: []
    });

    // all queried studies, includes both physcial and virtual studies
    // this is used in page header(name and description)
    readonly displayedStudies = remoteData({
        await: () => [this.filteredVirtualStudies, this.filteredPhysicalStudies, this.queriedPhysicalStudies],
        invoke: async () => {
            if (this.filteredPhysicalStudies.result.length === 0 && this.filteredVirtualStudies.result.length === 1) {

                const virtualStudy = this.filteredVirtualStudies.result[0]
                return [{
                    name: virtualStudy.data.name,
                    description: virtualStudy.data.description,
                    studyId: virtualStudy.id,
                } as CancerStudy]
            } else {
                return this.queriedPhysicalStudies.result;
            }
        },
        default: []
    });

    @computed get showOriginStudiesInSummaryDescription() {
        return showOriginStudiesInSummaryDescription(this.filteredPhysicalStudies.result, this.filteredVirtualStudies.result);
    }

    // origin/parent studies to be shown in summary description
    // this would be empty in all cases except if only one virtual study in queried
    readonly originStudies = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {
            let studies: CancerStudy[] = [];
            if(this.showOriginStudiesInSummaryDescription) {
                const originStudyIds = this.filteredVirtualStudies.result[0].data.origin;
                const virtualStudyIds: string[] = [];
                const physicalStudiesSet = this.physicalStudiesSet.result;
                _.each(originStudyIds, studyId => {
                    if (physicalStudiesSet[studyId]) {
                        studies.push(physicalStudiesSet[studyId]);
                    } else {
                        virtualStudyIds.push(studyId);
                    }
                })
                await Promise.all(virtualStudyIds.map(id =>
                    sessionServiceClient
                        .getVirtualStudy(id)
                        .then((virtualStudy) => {
                            studies.push({
                                name: virtualStudy.data.name,
                                description: virtualStudy.data.description,
                                studyId: virtualStudy.id,
                            } as CancerStudy);
                        })
                        .catch(error => { /*do nothing*/ })
                ));
            }
            return studies;
        },
        default: []
    });

    readonly unknownQueriedIds = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {
            let validIds:string[] = [];
            _.each(this.filteredPhysicalStudies.result,study => validIds.push(study.studyId));
            _.each(this.filteredVirtualStudies.result,study => validIds.push(study.id));
            return _.filter(this.studyIds, id => !_.includes(validIds, id));
        },
        default: []
    });

    readonly mutationProfiles = remoteData({
        await: ()=>[this.molecularProfiles],
        invoke: async ()=>{
            return this.molecularProfiles.result.filter(profile => profile.molecularAlterationType === "MUTATION_EXTENDED")
        },
        default: [],
        onResult:(mutationProfiles)=>{
            if (!_.isEmpty(mutationProfiles)) {
                this._chartVisibility.set(UniqueKey.MUTATED_GENES_TABLE, true);
                this.chartsType.set(UniqueKey.MUTATED_GENES_TABLE, ChartTypeEnum.MUTATED_GENES_TABLE);
                this.chartsDimension.set(UniqueKey.MUTATED_GENES_TABLE, DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.MUTATED_GENES_TABLE])
            }
        }
    });


    readonly cnaProfiles = remoteData({
        await: ()=>[this.molecularProfiles],
        invoke: async ()=>{
            return  this.molecularProfiles
            .result
            .filter(profile => profile.molecularAlterationType === "COPY_NUMBER_ALTERATION" && profile.datatype === "DISCRETE")

        },
        default: [],
        onResult:(cnaProfiles)=>{
            if (!_.isEmpty(cnaProfiles)) {
                this._chartVisibility.set(UniqueKey.CNA_GENES_TABLE, true);
                this.chartsType.set(UniqueKey.CNA_GENES_TABLE, ChartTypeEnum.CNA_GENES_TABLE);
                this.chartsDimension.set(UniqueKey.CNA_GENES_TABLE, DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.CNA_GENES_TABLE])
            }
        }
    });

    readonly clinicalAttributes = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => defaultClient.fetchClinicalAttributesUsingPOST({
            studyIds: this.queriedPhysicalStudyIds.result
        }),
        default: [],
        onResult:(clinicalAttributes)=>{
            // TODO: this is a temorary solution util we figure out the chartVisibility logic
            let osStatusFlag = false;
            let osMonthsFlag = false;
            let dfsStatusFlag = false;
            let dfsMonthsFlag = false;
            let mutationCountFlag = false;
            let fractionGenomeAlteredFlag = false;

            clinicalAttributes.forEach(obj => {
                if (obj.clinicalAttributeId === OS_STATUS) {
                    osStatusFlag = true;
                } else if (obj.clinicalAttributeId === OS_MONTHS) {
                    osMonthsFlag = true;
                } else if (obj.clinicalAttributeId === DFS_STATUS) {
                    dfsStatusFlag = true;
                } else if (obj.clinicalAttributeId === DFS_MONTHS) {
                    dfsMonthsFlag = true;
                } else  if (MUTATION_COUNT === obj.clinicalAttributeId) {
                    mutationCountFlag = true;
                } else  if (FRACTION_GENOME_ALTERED === obj.clinicalAttributeId) {
                    fractionGenomeAlteredFlag = true;
                }
                let uniqueKey = getClinicalAttributeUniqueKey(obj);
                let chartType = getDefaultChartTypeByClinicalAttribute(obj);
                this.chartsType.set(uniqueKey, chartType);
                this.chartsDimension.set(uniqueKey, chartType === undefined ? {
                    w: 1,
                    h: 1
                } : DEFAULT_LAYOUT_PROPS.dimensions[chartType]);
            });

            const cancerTypeIds = _.uniq(this.queriedPhysicalStudies.result.map(study=>study.cancerTypeId));

            if (osStatusFlag && osMonthsFlag) {
                this.chartsType.set(UniqueKey.OVERALL_SURVIVAL, ChartTypeEnum.SURVIVAL);
                this.chartsDimension.set(UniqueKey.OVERALL_SURVIVAL, DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.SURVIVAL]);
                // hide OVERALL_SURVIVAL chart if cacner type is mixed or have moer than one cancer type
                if(cancerTypeIds.length === 1 && cancerTypeIds[0] !== 'mixed') {
                    this._chartVisibility.set(UniqueKey.OVERALL_SURVIVAL, true);
                }
            }
            if (dfsStatusFlag && dfsMonthsFlag) {
                this.chartsType.set(UniqueKey.DISEASE_FREE_SURVIVAL, ChartTypeEnum.SURVIVAL);
                this.chartsDimension.set(UniqueKey.DISEASE_FREE_SURVIVAL, DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.SURVIVAL]);
                // hide DISEASE_FREE_SURVIVAL chart if cacner type is mixed or have moer than one cancer type
                if(cancerTypeIds.length === 1 && cancerTypeIds[0] !== 'mixed') {
                    this._chartVisibility.set(UniqueKey.DISEASE_FREE_SURVIVAL, true);
                }
            }

            if (mutationCountFlag && fractionGenomeAlteredFlag) {
                this._chartVisibility.set(UniqueKey.MUTATION_COUNT_CNA_FRACTION, true);
                this.chartsType.set(UniqueKey.MUTATION_COUNT_CNA_FRACTION, ChartTypeEnum.SCATTER);
                this.chartsDimension.set(UniqueKey.MUTATION_COUNT_CNA_FRACTION, DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.SCATTER])
            }
        }
    });

    readonly MDACCHeatmapStudyMeta = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: async () => {
            let isSinglePhysicalStudy = this.queriedPhysicalStudyIds.result.length === 1;
            if (isSinglePhysicalStudy) {
                return await getHeatmapMeta(`//bioinformatics.mdanderson.org/study2url?studyid=${this.queriedPhysicalStudyIds.result[0]}`);
            }
            return [];
        }
    }, []);

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
        
        let _chartMetaSet: { [id: string]: ChartMeta } = _.keyBy(SpecialCharts,(specialChart)=>specialChart.uniqueKey);
        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(this.clinicalAttributes.result, (acc: { [id: string]: ChartMeta }, attribute) => {
            const uniqueKey = getClinicalAttributeUniqueKey(attribute);
            //TODO: currently only piechart is handled
            const chartType = this.chartsType.get(uniqueKey);
            if (chartType !== undefined) {
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    chartType: chartType,
                    description: attribute.description,
                    dimension: this.chartsDimension.get(uniqueKey)!,
                    priority: Number(attribute.priority),
                    clinicalAttribute: attribute
                };
            }
            return acc
        }, _chartMetaSet);


        _.reduce(this.survivalPlots, (acc: { [id: string]: ChartMeta }, survivalPlot) => {
            acc[survivalPlot.id] = {
                uniqueKey: survivalPlot.id,
                chartType: this.chartsType.get(survivalPlot.id)!,
                dimension: this.chartsDimension.get(survivalPlot.id)!,
                displayName: survivalPlot.title,
                priority: getDefaultPriorityByUniqueKey(survivalPlot.id),
                description: ''
            };
            return acc;
        }, _chartMetaSet);

        if (!_.isEmpty(this.mutationProfiles.result!)) {
            _chartMetaSet[UniqueKey.MUTATED_GENES_TABLE] = {
                uniqueKey: UniqueKey.MUTATED_GENES_TABLE,
                chartType: this.chartsType.get(UniqueKey.MUTATED_GENES_TABLE)!,
                dimension: this.chartsDimension.get(UniqueKey.MUTATED_GENES_TABLE)!,
                displayName: 'Mutated Genes',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.MUTATED_GENES_TABLE),
                description: ''
            };
        }

        if (!_.isEmpty(this.cnaProfiles.result)) {
            _chartMetaSet[UniqueKey.CNA_GENES_TABLE] = {
                uniqueKey: UniqueKey.CNA_GENES_TABLE,
                chartType: this.chartsType.get(UniqueKey.CNA_GENES_TABLE)!,
                dimension: this.chartsDimension.get(UniqueKey.CNA_GENES_TABLE)!,
                displayName: 'CNA Genes',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.CNA_GENES_TABLE),
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
                chartType: ChartTypeEnum.SCATTER,
                displayName: 'Mutation count Vs. CNA',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.MUTATION_COUNT_CNA_FRACTION),
                dimension: DEFAULT_LAYOUT_PROPS.dimensions[ChartTypeEnum.SCATTER],
                description: ''
            };
        }
        return _chartMetaSet;
    }

    @computed
    get visibleAttributes(): ChartMeta[] {
        return _.reduce(this._chartVisibility.entries(), (acc, [chartUniqueKey, visible]) => {
            if (visible && this.chartMetaSet[chartUniqueKey]) {
                let chartMeta = this.chartMetaSet[chartUniqueKey];
                let dimension = this.chartsDimension.get(chartUniqueKey);
                if (dimension !== undefined) {
                    chartMeta.dimension = dimension;
                }
                acc.push(chartMeta);
            }
            return acc;
        }, [] as ChartMeta[]);
    }

    private getTableDimensionByNumberOfRecords(records: number) {
        return records <= ONE_GRID_TABLE_ROWS ? {
            w: 2,
            h: 1
        } : (this.studyViewPageLayoutProps.dimensions[ChartTypeEnum.TABLE] || {w: 1, h: 1});
    }

    @action
    changeChartType(attr: ChartMeta, newChartType: ChartType) {
        let data: MobxPromise<ClinicalDataCountWithColor[]>|undefined
            if(newChartType === ChartTypeEnum.TABLE) {
                if (_.includes(CUSTOM_CHART_KEYS, attr.uniqueKey)) {
                    if (attr.uniqueKey === UniqueKey.SAMPLES_PER_PATIENT) {
                        data = this.samplesPerPatientData;
                    } else if (attr.uniqueKey === UniqueKey.WITH_MUTATION_DATA) {
                        data = this.withMutationData;
                    } else if (attr.uniqueKey === UniqueKey.WITH_CNA_DATA) {
                        data = this.withCnaData;
                    }
                } else {
                    data = this.studyViewClinicalDataCountsCache.get({
                        attribute: attr.clinicalAttribute!,
                        filters: this.filters
                    });
                }
                if(data !== undefined){
                    this.chartsDimension.set(attr.uniqueKey, this.getTableDimensionByNumberOfRecords(data.result!.length));
                }
            }else{
                this.chartsDimension.set(attr.uniqueKey, DEFAULT_LAYOUT_PROPS.dimensions[newChartType]);
            }
    }

    //TODO:cleanup
    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            let queriedAttributes = this.clinicalAttributes.result.map(attr => {
                attr.priority = _.isNumber(attr.priority) ? attr.priority : "1";
                if(attr.priority === '1') {
                    attr.priority = getDefaultPriorityByUniqueKey(getClinicalAttributeUniqueKey(attr)).toString();
                }
                return attr;
            });

            let sampleAttributeCount = 0;
            let patientAttributeCount = 0;
            let filterAttributes: ClinicalAttribute[] = []
            // Todo: its a temporary logic to show limited charts initially(10 sample and 10 patient attribute charts)
            // this logic will be updated later
            queriedAttributes.sort((a, b) => {
                // Sort by priority first
                let priorityDiff = Number(a.priority) - Number(b.priority);

                if(priorityDiff != 0) {
                    return -priorityDiff;
                }

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
                const priority = Number(attribute.priority);
                if (priority === 0){
                    this.changeChartVisibility(uniqueKey, false);
                }else if (attribute.patientAttribute) {
                    if (patientAttributeCount < 10 || priority > 1) {
                        filterAttributes.push(attribute)
                        patientAttributeCount++;
                    } else {
                        this.changeChartVisibility(uniqueKey, false);
                    }
                } else {
                    if (sampleAttributeCount < 10 || priority > 1) {
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
            let promises = this.defaultVisibleAttributes.result.filter(c => c.datatype === ClinicalAttributeDataTypeConstants.STRING).map(attribute => {
                return this.studyViewClinicalDataCountsCache.get({ attribute: attribute, filters: { studyIds: this.queriedPhysicalStudyIds.result } as any })
            })
            return [this.queriedSampleIdentifiers, this.defaultVisibleAttributes, ...promises]
        },
        invoke: async () => {
            let studyViewFilter:StudyViewFilter = { studyIds: this.queriedPhysicalStudyIds.result } as any
            return _.reduce(this.defaultVisibleAttributes.result.filter(c => c.datatype === ClinicalAttributeDataTypeConstants.STRING), (acc, next) => {
                const uniqueKey = getClinicalAttributeUniqueKey(next);
                acc[uniqueKey] = this.studyViewClinicalDataCountsCache
                    .get({ attribute: next, filters: studyViewFilter })
                    .result!;
                return acc;
            }, {} as any);
        },
        default: {},
        onResult: (result) => {
            _.forEach(result, (obj, uniqueKey) => {
                //TODO: this is temporary. will be updated in next phase
                if (obj.length < 2 && !_.includes(ALWAYS_SHOWN_ATTRS, uniqueKey)) {
                    this.changeChartVisibility(uniqueKey, false);
                } else {
                    this.changeChartVisibility(uniqueKey, true);
                }
                if (obj.length > PIE_TO_TABLE_LIMIT) {
                    this.chartsType.set(uniqueKey, ChartTypeEnum.TABLE);
                }
                if (this.chartsType.get(uniqueKey) === ChartTypeEnum.TABLE) {
                    this.chartsDimension.set(uniqueKey, this.getTableDimensionByNumberOfRecords(obj.length));
                }
            });
        }
    });

    readonly initialClinicalDataBins = remoteData<{ [id: string]: DataBin[] }>({
        await: () => {
            const promises = this.defaultVisibleAttributes.result.filter(c => c.datatype === ClinicalAttributeDataTypeConstants.NUMBER).map(attribute => {
                return this.getDefaultInitialDataBinCounts(attribute);
            });

            return [this.defaultVisibleAttributes, ...promises];
        },
        invoke: async () => {
            return _.reduce(this.defaultVisibleAttributes.result.filter(c => c.datatype === ClinicalAttributeDataTypeConstants.NUMBER), (acc, next) => {
                const uniqueKey = getClinicalAttributeUniqueKey(next);
                acc[uniqueKey] = this.getDefaultInitialDataBinCounts(next).result!;
                return acc;
            }, {} as any);
        },
        default: {},
        onResult: (result) => {
            _.forEach(result, (obj, uniqueKey) => {
                if (obj.length < 2) {
                    this.changeChartVisibility(uniqueKey, false);
                } else {
                    this.changeChartVisibility(uniqueKey, true);
                }
            });
        }
    });

    readonly samples = remoteData<Sample[]>({
        await: () => [this.clinicalAttributes, this.queriedSampleIdentifiers, this.queriedPhysicalStudyIds],
        invoke: () => {
            let sampleFilter: SampleFilter = {} as any
            //this logic is need since fetchFilteredSamplesUsingPOST api accepts sampleIdentifiers or studyIds not both
            if(this.queriedSampleIdentifiers.result.length>0){
                sampleFilter.sampleIdentifiers = this.queriedSampleIdentifiers.result
            } else {
                sampleFilter.sampleListIds = this.queriedPhysicalStudyIds.result.map(studyId=>`${studyId}_all`)
            }

            return defaultClient.fetchSamplesUsingPOST({
                sampleFilter: sampleFilter
            })
        },
        default: []
    });

    readonly invalidSampleIds = remoteData<SampleIdentifier[]>({
        await: () => [this.queriedSampleIdentifiers, this.samples],
        invoke: async () => {
            if(this.queriedSampleIdentifiers.result.length>0 &&
                this.samples.result.length !== this.queriedSampleIdentifiers.result.length){

                let validSampleIdentifiers = _.reduce(this.samples.result,(acc, next)=>{
                    acc[next.studyId+'_'+next.sampleId] = true
                    return acc;
                }, {} as {[id:string]:boolean})
                return _.filter(this.queriedSampleIdentifiers.result,sampleIdentifier=>{
                    return !validSampleIdentifiers[sampleIdentifier.studyId+'_'+sampleIdentifier.sampleId]
                })
            }
            return []
        },
        default: []
    });

    // used in building virtual study
    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [this.selectedSamples, this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: () => {
            return Promise.resolve(getFilteredStudiesWithSamples(
                this.selectedSamples.result,
                this.filteredPhysicalStudies.result,
                this.filteredVirtualStudies.result));
        },
        default: []
    });

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [this.samples],
        invoke: () => {
            //fetch samples when there are only filters applied
            if (isFiltered(this.userSelections)) {
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.filters
                })
            }
            return Promise.resolve(this.samples.result)
        },
        default: []
    });

    readonly samplesWithNAInSelectedClinicalData = remoteData<Sample[]>({
        await:()=>[ this.samples, this.queriedSampleIdentifiers, this.queriedPhysicalStudyIds ],
        invoke: async() => {
            if (isFiltered(this.userSelections)) {
                let studyViewFilter = {} as any
                //this logic is need since fetchFilteredSamplesUsingPOST api accepts sampleIdentifiers or studyIds not both
                if(this.queriedSampleIdentifiers.result.length>0){
                    studyViewFilter.sampleIdentifiers = this.queriedSampleIdentifiers.result
                } else {
                    studyViewFilter.studyIds = this.queriedPhysicalStudyIds.result
                }
                if(!_.isEmpty(this.clinicalDataEqualityFilters)){
                    studyViewFilter.clinicalDataEqualityFilters = this.clinicalDataEqualityFilters.map(
                        f=>Object.assign({}, f, { values: ["NA"] })
                    ) as any
                }
                const samplesWithoutNA = await internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: studyViewFilter as StudyViewFilter,
                    negateFilters: true
                });
                const uniqueSampleKeysWithoutNA = _.keyBy(samplesWithoutNA, s=>s.uniqueSampleKey);
                const samplesWithNA = samplesWithoutNA.filter(s=>!(s.uniqueSampleKey in uniqueSampleKeysWithoutNA));
                return samplesWithNA;
            }
            return []
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
        await: () => [this.mutationProfiles],
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
        await:()=>[this.cnaProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.cnaProfiles.result)) {
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

    public async getClinicalData(chartMeta: ChartMeta) {
        if (chartMeta.clinicalAttribute && this.samples.result) {
            const clinicalDataList = await defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: chartMeta.clinicalAttribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                clinicalDataMultiStudyFilter: {
                    attributeIds: [chartMeta.clinicalAttribute.clinicalAttributeId],
                    identifiers: this.samples.result.map(sample => ({
                        entityId: chartMeta.clinicalAttribute!.patientAttribute ? sample.patientId : sample.sampleId,
                        studyId: sample.studyId
                    }))
                }
            });

            const header: string[] = ["Study ID", "Patient ID"];

            if (!chartMeta.clinicalAttribute!.patientAttribute) {
                header.push("Sample ID");
            }

            header.push(chartMeta.clinicalAttribute.displayName);

            let data = [header.join("\t")];

            data = data.concat(clinicalDataList.map(clinicalData => {
                const row = [clinicalData.studyId || NA_DATA, clinicalData.patientId || NA_DATA];

                if (!chartMeta.clinicalAttribute!.patientAttribute) {
                    row.push(clinicalData.sampleId || NA_DATA);
                }

                row.push(clinicalData.value || NA_DATA);

                return row.join("\t");
            }));

            return data.join("\n");
        }
        else {
            return "";
        }
    }

    public async getScatterDownloadData(chartMeta: ChartMeta)
    {
        if (this.mutationCountVsFractionGenomeAlteredData.result) {
            return generateScatterPlotDownloadData(
                this.mutationCountVsFractionGenomeAlteredData.result,
                this.sampleToAnalysisGroup.result,
                this.analysisGroupsSettings.clinicalAttribute,
                this.analysisGroupsSettings.groups as AnalysisGroup[]
            );
        }
        else {
            return "";
        }
    }

    public async getSurvivalDownloadData(chartMeta: ChartMeta)
    {
        if (this.survivalData.result)
        {
            const data: string[] = [];

            // find the unique clinical attribute ids
            const uniqueClinicalAttributeIds: {[clinicalAttributeId: string]: string} = _.reduce(
                this.survivalData.result,
                (map: {[clinicalAttributeId: string]: string}, clinicalDataList: ClinicalData[]) => {
                    clinicalDataList.forEach(clinicalData => {
                        if (clinicalData.clinicalAttributeId) {
                            map[clinicalData.clinicalAttributeId] = clinicalData.clinicalAttributeId;
                        }
                    });

                    return map;
                },
                {}
            );

            // add the header row
            data.push(["Study ID", "Patient ID", ..._.values(uniqueClinicalAttributeIds)].join("\t"));

            // add the data rows
            _.each(this.survivalData.result, clinicalDataList => {
                const row: string[] = [];

                if (clinicalDataList.length > 0) {
                    row.push(clinicalDataList[0].studyId || NA_DATA);
                    row.push(clinicalDataList[0].patientId || NA_DATA);
                    const keyed = _.keyBy(clinicalDataList, 'clinicalAttributeId');

                    _.each(uniqueClinicalAttributeIds, id => {
                        row.push(keyed[id] ? keyed[id].value || NA_DATA : NA_DATA);
                    });
                }

                data.push(row.join("\t"));
            });

            return data.join("\n");
        }
        else {
            return "";
        }
    }

    public async getMutatedGenesDownloadData() {
        if (this.mutatedGeneData.result) {
            let data = [['Gene', 'MutSig(Q-value)', '# Mut', '#', 'Freq'].join('\t')];
            _.each(this.mutatedGeneData.result, function (record: MutationCountByGene) {
                data.push([
                    record.hugoGeneSymbol,
                    record.qValue === undefined ? '' : getQValue(record.qValue),
                    record.totalCount, record.countByEntity, record.frequency + '%'].join("\t"));
            });
            return data.join("\n");
        } else
            return '';
    }

    public async getGenesCNADownloadData() {
        if (this.cnaGeneData.result) {
            let data = [['Gene', 'Gistic(Q-value)', 'Cytoband', 'CNA', '#', 'Freq'].join('\t')];
            _.each(this.cnaGeneData.result, function (record: CopyNumberCountByGene) {
                data.push([
                    record.hugoGeneSymbol,
                    record.qValue === undefined ? '' : getQValue(record.qValue),
                    record.cytoband, getCNAByAlteration(record.alteration),
                    record.countByEntity, record.frequency + '%'].join("\t"));
            });
            return data.join("\n");
        } else
            return '';
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
            const attributeIds = _.flatten(this.survivalPlots.map(obj => obj.associatedAttrs))
            if(!_.isEmpty(attributeIds)){
                const filter: ClinicalDataMultiStudyFilter = {
                    attributeIds: attributeIds,
                    identifiers: _.map(this.samples.result!, obj => {
                        return {
                            "entityId": obj.patientId,
                            "studyId": obj.studyId
                        }
                    })
                };

                let data = await defaultClient.fetchClinicalDataUsingPOST({
                    clinicalDataType: ClinicalDataTypeConstants.PATIENT,
                    clinicalDataMultiStudyFilter: filter
                })

                return _.groupBy(data, 'uniquePatientKey')
            }
            return {}
        },
        default: {}
    });

    readonly sampleMutationCountAndFractionGenomeAlteredData = remoteData({
        await:()=>[this.clinicalAttributes, this.samples],
        invoke:()=>{
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: [MUTATION_COUNT, FRACTION_GENOME_ALTERED],
                identifiers: _.map(this.samples.result!, obj => {
                    return {
                        "entityId": obj.sampleId,
                        "studyId": obj.studyId
                    }
                })
            };

            return defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: ClinicalDataTypeConstants.SAMPLE,
                clinicalDataMultiStudyFilter: filter
            });
        },
        default: []
    });    

    readonly mutationCountVsFractionGenomeAlteredData = remoteData({
        await:()=>[this.sampleMutationCountAndFractionGenomeAlteredData],
        invoke: async ()=>{
            return _.reduce(_.groupBy(this.sampleMutationCountAndFractionGenomeAlteredData.result, datum => datum.uniqueSampleKey), (acc, data) => {
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


    readonly mutationCountVsFractionGenomeAlteredDataSet = remoteData<{ [id: string]: IStudyViewScatterPlotData }>({
        await: () => [this.mutationCountVsFractionGenomeAlteredData],
        invoke: () => {
            return Promise.resolve(_.keyBy(this.mutationCountVsFractionGenomeAlteredData.result, datum => datum.uniqueSampleKey));
        },
        default: {}
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

    readonly molecularProfileSampleCounts = remoteData<MolecularProfileSampleCount>({
        invoke: async () => {
            return internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: this.filters
            });
        }
    });

    readonly clinicalAttributesCounts = remoteData({
        await: () => [this.selectedSamples],
        invoke: () => {
            let sampleIdentifiers = this.selectedSamples.result.map(sample => {
                return {
                    sampleId: sample.sampleId,
                    studyId: sample.studyId
                }
            });

            let clinicalAttributeFilter = {
                sampleIdentifiers
            } as ClinicalAttributeFilter;
            return defaultClient.getAllClinicalAttributesInStudiesUsingPOST({
                clinicalAttributeFilter,
                projection: "DETAILED"
            });
        }
    });

    readonly clinicalAttributesWithCount = remoteData<{ [clinicalAttributeId: string]: number }>({
        await: () => [
            this.molecularProfileSampleCounts,
            this.mutationCountVsFractionGenomeAlteredDataSet,
            this.survivalPlotData,
            this.clinicalAttributesCounts,
            this.samplesPerPatientData,
            this.withMutationData,
            this.withCnaData],
        invoke: async () => {
            if (!_.isEmpty(this.chartMetaSet)) {
                // build map
                const ret: { [clinicalAttributeId: string]: number } =
                    _.reduce(this.clinicalAttributesCounts.result || [], (map: { [clinicalAttributeId: string]: number }, next: ClinicalAttribute) => {
                        let key = getClinicalAttributeUniqueKey(next)
                        map[key] = map[key] || 0;
                        map[key] += next.count;
                        return map;
                    }, {});

                //Add special charts counts

                _.each(this.survivalPlotData.result, (survivalPlot) => {
                    if (survivalPlot.id in this.chartMetaSet) {
                        ret[survivalPlot.id] = survivalPlot.alteredGroup.length;
                    }
                })

                if (UniqueKey.MUTATED_GENES_TABLE in this.chartMetaSet) {
                    ret[UniqueKey.MUTATED_GENES_TABLE] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : 0;
                }

                if (UniqueKey.CNA_GENES_TABLE in this.chartMetaSet) {
                    ret[UniqueKey.CNA_GENES_TABLE] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples : 0;
                }

                if (UniqueKey.MUTATION_COUNT_CNA_FRACTION in this.chartMetaSet) {
                    const mutationCountVsFractionGenomeAlteredDataSet = this.mutationCountVsFractionGenomeAlteredDataSet.result;
                    const selectedSamplesMap = _.keyBy(this.selectedSamples.result!, s => s.uniqueSampleKey);
                    const filteredData = _.reduce(selectedSamplesMap, (acc, next) => {
                        if (mutationCountVsFractionGenomeAlteredDataSet[next.uniqueSampleKey]) {
                            acc.push(mutationCountVsFractionGenomeAlteredDataSet[next.uniqueSampleKey]);
                        }
                        return acc;
                    }, [] as IStudyViewScatterPlotData[]);
                    ret[UniqueKey.MUTATION_COUNT_CNA_FRACTION] = filteredData.length;
                }

                if (UniqueKey.SAMPLES_PER_PATIENT in this.chartMetaSet) {
                    ret[UniqueKey.SAMPLES_PER_PATIENT] =  _.sumBy(this.samplesPerPatientData.result, data=>data.count);
                }

                if (UniqueKey.WITH_MUTATION_DATA in this.chartMetaSet) {
                    ret[UniqueKey.WITH_MUTATION_DATA] =  _.sumBy(this.withMutationData.result, data=>data.count);
                }

                if (UniqueKey.WITH_CNA_DATA in this.chartMetaSet) {
                    ret[UniqueKey.WITH_CNA_DATA] =  _.sumBy(this.withCnaData.result, data=>data.count);
                }

                return _.reduce(this.chartMetaSet, (acc, next, key) => {
                    acc[key] = ret[key] || 0;
                    return acc;
                }, {} as { [id: string]: number });
            }
            return {}
        },
        default: {}
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
                    return sampleData[attributrId] || NA_DATA;
                })
            );
            return acc;
        }, [_.values(clinicalAttributesNameSet)]);

        return dataRows.map(mutation => mutation.join('\t')).join('\n');
    }

    @bind
    onSubmitQuery() {
        let formOps: { [id: string]: string } = {
            cancer_study_list: this.studyIds.join(','),
            tab_index: 'tab_visualize',
        }

        if (this.filteredVirtualStudies.result.length === 0 && this.studyIds.length === 1) {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                formOps['genetic_profile_ids_PROFILE_MUTATION_EXTENDED'] = this.mutationProfiles.result[0].molecularProfileId
            }
            if (!_.isEmpty(this.cnaProfiles.result)) {
                formOps['genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'] = this.cnaProfiles.result[0].molecularProfileId
            }
        } else {
            let data_priority = '0';
            let { mutation, cna } = {
                mutation: !_.isEmpty(this.mutationProfiles.result),
                cna: !_.isEmpty(this.cnaProfiles)
            };
            if (mutation && cna)
                data_priority = '0';
            else if (mutation)
                data_priority = '1';
            else if (cna)
                data_priority = '2';
            formOps.data_priority = data_priority;
        }

        if (isFiltered(this.userSelections)) {
            formOps.case_set_id = '-1'
            formOps.case_ids = _.map(this.selectedSamples.result, sample => {
                return sample.studyId + ":" + sample.sampleId;
            }).join('+');
        } else {
            if (this.filteredVirtualStudies.result.length === 0 && this.studyIds.length === 1) {
                formOps.case_set_id = this.studyIds[0] + '_all';
            } else {
                formOps.case_set_id = 'all';
            }
        }

        let url = '/';
        if (!_.isEmpty(this.geneQueries)) {
            formOps.Action = 'Submit';
            formOps.gene_list = this.geneQueries.map(query => unparseOQLQueryLine(query)).join('\n');
            url = '/results/legacy_submission';
        }
        submitToPage(url, formOps, '_blank');
    }

    @action
    setCustomChartFilters(chartMeta: ChartMeta, values: string[]) {
        if (values.length > 0) {
            let filteredSampleIdentifiers: SampleIdentifier[] = [];
            let valuesSet = _.keyBy(values);
            switch (chartMeta.uniqueKey) {
                case UniqueKey.SAMPLES_PER_PATIENT: {
                    let patientSampleGroups = _.groupBy(this.selectedSamplesForSamplesPerPatientChart.result, (sample) => sample.uniquePatientKey);
                    _.forEach(patientSampleGroups,samples=>{
                        if (samples.length in valuesSet) {
                            filteredSampleIdentifiers = filteredSampleIdentifiers.concat(getFilteredSampleIdentifiers(samples));
                        }
                    })
                    break;
                }
                case UniqueKey.WITH_MUTATION_DATA: {
                    filteredSampleIdentifiers = getFilteredSampleIdentifiers(this.selectedSamplesForMutationDataChart.result, (sample) => {
                        let sequenced = sample.sequenced ? 'YES' : 'NO';
                        return sequenced in valuesSet;
                    });
                    break;
                }
                case UniqueKey.WITH_CNA_DATA: {
                    filteredSampleIdentifiers = getFilteredSampleIdentifiers(this.selectedSamplesForCnaDataChart.result, (sample) => {
                        let sequenced = sample.copyNumberSegmentPresent ? 'YES' : 'NO';
                        return sequenced in valuesSet;
                    });
                    break;
                }
            }
            this._customChartFilterSet.set(chartMeta.uniqueKey, values);
            this._chartSampleIdentifiersFilterSet.set(chartMeta.uniqueKey, filteredSampleIdentifiers);
        }
        else {
            this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
            this._customChartFilterSet.delete(chartMeta.uniqueKey)
        }
    }

    readonly selectedSamplesForSamplesPerPatientChart = remoteData({
        await: () => [this.selectedSamples],
        invoke: () => {
            /* return all samples by removing filter(s) applied on this chart */
            if (_.includes(this._chartSampleIdentifiersFilterSet.keys(), UniqueKey.SAMPLES_PER_PATIENT)) {
                return getSamplesByExcludingFiltersOnChart(
                    UniqueKey.SAMPLES_PER_PATIENT,
                    this.filters,
                    this._chartSampleIdentifiersFilterSet.toJS(),
                    this.queriedSampleIdentifiers.result,
                    this.queriedPhysicalStudyIds.result
                );
            } else {
                return Promise.resolve(this.selectedSamples.result);
            }
        },
        default: []
    });

    readonly samplesPerPatientData = remoteData<ClinicalDataCountWithColor[]>({
        await: () => [this.selectedSamplesForSamplesPerPatientChart],
        invoke: async () => {
            let groupedPatientSamples = _.groupBy(this.selectedSamplesForSamplesPerPatientChart.result, (sample) => sample.uniquePatientKey);
            return _.values(_.reduce(groupedPatientSamples, (acc, next) => {
                let sampleCount = next.length;
                if (acc[sampleCount]) {
                    acc[sampleCount].count = acc[sampleCount].count + 1
                } else {
                    acc[sampleCount] = { value: `${sampleCount}`, count: 1, color: COLORS[sampleCount - 1] || NA_COLOR }
                }
                return acc
            }, {} as { [id: string]: ClinicalDataCountWithColor }));
        },
        default: []
    });

    readonly sampleSetWithMutationData = remoteData<{[id:string]:boolean}>({
        await: () => [this.sampleMutationCountAndFractionGenomeAlteredData],
        invoke: async () => {
            return _.reduce(this.sampleMutationCountAndFractionGenomeAlteredData.result,(acc, next)=>{
                if (next.clinicalAttributeId === MUTATION_COUNT) {
                    acc[next.uniqueSampleKey] = true
                }
                return acc;
            },{} as {[id:string]:boolean})
        },
        default: {}
    });

    readonly sampleSetWithCNAData = remoteData<{[id:string]:boolean}>({
        await: () => [this.sampleMutationCountAndFractionGenomeAlteredData],
        invoke: async () => {
            return _.reduce(this.sampleMutationCountAndFractionGenomeAlteredData.result,(acc, next)=>{
                if (next.clinicalAttributeId === FRACTION_GENOME_ALTERED) {
                    acc[next.uniqueSampleKey] = true
                }
                return acc;
            },{} as {[id:string]:boolean})
        },
        default: {}
    });

    readonly selectedSamplesForMutationDataChart = remoteData({
        await: () => [this.selectedSamples],
        invoke: async () => {
            let filteredSamples: Sample[] = [];
             /* fetch all samples by removing filter(s) applied on this chart */
            if (_.includes(this._chartSampleIdentifiersFilterSet.keys(),UniqueKey.WITH_MUTATION_DATA) ) {
                filteredSamples = await getSamplesByExcludingFiltersOnChart(
                    UniqueKey.WITH_MUTATION_DATA,
                    this.filters,
                    this._chartSampleIdentifiersFilterSet.toJS(),
                    this.queriedSampleIdentifiers.result,
                    this.queriedPhysicalStudyIds.result
                );
            } else {
                filteredSamples = this.selectedSamples.result;
            }
            return filteredSamples
        },
        default: [],
    });

    readonly withMutationData = remoteData<ClinicalDataCountWithColor[]>({
        await: () => [this.sampleSetWithMutationData, this.selectedSamplesForMutationDataChart],
        invoke: async () => {
            /* fetch all samples by removing filter(s) applied on this chart */
            let result = _.reduce(this.selectedSamplesForMutationDataChart.result, (acc, sample) => {
                let sequenced = this.sampleSetWithMutationData.result[sample.uniqueSampleKey];
                let sequencedStr = sequenced ? 'YES' : 'NO';
                if (acc[sequencedStr]) {
                    acc[sequencedStr].count = acc[sequencedStr].count + 1
                } else {
                    acc[sequencedStr] = { value: sequencedStr, count: 1, color: COLORS[sequenced ? 0 : 1] || NA_COLOR }
                }
                return acc
            }, {} as { [id: string]: ClinicalDataCountWithColor });

            return _.values(result);
        },
        default: [],
    });

    readonly selectedSamplesForCnaDataChart = remoteData({
        await: () => [this.selectedSamples],
        invoke: async () => {

            let filteredSamples: Sample[] = [];
            if (_.includes(this._chartSampleIdentifiersFilterSet.keys(), UniqueKey.WITH_CNA_DATA)) {
                filteredSamples = await getSamplesByExcludingFiltersOnChart(
                    UniqueKey.WITH_CNA_DATA,
                    this.filters,
                    this._chartSampleIdentifiersFilterSet.toJS(),
                    this.queriedSampleIdentifiers.result,
                    this.queriedPhysicalStudyIds.result
                );
            } else {
                filteredSamples = this.selectedSamples.result;
            }
            return filteredSamples
        },
        default: [],
    });

    readonly withCnaData = remoteData<ClinicalDataCountWithColor[]>({
        await: () => [this.sampleSetWithCNAData, this.selectedSamplesForCnaDataChart],
        invoke: async () => {

            let result = _.reduce(this.selectedSamplesForCnaDataChart.result, (acc, sample) => {
                let copyNumberSegmentPresent = this.sampleSetWithCNAData.result[sample.uniqueSampleKey]
                let copyNumberSegmentPresentStr = copyNumberSegmentPresent ? 'YES' : 'NO';
                if (acc[copyNumberSegmentPresentStr]) {
                    acc[copyNumberSegmentPresentStr].count = acc[copyNumberSegmentPresentStr].count + 1
                } else {
                    acc[copyNumberSegmentPresentStr] = { value: copyNumberSegmentPresentStr, count: 1, color: COLORS[copyNumberSegmentPresent ? 0 : 1] || NA_COLOR }
                }
                return acc
            }, {} as { [id: string]: ClinicalDataCountWithColor });

            return _.values(result)
        },
        default: [],
    });

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