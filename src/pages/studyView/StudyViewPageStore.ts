import * as _ from 'lodash';
import { remoteData } from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import { action, computed, observable, toJS, ObservableMap } from "mobx";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    MutationCountByGene,
    MutationGeneFilter,
    Sample,
    StudyViewFilter,
    SampleIdentifier
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    ClinicalAttribute,
    ClinicalData,
    MolecularProfile,
    MolecularProfileFilter,
    ClinicalDataMultiStudyFilter,
    Gene
} from 'shared/api/generated/CBioPortalAPI';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import StudyViewClinicalDataCountsCache from 'shared/cache/StudyViewClinicalDataCountsCache';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { bind } from '../../../node_modules/bind-decorator';
import { updateGeneQuery } from 'pages/studyView/StudyViewUtils';
import { stringListToSet } from 'shared/lib/StringUtils';

export type ClinicalDataType = 'SAMPLE' | 'PATIENT'

export enum ChartType {
    PIE_CHART = 'PIE_CHART',
    BAR_CHART = 'BAR_CHART',
    SURVIVAL = 'SURVIVAL',
    TABLE = 'TABLE',
    SCATTER = 'SCATTER'
}

export type ClinicalDataCountWithColor = ClinicalDataCount & { color: string }
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
    clinicalAttribute: ClinicalAttribute,
    uniqueKey: string,
    defaultChartType: ChartType
}

export class StudyViewPageStore {

    constructor() { }

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
    updateClinicalDataEqualityFilters(chartMeta: ChartMeta, values: string[]) {
        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: chartMeta.clinicalAttribute.clinicalAttributeId,
                clinicalDataType: chartMeta.clinicalAttribute.patientAttribute ? 'PATIENT' : 'SAMPLE' as ClinicalDataType,
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

    @action
    updateCustomCasesFilter(cases: Sample[]) {

        this._sampleIdentifiers = _.map(cases, obj => {
            return {
                "sampleId": obj.sampleId,
                "studyId": obj.studyId
            }
        })
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

    @action changeChartVisibility(uniqueKey: string, visible: boolean) {
        if (!visible) {
            //TODO: Currently clears only clinicalDataEqualityFilters,Need to implement for others
            this._clinicalDataEqualityFilterSet.delete(uniqueKey);
        }
        this._chartVisibility.set(uniqueKey, visible);
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

    @computed
    get mutationProfileIds() {
        return this.molecularProfiles
            .result
            .filter(profile => profile.molecularAlterationType === "MUTATION_EXTENDED")
            .map(profile => profile.molecularProfileId);
    }

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
        default: [],
        onResult: (attributes) => {
            // Add meta information for each of the clinical attribute
            // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
            let newMap: { [id: string]: ChartMeta } = _.reduce(attributes, (acc: { [id: string]: ChartMeta }, attribute) => {
                const clinicalDataType: ClinicalDataType = attribute.patientAttribute ? 'PATIENT' : 'SAMPLE';
                const uniqueKey = clinicalDataType + '_' + attribute.clinicalAttributeId;
                //TODO: currently only piechart is handled
                if (attribute.datatype === 'STRING') {
                    acc[uniqueKey] = { clinicalAttribute: attribute, uniqueKey: uniqueKey, defaultChartType: ChartType.PIE_CHART };
                }
                return acc
            }, {});
            //Reset the metaSet whenever the studies changes
            this._clinicalAttributesMetaSet = newMap;
        }
    });

    @computed get visibleAttributes(): ChartMeta[] {
        return _.reduce(this._chartVisibility.keys(), (acc: ChartMeta[], next) => {
            if (this._chartVisibility.get(next)) {
                let chartMeta = this._clinicalAttributesMetaSet[next];
                if (chartMeta) {
                    acc.push(chartMeta)
                }
            }
            return acc;
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
            queriedAttributes.forEach(attribute => {
                if (attribute.patientAttribute) {
                    if (patientAttributeCount < 10) {
                        filterAttributes.push(attribute)
                        patientAttributeCount++;
                    }
                } else {
                    if (sampleAttributeCount < 10) {
                        filterAttributes.push(attribute)
                        sampleAttributeCount++;
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

    readonly selectedSamples = remoteData<Sample[]>({
        invoke: () => {
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: this.filters
            })
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
        await: () => [this.samples, this.selectedPatientIds],
        invoke: async () => {

            const unselectedPatientSet = _.reduce(this.samples.result, (acc: { [id: string]: boolean }, next) => {
                if (!_.includes(this.selectedPatientIds.result, next.patientId)) {
                    acc[next.patientId] = true;
                }
                return acc;
            }, {});
            return Object.keys(unselectedPatientSet);
        },
        default: []
    });

    readonly mutatedGeneData = remoteData<MutatedGenesData>({
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfileIds)) {
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

            return _.groupBy(data, 'patientId')
        },
        default: {}
    });
}