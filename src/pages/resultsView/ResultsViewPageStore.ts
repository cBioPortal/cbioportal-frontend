import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData, ClinicalDataMultiStudyFilter, Sample,
    SampleIdentifier, MolecularProfile, Mutation, NumericGeneMolecularData, MolecularDataFilter, Gene,
    ClinicalDataSingleStudyFilter, CancerStudy, PatientIdentifier, Patient, GenePanelData, GenePanelDataFilter,
    SampleList, MutationCountByPosition, MutationMultipleStudyFilter, SampleMolecularIdentifier,
    MolecularDataMultipleStudyFilter, SampleFilter, MolecularProfileFilter, GenePanelMultipleStudyFilter, PatientFilter, MutationFilter,
    GenePanel, ClinicalAttributeFilter, ClinicalAttribute
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action, reaction, IObservable, IObservableValue, ObservableMap} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached, MobxPromise} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    findMolecularProfileIdDiscrete, fetchMyCancerGenomeData,
    fetchDiscreteCNAData, findMutationMolecularProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalDataInStudy, generateDataQueryFilter,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData, IDataQueryFilter,
    isMutationProfile, fetchOncoKbAnnotatedGenesSuppressErrors, groupBy, fetchOncoKbData,
    ONCOKB_DEFAULT, generateUniqueSampleKeyToTumorTypeMap, cancerTypeForOncoKb, fetchCnaOncoKbData,
    fetchCnaOncoKbDataWithNumericGeneMolecularData, fetchGermlineConsentedSamples, fetchGenes
} from "shared/lib/StoreUtils";
import {indexHotspotsData, fetchHotspotsData} from "shared/lib/CancerHotspotsUtils";
import ResultsViewMutationMapperStore from "./mutation/ResultsViewMutationMapperStore";
import AppConfig from "appConfig";
import * as _ from 'lodash';
import {stringListToIndexSet, stringListToSet} from "../../shared/lib/StringUtils";
import {toSampleUuid} from "../../shared/lib/UuidUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";
import accessors, {getSimplifiedMutationType, SimplifiedMutationType} from "../../shared/lib/oql/accessors";
import {keepAlive} from "mobx-utils";
import {AugmentedData, CacheData} from "../../shared/lib/LazyMobXCache";
import {
    IAlterationCountMap,
    IAlterationData
} from "./cancerSummary/CancerSummaryContent";
import {writeTest} from "../../shared/lib/writeTest";
import {PatientSurvival} from "../../shared/model/PatientSurvival";
import {
    doesQueryContainOQL,
    filterCBioPortalWebServiceData,
    filterCBioPortalWebServiceDataByOQLLine,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
} from "../../shared/lib/oql/oqlfilter";
import GeneMolecularDataCache from "../../shared/cache/GeneMolecularDataCache";
import GenesetMolecularDataCache from "../../shared/cache/GenesetMolecularDataCache";
import GenesetCorrelatedGeneCache from "../../shared/cache/GenesetCorrelatedGeneCache";
import GeneCache from "../../shared/cache/GeneCache";
import {IHotspotIndex} from "../../shared/model/CancerHotspots";
import {IOncoKbData} from "../../shared/model/OncoKB";
import {generateQueryVariantId} from "../../shared/lib/OncoKbUtils";
import {CosmicMutation, AlterationEnrichment, ExpressionEnrichment} from "../../shared/api/generated/CBioPortalAPIInternal";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import {getAlterationString} from "../../shared/lib/CopyNumberUtils";
import memoize from "memoize-weak-decorator";
import request from 'superagent';
import {countMutations, mutationCountByPositionKey} from "./mutationCountHelpers";
import {getPatientSurvivals} from "./SurvivalStoreHelper";
import {QueryStore} from "shared/components/query/QueryStore";
import {
    annotateMolecularDatum, filterSubQueryData,
    getOncoKbOncogenic, groupDataByCase,
    computeCustomDriverAnnotationReport, computePutativeDriverAnnotatedMutations,
    initializeCustomDriverAnnotationSettings, computeGenePanelInformation,
    fetchQueriedStudies, CoverageInformation, isRNASeqProfile
} from "./ResultsViewPageStoreUtils";
import {getAlterationCountsForCancerTypesForAllGenes} from "../../shared/lib/alterationCountHelpers";
import MobxPromiseCache from "../../shared/lib/MobxPromiseCache";
import {isSampleProfiledInMultiple} from "../../shared/lib/isSampleProfiled";
import {BookmarkLinks} from "../../shared/model/BookmarkLinks";
import {getBitlyServiceUrl, getSessionServiceUrl} from "../../shared/api/urls";
import url from 'url';
import OncoprintClinicalDataCache, {SpecialAttribute} from "../../shared/cache/OncoprintClinicalDataCache";

