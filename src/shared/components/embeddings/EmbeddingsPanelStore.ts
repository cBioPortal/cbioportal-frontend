import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    Gene,
    MolecularProfile,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import ClinicalDataCache from 'shared/cache/ClinicalDataCache';
import { ExtendedClinicalAttribute } from 'pages/resultsView/ResultsViewPageStoreUtils';
import { DriverAnnotationSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';

/**
 * The alteration data an embedding panel colours from. The study view's plots
 * store satisfies it; a page whose map spans more studies than one cohort can
 * supply the same members with its own fetch strategy.
 */
export interface EmbeddingsPanelMolecularStore {
    annotatedMutationCache: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    annotatedCnaCache: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    structuralVariantCache: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    numericGeneMolecularDataCache: MobxPromiseCache<any, any[]>;
    isHotspotForOncoprint: MobxPromise<any>;
    getMutationPutativeDriverInfo: MobxPromise<any>;
    oncoKbMutationAnnotationForOncoprint: MobxPromise<any>;
}

/**
 * What an embedding panel needs from the page it sits on.
 *
 * StudyViewPageStore satisfies this as it stands. Stating it as members
 * rather than the whole store lets the patient view render the same panel
 * over the studies its map covers, so the two do not drift apart.
 *
 * The cohort members have no meaning on a page with no cohort filter, so
 * they are optional and the features that read them hide when absent.
 */
export interface EmbeddingsPanelStore {
    plotsTabStore: EmbeddingsPanelMolecularStore;
    driverAnnotationSettings: DriverAnnotationSettings;
    clinicalDataCache: ClinicalDataCache;
    samples: MobxPromise<Sample[]>;
    molecularProfiles: MobxPromise<MolecularProfile[]>;
    clinicalAttributes: MobxPromise<ExtendedClinicalAttribute[]>;
    customAttributes: MobxPromise<ExtendedClinicalAttribute[]>;
    allGenes: MobxPromise<Gene[]>;
    queriedPhysicalStudyIds: MobxPromise<string[]>;
    filteredSamplesByDetailedCancerType: MobxPromise<{
        [cancerType: string]: Sample[];
    }>;
    appStore: { featureFlagStore: { has: (flag: any) => boolean } };
    currentTab: string;

    /** The cohort the page's own filters leave; absent where nothing filters. */
    selectedSamples?: MobxPromise<Sample[]>;
    selectedPatients?: Patient[];
    /** Drives "Make Global", which applies a selection as a cohort filter. */
    numberOfSelectedSamplesInCustomSelection?: number;
    updateCustomSelect?: (customChartData: any) => void;
}
