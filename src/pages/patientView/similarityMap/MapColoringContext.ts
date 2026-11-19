import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    CancerStudy,
    Gene,
    MolecularProfile,
    MolecularProfileFilter,
    Patient,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import ClinicalDataCache from 'shared/cache/ClinicalDataCache';
import { PlotsTabStore } from 'shared/components/plots/PlotsTabStore';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import {
    filterAndAnnotateMolecularData,
    filterAndAnnotateMutations,
} from 'shared/lib/StoreUtils';
import {
    EmbeddingsPanelMolecularStore,
    EmbeddingsPanelStore,
} from 'shared/components/embeddings/EmbeddingsPanelStore';
import { EmbeddingColoringContext } from 'shared/components/plots/EmbeddingPlotUtils';
import {
    ExtendedClinicalAttribute,
    getExtendsClinicalAttributesFromCustomData,
} from 'pages/resultsView/ResultsViewPageStoreUtils';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

/**
 * Only the profiles a map can colour by. The map's studies hold four hundred
 * between them, and the coverage fetch that feeds driver annotation asks for
 * every profile it is given, so handing it the expression and generic assay
 * ones would pay for options the map does not offer.
 */
const COLORABLE_ALTERATION_TYPES = [
    'MUTATION_EXTENDED',
    'COPY_NUMBER_ALTERATION',
    'STRUCTURAL_VARIANT',
];

/**
 * Colouring for a map that spans more studies than the patient's own.
 *
 * The patient page already builds this machinery for the patient's cohort;
 * this is the same machinery over the studies the map was built from, so a
 * driver, a copy number call or a clinical value on the map means exactly
 * what it means on any other page.
 */
