import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiSampleClinicalDatum,
} from './wsiViewerTypes';
import { formatMutationType } from './wsiMolecularUtils';

export type SampleIdentifier = { studyId: string; sampleId: string };

export type MutationApiRecord = {
    sampleId: string;
    entrezGeneId?: number;
    gene?: { hugoGeneSymbol: string; entrezGeneId?: number } | null;
    proteinChange?: string | null;
    mutationType?: string;
    keyword?: string;
    driverFilterAnnotation?: string;
    tumorAltCount?: number;
    tumorRefCount?: number;
    proteinPosStart?: number;
    proteinPosEnd?: number;
};

export type CnaApiRecord = {
    sampleId: string;
    value: number;
    entrezGeneId?: number;
    gene?: {
        entrezGeneId?: number;
        hugoGeneSymbol: string;
    } | null;
};

/** `discrete-copy-number-counts/fetch` row. */
export type CopyNumberCountRecord = {
    entrezGeneId: number;
    alteration: number;
    numberOfSamples?: number;
    numberOfSamplesWithAlterationInGene?: number;
};

/** `variant-counts/fetch` row. */
export type VariantCountRecord = {
    entrezGeneId: number;
    keyword: string;
    numberOfSamples?: number;
    numberOfSamplesWithKeyword?: number;
};

export type StructuralVariantApiRecord = {
    sampleId: string;
    site1HugoSymbol?: string;
    site2HugoSymbol?: string;
    site1EntrezGeneId?: number;
    site2EntrezGeneId?: number;
    variantClass?: string;
    annotation?: string;
    breakpointType?: string;
    connectionType?: string;
    eventInfo?: string;
    length?: number;
    comments?: string;
    svStatus?: string;
    dnaSupport?: string;
    rnaSupport?: string;
    tumorVariantCount?: number;
    normalVariantCount?: number;
    tumorReadCount?: number;
    normalReadCount?: number;
    tumorPairedEndReadCount?: number;
    tumorSplitReadCount?: number;
    site1Description?: string;
    site2Description?: string;
    site1Chromosome?: string;
    site1Position?: number;
    site2Chromosome?: string;
    site2Position?: number;
    ncbiBuild?: string;
};

/**
 * Sample attributes the viewer shows, by their cBioPortal attribute IDs. The
 * first ID with a value wins.
 */
const SAMPLE_ATTRIBUTE_IDS: Array<[keyof Sample, string[]]> = [
    ['cancer_type', ['CANCER_TYPE']],
    ['cancer_type_detailed', ['CANCER_TYPE_DETAILED']],
    ['oncotree_code', ['ONCOTREE_CODE']],
    ['primary_site', ['PRIMARY_SITE']],
    ['sample_type', ['SAMPLE_TYPE']],
    ['metastatic_site', ['METASTATIC_SITE']],
    ['tumor_purity', ['TUMOR_PURITY']],
    ['tmb_score', ['TMB_NONSYNONYMOUS']],
    ['msi_type', ['MSI_TYPE']],
    ['msi_score', ['MSI_SCORE']],
];

/** The sample attribute IDs the viewer reads. */
export const WSI_SAMPLE_ATTRIBUTE_IDS: ReadonlyArray<string> = ([] as string[]).concat(
    ...SAMPLE_ATTRIBUTE_IDS.map(([, ids]) => ids)
);

export function mergeClinicalDataIntoSamples(
    samples: Sample[],
    data: ReadonlyArray<WsiSampleClinicalDatum>
): void {
    const byId = new Map<string, Map<string, string>>();
    for (const item of data) {
        if (item.value == null || item.value === '') continue;
        let attrs = byId.get(item.sampleId);
        if (!attrs) {
            attrs = new Map();
            byId.set(item.sampleId, attrs);
        }
        attrs.set(item.clinicalAttributeId, String(item.value));
    }

    for (const sample of samples) {
        const attrs = byId.get(sample.sample_id);
        if (!attrs) continue;
        for (const [key, ids] of SAMPLE_ATTRIBUTE_IDS) {
            const id = ids.find(candidate => attrs.has(candidate));
            if (id !== undefined) {
                (sample as Record<keyof Sample, unknown>)[key] = attrs.get(id);
            }
        }
    }
}

