import { FeatureFlagStore } from './FeatureFlagStore';

export enum FeatureFlagEnum {
    LEFT_TRUNCATION_ADJUSTMENT = 'LEFT_TRUNCATION_ADJUSTMENT',
    PATIENT_MRNA_TAB = 'patientMRNATab',
    GENE_SPECIFIC_VIOLIN_PLOT = 'geneSpecificViolinPlot',
    EMBEDDINGS = 'EMBEDDINGS',
}

export interface FeatureFlagPortalOverride {
    description?: string;
    exampleUrl?: string;
}

export interface FeatureFlagMetadata {
    /** human-readable name shown in the UI, instead of the raw flag id */
    title: string;
    /** groups related flags together in the UI */
    category: string;
    /** shown to users deciding whether to opt in */
    description: string;
    /**
     * whether this flag has a user-facing opt-in control at all. Set to
     * false for flags that exist purely for internal/ops use.
     */
    userOptIn: boolean;
    /** a URL demonstrating the feature, relative to the portal's origin */
    exampleUrl?: string;
    /**
     * restricts the opt-in control to these app_names (IAppConfig.app_name).
     * Omit for "available on every portal".
     */
    portals?: string[];
    /** app_names where this behavior is already unconditionally on */
    alwaysOnPortals?: string[];
    /** per-portal overrides of description/exampleUrl above */
    portalOverrides?: { [appName: string]: FeatureFlagPortalOverride };
    /**
     * if set, this flag only has an effect for these specific studies (not
     * just "shown as an example there" - genuinely a no-op elsewhere), so
     * it's only worth showing to a user who can access at least one of them.
     */
    relevantStudyIds?: string[];
}

export const FEATURE_FLAG_METADATA: {
    [flag in FeatureFlagEnum]: FeatureFlagMetadata;
} = {
    [FeatureFlagEnum.LEFT_TRUNCATION_ADJUSTMENT]: {
        title: 'Left Truncation Adjustment',
        category: 'Survival Analysis',
        description:
            'Adjusts survival curves for left-truncation bias in the ' +
            'Comparison and Study View survival tabs. Only has an effect ' +
            'for the heme_onc_nsclc_genie_bpc GENIE BPC cohort, the only ' +
            'study with the entry-time data this adjustment needs; it is a ' +
            'no-op for every other study.',
        userOptIn: true,
        exampleUrl:
            '/study?id=heme_onc_nsclc_genie_bpc&featureFlags=LEFT_TRUNCATION_ADJUSTMENT',
        relevantStudyIds: ['heme_onc_nsclc_genie_bpc'],
    },
    [FeatureFlagEnum.PATIENT_MRNA_TAB]: {
        title: 'Patient mRNA Tab',
        category: 'Bulk RNA-Seq Support',
        description:
            "Adds the patient view's mRNA/Plots tab for studies with an " +
            'expression profile.',
        userOptIn: true,
        exampleUrl:
            '/patient/mrna?studyId=brca_tcga&caseId=TCGA-A2-A0T2&featureFlags=patientMRNATab',
        alwaysOnPortals: ['mskcc-portal'],
    },
    [FeatureFlagEnum.GENE_SPECIFIC_VIOLIN_PLOT]: {
        title: 'Gene-Specific Violin Plot',
        category: 'Bulk RNA-Seq Support',
        description:
            'Auto-adds a default-configured gene-specific violin plot chart ' +
            'from mRNA profiles in Study View.',
        userOptIn: true,
        exampleUrl:
            '/study?id=msk_target_test&featureFlags=geneSpecificViolinPlot',
        portals: ['mskcc-portal'],
    },
    [FeatureFlagEnum.EMBEDDINGS]: {
        title: 'Embeddings',
        category: 'Multimodal',
        description:
            'Enables the embeddings (e.g. UMAP) visualization tab in Study ' +
            'View for studies with embedding resources.',
        userOptIn: true,
        exampleUrl:
            '/study/embeddings?id=msk_impact_50k_2026&featureFlags=EMBEDDINGS',
        portals: ['mskcc-portal'],
    },
};

export function getFeatureFlagDisplayInfo(
    flag: FeatureFlagEnum,
    appName: string | undefined | null
) {
    const meta = FEATURE_FLAG_METADATA[flag];
    const override = appName ? meta.portalOverrides?.[appName] : undefined;
    return {
        title: meta.title,
        category: meta.category,
        description: override?.description ?? meta.description,
        exampleUrl: override?.exampleUrl ?? meta.exampleUrl,
        alwaysOn: !!appName && !!meta.alwaysOnPortals?.includes(appName),
    };
}

export function isFeatureFlagStudySpecific(flag: FeatureFlagEnum): boolean {
    const relevantStudyIds = FEATURE_FLAG_METADATA[flag].relevantStudyIds;
    return !!relevantStudyIds && relevantStudyIds.length > 0;
}

export function isFeatureFlagRelevantForStudies(
    flag: FeatureFlagEnum,
    accessibleStudyIds: string[]
): boolean {
    const relevantStudyIds = FEATURE_FLAG_METADATA[flag].relevantStudyIds;
    if (!relevantStudyIds || relevantStudyIds.length === 0) {
        return true;
    }
    return relevantStudyIds.some(id => accessibleStudyIds.includes(id));
}

/**
 * Cheap, synchronous check for whether there's anything worth surfacing a
 * "you can enable features" affordance for. Ignores study-level access
 * restrictions (that requires a network round trip) - a flag scoped to a
 * study the user can't see may cause an occasional false positive here.
 */
export function hasEnableableFeatureFlags(
    featureFlagStore: FeatureFlagStore,
    appName: string | undefined | null
): boolean {
    return Object.values(FeatureFlagEnum).some(flag => {
        const { alwaysOn } = getFeatureFlagDisplayInfo(flag, appName);
        return (
            !alwaysOn &&
            isFeatureFlagOptable(flag, appName) &&
            !featureFlagStore.has(flag)
        );
    });
}

export function isFeatureFlagOptable(
    flag: FeatureFlagEnum,
    appName: string | undefined | null
): boolean {
    const meta = FEATURE_FLAG_METADATA[flag];
    if (!meta.userOptIn) {
        return false;
    }
    if (!meta.portals || meta.portals.length === 0) {
        return true;
    }
    return !!appName && meta.portals.includes(appName);
}
