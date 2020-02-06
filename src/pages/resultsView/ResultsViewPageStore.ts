import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    ClinicalDataSingleStudyFilter,
    CopyNumberSeg,
    Gene,
    GenePanel,
    GenePanelData,
    MolecularDataFilter,
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MolecularProfileFilter,
    Mutation,
    MutationCountByPosition,
    MutationFilter,
    MutationMultipleStudyFilter,
    NumericGeneMolecularData,
    Patient,
    ReferenceGenomeGene,
    Sample,
    SampleFilter,
    SampleIdentifier,
    SampleList,
    SampleMolecularIdentifier,
} from 'shared/api/generated/CBioPortalAPI';
import client from 'shared/api/cbioportalClientInstance';
import { action, computed, observable, ObservableMap, reaction } from 'mobx';
import {
    CancerGene,
    generateQueryVariantId,
    getProteinPositionFromProteinChange,
    IndicatorQueryResp,
    remoteData,
    stringListToSet,
    VariantAnnotation,
} from 'cbioportal-frontend-commons';
import { cached, labelMobxPromises, MobxPromise } from 'mobxpromise';
import OncoKbEvidenceCache from 'shared/cache/OncoKbEvidenceCache';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import GenomeNexusMyVariantInfoCache from 'shared/cache/GenomeNexusMyVariantInfoCache';
import CancerTypeCache from 'shared/cache/CancerTypeCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import {
    cancerTypeForOncoKb,
    fetchAllReferenceGenomeGenes,
    fetchCnaOncoKbDataWithNumericGeneMolecularData,
    fetchCopyNumberSegmentsForSamples,
    fetchGenes,
    fetchGermlineConsentedSamples,
    fetchMyCancerGenomeData,
    fetchOncoKbCancerGenes,
    fetchOncoKbData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    generateDataQueryFilter,
    generateUniqueSampleKeyToTumorTypeMap,
    groupBy,
    IDataQueryFilter,
    isMutationProfile,
    ONCOKB_DEFAULT,
} from 'shared/lib/StoreUtils';
import { IHotspotIndex, indexHotspotsData } from 'react-mutation-mapper';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import ResultsViewMutationMapperStore from './mutation/ResultsViewMutationMapperStore';
import AppConfig from 'appConfig';
import * as _ from 'lodash';
import { toSampleUuid } from '../../shared/lib/UuidUtils';
import MutationDataCache from '../../shared/cache/MutationDataCache';
import { PatientSurvival } from '../../shared/model/PatientSurvival';
import AccessorsForOqlFilter, {
    SimplifiedMutationType,
} from '../../shared/lib/oql/AccessorsForOqlFilter';
import {
    doesQueryContainMutationOQL,
    doesQueryContainOQL,
    filterCBioPortalWebServiceData,
    filterCBioPortalWebServiceDataByOQLLine,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
    uniqueGenesInOQLQuery,
} from '../../shared/lib/oql/oqlfilter';
import GeneMolecularDataCache from '../../shared/cache/GeneMolecularDataCache';
import GenesetMolecularDataCache from '../../shared/cache/GenesetMolecularDataCache';
import GenesetCorrelatedGeneCache from '../../shared/cache/GenesetCorrelatedGeneCache';
import TreatmentMolecularDataCache from '../../shared/cache/TreatmentMolecularDataCache';
import GeneCache from '../../shared/cache/GeneCache';
import GenesetCache from '../../shared/cache/GenesetCache';
import { IOncoKbData } from '../../shared/model/OncoKB';
import {
    AlterationEnrichment,
    CosmicMutation,
    Geneset,
    GenesetDataFilterCriteria,
    GenesetMolecularData,
    MolecularProfileCasesGroupFilter,
} from '../../shared/api/generated/CBioPortalAPIInternal';
import internalClient from '../../shared/api/cbioportalInternalClientInstance';
import { getAlterationString } from '../../shared/lib/CopyNumberUtils';
import memoize from 'memoize-weak-decorator';
import request from 'superagent';
import {
    countMutations,
    mutationCountByPositionKey,
} from './mutationCountHelpers';
import { getPatientSurvivals } from './SurvivalStoreHelper';
import {
    CancerStudyQueryUrlParams,
    QueryStore,
} from 'shared/components/query/QueryStore';
import {
    annotateMolecularDatum,
    compileMutations,
    computeCustomDriverAnnotationReport,
    computeGenePanelInformation,
    CoverageInformation,
    excludeMutationAndSVProfiles,
    fetchPatients,
    fetchQueriedStudies,
    filterAndAnnotateMutations,
    FilteredAndAnnotatedMutationsReport,
    filterSubQueryData,
    getMolecularProfiles,
    getOncoKbOncogenic,
    getSampleAlteredMap,
    groupDataByCase,
    initializeCustomDriverAnnotationSettings,
    isRNASeqProfile,
    makeEnrichmentDataPromise,
    OncoprintAnalysisCaseType,
} from './ResultsViewPageStoreUtils';
import MobxPromiseCache from '../../shared/lib/MobxPromiseCache';
import { isSampleProfiledInMultiple } from '../../shared/lib/isSampleProfiled';
import { BookmarkLinks } from '../../shared/model/BookmarkLinks';
import { getBitlyServiceUrl } from '../../shared/api/urls';
import url from 'url';
import ClinicalDataCache, {
    clinicalAttributeIsINCOMPARISONGROUP,
    SpecialAttribute,
} from '../../shared/cache/ClinicalDataCache';
import { getDefaultMolecularProfiles } from '../../shared/lib/getDefaultMolecularProfiles';
import { ServerConfigHelpers } from '../../config/config';
import {
    parseSamplesSpecifications,
    populateSampleSpecificationsFromVirtualStudies,
    ResultsViewComparisonSubTab,
    ResultsViewTab,
    substitutePhysicalStudiesForVirtualStudies,
} from './ResultsViewPageHelpers';
import {
    filterAndSortProfiles,
    getGenesetProfiles,
    sortRnaSeqProfilesToTop,
} from './coExpression/CoExpressionTabUtils';
import { isRecurrentHotspot } from '../../shared/lib/AnnotationUtils';
import { generateDownloadFilenamePrefixByStudies } from 'shared/lib/FilenameUtils';
import {
    convertComparisonGroupClinicalAttribute,
    makeComparisonGroupClinicalAttributes,
    makeProfiledInClinicalAttributes,
} from '../../shared/components/oncoprint/ResultsViewOncoprintUtils';
import { annotateAlterationTypes } from '../../shared/lib/oql/annotateAlterationTypes';
import { ErrorMessages } from '../../shared/enums/ErrorEnums';
import {
    pickCopyNumberEnrichmentProfiles,
    pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles,
    pickProteinEnrichmentProfiles,
} from './enrichments/EnrichmentsUtil';
import { SURVIVAL_CHART_ATTRIBUTES } from './survival/SurvivalChart';
import sessionServiceClient from '../../shared/api/sessionServiceInstance';
import { VirtualStudy } from 'shared/model/VirtualStudy';
import { ISurvivalDescription } from './survival/SurvivalDescriptionTable';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import { Group } from '../../shared/api/ComparisonGroupClient';
import { AppStore } from '../../AppStore';
import { getNumSamples } from '../groupComparison/GroupComparisonUtils';
import autobind from 'autobind-decorator';
import { DEFAULT_GENOME } from 'pages/resultsView/ResultsViewPageStoreUtils';
import {
    ChartMeta,
    getChartMetaDataType,
    getDefaultPriorityByUniqueKey,
    getFilteredStudiesWithSamples,
    getPriorityByClinicalAttribute,
    getUniqueKey,
    StudyWithSamples,
    UniqueKey,
    getUniqueKeyFromMolecularProfileIds,
    ChartMetaDataTypeEnum,
} from 'pages/studyView/StudyViewUtils';
import {
    FRACTION_GENOME_ALTERED,
    MUTATION_COUNT,
} from 'pages/studyView/StudyViewPageStore';
import { IVirtualStudyProps } from 'pages/studyView/virtualStudy/VirtualStudy';
import { decideMolecularProfileSortingOrder } from './download/DownloadUtils';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import {
    fetchTreatmentByMolecularProfileIds,
    Treatment,
} from 'shared/lib/GenericAssayUtils/TreatmentUtils';
import { ChartTypeEnum } from 'pages/studyView/StudyViewConfig';

type Optional<T> =
    | { isApplicable: true; value: T }
    | { isApplicable: false; value?: undefined };

const DEFAULT_RPPA_THRESHOLD = 2;
const DEFAULT_Z_SCORE_THRESHOLD = 2;

export const AlterationTypeConstants = {
    MUTATION_EXTENDED: 'MUTATION_EXTENDED',
    COPY_NUMBER_ALTERATION: 'COPY_NUMBER_ALTERATION',
    MRNA_EXPRESSION: 'MRNA_EXPRESSION',
    PROTEIN_LEVEL: 'PROTEIN_LEVEL',
    FUSION: 'FUSION',
    GENESET_SCORE: 'GENESET_SCORE',
    METHYLATION: 'METHYLATION',
    GENERIC_ASSAY: 'GENERIC_ASSAY',
    STRUCTURAL_VARIANT: 'STRUCTURAL_VARIANT',
    MUTATION_UNCALLED: 'MUTATION_UNCALLED',
};

// only show TREATMENT_RESPONSE in the plots tab for now
// TODO: apply to all generic assay profiles when front-end implementation finish
export const GenericAssayTypeConstants = {
    TREATMENT_RESPONSE: 'TREATMENT_RESPONSE',
};

export const AlterationTypeDisplayConstants = {
    COPY_NUMBER_ALTERATION: 'CNA',
    MRNA_EXPRESSION: 'EXP',
    PROTEIN_LEVEL: 'PROT',
    MUTATION_EXTENDED: ['MUT', 'FUSION'],
};

export const DataTypeConstants = {
    DISCRETE: 'DISCRETE',
    CONTINUOUS: 'CONTINUOUS',
    ZSCORE: 'Z-SCORE',
    MAF: 'MAF',
    LOGVALUE: 'LOG-VALUE',
    LOG2VALUE: 'LOG2-VALUE',
};

export enum SampleListCategoryType {
    'w_mut' = 'w_mut',
    'w_cna' = 'w_cna',
    'w_mut_cna' = 'w_mut_cna',
}

export enum GeneticEntityType {
    'GENE' = 'gene',
    'GENESET' = 'geneset',
}

export const SampleListCategoryTypeToFullId = {
    [SampleListCategoryType.w_mut]: 'all_cases_with_mutation_data',
    [SampleListCategoryType.w_cna]: 'all_cases_with_cna_data',
    [SampleListCategoryType.w_mut_cna]: 'all_cases_with_mutation_and_cna_data',
};

export type SamplesSpecificationElement =
    | { studyId: string; sampleId: string; sampleListId: undefined }
    | { studyId: string; sampleId: undefined; sampleListId: string };

export interface ExtendedAlteration extends Mutation, NumericGeneMolecularData {
    hugoGeneSymbol: string;
    molecularProfileAlterationType: MolecularProfile['molecularAlterationType'];
    // TODO: what is difference molecularProfileAlterationType and
    // alterationType?
    alterationType: string;
    alterationSubType: string;
}

export interface AnnotatedMutation extends Mutation {
    hugoGeneSymbol: string;
    putativeDriver: boolean;
    oncoKbOncogenic: string;
    isHotspot: boolean;
    simplifiedMutationType: SimplifiedMutationType;
}

export interface AnnotatedNumericGeneMolecularData
    extends NumericGeneMolecularData {
    hugoGeneSymbol: string;
    oncoKbOncogenic: string;
}

export interface AnnotatedExtendedAlteration
    extends ExtendedAlteration,
        AnnotatedMutation,
        AnnotatedNumericGeneMolecularData {}

export interface ExtendedSample extends Sample {
    cancerType: string;
    cancerTypeDetailed: string;
}

export type CaseAggregatedData<T> = {
    samples: { [uniqueSampleKey: string]: T[] };
    patients: { [uniquePatientKey: string]: T[] };
};

/*
 * OQL-queried data by patient and sample, along with the query metadata and,
 * if specified in the type argument, a non-aggregated copy of the data
 */
export interface IQueriedCaseData<DataInOQL> {
    cases: CaseAggregatedData<AnnotatedExtendedAlteration>;
    oql: OQLLineFilterOutput<DataInOQL>;
}

/*
 * OQL-queried data by patient and sample, along with the query metadata and a
 * non-aggregated copy of the data and, in case of a merged track, an array of
 * records per individual gene queried
 */
export interface IQueriedMergedTrackCaseData {
    cases: CaseAggregatedData<AnnotatedExtendedAlteration>;
    oql: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>;
    mergedTrackOqlList?: IQueriedCaseData<object>[];
}

export type GeneticEntity = {
    geneticEntityName: string; // hugo gene symbol for gene, gene set name for geneset
    geneticEntityType: GeneticEntityType;
    geneticEntityId: string | number; //entrezGeneId (number) for "gene", genesetId (string) for "geneset"
    cytoband: string; //will be "" for "geneset"
    geneticEntityData: Gene | Geneset;
};

export function buildDefaultOQLProfile(
    profilesTypes: string[],
    zScoreThreshold: number,
    rppaScoreThreshold: number
) {
    var default_oql_uniq: any = {};
    for (var i = 0; i < profilesTypes.length; i++) {
        var type = profilesTypes[i];
        switch (type) {
            case 'MUTATION_EXTENDED':
                default_oql_uniq['MUT'] = true;
                default_oql_uniq['FUSION'] = true;
                break;
            case 'COPY_NUMBER_ALTERATION':
                default_oql_uniq['AMP'] = true;
                default_oql_uniq['HOMDEL'] = true;
                break;
            case 'MRNA_EXPRESSION':
                default_oql_uniq['EXP>=' + zScoreThreshold] = true;
                default_oql_uniq['EXP<=-' + zScoreThreshold] = true;
                break;
            case 'PROTEIN_LEVEL':
                default_oql_uniq['PROT>=' + rppaScoreThreshold] = true;
                default_oql_uniq['PROT<=-' + rppaScoreThreshold] = true;
                break;
        }
    }
    return Object.keys(default_oql_uniq).join(' ');
}

export function extendSamplesWithCancerType(
    samples: Sample[],
    clinicalDataForSamples: ClinicalData[],
    studies: CancerStudy[]
) {
    const clinicalDataGroupedBySampleId = _.groupBy(
        clinicalDataForSamples,
        (clinicalData: ClinicalData) => clinicalData.uniqueSampleKey
    );
    // note that this table is actually mutating underlying sample.  it's not worth it to clone samples just
    // for purity
    const extendedSamples = samples.map((sample: ExtendedSample) => {
        const clinicalData =
            clinicalDataGroupedBySampleId[sample.uniqueSampleKey];
        if (clinicalData) {
            clinicalData.forEach((clinicalDatum: ClinicalData) => {
                switch (clinicalDatum.clinicalAttributeId) {
                    case 'CANCER_TYPE_DETAILED':
                        sample.cancerTypeDetailed = clinicalDatum.value;
                        break;
                    case 'CANCER_TYPE':
                        sample.cancerType = clinicalDatum.value;
                        break;
                    default:
                        break;
                }
            });
        }
        return sample;
    });

    //make a map by studyId for easy access in following loop
    const studyMap = _.keyBy(studies, (study: CancerStudy) => study.studyId);

    // now we need to fix any samples which do not have both cancerType and cancerTypeDetailed
    extendedSamples.forEach((sample: ExtendedSample) => {
        //if we have no cancer subtype, then make the subtype the parent type
        if (!sample.cancerType) {
            // we need to fall back to studies cancerType
            const study = studyMap[sample.studyId];
            if (study) {
                sample.cancerType = study.cancerType.name;
            } else {
                sample.cancerType = 'Unknown';
            }
        }
        if (sample.cancerType && !sample.cancerTypeDetailed) {
            sample.cancerTypeDetailed = sample.cancerType;
        }
    });

    return extendedSamples;
}

export type DriverAnnotationSettings = {
    excludeVUS: boolean;
    cbioportalCount: boolean;
    cbioportalCountThreshold: number;
    cosmicCount: boolean;
    cosmicCountThreshold: number;
    customBinary: boolean;
    customTiersDefault: boolean;
    driverTiers: ObservableMap<boolean>;
    hotspots: boolean;
    oncoKb: boolean;
    driversAnnotated: boolean;
};

export type ModifyQueryParams = {
    selectedSampleListId: string;
    selectedSampleIds: string[];
    caseIdsMode: 'sample' | 'patient';
};

