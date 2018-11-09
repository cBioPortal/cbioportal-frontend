import {
    CancerStudy,
    ClinicalAttribute, ClinicalAttributeCount,
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
    PatientFilter,
    PatientIdentifier,
    Sample,
    SampleFilter,
    SampleIdentifier,
    SampleList,
    SampleMolecularIdentifier
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {action, computed, observable, ObservableMap} from "mobx";
import {remoteData} from "shared/api/remoteData";
import {cached, labelMobxPromises, MobxPromise} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import GenomeNexusCache from "shared/cache/GenomeNexusCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    cancerTypeForOncoKb,
    fetchCnaOncoKbDataWithNumericGeneMolecularData,
    fetchCopyNumberSegmentsForSamples,
    fetchGenes,
    fetchGermlineConsentedSamples,
    fetchMyCancerGenomeData,
    fetchOncoKbAnnotatedGenesSuppressErrors,
    fetchOncoKbData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    generateDataQueryFilter,
    generateUniqueSampleKeyToTumorTypeMap,
    groupBy,
    IDataQueryFilter,
    isMutationProfile,
    ONCOKB_DEFAULT
} from "shared/lib/StoreUtils";
import {fetchHotspotsData, indexHotspotsData} from "shared/lib/CancerHotspotsUtils";
import ResultsViewMutationMapperStore from "./mutation/ResultsViewMutationMapperStore";
import AppConfig from "appConfig";
import * as _ from "lodash";
import {stringListToSet} from "../../shared/lib/StringUtils";
import {toSampleUuid} from "../../shared/lib/UuidUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";
import accessors, {SimplifiedMutationType} from "../../shared/lib/oql/accessors";
import {AugmentedData, CacheData} from "../../shared/lib/LazyMobXCache";
import {IAlterationData} from "./cancerSummary/CancerSummaryContent";
import {PatientSurvival} from "../../shared/model/PatientSurvival";
import {
    doesQueryContainMutationOQL,
    doesQueryContainOQL,
    filterCBioPortalWebServiceData,
    filterCBioPortalWebServiceDataByOQLLine,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    OQLLineFilterOutput,
    parseOQLQuery,
    UnflattenedOQLLineFilterOutput
} from "../../shared/lib/oql/oqlfilter";
import GeneMolecularDataCache from "../../shared/cache/GeneMolecularDataCache";
import GenesetMolecularDataCache from "../../shared/cache/GenesetMolecularDataCache";
import GenesetCorrelatedGeneCache from "../../shared/cache/GenesetCorrelatedGeneCache";
import GeneCache from "../../shared/cache/GeneCache";
import GenesetCache from "../../shared/cache/GenesetCache";
import {IHotspotIndex} from "../../shared/model/CancerHotspots";
import {IOncoKbData} from "../../shared/model/OncoKB";
import {generateQueryVariantId} from "../../shared/lib/OncoKbUtils";
import {
    AlterationEnrichment,
    CosmicMutation,
    ExpressionEnrichment,
    Geneset, GenesetDataFilterCriteria
} from "../../shared/api/generated/CBioPortalAPIInternal";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import {getAlterationString} from "../../shared/lib/CopyNumberUtils";
import memoize from "memoize-weak-decorator";
import request from "superagent";
import {countMutations, mutationCountByPositionKey} from "./mutationCountHelpers";
import {getPatientSurvivals} from "./SurvivalStoreHelper";
import {QueryStore} from "shared/components/query/QueryStore";
import {
    annotateMolecularDatum,
    computeCustomDriverAnnotationReport,
    computeGenePanelInformation,
    computePutativeDriverAnnotatedMutations,
    CoverageInformation,
    fetchQueriedStudies,
    filterSubQueryData,
    getOncoKbOncogenic,
    groupDataByCase,
    initializeCustomDriverAnnotationSettings,
    isRNASeqProfile
} from "./ResultsViewPageStoreUtils";
import {getAlterationCountsForCancerTypesForAllGenes} from "../../shared/lib/alterationCountHelpers";
import MobxPromiseCache from "../../shared/lib/MobxPromiseCache";
import {
    isSampleProfiledInMultiple
} from "../../shared/lib/isSampleProfiled";
import {BookmarkLinks} from "../../shared/model/BookmarkLinks";
import {getBitlyServiceUrl} from "../../shared/api/urls";
import url from "url";
import OncoprintClinicalDataCache, {SpecialAttribute} from "../../shared/cache/OncoprintClinicalDataCache";
import {getDefaultMolecularProfiles} from "../../shared/lib/getDefaultMolecularProfiles";
import {getProteinPositionFromProteinChange} from "../../shared/lib/ProteinChangeUtils";
import {isMutation} from "../../shared/lib/CBioPortalAPIUtils";
import {fetchVariantAnnotationsIndexedByGenomicLocation} from "shared/lib/MutationAnnotator";
import {VariantAnnotation} from "shared/api/generated/GenomeNexusAPI";
import {ServerConfigHelpers} from "../../config/config";
import {
    getVirtualStudies,
    populateSampleSpecificationsFromVirtualStudies, ResultsViewTab,
    substitutePhysicalStudiesForVirtualStudies
} from "./ResultsViewPageHelpers";
import {filterAndSortProfiles} from "./coExpression/CoExpressionTabUtils";
import {isRecurrentHotspot} from "../../shared/lib/AnnotationUtils";
import {makeProfiledInClinicalAttributes} from "../../shared/components/oncoprint/ResultsViewOncoprintUtils";
import {ResultsViewQuery} from "./ResultsViewQuery";

type Optional<T> = (
    {isApplicable: true, value: T}
    | {isApplicable: false, value?: undefined}
);


export const AlterationTypeConstants = {
    MUTATION_EXTENDED: 'MUTATION_EXTENDED',
    COPY_NUMBER_ALTERATION: 'COPY_NUMBER_ALTERATION',
    MRNA_EXPRESSION: 'MRNA_EXPRESSION',
    PROTEIN_LEVEL: 'PROTEIN_LEVEL',
    FUSION: 'FUSION',
    GENESET_SCORE: 'GENESET_SCORE',
    METHYLATION: 'METHYLATION'
};

export const DataTypeConstants = {
    DISCRETE: "DISCRETE",
    CONTINUOUS: "CONTINUOUS",
    ZSCORE: "Z-SCORE",
    MAF: "MAF",
    LOGVALUE:"LOG-VALUE",
    LOG2VALUE:"LOG2-VALUE"
};

export enum SampleListCategoryType {
    "w_mut"="w_mut",
    "w_cna"="w_cna",
    "w_mut_cna"="w_mut_cna"
}

export const SampleListCategoryTypeToFullId = {
    [SampleListCategoryType.w_mut]:"all_cases_with_mutation_data",
    [SampleListCategoryType.w_cna]:"all_cases_with_cna_data",
    [SampleListCategoryType.w_mut_cna]:"all_cases_with_mutation_and_cna_data"
};

export type SamplesSpecificationElement = {studyId: string, sampleId: string, sampleListId: undefined} |
    {studyId: string, sampleId: undefined, sampleListId: string};

export interface ExtendedAlteration extends Mutation, NumericGeneMolecularData {
    hugoGeneSymbol:string;
    molecularProfileAlterationType: MolecularProfile["molecularAlterationType"];
    // TODO: what is difference molecularProfileAlterationType and
    // alterationType?
    alterationType: string
    alterationSubType: string
};

export interface AnnotatedMutation extends Mutation {
    hugoGeneSymbol:string;
    putativeDriver: boolean;
    oncoKbOncogenic:string;
    isHotspot:boolean;
    simplifiedMutationType: SimplifiedMutationType;
}

export interface AnnotatedNumericGeneMolecularData extends NumericGeneMolecularData {
    hugoGeneSymbol: string;
    oncoKbOncogenic: string;
}

export interface AnnotatedExtendedAlteration extends ExtendedAlteration, AnnotatedMutation, AnnotatedNumericGeneMolecularData {};

export interface ExtendedSample extends Sample {
    cancerType: string;
    cancerTypeDetailed: string;
}

