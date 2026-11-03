import { remoteData } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
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

// MSK-internal host, not EMBEDDING_BASE_URL: reachable only from an MSK deployment.
const MSKTARGET_EMBEDDING_BASE_URL =
    'https://github.mskcc.org/pages/debruiji/embedding-for-target';

// Deployments that sit on the MSK network. Anywhere else the internal host is
// unreachable by definition, so the fetch is skipped rather than left to fail.
const MSK_INTERNAL_APP_NAMES = ['mskcc-portal'];

function isMskInternalPortal(): boolean {
    return MSK_INTERNAL_APP_NAMES.includes(getServerConfig().app_name!);
}

function msktargetEmbeddingLoader(file: string, label: string) {
    return remoteData<EmbeddingData | null>({
        await: () => [], // No dependencies - invoke once immediately and cache
        invoke: async () => {
            if (!isMskInternalPortal()) {
                return null;
            }
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
    'MSK-TARGET RNA t-SNE (MPath)'
);

const EMBEDDING_SOURCES = [
    { value: 'msk_mosaic_2026_he', loader: boehmHeData },
    { value: 'msktarget_rna_tsne_mpath', loader: msktargetMpathTsneData },
];

/**
 * Every embedding that has finished loading. Reading this from a reactive
 * context starts any fetch not yet started.
 */
export function getLoadedEmbeddingOptions(): EmbeddingDataOption[] {
    const options: EmbeddingDataOption[] = [];
    for (const { value, loader } of EMBEDDING_SOURCES) {
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

export function isAnyEmbeddingPending(): boolean {
    return EMBEDDING_SOURCES.some(({ loader }) => loader.isPending);
}
