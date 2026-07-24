import _ from 'lodash';
import {
    CancerStudy,
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    Gene,
    GenePanelData,
    GenePanelDataMultipleStudyFilter,
    GenericAssayMeta,
    Geneset,
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    Mutation,
    MutationFilter,
    MutationMultipleStudyFilter,
    NumericGeneMolecularData,
    Patient,
    Sample,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import ClinicalDataCache from 'shared/cache/ClinicalDataCache';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { computed, makeObservable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    concatMutationData,
    filterAndAnnotateMolecularData,
    filterAndAnnotateMutations,
    IDataQueryFilter,
    evaluatePutativeDriverInfoWithHotspots,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    makeGetOncoKbMutationAnnotationForOncoprint,
    fetchOncoKbDataForOncoprint,
    ONCOKB_DEFAULT,
    makeIsHotspotForOncoprint,
    evaluatePutativeDriverInfo,
    makeGetOncoKbCnaAnnotationForOncoprint,
    fetchCnaOncoKbDataForOncoprint,
} from 'shared/lib/StoreUtils';
import {
    CoverageInformation,
    getCoverageInformation,
} from 'shared/lib/GenePanelUtils';
import { getFilteredMolecularProfilesByAlterationType } from 'pages/studyView/StudyViewUtils';
import {
    AlterationTypeConstants,
    DataTypeConstants,
    GENOME_NEXUS_ARG_FIELD_ENUM,
    REQUEST_ARG_ENUM,
} from 'shared/constants';
import { StructuralVariantFilter } from 'cbioportal-ts-api-client';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import {
    createDiscreteCopyNumberDataKey,
    excludeSpecialMolecularProfiles,
    ExtendedClinicalAttribute,
    getGeneAndProfileChunksForRequest,
} from 'pages/resultsView/ResultsViewPageStoreUtils';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import { DriverAnnotationSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import GenesetMolecularDataCache from 'shared/cache/GenesetMolecularDataCache';
import GenericAssayMolecularDataCache from 'shared/cache/GenericAssayMolecularDataCache';
import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import {
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { getServerConfig } from 'config/config';
import {
    IHotspotIndex,
    indexHotspotsData,
    IndicatorQueryResp,
    IOncoKbData,
} from 'cbioportal-utils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import {
    MobxPromise,
    MobxPromiseUnionTypeWithDefault,
} from 'cbioportal-frontend-commons';
import { MolecularDataFilter } from 'cbioportal-ts-api-client';

/**
 * Context-specific inputs that each page store provides.
 *
 * PlotsTabStore uses these to compute shared PlotsTab data
 * without coupling to any particular page's store.
 */
export interface IPlotsTabStoreInput {
    /** All molecular profiles for the current context (cohort/study/query). */
    molecularProfiles: MobxPromiseUnionTypeWithDefault<MolecularProfile[]>;

    /** Genes currently selected in the PlotsTab UI (from URL params). */
    plotsSelectedGenes: MobxPromise<Gene[]>;

    /**
     * Gene lookup map.
     * PatientView & StudyView supply all genes; ResultsView supplies OQL genes only.
     */
    entrezGeneIdToGene: MobxPromise<{ [entrezGeneId: number]: Gene }>;

    /** Per-study sample filter used for data queries. Context-specific derivation. */
    studyToDataQueryFilter: MobxPromise<{
        [studyId: string]: IDataQueryFilter;
    }>;

    /**
     * Map from uniqueSampleKey → Sample for the "active" sample set.
     * Used to filter mutations, molecular data, discrete CNAs, and
     * numericGeneMolecularDataCache results.
     *
     * Mapping per context:
     * - PatientView: selectedReferenceCohortSampleMap (cohort-selection driven)
     * - StudyView:   filteredSampleKeyToSample (chart-filtered)
     * - ResultsView: filteredSampleKeyToSample (query-filtered)
     */
    filteredSampleKeyToSample: MobxPromise<{
        [uniqueSampleKey: string]: Sample;
    }>;

    /**
     * Patient list used for coverageInformation.
     *
     * - PatientView: patientsInCohort (all cohort patients)
     * - StudyView:   patients (all cohort patients)
     * - ResultsView: patients (all queried patients)
     */
    patientsForCoverage: MobxPromise<Patient[]>;

    /**
     * Samples used in structuralVariants query and structuralVariantCache.
     *
     * - PatientView: samplesInCohort (full cohort)
     * - StudyView:   samples (all cohort)
     * - ResultsView: samples (all queried)
     */
    samplesForSVQueries: MobxPromise<Sample[]>;

    /**
     * Samples grouped by patient in patientKeyToFilteredSamples.
     *
     * - PatientView: samplesInCohort (all cohort)
     * - StudyView:   selectedSamples (chart-filtered)
     * - ResultsView: filteredSamples (query-filtered)
     */
    samplesForPatientKeyGrouping: MobxPromise<Sample[]>;

    /** Studies in the current context. */
    studies: MobxPromiseUnionTypeWithDefault<CancerStudy[]>;

    /** Study-id-keyed study lookup for this context. */
    studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>;

    /** Driver annotation settings (hotspots, oncoKb, custom binary/tiers). */
    driverAnnotationSettings: DriverAnnotationSettings;

    /** OncoKB-annotated gene set for the current context. */
    oncoKbAnnotatedGenes: MobxPromise<{ [entrezGeneId: number]: boolean }>;

    /** Internal cBioPortal API client. */
    internalClient: CBioPortalAPIInternal;

    /** Genome Nexus internal client for hotspot lookups. */
    genomeNexusInternalClient: GenomeNexusAPIInternal;

    /** Genome Nexus client for variant annotation lookups (germline OncoKB queries). */
    genomeNexusClient: GenomeNexusAPI;

    /** All genes available in this context (allGenes for PatientView/StudyView, queried genes for ResultsView). */
    genes: MobxPromise<Gene[]>;

    /** Active filtered samples (cohort/chart/query filtered, used directly as filteredSamples prop). */
    filteredSamples: MobxPromise<Sample[]>;

    /** Patients for the current context (full Patient[] for PlotsTab display). */
    patients: MobxPromise<Patient[]>;

    /** ClinicalDataCache for this context. */
    clinicalDataCache: ClinicalDataCache;

    /** Clinical attributes for this context (plotClinicalAttributes for ResultsView). */
    clinicalAttributes: MobxPromise<ExtendedClinicalAttribute[]>;

    /** Custom (non-clinical) attributes for this context. */
    customAttributes: MobxPromise<ExtendedClinicalAttribute[]>;

    /** Gene sets for this context. */
    genesets: MobxPromise<Geneset[]>;

    /** Generic assay entities grouped by molecular profile ID. */
    genericAssayEntitiesGroupByMolecularProfileId: MobxPromise<{
        [profileId: string]: GenericAssayMeta[];
    }>;

    /** Currently selected generic assay entities per molecular profile. Plain computed object, not MobxPromise. */
    selectedGenericAssayEntitiesGroupByMolecularProfileId: {
        [molecularProfileId: string]: string[];
    };

    /** Molecular profiles that have data. */
    molecularProfilesWithData: MobxPromise<MolecularProfile[]>;

    /**
     * All visible samples keyed by uniqueSampleKey, used by PlotsTab to look
     * up Sample objects while rendering data points.
     *
     * This is intentionally distinct from filteredSampleKeyToSample (which is
     * used internally to filter cache results): some contexts (e.g. StudyView)
     * need a broader set here (all cohort samples) than the chart-filtered set
     * used for data queries.
     *
     * - PatientView:  selectedReferenceCohortSampleMap
     * - StudyView:    sampleSetByKey (all cohort samples)
     * - ResultsView:  sampleKeyToSample (all queried samples)
     */
    sampleKeyToSample: MobxPromise<{ [uniqueSampleKey: string]: Sample }>;

    /** Whether the context has no OQL-queried genes (true for PatientView/StudyView, false for ResultsView). */
    hasNoQueriedGenes: boolean;
}

export class PlotsTabStore {
    constructor(private readonly input: IPlotsTabStoreInput) {
        makeObservable(this);
    }

    // ─── Pass-through inputs ─────────────────────────────────────────────────

    get studies() {
        return this.input.studies;
    }

    get driverAnnotationSettings() {
        return this.input.driverAnnotationSettings;
    }

    get entrezGeneIdToGene() {
        return this.input.entrezGeneIdToGene;
    }

    get genes() {
        return this.input.genes;
    }

    get filteredSamples() {
        return this.input.filteredSamples;
    }

    get patients() {
        return this.input.patients;
    }

    get clinicalDataCache() {
        return this.input.clinicalDataCache;
    }

    get clinicalAttributes() {
        return this.input.clinicalAttributes;
    }

    get customAttributes() {
        return this.input.customAttributes;
    }

    get genesets() {
        return this.input.genesets;
    }

    get genericAssayEntitiesGroupByMolecularProfileId() {
        return this.input.genericAssayEntitiesGroupByMolecularProfileId;
    }

    get selectedGenericAssayEntitiesGroupByMolecularProfileId() {
        return this.input.selectedGenericAssayEntitiesGroupByMolecularProfileId;
    }

    get molecularProfilesWithData() {
        return this.input.molecularProfilesWithData;
    }

    get sampleKeyToSample() {
        return this.input.sampleKeyToSample;
    }

    get molecularProfilesInStudies() {
        return this.input.molecularProfiles;
    }

    get hasNoQueriedGenes() {
        return this.input.hasNoQueriedGenes;
    }

    /**
     * Unwrapped study-id-to-study map, passed through to IPlotsTabProps which
     * accepts an optional plain dictionary (not a MobxPromise).  Returns
     * `undefined` while the underlying promise is pending.
     */
    get studyIdToStudy(): _.Dictionary<CancerStudy> | undefined {
        return this.input.studyIdToStudy.result;
    }

    readonly studyIds = remoteData({
        await: () => [this.input.studies],
        invoke: () =>
            Promise.resolve(this.input.studies.result!.map(s => s.studyId)),
        default: [] as string[],
    });

    @computed get hugoGeneSymbols(): string[] {
        return this.input.genes.result?.map(g => g.hugoGeneSymbol) ?? [];
    }

    // ─── Molecular Profile Maps ──────────────────────────────────────────────

    readonly studyIdToMolecularProfiles = remoteData({
        await: () => [this.input.molecularProfiles],
        invoke: () =>
            Promise.resolve(
                _.groupBy(this.input.molecularProfiles.result!, p => p.studyId)
            ),
        onError: () => {},
        default: {},
    });

    readonly mutationProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () =>
            Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.MUTATION_EXTENDED
                )
            ),
        onError: () => {},
        default: [],
    });

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () =>
            Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                    [DataTypeConstants.FUSION, DataTypeConstants.SV]
                )
            ),
        onError: () => {},
        default: [],
    });

    readonly cnaProfiles = remoteData({
        await: () => [this.input.molecularProfiles],
        invoke: async () =>
            this.input.molecularProfiles.result!.filter(
                p =>
                    p.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                    p.datatype === DataTypeConstants.DISCRETE
            ),
        onError: () => {},
        default: [],
    });

    @computed get cnaMolecularProfileIds() {
        return this.cnaProfiles.isComplete
            ? this.cnaProfiles.result.map(p => p.molecularProfileId)
            : [];
    }

    readonly studyToMutationMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.mutationProfiles],
            invoke: () =>
                Promise.resolve(
                    _.keyBy(
                        this.mutationProfiles.result,
                        (p: MolecularProfile) => p.studyId
                    )
                ),
        },
        {}
    );

    readonly studyToMolecularProfileDiscreteCna = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.input.molecularProfiles],
            invoke: async () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const p of this.input.molecularProfiles.result!) {
                    if (
                        p.datatype === DataTypeConstants.DISCRETE &&
                        p.molecularAlterationType ===
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION
                    ) {
                        ret[p.studyId] = p;
                    }
                }
                return ret;
            },
        },
        {}
    );

    readonly studyToStructuralVariantMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.structuralVariantProfiles],
            invoke: () =>
                Promise.resolve(
                    _.keyBy(
                        this.structuralVariantProfiles.result,
                        (p: MolecularProfile) => p.studyId
                    )
                ),
        },
        {}
    );

    readonly molecularProfileIdSuffixToMolecularProfiles = remoteData<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.input.molecularProfiles],
            invoke: () =>
                Promise.resolve(
                    _.groupBy(this.input.molecularProfiles.result, p =>
                        getSuffixOfMolecularProfile(p)
                    )
                ),
        },
        {}
    );

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.input.molecularProfiles],
            invoke: () =>
                Promise.resolve(
                    this.input.molecularProfiles.result!.reduce(
                        (
                            map: { [id: string]: MolecularProfile },
                            next: MolecularProfile
                        ) => {
                            map[next.molecularProfileId] = next;
                            return map;
                        },
                        {}
                    )
                ),
        },
        {}
    );

    // ─── Query Filter ────────────────────────────────────────────────────────

    readonly molecularProfileIdToDataQueryFilter = remoteData<{
        [molecularProfileId: string]: IDataQueryFilter;
    }>({
        await: () => [
            this.input.molecularProfiles,
            this.input.studyToDataQueryFilter,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: IDataQueryFilter } = {};
            for (const p of this.input.molecularProfiles.result!) {
                ret[
                    p.molecularProfileId
                ] = this.input.studyToDataQueryFilter.result![p.studyId];
            }
            return Promise.resolve(ret);
        },
        default: {},
    });

    // ─── Gene Panel / Coverage ───────────────────────────────────────────────

    readonly genePanelDataForAllProfiles = remoteData<GenePanelData[]>({
        await: () => [this.input.molecularProfiles],
        invoke: () =>
            getClient().fetchGenePanelDataInMultipleMolecularProfilesUsingPOST({
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: this.input.molecularProfiles.result!.map(
                        p => p.molecularProfileId
                    ),
                } as GenePanelDataMultipleStudyFilter,
            }),
    });

    readonly coverageInformation = remoteData<CoverageInformation>({
        await: () => [
            this.genePanelDataForAllProfiles,
            this.input.filteredSampleKeyToSample,
            this.input.patientsForCoverage,
            this.input.plotsSelectedGenes,
        ],
        invoke: () =>
            getCoverageInformation(
                this.genePanelDataForAllProfiles.result!,
                this.input.filteredSampleKeyToSample.result!,
                this.input.patientsForCoverage.result!,
                this.input.plotsSelectedGenes.result!
            ),
    });

    // ─── Sample Grouping ─────────────────────────────────────────────────────

    readonly patientKeyToFilteredSamples = remoteData({
        await: () => [this.input.samplesForPatientKeyGrouping],
        invoke: () =>
            Promise.resolve(
                _.groupBy(
                    this.input.samplesForPatientKeyGrouping.result!,
                    s => s.uniquePatientKey
                )
            ),
    });

    // ─── Mutations ───────────────────────────────────────────────────────────

    readonly mutations_preload = remoteData<Mutation[]>({
        await: () => [this.input.plotsSelectedGenes, this.mutationProfiles],
        invoke: () => {
            if (
                this.input.plotsSelectedGenes.result!.length === 0 ||
                this.mutationProfiles.result!.length === 0
            ) {
                return Promise.resolve([]);
            }
            return getClient().fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    mutationMultipleStudyFilter: {
                        entrezGeneIds: this.input.plotsSelectedGenes.result!.map(
                            g => g.entrezGeneId
                        ),
                        molecularProfileIds: this.mutationProfiles.result!.map(
                            p => p.molecularProfileId
                        ),
                    } as MutationMultipleStudyFilter,
                }
            );
        },
    });

    readonly mutations = remoteData<Mutation[]>({
        await: () => [
            this.mutations_preload,
            this.input.filteredSampleKeyToSample,
        ],
        invoke: () => {
            const sampleKeys = this.input.filteredSampleKeyToSample.result!;
            return Promise.resolve(
                this.mutations_preload.result!.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    // ─── Structural Variants ─────────────────────────────────────────────────

    readonly structuralVariants = remoteData<StructuralVariant[]>({
        await: () => [
            this.input.plotsSelectedGenes,
            this.input.samplesForSVQueries,
            this.studyToStructuralVariantMolecularProfile,
            this.input.entrezGeneIdToGene,
        ],
        invoke: async () => {
            if (
                _.isEmpty(
                    this.studyToStructuralVariantMolecularProfile.result
                ) ||
                _.isEmpty(this.input.plotsSelectedGenes.result)
            ) {
                return [];
            }
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result;

            const sampleMolecularIdentifiers = this.input.samplesForSVQueries.result!.reduce(
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
                [] as StructuralVariantFilter['sampleMolecularIdentifiers']
            );

            if (_.isEmpty(sampleMolecularIdentifiers)) {
                return [];
            }

            const entrezGeneIds = _.map(
                this.input.plotsSelectedGenes.result,
                (gene: Gene) => gene.entrezGeneId
            );

            return this.input.internalClient.fetchStructuralVariantsUsingPOST({
                structuralVariantFilter: {
                    entrezGeneIds,
                    structuralVariantQueries: [],
                    sampleMolecularIdentifiers,
                    molecularProfileIds: [],
                },
            });
        },
    });

    // ─── Discrete Copy Number Alteration Pipeline ────────────────────────────

    readonly discreteCopyNumberAlterations_preload = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [
            this.input.plotsSelectedGenes,
            this.studyToMolecularProfileDiscreteCna,
        ],
        invoke: async () => {
            if (
                this.cnaMolecularProfileIds.length === 0 ||
                this.input.plotsSelectedGenes.result!.length === 0
            ) {
                return [];
            }
            const entrezGeneIds = this.input.plotsSelectedGenes.result!.map(
                (gene: Gene) => gene.entrezGeneId
            );
            const promises = _.map(
                this.studyToMolecularProfileDiscreteCna.result,
                (cnaMolecularProfile, studyId) =>
                    getClient().fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(
                        {
                            discreteCopyNumberEventType: 'HOMDEL_AND_AMP',
                            discreteCopyNumberFilter: {
                                entrezGeneIds,
                                sampleListId: `${studyId}_all`,
                            } as DiscreteCopyNumberFilter,
                            molecularProfileId:
                                cnaMolecularProfile.molecularProfileId,
                            projection: 'DETAILED',
                        }
                    )
            );
            return Promise.all(promises).then((cnaData: any[]) =>
                _.flattenDeep(cnaData)
            );
        },
    });

    readonly discreteCopyNumberAlterations = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [
            this.discreteCopyNumberAlterations_preload,
            this.input.filteredSampleKeyToSample,
        ],
        invoke: async () => {
            if (
                this.discreteCopyNumberAlterations_preload.result!.length === 0
            ) {
                return [];
            }
            return Promise.resolve(
                this.discreteCopyNumberAlterations_preload.result!.filter(
                    dcna =>
                        dcna.uniqueSampleKey in
                        this.input.filteredSampleKeyToSample.result!
                )
            );
        },
    });

    @computed get sampleIdAndEntrezIdToDiscreteCopyNumberData() {
        return _.keyBy(
            this.discreteCopyNumberAlterations.result,
            (d: DiscreteCopyNumberData) => createDiscreteCopyNumberDataKey(d)
        );
    }

    readonly discreteCNAMolecularData = remoteData<
        CustomDriverNumericGeneMolecularData[]
    >({
        await: () => [this.molecularData],
        invoke: () => {
            const cnaData = _.filter(
                this.molecularData.result as any,
                (d: any) =>
                    _.includes(
                        this.cnaMolecularProfileIds,
                        d.molecularProfileId
                    )
            );
            _.forEach(cnaData, (d: any) => {
                const key = createDiscreteCopyNumberDataKey(d);
                const datum =
                    key in this.sampleIdAndEntrezIdToDiscreteCopyNumberData
                        ? this.sampleIdAndEntrezIdToDiscreteCopyNumberData[key]
                        : undefined;
                d.driverFilter = datum ? datum.driverFilter : '';
                d.driverFilterAnnotation = datum
                    ? datum.driverFilterAnnotation
                    : '';
                d.driverTiersFilter = datum ? datum.driverTiersFilter : '';
                d.driverTiersFilterAnnotation = datum
                    ? datum.driverTiersFilterAnnotation
                    : '';
            });
            return Promise.resolve(
                cnaData as CustomDriverNumericGeneMolecularData[]
            );
        },
    });

    // ─── Numeric Molecular Data ──────────────────────────────────────────────

    readonly molecularData_preload = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.input.plotsSelectedGenes,
            this.input.studies,
            this.input.molecularProfiles,
        ],
        invoke: async () => {
            const profilesWithoutMutationProfile = excludeSpecialMolecularProfiles(
                this.input.molecularProfiles.result!
            );
            const genes = this.input.plotsSelectedGenes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != null &&
                genes.length
            ) {
                const molecularProfileIds = profilesWithoutMutationProfile.map(
                    p => p.molecularProfileId
                );
                const numSamples = _.sumBy(
                    this.input.studies.result!,
                    s => s.allSampleCount
                );
                const {
                    geneChunks,
                    profileChunks,
                } = getGeneAndProfileChunksForRequest(
                    1500000,
                    numSamples,
                    genes,
                    molecularProfileIds
                );

                const dataPromises: Promise<NumericGeneMolecularData[]>[] = [];
                geneChunks.forEach(geneChunk => {
                    profileChunks.forEach(profileChunk => {
                        dataPromises.push(
                            getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                                {
                                    projection:
                                        REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                                    molecularDataMultipleStudyFilter: {
                                        entrezGeneIds: geneChunk.map(
                                            g => g.entrezGeneId
                                        ),
                                        molecularProfileIds: profileChunk,
                                    } as MolecularDataMultipleStudyFilter,
                                }
                            )
                        );
                    });
                });
                return _.flatten(await Promise.all(dataPromises));
            }
            return [];
        },
        default: [],
    });

    readonly molecularData = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.input.filteredSampleKeyToSample,
            this.molecularData_preload,
            this.input.plotsSelectedGenes,
            this.input.molecularProfiles,
        ],
        invoke: () => {
            const sampleKeys = this.input.filteredSampleKeyToSample.result!;
            return Promise.resolve(
                this.molecularData_preload.result!.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    // ─── Driver Annotation Chain ─────────────────────────────────────────────

    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () =>
            fetchHotspotsData(
                this.mutations,
                undefined,
                this.input.genomeNexusInternalClient
            ),
        onError: () => {},
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
        onError: () => {},
    });

    public readonly isHotspotForOncoprint = remoteData<
        ((m: Mutation) => boolean) | Error
    >({
        invoke: () => makeIsHotspotForOncoprint(this.indexedHotspotData),
        onError: () => {},
    });

    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            await: () => [this.mutations],
            invoke: async () =>
                fetchVariantAnnotationsIndexedByGenomicLocation(
                    concatMutationData(this.mutations),
                    [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY],
                    getServerConfig().genomenexus_isoform_override_source,
                    this.input.genomeNexusClient
                ),
            onError: () => {},
        },
        undefined
    );

    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.mutations,
                this.input.oncoKbAnnotatedGenes,
                this.indexedVariantAnnotations,
            ],
            invoke: async () =>
                fetchOncoKbDataForOncoprint(
                    this.input.oncoKbAnnotatedGenes,
                    this.mutations,
                    this.indexedVariantAnnotations.result
                ),
            onError: () => {},
        },
        ONCOKB_DEFAULT
    );

    readonly oncoKbMutationAnnotationForOncoprint = remoteData<
        Error | ((mutation: Mutation) => IndicatorQueryResp | undefined)
    >({
        await: () => [
            this.oncoKbDataForOncoprint,
            this.indexedVariantAnnotations,
        ],
        invoke: () =>
            makeGetOncoKbMutationAnnotationForOncoprint(
                this.oncoKbDataForOncoprint,
                this.indexedVariantAnnotations.result
            ),
        onError: () => {},
    });

    readonly getMutationPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.input.driverAnnotationSettings.oncoKb) {
                toAwait.push(this.oncoKbMutationAnnotationForOncoprint);
            }
            if (this.input.driverAnnotationSettings.hotspots) {
                toAwait.push(this.isHotspotForOncoprint);
            }
            return toAwait;
        },
        invoke: () => {
            return Promise.resolve((mutation: Mutation): {
                oncoKb: string;
                hotspots: boolean;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const annotationFn = this.oncoKbMutationAnnotationForOncoprint
                    .result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    this.input.driverAnnotationSettings.oncoKb &&
                    annotationFn &&
                    !(annotationFn instanceof Error) &&
                    annotationFn(mutation);

                const isHotspotDriver =
                    this.input.driverAnnotationSettings.hotspots &&
                    !(this.isHotspotForOncoprint.result instanceof Error) &&
                    this.isHotspotForOncoprint.result!(mutation);

                return evaluatePutativeDriverInfoWithHotspots(
                    mutation,
                    oncoKbDatum,
                    this.input.driverAnnotationSettings.customBinary,
                    this.input.driverAnnotationSettings.driverTiers,
                    {
                        hotspotDriver: isHotspotDriver,
                        hotspotAnnotationsActive: this.input
                            .driverAnnotationSettings.hotspots,
                    }
                );
            });
        },
        onError: () => {},
    });

    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.input.oncoKbAnnotatedGenes,
                this.discreteCNAMolecularData,
            ],
            invoke: async () =>
                fetchCnaOncoKbDataForOncoprint(
                    this.input.oncoKbAnnotatedGenes,
                    this.discreteCNAMolecularData
                ),
        },
        ONCOKB_DEFAULT
    );

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<
        | Error
        | ((data: NumericGeneMolecularData) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.cnaOncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbCnaAnnotationForOncoprint(
                this.cnaOncoKbDataForOncoprint,
                this.input.driverAnnotationSettings.oncoKb
            ),
    });

    readonly getDiscreteCNAPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.input.driverAnnotationSettings.oncoKb) {
                toAwait.push(this.getOncoKbCnaAnnotationForOncoprint);
            }
            return toAwait;
        },
        invoke: () =>
            Promise.resolve((cnaDatum: NumericGeneMolecularData): {
                oncoKb: string;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const customCnaDatum = cnaDatum as CustomDriverNumericGeneMolecularData;
                const annotationFn = this.getOncoKbCnaAnnotationForOncoprint
                    .result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    this.input.driverAnnotationSettings.oncoKb &&
                    annotationFn &&
                    !(annotationFn instanceof Error) &&
                    annotationFn(customCnaDatum);

                return evaluatePutativeDriverInfo(
                    customCnaDatum,
                    oncoKbDatum,
                    this.input.driverAnnotationSettings.customBinary,
                    this.input.driverAnnotationSettings.driverTiers
                );
            }),
    });

    // ─── Caches ──────────────────────────────────────────────────────────────

    private _numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            const dqf = this.molecularProfileIdToDataQueryFilter.result![
                q.molecularProfileId
            ];
            const hasSampleSpec =
                dqf &&
                ((dqf.sampleIds && dqf.sampleIds.length) || dqf.sampleListId);
            if (hasSampleSpec) {
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: q.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: [q.entrezGeneId],
                            ...dqf,
                        } as MolecularDataFilter,
                    }
                );
            }
            return Promise.resolve([]);
        },
    }));

    public numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [
            this._numericGeneMolecularDataCache.get(q),
            this.input.filteredSampleKeyToSample,
        ],
        invoke: () => {
            const data = this._numericGeneMolecularDataCache.get(q).result!;
            return Promise.resolve(
                data.filter(
                    d =>
                        d.uniqueSampleKey in
                        this.input.filteredSampleKeyToSample.result!
                )
            );
        },
    }));

    public annotatedCnaCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedNumericGeneMolecularData[]
    >(q => ({
        await: () =>
            this.numericGeneMolecularDataCache.await(
                [
                    this.studyToMolecularProfileDiscreteCna,
                    this.getDiscreteCNAPutativeDriverInfo,
                    this.input.entrezGeneIdToGene,
                ],
                studyToMolecularProfileDiscrete =>
                    _.values(studyToMolecularProfileDiscrete).map(p => ({
                        entrezGeneId: q.entrezGeneId,
                        molecularProfileId: p.molecularProfileId,
                    }))
            ),
        invoke: () => {
            const cnaData = _.flatten(
                this.numericGeneMolecularDataCache
                    .getAll(
                        _.values(
                            this.studyToMolecularProfileDiscreteCna.result!
                        ).map(p => ({
                            entrezGeneId: q.entrezGeneId,
                            molecularProfileId: p.molecularProfileId,
                        }))
                    )
                    .map(p => p.result!)
            ) as CustomDriverNumericGeneMolecularData[];
            const filteredAndAnnotatedReport = filterAndAnnotateMolecularData(
                cnaData,
                this.getDiscreteCNAPutativeDriverInfo.result!,
                this.input.entrezGeneIdToGene.result!
            );
            return Promise.resolve(
                filteredAndAnnotatedReport.data.concat(
                    filteredAndAnnotatedReport.vus
                )
            );
        },
    }));

    public mutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        Mutation[]
    >(q => ({
        await: () => [
            this.studyToMutationMolecularProfile,
            this.input.studyToDataQueryFilter,
        ],
        invoke: async () =>
            _.flatten(
                await Promise.all(
                    Object.keys(
                        this.studyToMutationMolecularProfile.result!
                    ).map(studyId => {
                        const molecularProfileId = this
                            .studyToMutationMolecularProfile.result![studyId]
                            .molecularProfileId;
                        const dataQueryFilter = this.input
                            .studyToDataQueryFilter.result![studyId];

                        if (
                            !dataQueryFilter ||
                            (_.isEmpty(dataQueryFilter.sampleIds) &&
                                !dataQueryFilter.sampleListId)
                        ) {
                            return Promise.resolve([]);
                        }

                        if (molecularProfileId) {
                            return getClient().fetchMutationsInMolecularProfileUsingPOST(
                                {
                                    molecularProfileId,
                                    mutationFilter: {
                                        entrezGeneIds: [q.entrezGeneId],
                                        ...dataQueryFilter,
                                    } as MutationFilter,
                                    projection:
                                        REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                                }
                            );
                        }
                        return Promise.resolve([]);
                    })
                )
            ),
    }));

    public annotatedMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >(q => ({
        await: () => [
            this.mutationCache.get(q),
            this.getMutationPutativeDriverInfo,
            this.input.entrezGeneIdToGene,
        ],
        invoke: () => {
            const filteredAndAnnotatedReport = filterAndAnnotateMutations(
                this.mutationCache.get(q).result!,
                this.getMutationPutativeDriverInfo.result!,
                this.input.entrezGeneIdToGene.result!
            );
            return Promise.resolve(
                filteredAndAnnotatedReport.data
                    .concat(filteredAndAnnotatedReport.vus)
                    .concat(filteredAndAnnotatedReport.germline)
            );
        },
    }));

    public structuralVariantCache = new MobxPromiseCache<
        { entrezGeneId: number },
        StructuralVariant[]
    >(q => ({
        await: () => [
            this.studyToStructuralVariantMolecularProfile,
            this.input.studyToDataQueryFilter,
            this.input.samplesForSVQueries,
        ],
        invoke: async () => {
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result!;

            if (_.isEmpty(studyIdToProfileMap)) {
                return Promise.resolve([]);
            }

            const filters = this.input.samplesForSVQueries.result!.reduce(
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
                [] as StructuralVariantFilter['sampleMolecularIdentifiers']
            );

            if (_.isEmpty(filters)) {
                return [];
            }

            return this.input.internalClient.fetchStructuralVariantsUsingPOST({
                structuralVariantFilter: {
                    entrezGeneIds: [q.entrezGeneId],
                    sampleMolecularIdentifiers: filters,
                } as StructuralVariantFilter,
            });
        },
    }));

    readonly genesetMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenesetMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    readonly genericAssayMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenericAssayMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });
}
