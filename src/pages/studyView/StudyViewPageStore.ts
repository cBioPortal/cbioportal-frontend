import * as _ from 'lodash';
import {remoteData} from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {action, computed, observable, toJS, ObservableMap, reaction} from "mobx";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    MutationCountByGene,
    MutationGeneFilter,
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
    MolecularProfileFilter
    MutationCount,
    CancerStudy, Patient, PatientFilter
} from 'shared/api/generated/CBioPortalAPI';
import {PatientSurvival} from 'shared/model/PatientSurvival';
import {getPatientSurvivals} from 'pages/resultsView/SurvivalStoreHelper';
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';
import {getClinicalAttributeUniqueKey, isPreSelectedClinicalAttr} from './StudyViewUtils';
import MobxPromise from 'mobxpromise';
import {SingleGeneQuery} from 'shared/lib/oql/oql-parser';
import {bind} from '../../../node_modules/bind-decorator';
import {updateGeneQuery} from 'pages/studyView/StudyViewUtils';
import {stringListToSet} from 'shared/lib/StringUtils';

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
    MUTATION_COUNT_CNA_FRACTION = 'MUTATION_COUNT_CNA_FRACTION'
}

export const MUTATION_COUNT = 'MUTATION_COUNT';
export const FRACTION_GENOME_ALTERED = 'FRACTION_GENOME_ALTERED';

export type ClinicalDataCountWithColor = ClinicalDataCount & { color: string }
export type SurvivalAnalysisGroup = { value:string, color:string};
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

type MutationCountVsFGADatum = {
    studyId: string;
    sampleId: string;
    patientId: string;
    uniqueSampleKey: string;
    x: number;
    y: number;
}

export class StudyViewPageStore {

    constructor() {
        reaction(()=>this.filters, ()=>this.clearSurvivalAnalysisSettings()); // whenever any data filters change, reset survival analysis settings
    }

    public studyViewClinicalDataCountsCache = new StudyViewClinicalDataCountsCache()

    @observable studyIds: string[] = [];

    @observable sampleAttrIds: string[] = [];

    @observable patientAttrIds: string[] = [];

    private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable private _mutatedGeneFilter: MutationGeneFilter;

    @observable private _cnaGeneFilter: CopyNumberGeneFilter;

    @observable private _sampleIdentifiers:SampleIdentifier[];

    @observable private _chartVisibility = observable.map<boolean>();

    private _clinicalAttributesMetaSet: { [id: string]: ChartMeta } = {} as any;

    @observable geneQueryStr: string;

    @observable private geneQueries: SingleGeneQuery[] = [];

    @observable private queriedGeneSet = observable.map<boolean>();

    @observable.ref private _survivalAnalysisClinicalAttribute:ClinicalAttribute|undefined;
    @observable.ref private _survivalAnalysisGroups:ReadonlyArray<SurvivalAnalysisGroup>|undefined;

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
    updateSurvivalAnalysisSettings(attribute:ClinicalAttribute, groups:ReadonlyArray<SurvivalAnalysisGroup>) {
        this._survivalAnalysisClinicalAttribute = attribute;
        this._survivalAnalysisGroups = groups;
    }

    @action
    clearSurvivalAnalysisSettings() {
        this._survivalAnalysisClinicalAttribute = undefined;
        this._survivalAnalysisGroups = undefined;
    }

    @computed
    get survivalAnalysisSettings() {
        if (this._survivalAnalysisClinicalAttribute) {
            return {
                clinicalAttribute: this._survivalAnalysisClinicalAttribute,
                groups: this._survivalAnalysisGroups
            };
        } else {
            return undefined;
        }
    }

    readonly patientToSurvivalAnalysisGroup = remoteData({
        await:()=>[this.selectedSamples, this.selectedPatients],
        invoke:async()=>{
            if (this.survivalAnalysisSettings) {
                const attr = this.survivalAnalysisSettings.clinicalAttribute;
                const data = await client.fetchClinicalDataUsingPOST({
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
                    map[clinData.uniquePatientKey] = clinData.value;
                    return map;
                }, {} as {[patientKey:string]:string});
                // add NA entries
                for (const patient of this.selectedPatients.result!) {
                    if (!(patient.uniquePatientKey in ret)) {
                        ret[patient.uniquePatientKey] = "NA";
                    }
                }
                return ret;
            } else {
                return undefined;
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
    updateGeneFilter(entrezGeneId: number) {
        let mutatedGeneFilter = this._mutatedGeneFilter;
        if (!mutatedGeneFilter) {
            //TODO: all elements instead of one
            mutatedGeneFilter = { entrezGeneIds: [] };
        }
        let _index = mutatedGeneFilter.entrezGeneIds.indexOf(entrezGeneId);
        if (_index === -1) {
            mutatedGeneFilter.entrezGeneIds.push(entrezGeneId);
        } else {
            mutatedGeneFilter.entrezGeneIds.splice(_index, 1);
        }
        this._mutatedGeneFilter = mutatedGeneFilter;
    }

    @action resetGeneFilter() {
        this._mutatedGeneFilter.entrezGeneIds = [];
    }

    @action
    updateCustomCasesFilter(cases: SampleIdentifier[]) {

        this._sampleIdentifiers = _.map(cases, obj => {
            return {
                "sampleId": obj.sampleId,
                "studyId": obj.studyId
            }
        })
    }

    @action
    resetCustomCasesFilter() {
        this._sampleIdentifiers = [];
    };

    public getCustomCasesFilter() {
        return this._sampleIdentifiers;
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

    @action
    resetCNAGeneFilter() {
        this._cnaGeneFilter.alterations = [];
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

        if(this._sampleIdentifiers && this._sampleIdentifiers.length>0) {
            filters.sampleIdentifiers = this._sampleIdentifiers;
        } else {
            filters.studyIds = this.studyIds
        }
        return filters;
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._mutatedGeneFilter ? this._mutatedGeneFilter.entrezGeneIds : [];
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return this._cnaGeneFilter ? this._cnaGeneFilter.alterations : [];
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
        )
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

    @computed get attributeNamesSet() {
        //TODO: this should use _clinicalAttributesMetaSet once special charts are included in _clinicalAttributesMetaSet
        return _.reduce(this.clinicalAttributes.result, (acc: { [id: string]: string }, attribute) => {
            const uniqueKey = (attribute.patientAttribute ? 'PATIENT' : 'SAMPLE') + '_' + attribute.clinicalAttributeId;
            if (attribute.datatype === 'STRING') {
                acc[uniqueKey] = attribute.displayName;
            }
            return acc
        }, {})
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
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: this.emptyFilter
            })
        },
        default: []
    })

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
            return client.fetchPatientsUsingPOST({
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
                    let _datum: MutationCountVsFGADatum = {
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
            }, [] as MutationCountVsFGADatum[]);
        }
    });
}