export type CaseAggregatedData<T> = {
    samples: {[uniqueSampleKey:string]:T[]};
    patients: {[uniquePatientKey:string]:T[]};
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
interface IQueriedMergedTrackCaseData {
    cases: CaseAggregatedData<AnnotatedExtendedAlteration>;
    oql: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>;
    list?: IQueriedCaseData<object>[];
}

export function buildDefaultOQLProfile(profilesTypes: string[], zScoreThreshold: number, rppaScoreThreshold: number) {

    var default_oql_uniq: any = {};
    for (var i = 0; i < profilesTypes.length; i++) {
        var type = profilesTypes[i];
        switch (type) {
            case "MUTATION_EXTENDED":
                default_oql_uniq["MUT"] = true;
                default_oql_uniq["FUSION"] = true;
                break;
            case "COPY_NUMBER_ALTERATION":
                default_oql_uniq["AMP"] = true;
                default_oql_uniq["HOMDEL"] = true;
                break;
            case "MRNA_EXPRESSION":
                default_oql_uniq["EXP>=" + zScoreThreshold] = true;
                default_oql_uniq["EXP<=-" + zScoreThreshold] = true;
                break;
            case "PROTEIN_LEVEL":
                default_oql_uniq["PROT>=" + rppaScoreThreshold] = true;
                default_oql_uniq["PROT<=-" + rppaScoreThreshold] = true;
                break;
        }
    }
    return Object.keys(default_oql_uniq).join(" ");

}

export function extendSamplesWithCancerType(samples:Sample[], clinicalDataForSamples:ClinicalData[], studies:CancerStudy[]){

    const clinicalDataGroupedBySampleId = _.groupBy(clinicalDataForSamples, (clinicalData:ClinicalData)=>clinicalData.uniqueSampleKey);
    // note that this table is actually mutating underlying sample.  it's not worth it to clone samples just
    // for purity
    const extendedSamples = samples.map((sample: ExtendedSample)=>{
        const clinicalData = clinicalDataGroupedBySampleId[sample.uniqueSampleKey];
        if (clinicalData) {
            clinicalData.forEach((clinicalDatum:ClinicalData)=>{
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
    const studyMap = _.keyBy(studies,(study:CancerStudy)=>study.studyId);

    // now we need to fix any samples which do not have both cancerType and cancerTypeDetailed
    extendedSamples.forEach((sample:ExtendedSample)=>{
        //if we have no cancer subtype, then make the subtype the parent type
        if (!sample.cancerType) {
            // we need to fall back to studies cancerType
            const study = studyMap[sample.studyId];
            if (study) {
                sample.cancerType = study.cancerType.name;
            } else {
                sample.cancerType = "Unknown";
            }
        }
        if (sample.cancerType && !sample.cancerTypeDetailed) {
            sample.cancerTypeDetailed = sample.cancerType;
        }
    });

    return extendedSamples;

}

type MutationAnnotationSettings = {
    ignoreUnknown: boolean;
    cbioportalCount:boolean;
    cbioportalCountThreshold:number;
    cosmicCount:boolean;
    cosmicCountThreshold:number;
    driverFilter:boolean;
    driverTiers:ObservableMap<boolean>;
    hotspots:boolean;
    oncoKb:boolean;
    driversAnnotated:boolean;
};

/* fields and methods in the class below are ordered based on roughly
/* chronological setup concerns, rather than on encapsulation and public API */
/* tslint:disable: member-ordering */
export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        // addErrorHandler((error: any) => {
        //     this.ajaxErrors.push(error);
        // });
        this.getURL();

        const store = this;

        this.mutationAnnotationSettings = observable({
            cbioportalCount: false,
            cbioportalCountThreshold: 0,
            cosmicCount: false,
            cosmicCountThreshold: 0,
            driverFilter: false,
            driverTiers: observable.map<boolean>(),

            _hotspots:false,
            _oncoKb:false,
            _ignoreUnknown: false,

            set hotspots(val:boolean) {
                this._hotspots = val;
            },
            get hotspots() {
                return !!AppConfig.serverConfig.show_hotspot && this._hotspots && !store.didHotspotFailInOncoprint;
            },
            set oncoKb(val:boolean) {
                this._oncoKb = val;
            },
            get oncoKb() {
                return AppConfig.serverConfig.show_oncokb && this._oncoKb && !store.didOncoKbFailInOncoprint;
            },
            set ignoreUnknown(val:boolean) {
                this._ignoreUnknown = val;
            },
            get ignoreUnknown() {
                return this._ignoreUnknown && this.driversAnnotated;
            },
            get driversAnnotated() {
                const anySelected = this.oncoKb ||
                    this.hotspots ||
                    this.cbioportalCount ||
                    this.cosmicCount ||
                    this.driverFilter ||
                    this.driverTiers.entries().reduce((oneSelected:boolean, nextEntry:[string, boolean])=>{
                        return oneSelected || nextEntry[1];
                    }, false);

                return anySelected;
            }
        });

        this.initMutationAnnotationSettings();
    }

    public queryReactionDisposer:any;

    public rvQuery:ResultsViewQuery = new ResultsViewQuery();

    @observable tabId: ResultsViewTab|undefined = undefined;

    @observable public checkingVirtualStudies = false;

    public queryStore: QueryStore;

    @observable public urlValidationError: string | null = null;

    @computed get profileFilter(){
        return this.rvQuery.profileFilter || 0;
    }

    @observable ajaxErrors: Error[] = [];

    @observable public sessionIdURL = '';

    @observable expressionTabSeqVersion: number = 2;

    public mutationAnnotationSettings:MutationAnnotationSettings;

    @observable.ref public _selectedEnrichmentMutationProfile: MolecularProfile;
    @observable.ref public _selectedEnrichmentCopyNumberProfile: MolecularProfile;
    @observable.ref public _selectedEnrichmentMRNAProfile: MolecularProfile;
    @observable.ref public _selectedEnrichmentProteinProfile: MolecularProfile;

    @computed get selectedEnrichmentMutationProfile() {
        if (!this._selectedEnrichmentMutationProfile && this.mutationEnrichmentProfiles.isComplete &&
                this.mutationEnrichmentProfiles.result!.length > 0) {
            return this.mutationEnrichmentProfiles.result![0];
        } else {
            return this._selectedEnrichmentMutationProfile;
        }
    }

    @computed get selectedEnrichmentCopyNumberProfile() {
        if (!this._selectedEnrichmentCopyNumberProfile && this.copyNumberEnrichmentProfiles.isComplete &&
            this.copyNumberEnrichmentProfiles.result!.length > 0) {
            return this.copyNumberEnrichmentProfiles.result![0];
        } else {
            return this._selectedEnrichmentCopyNumberProfile;
        }
    }

    @computed get selectedEnrichmentMRNAProfile() {
        if (!this._selectedEnrichmentMRNAProfile && this.mRNAEnrichmentProfiles.isComplete &&
            this.mRNAEnrichmentProfiles.result!.length > 0) {
            return this.mRNAEnrichmentProfiles.result![0];
        } else {
            return this._selectedEnrichmentMRNAProfile;
        }
    }

    @computed get selectedEnrichmentProteinProfile() {
        if (!this._selectedEnrichmentProteinProfile && this.proteinEnrichmentProfiles.isComplete &&
            this.proteinEnrichmentProfiles.result!.length > 0) {
            return this.proteinEnrichmentProfiles.result![0];
        } else {
            return this._selectedEnrichmentProteinProfile;
        }
    }

    @computed get hugoGeneSymbols(){
        if (this.rvQuery.oqlQuery.length > 0) {
            return parseOQLQuery(this.rvQuery.oqlQuery).map((o: any) => o.gene);
        } else {
            return [];
        }
    }

    @computed get queryContainsOql() {
        return doesQueryContainOQL(this.rvQuery.oqlQuery);
    }

    @computed get queryContainsMutationOql() {
        return doesQueryContainMutationOQL(this.rvQuery.oqlQuery);
    }

    public initMutationAnnotationSettings() {
        this.mutationAnnotationSettings.cbioportalCount = false;
        this.mutationAnnotationSettings.cbioportalCountThreshold = 10;
        this.mutationAnnotationSettings.cosmicCount = false;
        this.mutationAnnotationSettings.cosmicCountThreshold = 10;
        this.mutationAnnotationSettings.driverFilter = !!AppConfig.serverConfig.oncoprint_custom_driver_annotation_default;
        this.mutationAnnotationSettings.driverTiers = observable.map<boolean>();

        this.mutationAnnotationSettings.hotspots = !AppConfig.serverConfig.oncoprint_oncokb_hotspots_default;
        (this.mutationAnnotationSettings as any)._oncoKb = !AppConfig.serverConfig.oncoprint_oncokb_hotspots_default;
        (this.mutationAnnotationSettings as any)._ignoreUnknown = !!AppConfig.serverConfig.oncoprint_hide_vus_default;
    }

    private getURL() {
        const shareURL = window.location.href;

        if (!shareURL.includes("session_id")) return;

        const showSamples = shareURL.indexOf("&show");
        if (showSamples > -1) {
            this.sessionIdURL = shareURL.slice(0, showSamples);
        }
    }

    readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
        await: ()=>[
            this.studyToMolecularProfiles,
            this.studies
        ],
        invoke: () => {

            // if there are multiple studies or if there are no selected molecular profiles in query
            // derive default profiles based on profileFilter (refers to old data priority)
            if (this.studies.result.length > 1 || this.rvQuery.selectedMolecularProfileIds.length === 0) {
                return Promise.resolve(getDefaultMolecularProfiles(this.studyToMolecularProfiles.result!, this.profileFilter));
            } else {
                // if we have only one study, then consult the selectedMolecularProfileIds because
                // user can directly select set
                const idLookupMap = _.keyBy(this.rvQuery.selectedMolecularProfileIds,(id:string)=>id); // optimization
                return Promise.resolve(this.molecularProfilesInStudies.result!.filter(
                    (profile:MolecularProfile)=>(profile.molecularProfileId in idLookupMap))
                );
            }

        }
    });

    readonly clinicalAttributes_profiledIn = remoteData<(ClinicalAttribute & {molecularProfileIds:string[]})[]>({
        await:()=>[
            this.samples,
            this.coverageInformation,
            this.molecularProfileIdToMolecularProfile,
            this.selectedMolecularProfiles,
            this.studyIds
        ],
        invoke:()=>{
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

    readonly clinicalAttributes = remoteData<(ClinicalAttribute & { molecularProfileIds?: string[] })[]>({
        await:()=>[this.studyIds, this.clinicalAttributes_profiledIn, this.samples, this.patients],
        invoke:async()=>{
            const serverAttributes = await client.fetchClinicalAttributesUsingPOST({
                studyIds:this.studyIds.result!
            });
            const specialAttributes = [
                {
                    clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                    datatype: "COUNTS_MAP",
                    description: "Number of point mutations in the sample counted by different types of nucleotide changes.",
                    displayName: "Mutation spectrum",
                    patientAttribute: false,
                    studyId: "",
                    priority:"0" // TODO: change?
                } as ClinicalAttribute
            ];
            if (this.studyIds.result!.length > 1) {
                // if more than one study, add "Study of Origin" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.StudyOfOrigin,
                    datatype: "STRING",
                    description: "Study which the sample is a part of.",
                    displayName: "Study of origin",
                    patientAttribute: false,
                    studyId: "",
                    priority:"0" // TODO: change?
                } as ClinicalAttribute);
            }
            if (this.samples.result!.length !== this.patients.result!.length) {
                // if different number of samples and patients, add "Num Samples of Patient" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.NumSamplesPerPatient,
                    datatype: "NUMBER",
                    description: "Number of queried samples for each patient.",
                    displayName: "# Samples per Patient",
                    patientAttribute: true
                } as ClinicalAttribute);
            }
            return serverAttributes.concat(specialAttributes).concat(this.clinicalAttributes_profiledIn.result!);
        }
    });

    readonly clinicalAttributeIdToClinicalAttribute = remoteData({
        await:()=>[this.clinicalAttributes],
        invoke:()=>Promise.resolve(_.keyBy(this.clinicalAttributes.result!, "clinicalAttributeId"))
    });

    readonly clinicalAttributeIdToAvailableSampleCount = remoteData({
        await:()=>[
            this.samples,
            this.studies,
            this.clinicalAttributes,
            this.studyToDataQueryFilter,
            this.clinicalAttributes_profiledIn
        ],
        invoke:async()=>{
            let clinicalAttributeCountFilter:ClinicalAttributeCountFilter;
            if (this.studies.result.length === 1) {
                // try using sample list id
                const studyId = this.studies.result[0].studyId;
                const dqf = this.studyToDataQueryFilter.result[studyId];
                if (dqf.sampleListId) {
                    clinicalAttributeCountFilter = {
                        sampleListId: dqf.sampleListId
                    } as ClinicalAttributeCountFilter;
                } else {
                    clinicalAttributeCountFilter = {
                        sampleIdentifiers: dqf.sampleIds!.map(sampleId=>({ sampleId, studyId }))
                    } as ClinicalAttributeCountFilter;
                }
            } else {
                // use sample identifiers
                clinicalAttributeCountFilter = {
                    sampleIdentifiers: this.samples.result!.map(sample=>({sampleId:sample.sampleId, studyId:sample.studyId}))
                } as ClinicalAttributeCountFilter;
            }

            const result = await client.getClinicalAttributeCountsUsingPOST({
                clinicalAttributeCountFilter
            });
            // build map
            const ret:{[clinicalAttributeId:string]:number} = _.reduce(result, (map:{[clinicalAttributeId:string]:number}, next:ClinicalAttributeCount)=>{
                map[next.clinicalAttributeId] = map[next.clinicalAttributeId] || 0;
                map[next.clinicalAttributeId] += next.count;
                return map;
            }, {});
            // add count = 0 for any remaining clinical attributes, since service doesnt return count 0
            for (const clinicalAttribute of this.clinicalAttributes.result!) {
                if (!(clinicalAttribute.clinicalAttributeId in ret)) {
                    ret[clinicalAttribute.clinicalAttributeId] = 0;
                }
            }
            // add counts for "special" clinical attributes
            ret[SpecialAttribute.NumSamplesPerPatient] = this.samples.result!.length;
            ret[SpecialAttribute.StudyOfOrigin] = this.samples.result!.length;
            let samplesWithMutationData = 0, samplesWithCNAData = 0;
            for (const sample of this.samples.result!) {
                samplesWithMutationData += +!!sample.sequenced;
                samplesWithCNAData += +!!sample.copyNumberSegmentPresent;
            }
            ret[SpecialAttribute.MutationSpectrum] = samplesWithMutationData;
            // add counts for "ProfiledIn" clinical attributes
            for (const attr of this.clinicalAttributes_profiledIn.result!) {
                ret[attr.clinicalAttributeId] = this.samples.result!.length;
            }
            return ret;
        }
    });

    readonly cnSegments = remoteData<CopyNumberSeg[]>({
        await: () => [
            this.samples
        ],
        invoke: () => fetchCopyNumberSegmentsForSamples(this.samples.result)
    }, []);

    readonly cnSegmentsByChromosome = remoteData<{ [chromosome: string]: MobxPromise<CopyNumberSeg[]> }>({
        await: () => [
            this.genes,
            this.samples
        ],
        invoke: () => {
            if (this.genes.result) {
                return Promise.resolve(_.reduce(_.uniq(this.genes.result.map(g => g.chromosome)), (map: { [chromosome: string]: MobxPromise<CopyNumberSeg[]> }, chromosome: string) => {
                    map[chromosome] = remoteData<CopyNumberSeg[]> ({
                        invoke: () => fetchCopyNumberSegmentsForSamples(this.samples.result, chromosome)
                    });

                    return map;
                }, {}));
            } else {
                return Promise.resolve({});
            }
        }
    }, {});


    readonly molecularData = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.studyToDataQueryFilter,
            this.genes,
            this.selectedMolecularProfiles,
            this.samples
        ],
        invoke: () => {
            // we get mutations with mutations endpoint, all other alterations with this one, so filter out mutation genetic profile
            const profilesWithoutMutationProfile = _.filter(this.selectedMolecularProfiles.result, (profile: MolecularProfile) => profile.molecularAlterationType !== 'MUTATION_EXTENDED');
            const genes = this.genes.result;

            if (profilesWithoutMutationProfile.length && genes != undefined && genes.length) {

                const identifiers : SampleMolecularIdentifier[] = [];

                profilesWithoutMutationProfile.forEach((profile:MolecularProfile)=>{
                    // for each profile, find samples which share studyId with profile and add identifier
                    this.samples.result.forEach((sample:Sample)=>{
                        if (sample.studyId === profile.studyId) {
                            identifiers.push({ molecularProfileId:profile.molecularProfileId, sampleId:sample.sampleId })
                        }
                    });
                });

                return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST({
                    projection:'DETAILED',
                    molecularDataMultipleStudyFilter:({
                        entrezGeneIds: _.map(this.genes.result,(gene:Gene)=>gene.entrezGeneId),
                        sampleMolecularIdentifiers:identifiers
                    } as MolecularDataMultipleStudyFilter)
                });

            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly coexpressionTabMolecularProfiles = remoteData<MolecularProfile[]>({
        await:()=>[this.molecularProfilesWithData],
        invoke:()=>Promise.resolve(filterAndSortProfiles(this.molecularProfilesWithData.result!))
    });

    readonly isThereDataForCoExpressionTab = remoteData<boolean>({
        await:()=>[this.molecularProfilesInStudies, this.genes, this.samples],
        invoke:()=>{
            const coExpressionProfiles = filterAndSortProfiles(this.molecularProfilesInStudies.result!);
            const studyToProfiles = _.groupBy(coExpressionProfiles, "studyId");
            // we know these are all mrna and protein profiles
            const sampleMolecularIdentifiers = _.flatten(
                this.samples.result!.map(
                    s=>{
                        const profiles = studyToProfiles[s.studyId];
                        if (profiles) {
                            return profiles.map(p=>({ molecularProfileId: p.molecularProfileId, sampleId: s.sampleId }));
                        } else {
                            return [];
                        }
                    }
                )
            );
            const entrezGeneIds = this.genes.result!.map(g=>g.entrezGeneId);
            if (sampleMolecularIdentifiers.length > 0 &&
                entrezGeneIds.length > 0) {
                return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo({
                    molecularDataMultipleStudyFilter:{
                        entrezGeneIds,
                        sampleMolecularIdentifiers
                    } as MolecularDataMultipleStudyFilter,
                    projection:"META"
                }).then(function(response: request.Response) {
                    const count = parseInt(response.header["total-count"], 10);
                    return count > 0;
                });
            } else {
                return Promise.resolve(false);
            }
        }
    });

    readonly molecularProfilesWithData = remoteData<MolecularProfile[]>({
        await:()=>[
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
            this.genes,
            this.genesets
        ],
        invoke:async()=>{
            const ret:MolecularProfile[] = [];
            const promises = [];
            const studyToDataQueryFilter = this.studyToDataQueryFilter.result!;
            for (const profile of this.molecularProfilesInStudies.result!) {
                const dataQueryFilter = studyToDataQueryFilter[profile.studyId];

                // there could be no samples if a study doesn't have a sample list matching a specified category (e.g. cna only)
                if (!dataQueryFilter || (!dataQueryFilter.sampleIds && !dataQueryFilter.sampleListId)) {
                    continue;
                }

                const molecularProfileId = profile.molecularProfileId;
                const projection = "META";
                const dataFilter = {
                    entrezGeneIds: this.genes.result!.map(g=>g.entrezGeneId),
                    ...dataQueryFilter
                } as MolecularDataFilter & MutationFilter;

                if (profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED) {
                    // handle mutation profile
                    promises.push(client.fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo({
                        molecularProfileId,
                        mutationFilter: dataFilter,
                        projection
                    }).then(function(response: request.Response) {
                        const count = parseInt(response.header["sample-count"], 10);
                        if (count > 0) {
                            // theres data for at least one of the query genes
                            ret.push(profile);
                        }
                    }));
                } else if (profile.molecularAlterationType === AlterationTypeConstants.GENESET_SCORE) {
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
                    promises.push(client.fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo({
                        molecularProfileId,
                        molecularDataFilter: dataFilter,
                        projection
                    }).then(function(response: request.Response) {
                        const count = parseInt(response.header["total-count"], 10);
                        if (count > 0) {
                            // theres data for at least one of the query genes
                            ret.push(profile);
                        }
                    }));
                }
            }
            await Promise.all(promises);
            return ret;
        }
    });

    readonly unfilteredAlterations = remoteData<(Mutation|NumericGeneMolecularData)[]>({
        await: ()=>[
            this.mutations,
            this.molecularData
        ],
        invoke: ()=>{
            let result:(Mutation|NumericGeneMolecularData)[] = [];
            result = result.concat(this.mutations.result!);
            result = result.concat(this.molecularData.result!);
            return Promise.resolve(result);
        }
    });

    readonly unfilteredExtendedAlterations = remoteData<ExtendedAlteration[]>({
        await: ()=>[
            this.unfilteredAlterations,
            this.entrezGeneIdToGene,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery
        ],
        invoke: () => {
            const acc = new accessors(this.selectedMolecularProfiles.result!);
            const alterations: ExtendedAlteration[] = [];
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;

            this.unfilteredAlterations.result!.forEach(alteration => {
                const extendedAlteration: Partial<ExtendedAlteration> = {
                    hugoGeneSymbol: entrezGeneIdToGene[alteration.entrezGeneId].hugoGeneSymbol,
                    molecularProfileAlterationType: acc.molecularAlterationType(alteration.molecularProfileId),
                    ...Object.assign({}, alteration)
                };

                alterations.push(extendedAlteration as ExtendedAlteration);
            });

            return Promise.resolve(alterations);
        }
    });

    readonly filteredAlterations = remoteData<ExtendedAlteration[]>({
        await:()=>[
            this.unfilteredAlterations,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery
        ],
        invoke:()=>{
            if (this.rvQuery.oqlQuery.trim() != "") {
                return Promise.resolve(
                        filterCBioPortalWebServiceData(this.rvQuery.oqlQuery, this.unfilteredAlterations.result!, (new accessors(this.selectedMolecularProfiles.result!)), this.defaultOQLQuery.result!)
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly filteredAlterationsByOQLLine = remoteData<OQLLineFilterOutput<ExtendedAlteration>[]>({
        await: ()=>[
            this.unfilteredAlterations,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery
        ],
        invoke: ()=>{
            return Promise.resolve(filterCBioPortalWebServiceDataByOQLLine(this.rvQuery.oqlQuery, this.unfilteredAlterations.result!,
                (new accessors(this.selectedMolecularProfiles.result!)), this.defaultOQLQuery.result!));
        }
    });

    readonly caseAggregatedData = remoteData<CaseAggregatedData<ExtendedAlteration>>({
        await: ()=>[
            this.filteredAlterations,
            this.samples,
            this.patients
        ],
        invoke: ()=>{
            return Promise.resolve({
                samples:
                    groupBy(this.filteredAlterations.result!, alteration=>alteration.uniqueSampleKey, this.samples.result!.map(sample=>sample.uniqueSampleKey)),
                patients:
                    groupBy(this.filteredAlterations.result!, alteration=>alteration.uniquePatientKey, this.patients.result!.map(sample=>sample.uniquePatientKey))
            });
        }
    });

    readonly unfilteredCaseAggregatedData = remoteData<CaseAggregatedData<ExtendedAlteration>>({
        await: ()=>[
            this.unfilteredExtendedAlterations,
            this.samples,
            this.patients
        ],
        invoke: ()=>{
            return Promise.resolve({
                samples:
                    groupBy(this.unfilteredExtendedAlterations.result!, alteration=>alteration.uniqueSampleKey, this.samples.result!.map(sample=>sample.uniqueSampleKey)),
                patients:
                    groupBy(this.unfilteredExtendedAlterations.result!, alteration=>alteration.uniquePatientKey, this.patients.result!.map(sample=>sample.uniquePatientKey))
            });
        }
    });

    readonly putativeDriverFilteredCaseAggregatedDataByUnflattenedOQLLine = remoteData<
        IQueriedMergedTrackCaseData[]
    >({
        await: () => [
            this.putativeDriverAnnotatedMutations,
            this.annotatedMolecularData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients
        ],
        invoke: () => {
            const data = [...(this.putativeDriverAnnotatedMutations.result!), ...(this.annotatedMolecularData.result!)];
            const accessorsInstance = new accessors(this.selectedMolecularProfiles.result!);
            const defaultOQLQuery = this.defaultOQLQuery.result!;
            const samples = this.samples.result!;
            const patients = this.patients.result!;

            if (this.rvQuery.oqlQuery.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>[] = (
                    filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                        this.rvQuery.oqlQuery,
                        data,
                        accessorsInstance,
                        defaultOQLQuery
                    )
                );

                return Promise.resolve(filteredAlterationsByOQLLine.map(
                    (oql) => ({
                        cases: groupDataByCase(oql, samples, patients),
                        oql,
                        list: filterSubQueryData(
                            oql, defaultOQLQuery,
                            data, accessorsInstance,
                            samples, patients
                        )
                    })
                ));
            }
        }
    });

    readonly putativeDriverFilteredCaseAggregatedDataByOQLLine = remoteData<IQueriedCaseData<AnnotatedExtendedAlteration>[]>({
        await:()=>[
            this.putativeDriverAnnotatedMutations,
            this.annotatedMolecularData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients
        ],
        invoke: () => {
            if (this.rvQuery.oqlQuery.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine:OQLLineFilterOutput<AnnotatedExtendedAlteration>[] = filterCBioPortalWebServiceDataByOQLLine(
                    this.rvQuery.oqlQuery,
                    [...(this.putativeDriverAnnotatedMutations.result!), ...(this.annotatedMolecularData.result!)],
                    (new accessors(this.selectedMolecularProfiles.result!)),
                    this.defaultOQLQuery.result!
                );

                return Promise.resolve(filteredAlterationsByOQLLine.map(
                    (oql) => ({
                        cases: groupDataByCase(oql, this.samples.result!, this.patients.result!),
                        oql
                    })
                ));
            }
        }
    });

    readonly studyToMolecularProfiles = remoteData({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>{
            return Promise.resolve(_.groupBy(this.molecularProfilesInStudies.result!, profile=>profile.studyId));
        }
    });

    readonly coverageInformation = remoteData<CoverageInformation>({
        await:()=>[
            this.studyToMolecularProfiles,
            this.genes,
            this.samples,
            this.patients
        ],
        invoke:async()=>{
            //const studyToMolecularProfiles = _.groupBy(this.studyToMolecularProfiles.result!, profile=>profile.studyId);
            const sampleMolecularIdentifiers:SampleMolecularIdentifier[] = [];
            this.samples.result!.forEach(sample=>{
                const profiles = this.studyToMolecularProfiles.result![sample.studyId];
                if (profiles) {
                    const sampleId = sample.sampleId;
                    for (const profile of profiles) {
                        sampleMolecularIdentifiers.push({
                            molecularProfileId: profile.molecularProfileId,
                            sampleId
                        });
                    }
                }
            });
            let genePanelData:GenePanelData[];
            if (sampleMolecularIdentifiers.length && this.genes.result!.length) {
                genePanelData = await client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST({
                    genePanelMultipleStudyFilter:{
                        sampleMolecularIdentifiers
                    }
                });
            } else {
                genePanelData = [];
            }

            const genePanelIds = _.uniq(genePanelData.map(gpData=>gpData.genePanelId).filter(id=>!!id));
            let genePanels:GenePanel[] = [];
            if (genePanelIds.length) {
                genePanels = await client.fetchGenePanelsUsingPOST({
                    genePanelIds,
                    projection:"DETAILED"
                });
            }
            return computeGenePanelInformation(genePanelData, genePanels, this.samples.result!, this.patients.result!, this.genes.result!);
        }
    }, { samples: {}, patients: {} });

    readonly sequencedSampleKeys = remoteData<string[]>({
        await:()=>[
            this.samples,
            this.coverageInformation,
            this.selectedMolecularProfiles
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            const profileIds = this.selectedMolecularProfiles.result!.map(p=>p.molecularProfileId);
            return Promise.resolve(_.chain(this.samples.result!).filter(sample=>{
                return _.some(isSampleProfiledInMultiple(sample.uniqueSampleKey, profileIds, genePanelInformation));
            }).map(s=>s.uniqueSampleKey).value());
        }
    });

    readonly sequencedPatientKeys = remoteData<string[]>({
        await:()=>[
            this.sampleKeyToSample,
            this.sequencedSampleKeys
        ],
        invoke:async()=>{
            const sampleKeyToSample = this.sampleKeyToSample.result!;
            return _.chain(this.sequencedSampleKeys.result!).map(k=>sampleKeyToSample[k].uniquePatientKey).uniq().value();
        }
    });

    readonly sequencedSampleKeysByGene = remoteData<{[hugoGeneSymbol:string]:string[]}>({
        await: ()=>[
            this.samples,
            this.genes,
            this.coverageInformation,
            this.selectedMolecularProfiles
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            const profileIds = this.selectedMolecularProfiles.result!.map(p=>p.molecularProfileId);
            return Promise.resolve(this.genes.result!.reduce((map:{[hugoGeneSymbol:string]:string[]}, next:Gene)=>{
                map[next.hugoGeneSymbol] = this.samples.result!.map(s=>s.uniqueSampleKey).filter(k=>{
                    return _.some(isSampleProfiledInMultiple(k, profileIds, genePanelInformation, next.hugoGeneSymbol));
                });
                return map;
            }, {}));
        }
    });

    readonly sequencedPatientKeysByGene = remoteData<{[hugoGeneSymbol:string]:string[]}>({
        await: ()=>[
            this.sampleKeyToSample,
            this.sequencedSampleKeysByGene
        ],
        invoke:async()=>{
            const sampleKeyToSample = this.sampleKeyToSample.result!;
            return _.mapValues(this.sequencedSampleKeysByGene.result!, sampleKeys=>{
                return _.chain(sampleKeys).map(k=>sampleKeyToSample[k].uniquePatientKey).uniq().value();
            });
        }
    });

    readonly alteredSampleKeys = remoteData({
        await:()=>[
            this.samples,
            this.caseAggregatedData
        ],
        invoke:()=>{
            const caseAggregatedData = this.caseAggregatedData.result!;
            return Promise.resolve(
                this.samples.result!.map(s=>s.uniqueSampleKey).filter(sampleKey=>!!caseAggregatedData.samples[sampleKey].length)
            );
        }
    });

    readonly alteredSamples = remoteData<Sample[]>({
        await: () => [
            this.sampleKeyToSample,
            this.alteredSampleKeys
        ],
        invoke: () => {
            return Promise.resolve(this.alteredSampleKeys.result!.map(a => this.sampleKeyToSample.result![a]));
        }
    }, []);

    readonly alteredPatientKeys = remoteData({
        await:()=>[
            this.patients,
            this.caseAggregatedData
        ],
        invoke:()=>{
            const caseAggregatedData = this.caseAggregatedData.result!;
            return Promise.resolve(
                this.patients.result!.map(s=>s.uniquePatientKey).filter(patientKey=>!!caseAggregatedData.patients[patientKey].length)
            );
        }
    });

    readonly unalteredSampleKeys = remoteData({
        await:()=>[
            this.samples,
            this.caseAggregatedData
        ],
        invoke:()=>{
            const caseAggregatedData = this.caseAggregatedData.result!;
            return Promise.resolve(
                this.samples.result!.map(s=>s.uniqueSampleKey).filter(sampleKey=>!caseAggregatedData.samples[sampleKey].length)
            );
        }
    });

    readonly unalteredSamples = remoteData<Sample[]>({
        await: () => [
            this.sampleKeyToSample,
            this.unalteredSampleKeys
        ],
        invoke: () => {
            const unalteredSamples: Sample[] = [];
            this.unalteredSampleKeys.result!.forEach(a => unalteredSamples.push(this.sampleKeyToSample.result![a]));
            return Promise.resolve(unalteredSamples);
        }
    }, []);

    readonly unalteredPatientKeys = remoteData({
        await:()=>[
            this.patients,
            this.caseAggregatedData
        ],
        invoke:()=>{
            const caseAggregatedData = this.caseAggregatedData.result!;
            return Promise.resolve(
                this.patients.result!.map(s=>s.uniquePatientKey).filter(patientKey=>!caseAggregatedData.patients[patientKey].length)
            );
        }
    });

    readonly filteredAlterationsByGene = remoteData<{[hugoGeneSymbol:string]:ExtendedAlteration[]}>({
        await: () => [
            this.genes,
            this.filteredAlterations
        ],
        invoke: () => {
            // first group them by gene symbol
            const groupedGenesMap = _.groupBy(this.filteredAlterations.result!, alteration=>alteration.gene.hugoGeneSymbol);
            // kind of ugly but this fixes a bug where sort order of genes not respected
            // yes we are relying on add order of js map. in theory not guaranteed, in practice guaranteed
            const ret = this.genes.result!.reduce((memo:{[hugoGeneSymbol:string]:ExtendedAlteration[]}, gene:Gene)=>{
                memo[gene.hugoGeneSymbol] = groupedGenesMap[gene.hugoGeneSymbol];
                return memo;
            },{});

            return Promise.resolve(ret);
        }
    });


    readonly defaultOQLQuery = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profileTypes = _.uniq(_.map(this.selectedMolecularProfiles.result, (profile) => profile.molecularAlterationType));
            return Promise.resolve(buildDefaultOQLProfile(profileTypes, this.rvQuery.zScoreThreshold, this.rvQuery.rppaScoreThreshold));
        }

    });

    readonly samplesByDetailedCancerType = remoteData<{[cancerType:string]:Sample[]}>({
        await: () => [
            this.samples,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(this.clinicalDataForSamples.result,this.samples.result, 'CANCER_TYPE');
            if (_.size(groupedSamples) === 1) {
                groupedSamples = this.groupSamplesByCancerType(this.clinicalDataForSamples.result, this.samples.result, 'CANCER_TYPE_DETAILED');
            }
            return Promise.resolve(groupedSamples);
        }
    });

    readonly samplesExtendedWithClinicalData = remoteData<ExtendedSample[]>({
        await: () => [
            this.samples,
            this.clinicalDataForSamples,
            this.studies
        ],
        invoke: () => {
            return Promise.resolve(extendSamplesWithCancerType(this.samples.result, this.clinicalDataForSamples.result,this.studies.result));
        }
    });

    public groupSamplesByCancerType(clinicalDataForSamples: ClinicalData[], samples: Sample[], cancerTypeLevel:'CANCER_TYPE' | 'CANCER_TYPE_DETAILED') {

        // first generate map of sampleId to it's cancer type
        const sampleKeyToCancerTypeClinicalDataMap = _.reduce(clinicalDataForSamples, (memo, clinicalData: ClinicalData) => {
            if (clinicalData.clinicalAttributeId === cancerTypeLevel) {
                memo[clinicalData.uniqueSampleKey] = clinicalData.value;
            }

            // if we were told CANCER_TYPE and we find CANCER_TYPE_DETAILED, then fall back on it. if we encounter
            // a CANCER_TYPE later, it will override this.
            if (cancerTypeLevel === 'CANCER_TYPE') {
                if (!memo[clinicalData.uniqueSampleKey] && clinicalData.clinicalAttributeId === 'CANCER_TYPE_DETAILED') {
                    memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                }
            }

            return memo;
        }, {} as { [uniqueSampleId:string]:string });

        // now group samples by cancer type
        let samplesGroupedByCancerType = _.reduce(samples, (memo:{[cancerType:string]:Sample[]} , sample: Sample) => {
            // if it appears in map, then we have a cancer type
            if (sample.uniqueSampleKey in sampleKeyToCancerTypeClinicalDataMap) {
                memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]] = memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]] || [];
                memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]].push(sample);
            } else {
                // TODO: we need to fall back to study cancer type
            }
            return memo;
        }, {} as { [cancerType:string]:Sample[] });

        return samplesGroupedByCancerType;
