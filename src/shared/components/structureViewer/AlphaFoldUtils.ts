import {
    AlphaFoldPaeData,
    parseAlphaFoldPaeJson,
    resolveAlphaFoldDocUrl,
} from './AlphaFoldPaeUtils';

export const ALPHAFOLD_DEFAULT_CHAIN = 'A';
export const ALPHAFOLD_DEFAULT_ISOFORM = 1;
/** EBI currently serves v6; older v4 URLs return 404. */
export const ALPHAFOLD_MODEL_VERSION = 6;

const ALPHAFOLD_VERSION_FALLBACKS = [6, 4] as const;

export function getAlphaFoldModelId(
    uniprotId: string,
    isoform: number = ALPHAFOLD_DEFAULT_ISOFORM
): string {
    return `AF-${uniprotId.toUpperCase()}-F${isoform}`;
}

export function parseIsoformFromEntryId(entryId: string): number {
    const match = entryId.match(/-F(\d+)$/i);

    if (!match) {
        return ALPHAFOLD_DEFAULT_ISOFORM;
    }

    const isoform = parseInt(match[1], 10);

    return Number.isNaN(isoform) ? ALPHAFOLD_DEFAULT_ISOFORM : isoform;
}

export function getAlphaFoldModelUrl(
    uniprotId: string,
    options?: {
        isoform?: number;
        version?: number;
        format?: 'cif' | 'pdb';
        baseUrl?: string;
    }
): string {
    const isoform = options?.isoform ?? ALPHAFOLD_DEFAULT_ISOFORM;
    const version = options?.version ?? ALPHAFOLD_MODEL_VERSION;
    const format = options?.format ?? 'cif';
    const baseUrl = (
        options?.baseUrl ?? 'https://alphafold.ebi.ac.uk/files'
    ).replace(/\/$/, '');
    const modelId = getAlphaFoldModelId(uniprotId, isoform);

    return `${baseUrl}/${modelId}-model_v${version}.${format}`;
}

export function getAlphaFoldEntryUrl(uniprotId: string): string {
    return `https://alphafold.ebi.ac.uk/entry/${uniprotId.toUpperCase()}`;
}

export type AlphaFoldPredictionMetadata = {
    entryId: string;
    uniprotAccession: string;
    uniprotDescription: string;
    gene?: string;
    organismScientificName: string;
    chainId: string;
    isoform: number;
    latestVersion: number;
    globalMetricValue?: number;
    plddtDocUrl?: string;
    paeDocUrl?: string;
    cifUrl?: string;
};

export function getAlphaFoldApiUrl(
    uniprotId: string,
    apiBaseUrl?: string
): string {
    const base = (apiBaseUrl ?? 'https://alphafold.ebi.ac.uk').replace(
        /\/$/,
        ''
    );

    return `${base}/api/prediction/${encodeURIComponent(
        uniprotId.toUpperCase()
    )}`;
}

function mapApiEntryToMetadata(entry: any): AlphaFoldPredictionMetadata {
    return {
        entryId: entry.entryId,
        uniprotAccession: entry.uniprotAccession,
        uniprotDescription: entry.uniprotDescription,
        gene: entry.gene,
        organismScientificName: entry.organismScientificName,
        chainId: entry.chainId || ALPHAFOLD_DEFAULT_CHAIN,
        isoform: parseIsoformFromEntryId(entry.entryId),
        latestVersion: entry.latestVersion,
        globalMetricValue: entry.globalMetricValue,
        plddtDocUrl: entry.plddtDocUrl,
        paeDocUrl: entry.paeDocUrl,
        cifUrl: entry.cifUrl,
    };
}