/** A protein change as shown: without the `p.` prefix. */
export function displayProteinChange(
    proteinChange: string | null | undefined
): string {
    const value = (proteinChange || '').trim();
    return value.startsWith('p.') ? value.slice(2) : value;
}

/**
 * Each sample's mutations, one per gene and protein change (the highest VAF
 * kept), highest VAF first, then by gene and protein change.
 */
export function buildMutationsBySample(
    mutations: ReadonlyArray<MutationApiRecord>
): Map<string, MutationDetail[]> {
    const byTokenBySample = new Map<string, Map<string, MutationDetail>>();

    for (const mutation of mutations) {
        const gene = mutation.gene?.hugoGeneSymbol;
        if (!gene) continue;

        const proteinChange = displayProteinChange(mutation.proteinChange);
        const token = proteinChange ? `${gene} ${proteinChange}` : gene;
        const altCount = mutation.tumorAltCount;
        const total = (altCount ?? 0) + (mutation.tumorRefCount ?? 0);
        const vaf =
            altCount != null && altCount >= 0 && total > 0
                ? Math.round((altCount / total) * 100)
                : undefined;

        let byToken = byTokenBySample.get(mutation.sampleId);
        if (!byToken) {
            byToken = new Map();
            byTokenBySample.set(mutation.sampleId, byToken);
        }
        const current = byToken.get(token);
        if (!current || (current.vaf ?? -1) < (vaf ?? -1)) {
            byToken.set(token, {
                token,
                gene,
                proteinChange,
                type: formatMutationType(mutation.mutationType ?? ''),
                vaf,
                annotation: mutation.driverFilterAnnotation || undefined,
                entrezGeneId:
                    mutation.gene?.entrezGeneId ?? mutation.entrezGeneId,
                consequence: mutation.mutationType,
                keyword: mutation.keyword || undefined,
                proteinStart: mutation.proteinPosStart,
                proteinEnd: mutation.proteinPosEnd,
            });
        }
    }

    const bySample = new Map<string, MutationDetail[]>();
    byTokenBySample.forEach((byToken, sampleId) => {
        bySample.set(
            sampleId,
            Array.from(byToken.values()).sort(
                (a, b) =>
                    (b.vaf ?? -1) - (a.vaf ?? -1) ||
                    a.token.localeCompare(b.token)
            )
        );
    });
    return bySample;
}

/**
 * Each sample's non-zero copy-number alterations, strongest first, with the
 * study counts from `countFor`.
 */