//
    }

    readonly alterationsByGeneBySampleKey = remoteData<{[hugoGeneSymbol:string]:{ [uniquSampleKey:string]:ExtendedAlteration[] }}>({
        await: () => [
            this.filteredAlterationsByGene,
            this.samples
        ],
        invoke: async() => {
            return _.mapValues(this.filteredAlterationsByGene.result, (alterations: ExtendedAlteration[]) => {
                return _.groupBy(alterations, (alteration: ExtendedAlteration) => alteration.uniqueSampleKey);
            });
        }
    });

    //contains all the physical studies for the current selected cohort ids
    //selected cohort ids can be any combination of physical_study_id and virtual_study_id(shared or saved ones)
    public get physicalStudySet():{ [studyId:string]:CancerStudy } {
        return _.keyBy(this.studies.result, (study:CancerStudy)=>study.studyId);
    }


    readonly filteredAlterationsByGeneAsSampleKeyArrays = remoteData({
        await: () => [
            this.filteredAlterationsByGene
        ],
        invoke: async() => {
            return _.mapValues(this.filteredAlterationsByGene.result, (mutations: Mutation[]) => _.map(mutations, mutation=>mutation.uniqueSampleKey));
        }
    });

    readonly filteredAlterationsAsUniquePatientKeyArrays = remoteData({
        await: () => [
            this.filteredAlterations
        ],
        invoke: async() => {
            return _.mapValues(this.filteredAlterations.result, (mutations: Mutation[]) => _.map(mutations, mutation => mutation.uniquePatientKey));
        }
    });

    readonly isSampleAlteredMap = remoteData({
        await: () => [this.filteredAlterationsByGeneAsSampleKeyArrays, this.samples],
        invoke: async() => {
            return _.mapValues(this.filteredAlterationsByGeneAsSampleKeyArrays.result, (sampleKeys: string[]) => {
                return this.samples.result.map((sample: Sample) => {
                    return _.includes(sampleKeys, sample.uniqueSampleKey);
                });
            });
        }
    });

    readonly givenSampleOrder = remoteData<Sample[]>({
        await: ()=>[
            this.samples,
            this.samplesSpecification
        ],
        invoke: async()=>{
            // for now, just assume we won't mix sample lists and samples in the specification
            if (this.samplesSpecification.result!.find(x=>!x.sampleId)) {
                // for now, if theres any sample list id specification, then there is no given sample order
                return [];
            }
            // at this point, we know samplesSpecification is a list of samples
            const studyToSampleToIndex:{[studyId:string]:{[sampleId:string]:number}} =
                _.reduce(this.samplesSpecification.result,
                    (map:{[studyId:string]:{[sampleId:string]:number}}, next:SamplesSpecificationElement, index:number)=>{
                        map[next.studyId] = map[next.studyId] || {};
                        map[next.studyId][next.sampleId!] = index; // we know sampleId defined otherwise we would have returned from function already
                        return map;
                    },
                {});
            return _.sortBy(this.samples.result, sample=>studyToSampleToIndex[sample.studyId][sample.sampleId]);
        }
    });

    readonly studyToSampleIds = remoteData<{ [studyId: string]: { [sampleId: string]: boolean } }>({
        await:()=>[
            this.samplesSpecification
        ],
        invoke: async ()=>{
                const sampleListsToQuery: { studyId: string, sampleListId: string }[] = [];
                const ret: { [studyId: string]: { [sampleId: string]: boolean } } = {};
                for (const sampleSpec of this.samplesSpecification.result!) {
                    if (sampleSpec.sampleId) {
                        // add sample id to study
                        ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
                        ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
                    } else if (sampleSpec.sampleListId) {
                        // mark sample list to query later
                        sampleListsToQuery.push(sampleSpec as { studyId: string, sampleListId: string });
                    }
                }
                // query for sample lists
                if (sampleListsToQuery.length > 0) {
                    const sampleLists: SampleList[] = await client.fetchSampleListsUsingPOST({
                        sampleListIds: sampleListsToQuery.map(spec=>spec.sampleListId),
                        projection: "DETAILED"
                    });
                    // add samples from those sample lists to corresponding study
                    for (const sampleList of sampleLists) {
                        ret[sampleList.studyId] = stringListToSet(sampleList.sampleIds);
                    }
                }
                return ret;
        }

    }, {});

    readonly studyToSampleListId = remoteData<{ [studyId: string]: string }>({
        await:()=>[
            this.samplesSpecification
        ],
        invoke: async ()=>{
            return this.samplesSpecification.result!.reduce((map, next) => {
                if (next.sampleListId) {
                    map[next.studyId] = next.sampleListId;
                }
                return map;
            }, {} as {[studyId: string]: string});
        }
    });


    readonly samplesSpecification = remoteData({
        await: () => [this.virtualStudies],
        invoke: async () => {

            // is this a sample list category query?
            // if YES, we need to derive the sample lists by:
            // 1. looking up all sample lists in selected studies
            // 2. using those with matching category
            if (!this.rvQuery.sampleListCategory) {
                if (this.virtualStudies.result!.length > 0){
                    return populateSampleSpecificationsFromVirtualStudies(this.rvQuery.samplesSpecification, this.virtualStudies.result!);
                } else {
                    return this.rvQuery.samplesSpecification;
                }
            } else {
                // would be nice to have an endpoint that would return multiple sample lists
                // but this will only ever happen one for each study selected (and in queries where a sample list is specified)
                const allSampleLists = await Promise.all(this.rvQuery.samplesSpecification.map((spec) => {
                    return client.getAllSampleListsInStudyUsingGET({
                        studyId: spec.studyId,
                        projection: 'SUMMARY'
                    })
                }));

                const category = SampleListCategoryTypeToFullId[this.rvQuery.sampleListCategory!];
                const specs = allSampleLists.reduce((aggregator: SamplesSpecificationElement[], sampleLists) => {
                    //find the sample list matching the selected category using the map from shortname to full category name :(
                    const matchingList = _.find(sampleLists, (list) => list.category === category);
                    if (matchingList) {
                        aggregator.push({
                            studyId: matchingList.studyId,
                            sampleListId: matchingList.sampleListId,
                            sampleId: undefined
                        } as SamplesSpecificationElement);
                    }
                    return aggregator;
                }, []);

                return specs;
            }
        }
    });

    readonly studyToMutationMolecularProfile = remoteData<{[studyId: string]: MolecularProfile}>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: () => {
            const ret: {[studyId: string]: MolecularProfile} = {};
            for (const profile of this.molecularProfilesInStudies.result) {
                const studyId = profile.studyId;
                if (!ret[studyId] && isMutationProfile(profile)) {
                    ret[studyId] = profile;
                }
            }
            return Promise.resolve(ret);
        }
    }, {});

    readonly virtualStudies = remoteData({
        invoke: async ()=> {
            return ServerConfigHelpers.sessionServiceIsEnabled() ? getVirtualStudies(this.rvQuery.cohortIdsList) : [];
        },
        onError: () => {
            // fail silently when an error occurs with the virtual studies
        }
    });

    readonly studyIds = remoteData({
        await:()=>[
            this.virtualStudies
        ],
        invoke: ()=>{
            let physicalStudies:string[];
            if (this.virtualStudies.result!.length > 0) {
                // we want to replace virtual studies with their underlying physical studies
                physicalStudies = substitutePhysicalStudiesForVirtualStudies(this.rvQuery.cohortIdsList, this.virtualStudies.result!);
            } else {
                physicalStudies = this.rvQuery.cohortIdsList.slice();
            }
            return Promise.resolve(physicalStudies);
        }
    });

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    // TODO: refactor b/c we already have sample lists summary so
    readonly sampleLists = remoteData<SampleList[]>({
        await:()=>[
          this.studyToSampleListId
        ],
        invoke:()=>{
            const sampleListIds = _.values(this.studyToSampleListId.result!);
            if (sampleListIds.length > 0) {
                return client.fetchSampleListsUsingPOST({sampleListIds});
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly mutations = remoteData<Mutation[]>({
        await:()=>[
            this.genes,
            this.selectedMolecularProfiles,
            this.samples,
            this.studyIdToStudy
        ],
        invoke: async ()=>{

            const mutationProfiles = _.filter(this.selectedMolecularProfiles.result,(profile:MolecularProfile)=>profile.molecularAlterationType==='MUTATION_EXTENDED');

            if (mutationProfiles.length === 0) {
                return [];
            }

            const studyIdToProfileMap:{ [studyId:string] : MolecularProfile } = _.keyBy(mutationProfiles,(profile:MolecularProfile)=>profile.studyId);

            const filters = this.samples.result.reduce((memo, sample:Sample)=>{
                if (sample.studyId in studyIdToProfileMap) {
                    memo.push({
                        molecularProfileId: studyIdToProfileMap[sample.studyId].molecularProfileId,
                        sampleId: sample.sampleId
                    });
                }
                return memo;
            }, [] as any[]);

            const data = ({
                entrezGeneIds: _.map(this.genes.result,(gene:Gene)=>gene.entrezGeneId),
                sampleMolecularIdentifiers: filters
            } as MutationMultipleStudyFilter);

            return await client.fetchMutationsInMultipleMolecularProfilesUsingPOST({
                projection:'DETAILED',
                mutationMultipleStudyFilter:data
            });

        }

    });

    @observable public mutationsTabShouldUseOql = true;

    @computed get mutationsByGene():{ [hugeGeneSymbol:string]:Mutation[]}{
        let mutations:Mutation[];
        if (this.mutationsTabShouldUseOql && this.queryContainsMutationOql) {
            // use oql filtering in mutations tab only if query contains mutation oql
            mutations = (this.filteredAlterations.result || []).filter(a=>isMutation(a));
        } else {
            mutations = this.mutations.result || [];
        }
        return _.groupBy(mutations,(mutation:Mutation)=>mutation.gene.hugoGeneSymbol);
    }

    readonly mutationMapperStores = remoteData<{ [hugoGeneSymbol: string]: ResultsViewMutationMapperStore }>({
        await: () => [this.genes, this.oncoKbAnnotatedGenes, this.uniqueSampleKeyToTumorType, this.mutations],
        invoke: () => {
            if (this.genes.result) {
                // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                return Promise.resolve(_.reduce(this.genes.result, (map: { [hugoGeneSymbol: string]: ResultsViewMutationMapperStore }, gene: Gene) => {
                    map[gene.hugoGeneSymbol] = new ResultsViewMutationMapperStore(AppConfig.serverConfig,
                        {},
                        gene,
                        this.samples,
                        this.oncoKbAnnotatedGenes.result || {},
                        () => (this.mutationsByGene[gene.hugoGeneSymbol] || []),
                        () => (this.mutationCountCache),
                        () => (this.genomeNexusCache),
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
                }, {}));
            } else {
                return Promise.resolve({});
            }
        }
    }, {});

    public getMutationMapperStore(hugoGeneSymbol: string): ResultsViewMutationMapperStore | undefined {
        return this.mutationMapperStores.result[hugoGeneSymbol];
    }

    readonly oncoKbAnnotatedGenes = remoteData({
        invoke:()=>fetchOncoKbAnnotatedGenesSuppressErrors()
    }, {});

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>({
        await: () => [
            this.studies,
            this.samples
        ],
        invoke: () => this.getClinicalData("SAMPLE", this.studies.result!, this.samples.result, ["CANCER_TYPE", "CANCER_TYPE_DETAILED"])
    }, []);

    private getClinicalData(clinicalDataType: "SAMPLE" | "PATIENT", studies:any[], entities: any[], attributeIds: string[]):
    Promise<Array<ClinicalData>> {

        // single study query endpoint is optimal so we should use it
        // when there's only one study
        if (studies.length === 1) {
            const study = this.studies.result[0];
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: attributeIds,
                ids: _.map(entities, clinicalDataType === "SAMPLE" ? 'sampleId' : 'patientId')
            };
            return client.fetchAllClinicalDataInStudyUsingPOST({
                studyId:study.studyId,
                clinicalDataSingleStudyFilter: filter,
                clinicalDataType: clinicalDataType
            });
        } else {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: attributeIds,
                identifiers: entities.map((s: any) => clinicalDataType === "SAMPLE" ?
                    ({entityId: s.sampleId, studyId: s.studyId}) : ({entityId: s.patientId, studyId: s.studyId}))
            };
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: clinicalDataType,
                clinicalDataMultiStudyFilter: filter
            });
        }
    }

    private getClinicalDataCount(clinicalDataType: "SAMPLE" | "PATIENT", studies:any[], entities: any[], attributeIds: string[]):
    Promise<number> {

        const projection = "META";
        // single study query endpoint is optimal so we should use it
        // when there's only one study
        if (studies.length === 1) {
            const study = this.studies.result[0];
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: attributeIds,
                ids: _.map(entities, clinicalDataType === "SAMPLE" ? 'sampleId' : 'patientId')
            };
            return client.fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo({
                studyId:study.studyId,
                clinicalDataSingleStudyFilter: filter,
                clinicalDataType: clinicalDataType,
                projection
            }).then(function(response: request.Response) {
                return parseInt(response.header["total-count"], 10);
            });
        } else {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: attributeIds,
                identifiers: entities.map((s: any) => clinicalDataType === "SAMPLE" ?
                    ({entityId: s.sampleId, studyId: s.studyId}) : ({entityId: s.patientId, studyId: s.studyId}))
            };
            return client.fetchClinicalDataUsingPOSTWithHttpInfo({
                clinicalDataType: clinicalDataType,
                clinicalDataMultiStudyFilter: filter,
                projection
            }).then(function(response: request.Response) {
                return parseInt(response.header["total-count"], 10);
            });
        }
    }

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await:()=>[
            this.studies,
            this.patients
        ],
        invoke:async()=>{
            const count =
                await this.getClinicalDataCount("PATIENT", this.studies.result!, this.patients.result, ["OS_STATUS", "OS_MONTHS", "DFS_STATUS", "DFS_MONTHS"]);
            return count > 0;
        }
    });

    readonly survivalClinicalData = remoteData<ClinicalData[]>({
        await: () => [
            this.studies,
            this.patients
        ],
        invoke: () => this.getClinicalData("PATIENT", this.studies.result!, this.patients.result, ["OS_STATUS", "OS_MONTHS", "DFS_STATUS", "DFS_MONTHS"])
    }, []);

    readonly survivalClinicalDataGroupByUniquePatientKey = remoteData<{[key: string]: ClinicalData[]}>({
        await: () => [
            this.survivalClinicalData,
        ],
        invoke: async() => {
            return _.groupBy(this.survivalClinicalData.result, 'uniquePatientKey');
        }
    });

    readonly overallAlteredPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.alteredPatientKeys,
            this.patients
        ],
        invoke: async() => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.alteredPatientKeys.result!, 'OS_STATUS', 'OS_MONTHS', s => s === 'DECEASED');
        }
    }, []);

    readonly overallUnalteredPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.unalteredPatientKeys,
            this.patients
        ],
        invoke: async() => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.unalteredPatientKeys.result!, 'OS_STATUS', 'OS_MONTHS', s => s === 'DECEASED');
        }
    }, []);

    readonly diseaseFreeAlteredPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.alteredPatientKeys,
            this.patients
        ],
        invoke: async() => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.alteredPatientKeys.result!, 'DFS_STATUS', 'DFS_MONTHS', s => s === 'Recurred/Progressed' || s === 'Recurred');
        }
    }, []);

    readonly diseaseFreeUnalteredPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.unalteredPatientKeys,
            this.patients
        ],
        invoke: async() => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.unalteredPatientKeys.result!, 'DFS_STATUS', 'DFS_MONTHS', s => s === 'Recurred/Progressed' || s === 'Recurred');
        }
    }, []);

    readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>({
        await:()=>[this.studyIds],
        invoke: async() => await fetchGermlineConsentedSamples(this.studyIds, AppConfig.serverConfig.studiesWithGermlineConsentedSamples),
        onError: () => {
            // fail silently
        }
    }, []);

    readonly samples = remoteData({
        await: () => [
            this.studyToDataQueryFilter
        ],
        invoke: async() => {

            let sampleIdentifiers: SampleIdentifier[] = [];
            let sampleListIds: string[] = [];
            _.each(this.studyToDataQueryFilter.result, (dataQueryFilter: IDataQueryFilter, studyId: string) => {
                if (dataQueryFilter.sampleIds) {
                    sampleIdentifiers = sampleIdentifiers.concat(dataQueryFilter.sampleIds.map(sampleId => ({
                        sampleId,
                        studyId
                    })));
                } else if (dataQueryFilter.sampleListId) {
                    sampleListIds.push(dataQueryFilter.sampleListId);
                }
            });
            let promises:Promise<Sample[]>[] = [];
            if (sampleIdentifiers.length) {
                promises.push(client.fetchSamplesUsingPOST({
                    sampleFilter: {
                        sampleIdentifiers
                    } as SampleFilter,
                    projection: "DETAILED"
                }));
            }
            if (sampleListIds.length) {
                promises.push(client.fetchSamplesUsingPOST({
                    sampleFilter: {
                        sampleListIds
                    } as SampleFilter,
                    projection:"DETAILED"
                }));
            }
            return _.flatten(await Promise.all(promises));
        }
    }, []);

    readonly sampleKeyToSample = remoteData({
        await: ()=>[
            this.samples
        ],
        invoke: ()=>{
            return Promise.resolve(_.keyBy(this.samples.result!, sample=>sample.uniqueSampleKey));
        }
    });

    readonly patientKeyToPatient = remoteData({
        await: ()=>[
            this.patients
        ],
        invoke: ()=>{
            return Promise.resolve(_.keyBy(this.patients.result!, patient=>patient.uniquePatientKey));
        }
    });

    readonly patientKeyToSamples = remoteData({
        await:()=>[
            this.samples
        ],
        invoke: ()=>{
            return Promise.resolve(_.groupBy(this.samples.result!, sample=>sample.uniquePatientKey));
        }
    });

    readonly patients = remoteData({
        await: ()=>[
            this.samples
        ],
        invoke: ()=>{
            let patientKeyToPatientIdentifier:{[uniquePatientKey:string]:PatientIdentifier} = {};
            for (const sample of this.samples.result) {
                patientKeyToPatientIdentifier[sample.uniquePatientKey] = {
                    patientId: sample.patientId,
                    studyId: sample.studyId
                };
            }
            const patientFilter = {
                uniquePatientKeys: _.uniq(this.samples.result.map((sample:Sample)=>sample.uniquePatientKey))
            } as PatientFilter;

            return client.fetchPatientsUsingPOST({
                patientFilter
            });
        },
        default: []
    });

    readonly samplesWithoutCancerTypeClinicalData = remoteData<Sample[]>({
        await: () => [
            this.samples,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            const sampleHasData: { [sampleUid: string]: boolean } = {};
            for (const data of this.clinicalDataForSamples.result) {
                sampleHasData[toSampleUuid(data.studyId, data.sampleId)] = true;
            }
            return Promise.resolve(this.samples.result.filter(sample => {
                return !sampleHasData[toSampleUuid(sample.studyId, sample.sampleId)];
            }));
        }
    }, []);

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: async () => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
    }, []);

    readonly studies = remoteData({
        await: ()=>[this.studyIds],
        invoke: async () => {
            return client.fetchStudiesUsingPOST({
                studyIds:this.studyIds.result!,
                projection:'DETAILED'
            })
        }
    }, []);

    //this is only required to show study name and description on the results page
    //CancerStudy objects for all the cohortIds
    readonly queriedStudies = remoteData({
        await: ()=>[this.studyIdToStudy],
		invoke: async ()=>{
            if(!_.isEmpty(this.rvQuery.cohortIdsList)){
                return fetchQueriedStudies(this.studyIdToStudy.result, this.rvQuery.cohortIdsList);
            } else {
                return []
            }
		},
		default: [],
    });

    readonly studyIdToStudy = remoteData({
        await: ()=>[this.studies],
        invoke:()=>Promise.resolve(_.keyBy(this.studies.result, x=>x.studyId))
    }, {});

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>({
        await:()=>[this.studyIds],
        invoke: async () => {
            return client.fetchMolecularProfilesUsingPOST({
                molecularProfileFilter: { studyIds:this.studyIds.result! } as MolecularProfileFilter
            })
        }
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{ [molecularProfileId: string]: MolecularProfile }>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () => {
            return Promise.resolve(this.molecularProfilesInStudies.result.reduce((map: { [molecularProfileId: string]: MolecularProfile }, next: MolecularProfile) => {
                map[next.molecularProfileId] = next;
                return map;
            }, {}));
        }
    }, {});

    readonly studyToMolecularProfileDiscrete = remoteData<{ [studyId: string]: MolecularProfile }>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: async () => {
            const ret: { [studyId: string]: MolecularProfile } = {};
            for (const molecularProfile of this.molecularProfilesInStudies.result) {
                if (molecularProfile.datatype === "DISCRETE") {
                    ret[molecularProfile.studyId] = molecularProfile;
                }
            }
            return ret;
        }
    }, {});

    readonly heatmapMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesInStudies,
            this.selectedMolecularProfiles,
            this.genesetMolecularProfile
        ],
        invoke: () => {
            const MRNA_EXPRESSION = AlterationTypeConstants.MRNA_EXPRESSION;
            const PROTEIN_LEVEL = AlterationTypeConstants.PROTEIN_LEVEL;
            const METHYLATION = AlterationTypeConstants.METHYLATION;
            const selectedMolecularProfileIds = stringListToSet(
                this.selectedMolecularProfiles.result!.map((profile)=>profile.molecularProfileId)
            );

            const expressionHeatmaps = _.sortBy(
                _.filter(this.molecularProfilesInStudies.result!, profile=>{
                    return ((profile.molecularAlterationType === MRNA_EXPRESSION ||
                        profile.molecularAlterationType === PROTEIN_LEVEL) && profile.showProfileInAnalysisTab) ||
                        profile.molecularAlterationType === METHYLATION;
                    }
                ),
                profile=>{
                    // Sort order: selected and [mrna, protein, methylation], unselected and [mrna, protein, meth]
                    if (profile.molecularProfileId in selectedMolecularProfileIds) {
                        switch (profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 0;
                            case PROTEIN_LEVEL:
                                return 1;
                            case METHYLATION:
                                return 2;
                        }
                    } else {
                        switch(profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 3;
                            case PROTEIN_LEVEL:
                                return 4;
                            case METHYLATION:
                                return 5;
                        }
                    }
                }
            );
            const genesetMolecularProfile = this.genesetMolecularProfile.result!;
            const genesetHeatmaps = (
                genesetMolecularProfile.isApplicable
                ? [genesetMolecularProfile.value]
                : []
            );
            return Promise.resolve(expressionHeatmaps.concat(genesetHeatmaps));
        }
    });

    readonly genesetMolecularProfile = remoteData<Optional<MolecularProfile>>({
        await: () => [
            this.selectedMolecularProfiles
        ],
        invoke: () => {
            const applicableProfiles = _.filter(
                this.selectedMolecularProfiles.result!,
                profile => (
                    profile.molecularAlterationType === AlterationTypeConstants.GENESET_SCORE
                    && profile.showProfileInAnalysisTab
                )
            );
            if (applicableProfiles.length > 1) {
                return Promise.reject(new Error("Queried more than one gene set score profile"));
            }
            const genesetProfile = applicableProfiles.pop();
            const value: Optional<MolecularProfile> = (
                genesetProfile
                ? {isApplicable: true, value: genesetProfile}
                : {isApplicable: false}
            );
            return Promise.resolve(value);
        }
    });

    readonly studyToDataQueryFilter = remoteData<{ [studyId: string]: IDataQueryFilter }>({
        await: () => [this.studyToSampleIds, this.studyIds, this.studyToSampleListId],
        invoke: () => {
            const studies = this.studyIds.result!;
            const ret: { [studyId: string]: IDataQueryFilter } = {};
            for (const studyId of studies) {
                ret[studyId] = generateDataQueryFilter(this.studyToSampleListId.result![studyId] || null, Object.keys(this.studyToSampleIds.result[studyId] || {}))
            }
            return Promise.resolve(ret);
        }
    }, {});


    public getSessionIdInUrl(){
        const parsedQString = url.parse((window as any).location.href, true);
        return parsedQString.query.session_id;
    }

    readonly bookmarkLinks = remoteData<BookmarkLinks>({

        await:()=>[
            this.studies
        ],

        invoke: async () => {

            const win = window as any;

            let longUrl = win.location.href;

            let sessionResp;

            // if we have a session service, lets get the url for the session
            if (ServerConfigHelpers.sessionServiceIsEnabled()) {
                longUrl = await new Promise((resolve, reject)=>{
                    win.getSessionServiceBookmark(window.location.href, $("#bookmark-result-tab").data('session'), function(url:string){
;                        resolve(url);
                    });
                });
            }

            const queryData = {
                version:3.0,
                longUrl:longUrl,
                session_id:longUrl.match(/session_id=(.*)$/)[1],
                history:0,
                format:"json"
            };

            const bitlyResponse = await request.get(getBitlyServiceUrl())
                .query(queryData) as any;

            const parsedBitlyResponse = JSON.parse(bitlyResponse.body) as any;
            return { longUrl , shortenedUrl:(_.values(parsedBitlyResponse.results)[0] as any).shortUrl  }
        }

    });

    readonly molecularProfileIdToDataQueryFilter = remoteData<{[molecularProfileId:string]:IDataQueryFilter}>({
        await: ()=>[
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter
        ],
        invoke: ()=>{
            const ret:{[molecularProfileId:string]:IDataQueryFilter} = {};
            for (const molecularProfile of this.molecularProfilesInStudies.result!) {
                ret[molecularProfile.molecularProfileId] = this.studyToDataQueryFilter.result![molecularProfile.studyId];
            }
            return Promise.resolve(ret);
        },
        default: {}
    });

    readonly genes = remoteData<Gene[]>({
        invoke: async () => fetchGenes(this.hugoGeneSymbols),
        onResult:(genes:Gene[])=>{
            this.geneCache.addData(genes);
        }
    });

    readonly genesets = remoteData<Geneset[]>({
        invoke: () => {
            if (this.rvQuery.genesetIds && this.rvQuery.genesetIds.length > 0) {
                return internalClient.fetchGenesetsUsingPOST({genesetIds: this.rvQuery.genesetIds.slice()});
            } else {
                return Promise.resolve([]);
            }
        },
        onResult:(genesets:Geneset[])=>{
            this.genesetCache.addData(genesets);
        }
    });

    readonly entrezGeneIdToGene = remoteData<{[entrezGeneId:number]:Gene}>({
        await: ()=>[this.genes],
        invoke: ()=>Promise.resolve(_.keyBy(this.genes.result!, gene=>gene.entrezGeneId))
    });

    readonly genesetLinkMap = remoteData<{[genesetId: string]: string}>({
        invoke: async () => {
            if (this.rvQuery.genesetIds && this.rvQuery.genesetIds.length) {
                const genesets = await internalClient.fetchGenesetsUsingPOST(
                    {genesetIds: this.rvQuery.genesetIds.slice()}
                );
                const linkMap: {[genesetId: string]: string} = {};
                genesets.forEach(({genesetId, refLink}) => {
                    linkMap[genesetId] = refLink;
                });
                return linkMap;
            } else {
                return {};
            }
        }
    });

    readonly customDriverAnnotationReport = remoteData<{ hasBinary:boolean, tiers:string[] }>({
        await:()=>[
            this.mutations
        ],
        invoke:()=>{
            return Promise.resolve(computeCustomDriverAnnotationReport(this.mutations.result!));
        },
        onResult:result=>{
            initializeCustomDriverAnnotationSettings(
                result!,
                this.mutationAnnotationSettings,
                !(_.isEmpty(AppConfig.serverConfig.oncoprint_custom_driver_annotation_tiers_menu_label)),
                AppConfig.serverConfig.oncoprint_oncokb_hotspots_default === "custom"
            );
        }
    });

    readonly putativeDriverAnnotatedMutations = remoteData<AnnotatedMutation[]>({
        await:()=>[
            this.mutations,
            this.getPutativeDriverInfo,
            this.entrezGeneIdToGene
        ],
        invoke:()=>{
            return Promise.resolve(computePutativeDriverAnnotatedMutations(this.mutations.result!, this.getPutativeDriverInfo.result!, this.entrezGeneIdToGene.result!, !!this.mutationAnnotationSettings.ignoreUnknown));
        }
    });

    public putativeDriverAnnotatedMutationCache =
        new MobxPromiseCache<{entrezGeneId:number}, AnnotatedMutation[]>(
            q=>({
                await: ()=>[
                    this.mutationCache.get(q),
                    this.getPutativeDriverInfo,
                    this.entrezGeneIdToGene
                ],
                invoke: ()=>{
                    return Promise.resolve(computePutativeDriverAnnotatedMutations(this.mutationCache.get(q).result!, this.getPutativeDriverInfo.result!, this.entrezGeneIdToGene.result!, !!this.mutationAnnotationSettings.ignoreUnknown));
                }
            })
        );

    readonly annotatedMolecularData = remoteData<AnnotatedNumericGeneMolecularData[]>({
        await: ()=>[
            this.molecularData,
            this.entrezGeneIdToGene,
            this.getOncoKbCnaAnnotationForOncoprint,
            this.molecularProfileIdToMolecularProfile
        ],
        invoke:()=>{
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
            let getOncoKbAnnotation:(datum:NumericGeneMolecularData)=>IndicatorQueryResp|undefined;
            if (this.getOncoKbCnaAnnotationForOncoprint.result! instanceof Error) {
                getOncoKbAnnotation = ()=>undefined;
            } else {
                getOncoKbAnnotation = this.getOncoKbCnaAnnotationForOncoprint.result! as typeof getOncoKbAnnotation;
            }
            const profileIdToProfile = this.molecularProfileIdToMolecularProfile.result!;
            return Promise.resolve(this.molecularData.result!.map(d=>{
                    return annotateMolecularDatum(
                        d,
                        getOncoKbAnnotation,
                        profileIdToProfile,
                        entrezGeneIdToGene
                    );
                })
            );
        }
    });

    public annotatedCnaCache =
        new MobxPromiseCache<{entrezGeneId:number}, AnnotatedNumericGeneMolecularData[]>(
            q=>({
                await: ()=>this.numericGeneMolecularDataCache.await(
                    [this.studyToMolecularProfileDiscrete, this.entrezGeneIdToGene, this.getOncoKbCnaAnnotationForOncoprint, this.molecularProfileIdToMolecularProfile],
                    (studyToMolecularProfileDiscrete)=>{
                        return _.values(studyToMolecularProfileDiscrete).map(p=>({entrezGeneId: q.entrezGeneId, molecularProfileId: p.molecularProfileId}));
                    }),
                invoke:()=>{
                    const results = _.flatten(this.numericGeneMolecularDataCache.getAll(
                        _.values(this.studyToMolecularProfileDiscrete.result!).map(p=>({entrezGeneId: q.entrezGeneId, molecularProfileId: p.molecularProfileId}))
                    ).map(p=>p.result!));
                    const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
                    let getOncoKbAnnotation:(datum:NumericGeneMolecularData)=>IndicatorQueryResp|undefined;
                    if (this.getOncoKbCnaAnnotationForOncoprint.result! instanceof Error) {
                        getOncoKbAnnotation = ()=>undefined;
                    } else {
                        getOncoKbAnnotation = this.getOncoKbCnaAnnotationForOncoprint.result! as typeof getOncoKbAnnotation;
                    }
                    const profileIdToProfile = this.molecularProfileIdToMolecularProfile.result!;
                    return Promise.resolve(results.map(d=>{
                            return annotateMolecularDatum(
                                d,
                                getOncoKbAnnotation,
                                profileIdToProfile,
                                entrezGeneIdToGene
                            );
                        })
                    );
                }
            })
        );

    readonly getPutativeDriverInfo = remoteData({
        await:()=>{
            const toAwait = [];
            if (this.mutationAnnotationSettings.oncoKb) {
                toAwait.push(this.getOncoKbMutationAnnotationForOncoprint);
            }
            if (this.mutationAnnotationSettings.hotspots) {
                toAwait.push(this.isHotspotForOncoprint);
            }
            if (this.mutationAnnotationSettings.cbioportalCount) {
                toAwait.push(this.getCBioportalCount);
            }
            if (this.mutationAnnotationSettings.cosmicCount) {
                toAwait.push(this.getCosmicCount);
            }
            return toAwait;
        },
        invoke:()=>{
            return Promise.resolve((mutation:Mutation):{oncoKb:string, hotspots:boolean, cbioportalCount:boolean, cosmicCount:boolean, customDriverBinary:boolean, customDriverTier?:string}=>{
                const getOncoKbMutationAnnotationForOncoprint = this.getOncoKbMutationAnnotationForOncoprint.result!;
                const oncoKbDatum:IndicatorQueryResp | undefined | null | false = this.mutationAnnotationSettings.oncoKb &&
                    getOncoKbMutationAnnotationForOncoprint &&
                    (!(getOncoKbMutationAnnotationForOncoprint instanceof Error)) &&
                    getOncoKbMutationAnnotationForOncoprint(mutation);

                let oncoKb:string = "";
                if (oncoKbDatum) {
                    oncoKb = getOncoKbOncogenic(oncoKbDatum);
                }

                const hotspots:boolean =
                    (this.mutationAnnotationSettings.hotspots &&
                    (!(this.isHotspotForOncoprint.result instanceof Error)) &&
                    this.isHotspotForOncoprint.result!(mutation));

                const cbioportalCount:boolean =
                    (this.mutationAnnotationSettings.cbioportalCount &&
                    this.getCBioportalCount.isComplete &&
                    this.getCBioportalCount.result!(mutation) >=
                    this.mutationAnnotationSettings.cbioportalCountThreshold);

                const cosmicCount:boolean =
                    (this.mutationAnnotationSettings.cosmicCount &&
                    this.getCosmicCount.isComplete &&
                    this.getCosmicCount.result!(mutation) >= this.mutationAnnotationSettings.cosmicCountThreshold);

                const customDriverBinary:boolean =
                    (this.mutationAnnotationSettings.driverFilter &&
                        mutation.driverFilter === "Putative_Driver") || false;

                const customDriverTier:string|undefined =
                    (mutation.driverTiersFilter && this.mutationAnnotationSettings.driverTiers.get(mutation.driverTiersFilter)) ?
                    mutation.driverTiersFilter : undefined;

                return {
                    oncoKb,
                    hotspots,
                    cbioportalCount,
                    cosmicCount,
                    customDriverBinary,
                    customDriverTier
                }
            });
        }
    });

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<{[genomicLocation: string]: VariantAnnotation} | undefined>({
        await:()=>[
            this.mutations
        ],
        invoke: async () => this.mutations.result? await fetchVariantAnnotationsIndexedByGenomicLocation(this.mutations.result, ["annotation_summary", "hotspots"], AppConfig.serverConfig.isoformOverrideSource) : undefined,
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, undefined);

    // Hotspots
    readonly hotspotData = remoteData({
        await:()=>[
            this.mutations
        ],
        invoke:()=>{
            return fetchHotspotsData(this.mutations);
        }
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex|undefined>({
        await:()=>[
            this.hotspotData
        ],
        invoke: ()=>Promise.resolve(indexHotspotsData(this.hotspotData))
    });

    public readonly isHotspotForOncoprint = remoteData<((m:Mutation)=>boolean) | Error>({
        invoke:()=>{
            // have to do it like this so that an error doesnt cause chain reaction of errors and app crash
            if (this.indexedHotspotData.isComplete) {
                const indexedHotspotData = this.indexedHotspotData.result;
                if (indexedHotspotData) {
                    return Promise.resolve((mutation:Mutation)=>{
                        return isRecurrentHotspot(mutation, indexedHotspotData);
                    });
                } else {
                    return Promise.resolve(((mutation:Mutation)=>false) as (m:Mutation)=>boolean);
                }
            } else if (this.indexedHotspotData.isError) {
                return Promise.resolve(new Error());
            } else {
                // pending: return endless promise to keep isHotspotForOncoprint pending
                return new Promise(()=>{});
            }
        }
    });
    //OncoKb
    readonly uniqueSampleKeyToTumorType = remoteData<{[uniqueSampleKey: string]: string}>({
        await:()=>[
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: ()=>{
            return Promise.resolve(generateUniqueSampleKeyToTumorTypeMap(this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.samplesWithoutCancerTypeClinicalData));
        }
    });

    readonly oncoKbData = remoteData<IOncoKbData|Error>({
        await: () => [
            this.mutations,
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.uniqueSampleKeyToTumorType,
            this.oncoKbAnnotatedGenes
        ],
        invoke: () => {
            if (AppConfig.serverConfig.show_oncokb) {
                return fetchOncoKbData(this.uniqueSampleKeyToTumorType.result!, this.oncoKbAnnotatedGenes.result!, this.mutations);
            } else {
                return Promise.resolve(ONCOKB_DEFAULT);
            }
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData|Error>({
        await: () => [
            this.mutations,
            this.uniqueSampleKeyToTumorType,
            this.oncoKbAnnotatedGenes
        ],
        invoke: async() => {
            if (AppConfig.serverConfig.show_oncokb) {
                let result;
                try {
                    result = await fetchOncoKbData({}, this.oncoKbAnnotatedGenes.result!, this.mutations, 'ONCOGENIC')
                } catch(e) {
                    result = new Error();
                }
                return result;
            } else {
                return ONCOKB_DEFAULT;
            }
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly cnaOncoKbData = remoteData<IOncoKbData>({
        await: ()=> [
            this.uniqueSampleKeyToTumorType,
            this.oncoKbAnnotatedGenes,
            this.molecularData,
            this.molecularProfileIdToMolecularProfile
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
        }
    }, ONCOKB_DEFAULT);

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData|Error>({
        await: ()=> [
            this.uniqueSampleKeyToTumorType,
            this.oncoKbAnnotatedGenes,
            this.molecularData,
            this.molecularProfileIdToMolecularProfile
        ],
        invoke: async() => {
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
                } catch(e) {
                    result = new Error();
                }
                return result;
            } else {
                return ONCOKB_DEFAULT;
            }
        }
    }, ONCOKB_DEFAULT);

    @computed get didOncoKbFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return this.getOncoKbMutationAnnotationForOncoprint.peekStatus === "complete" &&
            (this.getOncoKbMutationAnnotationForOncoprint.result instanceof Error);
    }

    @computed get didHotspotFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return this.isHotspotForOncoprint.peekStatus === "complete" &&
            (this.isHotspotForOncoprint.result instanceof Error);
    }

    readonly getOncoKbMutationAnnotationForOncoprint = remoteData<Error|((mutation:Mutation)=>(IndicatorQueryResp|undefined))>({
        await: ()=>[
            this.oncoKbDataForOncoprint
        ],
        invoke: ()=>{
            const oncoKbDataForOncoprint = this.oncoKbDataForOncoprint.result!;
            if (oncoKbDataForOncoprint instanceof Error) {
                return Promise.resolve(new Error());
            } else {
                return Promise.resolve((mutation:Mutation)=>{
                    const uniqueSampleKeyToTumorType = oncoKbDataForOncoprint.uniqueSampleKeyToTumorType!;
                    const id = generateQueryVariantId(
                        mutation.entrezGeneId,
                        cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType),
                        mutation.proteinChange,
                        mutation.mutationType
                    );
                    return oncoKbDataForOncoprint.indicatorMap![id];
                });
            }
        }
    });

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<Error|((data:NumericGeneMolecularData)=>(IndicatorQueryResp|undefined))>({
        await: ()=>[
            this.cnaOncoKbDataForOncoprint
        ],
        invoke: ()=>{
            const cnaOncoKbDataForOncoprint = this.cnaOncoKbDataForOncoprint.result!;
            if (cnaOncoKbDataForOncoprint instanceof Error) {
                return Promise.resolve(new Error());
            } else {
                return Promise.resolve((data:NumericGeneMolecularData)=>{
                    const uniqueSampleKeyToTumorType = cnaOncoKbDataForOncoprint.uniqueSampleKeyToTumorType!;
                    const id = generateQueryVariantId(
                        data.entrezGeneId,
                        cancerTypeForOncoKb(data.uniqueSampleKey, uniqueSampleKeyToTumorType),
                        getAlterationString(data.value)
                    );
                    return cnaOncoKbDataForOncoprint.indicatorMap![id];
                });
            }
        }
    });

    readonly cbioportalMutationCountData = remoteData<MutationCountByPosition[]>({
        await: ()=>[
            this.mutations
        ],
        invoke: ()=>{

            const mutationPositionIdentifiers = countMutations(this.mutations.result!);

            return client.fetchMutationCountsByPositionUsingPOST({
                mutationPositionIdentifiers: _.values(mutationPositionIdentifiers)
            });
        }
    });

    readonly getCBioportalCount:MobxPromise<(mutation:Mutation)=>number> = remoteData({
        await: ()=>[
            this.cbioportalMutationCountData
        ],
        invoke: ()=>{
            const countsMap = _.groupBy(this.cbioportalMutationCountData.result!, count=>mutationCountByPositionKey(count));
            return Promise.resolve((mutation:Mutation):number=>{
                const key = mutationCountByPositionKey(mutation);
                const counts = countsMap[key];
                if (counts) {
                    return counts.reduce((count, next)=>{
                        return count + next.count;
                    }, 0);
                } else {
                    return -1;
                }
            });
        }
    });
    //COSMIC count
    readonly cosmicCountData = remoteData<CosmicMutation[]>({
        await: ()=>[
            this.mutations
        ],
        invoke: ()=>{
            return internalClient.fetchCosmicCountsUsingPOST({
                keywords: _.uniq(this.mutations.result!.filter((m:Mutation)=>{
                    // keyword is what we use to query COSMIC count with, so we need
                    //  the unique list of mutation keywords to query. If a mutation has
                    //  no keyword, it cannot be queried for.
                    return !!m.keyword;
                }).map((m:Mutation)=>m.keyword))
            });
        }
    });

    readonly getCosmicCount:MobxPromise<(mutation:Mutation)=>number> = remoteData({
        await: ()=>[
            this.cosmicCountData
        ],
        invoke: ()=>{
            const countMap = _.groupBy(this.cosmicCountData.result!, d=>d.keyword);
            return Promise.resolve((mutation:Mutation):number=>{
                const keyword = mutation.keyword;
                const counts = countMap[keyword];
                const targetPosObj = getProteinPositionFromProteinChange(mutation.proteinChange);
                if (counts && targetPosObj) {
                    const targetPos = targetPosObj.start;
                    return counts.reduce((count, next:CosmicMutation)=>{
                        const pos = getProteinPositionFromProteinChange(next.proteinChange);
                        if (pos && (pos.start === targetPos)) {
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
        }
    });

    readonly mutationEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesWithData,
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            return _.filter(this.molecularProfilesWithData.result, (profile: MolecularProfile) =>
                profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED);
        },
    });

    readonly mutationEnrichmentData = remoteData<AlterationEnrichment[]>({
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.mutationEnrichmentProfiles,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async () => {
            // returns an empty array if the selected study doesn't have any mutation profiles
            return this.selectedEnrichmentMutationProfile ? this.sortEnrichmentData(
                await internalClient.fetchMutationEnrichmentsUsingPOST({
                    molecularProfileId: this.selectedEnrichmentMutationProfile.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {alteredIds: this.alteredSamples.result.map(s => s.sampleId),
                        unalteredIds: this.unalteredSamples.result.map(s => s.sampleId),
                        queryGenes: this.getEnrichmentsQueryGenes(this.selectedEnrichmentMutationProfile)}})) : [];
        }
    });

    readonly copyNumberEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesWithData,
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            return _.filter(this.molecularProfilesWithData.result, (profile: MolecularProfile) =>
                profile.molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION && profile.datatype === "DISCRETE");
        },
    });

    readonly copyNumberHomdelEnrichmentData = remoteData<AlterationEnrichment[]>({
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.copyNumberEnrichmentProfiles,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async () => {
            // returns an empty array if the selected study doesn't have any CNA profiles
            return this.selectedEnrichmentCopyNumberProfile ? this.getCopyNumberEnrichmentData(this.alteredSamples.result, 
                this.unalteredSamples.result, "HOMDEL") : [];
        }
    });

    readonly copyNumberAmpEnrichmentData = remoteData<AlterationEnrichment[]>({
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.copyNumberEnrichmentProfiles,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async () => {
            // returns an empty array if the selected study doesn't have any CNA profiles
            return this.selectedEnrichmentCopyNumberProfile ? this.getCopyNumberEnrichmentData(this.alteredSamples.result, 
                this.unalteredSamples.result, "AMP") : [];
        }
    });

    private async getCopyNumberEnrichmentData(alteredSamples: Sample[], unalteredSamples: Sample[], 
        copyNumberEventType: "HOMDEL" | "AMP"): Promise<AlterationEnrichment[]> {
        
        return this.sortEnrichmentData(await internalClient.fetchCopyNumberEnrichmentsUsingPOST({
            molecularProfileId: this.selectedEnrichmentCopyNumberProfile.molecularProfileId,
            copyNumberEventType: copyNumberEventType,
            enrichmentType: "SAMPLE",
            enrichmentFilter: {
                alteredIds: alteredSamples.map(s => s.sampleId),
                unalteredIds: unalteredSamples.map(s => s.sampleId),
                queryGenes: this.getEnrichmentsQueryGenes(this.selectedEnrichmentCopyNumberProfile)
        }}));
    }

    readonly mRNAEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await:()=>[this.molecularProfilesWithData],
        invoke:()=>{
            const mrnaProfiles = this.molecularProfilesWithData.result!.filter(p=>{
                return p.molecularAlterationType === AlterationTypeConstants.MRNA_EXPRESSION
            });
            return Promise.resolve(filterAndSortProfiles(mrnaProfiles));
        },
    });

    readonly mRNAEnrichmentData = remoteData<ExpressionEnrichment[]>({
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.mRNAEnrichmentProfiles,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async () => {
            // returns an empty array if the selected study doesn't have any mRNA profiles
            return this.selectedEnrichmentMRNAProfile ? this.sortEnrichmentData(
                await internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.selectedEnrichmentMRNAProfile.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {alteredIds: this.alteredSamples.result.map(s => s.sampleId),
                        unalteredIds: this.unalteredSamples.result.map(s => s.sampleId),
                        queryGenes: this.getEnrichmentsQueryGenes(this.selectedEnrichmentMRNAProfile)}})) : [];
        }
    });

    readonly proteinEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await:()=>[this.molecularProfilesWithData],
        invoke:()=>{
            const protProfiles = this.molecularProfilesWithData.result!.filter(p=>{
                return p.molecularAlterationType === AlterationTypeConstants.PROTEIN_LEVEL;
            });
            return Promise.resolve(filterAndSortProfiles(protProfiles));
        },
    });

    readonly proteinEnrichmentData = remoteData<ExpressionEnrichment[]>({
        await: () => [
            this.alteredSamples,
            this.unalteredSamples,
            this.proteinEnrichmentProfiles,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async () => {
            // returns an empty array if the selected study doesn't have any protein profiles
            return this.selectedEnrichmentProteinProfile ? this.sortEnrichmentData(
                await internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.selectedEnrichmentProteinProfile.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {alteredIds: this.alteredSamples.result.map(s => s.sampleId),
                        unalteredIds: this.unalteredSamples.result.map(s => s.sampleId),
                        queryGenes: this.getEnrichmentsQueryGenes(this.selectedEnrichmentProteinProfile)}})) : [];
        }
    });

    private sortEnrichmentData(data: any[]): any[] {
        return _.sortBy(data, ["pValue", "hugoGeneSymbol"]);
    }

    private getEnrichmentsQueryGenes(molecularProfile: MolecularProfile): number[] {
        return this.selectedMolecularProfiles.result!.map(s => s.molecularAlterationType)
            .includes(molecularProfile.molecularAlterationType) ? this.genes.result!.map(g => g.entrezGeneId) : [];
    }

    readonly molecularProfileIdToProfiledSampleCount = remoteData({
        await: ()=>[
            this.samples,
            this.coverageInformation,
            this.molecularProfilesInStudies
        ],
        invoke: ()=>{
            const ret:{[molecularProfileId:string]:number} = {};
            const profileIds = this.molecularProfilesInStudies.result.map(x=>x.molecularProfileId);
            const coverageInformation = this.coverageInformation.result!;
            for (const profileId of profileIds) {
                ret[profileId] = 0;
            }
            let profiledReport:boolean[] = [];
            for (const sample of this.samples.result!) {
                profiledReport = isSampleProfiledInMultiple(
                    sample.uniqueSampleKey,
                    profileIds,
                    coverageInformation
                );
                for (let i=0; i<profileIds.length; i++) {
                    if (profiledReport[i]) {
                        ret[profileIds[i]] += 1;
                    }
                }
            }
            return Promise.resolve(ret);
        }
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

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.studyToMolecularProfileDiscrete.result);
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
        return new MutationDataCache(this.studyToMutationMolecularProfile.result,
            this.studyToDataQueryFilter.result);
    }

    readonly geneMolecularDataCache = remoteData({
        await:()=>[
            this.molecularProfileIdToDataQueryFilter
        ],
        invoke: ()=>{
            return Promise.resolve(
                new GeneMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result
                )
            );
        }
    });

    readonly expressionProfiles = remoteData({
        await:()=>[
            this.molecularProfilesInStudies
        ],
        invoke:()=>{
            return Promise.resolve(this.molecularProfilesInStudies.result.filter(
                (profile:MolecularProfile)=>isRNASeqProfile(profile.molecularProfileId, this.expressionTabSeqVersion)
            ));
        }
    });

    readonly rnaSeqMolecularData = remoteData<{[hugoGeneSymbol:string]:NumericGeneMolecularData[][]}>({
       await:()=>[
           this.expressionProfiles,
           this.genes,
           this.geneMolecularDataCache
       ],
       invoke: async ()=>{

           const rnaSeqProfiles = this.expressionProfiles.result!;

           const queries = _.flatMap(this.genes.result,(gene:Gene)=>{
               return rnaSeqProfiles.map((profile:MolecularProfile)=> {
                   return ({
                       entrezGeneId: gene.entrezGeneId,
                       molecularProfileId: profile.molecularProfileId,
                       hugoGeneSymbol:gene.hugoGeneSymbol
                   })
               });
           });

           const data = await this.geneMolecularDataCache.result!.getPromise(queries,true);

           // group cache objects by entrez geneId
           const groupedByGene = _.groupBy(data,
               (cacheItem:CacheData<NumericGeneMolecularData[], { entrezGeneId:number, molecularProfileId:string; }>)=>
                   (cacheItem.meta) ? cacheItem.meta!.entrezGeneId : undefined
           );

           // now convert key from entrez to hugeGeneSymbol
           const keyedByHugoSymbol = _.mapKeys(groupedByGene,(val, entrezGeneId:string)=>{
               // look up huge gene symbol on gene with matching entrez
               return _.find(this.genes.result,(gene:Gene)=>gene.entrezGeneId.toString()===entrezGeneId)!.hugoGeneSymbol;
           });

           const unwrapCacheObjects:{[hugeGeneSymbol:string]:NumericGeneMolecularData[][]} =
               _.mapValues(keyedByHugoSymbol,(val:AugmentedData<NumericGeneMolecularData[], GeneMolecularDataCache>)=>{
                    return _.map(val,(item:AugmentedData<NumericGeneMolecularData[], GeneMolecularDataCache>)=>item.data);
                }) as any; // there's an error with typing for _.mapValues

           return Promise.resolve(unwrapCacheObjects);

       }

    });

    @memoize sortRnaSeqMolecularDataByStudy(seqData:{[profileId:string]:NumericGeneMolecularData[]}){
        return _.keyBy(seqData,(data:NumericGeneMolecularData[])=>{
           return data[0].studyId;
        });
    }

    readonly genesetMolecularDataCache = remoteData({
        await:() => [
            this.molecularProfileIdToDataQueryFilter
        ],
        invoke: () => Promise.resolve(
            new GenesetMolecularDataCache(
                this.molecularProfileIdToDataQueryFilter.result!
            )
        )
    });

    readonly genesetCorrelatedGeneCache = remoteData({
        await:() => [
            this.molecularProfileIdToDataQueryFilter
        ],
        invoke: () => Promise.resolve(
            new GenesetCorrelatedGeneCache(
                this.molecularProfileIdToDataQueryFilter.result!
            )
        )
    });

    @cached get geneCache() {
        return new GeneCache();
    }

    @cached get genesetCache() {
        return new GenesetCache();
    }

    public numericGeneMolecularDataCache = new MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>(
        q=>({
            await: ()=>[
                this.molecularProfileIdToDataQueryFilter
            ],
            invoke: ()=>{
                const dqf = this.molecularProfileIdToDataQueryFilter.result![q.molecularProfileId];
                if (dqf) {
                    return client.fetchAllMolecularDataInMolecularProfileUsingPOST({
                        molecularProfileId: q.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: [q.entrezGeneId],
                            ...dqf
                        } as MolecularDataFilter
                    });
                } else {
                    return Promise.resolve([]);
                }
            }
        })
    );

    public clinicalDataCache = new MobxPromiseCache<ClinicalAttribute, ClinicalData[]>(
        attr=>({
            await:()=>[
                this.samples,
                this.patients
            ],
            invoke:()=>client.fetchClinicalDataUsingPOST({
                clinicalDataType: attr.patientAttribute ? "PATIENT" : "SAMPLE",
                clinicalDataMultiStudyFilter: {
                    attributeIds: [attr.clinicalAttributeId],
                    identifiers: attr.patientAttribute ?
                        this.patients.result!.map(p=>({entityId:p.patientId, studyId:p.studyId})) :
                        this.samples.result!.map(s=>({entityId:s.sampleId, studyId:s.studyId}))
                }
            })
        })
    );

    public oncoprintClinicalDataCache = new OncoprintClinicalDataCache(
        this.samples,
        this.patients,
        this.studyToMutationMolecularProfile,
        this.studyIdToStudy,
        this.coverageInformation
    );

    public mutationCache =
        new MobxPromiseCache<{entrezGeneId:number}, Mutation[]>(
            q=>({
                await:()=>[
                    this.studyToMutationMolecularProfile,
                    this.studyToDataQueryFilter
                ],
                invoke: async()=>{
                    return _.flatten(await Promise.all(Object.keys(this.studyToMutationMolecularProfile.result!).map(studyId=>{
                        const molecularProfileId = this.studyToMutationMolecularProfile.result![studyId].molecularProfileId;
                        const dqf = this.studyToDataQueryFilter.result![studyId];
                        if (dqf && molecularProfileId) {
                            return client.fetchMutationsInMolecularProfileUsingPOST({
                                molecularProfileId,
                                mutationFilter: {
                                    entrezGeneIds:[q.entrezGeneId],
                                    ...dqf
                                } as MutationFilter,
                                projection:"DETAILED"
                            });
                        } else {
                            return Promise.resolve([]);
                        }
                    })));
                }
            })
        );

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