type Optional<T> = (
    {isApplicable: true, value: T}
    | {isApplicable: false, value?: undefined}
);

export type SamplesSpecificationElement = {studyId: string, sampleId: string, sampleListId: undefined} |
    {studyId: string, sampleId: undefined, sampleListId: string};

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

export interface ExtendedAlteration extends Mutation, NumericGeneMolecularData {
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
            cbioportalCountThreshold: 10,
            cosmicCount: false,
            cosmicCountThreshold: 10,
            driverFilter: !!AppConfig.oncoprintCustomDriverAnnotationDefault,
            driverTiers: observable.map<boolean>(),

            hotspots:!AppConfig.oncoprintOncoKbHotspotsDefault,
            _oncoKb:!AppConfig.oncoprintOncoKbHotspotsDefault,
            _ignoreUnknown: !!AppConfig.oncoprintHideVUSDefault,

            set oncoKb(val:boolean) {
                this._oncoKb = val;
            },
            get oncoKb() {
                return this._oncoKb && !store.didOncoKbFailInOncoprint;
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
    }

    public queryStore: QueryStore;

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable hugoGeneSymbols: string[];
    @observable genesetIds: string[];
    @observable samplesSpecification: SamplesSpecificationElement[] = [];

    //queried id(any combination of physical and virtual studies)
    @observable cohortIdsList: string[] = []

    @observable zScoreThreshold: number;

    @observable rppaScoreThreshold: number;

    @observable oqlQuery: string = '';
    @observable public sessionIdURL = '';

    @observable selectedMolecularProfileIds: string[] = [];

    @observable expressionTabSeqVersion: number = 2;

    public mutationAnnotationSettings:MutationAnnotationSettings;

    @observable.ref selectedEnrichmentMutationProfile: MolecularProfile;
    @observable.ref selectedEnrichmentCopyNumberProfile: MolecularProfile;
    @observable.ref selectedEnrichmentMRNAProfile: MolecularProfile;
    @observable.ref selectedEnrichmentProteinProfile: MolecularProfile;

    @computed get queryContainsOql() {
        return doesQueryContainOQL(this.oqlQuery);
    }

    private getURL() {
        const shareURL = window.location.href;

        if (!shareURL.includes("session_id")) return;

        const showSamples = shareURL.indexOf("&show");
        if (showSamples > -1) {
            this.sessionIdURL = shareURL.slice(0, showSamples);
        }
    }

    readonly bitlyShortenedURL = remoteData({
        invoke: () => {
            return request.get('http://' + location.host + "/api/url-shortener?url=" + this.sessionIdURL);
        },
        onError: () => {
            //
        }
    });

    readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
        await: ()=>[
          this.molecularProfilesInStudies
        ],
        invoke: () => {
            const idLookupMap = _.keyBy(this.selectedMolecularProfileIds,(id:string)=>id); // optimization
            return Promise.resolve(this.molecularProfilesInStudies.result!.filter((profile:MolecularProfile)=>(profile.molecularProfileId in idLookupMap)));
        }
    });

    readonly clinicalAttributes = remoteData({
        await:()=>[this.studyIds],
        invoke:async()=>{
            return client.fetchClinicalAttributesUsingPOST({
                studyIds:this.studyIds.result!
            });
        }
    });

    readonly clinicalAttributeIdToAvailableSampleCount = remoteData({
        await:()=>[
            this.samples,
            this.studies,
            this.clinicalAttributes,
            this.studyToDataQueryFilter,
        ],
        invoke:async()=>{
            let clinicalAttributeFilter:ClinicalAttributeFilter;
            if (this.studies.result.length === 1) {
                // try using sample list id
                const studyId = this.studies.result[0].studyId;
                const dqf = this.studyToDataQueryFilter.result[studyId];
                if (dqf.sampleListId) {
                    clinicalAttributeFilter = {
                        sampleListId: dqf.sampleListId
                    } as ClinicalAttributeFilter;
                } else {
                    clinicalAttributeFilter = {
                        sampleIdentifiers: dqf.sampleIds!.map(sampleId=>({ sampleId, studyId }))
                    } as ClinicalAttributeFilter;
                }
            } else {
                // use sample identifiers
                clinicalAttributeFilter = {
                    sampleIdentifiers: this.samples.result!.map(sample=>({sampleId:sample.sampleId, studyId:sample.studyId}))
                } as ClinicalAttributeFilter;
            }

            const result = await client.getAllClinicalAttributesInStudiesUsingPOST({
                clinicalAttributeFilter,
                projection: "DETAILED"
            });
            // build map
            const ret:{[clinicalAttributeId:string]:number} = _.reduce(result, (map:{[clinicalAttributeId:string]:number}, next:ClinicalAttribute)=>{
                map[next.clinicalAttributeId] = map[next.clinicalAttributeId] || 0;
                map[next.clinicalAttributeId] += next.count;
                return map;
            }, {});
            // add counts for "special" clinical attributes
            ret[SpecialAttribute.StudyOfOrigin] = this.samples.result!.length;
            let samplesWithMutationData = 0, samplesWithCNAData = 0;
            for (const sample of this.samples.result!) {
                samplesWithMutationData += +!!sample.sequenced;
                samplesWithCNAData += +!!sample.copyNumberSegmentPresent;
            }
            ret[SpecialAttribute.MutationSpectrum] = samplesWithMutationData;
            ret[SpecialAttribute.MutationCount] = samplesWithMutationData;
            ret[SpecialAttribute.FractionGenomeAltered] = samplesWithCNAData;

            return ret;
        }
    });

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

    readonly nonMutationMolecularProfilesWithData = remoteData<MolecularProfile[]>({
        await:()=>[
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
            this.genes
        ],
        invoke:async()=>{
            const ret:MolecularProfile[] = [];
            const promises = [];
            const studyToDataQueryFilter = this.studyToDataQueryFilter.result!;
            for (const profile of this.molecularProfilesInStudies.result!) {
                if (profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED) {
                    continue;
                }
                const molecularDataFilter = {
                    entrezGeneIds: this.genes.result!.map(g=>g.entrezGeneId),
                    ...studyToDataQueryFilter[profile.studyId]
                } as MolecularDataFilter;
                const molecularProfileId = profile.molecularProfileId;
                const projection = "META";
                promises.push(client.fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo({
                    molecularProfileId,
                    molecularDataFilter,
                    projection
                }).then(function(response: request.Response) {
                    const count = parseInt(response.header["total-count"], 10);
                    if (count > 0) {
                        // theres data for at least one of the query genes
                        ret.push(profile);
                    }
                }));
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
            this.selectedMolecularProfiles,
            this.defaultOQLQuery
        ],
        invoke: () => {
            const acc = new accessors(this.selectedMolecularProfiles.result!);
            const alterations: ExtendedAlteration[] = [];

            this.unfilteredAlterations.result!.forEach(alteration => {
                const extendedAlteration: Partial<ExtendedAlteration> = {
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
            if (this.oqlQuery.trim() != "") {
                return Promise.resolve(
                        filterCBioPortalWebServiceData(this.oqlQuery, this.unfilteredAlterations.result!, (new accessors(this.selectedMolecularProfiles.result!)), this.defaultOQLQuery.result!)
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
            return Promise.resolve(filterCBioPortalWebServiceDataByOQLLine(this.oqlQuery, this.unfilteredAlterations.result!,
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

            if (this.oqlQuery.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>[] = (
                    filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                        this.oqlQuery,
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
            if (this.oqlQuery.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine:OQLLineFilterOutput<AnnotatedExtendedAlteration>[] = filterCBioPortalWebServiceDataByOQLLine(
                    this.oqlQuery,
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

    readonly coverageInformation = remoteData<CoverageInformation>({
        await:()=>[
            this.molecularProfilesInStudies,
            this.genes,
            this.samples,
            this.patients
        ],
        invoke:async()=>{
            const studyToMolecularProfiles = _.groupBy(this.molecularProfilesInStudies.result!, profile=>profile.studyId);
            const sampleMolecularIdentifiers:SampleMolecularIdentifier[] = [];
            this.samples.result!.forEach(sample=>{
                const profiles = studyToMolecularProfiles[sample.studyId];
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
            this.coverageInformation
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            return Promise.resolve(this.samples.result!.map(s=>s.uniqueSampleKey).filter(k=>{
                const sequencedInfo = genePanelInformation.samples[k];
                return !!sequencedInfo.allGenes.length || !!Object.keys(sequencedInfo.byGene).length;
            }));
        }
    });

    readonly sequencedPatientKeys = remoteData<string[]>({
        await:()=>[
            this.patients,
            this.coverageInformation
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            return Promise.resolve(this.patients.result!.map(p=>p.uniquePatientKey).filter(k=>{
                const sequencedInfo = genePanelInformation.patients[k];
                return !!sequencedInfo.allGenes.length || !!Object.keys(sequencedInfo.byGene).length;
            }));
        }
    });

    readonly sequencedSampleKeysByGene = remoteData<{[hugoGeneSymbol:string]:string[]}>({
        await: ()=>[
            this.samples,
            this.genes,
            this.coverageInformation
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            return Promise.resolve(this.genes.result!.reduce((map:{[hugoGeneSymbol:string]:string[]}, next:Gene)=>{
                map[next.hugoGeneSymbol] = this.samples.result!.map(s=>s.uniqueSampleKey).filter(k=>{
                    const sequencedInfo = genePanelInformation.samples[k];
                    return (!!sequencedInfo.allGenes.length || sequencedInfo.byGene.hasOwnProperty(next.hugoGeneSymbol));
                });
                return map;
            }, {}));
        }
    });

    readonly sequencedPatientKeysByGene = remoteData<{[hugoGeneSymbol:string]:string[]}>({
        await: ()=>[
            this.patients,
            this.genes,
            this.coverageInformation
        ],
        invoke:()=>{
            const genePanelInformation = this.coverageInformation.result!;
            return Promise.resolve(this.genes.result!.reduce((map:{[hugoGeneSymbol:string]:string[]}, next:Gene)=>{
                map[next.hugoGeneSymbol] = this.patients.result!.map(p=>p.uniquePatientKey).filter(k=>{
                    const sequencedInfo = genePanelInformation.patients[k];
                    return (!!sequencedInfo.allGenes.length || sequencedInfo.byGene.hasOwnProperty(next.hugoGeneSymbol));
                });
                return map;
            }, {}));
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
            const profileTypes = _.map(this.selectedMolecularProfiles.result, (profile) => profile.molecularAlterationType);
            return Promise.resolve(buildDefaultOQLProfile(profileTypes, this.zScoreThreshold, this.rppaScoreThreshold));
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

    readonly totalAlterationStats = remoteData<{ alteredSampleCount:number, sampleCount:number }>({
       await:() => [
           this.alterationsByGeneBySampleKey,
           this.samplesExtendedWithClinicalData
       ],
       invoke: async ()=>{
           const countsByGroup = getAlterationCountsForCancerTypesForAllGenes(
               this.alterationsByGeneBySampleKey.result!,
               this.samplesExtendedWithClinicalData.result!,
               'cancerType');

           const ret = _.reduce(countsByGroup, (memo, alterationData:IAlterationData)=>{
                memo.alteredSampleCount += alterationData.alteredSampleCount;
                memo.sampleCount += alterationData.sampleTotal;
                return memo;
           }, { alteredSampleCount: 0, sampleCount:0 } as any);

           return ret;
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

    // readonly genes = remoteData(async() => {
    //     if (this.hugoGeneSymbols) {
    //         return client.fetchGenesUsingPOST({
    //             geneIds: this.hugoGeneSymbols.slice(),
    //             geneIdType: "HUGO_GENE_SYMBOL"
    //         });
    //     }
    //     return undefined;
    // });

    readonly givenSampleOrder = remoteData<Sample[]>({
        await: ()=>[
            this.samples
        ],
        invoke: async()=>{
            // for now, just assume we won't mix sample lists and samples in the specification
            if (this.samplesSpecification.find(x=>!x.sampleId)) {
                // for now, if theres any sample list id specification, then there is no given sample order
                return [];
            }
            // at this point, we know samplesSpecification is a list of samples
            const studyToSampleToIndex:{[studyId:string]:{[sampleId:string]:number}} =
                _.reduce(this.samplesSpecification,
                    (map:{[studyId:string]:{[sampleId:string]:number}}, next:SamplesSpecificationElement, index:number)=>{
                        map[next.studyId] = map[next.studyId] || {};
                        map[next.studyId][next.sampleId!] = index; // we know sampleId defined otherwise we would have returned from function already
                        return map;
                    },
                {});
            return _.sortBy(this.samples.result, sample=>studyToSampleToIndex[sample.studyId][sample.sampleId]);
        }
    });

    readonly studyToSampleIds = remoteData<{ [studyId: string]: { [sampleId: string]: boolean } }>(async () => {
        const sampleListsToQuery: { studyId: string, sampleListId: string }[] = [];
        const ret: { [studyId: string]: { [sampleId: string]: boolean } } = {};
        for (const sampleSpec of this.samplesSpecification) {
            if (sampleSpec.sampleId) {
                ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
                ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
            } else if (sampleSpec.sampleListId) {
                sampleListsToQuery.push(sampleSpec as { studyId: string, sampleListId: string });
            }
        }
        const results: string[][] = await Promise.all(sampleListsToQuery.map(spec => {
            return client.getAllSampleIdsInSampleListUsingGET({
                sampleListId: spec.sampleListId
            });
        }));
        for (let i = 0; i < results.length; i++) {
            ret[sampleListsToQuery[i].studyId] = ret[sampleListsToQuery[i].studyId] || {};
            const sampleMap = ret[sampleListsToQuery[i].studyId];
            results[i].map(sampleId => {
                sampleMap[sampleId] = true;
            });
        }
        return ret;
    }, {});

    @computed get studyToSampleListId(): { [studyId: string]: string } {
        return this.samplesSpecification.reduce((map, next) => {
            if (next.sampleListId) {
                map[next.studyId] = next.sampleListId;
            }
            return map;
        }, {} as {[studyId: string]: string});
    }

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

    readonly studyIds = remoteData({
        await: ()=>[this.studyToSampleIds],
        invoke: ()=>{
            return Promise.resolve(Object.keys(this.studyToSampleIds.result));
        }
    });

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly sampleLists = remoteData<SampleList[]>({
        invoke:()=>Promise.all(Object.keys(this.studyToSampleListId).map(studyId=>{
            return client.getSampleListUsingGET({
                sampleListId: this.studyToSampleListId[studyId]
            });
        }))
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

    @computed get mutationsByGene():{ [hugeGeneSymbol:string]:Mutation[]}{
        return _.groupBy(this.mutations.result,(mutation:Mutation)=>mutation.gene.hugoGeneSymbol);
    }

    readonly mutationMapperStores = remoteData<{ [hugoGeneSymbol: string]: ResultsViewMutationMapperStore }>({
        await: () => [this.genes, this.oncoKbAnnotatedGenes, this.uniqueSampleKeyToTumorType, this.mutations],
        invoke: () => {
            if (this.genes.result) {
                // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                return Promise.resolve(_.reduce(this.genes.result, (map: { [hugoGeneSymbol: string]: ResultsViewMutationMapperStore }, gene: Gene) => {
                    map[gene.hugoGeneSymbol] = new ResultsViewMutationMapperStore(AppConfig,
                        gene,
                        this.samples,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.mutationsByGene[gene.hugoGeneSymbol],
                        () => (this.genomeNexusEnrichmentCache),
                        () => (this.mutationCountCache),
                        this.studyIdToStudy,
                        this.molecularProfileIdToMolecularProfile,
                        this.clinicalDataForSamples,
                        this.studiesForSamplesWithoutCancerTypeClinicalData,
                        this.germlineConsentedSamples,
                        this.indexedHotspotData,
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
        invoke: () => this.getClinicalData("SAMPLE", this.samples.result, ["CANCER_TYPE", "CANCER_TYPE_DETAILED"])
    }, []);

    private getClinicalData(clinicalDataType: "SAMPLE" | "PATIENT", entities: any[], attributeIds: string[]):
    Promise<Array<ClinicalData>> {

        // single study query endpoint is optimal so we should use it
        // when there's only one study
        if (this.studies.result.length === 1) {
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

    readonly survivalClinicalData = remoteData<ClinicalData[]>({
        await: () => [
            this.studies,
            this.patients
        ],
        invoke: () => this.getClinicalData("PATIENT", this.patients.result, ["OS_STATUS", "OS_MONTHS", "DFS_STATUS", "DFS_MONTHS"])
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
        invoke: async() => await fetchGermlineConsentedSamples(this.studyIds, AppConfig.studiesWithGermlineConsentedSamples),
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
            if(!_.isEmpty(this.cohortIdsList)){
                return fetchQueriedStudies(this.studyIdToStudy.result, this.cohortIdsList);
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
            this.genesetMolecularProfile
        ],
        invoke: () => {
            const MRNA_EXPRESSION = AlterationTypeConstants.MRNA_EXPRESSION;
            const PROTEIN_LEVEL = AlterationTypeConstants.PROTEIN_LEVEL;
            const METHYLATION = AlterationTypeConstants.METHYLATION;
            const selectedMolecularProfileIds = stringListToSet(this.selectedMolecularProfileIds);

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
        await: () => [this.studyToSampleIds, this.studyIds],
        invoke: () => {
            const studies = this.studyIds.result!;
            const ret: { [studyId: string]: IDataQueryFilter } = {};
            for (const studyId of studies) {
                ret[studyId] = generateDataQueryFilter(this.studyToSampleListId[studyId] || null, Object.keys(this.studyToSampleIds.result[studyId] || {}))
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
            if (AppConfig.sessionServiceIsEnabled) {
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

    readonly entrezGeneIdToGene = remoteData<{[entrezGeneId:number]:Gene}>({
        await: ()=>[this.genes],
        invoke: ()=>Promise.resolve(_.keyBy(this.genes.result!, gene=>gene.entrezGeneId))
    });

    readonly genesetLinkMap = remoteData<{[genesetId: string]: string}>({
        invoke: async () => {
            if (this.genesetIds && this.genesetIds.length) {
                const genesets = await internalClient.fetchGenesetsUsingPOST(
                    {genesetIds: this.genesetIds.slice()}
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
                !!AppConfig.oncoprintCustomDriverTiersAnnotationDefault,
                AppConfig.oncoprintOncoKbHotspotsDefault === "custom"
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
            this.getOncoKbCnaAnnotationForOncoprint,
            this.molecularProfileIdToMolecularProfile
        ],
        invoke:()=>{
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
                        profileIdToProfile
                    );
                })
            );
        }
    });

    readonly getPutativeDriverInfo = remoteData({
        await:()=>{
            const toAwait = [];
            if (this.mutationAnnotationSettings.oncoKb) {
                toAwait.push(this.getOncoKbMutationAnnotationForOncoprint);
            }
            if (this.mutationAnnotationSettings.hotspots) {
                toAwait.push(this.isHotspot);
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
                    this.isHotspot.isComplete &&
                    this.isHotspot.result(mutation));

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

    public readonly isHotspot = remoteData({
        await:()=>[
            this.getOncoKbMutationAnnotationForOncoprint
        ],
        invoke:()=>{
            return Promise.resolve((mutation:Mutation)=>{
                const oncokbAnnotation = typeof this.getOncoKbMutationAnnotationForOncoprint.result === "function" && this.getOncoKbMutationAnnotationForOncoprint.result!(mutation);
                return (oncokbAnnotation ? !!oncokbAnnotation.hotspot : false);
            });
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
        invoke: () => fetchOncoKbData(this.uniqueSampleKeyToTumorType.result!, this.oncoKbAnnotatedGenes.result!, this.mutations),
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
            let result;
            try {
                result = await fetchOncoKbData({}, this.oncoKbAnnotatedGenes.result!, this.mutations)
            } catch(e) {
                result = new Error();
            }
            return result;
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
        invoke: () => fetchCnaOncoKbDataWithNumericGeneMolecularData(
            this.uniqueSampleKeyToTumorType.result!,
            this.oncoKbAnnotatedGenes.result!,
            this.molecularData,
            this.molecularProfileIdToMolecularProfile.result!
        )
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
            let result;
            try {
                result = await fetchCnaOncoKbDataWithNumericGeneMolecularData(
                    {},
                    this.oncoKbAnnotatedGenes.result!,
                    this.molecularData,
                    this.molecularProfileIdToMolecularProfile.result!
                );
            } catch(e) {
                result = new Error();
            }
            return result;
        }
    }, ONCOKB_DEFAULT);

    @computed get didOncoKbFailInOncoprint() {
        return this.getOncoKbMutationAnnotationForOncoprint.result instanceof Error;
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
                if (counts) {
                    return counts.reduce((count, next:CosmicMutation)=>{
                        return count + next.count;
                    }, 0);
                } else {
                    return -1;
                }
            });
        }
    });

    readonly mutationEnrichmentProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            return _.filter(this.molecularProfilesInStudies.result, (profile: MolecularProfile) => 
                profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED);
        },
        onResult:(profiles: MolecularProfile[])=>{
            this.selectedEnrichmentMutationProfile = profiles[0];
        }
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
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            return _.filter(this.molecularProfilesInStudies.result, (profile: MolecularProfile) => 
                profile.molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION && profile.datatype === "DISCRETE");
        },
        onResult:(profiles: MolecularProfile[])=>{
            this.selectedEnrichmentCopyNumberProfile = profiles[0];
        }
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
        await: () => [
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            let profiles: MolecularProfile[] = _.filter(this.molecularProfilesInStudies.result,
                (profile: MolecularProfile) => profile.molecularAlterationType === AlterationTypeConstants.MRNA_EXPRESSION
                    && profile.datatype != "Z-SCORE");
            // move rna_seq profiles at the top of the list to prioritize them
            const rnaSeqProfiles = _.remove(profiles, (p) => {
                return p.molecularProfileId.includes("rna_seq");
            });
            profiles = rnaSeqProfiles.concat(profiles);
            return profiles;
        },
        onResult:(profiles: MolecularProfile[])=>{
            this.selectedEnrichmentMRNAProfile = profiles[0];
        }
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
        await: () => [
            this.molecularProfileIdToProfiledSampleCount
        ],
        invoke: async () => {
            return _.filter(this.molecularProfilesInStudies.result, (profile: MolecularProfile) => 
                profile.molecularAlterationType === AlterationTypeConstants.PROTEIN_LEVEL && profile.datatype != "Z-SCORE");
        },
        onResult:(profiles: MolecularProfile[])=>{
            this.selectedEnrichmentProteinProfile = profiles[0];
        }
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

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.studyToMolecularProfileDiscrete.result);
    }

    @cached get genomeNexusEnrichmentCache() {
        return new GenomeNexusEnrichmentCache();
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
