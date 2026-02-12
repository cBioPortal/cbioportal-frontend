import _ from 'lodash';
import {
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    GenePanelData,
    MolecularProfile,
    Mutation,
    MutationFilter,
    NumericGeneMolecularData,
    Sample,
    GenericAssayMeta,
    MolecularDataFilter,
    Gene,
    Geneset,
    GenePanelDataMultipleStudyFilter,
    StructuralVariant,
    StudyViewFilter,
    MolecularProfileFilter,
    MutationMultipleStudyFilter,
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    MolecularDataMultipleStudyFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import { computed, observable, action, makeObservable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchClinicalData,
    filterAndAnnotateMolecularData,
    filterAndAnnotateMutations,
    IDataQueryFilter,
    generateDataQueryFilter,
    evaluatePutativeDriverInfoWithHotspots,
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
import { AppStore } from '../../../AppStore';
import { getFilteredMolecularProfilesByAlterationType } from 'pages/studyView/StudyViewUtils';
import {
    AlterationTypeConstants,
    DataTypeConstants,
    REQUEST_ARG_ENUM,
} from 'shared/constants';
import { fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { StructuralVariantFilter } from 'cbioportal-ts-api-client';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import {
    createDiscreteCopyNumberDataKey,
    excludeSpecialMolecularProfiles,
    ExtendedClinicalAttribute,
    fetchPatients,
    getExtendsClinicalAttributesFromCustomData,
    getGeneAndProfileChunksForRequest,
    parseGenericAssayGroups,
} from 'pages/resultsView/ResultsViewPageStoreUtils';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import {
    buildDriverAnnotationSettings,
    DriverAnnotationSettings,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { parseSamplesSpecifications } from 'pages/resultsView/ResultsViewPageHelpers';
import { SamplesSpecificationElement } from 'pages/studyView/StudyViewPageStore';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import ClinicalDataCache from 'shared/cache/ClinicalDataCache';
import GenesetMolecularDataCache from 'shared/cache/GenesetMolecularDataCache';
import GenericAssayMolecularDataCache from 'shared/cache/GenericAssayMolecularDataCache';
import GenesetCache from 'shared/cache/GenesetCache';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import sessionServiceClient from '../../../shared/api/sessionServiceInstance';
import { PatientViewPageStore } from './PatientViewPageStore';
import { CohortOptions } from 'shared/components/plots/CohortSelector';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    IHotspotIndex,
    indexHotspotsData,
    IOncoKbData,
} from 'cbioportal-utils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';

export enum SampleListCategoryType {
    'w_mut' = 'w_mut',
    'w_cna' = 'w_cna',
    'w_mut_cna' = 'w_mut_cna',
}

export const SampleListCategoryTypeToFullId = {
    [SampleListCategoryType.w_mut]: 'all_cases_with_mutation_data',
    [SampleListCategoryType.w_cna]: 'all_cases_with_cna_data',
    [SampleListCategoryType.w_mut_cna]: 'all_cases_with_mutation_and_cna_data',
};

export function getUniqueStudyIds(cohortIds: string[]) {
    return _.uniq(
        _.map(cohortIds, id => {
            return id.split(':')[0];
        })
    );
}

export class PatientViewPlotsStore {
    constructor(
        private appStore: AppStore,
        private urlWrapper: PatientViewUrlWrapper,
        protected patientViewPageStore: PatientViewPageStore
    ) {
        makeObservable(this);
    }

    @observable cohortSelection: CohortOptions =
        this.patientViewPageStore.patientIdsInCohort.length > 0
            ? CohortOptions.WholeCohort
            : CohortOptions.WholeStudy;

    @observable
    driverAnnotationSettings: DriverAnnotationSettings = buildDriverAnnotationSettings(
        () => false
    );

    readonly allGenes = remoteData({
        invoke: () => {
            return getClient().getAllGenesUsingGET({
                projection: 'SUMMARY',
            });
        },
    });

    readonly allHugoGeneSymbols = remoteData<string[]>({
        await: () => [this.allGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                this.allGenes.result!.map(g => g.hugoGeneSymbol)
            );
        },
        default: [],
    });

    readonly entrezGeneIdToGeneAll = remoteData<{
        [entrezGeneId: string]: Gene;
    }>({
        await: () => [this.allGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.allGenes.result!, g => g.entrezGeneId)
            );
        },
    });

    @action.bound
    public handleCohortChange(cohort: { value: CohortOptions; label: string }) {
        this.cohortSelection = cohort.value;
    }

    readonly clinicalDataForSamplesInCohort = remoteData(
        {
            await: () => [this.samplesInCohort],
            invoke: async () => {
                if (this.samplesInCohort.result.length > 0) {
                    const identifiers = this.samplesInCohort.result.map(
                        (sample: Sample) => ({
                            entityId: sample.sampleId,
                            studyId: sample.studyId,
                        })
                    );
                    const clinicalDataMultiStudyFilter = {
                        identifiers,
                    } as ClinicalDataMultiStudyFilter;
                    return fetchClinicalData(clinicalDataMultiStudyFilter);
                }
                return [];
            },
        },
        []
    );

    readonly filteredSamplesByDetailedCancerType = remoteData<{
        [cancerType: string]: Sample[];
    }>({
        await: () => [
            this.samplesInCohort,
            this.clinicalDataForSamplesInCohort,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForSamplesInCohort.result,
                this.samplesInCohort.result!,
                'CANCER_TYPE'
            );
            if (_.size(groupedSamples) === 1) {
                groupedSamples = this.groupSamplesByCancerType(
                    this.clinicalDataForSamplesInCohort.result,
                    this.samplesInCohort.result!,
                    'CANCER_TYPE_DETAILED'
                );
            }
            return Promise.resolve(groupedSamples);
        },
    });

    readonly highlightedCancerTypes = remoteData<string[]>({
        await: () => [this.patientViewPageStore.clinicalDataForSamples],
        invoke: () => {
            const highlightedCancerTypes = _(
                this.patientViewPageStore.clinicalDataForSamples.result
            )
                .filter(d => d.clinicalAttributeId === 'CANCER_TYPE')
                .map(d => d.value)
                .value();
            return Promise.resolve(highlightedCancerTypes);
        },
        default: [],
    });

    readonly samplesWithSameCancerTypeAsHighlighted = remoteData<Sample[]>({
        await: () => [
            this.samplesInCohort,
            this.clinicalDataForSamplesInCohort,
            this.highlightedCancerTypes,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForSamplesInCohort.result,
                this.samplesInCohort.result!,
                'CANCER_TYPE'
            );
            return Promise.resolve(
                _.flatMap(
                    this.highlightedCancerTypes.result,
                    t => groupedSamples[t]
                )
            );
        },
    });

    readonly highlightedDetailedCancerTypes = remoteData<string[]>({
        await: () => [this.patientViewPageStore.clinicalDataForSamples],
        invoke: () => {
            const highlightedCancerTypes = _(
                this.patientViewPageStore.clinicalDataForSamples.result
            )
                .filter(d => d.clinicalAttributeId === 'CANCER_TYPE_DETAILED')
                .map(d => d.value)
                .value();
            return Promise.resolve(highlightedCancerTypes);
        },
        default: [],
    });

    readonly samplesWithSameCancerTypeDetailedAsHighlighted = remoteData<
        Sample[]
    >({
        await: () => [
            this.samplesInCohort,
            this.clinicalDataForSamplesInCohort,
            this.highlightedDetailedCancerTypes,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForSamplesInCohort.result,
                this.samplesInCohort.result!,
                'CANCER_TYPE_DETAILED'
            );
            return Promise.resolve(
                _.flatMap(
                    this.highlightedDetailedCancerTypes.result,
                    t => groupedSamples[t]
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

    readonly studySpecificSamples = remoteData<Sample[]>({
        await: () => [this.clinicalAttributes],
        invoke: () => {
            let studyViewFilter: StudyViewFilter = {} as any;
            studyViewFilter.studyIds = [this.patientViewPageStore.studyId];

            return this.patientViewPageStore.internalClient.fetchFilteredSamplesUsingPOST(
                {
                    studyViewFilter: studyViewFilter,
                }
            );
        },
        default: [],
    });

    readonly cohortStudyIdsToStudy = remoteData(
        {
            await: () => [this.cohortStudies],
            invoke: () => {
                return Promise.resolve(
                    _.keyBy(this.cohortStudies.result, x => x.studyId)
                );
            },
        },
        {}
    );

    readonly cohortStudies = remoteData(
        {
            await: () => [this.cohortStudyIds],
            invoke: async () => {
                if (this.cohortStudyIds.result.length > 0) {
                    return getClient().fetchStudiesUsingPOST({
                        studyIds: this.cohortStudyIds.result,
                        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    });
                }
                return [];
            },
        },
        []
    );

    readonly cohortStudyIds = remoteData({
        invoke: () => {
            if (this.patientViewPageStore.patientIdsInCohort.length > 0) {
                return Promise.resolve(
                    getUniqueStudyIds(
                        this.patientViewPageStore.patientIdsInCohort
                    )
                );
            } else {
                return Promise.resolve([this.patientViewPageStore.studyId]);
            }
        },
        default: [],
    });

    readonly samplesInCohort = remoteData<Sample[]>({
        await: () => [this.cohortStudyIds],
        invoke: async () => {
            if (this.cohortStudyIds.result.length > 0) {
                let studyViewFilter: StudyViewFilter = {} as any;
                studyViewFilter.studyIds = this.cohortStudyIds.result;

                return this.patientViewPageStore.internalClient.fetchFilteredSamplesUsingPOST(
                    {
                        studyViewFilter: studyViewFilter,
                    }
                );
            }
            return [];
        },
        default: [],
    });

    readonly sampleIdsInCohort = remoteData<string[]>({
        await: () => [this.samplesInCohort],
        invoke: async () => {
            return this.samplesInCohort.result.map(s => s.sampleId);
        },
        default: [],
    });

    readonly selectedReferenceCohortSamples = remoteData({
        await: () => [
            this.samplesInCohort,
            this.studySpecificSamples,
            this.samplesWithSameCancerTypeAsHighlighted,
            this.samplesWithSameCancerTypeDetailedAsHighlighted,
        ],
        invoke: async () => {
            if (this.cohortSelection === CohortOptions.CancerType) {
                return this.samplesWithSameCancerTypeAsHighlighted.result!;
            } else if (
                this.cohortSelection === CohortOptions.CancerTypeDetailed
            ) {
                return this.samplesWithSameCancerTypeDetailedAsHighlighted
                    .result!;
            } else if (this.cohortSelection === CohortOptions.WholeStudy) {
                return this.studySpecificSamples.result;
            } else {
                return this.samplesInCohort.result!;
            }
        },
    });

    readonly molecularProfilesInCohortStudies = remoteData<MolecularProfile[]>(
        {
            await: () => [this.cohortStudyIds],
            invoke: async () => {
                if (this.cohortStudyIds.result.length > 0) {
                    return await getClient().fetchMolecularProfilesUsingPOST({
                        molecularProfileFilter: {
                            studyIds: this.cohortStudyIds.result,
                        } as MolecularProfileFilter,
                    });
                }
                return [];
            },
        },
        []
    );

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInCohortStudies],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInCohortStudies.result.reduce(
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

    readonly molecularProfileIdSuffixToMolecularProfiles = remoteData<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.molecularProfilesInCohortStudies],
            invoke: () => {
                return Promise.resolve(
                    _.groupBy(
                        this.molecularProfilesInCohortStudies.result,
                        molecularProfile =>
                            getSuffixOfMolecularProfile(molecularProfile)
                    )
                );
            },
        },
        {}
    );

    readonly studyIdToMolecularProfiles = remoteData({
        await: () => [this.molecularProfilesInCohortStudies],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.molecularProfilesInCohortStudies.result!,
                    molecularProfile => molecularProfile.studyId
                )
            );
        },
        onError: error => {},
        default: {},
    });

    readonly clinicalAttributes = remoteData({
        await: () => [this.cohortStudyIds],
        invoke: async () => {
            if (this.cohortStudyIds.result.length > 0) {
                return _.uniqBy(
                    await getClient().fetchClinicalAttributesUsingPOST({
                        studyIds: this.cohortStudyIds.result,
                    }),
                    clinicalAttribute =>
                        `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`
                );
            }
            return [];
        },
        default: [],
        onError: () => {},
    });

    readonly genesetCache = new GenesetCache();

    @computed get genesetIds() {
        return this.urlWrapper.query.geneset_list &&
            this.urlWrapper.query.geneset_list.trim().length
            ? this.urlWrapper.query.geneset_list.trim().split(/\s+/)
            : [];
    }

    readonly genesets = remoteData<Geneset[]>({
        invoke: () => {
            if (this.genesetIds && this.genesetIds.length > 0) {
                return this.patientViewPageStore.internalClient.fetchGenesetsUsingPOST(
                    {
                        genesetIds: this.genesetIds.slice(),
                    }
                );
            } else {
                return Promise.resolve([]);
            }
        },
        onResult: (genesets: Geneset[]) => {
            this.genesetCache.addData(genesets);
        },
    });

    readonly genericAssayEntitiesGroupedByProfileId = remoteData<{
        [profileId: string]: GenericAssayMeta[];
    }>({
        await: () => [this.genericAssayProfiles],
        invoke: async () => {
            return await fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId(
                this.genericAssayProfiles.result
            );
        },
    });

    readonly genericAssayProfiles = remoteData({
        await: () => [this.molecularProfilesInCohortStudies],
        invoke: () => {
            return Promise.resolve(
                this.molecularProfilesInCohortStudies.result.filter(
                    profile =>
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                )
            );
        },
        default: [],
    });

    readonly customAttributes = remoteData({
        await: () => [this.sampleMap, this.cohortStudyIds],
        invoke: async () => {
            let ret: ExtendedClinicalAttribute[] = [];
            if (this.appStore.isLoggedIn) {
                try {
                    //Add custom data from user profile
                    const customChartSessions = await sessionServiceClient.getCustomDataForStudies(
                        this.cohortStudyIds.result
                    );

                    ret = getExtendsClinicalAttributesFromCustomData(
                        customChartSessions,
                        this.sampleMap.result!
                    );
                } catch (e) {}
            }
            return ret;
        },
    });

    readonly studyToMolecularProfileDiscreteCna = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInCohortStudies],
            invoke: async () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const molecularProfile of this
                    .molecularProfilesInCohortStudies.result) {
                    if (
                        molecularProfile.datatype ===
                            DataTypeConstants.DISCRETE &&
                        molecularProfile.molecularAlterationType ===
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION
                    ) {
                        ret[molecularProfile.studyId] = molecularProfile;
                    }
                }
                return ret;
            },
        },
        {}
    );

    readonly genePanelDataForAllProfiles = remoteData<GenePanelData[]>({
        // fetch all gene panel data for profiles
        // We do it this way - fetch all data for profiles, then filter based on samples -
        //  because
        //  (1) this means sending less data as parameters
        //  (2) this means the requests can be cached on the server based on the molecular profile id
        //  (3) We can initiate the gene panel data call before the samples call completes, thus
        //      putting more response waiting time in parallel
        await: () => [this.molecularProfilesInCohortStudies],
        invoke: () =>
            getClient().fetchGenePanelDataInMultipleMolecularProfilesUsingPOST({
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: this.molecularProfilesInCohortStudies.result.map(
                        p => p.molecularProfileId
                    ),
                } as GenePanelDataMultipleStudyFilter,
            }),
    });

    @computed get selectedGenericAssayEntitiesGroupByMolecularProfileId() {
        return parseGenericAssayGroups(
            this.urlWrapper.query.generic_assay_groups || ''
        );
    }

    public annotatedCnaCache = new MobxPromiseCache<
        { entrezGeneId: number },
        CustomDriverNumericGeneMolecularData[]
    >(q => ({
        await: () =>
            this.numericGeneMolecularDataCache.await(
                [
                    this.studyToMolecularProfileDiscreteCna,
                    this.getDiscreteCNAPutativeDriverInfo,
                    this.entrezGeneIdToGeneAll,
                ],
                studyToMolecularProfileDiscrete => {
                    return _.values(studyToMolecularProfileDiscrete).map(p => ({
                        entrezGeneId: q.entrezGeneId,
                        molecularProfileId: p.molecularProfileId,
                    }));
                }
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
                this.entrezGeneIdToGeneAll.result!
            );
            const data = filteredAndAnnotatedReport.data.concat(
                filteredAndAnnotatedReport.vus
            );

            return Promise.resolve(
                filteredAndAnnotatedReport.data.concat(
                    filteredAndAnnotatedReport.vus
                )
            );
        },
    }));

    readonly getDiscreteCNAPutativeDriverInfo = remoteData({
        await: () => [this.getOncoKbCnaAnnotationForOncoprint],
        invoke: () => {
            return Promise.resolve(
                (
                    cnaDatum: CustomDriverNumericGeneMolecularData
                ): {
                    oncoKb: string;
                    customDriverBinary: boolean;
                } => {
                    const getOncoKBAnnotationFunc = this
                        .getOncoKbCnaAnnotationForOncoprint.result!;
                    const oncoKbDatum:
                        | IndicatorQueryResp
                        | undefined
                        | null
                        | false =
                        getOncoKBAnnotationFunc &&
                        !(getOncoKBAnnotationFunc instanceof Error) &&
                        getOncoKBAnnotationFunc(cnaDatum);

                    // Note: custom driver annotations are part of the incoming datum
                    return evaluatePutativeDriverInfo(
                        cnaDatum,
                        oncoKbDatum,
                        false,
                        undefined
                    );
                }
            );
        },
    });

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<
        | Error
        | ((data: NumericGeneMolecularData) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.cnaOncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbCnaAnnotationForOncoprint(
                this.cnaOncoKbDataForOncoprint,
                // this.driverAnnotationSettings.oncoKb
                true
            ),
    });

    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.patientViewPageStore.oncoKbAnnotatedGenes,
                this.discreteCNAMolecularData,
            ],
            invoke: async () =>
                fetchCnaOncoKbDataForOncoprint(
                    this.patientViewPageStore.oncoKbAnnotatedGenes,
                    this.discreteCNAMolecularData
                ),
        },
        ONCOKB_DEFAULT
    );

    readonly discreteCNAMolecularData = remoteData<
        CustomDriverNumericGeneMolecularData[]
    >({
        await: () => [this.molecularData],
        invoke: () => {
            const cnaData = _.filter(
                this.molecularData.result as any,
                (d: any) => {
                    return _.includes(
                        this.cnaMolecularProfileIds,
                        d.molecularProfileId
                    );
                }
            );
            _.forEach(cnaData, (d: any) => {
                // Lookup the DiscreteCopyNumberData datum that
                // holds the custom driver annotation.
                const discreteCopyNumberDatumKey = createDiscreteCopyNumberDataKey(
                    d
                );
                const discreteCopyNumberDatum =
                    discreteCopyNumberDatumKey in
                    this.sampleIdAndEntrezIdToDiscreteCopyNumberData
                        ? this.sampleIdAndEntrezIdToDiscreteCopyNumberData[
                              discreteCopyNumberDatumKey
                          ]
                        : undefined;

                d.driverFilter = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverFilter
                    : '';
                d.driverFilterAnnotation = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverFilterAnnotation
                    : '';
                d.driverTiersFilter = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverTiersFilter
                    : '';
                d.driverTiersFilterAnnotation = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverTiersFilterAnnotation
                    : '';
            });
            return Promise.resolve(
                cnaData as CustomDriverNumericGeneMolecularData[]
            );
        },
    });

    readonly discreteCopyNumberAlterations = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [
            this.discreteCopyNumberAlterations_preload,
            this.selectedReferenceCohortSampleMap,
        ],
        invoke: async () => {
            if (
                this.discreteCopyNumberAlterations_preload.result!.length == 0
            ) {
                return [];
            }

            return Promise.resolve(
                this.discreteCopyNumberAlterations_preload.result!.filter(
                    dcna => {
                        return (
                            dcna.uniqueSampleKey in
                            this.selectedReferenceCohortSampleMap.result!
                        );
                    }
                )
            );
        },
    });

    readonly discreteCopyNumberAlterations_preload = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [
            this.plotsSelectedGenes,
            this.studyToMolecularProfileDiscreteCna,
        ],
        invoke: async () => {
            if (this.cnaMolecularProfileIds.length == 0) {
                return [];
            }

            const entrezGeneIds = _.map(
                this.plotsSelectedGenes.result,
                (gene: Gene) => gene.entrezGeneId
            );

            const promises = _.map(
                this.studyToMolecularProfileDiscreteCna.result,
                (cnaMolecularProfile, studyId) => {
                    return getClient().fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(
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
                    );
                }
            );

            return Promise.all(promises).then((cnaData: any[]) =>
                _.flattenDeep(cnaData)
            );
        },
    });

    @computed get cnaMolecularProfileIds() {
        const profiles = this.cnaProfiles.isComplete
            ? this.cnaProfiles.result
            : [];
        const profileIds = _.map(
            profiles,
            (p: MolecularProfile) => p.molecularProfileId
        );
        return profileIds;
    }

    readonly cnaProfiles = remoteData({
        await: () => [this.molecularProfilesInCohortStudies],
        invoke: async () => {
            return this.molecularProfilesInCohortStudies.result!.filter(
                profile =>
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                    profile.datatype === DataTypeConstants.DISCRETE
            );
        },
        onError: error => {},
        default: [],
    });

    readonly molecularData = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.selectedReferenceCohortSampleMap,
            this.molecularData_preload,
            this.plotsSelectedGenes,
            this.molecularProfilesInCohortStudies,
            this.selectedReferenceCohortSamples,
        ],
        invoke: () => {
            const sampleKeys = this.selectedReferenceCohortSampleMap.result!;
            return Promise.resolve(
                this.molecularData_preload.result.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    readonly molecularData_preload = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.plotsSelectedGenes,
            this.cohortStudies,
            this.molecularProfilesInCohortStudies,
        ],
        invoke: async () => {
            // we get mutations with mutations endpoint, structural variants and fusions with structural variant endpoint, generic assay with generic assay endpoint.
            // filter out mutation genetic profile and structural variant profiles and generic assay profiles
            const profilesWithoutMutationProfile = excludeSpecialMolecularProfiles(
                this.molecularProfilesInCohortStudies.result!
            );
            const genes = this.plotsSelectedGenes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != undefined &&
                genes.length
            ) {
                const molecularProfileIds = profilesWithoutMutationProfile.map(
                    p => p.molecularProfileId
                );
                const numSamples = _.sumBy(
                    this.cohortStudies.result!,
                    s => s.allSampleCount
                );

                // if size of response is too big (around 1.6 million), the request seems to fail. This is a conservative limit
                const maximumDataPointsPerRequest = 1500000;

                const {
                    geneChunks,
                    profileChunks,
                } = getGeneAndProfileChunksForRequest(
                    maximumDataPointsPerRequest,
                    numSamples,
                    genes,
                    molecularProfileIds
                );

                const dataPromises: Promise<NumericGeneMolecularData[]>[] = [];

                geneChunks.forEach(geneChunk => {
                    profileChunks.forEach(profileChunk => {
                        const molecularDataMultipleStudyFilter = {
                            entrezGeneIds: geneChunk.map(g => g.entrezGeneId),
                            molecularProfileIds: profileChunk,
                        } as MolecularDataMultipleStudyFilter;

                        dataPromises.push(
                            getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                                {
                                    projection:
                                        REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                                    molecularDataMultipleStudyFilter,
                                }
                            )
                        );
                    });
                });

                const allData = await Promise.all(dataPromises);
                return _.flatten(allData);
            }

            return [];
        },
        default: [],
    });

    @computed get sampleIdAndEntrezIdToDiscreteCopyNumberData() {
        return _.keyBy(
            this.discreteCopyNumberAlterations.result,
            (d: DiscreteCopyNumberData) => createDiscreteCopyNumberDataKey(d)
        );
    }

    readonly patientKeyToFilteredSamples = remoteData({
        await: () => [this.samplesInCohort],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.samplesInCohort.result!,
                    sample => sample.uniquePatientKey
                )
            );
        },
    });

    readonly patientsInCohort = remoteData({
        await: () => [this.samplesInCohort],
        invoke: () => fetchPatients(this.samplesInCohort.result!),
        default: [],
    });

    readonly selectedReferenceCohortPatients = remoteData({
        await: () => [this.selectedReferenceCohortSamples],
        invoke: () =>
            fetchPatients(this.selectedReferenceCohortSamples.result!),
        default: [],
    });

    readonly sampleMap = remoteData({
        await: () => [this.selectedReferenceCohortSamples],
        invoke: () => {
            return Promise.resolve(
                ComplexKeyMap.from(
                    this.selectedReferenceCohortSamples.result!,
                    s => ({
                        studyId: s.studyId,
                        sampleId: s.sampleId,
                    })
                )
            );
        },
    });

    readonly filteredSampleKeyToSampleInCohort = remoteData({
        await: () => [this.samplesInCohort],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.samplesInCohort.result!, s => s.uniqueSampleKey)
            ),
    });

    readonly filteredStudySpecificSampleKeyToSample = remoteData({
        await: () => [this.studySpecificSamples],
        invoke: () =>
            Promise.resolve(
                _.keyBy(
                    this.studySpecificSamples.result!,
                    s => s.uniqueSampleKey
                )
            ),
    });

    readonly samplesWithSameCancerTypeAsHighlightedKeyToSample = remoteData({
        await: () => [this.samplesWithSameCancerTypeAsHighlighted],
        invoke: () =>
            Promise.resolve(
                _.keyBy(
                    this.samplesWithSameCancerTypeAsHighlighted.result!,
                    s => s.uniqueSampleKey
                )
            ),
    });

    readonly samplesWithSameCancerTypeDetailedAsHighlightedKeyToSample = remoteData(
        {
            await: () => [this.samplesWithSameCancerTypeDetailedAsHighlighted],
            invoke: () =>
                Promise.resolve(
                    _.keyBy(
                        this.samplesWithSameCancerTypeDetailedAsHighlighted
                            .result!,
                        s => s.uniqueSampleKey
                    )
                ),
        }
    );

    readonly selectedReferenceCohortSampleMap = remoteData({
        await: () => [
            this.filteredSampleKeyToSampleInCohort,
            this.filteredStudySpecificSampleKeyToSample,
            this.samplesWithSameCancerTypeAsHighlightedKeyToSample,
            this.samplesWithSameCancerTypeDetailedAsHighlightedKeyToSample,
        ],
        invoke: async () => {
            if (this.cohortSelection === CohortOptions.CancerType) {
                return this.samplesWithSameCancerTypeAsHighlightedKeyToSample
                    .result!;
            } else if (
                this.cohortSelection === CohortOptions.CancerTypeDetailed
            ) {
                return this
                    .samplesWithSameCancerTypeDetailedAsHighlightedKeyToSample
                    .result!;
            } else if (this.cohortSelection === CohortOptions.WholeStudy) {
                return this.filteredStudySpecificSampleKeyToSample.result!;
            } else {
                return this.filteredSampleKeyToSampleInCohort.result!;
            }
        },
    });

    public numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [
            this._numericGeneMolecularDataCache.get(q),
            this.selectedReferenceCohortSampleMap,
        ],
        invoke: () => {
            const data = this._numericGeneMolecularDataCache.get(q).result!;
            return Promise.resolve(
                data.filter(
                    d =>
                        d.uniqueSampleKey in
                        this.selectedReferenceCohortSampleMap.result!
                )
            );
        },
    }));

    private _numericGeneMolecularDataCache = new MobxPromiseCache<
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
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: q.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: [q.entrezGeneId],
                            ...dqf,
                        } as MolecularDataFilter,
                    }
                );
            } else {
                return Promise.resolve([]);
            }
        },
    }));

    readonly molecularProfileIdToDataQueryFilter = remoteData<{
        [molecularProfileId: string]: IDataQueryFilter;
    }>({
        await: () => [
            this.molecularProfilesInCohortStudies,
            this.studyToDataQueryFilter,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: IDataQueryFilter } = {};
            for (const molecularProfile of this.molecularProfilesInCohortStudies
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

    readonly studyToDataQueryFilter = remoteData<{
        [studyId: string]: IDataQueryFilter;
    }>(
        {
            await: () => [
                this.studyToCustomSampleList,
                this.studyToSampleListId,
                this.cohortStudyIds,
            ],
            invoke: () => {
                const studies = this.cohortStudyIds.result;
                const ret: { [studyId: string]: IDataQueryFilter } = {};
                for (const studyId of studies) {
                    ret[studyId] = generateDataQueryFilter(
                        this.studyToSampleListId.result![studyId],
                        this.studyToCustomSampleList.result![studyId]
                    );
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    readonly studyToCustomSampleList = remoteData<{
        [studyId: string]: string[];
    }>(
        {
            await: () => [this.samplesSpecification],
            invoke: () => {
                const ret: {
                    [studyId: string]: string[];
                } = {};
                for (const sampleSpec of this.samplesSpecification.result!) {
                    if (sampleSpec.sampleId) {
                        // add sample id to study
                        ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || [];
                        ret[sampleSpec.studyId].push(sampleSpec.sampleId);
                    }
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    readonly samplesSpecification = remoteData({
        invoke: async () => {
            // is this a sample list category query?
            // if YES, we need to derive the sample lists by:
            // 1. looking up all sample lists in selected studies
            // 2. using those with matching category
            if (!this.sampleListCategory) {
                return this.samplesSpecificationParams;
            } else {
                let samplesSpecifications = [];
                samplesSpecifications = this.samplesSpecificationParams;
                // get unique study ids to reduce the API requests
                const uniqueStudyIds = _.chain(samplesSpecifications)
                    .map(specification => specification.studyId)
                    .uniq()
                    .value();
                const allSampleLists = await Promise.all(
                    uniqueStudyIds.map(studyId => {
                        return getClient().getAllSampleListsInStudyUsingGET({
                            studyId: studyId,
                            projection: REQUEST_ARG_ENUM.PROJECTION_SUMMARY,
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

    @computed get sampleListCategory(): SampleListCategoryType | undefined {
        if (
            [
                SampleListCategoryType.w_mut,
                SampleListCategoryType.w_cna,
                SampleListCategoryType.w_mut_cna,
            ].includes((this.patientViewPageStore.studyId + '_all') as any)
        ) {
            return (this.patientViewPageStore.studyId +
                '_all') as SampleListCategoryType;
        } else {
            return undefined;
        }
    }

    @computed get samplesSpecificationParams() {
        return parseSamplesSpecifications(
            _.map(this.selectedReferenceCohortSamples.result, sample => {
                return sample.studyId + ':' + sample.sampleId;
            }).join('+'),
            undefined,
            this.patientViewPageStore.studyId + '_all',
            [this.patientViewPageStore.studyId]
        );
    }

    readonly studyToSampleListId = remoteData<{ [studyId: string]: string }>({
        await: () => [this.samplesSpecification],
        invoke: async () => {
            return this.samplesSpecification.result!.reduce((map, next) => {
                if (next.sampleListId) {
                    map[next.studyId] = next.sampleListId;
                }
                return map;
            }, {} as { [studyId: string]: string });
        },
    });

    public annotatedMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >(q => ({
        await: () => [
            this.mutationCache.get(q),
            this.getMutationPutativeDriverInfo,
            this.entrezGeneIdToGeneAll,
        ],
        invoke: () => {
            const filteredAndAnnotatedReport = filterAndAnnotateMutations(
                this.mutationCache.get(q).result!,
                this.getMutationPutativeDriverInfo.result!,
                this.entrezGeneIdToGeneAll.result!
            );
            const data = filteredAndAnnotatedReport.data
                .concat(filteredAndAnnotatedReport.vus)
                .concat(filteredAndAnnotatedReport.germline);

            return Promise.resolve(data);
        },
    }));

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
                        const dataQueryFilter = this.studyToDataQueryFilter
                            .result![studyId];

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
                        } else {
                            return Promise.resolve([]);
                        }
                    })
                )
            );
        },
    }));

    readonly studyToMutationMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.mutationProfiles],
            invoke: () => {
                return Promise.resolve(
                    _.keyBy(
                        this.mutationProfiles.result,
                        (profile: MolecularProfile) => profile.studyId
                    )
                );
            },
        },
        {}
    );

    readonly mutationProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.MUTATION_EXTENDED
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly getMutationPutativeDriverInfo = remoteData({
        await: () => [
            this.getOncoKbMutationAnnotationForOncoprint,
            this.isHotspotForOncoprint,
        ],
        invoke: () => {
            return Promise.resolve((mutation: Mutation): {
                oncoKb: string;
                hotspots: boolean;
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
                    getOncoKbMutationAnnotationForOncoprint &&
                    !(
                        getOncoKbMutationAnnotationForOncoprint instanceof Error
                    ) &&
                    getOncoKbMutationAnnotationForOncoprint(mutation);

                const isHotspotDriver =
                    !(this.isHotspotForOncoprint.result instanceof Error) &&
                    this.isHotspotForOncoprint.result!(mutation);

                // Note:
                // - custom driver annotations are part of the incoming datum
                // - cbio counts, and custom driver annotations are
                //   not used for driver evaluation
                return evaluatePutativeDriverInfoWithHotspots(
                    mutation,
                    oncoKbDatum,
                    false,
                    undefined,
                    {
                        hotspotAnnotationsActive: true,
                        hotspotDriver: isHotspotDriver,
                    }
                );
            });
        },
    });

    readonly getOncoKbMutationAnnotationForOncoprint = remoteData<
        Error | ((mutation: Mutation) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.oncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbMutationAnnotationForOncoprint(
                this.oncoKbDataForOncoprint
            ),
    });

    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.mutations,
                this.patientViewPageStore.oncoKbAnnotatedGenes,
            ],
            invoke: async () =>
                fetchOncoKbDataForOncoprint(
                    this.patientViewPageStore.oncoKbAnnotatedGenes,
                    this.mutations
                ),
            onError: () => {},
        },
        ONCOKB_DEFAULT
    );

    public readonly isHotspotForOncoprint = remoteData<
        ((m: Mutation) => boolean) | Error
    >({
        invoke: () => makeIsHotspotForOncoprint(this.indexedHotspotData),
        onError: () => {},
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
        onError: () => {},
    });

    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () => {
            return fetchHotspotsData(
                this.mutations,
                undefined,
                this.patientViewPageStore.genomeNexusInternalClient
            );
        },
        onError: () => {},
    });

    public structuralVariantCache = new MobxPromiseCache<
        { entrezGeneId: number },
        StructuralVariant[]
    >(q => ({
        await: () => [
            this.studyToStructuralVariantMolecularProfile,
            this.studyToDataQueryFilter,
        ],
        invoke: async () => {
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result!;

            if (_.isEmpty(studyIdToProfileMap)) {
                return Promise.resolve([]);
            }

            const filters = this.samplesInCohort.result.reduce(
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
            } else {
                return this.patientViewPageStore.internalClient.fetchStructuralVariantsUsingPOST(
                    {
                        structuralVariantFilter: {
                            entrezGeneIds: [q.entrezGeneId],
                            sampleMolecularIdentifiers: filters,
                        } as StructuralVariantFilter,
                    }
                );
            }
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

    readonly coverageInformation = remoteData<CoverageInformation>({
        await: () => [
            this.genePanelDataForAllProfiles,
            this.selectedReferenceCohortSampleMap,
            this.patientsInCohort,
            this.plotsSelectedGenes,
        ],
        invoke: () =>
            getCoverageInformation(
                this.genePanelDataForAllProfiles.result!,
                this.selectedReferenceCohortSampleMap.result!,
                this.patientsInCohort.result!,
                this.plotsSelectedGenes.result!
            ),
    });

    readonly plotsSelectedGenes = remoteData<Gene[]>({
        invoke: () => {
            let entrezIds: string[] = [];
            // gene selected in horz axis
            if (
                this.urlWrapper.query.plots_horz_selection?.selectedGeneOption
            ) {
                entrezIds.push(
                    this.urlWrapper.query.plots_horz_selection
                        .selectedGeneOption
                );
            }
            // gene selected in vert axis
            if (
                this.urlWrapper.query.plots_vert_selection?.selectedGeneOption
            ) {
                entrezIds.push(
                    this.urlWrapper.query.plots_vert_selection
                        .selectedGeneOption
                );
            }
            // gene selected in color menu
            if (
                this.urlWrapper.query.plots_coloring_selection
                    ?.selectedOption &&
                this.urlWrapper.query.plots_coloring_selection.selectedOption.match(
                    '^[0-9]*'
                )
            ) {
                // extract entrezGeneId from plot coloring selection string
                let selectedColoringGene = this.urlWrapper.query.plots_coloring_selection.selectedOption.match(
                    '^[0-9]*'
                )![0];
                entrezIds.push(selectedColoringGene);
            }
            if (entrezIds.length > 0) {
                return getClient().fetchGenesUsingPOST({
                    geneIdType: 'ENTREZ_GENE_ID',
                    geneIds: entrezIds,
                });
            }
            return Promise.resolve([]);
        },
    });

    readonly filteredPatientKeyToPatientInCohort = remoteData({
        await: () => [this.patientsInCohort],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.patientsInCohort.result, p => p.uniquePatientKey)
            ),
    });

    public clinicalDataCache = new ClinicalDataCache(
        this.selectedReferenceCohortSamples,
        this.selectedReferenceCohortPatients,
        this.studyToMutationMolecularProfile,
        this.cohortStudyIdsToStudy,
        this.coverageInformation,
        this.filteredSampleKeyToSampleInCohort,
        this.filteredPatientKeyToPatientInCohort,
        this.customAttributes
    );

    readonly mutations_preload = remoteData<Mutation[]>({
        // fetch all mutation data for profiles
        // We do it this way - fetch all data for profiles, then filter based on samples -
        //  because
        //  (1) this means sending less data as parameters
        //  (2) this means the requests can be cached on the server based on the molecular profile id
        //  (3) We can initiate the mutations call before the samples call completes, thus
        //      putting more response waiting time in parallel
        await: () => [this.plotsSelectedGenes, this.mutationProfiles],
        invoke: () => {
            if (
                this.plotsSelectedGenes.result!.length === 0 ||
                this.mutationProfiles.result!.length === 0
            ) {
                return Promise.resolve([]);
            }

            return getClient().fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    mutationMultipleStudyFilter: {
                        entrezGeneIds: this.plotsSelectedGenes.result!.map(
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
            this.selectedReferenceCohortSampleMap,
        ],
        invoke: () => {
            const sampleKeys = this.selectedReferenceCohortSampleMap.result!;
            return Promise.resolve(
                this.mutations_preload.result!.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    readonly structuralVariants = remoteData<StructuralVariant[]>({
        await: () => [
            this.plotsSelectedGenes,
            this.selectedReferenceCohortSamples,
            this.studyToStructuralVariantMolecularProfile,
            this.entrezGeneIdToGeneAll,
        ],
        invoke: async () => {
            if (
                _.isEmpty(
                    this.studyToStructuralVariantMolecularProfile.result
                ) ||
                _.isEmpty(this.plotsSelectedGenes.result)
            ) {
                return [];
            }
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result;
            const genes: Gene[] = this.plotsSelectedGenes.result!;

            const sampleMolecularIdentifiers = this.selectedReferenceCohortSamples.result!.reduce(
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

            // Filters can be an empty list. When all selected samples are coming from studies that do not have
            // structural variant profile in this case, we should not fetch structural variant data.
            if (_.isEmpty(sampleMolecularIdentifiers)) {
                return [];
            } else {
                // Set all SVs that are queried at the gene level.
                // The gene1::gene2 orientation does not come into play here.
                const entrezGeneIds = _.map(
                    this.plotsSelectedGenes.result,
                    (gene: Gene) => gene.entrezGeneId
                );
                // // Set all SVs that are queried at the gene1::gene2 orientation level.
                // const structuralVariantQueries = this.structVarQueries.map(sv =>
                //     createStructuralVariantQuery(sv, this.plotsSelectedGenes.result!)
                // );

                return await internalClient.fetchStructuralVariantsUsingPOST({
                    structuralVariantFilter: {
                        entrezGeneIds,
                        structuralVariantQueries: [],
                        sampleMolecularIdentifiers,
                        molecularProfileIds: [],
                    },
                });
            }
        },
    });

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                    [DataTypeConstants.FUSION, DataTypeConstants.SV]
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly studyToStructuralVariantMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.structuralVariantProfiles],
            invoke: () => {
                return Promise.resolve(
                    _.keyBy(
                        this.structuralVariantProfiles.result,
                        (profile: MolecularProfile) => profile.studyId
                    )
                );
            },
        },
        {}
    );
}
