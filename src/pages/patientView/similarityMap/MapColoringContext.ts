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
import { filterAndAnnotateMutations } from 'shared/lib/StoreUtils';
import { MolecularDataStore } from 'shared/lib/PatientMolecularDataUtils';
import { EmbeddingColoringContext } from 'shared/components/plots/EmbeddingPlotUtils';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { REQUEST_ARG_ENUM } from 'shared/constants';

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
export class MapColoringContext implements EmbeddingColoringContext {
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
            customAttributes: patientStore.customAttributes,
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
            patientStore.customAttributes
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

    // What colours the points: the map's own mutation fetch, with copy number
    // and structural variants from the shared store, which already ask for
    // every study at once.
    @computed get plotsTabStore(): MolecularDataStore {
        return {
            annotatedMutationCache: this.mapMutationCache,
            annotatedCnaCache: this.plotsStore.annotatedCnaCache,
            structuralVariantCache: this.plotsStore.structuralVariantCache,
        };
    }

    @computed get driverAnnotationSettings() {
        return this.patientStore.driverAnnotationSettings;
    }
}