export function buildCnaBySample(
    rows: ReadonlyArray<CnaApiRecord>,
    countFor: (
        entrezGeneId: number,
        alteration: number
    ) => CopyNumberCountRecord | undefined = () => undefined
): Map<string, CNADetail[]> {
    const bySample = new Map<string, CNADetail[]>();
    const seen = new Set<string>();
    for (const row of rows) {
        if (row.value === 0) continue;
        const gene = row.gene?.hugoGeneSymbol;
        if (!gene) continue;
        const key = `${row.sampleId}:${gene}:${row.value}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const entrezGeneId = row.gene?.entrezGeneId ?? row.entrezGeneId;
        const count =
            entrezGeneId != null
                ? countFor(entrezGeneId, row.value)
                : undefined;
        let sampleCnas = bySample.get(row.sampleId);
        if (!sampleCnas) {
            sampleCnas = [];
            bySample.set(row.sampleId, sampleCnas);
        }
        sampleCnas.push({
            gene,
            entrezGeneId,
            cnaValue: row.value,
            cohortAlteredCount: count?.numberOfSamplesWithAlterationInGene,
            cohortProfiledCount: count?.numberOfSamples,
        });
    }

    bySample.forEach(cnas =>
        cnas.sort(
            (a, b) =>
                Math.abs(b.cnaValue) - Math.abs(a.cnaValue) ||
                a.gene.localeCompare(b.gene)
        )
    );
    return bySample;
}

export function buildStructuralVariantBySample(
    rows: StructuralVariantApiRecord[]
): Map<string, StructuralVariantDetail[]> {
    const bySample = new Map<string, StructuralVariantDetail[]>();
    const seenBySample = new Map<string, Set<string>>();

    for (const row of rows) {
        if (row.tumorVariantCount != null && row.tumorVariantCount <= 0) {
            continue;
        }
        const key = [
            row.site1HugoSymbol || '—',
            row.site2HugoSymbol || '—',
            row.site1EntrezGeneId ?? '',
            row.site2EntrezGeneId ?? '',
            row.variantClass || 'Structural variant',
            row.sampleId,
        ].join('::');
        let sampleSeen = seenBySample.get(row.sampleId);
        if (!sampleSeen) {
            sampleSeen = new Set();
            seenBySample.set(row.sampleId, sampleSeen);
        }
        if (sampleSeen.has(key)) {
            continue;
        }
        sampleSeen.add(key);
        const detail: StructuralVariantDetail = {
            gene1: row.site1HugoSymbol || '—',
            gene2: row.site2HugoSymbol || '—',
            site1EntrezGeneId: row.site1EntrezGeneId,
            site2EntrezGeneId: row.site2EntrezGeneId,
            variantClass: row.variantClass || 'Structural variant',
            annotation: row.annotation,
            breakpointType: row.breakpointType,
            connectionType: row.connectionType,
            eventInfo: row.eventInfo,
            length: row.length,
            comments: row.comments,
            svStatus: row.svStatus,
            dnaSupport: row.dnaSupport,
            rnaSupport: row.rnaSupport,
            tumorVariantCount: row.tumorVariantCount,
            normalVariantCount: row.normalVariantCount,
            tumorReadCount: row.tumorReadCount,
            normalReadCount: row.normalReadCount,
            tumorPairedEndReadCount: row.tumorPairedEndReadCount,
            tumorSplitReadCount: row.tumorSplitReadCount,
            site1Description: row.site1Description,
            site2Description: row.site2Description,
            site1Chromosome: row.site1Chromosome,
            site1Position: row.site1Position,
            site2Chromosome: row.site2Chromosome,
            site2Position: row.site2Position,
            ncbiBuild: row.ncbiBuild,
        };
        let sampleVariants = bySample.get(row.sampleId);
        if (!sampleVariants) {
            sampleVariants = [];
            bySample.set(row.sampleId, sampleVariants);
        }
        sampleVariants.push(detail);
    }

    for (const svList of bySample.values()) {
        svList.sort(
            (a, b) =>
                a.gene1.localeCompare(b.gene1) ||
                a.gene2.localeCompare(b.gene2) ||
                a.variantClass.localeCompare(b.variantClass)
        );
    }

    return bySample;
}

/**
 * Sets each mutation's study counts: how many samples of the mutation profile
 * have the same variant (`countFor` looks up the mutation's count).
 */
export function applyVariantCounts(
    samples: Sample[],
    countFor: (mutation: MutationDetail) => VariantCountRecord | undefined
): void {
    for (const sample of samples) {
        for (const mutation of sample.mutations ?? []) {
            const count = countFor(mutation);
            if (
                count?.numberOfSamples &&
                count.numberOfSamplesWithKeyword != null
            ) {
                mutation.cohortAlteredCount = count.numberOfSamplesWithKeyword;
                mutation.cohortProfiledCount = count.numberOfSamples;
            }
        }
    }
}