/* fields and methods in the class below are ordered based on roughly
/* chronological setup concerns, rather than on encapsulation and public API */
/* tslint:disable: member-ordering */
export class ResultsViewPageStore {
    constructor(private appStore: AppStore, urlWrapper: ResultsViewURLWrapper) {
        labelMobxPromises(this);

        this.urlWrapper = urlWrapper;

        // addErrorHandler((error: any) => {
        //     this.ajaxErrors.push(error);
        // });
        this.getURL();

        const store = this;

        this.driverAnnotationSettings = observable({
            cbioportalCount: false,
            cbioportalCountThreshold: 0,
            cosmicCount: false,
            cosmicCountThreshold: 0,
            driverTiers: observable.map<boolean>(),

            _customBinary: undefined,
            _hotspots: false,
            _oncoKb: false,
            _excludeVUS: false,

            set hotspots(val: boolean) {
                this._hotspots = val;
            },
            get hotspots() {
                return (
                    !!AppConfig.serverConfig.show_hotspot &&
                    this._hotspots &&
                    !store.didHotspotFailInOncoprint
                );
            },
            set oncoKb(val: boolean) {
                this._oncoKb = val;
            },
            get oncoKb() {
                return (
                    AppConfig.serverConfig.show_oncokb &&
                    this._oncoKb &&
                    !store.didOncoKbFailInOncoprint
                );
            },
            set excludeVUS(val: boolean) {
                this._excludeVUS = val;
            },
            get excludeVUS() {
                return this._excludeVUS && this.driversAnnotated;
            },
            get driversAnnotated() {
                const anySelected =
                    this.oncoKb ||
                    this.hotspots ||
                    this.cbioportalCount ||
                    this.cosmicCount ||
                    this.customBinary ||
                    this.driverTiers
                        .entries()
                        .reduce(
                            (
                                oneSelected: boolean,
                                nextEntry: [string, boolean]
                            ) => {
                                return oneSelected || nextEntry[1];
                            },
                            false
                        );

                return anySelected;
            },

            get customBinary() {
                return this._customBinary === undefined
                    ? AppConfig.serverConfig
                          .oncoprint_custom_driver_annotation_binary_default
                    : this._customBinary;
            },

            get customTiersDefault() {
                return AppConfig.serverConfig
                    .oncoprint_custom_driver_annotation_tiers_default;
            },
        });

        this.driverAnnotationsReactionDisposer = reaction(
            () => this.urlWrapper.query.cancer_study_list,
            () => {
                this.initDriverAnnotationSettings();
            },
            { fireImmediately: true }
        );
    }

    destroy() {
        this.driverAnnotationsReactionDisposer();
    }

    public urlWrapper: ResultsViewURLWrapper;

    public driverAnnotationsReactionDisposer: any;

    @computed get oqlText() {
        return this.urlWrapper.query.gene_list;
    }

    @computed get genesetIds() {
        return this.urlWrapper.query.geneset_list &&
            this.urlWrapper.query.geneset_list.trim().length
            ? this.urlWrapper.query.geneset_list.trim().split(/\s+/)
            : [];
    }

    @computed get treatmentList() {
        return this.urlWrapper.query.treatment_list &&
            this.urlWrapper.query.treatment_list.trim().length
            ? this.urlWrapper.query.treatment_list.trim().split(/;/)
            : [];
    }

    @computed
    get cancerStudyIds() {
        return this.urlWrapper.query.cancer_study_list.split(',');
    }

    @computed
    get rppaScoreThreshold() {
        return this.urlWrapper.query.RPPA_SCORE_THRESHOLD
            ? parseFloat(this.urlWrapper.query.RPPA_SCORE_THRESHOLD)
            : DEFAULT_RPPA_THRESHOLD;
    }

    @computed
    get zScoreThreshold() {
        return this.urlWrapper.query.Z_SCORE_THRESHOLD
            ? parseFloat(this.urlWrapper.query.Z_SCORE_THRESHOLD)
            : DEFAULT_Z_SCORE_THRESHOLD;
    }

    @computed
    get selectedMolecularProfileIds() {
        return getMolecularProfiles(this.urlWrapper.query);
    }

    @computed get tabId() {
        return this.urlWrapper.tabId || ResultsViewTab.ONCOPRINT;
    }

    @observable public resultsPageSettingsVisible = false;

    @observable public checkingVirtualStudies = false;

    public queryStore: QueryStore;

    @observable public urlValidationError: string | null = null;

    @computed get profileFilter() {
        if (this.urlWrapper.query.profileFilter) {
            return parseInt(this.urlWrapper.query.profileFilter, 10);
        } else {
            return 0;
        }
    }

    @observable ajaxErrors: Error[] = [];

    @observable public sessionIdURL = '';

    @observable queryFormVisible: boolean = false;

    @computed get doNonSelectedDownloadableMolecularProfilesExist() {
        return (
            this.nonSelectedDownloadableMolecularProfilesGroupByName.result &&
            _.keys(
                this.nonSelectedDownloadableMolecularProfilesGroupByName.result
            ).length > 0
        );
    }

    @observable public modifyQueryParams:
        | ModifyQueryParams
        | undefined = undefined;

    public driverAnnotationSettings: DriverAnnotationSettings;

    @observable.ref private _mutationEnrichmentProfileMap: {
        [id: string]: MolecularProfile;
    } = {};
    @observable.ref private _copyNumberEnrichmentProfileMap: {
        [id: string]: MolecularProfile;
    } = {};
    @observable.ref private _mRNAEnrichmentProfileMap: {
        [id: string]: MolecularProfile;
    } = {};
    @observable.ref private _proteinEnrichmentProfileMap: {
        [id: string]: MolecularProfile;
    } = {};

    readonly selectedMutationEnrichmentProfileMap = remoteData({
        await: () => [this.mutationEnrichmentProfiles],
        invoke: () => {
            if (_.isEmpty(this._mutationEnrichmentProfileMap)) {
                const molecularProfilesMap = _.groupBy(
                    this.mutationEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesMap,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._mutationEnrichmentProfileMap);
            }
        },
    });

    readonly selectedCopyNumberEnrichmentProfileMap = remoteData({
        await: () => [this.copyNumberEnrichmentProfiles],
        invoke: () => {
            if (_.isEmpty(this._copyNumberEnrichmentProfileMap)) {
                const molecularProfilesMap = _.groupBy(
                    this.copyNumberEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesMap,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._copyNumberEnrichmentProfileMap);
            }
        },
    });

    readonly selectedmRNAEnrichmentProfileMap = remoteData({
        await: () => [this.mRNAEnrichmentProfiles],
        invoke: () => {
            if (_.isEmpty(this._mRNAEnrichmentProfileMap)) {
                const molecularProfilesMap = _.groupBy(
                    this.mRNAEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesMap,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._mRNAEnrichmentProfileMap);
            }
        },
    });

    readonly selectedProteinEnrichmentProfileMap = remoteData({
        await: () => [this.proteinEnrichmentProfiles],
        invoke: () => {
            if (_.isEmpty(this._proteinEnrichmentProfileMap)) {
                const molecularProfilesMap = _.groupBy(
                    this.proteinEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesMap,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._proteinEnrichmentProfileMap);
            }
        },
    });

    @action
    public setMutationEnrichmentProfileMap(profiles: {
        [id: string]: MolecularProfile;
    }) {
        this._mutationEnrichmentProfileMap = profiles;
    }

    @action
    public setCopyNumberEnrichmentProfileMap(profiles: {
        [id: string]: MolecularProfile;
    }) {
        this._copyNumberEnrichmentProfileMap = profiles;
    }

    @action
    public setmRNAEnrichmentProfile(profiles: {
        [id: string]: MolecularProfile;
    }) {
        this._mRNAEnrichmentProfileMap = profiles;
    }

    @action
    public setProteinEnrichmentProfile(profiles: {
        [id: string]: MolecularProfile;
    }) {
        this._proteinEnrichmentProfileMap = profiles;
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patient_enrichments === 'true';
    }