export class MapColoringContext
    implements EmbeddingColoringContext, EmbeddingsPanelStore {
    public readonly plotsStore: PlotsTabStore;
    public readonly clinicalDataCache: ClinicalDataCache;

    constructor(
        private patientStore: PatientViewPageStore,
        private getStudyIds: () => string[]
    ) {
        makeObservable(this);
        const self = this;

        // Each needs the other: the cache reads this store's coverage
        // information, and the store colours from the cache. A getter defers
        // the cache until both exist.
        this.plotsStore = new PlotsTabStore({
            molecularProfiles: this.molecularProfiles,
            molecularProfilesWithData: this.molecularProfiles,
            plotsSelectedGenes: this.plotsSelectedGenes,
            entrezGeneIdToGene: patientStore.entrezGeneIdToGeneAll,
            studyToDataQueryFilter: this.studyToDataQueryFilter,
            patientsForCoverage: this.patients,
            samplesForSVQueries: this.samples,
            samplesForPatientKeyGrouping: this.samples,
            studies: this.studies,
            driverAnnotationSettings: patientStore.driverAnnotationSettings,
            oncoKbAnnotatedGenes: patientStore.oncoKbAnnotatedGenes,
            internalClient,
            get genomeNexusInternalClient() {
                return patientStore.genomeNexusInternalClient;
            },
            get genomeNexusClient() {
                return patientStore.genomeNexusClient;
            },
            genes: patientStore.allGenes,
            filteredSamples: this.samples,
            patients: this.patients,
            get clinicalDataCache() {
                return self.clinicalDataCache;
            },
            clinicalAttributes: patientStore.clinicalAttributes,
            customAttributes: this.customChartAttributes,
            genesets: patientStore.genesets,
            genericAssayEntitiesGroupByMolecularProfileId:
                patientStore.genericAssayEntitiesGroupedByProfileId,
            selectedGenericAssayEntitiesGroupByMolecularProfileId: {},
            hasNoQueriedGenes: true,
            filteredSampleKeyToSample: this.sampleKeyToSample,
            sampleKeyToSample: this.sampleKeyToSample,
            studyIdToStudy: this.studyIdToStudy,
        });

        this.clinicalDataCache = new ClinicalDataCache(
            this.samples,
            this.patients,
            this.plotsStore.studyToMutationMolecularProfile,
            this.studyIdToStudy,
            this.plotsStore.coverageInformation,
            this.sampleKeyToSample,
            this.patientKeyToPatient,
            this.customChartAttributes
        );
    }

    @computed private get studyIds(): string[] {
        return this.getStudyIds();
    }

    // The gene the map is coloured by. The store fetches and annotates
    // exactly these, so setting it is what makes driver calls appear.
    @observable.ref private coloringGenes: Gene[] = [];

    @action.bound
    setColoringGenes(genes: Gene[]) {
        this.coloringGenes = genes;
    }

    readonly plotsSelectedGenes = remoteData<Gene[]>({
        invoke: async () => this.coloringGenes,
        default: [],
    });

    readonly samples = remoteData<Sample[]>({
        invoke: async () => {
            if (this.studyIds.length === 0) {
                return [];
            }
            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: {
                    studyIds: this.studyIds,
                } as StudyViewFilter,
            });
        },
        default: [],
    });

    /**
     * Custom chart groups over the map's own studies, resolved against the
     * map's own samples. The page store's copy resolves against the patient's
     * reference cohort instead, and reaching it pulls in that cohort's whole
     * sample list and every clinical attribute on it.
     */
    readonly customChartAttributes = remoteData<ExtendedClinicalAttribute[]>({
        await: () => (this.appStore.isLoggedIn ? [this.samples] : []),
        invoke: async () => {
            if (!this.appStore.isLoggedIn || this.studyIds.length === 0) {
                return [];
            }
            try {
                const sessions = await sessionServiceClient.getCustomDataForStudies(
                    this.studyIds
                );
                return getExtendsClinicalAttributesFromCustomData(
                    sessions,
                    ComplexKeyMap.from(this.samples.result!, s => ({
                        studyId: s.studyId,
                        sampleId: s.sampleId,
                    }))
                );
            } catch (e) {
                return [];
            }
        },
        default: [],
    });

    readonly studies = remoteData<CancerStudy[]>({
        invoke: async () => {
            if (this.studyIds.length === 0) {
                return [];
            }
            return getClient().fetchStudiesUsingPOST({
                studyIds: this.studyIds,
                projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
            });
        },
        default: [],
    });

    readonly studyIdToStudy = remoteData<{ [studyId: string]: CancerStudy }>({
        await: () => [this.studies],
        invoke: async () => _.keyBy(this.studies.result!, s => s.studyId),
        default: {},
    });

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        invoke: async () => {
            if (this.studyIds.length === 0) {
                return [];
            }
            const profiles = await getClient().fetchMolecularProfilesUsingPOST({
                // The generated filter type demands both fields; the API
                // takes either, as the study view's call also assumes.
                molecularProfileFilter: {
                    studyIds: this.studyIds,
                } as MolecularProfileFilter,
            });
            return profiles.filter(p =>
                COLORABLE_ALTERATION_TYPES.includes(p.molecularAlterationType)
            );
        },
        default: [],
    });

    // One patient row per patient of the map, which coverage information is
    // keyed by. The sample list already names them, so this needs no fetch.
    readonly patients = remoteData<Patient[]>({
        await: () => [this.samples],
        invoke: async () =>
            _.uniqBy(
                this.samples.result!.map(
                    s =>
                        ({
                            patientId: s.patientId,
                            studyId: s.studyId,
                            uniquePatientKey: s.uniquePatientKey,
                        } as Patient)
                ),
                p => p.uniquePatientKey
            ),
        default: [],
    });

    readonly sampleKeyToSample = remoteData<{
        [uniqueSampleKey: string]: Sample;
    }>({
        await: () => [this.samples],
        invoke: async () =>
            _.keyBy(this.samples.result!, s => s.uniqueSampleKey),
        default: {},
    });

    readonly patientKeyToPatient = remoteData<{
        [uniquePatientKey: string]: Patient;
    }>({
        await: () => [this.patients],
        invoke: async () =>
            _.keyBy(this.patients.result!, p => p.uniquePatientKey),
        default: {},
    });

    readonly studyToDataQueryFilter = remoteData<{
        [studyId: string]: { sampleListId: string };
    }>({
        invoke: async () =>
            this.studyIds.reduce((acc, studyId) => {
                acc[studyId] = { sampleListId: `${studyId}_all` };
                return acc;
            }, {} as { [studyId: string]: { sampleListId: string } }),
        default: {},
    });

    // The map draws every sample it covers, so nothing is filtered out and
    // the detailed cancer type grouping is not used to dim anything here.
    readonly filteredSamplesByDetailedCancerType = remoteData<{
        [cancerType: string]: Sample[];
    }>({
        invoke: async () => ({}),
        default: {},
    });



    /**
     * Mutations for the whole map in one request.
     *
     * The shared cache asks each study's profile separately, which suits a
     * cohort inside one study and stalls on thirty: the browser allows six
     * requests to a host at a time and the rest queue behind the largest.
     * One multi-profile request returns the same rows in a few seconds.
     * Annotation is the shared pipeline's, so drivers still agree with the
     * rest of the portal.
     */
    public readonly mapMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        any[]
    >(q => ({
        await: () => [
            this.plotsStore.mutations,
            this.plotsStore.getMutationPutativeDriverInfo,
            this.patientStore.entrezGeneIdToGeneAll,
        ],
        invoke: async () => {
            const mutations = this.plotsStore.mutations.result!.filter(
                m => m.entrezGeneId === q.entrezGeneId
            );
            const report = filterAndAnnotateMutations(
                mutations,
                this.plotsStore.getMutationPutativeDriverInfo.result!,
                this.patientStore.entrezGeneIdToGeneAll.result!
            );
            return report.data.concat(report.vus).concat(report.germline);
        },
    }));

    /**
     * Copy number for the whole map in one request.
     *
     * The shared cache asks each study's discrete CNA profile separately,
     * which is thirty requests here; the browser runs six at a time and the
     * rest queue, and the public API rate-limits the burst. Asking the
     * multi-profile endpoint for the profiles themselves returns the same
     * rows once, and without naming every sample.
     */
    public readonly mapCnaCache = new MobxPromiseCache<
        { entrezGeneId: number },
        any[]
    >(q => ({
        await: () => [
            this.plotsStore.studyToMolecularProfileDiscreteCna,
            this.plotsStore.getDiscreteCNAPutativeDriverInfo,
            this.patientStore.entrezGeneIdToGeneAll,
        ],
        invoke: async () => {
            const profileIds = _.values(
                this.plotsStore.studyToMolecularProfileDiscreteCna.result!
            ).map(p => p.molecularProfileId);
            if (profileIds.length === 0) {
                return [];
            }
            const data = await getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    molecularDataMultipleStudyFilter: {
                        entrezGeneIds: [q.entrezGeneId],
                        molecularProfileIds: profileIds,
                    } as any,
                }
            );
            const report = filterAndAnnotateMolecularData(
                data as any,
                this.plotsStore.getDiscreteCNAPutativeDriverInfo.result!,
                this.patientStore.entrezGeneIdToGeneAll.result!
            );
            return report.data.concat(report.vus);
        },
    }));

    /**
     * Structural variants for the whole map in one request.
     *
     * The shared cache names every sample of every study in the body, which
     * is fifty thousand identifiers here. Naming the profiles instead asks
     * for the same rows.
     */
    public readonly mapStructuralVariantCache = new MobxPromiseCache<
        { entrezGeneId: number },
        any[]
    >(q => ({
        await: () => [this.plotsStore.studyToStructuralVariantMolecularProfile],
        invoke: async () => {
            const profileIds = _.values(
                this.plotsStore.studyToStructuralVariantMolecularProfile
                    .result!
            ).map((p: MolecularProfile) => p.molecularProfileId);
            if (profileIds.length === 0) {
                return [];
            }
            return internalClient.fetchStructuralVariantsUsingPOST({
                structuralVariantFilter: {
                    entrezGeneIds: [q.entrezGeneId],
                    molecularProfileIds: profileIds,
                } as any,
            });
        },
    }));

    // What colours the points. The alteration caches are this map's own: the
    // shared ones are built for a cohort inside one study and stall on thirty.
    @computed get plotsTabStore(): EmbeddingsPanelMolecularStore {
        const store = this.plotsStore;
        return {
            annotatedMutationCache: this.mapMutationCache,
            annotatedCnaCache: this.mapCnaCache,
            structuralVariantCache: this.mapStructuralVariantCache,
            numericGeneMolecularDataCache: store.numericGeneMolecularDataCache,
            isHotspotForOncoprint: store.isHotspotForOncoprint,
            getMutationPutativeDriverInfo: store.getMutationPutativeDriverInfo,
            oncoKbMutationAnnotationForOncoprint:
                store.oncoKbMutationAnnotationForOncoprint,
        };
    }

    // The rest of what a panel asks of its page. The cohort members are left
    // out: this map is not filtered by one, so the features that read them
    // report themselves unavailable.
    @computed get clinicalAttributes() {
        return this.patientStore.clinicalAttributes;
    }

    @computed get customAttributes() {
        return this.customChartAttributes;
    }

    @computed get allGenes() {
        return this.patientStore.allGenes;
    }

    // The page store keeps its own copy private, so this reads the same one
    // every page reads.
    get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    readonly queriedPhysicalStudyIds = remoteData<string[]>({
        invoke: async () => this.studyIds,
        default: [],
    });

    // The panel hides itself when its page is on another tab; this one is
    // only mounted while its tab is open.
    get currentTab(): string {
        return 'embeddings';
    }

    @computed get driverAnnotationSettings() {
        return this.patientStore.driverAnnotationSettings;
    }
}
