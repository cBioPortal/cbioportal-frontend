import { remoteData } from 'cbioportal-frontend-commons';
import { EmbeddingData, EmbeddingDataOption } from './EmbeddingTypes';

const EMBEDDING_BASE_URL =
    'https://datahub.assets.cbioportal.org/embeddings/msk_mosaic_2026';

// Module-level singletons so every view on the page shares one fetch.
export const boehmHeData = remoteData<EmbeddingData>({
    await: () => [],
    invoke: async () => {
        const response = await fetch(`${EMBEDDING_BASE_URL}/umap_he_50k.json`);
        if (!response.ok) {
            throw new Error('Failed to load H&E embedding data');
        }
        return response.json();
    },
});

export const MSKTARGET_STUDY_ID = 'msktarget';

const MSKTARGET_EMBEDDING_BASE_URL =
    'https://github.mskcc.org/pages/debruiji/embedding-for-target';

function msktargetEmbeddingLoader(file: string, label: string) {
    return remoteData<EmbeddingData>({
        await: () => [], // No dependencies - invoke once immediately and cache
        invoke: async () => {
            const response = await fetch(
                `${MSKTARGET_EMBEDDING_BASE_URL}/${file}`
            );
            if (!response.ok) {
                throw new Error(`Failed to load ${label} embedding data`);
            }
            return response.json();
        },
    });
}

export const msktargetMpathTsneData = msktargetEmbeddingLoader(
    'msktarget_rna_tsne_mpath.json',
    'MSK-TARGET t-SNE'
);

// A map only reveals the studies it covers once fetched, and the Mosaic map is
// 8 MB, so the list is declared here instead. Replace with an API call once one
// exists; nothing outside this module depends on where it comes from.
const MOSAIC_STUDY_IDS = [
    'acc_tcga_pan_can_atlas_2018',
    'blca_tcga_pan_can_atlas_2018',
    'brca_tcga_pan_can_atlas_2018',
    'cesc_tcga_pan_can_atlas_2018',
    'chol_tcga_pan_can_atlas_2018',
    'coadread_tcga_pan_can_atlas_2018',
    'esca_tcga_pan_can_atlas_2018',
    'gbm_tcga_pan_can_atlas_2018',
    'hnsc_tcga_pan_can_atlas_2018',
    'kich_tcga_pan_can_atlas_2018',
    'kirc_tcga_pan_can_atlas_2018',
    'kirp_tcga_pan_can_atlas_2018',
    'lgg_tcga_pan_can_atlas_2018',
    'lihc_tcga_pan_can_atlas_2018',
    'luad_tcga_pan_can_atlas_2018',
    'lusc_tcga_pan_can_atlas_2018',
    'meso_tcga_pan_can_atlas_2018',
    'msk_impact_50k_2026',
    'paad_tcga_pan_can_atlas_2018',
    'pcpg_tcga_pan_can_atlas_2018',
    'prad_tcga_pan_can_atlas_2018',
    'sarc_tcga_pan_can_atlas_2018',
    'skcm_tcga_pan_can_atlas_2018',
    'stad_tcga_pan_can_atlas_2018',
    'tgct_tcga_pan_can_atlas_2018',
    'thca_tcga_pan_can_atlas_2018',
    'thym_tcga_pan_can_atlas_2018',
    'ucec_tcga_pan_can_atlas_2018',
    'ucs_tcga_pan_can_atlas_2018',
    'uvm_tcga_pan_can_atlas_2018',
];

interface EmbeddingSource {
    value: string;
    studyIds: string[];
    loader: { isComplete: boolean; isPending: boolean; result?: any };
    requiresFeatureFlag: boolean;
}

const EMBEDDING_SOURCES: EmbeddingSource[] = [
    {
        value: 'msk_mosaic_2026_he',
        studyIds: MOSAIC_STUDY_IDS,
        loader: boehmHeData,
        requiresFeatureFlag: true,
    },
    {
        value: 'msktarget_rna_tsne_mpath',
        studyIds: [MSKTARGET_STUDY_ID],
        loader: msktargetMpathTsneData,
        requiresFeatureFlag: false,
    },
];

export interface EmbeddingScope {
    studyIds: string[];
    // The EMBEDDINGS feature flag, which now only gates the maps that ask for it.
    hasFeatureFlag: boolean;
}

/**
 * The maps that cover these studies and are allowed on this deployment.
 * Decided from the manifest alone, so it costs no fetch and can gate a tab.
 */
function sourcesInScope({ studyIds, hasFeatureFlag }: EmbeddingScope) {
    const wanted = new Set(studyIds);
    return EMBEDDING_SOURCES.filter(
        source =>
            (!source.requiresFeatureFlag || hasFeatureFlag) &&
            source.studyIds.some(id => wanted.has(id))
    );
}

/** Whether any map covers these studies. Does not fetch. */
export function hasEmbeddingForStudies(scope: EmbeddingScope): boolean {
    return sourcesInScope(scope).length > 0;
}

/**
 * Every in-scope embedding that has finished loading. Reading this from a
 * reactive context starts the fetches for those maps and no others.
 */
export function getLoadedEmbeddingOptions(
    scope: EmbeddingScope
): EmbeddingDataOption[] {
    const options: EmbeddingDataOption[] = [];
    for (const { value, loader } of sourcesInScope(scope)) {
        if (loader.isComplete && loader.result) {
            options.push({
                value,
                label: loader.result.title,
                data: loader.result,
            });
        }
    }
    return options;
}

export function isAnyEmbeddingPending(scope: EmbeddingScope): boolean {
    return sourcesInScope(scope).some(({ loader }) => loader.isPending);
}