export async function fetchAlphaFoldPredictions(
    uniprotId: string,
    apiBaseUrl?: string
): Promise<AlphaFoldPredictionMetadata[]> {
    const response = await fetch(getAlphaFoldApiUrl(uniprotId, apiBaseUrl));

    if (!response.ok) {
        return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map(mapApiEntryToMetadata);
}

export async function fetchAlphaFoldPredictionMetadata(
    uniprotId: string,
    apiBaseUrl?: string,
    isoform: number = ALPHAFOLD_DEFAULT_ISOFORM
): Promise<AlphaFoldPredictionMetadata | null> {
    const predictions = await fetchAlphaFoldPredictions(uniprotId, apiBaseUrl);

    if (predictions.length === 0) {
        return null;
    }

    return (
        predictions.find(prediction => prediction.isoform === isoform) ||
        predictions[0]
    );
}

export function generateAlphaFoldInfoSummary(
    metadata: AlphaFoldPredictionMetadata
): {
    modelInfo: string;
    moleculeInfo: string;
    entryId: string;
} {
    const versionLabel = metadata.latestVersion
        ? ` [model v${metadata.latestVersion}]`
        : '';
    const plddtLabel =
        metadata.globalMetricValue != null
            ? `, mean pLDDT ${metadata.globalMetricValue.toFixed(1)}`
            : '';
    const description = metadata.uniprotDescription.toLowerCase();

    return {
        entryId: metadata.entryId,
        modelInfo: `AlphaFold predicted structure of ${description} (${
            metadata.organismScientificName
        })${versionLabel}${plddtLabel}`,
        moleculeInfo: description,
    };
}

const predictionMetadataCache: {
    [cacheKey: string]: Promise<AlphaFoldPredictionMetadata | null>;
} = {};

const predictionsListCache: {
    [cacheKey: string]: Promise<AlphaFoldPredictionMetadata[]>;
} = {};

export function fetchAlphaFoldPredictionsCached(
    uniprotId: string,
    apiBaseUrl?: string
): Promise<AlphaFoldPredictionMetadata[]> {
    const key = `${uniprotId.toUpperCase()}_${apiBaseUrl || 'default'}_all`;

    if (!predictionsListCache[key]) {
        predictionsListCache[key] = fetchAlphaFoldPredictions(
            uniprotId,
            apiBaseUrl
        );
    }

    return predictionsListCache[key];
}

export function fetchAlphaFoldPredictionMetadataCached(
    uniprotId: string,
    apiBaseUrl?: string,
    isoform: number = ALPHAFOLD_DEFAULT_ISOFORM
): Promise<AlphaFoldPredictionMetadata | null> {
    const key = `${uniprotId.toUpperCase()}_${
        apiBaseUrl || 'default'
    }_F${isoform}`;

    if (!predictionMetadataCache[key]) {
        predictionMetadataCache[key] = fetchAlphaFoldPredictionMetadata(
            uniprotId,
            apiBaseUrl,
            isoform
        );
    }

    return predictionMetadataCache[key];
}

export function getAlphaFoldModelUrlCandidates(
    uniprotId: string,
    options?: {
        isoform?: number;
        format?: 'cif' | 'pdb';
        baseUrl?: string;
        versions?: readonly number[];
    }
): string[] {
    const versions = options?.versions ?? ALPHAFOLD_VERSION_FALLBACKS;

    return versions.map(version =>
        getAlphaFoldModelUrl(uniprotId, {
            isoform: options?.isoform,
            version,
            format: options?.format,
            baseUrl: options?.baseUrl,
        })
    );
}

/** Fetch mmCIF/PDB text from AlphaFold DB (tries current version, then fallbacks). */
export async function fetchAlphaFoldModelText(
    uniprotId: string,
    options?: {
        baseUrl?: string;
        format?: 'cif' | 'pdb';
        isoform?: number;
    }
): Promise<string> {
    const format = options?.format ?? 'cif';
    const urls = getAlphaFoldModelUrlCandidates(uniprotId, {
        baseUrl: options?.baseUrl,
        format,
        isoform: options?.isoform,
    });

    let lastError: Error | null = null;

    for (const url of urls) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                lastError = new Error(
                    `AlphaFold model fetch failed (${response.status}): ${url}`
                );
                continue;
            }

            return await response.text();
        } catch (error) {
            lastError =
                error instanceof Error
                    ? error
                    : new Error('AlphaFold model fetch failed');
        }
    }

    throw (
        lastError ??
        new Error(`No AlphaFold model found for UniProt ${uniprotId}`)
    );
}

export async function fetchAlphaFoldPlddtByResidue(
    plddtDocUrl: string
): Promise<{ [position: number]: number }> {
    const response = await fetch(plddtDocUrl);

    if (!response.ok) {
        throw new Error(
            `AlphaFold pLDDT fetch failed (${response.status}): ${plddtDocUrl}`
        );
    }

    const data = await response.json();
    const scores: number[] | undefined = Array.isArray(data)
        ? data[0]?.confidenceScore
        : data?.confidenceScore;

    if (!scores || scores.length === 0) {
        throw new Error('AlphaFold pLDDT response contained no scores');
    }

    const byResidue: { [position: number]: number } = {};

    scores.forEach((score, index) => {
        byResidue[index + 1] = score;
    });

    return byResidue;
}

export async function fetchAlphaFoldPaeData(
    paeDocUrl: string,
    filesBaseUrl?: string
): Promise<AlphaFoldPaeData> {
    const url = resolveAlphaFoldDocUrl(paeDocUrl, filesBaseUrl);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`AlphaFold PAE fetch failed (${response.status}): ${url}`);
    }

    const data = await response.json();

    return parseAlphaFoldPaeJson(data);
}
