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
    ExtendedClinicalAttribute,
    fetchPatients,
    getExtendsClinicalAttributesFromCustomData,
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

export class PatientViewPlotsStore {
    constructor(
        private appStore: AppStore,
        private urlWrapper: PatientViewUrlWrapper,
        protected patientViewPageStore: PatientViewPageStore
    ) {
        makeObservable(this);
    }

    @observable cohortSelection: CohortOptions = CohortOptions.WholeStudy;

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

    public readonly sampleSetByKey = remoteData({
        await: () => [this.allSamplesInStudy],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(
                    this.allSamplesInStudy.result!,
                    sample => sample.uniqueSampleKey
                )
            );
        },
    });

    readonly filteredSamplesByDetailedCancerType = remoteData<{
        [cancerType: string]: Sample[];
    }>({
        await: () => [
            this.allSamplesInStudy,
            this.clinicalDataForAllSamplesInStudy,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForAllSamplesInStudy.result,
                this.allSamplesInStudy.result!,
                'CANCER_TYPE'
            );
            if (_.size(groupedSamples) === 1) {
                groupedSamples = this.groupSamplesByCancerType(
                    this.clinicalDataForAllSamplesInStudy.result,
                    this.allSamplesInStudy.result!,
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
            this.allSamplesInStudy,
            this.clinicalDataForAllSamplesInStudy,
            this.patientViewPageStore.clinicalDataForSamples,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForAllSamplesInStudy.result,
                this.allSamplesInStudy.result!,
                'CANCER_TYPE'
            );
            const highlightedCancerTypes = _(
                this.patientViewPageStore.clinicalDataForSamples.result
            )
                .filter(d => d.clinicalAttributeId === 'CANCER_TYPE')
                .map(d => d.value)
                .value();
            if (highlightedCancerTypes.length > 0) {
                return Promise.resolve(
                    _.flatMap(highlightedCancerTypes, t => groupedSamples[t])
                );
            }
            return Promise.resolve([]);
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
            this.allSamplesInStudy,
            this.clinicalDataForAllSamplesInStudy,
            this.patientViewPageStore.clinicalDataForSamples,
        ],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForAllSamplesInStudy.result,
                this.allSamplesInStudy.result!,
                'CANCER_TYPE_DETAILED'
            );
            const highlightedCancerTypes = _(
                this.patientViewPageStore.clinicalDataForSamples.result
            )
                .filter(d => d.clinicalAttributeId === 'CANCER_TYPE_DETAILED')
                .map(d => d.value)
                .value();
            if (highlightedCancerTypes.length > 0) {
                return Promise.resolve(
                    _.flatMap(highlightedCancerTypes, t => groupedSamples[t])
                );
            }
            return Promise.resolve([]);
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

    readonly molecularProfileIdSuffixToMolecularProfiles = remoteData<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.patientViewPageStore.molecularProfilesInStudy],
            invoke: () => {
                return Promise.resolve(
                    _.groupBy(
                        this.patientViewPageStore.molecularProfilesInStudy
                            .result,
                        molecularProfile =>
                            getSuffixOfMolecularProfile(molecularProfile)
                    )
                );
            },
        },
        {}
    );

    readonly clinicalAttributes = remoteData({
        await: () => [],
        invoke: async () => {
            return _.uniqBy(
                await getClient().fetchClinicalAttributesUsingPOST({
                    studyIds: [this.patientViewPageStore.studyId],
                }),
                clinicalAttribute =>
                    `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`
            );
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
        await: () => [this.patientViewPageStore.molecularProfilesInStudy],
        invoke: () => {
            return Promise.resolve(
                this.patientViewPageStore.molecularProfilesInStudy.result.filter(
                    profile =>
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                )
            );
        },
        default: [],
    });

    readonly sampleMap = remoteData({
        await: () => [this.selectedCohortSamples],
        invoke: () => {
            return Promise.resolve(
                ComplexKeyMap.from(this.selectedCohortSamples.result!, s => ({
                    studyId: s.studyId,
                    sampleId: s.sampleId,
                }))
            );
        },
    });

    readonly customAttributes = remoteData({
        await: () => [this.sampleMap],
        invoke: async () => {
            let ret: ExtendedClinicalAttribute[] = [];
            if (this.appStore.isLoggedIn) {
                try {
                    //Add custom data from user profile
                    const customChartSessions = await sessionServiceClient.getCustomDataForStudies(
                        [this.patientViewPageStore.studyId]
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

    readonly queriedPhysicalStudyIds = remoteData({
        // await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            return Promise.resolve([this.patientViewPageStore.studyId]);
        },
    });

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
        await: () => [this.patientViewPageStore.studyIdToMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.patientViewPageStore.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.MUTATION_EXTENDED
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly studyToMolecularProfileDiscreteCna = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.patientViewPageStore.molecularProfilesInStudy],
            invoke: async () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const molecularProfile of this.patientViewPageStore
                    .molecularProfilesInStudy.result) {
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

    readonly patientKeyToFilteredSamples = remoteData({
        await: () => [this.allSamplesInStudy],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.allSamplesInStudy.result!,
                    sample => sample.uniquePatientKey
                )
            );
        },
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

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.patientViewPageStore.studyIdToMolecularProfiles],
        invoke: () => {
            // TODO: Cleanup once fusions are removed from database
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.patientViewPageStore.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                    [DataTypeConstants.FUSION, DataTypeConstants.SV]
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly allPatientsInStudy = remoteData({
        await: () => [this.allSamplesInStudy],
        invoke: () => fetchPatients(this.allSamplesInStudy.result!),
        default: [],
    });

    readonly selectedCohortPatients = remoteData({
        await: () => [this.selectedCohortSamples],
        invoke: () => fetchPatients(this.selectedCohortSamples.result!),
        default: [],
    });

    readonly genePanelDataForAllProfiles = remoteData<GenePanelData[]>({
        // fetch all gene panel data for profiles
        // We do it this way - fetch all data for profiles, then filter based on samples -
        //  because
        //  (1) this means sending less data as parameters
        //  (2) this means the requests can be cached on the server based on the molecular profile id
        //  (3) We can initiate the gene panel data call before the samples call completes, thus
        //      putting more response waiting time in parallel
        await: () => [this.patientViewPageStore.molecularProfilesInStudy],
        invoke: () =>
            getClient().fetchGenePanelDataInMultipleMolecularProfilesUsingPOST({
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: this.patientViewPageStore.molecularProfilesInStudy.result.map(
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
                    this.patientViewPageStore.getDiscreteCNAPutativeDriverInfo,
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
                this.patientViewPageStore.getDiscreteCNAPutativeDriverInfo
                    .result!,
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

    readonly selectedCohortSamples = remoteData({
        await: () => [
            this.allSamplesInStudy,
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
            } else {
                return this.allSamplesInStudy.result!;
            }
        },
    });

    readonly selectedCohortSampleMap = remoteData({
        await: () => [
            this.filteredSampleKeyToSample,
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
            } else {
                return this.filteredSampleKeyToSample.result!;
            }
        },
    });

    public numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [
            this._numericGeneMolecularDataCache.get(q),
            this.selectedCohortSampleMap,
        ],
        invoke: () => {
            const data = this._numericGeneMolecularDataCache.get(q).result!;
            return Promise.resolve(
                data.filter(
                    d =>
                        d.uniqueSampleKey in
                        this.selectedCohortSampleMap.result!
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
            this.patientViewPageStore.molecularProfilesInStudy,
            this.studyToDataQueryFilter,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: IDataQueryFilter } = {};
            for (const molecularProfile of this.patientViewPageStore
                .molecularProfilesInStudy.result!) {
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
            ],
            invoke: () => {
                const studies = [this.patientViewPageStore.studyId];
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
            _.map(this.allSamplesInStudy.result, sample => {
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

    readonly filteredSampleKeyToSample = remoteData({
        await: () => [this.allSamplesInStudy],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.allSamplesInStudy.result!, s => s.uniqueSampleKey)
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

    public annotatedMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >(q => ({
        await: () => [
            this.mutationCache.get(q),
            this.patientViewPageStore.getMutationPutativeDriverInfo,
            this.entrezGeneIdToGeneAll,
        ],
        invoke: () => {
            const filteredAndAnnotatedReport = filterAndAnnotateMutations(
                this.mutationCache.get(q).result!,
                this.patientViewPageStore.getMutationPutativeDriverInfo.result!,
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

            const filters = this.allSamplesInStudy.result.reduce(
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

    readonly allSamplesInStudy = remoteData<Sample[]>({
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

    readonly clinicalDataForAllSamplesInStudy = remoteData(
        {
            await: () => [this.allSamplesInStudy],
            invoke: () => {
                const identifiers = this.allSamplesInStudy.result.map(
                    (sample: Sample) => ({
                        entityId: sample.sampleId,
                        studyId: sample.studyId,
                    })
                );
                const clinicalDataMultiStudyFilter = {
                    identifiers,
                } as ClinicalDataMultiStudyFilter;
                return fetchClinicalData(clinicalDataMultiStudyFilter);
            },
        },
        []
    );

    readonly coverageInformationForAllSamples = remoteData<CoverageInformation>(
        {
            await: () => [
                this.genePanelDataForAllProfiles,
                this.sampleSetByKey,
                this.allPatientsInStudy,
                this.plotsSelectedGenes,
            ],
            invoke: () =>
                getCoverageInformation(
                    this.genePanelDataForAllProfiles.result!,
                    this.sampleSetByKey.result!,
                    this.allPatientsInStudy.result!,
                    this.plotsSelectedGenes.result!
                ),
        }
    );

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

    readonly filteredPatientKeyToPatient = remoteData({
        await: () => [this.allPatientsInStudy],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.allPatientsInStudy.result, p => p.uniquePatientKey)
            ),
    });

    public clinicalDataCache = new ClinicalDataCache(
        this.selectedCohortSamples,
        this.selectedCohortPatients,
        this.studyToMutationMolecularProfile,
        this.patientViewPageStore.studyIdToStudy,
        this.patientViewPageStore.coverageInformation,
        this.filteredSampleKeyToSample,
        this.filteredPatientKeyToPatient,
        this.customAttributes
    );
}