    @autobind
    @action
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({
            patient_enrichments: e.toString(),
        });
    }

    @autobind
    @action
    public setOncoprintAnalysisCaseType(e: OncoprintAnalysisCaseType) {
        this.urlWrapper.updateURL({
            show_samples: (e === OncoprintAnalysisCaseType.SAMPLE).toString(),
        } as Partial<CancerStudyQueryUrlParams>);
    }

    @computed
    public get excludeGermlineMutations() {
        return this.urlWrapper.query.exclude_germline_mutations === 'true';
    }

    @autobind
    @action
    public setExcludeGermlineMutations(e: boolean) {
        this.urlWrapper.updateURL({
            exclude_germline_mutations: e.toString(),
        });
    }

    @computed get hugoGeneSymbols() {
        if (this.urlWrapper.query.gene_list.length > 0) {
            return uniqueGenesInOQLQuery(this.urlWrapper.query.gene_list);
        } else {
            return [];
        }
    }

    @computed get queryContainsOql() {
        return doesQueryContainOQL(this.urlWrapper.query.gene_list);
    }

    @computed get queryContainsMutationOql() {
        return doesQueryContainMutationOQL(this.urlWrapper.query.gene_list);
    }

    @computed get sampleListCategory(): SampleListCategoryType | undefined {
        if (
            this.urlWrapper.query.case_set_id &&
            [
                SampleListCategoryType.w_mut,
                SampleListCategoryType.w_cna,
                SampleListCategoryType.w_mut_cna,
            ].includes(this.urlWrapper.query.case_set_id as any)
        ) {
            return this.urlWrapper.query.case_set_id as SampleListCategoryType;
        } else {
            return undefined;
        }
    }

    public initDriverAnnotationSettings() {
        this.driverAnnotationSettings.cbioportalCount = false;
        this.driverAnnotationSettings.cbioportalCountThreshold = 10;
        this.driverAnnotationSettings.cosmicCount = false;
        this.driverAnnotationSettings.cosmicCountThreshold = 10;
        this.driverAnnotationSettings.driverTiers = observable.map<boolean>();
        (this.driverAnnotationSettings as any)._oncoKb = !!AppConfig
            .serverConfig.oncoprint_oncokb_default;
        this.driverAnnotationSettings.hotspots = !!AppConfig.serverConfig
            .oncoprint_hotspots_default;
        (this.driverAnnotationSettings as any)._excludeVUS = !!AppConfig
            .serverConfig.oncoprint_hide_vus_default;
    }

    private makeMutationsTabFilteringSettings() {
        const self = this;
        let _excludeVus = observable.box<boolean | undefined>(undefined);
        let _excludeGermline = observable.box<boolean | undefined>(undefined);
        return observable({
            useOql: true,
            get excludeVus() {
                if (_excludeVus.get() === undefined) {
                    return self.driverAnnotationSettings.excludeVUS;
                } else {
                    return _excludeVus.get()!;
                }
            },
            get excludeGermline() {
                if (_excludeGermline.get() === undefined) {
                    return self.excludeGermlineMutations;
                } else {
                    return _excludeGermline.get()!;
                }
            },
            set excludeVus(s: boolean) {
                _excludeVus.set(s);
            },
            set excludeGermline(s: boolean) {
                _excludeGermline.set(s);
            },
        });
    }

    private getURL() {
        const shareURL = window.location.href;

        if (!shareURL.includes('session_id')) return;

        const showSamples = shareURL.indexOf('&show');
        if (showSamples > -1) {
            this.sessionIdURL = shareURL.slice(0, showSamples);
        }
    }

    readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.studyToMolecularProfiles, this.studies],
        invoke: () => {
            // if there are multiple studies or if there are no selected molecular profiles in query
            // derive default profiles based on profileFilter (refers to old data priority)
            if (
                this.studies.result.length > 1 ||
                this.selectedMolecularProfileIds.length === 0
            ) {
                return Promise.resolve(
                    getDefaultMolecularProfiles(
                        this.studyToMolecularProfiles.result!,
                        this.profileFilter
                    )
                );
            } else {
                // if we have only one study, then consult the selectedMolecularProfileIds because
                // user can directly select set
                const idLookupMap = _.keyBy(
                    this.selectedMolecularProfileIds,
                    (id: string) => id
                ); // optimization
                return Promise.resolve(
                    this.molecularProfilesInStudies.result!.filter(
                        (profile: MolecularProfile) =>
                            profile.molecularProfileId in idLookupMap
                    )
                );
            }
        },
    });

    readonly clinicalAttributes_profiledIn = remoteData<
        (ClinicalAttribute & { molecularProfileIds: string[] })[]
    >({
        await: () => [
            this.coverageInformation,
            this.molecularProfileIdToMolecularProfile,
            this.selectedMolecularProfiles,
            this.studyIds,
        ],
        invoke: () => {
            return Promise.resolve(
                makeProfiledInClinicalAttributes(
                    this.coverageInformation.result!.samples,
                    this.molecularProfileIdToMolecularProfile.result!,
                    this.selectedMolecularProfiles.result!,
                    this.studyIds.result!.length === 1
                )
            );
        },
    });

    readonly comparisonGroups = remoteData<Group[]>({
        await: () => [this.studyIds],
        invoke: async () => {
            let ret: Group[] = [];
            if (this.appStore.isLoggedIn) {
                try {
                    ret = ret.concat(
                        await comparisonClient.getGroupsForStudies(
                            this.studyIds.result!
                        )
                    );
                } catch (e) {
                    // fail silently
                }
            }
            // add any groups that are referenced in URL
            const clinicalTracksParam = this.urlWrapper.query.clinicallist;
            if (clinicalTracksParam) {
                const groupIds = clinicalTracksParam
                    .split(',') // split by comma
                    .filter((clinicalAttributeId: string) =>
                        clinicalAttributeIsINCOMPARISONGROUP({
                            clinicalAttributeId,
                        })
                    ) // filter for comparison group tracks
                    .map((clinicalAttributeId: string) =>
                        convertComparisonGroupClinicalAttribute(
                            clinicalAttributeId,
                            false
                        )
                    ); // convert track ids to group ids

                for (const id of groupIds) {
                    ret.push(await comparisonClient.getGroup(id));
                }
            }
            return ret;
        },
    });

    readonly clinicalAttributes_comparisonGroupMembership = remoteData<
        (ClinicalAttribute & { comparisonGroup: Group })[]
    >({
        await: () => [this.comparisonGroups],
        invoke: () =>
            Promise.resolve(
                makeComparisonGroupClinicalAttributes(
                    this.comparisonGroups.result!
                )
            ),
    });

    readonly alterationsBySelectedMolecularProfiles = remoteData<string[]>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profiles: MolecularProfile[] = this.selectedMolecularProfiles
                .result!;
            const alterations: string[] = [];
            profiles.forEach(profile => {
                switch (profile.molecularAlterationType) {
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        alterations.push(
                            AlterationTypeDisplayConstants.COPY_NUMBER_ALTERATION
                        );
                        break;
                    case AlterationTypeConstants.MRNA_EXPRESSION:
                        alterations.push(
                            AlterationTypeDisplayConstants.MRNA_EXPRESSION
                        );
                        break;
                    case AlterationTypeConstants.PROTEIN_LEVEL:
                        alterations.push(
                            AlterationTypeDisplayConstants.PROTEIN_LEVEL
                        );
                        break;
                    case AlterationTypeConstants.MUTATION_EXTENDED:
                        AlterationTypeDisplayConstants.MUTATION_EXTENDED.forEach(
                            mutationSubType => alterations.push(mutationSubType)
                        );
                        break;
                    default:
                }
            });
            return Promise.resolve(_.uniq(alterations));
        },
    });

    readonly selectedMolecularProfileIdsByAlterationType = remoteData<{
        [alterationType: string]: MolecularProfile[];
    }>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profiles: MolecularProfile[] = this.selectedMolecularProfiles
                .result!;
            return Promise.resolve(
                _.groupBy(profiles, 'molecularAlterationType')
            );
        },
    });

    readonly clinicalAttributes = remoteData<
        (ClinicalAttribute & { molecularProfileIds?: string[] })[]
    >({
        await: () => [
            this.studyIds,
            this.clinicalAttributes_profiledIn,
            this.clinicalAttributes_comparisonGroupMembership,
            this.samples,
            this.patients,
        ],
        invoke: async () => {
            const serverAttributes = await client.fetchClinicalAttributesUsingPOST(
                {
                    studyIds: this.studyIds.result!,
                }
            );
            const specialAttributes = [
                {
                    clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                    datatype: 'COUNTS_MAP',
                    description:
                        'Number of point mutations in the sample counted by different types of nucleotide changes.',
                    displayName: 'Mutation spectrum',
                    patientAttribute: false,
                    studyId: '',
                    priority: '0', // TODO: change?
                } as ClinicalAttribute,
            ];
            if (this.studyIds.result!.length > 1) {
                // if more than one study, add "Study of Origin" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.StudyOfOrigin,
                    datatype: 'STRING',
                    description: 'Study which the sample is a part of.',
                    displayName: 'Study of origin',
                    patientAttribute: false,
                    studyId: '',
                    priority: '0', // TODO: change?
                } as ClinicalAttribute);
            }
            if (this.samples.result!.length !== this.patients.result!.length) {
                // if different number of samples and patients, add "Num Samples of Patient" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.NumSamplesPerPatient,
                    datatype: 'NUMBER',
                    description: 'Number of queried samples for each patient.',
                    displayName: '# Samples per Patient',
                    patientAttribute: true,
                } as ClinicalAttribute);
            }
            return serverAttributes
                .concat(specialAttributes)
                .concat(this.clinicalAttributes_profiledIn.result!)
                .concat(
                    this.clinicalAttributes_comparisonGroupMembership.result!
                );
        },
    });

    readonly clinicalAttributeIdToClinicalAttribute = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.clinicalAttributes.result!, 'clinicalAttributeId')
            ),
    });

    readonly clinicalAttributeIdToAvailableSampleCount = remoteData({
        await: () => [
            this.samples,
            this.studies,
            this.clinicalAttributes,
            this.studyToDataQueryFilter,
            this.clinicalAttributes_profiledIn,
            this.clinicalAttributes_comparisonGroupMembership,
        ],
        invoke: async () => {
            let clinicalAttributeCountFilter: ClinicalAttributeCountFilter;
            if (this.studies.result.length === 1) {
                // try using sample list id
                const studyId = this.studies.result![0].studyId;
                const dqf = this.studyToDataQueryFilter.result[studyId];
                if (dqf.sampleListId) {
                    clinicalAttributeCountFilter = {
                        sampleListId: dqf.sampleListId,
                    } as ClinicalAttributeCountFilter;
                } else {
                    clinicalAttributeCountFilter = {
                        sampleIdentifiers: dqf.sampleIds!.map(sampleId => ({
                            sampleId,
                            studyId,
                        })),
                    } as ClinicalAttributeCountFilter;
                }
            } else {
                // use sample identifiers
                clinicalAttributeCountFilter = {
                    sampleIdentifiers: this.samples.result!.map(sample => ({
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                    })),
                } as ClinicalAttributeCountFilter;
            }

            const result = await client.getClinicalAttributeCountsUsingPOST({
                clinicalAttributeCountFilter,
            });
            // build map
            const ret: { [clinicalAttributeId: string]: number } = _.reduce(
                result,
                (
                    map: { [clinicalAttributeId: string]: number },
                    next: ClinicalAttributeCount
                ) => {
                    map[next.clinicalAttributeId] =
                        map[next.clinicalAttributeId] || 0;
                    map[next.clinicalAttributeId] += next.count;
                    return map;
                },
                {}
            );
            // add count = 0 for any remaining clinical attributes, since service doesnt return count 0
            for (const clinicalAttribute of this.clinicalAttributes.result!) {
                if (!(clinicalAttribute.clinicalAttributeId in ret)) {
                    ret[clinicalAttribute.clinicalAttributeId] = 0;
                }
            }
            // add counts for "special" clinical attributes
            ret[
                SpecialAttribute.NumSamplesPerPatient
            ] = this.samples.result!.length;
            ret[SpecialAttribute.StudyOfOrigin] = this.samples.result!.length;
            let samplesWithMutationData = 0,
                samplesWithCNAData = 0;
            for (const sample of this.samples.result!) {
                samplesWithMutationData += +!!sample.sequenced;
                samplesWithCNAData += +!!sample.copyNumberSegmentPresent;
            }
            ret[SpecialAttribute.MutationSpectrum] = samplesWithMutationData;
            // add counts for "ProfiledIn" clinical attributes
            for (const attr of this.clinicalAttributes_profiledIn.result!) {
                ret[attr.clinicalAttributeId] = this.samples.result!.length;
            }
            // add counts for "ComparisonGroup" clinical attributes
            for (const attr of this.clinicalAttributes_comparisonGroupMembership
                .result!) {
                ret[attr.clinicalAttributeId] = getNumSamples(
                    attr.comparisonGroup!.data
                );
            }
            return ret;
        },
    });

    readonly cnSegments = remoteData<CopyNumberSeg[]>(
        {
            await: () => [this.samples],
            invoke: () =>
                fetchCopyNumberSegmentsForSamples(this.samples.result),
        },
        []
    );

    readonly cnSegmentsByChromosome = remoteData<{
        [chromosome: string]: MobxPromise<CopyNumberSeg[]>;
    }>(
        {
            await: () => [this.genes, this.samples, this.referenceGenes],
            invoke: () => {
                const uniqueReferenceGeneChromosomes = _.uniq(
                    this.referenceGenes.result!.map(g => g.chromosome)
                );
                return Promise.resolve(
                    uniqueReferenceGeneChromosomes.reduce(
                        (
                            map: {
                                [chromosome: string]: MobxPromise<
                                    CopyNumberSeg[]
                                >;
                            },
                            chromosome: string
                        ) => {
                            map[chromosome] = remoteData<CopyNumberSeg[]>({
                                invoke: () =>
                                    fetchCopyNumberSegmentsForSamples(
                                        this.samples.result,
                                        chromosome
                                    ),
                            });
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    readonly molecularData = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.studyToDataQueryFilter,
            this.genes,
            this.selectedMolecularProfiles,
            this.samples,
        ],
        invoke: () => {
            // we get mutations with mutations endpoint, structural variants and fusions with structural variant endpoint.
            // filter out mutation genetic profile and structural variant profiles
            const profilesWithoutMutationProfile = excludeMutationAndSVProfiles(
                this.selectedMolecularProfiles.result!
            );
            const genes = this.genes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != undefined &&
                genes.length
            ) {
                const identifiers: SampleMolecularIdentifier[] = [];

                profilesWithoutMutationProfile.forEach(
                    (profile: MolecularProfile) => {
                        // for each profile, find samples which share studyId with profile and add identifier
                        this.samples.result.forEach((sample: Sample) => {
                            if (sample.studyId === profile.studyId) {
                                identifiers.push({
                                    molecularProfileId:
                                        profile.molecularProfileId,
                                    sampleId: sample.sampleId,
                                });
                            }
                        });
                    }
                );

                if (identifiers.length) {
                    return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                        {
                            projection: 'DETAILED',
                            molecularDataMultipleStudyFilter: {
                                entrezGeneIds: _.map(
                                    this.genes.result,
                                    (gene: Gene) => gene.entrezGeneId
                                ),
                                sampleMolecularIdentifiers: identifiers,
                            } as MolecularDataMultipleStudyFilter,
                        }
                    );
                }
            }

            return Promise.resolve([]);
        },
    });

    // other molecular profiles data download needs the data from non queried molecular profiles
    readonly nonSelectedDownloadableMolecularData = remoteData<
        NumericGeneMolecularData[]
    >({
        await: () => [
            this.studyToDataQueryFilter,
            this.genes,
            this.nonSelectedDownloadableMolecularProfiles,
            this.samples,
        ],
        invoke: () => {
            // we get mutations with mutations endpoint, structural variants and fusions with structural variant endpoint.
            // filter out mutation genetic profile and structural variant profiles
            const profilesWithoutMutationProfile = excludeMutationAndSVProfiles(
                this.nonSelectedDownloadableMolecularProfiles.result
            );
            const genes = this.genes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != undefined &&
                genes.length
            ) {
                const profilesWithoutMutationProfileGroupByStudyId = _.groupBy(
                    profilesWithoutMutationProfile,
                    profile => profile.studyId
                );
                // find samples which share studyId with profile and add identifier
                const sampleIdentifiers: SampleMolecularIdentifier[] = this.samples.result
                    .filter(
                        sample =>
                            sample.studyId in
                            profilesWithoutMutationProfileGroupByStudyId
                    )
                    .reduce((acc: SampleMolecularIdentifier[], sample) => {
                        acc = acc.concat(
                            profilesWithoutMutationProfileGroupByStudyId[
                                sample.studyId
                            ].map(profile => {
                                return {
                                    molecularProfileId:
                                        profile.molecularProfileId,
                                    sampleId: sample.sampleId,
                                } as SampleMolecularIdentifier;
                            })
                        );
                        return acc;
                    }, []);

                if (sampleIdentifiers.length) {
                    return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                        {
                            projection: 'DETAILED',
                            molecularDataMultipleStudyFilter: {
                                entrezGeneIds: _.map(
                                    this.genes.result,
                                    (gene: Gene) => gene.entrezGeneId
                                ),
                                sampleMolecularIdentifiers: sampleIdentifiers,
                            } as MolecularDataMultipleStudyFilter,
                        }
                    );
                }
            }

            return Promise.resolve([]);
        },
    });

    readonly coexpressionTabMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () =>
            Promise.resolve(
                sortRnaSeqProfilesToTop(
                    filterAndSortProfiles(
                        this.molecularProfilesInStudies.result!
                    ).concat(
                        getGenesetProfiles(
                            this.molecularProfilesInStudies.result!
                        )
                    )
                )
            ),
    });

    readonly isThereDataForCoExpressionTab = remoteData<boolean>({
        await: () => [
            this.molecularProfilesInStudies,
            this.genes,
            this.samples,
        ],
        invoke: () => {
            const coExpressionProfiles = filterAndSortProfiles(
                this.molecularProfilesInStudies.result!
            );
            const studyToProfiles = _.groupBy(coExpressionProfiles, 'studyId');
            // we know these are all mrna and protein profiles
            const sampleMolecularIdentifiers = _.flatten(
                this.samples.result!.map(s => {
                    const profiles = studyToProfiles[s.studyId];
                    if (profiles) {
                        return profiles.map(p => ({
                            molecularProfileId: p.molecularProfileId,
                            sampleId: s.sampleId,
                        }));
                    } else {
                        return [];
                    }
                })
            );
            const entrezGeneIds = this.genes.result!.map(g => g.entrezGeneId);
            if (
                sampleMolecularIdentifiers.length > 0 &&
                entrezGeneIds.length > 0
            ) {
                return client
                    .fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(
                        {
                            molecularDataMultipleStudyFilter: {
                                entrezGeneIds,
                                sampleMolecularIdentifiers,
                            } as MolecularDataMultipleStudyFilter,
                            projection: 'META',
                        }
                    )
                    .then(function(response: request.Response) {
                        const count = parseInt(
                            response.header['total-count'],
                            10
                        );
                        return count > 0;
                    });
            } else {
                return Promise.resolve(false);
            }
        },
    });

    // remoteNgchmUrl queries mdanderson.org to test if there are NGCHMs for one selected
    // study.  The result is either the full URL to a portal page, or an empty string.
    readonly remoteNgchmUrl = remoteData<string>({
        await: () => [this.studyIds],
        invoke: async () => {
            var result = '';

            if (this.studyIds.result!.length === 1) {
                const queryData = {
                    studyid: this.studyIds.result![0],
                    format: 'json',
                };

                var urlResponse;

                try {
                    urlResponse = (await request
                        .get('https://bioinformatics.mdanderson.org/study2url')
                        .timeout(30000)
                        .query(queryData)) as any;
                } catch (err) {
                    // Just eat the exception. Result will be empty string.
                }

                if (urlResponse && urlResponse.body.fileContent) {
                    const parsedUrlResponse = JSON.parse(
                        urlResponse.body.fileContent.trimEnd()
                    ) as any;

                    if (parsedUrlResponse.length >= 1) {
                        // This is faked out for now.  study2url needs mods to include site url
                        result =
                            'https://bioinformatics.mdanderson.org/TCGA/NGCHMPortal?' +
                            parsedUrlResponse[0];
                    }
                }
            }

            return Promise.resolve(result);
        },
    });

    readonly molecularProfilesWithData = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
            this.genes,
            this.genesets,
            this.treatmentsInStudies,
        ],
        invoke: async () => {
            const ret: MolecularProfile[] = [];
            const promises = [];
            const studyToDataQueryFilter = this.studyToDataQueryFilter.result!;
            for (const profile of this.molecularProfilesInStudies.result!) {
                const dataQueryFilter = studyToDataQueryFilter[profile.studyId];

                // there could be no samples if a study doesn't have a sample list matching a specified category (e.g. cna only)
                if (
                    !dataQueryFilter ||
                    (!dataQueryFilter.sampleIds &&
                        !dataQueryFilter.sampleListId)
                ) {
                    continue;
                }

                const molecularProfileId = profile.molecularProfileId;
                const projection = 'META';
                const dataFilter = {
                    entrezGeneIds: this.genes.result!.map(g => g.entrezGeneId),
                    ...dataQueryFilter,
                } as MolecularDataFilter & MutationFilter;

                if (
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
                ) {
                    // handle mutation profile
                    promises.push(
                        client
                            .fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(
                                {
                                    molecularProfileId,
                                    mutationFilter: dataFilter,
                                    projection,
                                }
                            )
                            .then(function(response: request.Response) {
                                const count = parseInt(
                                    response.header['sample-count'],
                                    10
                                );
                                if (count > 0) {
                                    // theres data for at least one of the query genes
                                    ret.push(profile);
                                }
                            })
                    );
                } else if (
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_UNCALLED
                ) {
                    // exclude the MUTATION_UNCALLED profile, this profile should only be used in patient view
                } else if (
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENESET_SCORE ||
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                ) {
                    // geneset profile, we dont have the META projection for geneset data, so just add it
                    /*promises.push(internalClient.fetchGeneticDataItemsUsingPOST({
                        geneticProfileId: molecularProfileId,
                        genesetDataFilterCriteria: {
                            genesetIds: this.genesets.result!.map(g=>g.genesetId),
                            ...dataQueryFilter
                        } as GenesetDataFilterCriteria,
                        projection
                    }).then(function(response: request.Response) {
                        const count = parseInt(response.header["total-count"], 10);
                        if (count > 0) {
                            // theres data for at least one of the query genes
                            ret.push(profile);
                        }
                    }));*/
                    ret.push(profile);
                } else {
                    // handle non-mutation profile
                    promises.push(
                        client
                            .fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(
                                {
                                    molecularProfileId,
                                    molecularDataFilter: dataFilter,
                                    projection,
                                }
                            )
                            .then(function(response: request.Response) {
                                const count = parseInt(
                                    response.header['total-count'],
                                    10
                                );
                                if (count > 0) {
                                    // theres data for at least one of the query genes
                                    ret.push(profile);
                                }
                            })
                    );
                }
            }
            await Promise.all(promises);
            return ret;
        },
    });

    readonly nonOqlFilteredAlterations = remoteData<ExtendedAlteration[]>({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedMolecularData,
            this.selectedMolecularProfiles,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            const accessors = new AccessorsForOqlFilter(
                this.selectedMolecularProfiles.result!
            );
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
            let result: (
                | AnnotatedMutation
                | AnnotatedNumericGeneMolecularData)[] = [];
            result = result.concat(this.filteredAndAnnotatedMutations.result!);
            result = result.concat(
                this.filteredAndAnnotatedMolecularData.result!
            );
            return Promise.resolve(
                result.map(d => {
                    const extendedD: ExtendedAlteration = annotateAlterationTypes(
                        d,
                        accessors
                    );
                    extendedD.hugoGeneSymbol =
                        entrezGeneIdToGene[d.entrezGeneId].hugoGeneSymbol;
                    extendedD.molecularProfileAlterationType = accessors.molecularAlterationType(
                        d.molecularProfileId
                    );
                    return extendedD;
                })
            );
        },
    });

    readonly oqlFilteredMutationsReport = remoteData({
        await: () => [
            this._filteredAndAnnotatedMutationsReport,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this._filteredAndAnnotatedMutationsReport.result!,
                    data =>
                        filterCBioPortalWebServiceData(
                            this.oqlText,
                            data,
                            new AccessorsForOqlFilter(
                                this.selectedMolecularProfiles.result!
                            ),
                            this.defaultOQLQuery.result!
                        )
                )
            );
        },
    });

    readonly oqlFilteredMolecularDataReport = remoteData({
        await: () => [
            this._filteredAndAnnotatedMolecularDataReport,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this._filteredAndAnnotatedMolecularDataReport.result!,
                    data =>
                        filterCBioPortalWebServiceData(
                            this.oqlText,
                            data,
                            new AccessorsForOqlFilter(
                                this.selectedMolecularProfiles.result!
                            ),
                            this.defaultOQLQuery.result!
                        )
                )
            );
        },
    });

    readonly oqlFilteredAlterations = remoteData<ExtendedAlteration[]>({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedMolecularData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            if (this.oqlText.trim() != '') {
                let data: (
                    | AnnotatedMutation
                    | AnnotatedNumericGeneMolecularData)[] = [];
                data = data.concat(this.filteredAndAnnotatedMutations.result!);
                data = data.concat(
                    this.filteredAndAnnotatedMolecularData.result!
                );
                return Promise.resolve(
                    filterCBioPortalWebServiceData(
                        this.oqlText,
                        data,
                        new AccessorsForOqlFilter(
                            this.selectedMolecularProfiles.result!
                        ),
                        this.defaultOQLQuery.result!
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly oqlFilteredCaseAggregatedData = remoteData<
        CaseAggregatedData<ExtendedAlteration>
    >({
        await: () => [this.oqlFilteredAlterations, this.samples, this.patients],
        invoke: () => {
            return Promise.resolve({
                samples: groupBy(
                    this.oqlFilteredAlterations.result!,
                    alteration => alteration.uniqueSampleKey,
                    this.samples.result!.map(sample => sample.uniqueSampleKey)
                ),
                patients: groupBy(
                    this.oqlFilteredAlterations.result!,
                    alteration => alteration.uniquePatientKey,
                    this.patients.result!.map(sample => sample.uniquePatientKey)
                ),
            });
        },
    });

    readonly nonOqlFilteredCaseAggregatedData = remoteData<
        CaseAggregatedData<ExtendedAlteration>
    >({
        await: () => [
            this.nonOqlFilteredAlterations,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            return Promise.resolve({
                samples: groupBy(
                    this.nonOqlFilteredAlterations.result!,
                    alteration => alteration.uniqueSampleKey,
                    this.samples.result!.map(sample => sample.uniqueSampleKey)
                ),
                patients: groupBy(
                    this.nonOqlFilteredAlterations.result!,
                    alteration => alteration.uniquePatientKey,
                    this.patients.result!.map(sample => sample.uniquePatientKey)
                ),
            });
        },
    });

    readonly oqlFilteredCaseAggregatedDataByUnflattenedOQLLine = remoteData<
        IQueriedMergedTrackCaseData[]
    >({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedMolecularData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            const data = [
                ...this.filteredAndAnnotatedMutations.result!,
                ...this.filteredAndAnnotatedMolecularData.result!,
            ];
            const accessorsInstance = new AccessorsForOqlFilter(
                this.selectedMolecularProfiles.result!
            );
            const defaultOQLQuery = this.defaultOQLQuery.result!;
            const samples = this.samples.result!;
            const patients = this.patients.result!;

            if (this.oqlText.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: UnflattenedOQLLineFilterOutput<
                    AnnotatedExtendedAlteration
                >[] = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                    this.oqlText,
                    data,
                    accessorsInstance,
                    defaultOQLQuery
                );

                return Promise.resolve(
                    filteredAlterationsByOQLLine.map(oqlLine => ({
                        cases: groupDataByCase(oqlLine, samples, patients),
                        oql: oqlLine,
                        mergedTrackOqlList: filterSubQueryData(
                            oqlLine,
                            defaultOQLQuery,
                            data,
                            accessorsInstance,
                            samples,
                            patients
                        ),
                    }))
                );
            }
        },
    });

    readonly isSampleAlteredMap = remoteData({
        await: () => [
            this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.samples,
            this.coverageInformation,
            this.selectedMolecularProfiles,
            this.studyToMolecularProfiles,
        ],
        invoke: async () => {
            return getSampleAlteredMap(
                this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!,
                this.samples.result,
                this.oqlText,
                this.coverageInformation.result,
                this.selectedMolecularProfiles.result!.map(
                    profile => profile.molecularProfileId
                ),
                this.studyToMolecularProfiles.result!
            );
        },
    });

    readonly oqlFilteredCaseAggregatedDataByOQLLine = remoteData<
        IQueriedCaseData<AnnotatedExtendedAlteration>[]
    >({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedMolecularData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            if (this.oqlText.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: OQLLineFilterOutput<
                    AnnotatedExtendedAlteration
                >[] = filterCBioPortalWebServiceDataByOQLLine(
                    this.oqlText,
                    [
                        ...this.filteredAndAnnotatedMutations.result!,
                        ...this.filteredAndAnnotatedMolecularData.result!,
                    ],
                    new AccessorsForOqlFilter(
                        this.selectedMolecularProfiles.result!
                    ),
                    this.defaultOQLQuery.result!
                );

                return Promise.resolve(
                    filteredAlterationsByOQLLine.map(oql => ({
                        cases: groupDataByCase(
                            oql,
                            this.samples.result!,
                            this.patients.result!
                        ),
                        oql,
                    }))
                );
            }
        },
    });

    readonly studyToMolecularProfiles = remoteData({
        await: () => [this.molecularProfilesInStudies],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.molecularProfilesInStudies.result!,
                    profile => profile.studyId
                )
            );
        },
    });

    readonly coverageInformation = remoteData<CoverageInformation>(
        {
            await: () => [
                this.studyToMolecularProfiles,
                this.genes,
                this.samples,
                this.patients,
            ],
            invoke: async () => {
                //const studyToMolecularProfiles = _.groupBy(this.studyToMolecularProfiles.result!, profile=>profile.studyId);
                const sampleMolecularIdentifiers: SampleMolecularIdentifier[] = [];
                this.samples.result!.forEach(sample => {
                    const profiles = this.studyToMolecularProfiles.result![
                        sample.studyId
                    ];
                    if (profiles) {
                        const sampleId = sample.sampleId;
                        for (const profile of profiles) {
                            sampleMolecularIdentifiers.push({
                                molecularProfileId: profile.molecularProfileId,
                                sampleId,
                            });
                        }
                    }
                });
                let genePanelData: GenePanelData[];
                if (
                    sampleMolecularIdentifiers.length &&
                    this.genes.result!.length
                ) {
                    genePanelData = await client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
                        {
                            sampleMolecularIdentifiers: sampleMolecularIdentifiers,
                        }
                    );
                } else {
                    genePanelData = [];
                }

                const genePanelIds = _.uniq(
                    genePanelData
                        .map(gpData => gpData.genePanelId)
                        .filter(id => !!id)
                );
                let genePanels: GenePanel[] = [];
                if (genePanelIds.length) {
                    genePanels = await client.fetchGenePanelsUsingPOST({
                        genePanelIds,
                        projection: 'DETAILED',
                    });
                }
                return computeGenePanelInformation(
                    genePanelData,
                    genePanels,
                    this.samples.result!,
                    this.patients.result!,
                    this.genes.result!
                );
            },
        },
        { samples: {}, patients: {} }
    );

    readonly sequencedSampleKeys = remoteData<string[]>({
        await: () => [
            this.samples,
            this.coverageInformation,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            const genePanelInformation = this.coverageInformation.result!;
            const profileIds = this.selectedMolecularProfiles.result!.map(
                p => p.molecularProfileId
            );
            return Promise.resolve(
                _.chain(this.samples.result!)
                    .filter(sample => {
                        return _.some(
                            isSampleProfiledInMultiple(
                                sample.uniqueSampleKey,
                                profileIds,
                                genePanelInformation
                            )
                        );
                    })
                    .map(s => s.uniqueSampleKey)
                    .value()
            );
        },
    });

    readonly sequencedPatientKeys = remoteData<string[]>({
        await: () => [this.sampleKeyToSample, this.sequencedSampleKeys],
        invoke: async () => {
            const sampleKeyToSample = this.sampleKeyToSample.result!;
            return _.chain(this.sequencedSampleKeys.result!)
                .map(k => sampleKeyToSample[k].uniquePatientKey)
                .uniq()
                .value();
        },
    });

    readonly sequencedSampleKeysByGene = remoteData<{
        [hugoGeneSymbol: string]: string[];
    }>({
        await: () => [
            this.samples,
            this.genes,
            this.coverageInformation,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            const genePanelInformation = this.coverageInformation.result!;
            const profileIds = this.selectedMolecularProfiles.result!.map(
                p => p.molecularProfileId
            );
            return Promise.resolve(
                this.genes.result!.reduce(
                    (
                        map: { [hugoGeneSymbol: string]: string[] },
                        next: Gene
                    ) => {
                        map[next.hugoGeneSymbol] = this.samples
                            .result!.map(s => s.uniqueSampleKey)
                            .filter(k => {
                                return _.some(
                                    isSampleProfiledInMultiple(
                                        k,
                                        profileIds,
                                        genePanelInformation,
                                        next.hugoGeneSymbol
                                    )
                                );
                            });
                        return map;
                    },
                    {}
                )
            );
        },
    });

    readonly existUnsequencedSamplesInAGene = remoteData<boolean>({
        await: () => [this.samples, this.sequencedSampleKeysByGene],
        invoke: () => {
            const totalSamples = this.samples.result!.length;
            return Promise.resolve(
                _.some(this.sequencedSampleKeysByGene.result!, sampleKeys => {
                    return sampleKeys.length < totalSamples;
                })
            );
        },
    });

    readonly sequencedPatientKeysByGene = remoteData<{
        [hugoGeneSymbol: string]: string[];
    }>({
        await: () => [this.sampleKeyToSample, this.sequencedSampleKeysByGene],
        invoke: async () => {
            const sampleKeyToSample = this.sampleKeyToSample.result!;
            return _.mapValues(
                this.sequencedSampleKeysByGene.result!,
                sampleKeys => {
                    return _.chain(sampleKeys)
                        .map(k => sampleKeyToSample[k].uniquePatientKey)
                        .uniq()
                        .value();
                }
            );
        },
    });

    readonly alteredSampleKeys = remoteData({
        await: () => [this.samples, this.oqlFilteredCaseAggregatedData],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!.samples;
            return Promise.resolve(
                this.samples
                    .result!.map(s => s.uniqueSampleKey)
                    .filter(sampleKey => {
                        return caseAggregatedData[sampleKey].length > 0;
                    })
            );
        },
    });

    readonly alteredSamples = remoteData<Sample[]>(
        {
            await: () => [this.sampleKeyToSample, this.alteredSampleKeys],
            invoke: () => {
                return Promise.resolve(
                    this.alteredSampleKeys.result!.map(
                        a => this.sampleKeyToSample.result![a]
                    )
                );
            },
        },
        []
    );

    readonly alteredPatients = remoteData({
        await: () => [this.patients, this.oqlFilteredCaseAggregatedData],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!;
            return Promise.resolve(
                this.patients.result!.filter(
                    patient =>
                        !!caseAggregatedData.patients[patient.uniquePatientKey]
                            .length
                )
            );
        },
    });

    readonly alteredPatientKeys = remoteData({
        await: () => [this.alteredPatients],
        invoke: () =>
            Promise.resolve(
                this.alteredPatients.result!.map(p => p.uniquePatientKey)
            ),
    });

    readonly unalteredSampleKeys = remoteData({
        await: () => [this.samples, this.oqlFilteredCaseAggregatedData],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!;
            return Promise.resolve(
                this.samples
                    .result!.map(s => s.uniqueSampleKey)
                    .filter(
                        sampleKey =>
                            !caseAggregatedData.samples[sampleKey].length
                    )
            );
        },
    });

    readonly unalteredSamples = remoteData<Sample[]>(
        {
            await: () => [this.sampleKeyToSample, this.unalteredSampleKeys],
            invoke: () => {
                const unalteredSamples: Sample[] = [];
                this.unalteredSampleKeys.result!.forEach(a =>
                    unalteredSamples.push(this.sampleKeyToSample.result![a])
                );
                return Promise.resolve(unalteredSamples);
            },
        },
        []
    );

    readonly unalteredPatientKeys = remoteData({
        await: () => [this.unalteredPatients],
        invoke: () =>
            Promise.resolve(
                this.unalteredPatients.result!.map(p => p.uniquePatientKey)
            ),
    });

    readonly unalteredPatients = remoteData({
        await: () => [this.patients, this.oqlFilteredCaseAggregatedData],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!;
            return Promise.resolve(
                this.patients.result!.filter(
                    patient =>
                        !caseAggregatedData.patients[patient.uniquePatientKey]
                            .length
                )
            );
        },
    });

    readonly oqlFilteredAlterationsByGene = remoteData<{
        [hugoGeneSymbol: string]: ExtendedAlteration[];
    }>({
        await: () => [this.genes, this.oqlFilteredAlterations],
        invoke: () => {
            // first group them by gene symbol
            const groupedGenesMap = _.groupBy(
                this.oqlFilteredAlterations.result!,
                alteration => alteration.gene.hugoGeneSymbol
            );
            // kind of ugly but this fixes a bug where sort order of genes not respected
            // yes we are relying on add order of js map. in theory not guaranteed, in practice guaranteed
            const ret = this.genes.result!.reduce(
                (
                    memo: { [hugoGeneSymbol: string]: ExtendedAlteration[] },
                    gene: Gene
                ) => {
                    memo[gene.hugoGeneSymbol] =
                        groupedGenesMap[gene.hugoGeneSymbol];
                    return memo;
                },
                {}
            );

            return Promise.resolve(ret);
        },
    });

    readonly defaultOQLQuery = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profileTypes = _.uniq(
                _.map(
                    this.selectedMolecularProfiles.result,
                    profile => profile.molecularAlterationType
                )
            );
            return Promise.resolve(
                buildDefaultOQLProfile(
                    profileTypes,
                    this.zScoreThreshold,
                    this.rppaScoreThreshold
                )
            );
        },
    });

    readonly samplesByDetailedCancerType = remoteData<{
        [cancerType: string]: Sample[];
    }>({
        await: () => [this.samples, this.clinicalDataForSamples],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForSamples.result,
                this.samples.result,
                'CANCER_TYPE'
            );
            if (_.size(groupedSamples) === 1) {
                groupedSamples = this.groupSamplesByCancerType(
                    this.clinicalDataForSamples.result,
                    this.samples.result,
                    'CANCER_TYPE_DETAILED'
                );
            }
            return Promise.resolve(groupedSamples);
        },
    });

    readonly samplesExtendedWithClinicalData = remoteData<ExtendedSample[]>({
        await: () => [this.samples, this.clinicalDataForSamples, this.studies],
        invoke: () => {
            return Promise.resolve(
                extendSamplesWithCancerType(
                    this.samples.result,
                    this.clinicalDataForSamples.result,
                    this.studies.result
                )
            );
        },
    });

    public groupSamplesByCancerType(
        clinicalDataForSamples: ClinicalData[],
        samples: Sample[],
        cancerTypeLevel: 'CANCER_TYPE' | 'CANCER_TYPE_DETAILED'
    ) {
        // first generate map of sampleId to it's cancer type
        const sampleKeyToCancerTypeClinicalDataMap = _.reduce(
            clinicalDataForSamples,
            (memo, clinicalData: ClinicalData) => {
                if (clinicalData.clinicalAttributeId === cancerTypeLevel) {
                    memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                }

                // if we were told CANCER_TYPE and we find CANCER_TYPE_DETAILED, then fall back on it. if we encounter
                // a CANCER_TYPE later, it will override this.
                if (cancerTypeLevel === 'CANCER_TYPE') {
                    if (
                        !memo[clinicalData.uniqueSampleKey] &&
                        clinicalData.clinicalAttributeId ===
                            'CANCER_TYPE_DETAILED'
                    ) {
                        memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                    }
                }

                return memo;
            },
            {} as { [uniqueSampleId: string]: string }
        );

        // now group samples by cancer type
        let samplesGroupedByCancerType = _.reduce(
            samples,
            (memo: { [cancerType: string]: Sample[] }, sample: Sample) => {
                // if it appears in map, then we have a cancer type
                if (
                    sample.uniqueSampleKey in
                    sampleKeyToCancerTypeClinicalDataMap
                ) {
                    memo[
                        sampleKeyToCancerTypeClinicalDataMap[
                            sample.uniqueSampleKey
                        ]
                    ] =
                        memo[
                            sampleKeyToCancerTypeClinicalDataMap[
                                sample.uniqueSampleKey
                            ]
                        ] || [];
                    memo[
                        sampleKeyToCancerTypeClinicalDataMap[
                            sample.uniqueSampleKey
                        ]
                    ].push(sample);
                } else {
                    // TODO: we need to fall back to study cancer type
                }
                return memo;
            },
            {} as { [cancerType: string]: Sample[] }
        );

        return samplesGroupedByCancerType;
        //
    }

    readonly oqlFilteredAlterationsByGeneBySampleKey = remoteData<{
        [hugoGeneSymbol: string]: {
            [uniquSampleKey: string]: ExtendedAlteration[];
        };
    }>({
        await: () => [this.oqlFilteredAlterationsByGene, this.samples],
        invoke: async () => {
            return _.mapValues(
                this.oqlFilteredAlterationsByGene.result,
                (alterations: ExtendedAlteration[]) => {
                    return _.groupBy(
                        alterations,
                        (alteration: ExtendedAlteration) =>
                            alteration.uniqueSampleKey
                    );
                }
            );
        },
    });

    //contains all the physical studies for the current selected cohort ids
    //selected cohort ids can be any combination of physical_study_id and virtual_study_id(shared or saved ones)
    public get physicalStudySet(): { [studyId: string]: CancerStudy } {
        return _.keyBy(
            this.studies.result,
            (study: CancerStudy) => study.studyId
        );
    }

    // used in building virtual study
    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [
            this.samples,
            this.queriedStudies,
            this.queriedVirtualStudies,
        ],
        invoke: () => {
            return Promise.resolve(
                getFilteredStudiesWithSamples(
                    this.samples.result,
                    this.queriedStudies.result,
                    this.queriedVirtualStudies.result
                )
            );
        },
        onError: error => {},
        default: [],
    });

    readonly mutationProfiles = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: async () => {
            return this.selectedMolecularProfiles.result!.filter(
                profile =>
                    profile.molecularAlterationType === 'MUTATION_EXTENDED'
            );
        },
        onError: error => {},
        default: [],
    });

    readonly cnaProfiles = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: async () => {
            return this.selectedMolecularProfiles.result!.filter(
                profile =>
                    profile.molecularAlterationType ===
                        'COPY_NUMBER_ALTERATION' &&
                    profile.datatype === 'DISCRETE'
            );
        },
        onError: error => {},
        default: [],
    });

    @computed
    get chartMetaSet(): { [id: string]: ChartMeta } {
        let _chartMetaSet: { [id: string]: ChartMeta } = {} as {
            [id: string]: ChartMeta;
        };

        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(
            this.clinicalAttributes.result,
            (acc: { [id: string]: ChartMeta }, attribute) => {
                const uniqueKey = getUniqueKey(attribute);
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    dataType: getChartMetaDataType(uniqueKey),
                    patientAttribute: attribute.patientAttribute,
                    description: attribute.description,
                    priority: getPriorityByClinicalAttribute(attribute),
                    renderWhenDataChange: false,
                    clinicalAttribute: attribute,
                };
                return acc;
            },
            _chartMetaSet
        );

        if (!_.isEmpty(this.mutationProfiles.result!)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.mutationProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'Mutated Genes',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.MUTATED_GENES_TABLE
                ),
                renderWhenDataChange: false,
                description: '',
            };
        }

        if (!_.isEmpty(this.cnaProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.cnaProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'CNA Genes',
                renderWhenDataChange: false,
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.CNA_GENES_TABLE
                ),
                description: '',
            };
        }

        const scatterRequiredParams = _.reduce(
            this.clinicalAttributes.result,
            (acc, next) => {
                if (MUTATION_COUNT === next.clinicalAttributeId) {
                    acc[MUTATION_COUNT] = true;
                }
                if (FRACTION_GENOME_ALTERED === next.clinicalAttributeId) {
                    acc[FRACTION_GENOME_ALTERED] = true;
                }
                return acc;
            },
            { [MUTATION_COUNT]: false, [FRACTION_GENOME_ALTERED]: false }
        );

        if (
            scatterRequiredParams[MUTATION_COUNT] &&
            scatterRequiredParams[FRACTION_GENOME_ALTERED]
        ) {
            _chartMetaSet[UniqueKey.MUTATION_COUNT_CNA_FRACTION] = {
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                uniqueKey: UniqueKey.MUTATION_COUNT_CNA_FRACTION,
                displayName: 'Mutation Count vs Fraction of Genome Altered',
                priority: getDefaultPriorityByUniqueKey(
                    UniqueKey.MUTATION_COUNT_CNA_FRACTION
                ),
                renderWhenDataChange: false,
                description: '',
            };
        }
        return _chartMetaSet;
    }

    readonly virtualStudyParams = remoteData<IVirtualStudyProps>({
        await: () => [
            this.samples,
            this.studyIds,
            this.studyWithSamples,
            this.queriedVirtualStudies,
        ],
        invoke: () =>
            Promise.resolve({
                user: this.appStore.userName,
                name:
                    this.queriedVirtualStudies.result.length === 1
                        ? this.queriedVirtualStudies.result[0].data.name
                        : undefined,
                description:
                    this.queriedVirtualStudies.result.length === 1
                        ? this.queriedVirtualStudies.result[0].data.description
                        : undefined,
                studyWithSamples: this.studyWithSamples.result,
                selectedSamples: this.samples.result,
                filter: { studyIds: this.studyIds.result },
                attributesMetaSet: this.chartMetaSet,
            } as IVirtualStudyProps),
    });

    readonly oqlFilteredAlterationsByGeneAsSampleKeyArrays = remoteData({
        await: () => [this.oqlFilteredAlterationsByGene],
        invoke: async () => {
            return _.mapValues(
                this.oqlFilteredAlterationsByGene.result,
                (mutations: Mutation[]) =>
                    _.map(mutations, mutation => mutation.uniqueSampleKey)
            );
        },
    });

    readonly givenSampleOrder = remoteData<Sample[]>({
        await: () => [this.samples, this.samplesSpecification],
        invoke: async () => {
            // for now, just assume we won't mix sample lists and samples in the specification
            if (this.samplesSpecification.result!.find(x => !x.sampleId)) {
                // for now, if theres any sample list id specification, then there is no given sample order
                return [];
            }
            // at this point, we know samplesSpecification is a list of samples
            const studyToSampleToIndex: {
                [studyId: string]: { [sampleId: string]: number };
            } = _.reduce(
                this.samplesSpecification.result,
                (
                    map: { [studyId: string]: { [sampleId: string]: number } },
                    next: SamplesSpecificationElement,
                    index: number
                ) => {
                    map[next.studyId] = map[next.studyId] || {};
                    map[next.studyId][next.sampleId!] = index; // we know sampleId defined otherwise we would have returned from function already
                    return map;
                },
                {}
            );
            return _.sortBy(
                this.samples.result,
                sample => studyToSampleToIndex[sample.studyId][sample.sampleId]
            );
        },
    });

    readonly studyToSampleIds = remoteData<{
        [studyId: string]: { [sampleId: string]: boolean };
    }>(
        {
            await: () => [this.samplesSpecification],
            invoke: async () => {
                const sampleListsToQuery: {
                    studyId: string;
                    sampleListId: string;
                }[] = [];
                const ret: {
                    [studyId: string]: { [sampleId: string]: boolean };
                } = {};
                for (const sampleSpec of this.samplesSpecification.result!) {
                    if (sampleSpec.sampleId) {
                        // add sample id to study
                        ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
                        ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
                    } else if (sampleSpec.sampleListId) {
                        // mark sample list to query later
                        sampleListsToQuery.push(sampleSpec as {
                            studyId: string;
                            sampleListId: string;
                        });
                    }
                }
                // query for sample lists
                if (sampleListsToQuery.length > 0) {
                    const sampleLists: SampleList[] = await client.fetchSampleListsUsingPOST(
                        {
                            sampleListIds: sampleListsToQuery.map(
                                spec => spec.sampleListId
                            ),
                            projection: 'DETAILED',
                        }
                    );
                    // add samples from those sample lists to corresponding study
                    for (const sampleList of sampleLists) {
                        ret[sampleList.studyId] = stringListToSet(
                            sampleList.sampleIds
                        );
                    }
                }
                return ret;
            },
        },
        {}
    );

    readonly studyToSampleListId = remoteData<{ [studyId: string]: string }>({
        await: () => [this.samplesSpecification],
        invoke: async () => {
            return this.samplesSpecification.result!.reduce(
                (map, next) => {
                    if (next.sampleListId) {
                        map[next.studyId] = next.sampleListId;
                    }
                    return map;
                },
                {} as { [studyId: string]: string }
            );
        },
    });

    @computed get samplesSpecificationParams() {
        return parseSamplesSpecifications(
            this.urlWrapper.query.case_ids,
            this.urlWrapper.query.sample_list_ids,
            this.urlWrapper.query.case_set_id,
            this.cancerStudyIds
        );
    }

    readonly samplesSpecification = remoteData({
        await: () => [this.queriedVirtualStudies],
        invoke: async () => {
            // is this a sample list category query?
            // if YES, we need to derive the sample lists by:
            // 1. looking up all sample lists in selected studies
            // 2. using those with matching category
            if (!this.sampleListCategory) {
                if (this.queriedVirtualStudies.result!.length > 0) {
                    return populateSampleSpecificationsFromVirtualStudies(
                        this.samplesSpecificationParams,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    return this.samplesSpecificationParams;
                }
            } else {
                // would be nice to have an endpoint that would return multiple sample lists
                // but this will only ever happen one for each study selected (and in queries where a sample list is specified)
                let samplesSpecifications = [];
                // get sample specifications from physical studies if we are querying virtual study
                if (this.queriedVirtualStudies.result!.length > 0) {
                    samplesSpecifications = populateSampleSpecificationsFromVirtualStudies(
                        this.samplesSpecificationParams,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    samplesSpecifications = this.samplesSpecificationParams;
                }
                // get unique study ids to reduce the API requests
                const uniqueStudyIds = _.chain(samplesSpecifications)
                    .map(specification => specification.studyId)
                    .uniq()
                    .value();
                const allSampleLists = await Promise.all(
                    uniqueStudyIds.map(studyId => {
                        return client.getAllSampleListsInStudyUsingGET({
                            studyId: studyId,
                            projection: 'SUMMARY',
                        });
                    })
                );

                const category =
                    SampleListCategoryTypeToFullId[this.sampleListCategory!];
                const specs = allSampleLists.reduce(
                    (
                        aggregator: SamplesSpecificationElement[],
                        sampleLists
                    ) => {
                        //find the sample list matching the selected category using the map from shortname to full category name :(
                        const matchingList = _.find(
                            sampleLists,
                            list => list.category === category
                        );
                        if (matchingList) {
                            aggregator.push({
                                studyId: matchingList.studyId,
                                sampleListId: matchingList.sampleListId,
                                sampleId: undefined,
                            } as SamplesSpecificationElement);
                        }
                        return aggregator;
                    },
                    []
                );

                return specs;
            }
        },
    });

    readonly studyToMutationMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const profile of this.molecularProfilesInStudies.result) {
                    const studyId = profile.studyId;
                    if (!ret[studyId] && isMutationProfile(profile)) {
                        ret[studyId] = profile;
                    }
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    readonly allStudies = remoteData(
        {
            invoke: async () =>
                await client.getAllStudiesUsingGET({ projection: 'SUMMARY' }),
        },
        []
    );

    readonly queriedVirtualStudies = remoteData(
        {
            await: () => [this.allStudies],
            invoke: async () => {
                const allCancerStudies = this.allStudies.result;
                const cancerStudyIds = this.cancerStudyIds;

                const missingFromCancerStudies = _.differenceWith(
                    cancerStudyIds,
                    allCancerStudies,
                    (id: string, study: CancerStudy) => id === study.studyId
                );
                let ret: VirtualStudy[] = [];

                for (const missingId of missingFromCancerStudies) {
                    try {
                        const vs = await sessionServiceClient.getVirtualStudy(
                            missingId
                        );
                        ret = ret.concat(vs);
                    } catch (error) {
                        // ignore missing studies
                        continue;
                    }
                }
                return Promise.resolve(ret);
            },
            onError: () => {
                // fail silently when an error occurs with the virtual studies
            },
            // just return empty array if session service is disabled
        },
        []
    );

    readonly studyIds = remoteData(
        {
            await: () => [this.queriedVirtualStudies],
            invoke: () => {
                let physicalStudies: string[];
                if (this.queriedVirtualStudies.result!.length > 0) {
                    // we want to replace virtual studies with their underlying physical studies
                    physicalStudies = substitutePhysicalStudiesForVirtualStudies(
                        this.cancerStudyIds,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    physicalStudies = this.cancerStudyIds.slice();
                }
                return Promise.resolve(physicalStudies);
            },
        },
        []
    );

    // this is less than desirable way of validating studyIds
    // if studyId does not appear in list of all physical studies
    // we assume it's a virtual study and try to retrieve it as such
    // if there's no corresponding virtual study
    // we assume it's an invalid studyId
    readonly invalidStudyIds = remoteData(
        {
            await: () => [this.allStudies, this.queriedVirtualStudies],
            invoke: () => {
                const allCancerStudies = this.allStudies.result;
                const cancerStudyIds = this.cancerStudyIds;

                const missingFromCancerStudies = _.differenceWith(
                    cancerStudyIds,
                    allCancerStudies,
                    (id: string, study: CancerStudy) => id === study.studyId
                );

                if (
                    missingFromCancerStudies.length &&
                    this.queriedVirtualStudies.result.length === 0
                ) {
                    return Promise.resolve(missingFromCancerStudies);
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    @computed get downloadFilenamePrefix() {
        return generateDownloadFilenamePrefixByStudies(this.studies.result);
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    // TODO: refactor b/c we already have sample lists summary so
    readonly sampleLists = remoteData<SampleList[]>({
        await: () => [this.studyToSampleListId],
        invoke: () => {
            const sampleListIds = _.values(this.studyToSampleListId.result!);
            if (sampleListIds.length > 0) {
                return client.fetchSampleListsUsingPOST({ sampleListIds });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly mutations = remoteData<Mutation[]>({
        await: () => [
            this.genes,
            this.selectedMolecularProfiles,
            this.samples,
            this.studyIdToStudy,
        ],
        invoke: async () => {
            const mutationProfiles = _.filter(
                this.selectedMolecularProfiles.result,
                (profile: MolecularProfile) =>
                    profile.molecularAlterationType === 'MUTATION_EXTENDED'
            );

            if (mutationProfiles.length === 0) {
                return [];
            }

            const studyIdToProfileMap: {
                [studyId: string]: MolecularProfile;
            } = _.keyBy(
                mutationProfiles,
                (profile: MolecularProfile) => profile.studyId
            );

            const filters = this.samples.result.reduce(
                (memo, sample: Sample) => {
                    if (sample.studyId in studyIdToProfileMap) {
                        memo.push({
                            molecularProfileId:
                                studyIdToProfileMap[sample.studyId]
                                    .molecularProfileId,
                            sampleId: sample.sampleId,
                        });
                    }
                    return memo;
                },
                [] as any[]
            );

            const data = {
                entrezGeneIds: _.map(
                    this.genes.result,
                    (gene: Gene) => gene.entrezGeneId
                ),
                sampleMolecularIdentifiers: filters,
            } as MutationMultipleStudyFilter;

            return await client.fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: 'DETAILED',
                    mutationMultipleStudyFilter: data,
                }
            );
        },
    });

    public mutationsTabFilteringSettings = this.makeMutationsTabFilteringSettings();

    readonly mutationsReportByGene = remoteData<{
        [hugeGeneSymbol: string]: FilteredAndAnnotatedMutationsReport;
    }>({
        await: () => [this._filteredAndAnnotatedMutationsReport, this.genes],
        invoke: () => {
            let mutationGroups: FilteredAndAnnotatedMutationsReport = this
                ._filteredAndAnnotatedMutationsReport.result!;
            const ret: {
                [hugoGeneSymbol: string]: FilteredAndAnnotatedMutationsReport;
            } = {};
            for (const gene of this.genes.result!) {
                ret[gene.hugoGeneSymbol] = {
                    data: [],
                    vus: [],
                    germline: [],
                    vusAndGermline: [],
                };
            }
            for (const mutation of mutationGroups.data) {
                ret[mutation.gene.hugoGeneSymbol].data.push(mutation);
            }
            for (const mutation of mutationGroups.vus) {
                ret[mutation.gene.hugoGeneSymbol].vus.push(mutation);
            }
            for (const mutation of mutationGroups.germline) {
                ret[mutation.gene.hugoGeneSymbol].germline.push(mutation);
            }
            for (const mutation of mutationGroups.vusAndGermline) {
                ret[mutation.gene.hugoGeneSymbol].vusAndGermline.push(mutation);
            }
            return Promise.resolve(ret);
        },
    });

    readonly mutationsByGene = remoteData<{
        [hugoGeneSymbol: string]: Mutation[];
    }>({
        await: () => [
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.mutationsReportByGene,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.mutationsReportByGene.result!,
                    (mutationGroups: FilteredAndAnnotatedMutationsReport) => {
                        if (
                            this.mutationsTabFilteringSettings.useOql &&
                            this.queryContainsMutationOql
                        ) {
                            // use oql filtering in mutations tab only if query contains mutation oql
                            mutationGroups = _.mapValues(
                                mutationGroups,
                                mutations =>
                                    filterCBioPortalWebServiceData(
                                        this.oqlText,
                                        mutations,
                                        new AccessorsForOqlFilter(
                                            this.selectedMolecularProfiles.result!
                                        ),
                                        this.defaultOQLQuery.result!
                                    )
                            );
                        }
                        return compileMutations(
                            mutationGroups,
                            this.mutationsTabFilteringSettings.excludeVus,
                            this.mutationsTabFilteringSettings.excludeGermline
                        );
                    }
                )
            );
        },
    });

    readonly mutationMapperStores = remoteData<{
        [hugoGeneSymbol: string]: ResultsViewMutationMapperStore;
    }>(
        {
            await: () => [
                this.genes,
                this.oncoKbCancerGenes,
                this.uniqueSampleKeyToTumorType,
                this.mutations,
                this.mutationsByGene,
            ],
            invoke: () => {
                if (this.genes.result) {
                    // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                    //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                    //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                    return Promise.resolve(
                        _.reduce(
                            this.genes.result,
                            (
                                map: {
                                    [hugoGeneSymbol: string]: ResultsViewMutationMapperStore;
                                },
                                gene: Gene
                            ) => {
                                map[
                                    gene.hugoGeneSymbol
                                ] = new ResultsViewMutationMapperStore(
                                    AppConfig.serverConfig,
                                    {},
                                    gene,
                                    this.samples,
                                    this.oncoKbCancerGenes,
                                    () =>
                                        this.mutationsByGene.result![
                                            gene.hugoGeneSymbol
                                        ] || [],
                                    () => this.mutationCountCache,
                                    () => this.genomeNexusCache,
                                    () => this.genomeNexusMutationAssessorCache,
                                    () => this.genomeNexusMyVariantInfoCache,
                                    () => this.discreteCNACache,
                                    this.studyToMolecularProfileDiscrete.result!,
                                    this.studyIdToStudy,
                                    this.molecularProfileIdToMolecularProfile,
                                    this.clinicalDataForSamples,
                                    this.studiesForSamplesWithoutCancerTypeClinicalData,
                                    this.germlineConsentedSamples,
                                    this.indexedHotspotData,
                                    this.indexedVariantAnnotations,
                                    this.uniqueSampleKeyToTumorType.result!,
                                    this.oncoKbData
                                );
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    public getMutationMapperStore(
        hugoGeneSymbol: string
    ): ResultsViewMutationMapperStore | undefined {
        return this.mutationMapperStores.result[hugoGeneSymbol];
    }

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>(
        {
            await: () => [this.studies, this.samples],
            invoke: () =>
                this.getClinicalData(
                    'SAMPLE',
                    this.studies.result!,
                    this.samples.result,
                    ['CANCER_TYPE', 'CANCER_TYPE_DETAILED']
                ),
        },
        []
    );

    private getClinicalData(
        clinicalDataType: 'SAMPLE' | 'PATIENT',
        studies: any[],
        entities: any[],
        attributeIds: string[]
    ): Promise<Array<ClinicalData>> {
        // single study query endpoint is optimal so we should use it
        // when there's only one study
        if (studies.length === 1) {
            const study = this.studies.result[0];
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: attributeIds,
                ids: _.map(
                    entities,
                    clinicalDataType === 'SAMPLE' ? 'sampleId' : 'patientId'
                ),
            };
            return client.fetchAllClinicalDataInStudyUsingPOST({
                studyId: study.studyId,
                clinicalDataSingleStudyFilter: filter,
                clinicalDataType: clinicalDataType,
            });
        } else {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: attributeIds,
                identifiers: entities.map((s: any) =>
                    clinicalDataType === 'SAMPLE'
                        ? { entityId: s.sampleId, studyId: s.studyId }
                        : { entityId: s.patientId, studyId: s.studyId }
                ),
            };
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: clinicalDataType,
                clinicalDataMultiStudyFilter: filter,
            });
        }
    }

    private getClinicalDataCount(
        clinicalDataType: 'SAMPLE' | 'PATIENT',
        studies: any[],
        entities: any[],
        attributeIds: string[]
    ): Promise<number> {
        const projection = 'META';
        // single study query endpoint is optimal so we should use it
        // when there's only one study
        if (studies.length === 1) {
            const study = this.studies.result[0];
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: attributeIds,
                ids: _.map(
                    entities,
                    clinicalDataType === 'SAMPLE' ? 'sampleId' : 'patientId'
                ),
            };
            return client
                .fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo({
                    studyId: study.studyId,
                    clinicalDataSingleStudyFilter: filter,
                    clinicalDataType: clinicalDataType,
                    projection,
                })
                .then(function(response: request.Response) {
                    return parseInt(response.header['total-count'], 10);
                });
        } else {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: attributeIds,
                identifiers: entities.map((s: any) =>
                    clinicalDataType === 'SAMPLE'
                        ? { entityId: s.sampleId, studyId: s.studyId }
                        : { entityId: s.patientId, studyId: s.studyId }
                ),
            };
            return client
                .fetchClinicalDataUsingPOSTWithHttpInfo({
                    clinicalDataType: clinicalDataType,
                    clinicalDataMultiStudyFilter: filter,
                    projection,
                })
                .then(function(response: request.Response) {
                    return parseInt(response.header['total-count'], 10);
                });
        }
    }

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [this.studies, this.patients],
        invoke: async () => {
            const count = await this.getClinicalDataCount(
                'PATIENT',
                this.studies.result!,
                this.patients.result,
                SURVIVAL_CHART_ATTRIBUTES
            );
            return count > 0;
        },
    });

    readonly survivalClinicalData = remoteData<ClinicalData[]>(
        {
            await: () => [this.studies, this.patients],
            invoke: () =>
                this.getClinicalData(
                    'PATIENT',
                    this.studies.result!,
                    this.patients.result,
                    SURVIVAL_CHART_ATTRIBUTES
                ),
        },
        []
    );

    readonly survivalClinicalDataGroupByUniquePatientKey = remoteData<{
        [key: string]: ClinicalData[];
    }>({
        await: () => [this.survivalClinicalData],
        invoke: async () => {
            return _.groupBy(
                this.survivalClinicalData.result,
                'uniquePatientKey'
            );
        },
    });

    readonly overallAlteredPatientSurvivals = remoteData<PatientSurvival[]>(
        {
            await: () => [
                this.survivalClinicalDataGroupByUniquePatientKey,
                this.alteredPatientKeys,
                this.patients,
            ],
            invoke: async () => {
                return getPatientSurvivals(
                    this.survivalClinicalDataGroupByUniquePatientKey.result,
                    this.alteredPatientKeys.result!,
                    'OS_STATUS',
                    'OS_MONTHS',
                    s => s === 'DECEASED'
                );
            },
        },
        []
    );

    readonly overallUnalteredPatientSurvivals = remoteData<PatientSurvival[]>(
        {
            await: () => [
                this.survivalClinicalDataGroupByUniquePatientKey,
                this.unalteredPatientKeys,
                this.patients,
            ],
            invoke: async () => {
                return getPatientSurvivals(
                    this.survivalClinicalDataGroupByUniquePatientKey.result,
                    this.unalteredPatientKeys.result!,
                    'OS_STATUS',
                    'OS_MONTHS',
                    s => s === 'DECEASED'
                );
            },
        },
        []
    );

    readonly diseaseFreeAlteredPatientSurvivals = remoteData<PatientSurvival[]>(
        {
            await: () => [
                this.survivalClinicalDataGroupByUniquePatientKey,
                this.alteredPatientKeys,
                this.patients,
            ],
            invoke: async () => {
                return getPatientSurvivals(
                    this.survivalClinicalDataGroupByUniquePatientKey.result,
                    this.alteredPatientKeys.result!,
                    'DFS_STATUS',
                    'DFS_MONTHS',
                    s => s === 'Recurred/Progressed' || s === 'Recurred'
                );
            },
        },
        []
    );

    readonly diseaseFreeUnalteredPatientSurvivals = remoteData<
        PatientSurvival[]
    >(
        {
            await: () => [
                this.survivalClinicalDataGroupByUniquePatientKey,
                this.unalteredPatientKeys,
                this.patients,
            ],
            invoke: async () => {
                return getPatientSurvivals(
                    this.survivalClinicalDataGroupByUniquePatientKey.result,
                    this.unalteredPatientKeys.result!,
                    'DFS_STATUS',
                    'DFS_MONTHS',
                    s => s === 'Recurred/Progressed' || s === 'Recurred'
                );
            },
        },
        []
    );

    readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>(
        {
            await: () => [this.studyIds, this.samples],
            invoke: async () => {
                const germlineConsentedSamples = await fetchGermlineConsentedSamples(
                    this.studyIds,
                    AppConfig.serverConfig.studiesWithGermlineConsentedSamples
                );
                const sampleIds = this.samples.result
                    ? this.samples.result.map(s => s.sampleId)
                    : [];

                // do not simply return all germline consented samples,
                // only include the ones matching current sample selection
                return germlineConsentedSamples.filter(s =>
                    sampleIds.includes(s.sampleId)
                );
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly samples = remoteData(
        {
            await: () => [this.studyToDataQueryFilter],
            invoke: async () => {
                let sampleIdentifiers: SampleIdentifier[] = [];
                let sampleListIds: string[] = [];
                _.each(
                    this.studyToDataQueryFilter.result,
                    (dataQueryFilter: IDataQueryFilter, studyId: string) => {
                        if (dataQueryFilter.sampleIds) {
                            sampleIdentifiers = sampleIdentifiers.concat(
                                dataQueryFilter.sampleIds.map(sampleId => ({
                                    sampleId,
                                    studyId,
                                }))
                            );
                        } else if (dataQueryFilter.sampleListId) {
                            sampleListIds.push(dataQueryFilter.sampleListId);
                        }
                    }
                );
                let promises: Promise<Sample[]>[] = [];
                if (sampleIdentifiers.length) {
                    promises.push(
                        client.fetchSamplesUsingPOST({
                            sampleFilter: {
                                sampleIdentifiers,
                            } as SampleFilter,
                            projection: 'DETAILED',
                        })
                    );
                }
                if (sampleListIds.length) {
                    promises.push(
                        client.fetchSamplesUsingPOST({
                            sampleFilter: {
                                sampleListIds,
                            } as SampleFilter,
                            projection: 'DETAILED',
                        })
                    );
                }
                return _.flatten(await Promise.all(promises));
            },
        },
        []
    );

    readonly sampleKeyToSample = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(this.samples.result!, sample => sample.uniqueSampleKey)
            );
        },
    });

    readonly patientKeyToPatient = remoteData({
        await: () => [this.patients],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(
                    this.patients.result!,
                    patient => patient.uniquePatientKey
                )
            );
        },
    });

    readonly patientKeyToSamples = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.samples.result!,
                    sample => sample.uniquePatientKey
                )
            );
        },
    });

    readonly patients = remoteData({
        await: () => [this.samples],
        invoke: () => fetchPatients(this.samples.result!),
        default: [],
    });

    readonly samplesWithoutCancerTypeClinicalData = remoteData<Sample[]>(
        {
            await: () => [this.samples, this.clinicalDataForSamples],
            invoke: () => {
                const sampleHasData: { [sampleUid: string]: boolean } = {};
                for (const data of this.clinicalDataForSamples.result) {
                    sampleHasData[
                        toSampleUuid(data.studyId, data.sampleId)
                    ] = true;
                }
                return Promise.resolve(
                    this.samples.result.filter(sample => {
                        return !sampleHasData[
                            toSampleUuid(sample.studyId, sample.sampleId)
                        ];
                    })
                );
            },
        },
        []
    );

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData(
        {
            await: () => [this.samplesWithoutCancerTypeClinicalData],
            invoke: async () =>
                fetchStudiesForSamplesWithoutCancerTypeClinicalData(
                    this.samplesWithoutCancerTypeClinicalData
                ),
        },
        []
    );

    readonly studies = remoteData(
        {
            await: () => [this.studyIds],
            invoke: async () => {
                return client.fetchStudiesUsingPOST({
                    studyIds: this.studyIds.result!,
                    projection: 'DETAILED',
                });
            },
        },
        []
    );

    //this is only required to show study name and description on the results page
    //CancerStudy objects for all the cohortIds
    readonly queriedStudies = remoteData({
        await: () => [this.studyIdToStudy, this.queriedVirtualStudies],
        invoke: async () => {
            if (!_.isEmpty(this.cancerStudyIds)) {
                return fetchQueriedStudies(
                    this.studyIdToStudy.result,
                    this.cancerStudyIds,
                    this.queriedVirtualStudies.result
                        ? this.queriedVirtualStudies.result
                        : []
                );
            } else {
                return [];
            }
        },
        default: [],
    });

    readonly studyIdToStudy = remoteData(
        {
            await: () => [this.studies],
            invoke: () =>
                Promise.resolve(_.keyBy(this.studies.result, x => x.studyId)),
        },
        {}
    );

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>(
        {
            await: () => [this.studyIds],
            invoke: async () => {
                return client.fetchMolecularProfilesUsingPOST({
                    molecularProfileFilter: {
                        studyIds: this.studyIds.result!,
                    } as MolecularProfileFilter,
                });
            },
        },
        []
    );

    // need to support fusion data later
    readonly nonSelectedDownloadableMolecularProfiles = remoteData<
        MolecularProfile[]
    >(
        {
            await: () => [
                this.molecularProfilesInStudies,
                this.selectedMolecularProfiles,
            ],
            invoke: () => {
                return Promise.resolve(
                    excludeMutationAndSVProfiles(
                        _.difference(
                            this.molecularProfilesInStudies.result!,
                            this.selectedMolecularProfiles.result!
                        )
                    )
                );
            },
        },
        []
    );

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudies.result.reduce(
                        (
                            map: {
                                [molecularProfileId: string]: MolecularProfile;
                            },
                            next: MolecularProfile
                        ) => {
                            map[next.molecularProfileId] = next;
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    // If we have same profile accros multiple studies, they should have the same name, so we can group them by name to get all related molecular profiles in multiple studies.
    readonly nonSelectedDownloadableMolecularProfilesGroupByName = remoteData<{
        [profileName: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.nonSelectedDownloadableMolecularProfiles],
            invoke: () => {
                const sortedProfiles = _.sortBy(
                    this.nonSelectedDownloadableMolecularProfiles.result,
                    profile =>
                        decideMolecularProfileSortingOrder(
                            profile.molecularAlterationType
                        )
                );
                return Promise.resolve(
                    _.groupBy(sortedProfiles, profile => profile.name)
                );
            },
        },
        {}
    );

    readonly studyToMolecularProfileDiscrete = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: async () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const molecularProfile of this.molecularProfilesInStudies
                    .result) {
                    if (molecularProfile.datatype === 'DISCRETE') {
                        ret[molecularProfile.studyId] = molecularProfile;
                    }
                }
                return ret;
            },
        },
        {}
    );

    readonly heatmapMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesInStudies,
            this.selectedMolecularProfiles,
            this.genesetMolecularProfile,
        ],
        invoke: () => {
            const MRNA_EXPRESSION = AlterationTypeConstants.MRNA_EXPRESSION;
            const PROTEIN_LEVEL = AlterationTypeConstants.PROTEIN_LEVEL;
            const METHYLATION = AlterationTypeConstants.METHYLATION;
            const GENERIC_ASSAY = AlterationTypeConstants.GENERIC_ASSAY;
            const selectedMolecularProfileIds = stringListToSet(
                this.selectedMolecularProfiles.result!.map(
                    profile => profile.molecularProfileId
                )
            );

            const expressionHeatmaps = _.sortBy(
                _.filter(this.molecularProfilesInStudies.result!, profile => {
                    return (
                        ((profile.molecularAlterationType === MRNA_EXPRESSION ||
                            profile.molecularAlterationType === PROTEIN_LEVEL ||
                            profile.molecularAlterationType ===
                                GENERIC_ASSAY) &&
                            profile.showProfileInAnalysisTab) ||
                        profile.molecularAlterationType === METHYLATION
                    );
                }),
                profile => {
                    // Sort order: selected and [mrna, protein, methylation, treatment], unselected and [mrna, protein, meth, treatment]
                    if (
                        profile.molecularProfileId in
                        selectedMolecularProfileIds
                    ) {
                        switch (profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 0;
                            case PROTEIN_LEVEL:
                                return 1;
                            case METHYLATION:
                                return 2;
                            case GENERIC_ASSAY:
                                return 3;
                        }
                    } else {
                        switch (profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 4;
                            case PROTEIN_LEVEL:
                                return 5;
                            case METHYLATION:
                                return 6;
                            case GENERIC_ASSAY:
                                return 7;
                        }
                    }
                }
            );
            const genesetMolecularProfile = this.genesetMolecularProfile
                .result!;
            const genesetHeatmaps = genesetMolecularProfile.isApplicable
                ? [genesetMolecularProfile.value]
                : [];
            return Promise.resolve(expressionHeatmaps.concat(genesetHeatmaps));
        },
    });

    readonly genesetMolecularProfile = remoteData<Optional<MolecularProfile>>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const applicableProfiles = _.filter(
                this.selectedMolecularProfiles.result!,
                profile =>
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENESET_SCORE &&
                    profile.showProfileInAnalysisTab
            );
            if (applicableProfiles.length > 1) {
                return Promise.reject(
                    new Error('Queried more than one gene set score profile')
                );
            }
            const genesetProfile = applicableProfiles.pop();
            const value: Optional<MolecularProfile> = genesetProfile
                ? { isApplicable: true, value: genesetProfile }
                : { isApplicable: false };
            return Promise.resolve(value);
        },
    });

    readonly studyToDataQueryFilter = remoteData<{
        [studyId: string]: IDataQueryFilter;
    }>(
        {
            await: () => [
                this.studyToSampleIds,
                this.studyIds,
                this.studyToSampleListId,
            ],
            invoke: () => {
                const studies = this.studyIds.result!;
                const ret: { [studyId: string]: IDataQueryFilter } = {};
                for (const studyId of studies) {
                    ret[studyId] = generateDataQueryFilter(
                        this.studyToSampleListId.result![studyId] || null,
                        Object.keys(this.studyToSampleIds.result[studyId] || {})
                    );
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    public getSessionIdInUrl() {
        const parsedQString = url.parse((window as any).location.href, true);
        return parsedQString.query.session_id;
    }

    readonly bookmarkLinks = remoteData<BookmarkLinks>({
        await: () => [this.studies],

        invoke: async () => {
            const win = window as any;

            let longUrl = win.location.href;

            let sessionResp;

            // if we have a session service, lets get the url for the session
            if (ServerConfigHelpers.sessionServiceIsEnabled()) {
                longUrl = await new Promise((resolve, reject) => {
                    win.getSessionServiceBookmark(
                        window.location.href,
                        $('#bookmark-result-tab').data('session'),
                        function(url: string) {
                            resolve(url);
                        }
                    );
                });
            }

            const queryData = {
                version: 3.0,
                longUrl: longUrl,
                session_id: longUrl.match(/session_id=(.*)$/)[1],
                history: 0,
                format: 'json',
            };

            const bitlyResponse = (await request
                .get(getBitlyServiceUrl())
                .query(queryData)) as any;

            const parsedBitlyResponse = JSON.parse(bitlyResponse.body) as any;
            return {
                longUrl,
                shortenedUrl: (_.values(parsedBitlyResponse.results)[0] as any)
                    .shortUrl,
            };
        },
    });

    readonly molecularProfileIdToDataQueryFilter = remoteData<{
        [molecularProfileId: string]: IDataQueryFilter;
    }>({
        await: () => [
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: IDataQueryFilter } = {};
            for (const molecularProfile of this.molecularProfilesInStudies
                .result!) {
                ret[
                    molecularProfile.molecularProfileId
                ] = this.studyToDataQueryFilter.result![
                    molecularProfile.studyId
                ];
            }
            return Promise.resolve(ret);
        },
        default: {},
    });

    readonly genes = remoteData<Gene[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.hugoGeneSymbols);

            // Check that the same genes are in the OQL query as in the API response (order doesnt matter).
            // This ensures that all the genes in OQL are valid. If not, we throw an error.
            if (
                _.isEqual(
                    _.sortBy(this.hugoGeneSymbols),
                    _.sortBy(genes.map(gene => gene.hugoGeneSymbol))
                )
            ) {
                return genes;
            } else {
                throw new Error(ErrorMessages.InvalidGenes);
            }
        },
        onResult: (genes: Gene[]) => {
            this.geneCache.addData(genes);
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: () => [this.studies],
        invoke: () => {
            if (this.studies.result!.length > 0) {
                return fetchAllReferenceGenomeGenes(
                    this.studies.result[0].referenceGenome
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly hugoGeneSymbolToReferenceGene = remoteData<{
        [hugoSymbol: string]: ReferenceGenomeGene;
    }>({
        await: () => [this.referenceGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.referenceGenes.result!, g => g.hugoGeneSymbol)
            );
        },
    });

    readonly entrezGeneIdToReferenceGene = remoteData<{
        [hugoSymbol: string]: ReferenceGenomeGene;
    }>({
        await: () => [this.referenceGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.referenceGenes.result!, g => g.entrezGeneId)
            );
        },
    });

    @computed get referenceGenome() {
        const study = this.studies.result ? this.studies.result[0] : undefined;
        return study ? study.referenceGenome : DEFAULT_GENOME;
    }

    @computed get genesInvalid() {
        return this.genes.isError;
    }

    @computed get isQueryInvalid() {
        return (
            this.hugoGeneSymbols.length * this.samples.result.length >
            AppConfig.serverConfig.query_product_limit
        );
    }

    @computed get geneLimit(): number {
        return Math.floor(
            AppConfig.serverConfig.query_product_limit /
                this.samples.result.length
        );
    }

    readonly genesets = remoteData<Geneset[]>({
        invoke: () => {
            if (this.genesetIds && this.genesetIds.length > 0) {
                return internalClient.fetchGenesetsUsingPOST({
                    genesetIds: this.genesetIds.slice(),
                });
            } else {
                return Promise.resolve([]);
            }
        },
        onResult: (genesets: Geneset[]) => {
            this.genesetCache.addData(genesets);
        },
    });

    readonly geneticEntities = remoteData<GeneticEntity[]>({
        await: () => [
            this.genes,
            this.genesets,
            this.hugoGeneSymbolToReferenceGene,
        ],
        invoke: () => {
            const res: GeneticEntity[] = [];
            for (const gene of this.genes.result!) {
                res.push({
                    geneticEntityName: gene.hugoGeneSymbol,
                    geneticEntityType: GeneticEntityType.GENE,
                    geneticEntityId: gene.entrezGeneId,
                    cytoband: this.hugoGeneSymbolToReferenceGene.result![
                        gene.hugoGeneSymbol
                    ].cytoband,
                    geneticEntityData: gene,
                });
            }
            for (const geneset of this.genesets.result!) {
                res.push({
                    geneticEntityName: geneset.name,
                    geneticEntityType: GeneticEntityType.GENESET,
                    geneticEntityId: geneset.genesetId,
                    cytoband: '-',
                    geneticEntityData: geneset,
                });
            }
            return Promise.resolve(res);
        },
    });

    readonly treatmentsInStudies = remoteData<Treatment[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: async () => {
            return await fetchTreatmentByMolecularProfileIds(
                this.molecularProfilesInStudies.result
            );
        },
    });

    readonly selectedTreatments = remoteData<Treatment[]>({
        await: () => [this.treatmentsInStudies],
        invoke: () => {
            const treatmentIdFromUrl = this.treatmentList;
            return Promise.resolve(
                _.filter(this.treatmentsInStudies.result!, (d: Treatment) =>
                    treatmentIdFromUrl.includes(d.treatmentId)
                )
            );
        },
    });

    readonly entrezGeneIdToGene = remoteData<{ [entrezGeneId: number]: Gene }>({
        await: () => [this.genes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.genes.result!, gene => gene.entrezGeneId)
            ),
    });

    readonly genesetLinkMap = remoteData<{ [genesetId: string]: string }>({
        invoke: async () => {
            if (this.genesetIds && this.genesetIds.length) {
                const genesets = await internalClient.fetchGenesetsUsingPOST({
                    genesetIds: this.genesetIds.slice(),
                });
                const linkMap: { [genesetId: string]: string } = {};
                genesets.forEach(({ genesetId, refLink }) => {
                    linkMap[genesetId] = refLink;
                });
                return linkMap;
            } else {
                return {};
            }
        },
    });

    readonly treatmentLinkMap = remoteData<{ [treatmentId: string]: string }>({
        await: () => [this.molecularProfilesInStudies],
        invoke: async () => {
            if (
                this.molecularProfilesInStudies.result &&
                this.molecularProfilesInStudies.result.length > 0
            ) {
                const treatments = await fetchTreatmentByMolecularProfileIds(
                    this.molecularProfilesInStudies.result
                );
                const linkMap: { [treatmentId: string]: string } = {};
                treatments.forEach(({ treatmentId, refLink }) => {
                    linkMap[treatmentId] = refLink;
                });
                return linkMap;
            } else {
                return {};
            }
        },
    });

    readonly customDriverAnnotationReport = remoteData<{
        hasBinary: boolean;
        tiers: string[];
    }>({
        await: () => [this.mutations],
        invoke: () => {
            return Promise.resolve(
                computeCustomDriverAnnotationReport(this.mutations.result!)
            );
        },
        onResult: result => {
            initializeCustomDriverAnnotationSettings(
                result!,
                this.driverAnnotationSettings,
                this.driverAnnotationSettings.customTiersDefault,
                this.driverAnnotationSettings.oncoKb,
                this.driverAnnotationSettings.hotspots
            );
        },
    });

    readonly _filteredAndAnnotatedMutationsReport = remoteData({
        await: () => [
            this.mutations,
            this.getPutativeDriverInfo,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            return Promise.resolve(
                filterAndAnnotateMutations(
                    this.mutations.result!,
                    this.getPutativeDriverInfo.result!,
                    this.entrezGeneIdToGene.result!
                )
            );
        },
    });

    readonly filteredAndAnnotatedMutations = remoteData<AnnotatedMutation[]>({
        await: () => [this._filteredAndAnnotatedMutationsReport],
        invoke: () =>
            Promise.resolve(
                compileMutations(
                    this._filteredAndAnnotatedMutationsReport.result!,
                    this.driverAnnotationSettings.excludeVUS,
                    this.excludeGermlineMutations
                )
            ),
    });

    public annotatedMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >(q => ({
        await: () => [
            this.mutationCache.get(q),
            this.getPutativeDriverInfo,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            const filteredAndAnnotatedReport = filterAndAnnotateMutations(
                this.mutationCache.get(q).result!,
                this.getPutativeDriverInfo.result!,
                this.entrezGeneIdToGene.result!
            );
            const data = filteredAndAnnotatedReport.data
                .concat(filteredAndAnnotatedReport.vus)
                .concat(filteredAndAnnotatedReport.germline);

            return Promise.resolve(data);
        },
    }));

    readonly _filteredAndAnnotatedMolecularDataReport = remoteData({
        await: () => [
            this.molecularData,
            this.entrezGeneIdToGene,
            this.getOncoKbCnaAnnotationForOncoprint,
            this.molecularProfileIdToMolecularProfile,
        ],
        invoke: () => {
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
            let getOncoKbAnnotation: (
                datum: NumericGeneMolecularData
            ) => IndicatorQueryResp | undefined;
            if (
                this.getOncoKbCnaAnnotationForOncoprint.result! instanceof Error
            ) {
                getOncoKbAnnotation = () => undefined;
            } else {
                getOncoKbAnnotation = this.getOncoKbCnaAnnotationForOncoprint
                    .result! as typeof getOncoKbAnnotation;
            }
            const profileIdToProfile = this.molecularProfileIdToMolecularProfile
                .result!;
            const vus: AnnotatedNumericGeneMolecularData[] = [];
            const data = this.molecularData.result!.reduce(
                (acc: AnnotatedNumericGeneMolecularData[], next) => {
                    const d = annotateMolecularDatum(
                        next,
                        getOncoKbAnnotation,
                        profileIdToProfile,
                        entrezGeneIdToGene
                    );
                    if (d.oncoKbOncogenic) {
                        // truthy check - empty string means not driver
                        acc.push(d);
                    } else {
                        vus.push(d);
                    }
                    return acc;
                },
                [] as AnnotatedNumericGeneMolecularData[]
            );
            return Promise.resolve({
                data,
                vus,
            });
        },
    });

    readonly filteredAndAnnotatedMolecularData = remoteData<
        AnnotatedNumericGeneMolecularData[]
    >({
        await: () => [this._filteredAndAnnotatedMolecularDataReport],
        invoke: () => {
            let data = this._filteredAndAnnotatedMolecularDataReport.result!
                .data;
            if (!this.driverAnnotationSettings.excludeVUS) {
                data = data.concat(
                    this._filteredAndAnnotatedMolecularDataReport.result!.vus
                );
            }
            return Promise.resolve(data);
        },
    });

    public annotatedCnaCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedNumericGeneMolecularData[]
    >(q => ({
        await: () =>
            this.numericGeneMolecularDataCache.await(
                [
                    this.studyToMolecularProfileDiscrete,
                    this.entrezGeneIdToGene,
                    this.getOncoKbCnaAnnotationForOncoprint,
                    this.molecularProfileIdToMolecularProfile,
                ],
                studyToMolecularProfileDiscrete => {
                    return _.values(studyToMolecularProfileDiscrete).map(p => ({
                        entrezGeneId: q.entrezGeneId,
                        molecularProfileId: p.molecularProfileId,
                    }));
                }
            ),
        invoke: () => {
            const results = _.flatten(
                this.numericGeneMolecularDataCache
                    .getAll(
                        _.values(
                            this.studyToMolecularProfileDiscrete.result!
                        ).map(p => ({
                            entrezGeneId: q.entrezGeneId,
                            molecularProfileId: p.molecularProfileId,
                        }))
                    )
                    .map(p => p.result!)
            );
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
            let getOncoKbAnnotation: (
                datum: NumericGeneMolecularData
            ) => IndicatorQueryResp | undefined;
            if (
                this.getOncoKbCnaAnnotationForOncoprint.result! instanceof Error
            ) {
                getOncoKbAnnotation = () => undefined;
            } else {
                getOncoKbAnnotation = this.getOncoKbCnaAnnotationForOncoprint
                    .result! as typeof getOncoKbAnnotation;
            }
            const profileIdToProfile = this.molecularProfileIdToMolecularProfile
                .result!;
            return Promise.resolve(
                results.map(d => {
                    return annotateMolecularDatum(
                        d,
                        getOncoKbAnnotation,
                        profileIdToProfile,
                        entrezGeneIdToGene
                    );
                })
            );
        },
    }));

    readonly getPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.driverAnnotationSettings.oncoKb) {
                toAwait.push(this.getOncoKbMutationAnnotationForOncoprint);
            }
            if (this.driverAnnotationSettings.hotspots) {
                toAwait.push(this.isHotspotForOncoprint);
            }
            if (this.driverAnnotationSettings.cbioportalCount) {
                toAwait.push(this.getCBioportalCount);
            }
            if (this.driverAnnotationSettings.cosmicCount) {
                toAwait.push(this.getCosmicCount);
            }
            return toAwait;
        },
        invoke: () => {
            return Promise.resolve((mutation: Mutation): {
                oncoKb: string;
                hotspots: boolean;
                cbioportalCount: boolean;
                cosmicCount: boolean;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const getOncoKbMutationAnnotationForOncoprint = this
                    .getOncoKbMutationAnnotationForOncoprint.result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    this.driverAnnotationSettings.oncoKb &&
                    getOncoKbMutationAnnotationForOncoprint &&
                    !(
                        getOncoKbMutationAnnotationForOncoprint instanceof Error
                    ) &&
                    getOncoKbMutationAnnotationForOncoprint(mutation);

                let oncoKb: string = '';
                if (oncoKbDatum) {
                    oncoKb = getOncoKbOncogenic(oncoKbDatum);
                }

                const hotspots: boolean =
                    this.driverAnnotationSettings.hotspots &&
                    !(this.isHotspotForOncoprint.result instanceof Error) &&
                    this.isHotspotForOncoprint.result!(mutation);

                const cbioportalCount: boolean =
                    this.driverAnnotationSettings.cbioportalCount &&
                    this.getCBioportalCount.isComplete &&
                    this.getCBioportalCount.result!(mutation) >=
                        this.driverAnnotationSettings.cbioportalCountThreshold;

                const cosmicCount: boolean =
                    this.driverAnnotationSettings.cosmicCount &&
                    this.getCosmicCount.isComplete &&
                    this.getCosmicCount.result!(mutation) >=
                        this.driverAnnotationSettings.cosmicCountThreshold;

                const customDriverBinary: boolean =
                    (this.driverAnnotationSettings.customBinary &&
                        mutation.driverFilter === 'Putative_Driver') ||
                    false;

                const customDriverTier: string | undefined =
                    mutation.driverTiersFilter &&
                    this.driverAnnotationSettings.driverTiers.get(
                        mutation.driverTiersFilter
                    )
                        ? mutation.driverTiersFilter
                        : undefined;

                return {
                    oncoKb,
                    hotspots,
                    cbioportalCount,
                    cosmicCount,
                    customDriverBinary,
                    customDriverTier,
                };
            });
        },
    });

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            await: () => [this.mutations],
            invoke: async () =>
                this.mutations.result
                    ? await fetchVariantAnnotationsIndexedByGenomicLocation(
                          this.mutations.result,
                          ['annotation_summary', 'hotspots'],
                          AppConfig.serverConfig.isoformOverrideSource
                      )
                    : undefined,
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        undefined
    );

    // Hotspots
    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () => {
            return fetchHotspotsData(this.mutations);
        },
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    public readonly isHotspotForOncoprint = remoteData<
        ((m: Mutation) => boolean) | Error
    >({
        invoke: () => {
            // have to do it like this so that an error doesnt cause chain reaction of errors and app crash
            if (this.indexedHotspotData.isComplete) {
                const indexedHotspotData = this.indexedHotspotData.result;
                if (indexedHotspotData) {
                    return Promise.resolve((mutation: Mutation) => {
                        return isRecurrentHotspot(mutation, indexedHotspotData);
                    });
                } else {
                    return Promise.resolve(((mutation: Mutation) => false) as (
                        m: Mutation
                    ) => boolean);
                }
            } else if (this.indexedHotspotData.isError) {
                return Promise.resolve(new Error());
            } else {
                // pending: return endless promise to keep isHotspotForOncoprint pending
                return new Promise(() => {});
            }
        },
    });
    //OncoKb
    readonly uniqueSampleKeyToTumorType = remoteData<{
        [uniqueSampleKey: string]: string;
    }>({
        await: () => [
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData,
        ],
        invoke: () => {
            return Promise.resolve(
                generateUniqueSampleKeyToTumorTypeMap(
                    this.clinicalDataForSamples,
                    this.studiesForSamplesWithoutCancerTypeClinicalData,
                    this.samplesWithoutCancerTypeClinicalData
                )
            );
        },
    });

    readonly oncoKbData = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.mutations,
                this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.uniqueSampleKeyToTumorType,
                this.oncoKbAnnotatedGenes,
            ],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbData(
                        this.uniqueSampleKeyToTumorType.result!,
                        this.oncoKbAnnotatedGenes.result!,
                        this.mutations
                    );
                } else {
                    return Promise.resolve(ONCOKB_DEFAULT);
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [this.mutations, this.oncoKbAnnotatedGenes],
            invoke: async () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    let result;
                    try {
                        result = await fetchOncoKbData(
                            {},
                            this.oncoKbAnnotatedGenes.result!,
                            this.mutations,
                            'ONCOGENIC'
                        );
                    } catch (e) {
                        result = new Error();
                    }
                    return result;
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly cnaOncoKbData = remoteData<IOncoKbData>(
        {
            await: () => [
                this.uniqueSampleKeyToTumorType,
                this.oncoKbAnnotatedGenes,
                this.molecularData,
                this.molecularProfileIdToMolecularProfile,
            ],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchCnaOncoKbDataWithNumericGeneMolecularData(
                        this.uniqueSampleKeyToTumorType.result!,
                        this.oncoKbAnnotatedGenes.result!,
                        this.molecularData,
                        this.molecularProfileIdToMolecularProfile.result!
                    );
                } else {
                    return Promise.resolve(ONCOKB_DEFAULT);
                }
            },
        },
        ONCOKB_DEFAULT
    );

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.uniqueSampleKeyToTumorType,
                this.oncoKbAnnotatedGenes,
                this.molecularData,
                this.molecularProfileIdToMolecularProfile,
            ],
            invoke: async () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    let result;
                    try {
                        result = await fetchCnaOncoKbDataWithNumericGeneMolecularData(
                            {},
                            this.oncoKbAnnotatedGenes.result!,
                            this.molecularData,
                            this.molecularProfileIdToMolecularProfile.result!,
                            'ONCOGENIC'
                        );
                    } catch (e) {
                        result = new Error();
                    }
                    return result;
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
        },
        ONCOKB_DEFAULT
    );

    @computed get didOncoKbFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return (
            this.getOncoKbMutationAnnotationForOncoprint.peekStatus ===
                'complete' &&
            this.getOncoKbMutationAnnotationForOncoprint.result instanceof Error
        );
    }

    @computed get didHotspotFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return (
            this.isHotspotForOncoprint.peekStatus === 'complete' &&
            this.isHotspotForOncoprint.result instanceof Error
        );
    }

    readonly getOncoKbMutationAnnotationForOncoprint = remoteData<
        Error | ((mutation: Mutation) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.oncoKbDataForOncoprint],
        invoke: () => {
            const oncoKbDataForOncoprint = this.oncoKbDataForOncoprint.result!;
            if (oncoKbDataForOncoprint instanceof Error) {
                return Promise.resolve(new Error());
            } else {
                return Promise.resolve((mutation: Mutation) => {
                    const uniqueSampleKeyToTumorType = oncoKbDataForOncoprint.uniqueSampleKeyToTumorType!;
                    const id = generateQueryVariantId(
                        mutation.entrezGeneId,
                        cancerTypeForOncoKb(
                            mutation.uniqueSampleKey,
                            uniqueSampleKeyToTumorType
                        ),
                        mutation.proteinChange,
                        mutation.mutationType
                    );
                    return oncoKbDataForOncoprint.indicatorMap![id];
                });
            }
        },
    });

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<
        | Error
        | ((data: NumericGeneMolecularData) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.cnaOncoKbDataForOncoprint],
        invoke: () => {
            const cnaOncoKbDataForOncoprint = this.cnaOncoKbDataForOncoprint
                .result!;
            if (cnaOncoKbDataForOncoprint instanceof Error) {
                return Promise.resolve(new Error());
            } else {
                return Promise.resolve((data: NumericGeneMolecularData) => {
                    if (this.driverAnnotationSettings.oncoKb) {
                        const uniqueSampleKeyToTumorType = cnaOncoKbDataForOncoprint.uniqueSampleKeyToTumorType!;
                        const id = generateQueryVariantId(
                            data.entrezGeneId,
                            cancerTypeForOncoKb(
                                data.uniqueSampleKey,
                                uniqueSampleKeyToTumorType
                            ),
                            getAlterationString(data.value)
                        );
                        return cnaOncoKbDataForOncoprint.indicatorMap![id];
                    } else {
                        return undefined;
                    }
                });
            }
        },
    });

    readonly cbioportalMutationCountData = remoteData<
        MutationCountByPosition[]
    >({
        await: () => [this.mutations],
        invoke: () => {
            const mutationPositionIdentifiers = countMutations(
                this.mutations.result!
            );

            return client.fetchMutationCountsByPositionUsingPOST({
                mutationPositionIdentifiers: _.values(
                    mutationPositionIdentifiers
                ),
            });
        },
    });

    readonly getCBioportalCount: MobxPromise<
        (mutation: Mutation) => number
    > = remoteData({
        await: () => [this.cbioportalMutationCountData],
        invoke: () => {
            const countsMap = _.groupBy(
                this.cbioportalMutationCountData.result!,
                count => mutationCountByPositionKey(count)
            );
            return Promise.resolve((mutation: Mutation): number => {
                const key = mutationCountByPositionKey(mutation);
                const counts = countsMap[key];
                if (counts) {
                    return counts.reduce((count, next) => {
                        return count + next.count;
                    }, 0);
                } else {
                    return -1;
                }
            });
        },
    });
    //COSMIC count
    readonly cosmicCountData = remoteData<CosmicMutation[]>({
        await: () => [this.mutations],
        invoke: () => {
            return internalClient.fetchCosmicCountsUsingPOST({
                keywords: _.uniq(
                    this.mutations
                        .result!.filter((m: Mutation) => {
                            // keyword is what we use to query COSMIC count with, so we need
                            //  the unique list of mutation keywords to query. If a mutation has
                            //  no keyword, it cannot be queried for.
                            return !!m.keyword;
                        })
                        .map((m: Mutation) => m.keyword)
                ),
            });
        },
    });

    readonly getCosmicCount: MobxPromise<
        (mutation: Mutation) => number
    > = remoteData({
        await: () => [this.cosmicCountData],
        invoke: () => {
            const countMap = _.groupBy(
                this.cosmicCountData.result!,
                d => d.keyword
            );
            return Promise.resolve((mutation: Mutation): number => {
                const keyword = mutation.keyword;
                const counts = countMap[keyword];
                const targetPosObj = getProteinPositionFromProteinChange(
                    mutation.proteinChange
                );
                if (counts && targetPosObj) {
                    const targetPos = targetPosObj.start;
                    return counts.reduce((count, next: CosmicMutation) => {
                        const pos = getProteinPositionFromProteinChange(
                            next.proteinChange
                        );
                        if (pos && pos.start === targetPos) {
                            // only tally cosmic entries with same keyword and same start position
                            return count + next.count;
                        } else {
                            return count;
                        }
                    }, 0);
                } else {
                    return -1;
                }
            });
        },
    });

    readonly mutationEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: async () =>
            pickMutationEnrichmentProfiles(
                this.molecularProfilesInStudies.result!
            ),
    });

    readonly mutationEnrichmentData = makeEnrichmentDataPromise({
        store: this,
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.alteredPatients,
            this.unalteredPatients,
            this.selectedMutationEnrichmentProfileMap,
        ],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        getSelectedProfileMap: () =>
            this.selectedMutationEnrichmentProfileMap.result!,
        fetchData: () => {
            const molecularProfile = this.selectedMutationEnrichmentProfileMap
                .result!;
            const alteredGroup: (Sample | Patient)[] = this
                .usePatientLevelEnrichments
                ? this.alteredPatients.result!
                : this.alteredSamples.result!;
            const unalteredGroup: (Sample | Patient)[] = this
                .usePatientLevelEnrichments
                ? this.unalteredPatients.result!
                : this.unalteredSamples.result!;
            return internalClient.fetchMutationEnrichmentsUsingPOST({
                enrichmentType: this.usePatientLevelEnrichments
                    ? 'PATIENT'
                    : 'SAMPLE',
                groups: [
                    {
                        molecularProfileCaseIdentifiers: alteredGroup
                            .filter(
                                s => molecularProfile[s.studyId] !== undefined
                            )
                            .map(c => ({
                                caseId: this.usePatientLevelEnrichments
                                    ? c.patientId
                                    : (c as Sample).sampleId,
                                molecularProfileId:
                                    molecularProfile[c.studyId]
                                        .molecularProfileId,
                            })),
                        name: 'Altered group',
                    },
                    {
                        molecularProfileCaseIdentifiers: unalteredGroup
                            .filter(
                                s => molecularProfile[s.studyId] !== undefined
                            )
                            .map(c => ({
                                caseId: this.usePatientLevelEnrichments
                                    ? c.patientId
                                    : (c as Sample).sampleId,
                                molecularProfileId:
                                    molecularProfile[c.studyId]
                                        .molecularProfileId,
                            })),
                        name: 'Unaltered group',
                    },
                ],
            });
        },
    });

    readonly copyNumberEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: async () =>
            pickCopyNumberEnrichmentProfiles(
                this.molecularProfilesInStudies.result!
            ),
    });

    readonly copyNumberHomdelEnrichmentData = makeEnrichmentDataPromise({
        store: this,
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.selectedCopyNumberEnrichmentProfileMap,
        ],
        getSelectedProfileMap: () =>
            this.selectedCopyNumberEnrichmentProfileMap.result!,
        fetchData: () => this.getCopyNumberEnrichmentData('HOMDEL'),
    });

    readonly copyNumberAmpEnrichmentData = makeEnrichmentDataPromise({
        store: this,
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.selectedCopyNumberEnrichmentProfileMap,
        ],
        getSelectedProfileMap: () =>
            this.selectedCopyNumberEnrichmentProfileMap.result!,
        fetchData: () => this.getCopyNumberEnrichmentData('AMP'),
    });

    private getCopyNumberEnrichmentData(
        copyNumberEventType: 'HOMDEL' | 'AMP'
    ): Promise<AlterationEnrichment[]> {
        const molecularProfile = this.selectedCopyNumberEnrichmentProfileMap
            .result!;
        const alteredGroup: (Sample | Patient)[] = this
            .usePatientLevelEnrichments
            ? this.alteredPatients.result!
            : this.alteredSamples.result!;
        const unalteredGroup: (Sample | Patient)[] = this
            .usePatientLevelEnrichments
            ? this.unalteredPatients.result!
            : this.unalteredSamples.result!;
        return internalClient.fetchCopyNumberEnrichmentsUsingPOST({
            copyNumberEventType: copyNumberEventType,
            enrichmentType: this.usePatientLevelEnrichments
                ? 'PATIENT'
                : 'SAMPLE',
            groups: [
                {
                    molecularProfileCaseIdentifiers: alteredGroup
                        .filter(s => molecularProfile[s.studyId] !== undefined)
                        .map(c => ({
                            caseId: this.usePatientLevelEnrichments
                                ? c.patientId
                                : (c as Sample).sampleId,
                            molecularProfileId:
                                molecularProfile[c.studyId].molecularProfileId,
                        })),
                    name: 'Altered group',
                },
                {
                    molecularProfileCaseIdentifiers: unalteredGroup
                        .filter(s => molecularProfile[s.studyId] !== undefined)
                        .map(c => ({
                            caseId: this.usePatientLevelEnrichments
                                ? c.patientId
                                : (c as Sample).sampleId,
                            molecularProfileId:
                                molecularProfile[c.studyId].molecularProfileId,
                        })),
                    name: 'Unaltered group',
                },
            ],
        });
    }

    readonly mRNAEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () =>
            Promise.resolve(
                pickMRNAEnrichmentProfiles(
                    this.molecularProfilesInStudies.result!
                )
            ),
    });

    readonly mRNAEnrichmentData = makeEnrichmentDataPromise({
        store: this,
        await: () => [this.alteredSamples, this.unalteredSamples],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        getSelectedProfileMap: () =>
            this.selectedmRNAEnrichmentProfileMap.result!, // returns an empty array if the selected study doesn't have any mRNA profiles
        fetchData: () => {
            let studyIds = Object.keys(
                this.selectedmRNAEnrichmentProfileMap.result!
            );
            if (studyIds.length === 1) {
                const molecularProfileId = this.selectedmRNAEnrichmentProfileMap
                    .result![studyIds[0]].molecularProfileId;
                const groups: MolecularProfileCasesGroupFilter[] = [
                    {
                        molecularProfileCaseIdentifiers: this.alteredSamples
                            .result!.filter(s => s.studyId === studyIds[0])
                            .map(s => ({
                                caseId: s.sampleId,
                                molecularProfileId,
                            })),
                        name: 'Altered group',
                    },
                    {
                        molecularProfileCaseIdentifiers: this.unalteredSamples.result
                            .filter(s => s.studyId === studyIds[0])
                            .map(s => ({
                                caseId: s.sampleId,
                                molecularProfileId,
                            })),
                        name: 'Unaltered group',
                    },
                ];

                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    enrichmentType: 'SAMPLE',
                    groups,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly proteinEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () =>
            Promise.resolve(
                pickProteinEnrichmentProfiles(
                    this.molecularProfilesInStudies.result!
                )
            ),
    });

    readonly proteinEnrichmentData = makeEnrichmentDataPromise({
        store: this,
        await: () => [this.alteredSamples, this.unalteredSamples],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        getSelectedProfileMap: () =>
            this.selectedProteinEnrichmentProfileMap.result!, // returns an empty array if the selected study doesn't have any protein profiles
        fetchData: () => {
            let studyIds = Object.keys(
                this.selectedProteinEnrichmentProfileMap.result!
            );
            if (studyIds.length === 1) {
                const molecularProfileId = this
                    .selectedProteinEnrichmentProfileMap.result![studyIds[0]]
                    .molecularProfileId;
                const groups: MolecularProfileCasesGroupFilter[] = [
                    {
                        molecularProfileCaseIdentifiers: this.alteredSamples.result
                            .filter(s => s.studyId === studyIds[0])
                            .map(s => ({
                                caseId: s.sampleId,
                                molecularProfileId,
                            })),
                        name: 'Altered group',
                    },
                    {
                        molecularProfileCaseIdentifiers: this.unalteredSamples.result
                            .filter(s => s.studyId === studyIds[0])
                            .map(s => ({
                                caseId: s.sampleId,
                                molecularProfileId,
                            })),
                        name: 'Unaltered group',
                    },
                ];

                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    enrichmentType: 'SAMPLE',
                    groups,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly molecularProfileIdToProfiledSampleCount = remoteData({
        await: () => [
            this.samples,
            this.coverageInformation,
            this.molecularProfilesInStudies,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: number } = {};
            const profileIds = this.molecularProfilesInStudies.result.map(
                x => x.molecularProfileId
            );
            const coverageInformation = this.coverageInformation.result!;
            for (const profileId of profileIds) {
                ret[profileId] = 0;
            }
            let profiledReport: boolean[] = [];
            for (const sample of this.samples.result!) {
                profiledReport = isSampleProfiledInMultiple(
                    sample.uniqueSampleKey,
                    profileIds,
                    coverageInformation
                );
                for (let i = 0; i < profileIds.length; i++) {
                    if (profiledReport[i]) {
                        ret[profileIds[i]] += 1;
                    }
                }
            }
            return Promise.resolve(ret);
        },
    });

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    /*
     * For annotations of Genome Nexus we want to fetch lazily
     */
    @cached get genomeNexusCache() {
        return new GenomeNexusCache();
    }

    @cached get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache();
    }

    @cached get genomeNexusMyVariantInfoCache() {
        return new GenomeNexusMyVariantInfoCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(
            this.studyToMolecularProfileDiscrete.result
        );
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached get mutationCountCache() {
        return new MutationCountCache();
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached get mutationDataCache() {
        return new MutationDataCache(
            this.studyToMutationMolecularProfile.result,
            this.studyToDataQueryFilter.result
        );
    }

    readonly geneMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            return Promise.resolve(
                new GeneMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result
                )
            );
        },
    });

    readonly expressionProfiles = remoteData(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudies.result.filter(
                        (profile: MolecularProfile) =>
                            isRNASeqProfile(profile.molecularProfileId)
                    )
                );
            },
        },
        []
    );

    @memoize sortRnaSeqMolecularDataByStudy(seqData: {
        [profileId: string]: NumericGeneMolecularData[];
    }) {
        return _.keyBy(seqData, (data: NumericGeneMolecularData[]) => {
            return data[0].studyId;
        });
    }

    readonly genesetMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenesetMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    public numericGenesetMolecularDataCache = new MobxPromiseCache<
        { genesetId: string; molecularProfileId: string },
        GenesetMolecularData[]
    >(q => ({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            const dqf = this.molecularProfileIdToDataQueryFilter.result![
                q.molecularProfileId
            ];
            if (dqf) {
                return internalClient.fetchGeneticDataItemsUsingPOST({
                    geneticProfileId: q.molecularProfileId,
                    genesetDataFilterCriteria: {
                        genesetIds: [q.genesetId],
                        ...dqf,
                    } as GenesetDataFilterCriteria,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    }));

    readonly genesetCorrelatedGeneCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenesetCorrelatedGeneCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    readonly treatmentMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new TreatmentMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    readonly geneCache = new GeneCache();
    readonly genesetCache = new GenesetCache();

    public numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            const dqf = this.molecularProfileIdToDataQueryFilter.result![
                q.molecularProfileId
            ];
            // it's possible that sampleIds is empty for a given profile
            const hasSampleSpec =
                dqf &&
                ((dqf.sampleIds && dqf.sampleIds.length) || dqf.sampleListId);
            if (hasSampleSpec) {
                return client.fetchAllMolecularDataInMolecularProfileUsingPOST({
                    molecularProfileId: q.molecularProfileId,
                    molecularDataFilter: {
                        entrezGeneIds: [q.entrezGeneId],
                        ...dqf,
                    } as MolecularDataFilter,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    }));

    public clinicalDataCache = new ClinicalDataCache(
        this.samples,
        this.patients,
        this.studyToMutationMolecularProfile,
        this.studyIdToStudy,
        this.coverageInformation
    );

    public mutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        Mutation[]
    >(q => ({
        await: () => [
            this.studyToMutationMolecularProfile,
            this.studyToDataQueryFilter,
        ],
        invoke: async () => {
            return _.flatten(
                await Promise.all(
                    Object.keys(
                        this.studyToMutationMolecularProfile.result!
                    ).map(studyId => {
                        const molecularProfileId = this
                            .studyToMutationMolecularProfile.result![studyId]
                            .molecularProfileId;
                        const dqf = this.studyToDataQueryFilter.result![
                            studyId
                        ];
                        if (dqf && molecularProfileId) {
                            return client.fetchMutationsInMolecularProfileUsingPOST(
                                {
                                    molecularProfileId,
                                    mutationFilter: {
                                        entrezGeneIds: [q.entrezGeneId],
                                        ...dqf,
                                    } as MutationFilter,
                                    projection: 'DETAILED',
                                }
                            );
                        } else {
                            return Promise.resolve([]);
                        }
                    })
                )
            );
        },
    }));

    @action clearErrors() {
        this.ajaxErrors = [];
    }

    @autobind
    @action
    public navigateToSurvivalTab() {
        this.urlWrapper.setTabId(ResultsViewTab.COMPARISON);
        this.urlWrapper.setComparisonSubTabId(
            ResultsViewComparisonSubTab.SURVIVAL
        );
    }

    readonly overallSurvivalDescriptions = remoteData({
        await: () => [this.clinicalAttributes, this.studyIdToStudy],
        invoke: () => {
            const overallSurvivalClinicalAttributeId = 'OS_STATUS';
            const clinicalAttributeMap = _.groupBy(
                this.clinicalAttributes.result,
                'clinicalAttributeId'
            );
            const result: ISurvivalDescription[] = [];
            const studyIdToStudy: { [studyId: string]: CancerStudy } = this
                .studyIdToStudy.result;
            if (
                clinicalAttributeMap &&
                clinicalAttributeMap[overallSurvivalClinicalAttributeId] &&
                clinicalAttributeMap[overallSurvivalClinicalAttributeId]
                    .length > 0
            ) {
                clinicalAttributeMap[
                    overallSurvivalClinicalAttributeId
                ].forEach(attr => {
                    result.push({
                        studyName: studyIdToStudy[attr.studyId].name,
                        description: attr.description,
                    } as ISurvivalDescription);
                });
                return Promise.resolve(result);
            }
            return Promise.resolve([]);
        },
    });

    readonly diseaseFreeSurvivalDescriptions = remoteData({
        await: () => [this.clinicalAttributes, this.studyIdToStudy],
        invoke: () => {
            const diseaseFreeSurvivalClinicalAttributeId = 'DFS_STATUS';
            const clinicalAttributeMap = _.groupBy(
                this.clinicalAttributes.result,
                'clinicalAttributeId'
            );
            const result: ISurvivalDescription[] = [];
            const studyIdToStudy: { [studyId: string]: CancerStudy } = this
                .studyIdToStudy.result;
            if (
                clinicalAttributeMap &&
                clinicalAttributeMap[diseaseFreeSurvivalClinicalAttributeId] &&
                clinicalAttributeMap[diseaseFreeSurvivalClinicalAttributeId]
                    .length > 0
            ) {
                clinicalAttributeMap[
                    diseaseFreeSurvivalClinicalAttributeId
                ].forEach(attr => {
                    result.push({
                        studyName: studyIdToStudy[attr.studyId].name,
                        description: attr.description,
                    } as ISurvivalDescription);
                });
                return Promise.resolve(result);
            }
            return Promise.resolve([]);
        },
    });
}
