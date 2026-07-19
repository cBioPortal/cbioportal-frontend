import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
} from './wsiViewerTypes';
import { formatMutationType } from './wsiMolecularUtils';

export type SampleIdentifier = { studyId: string; sampleId: string };

export type MutationFrequencyQuery = {
    entrezGeneId: number;
    proteinPosStart: number;
    proteinPosEnd: number;
};

type ClinicalDataRecord = {
    sampleId: string;
    clinicalAttributeId: string;
    value: string;
};

type MutationApiRecord = {
    sampleId: string;
    entrezGeneId?: number;
    gene?: { hugoGeneSymbol: string; entrezGeneId?: number } | null;
    proteinChange: string;
    mutationType?: string;
    driverFilterAnnotation?: string;
    tumorAltCount?: number;
    tumorRefCount?: number;
    proteinPosStart?: number;
    proteinPosEnd?: number;
};

type CnaApiRecord = {
    sampleId: string;
    value: number;
    entrezGeneId?: number;
    gene?: {
        entrezGeneId?: number;
        hugoGeneSymbol: string;
        cytoband?: string;
    } | null;
};

type CnaCountRecord = {
    alteration: number;
    cytoband?: string;
    entrezGeneId: number;
    hugoGeneSymbol: string;
    numberOfAlteredCases?: number;
    numberOfProfiledCases?: number;
    totalCount?: number;
};

type StructuralVariantApiRecord = {
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

export function mergeClinicalDataIntoSamples(
    samples: Sample[],
    data: ClinicalDataRecord[]
): void {
    const byId = new Map<string, Map<string, string>>();
    for (const item of data) {
        if (!byId.has(item.sampleId)) {
            byId.set(item.sampleId, new Map());
        }
        byId.get(item.sampleId)!.set(item.clinicalAttributeId, item.value);
    }

    const get = (
        attrs: Map<string, string>,
        ids: string[]
    ): string | undefined => {
        for (let index = 0; index < ids.length; index += 1) {
            const value = attrs.get(ids[index]);
            if (value != null && value !== '') {
                return value;
            }
        }
        return undefined;
    };
    const getNumber = (
        attrs: Map<string, string>,
        ids: string[]
    ): number | undefined => {
        const value = get(attrs, ids);
        if (value === undefined) {
            return undefined;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    for (const sample of samples) {
        const attrs = byId.get(sample.sample_id);
        if (!attrs) continue;
        const set = <K extends keyof Sample>(key: K, ids: string[]): void => {
            const value = get(attrs, ids);
            if (value !== undefined) {
                sample[key] = value as Sample[K];
            }
        };
        set('cancer_type', ['CANCER_TYPE']);
        set('cancer_type_detailed', ['CANCER_TYPE_DETAILED']);
        set('oncotree_code', ['ONCOTREE_CODE']);
        set('primary_site', ['PRIMARY_SITE']);
        set('sample_type', ['SAMPLE_TYPE']);
        set('metastatic_site', ['METASTATIC_SITE']);
        set('tumor_purity', ['TUMOR_PURITY', 'CVR_TUMOR_PURITY']);
        set('tmb_score', ['CVR_TMB_SCORE', 'TMB_NONSYNONYMOUS', 'TMB_SCORE']);
        set('msi_type', ['MSI_TYPE', 'MSI_SCORE', 'MSI_STATUS']);
        set('oncogenic_mutations', [
            'ONCOGENIC_MUTATIONS',
            'CVR_ONCOGENIC_MUTATIONS',
        ]);
        set('num_oncogenic_mutations', [
            'NUM_ONCOGENIC_MUTATIONS',
            'CVR_NUM_ONCOGENIC_MUTATIONS',
        ]);

        const timepointDays = getNumber(attrs, ['WSI_TIMEPOINT_DAYS']);
        if (timepointDays !== undefined) {
            sample.sample_timepoint_days = timepointDays;
        }
        const timepointSource = get(attrs, ['WSI_TIMEPOINT_SOURCE']);
        if (timepointSource !== undefined) {
            sample.sample_timepoint_source = timepointSource;
        }
    }
}

export function buildMutationMaps(mutations: MutationApiRecord[]): {
    allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>;
    detailsBySample: Map<string, Map<string, MutationDetail>>;
} {
    const allMutsBySample = new Map<string, Array<{ token: string; vaf: number }>>();
    const vafByTokenBySample = new Map<string, Map<string, number>>();
    const detailsBySample = new Map<string, Map<string, MutationDetail>>();

    for (const mutation of mutations) {
        const geneSymbol = mutation.gene?.hugoGeneSymbol;
        if (!geneSymbol) continue;

        const proteinChange = mutation.proteinChange.startsWith('p.')
            ? mutation.proteinChange
            : `p.${mutation.proteinChange}`;
        const token = `${geneSymbol} ${proteinChange}`;
        const total =
            (mutation.tumorAltCount ?? 0) + (mutation.tumorRefCount ?? 0);
        const vaf =
            total > 0
                ? Math.round((mutation.tumorAltCount! / total) * 100)
                : 0;

        let sampleDetails = detailsBySample.get(mutation.sampleId);
        if (!sampleDetails) {
            sampleDetails = new Map();
            detailsBySample.set(mutation.sampleId, sampleDetails);
        }
        const currentDetail = sampleDetails.get(token);
        if (!currentDetail || (currentDetail.vaf ?? -1) < vaf) {
            sampleDetails.set(token, {
                token,
                type: formatMutationType(mutation.mutationType ?? ''),
                vaf: total > 0 ? vaf : undefined,
                annotation: mutation.driverFilterAnnotation || undefined,
                entrezGeneId:
                    mutation.gene?.entrezGeneId ?? mutation.entrezGeneId,
                consequence: mutation.mutationType,
                proteinStart: mutation.proteinPosStart,
                proteinEnd: mutation.proteinPosEnd,
            });
        }

        let sampleVafs = vafByTokenBySample.get(mutation.sampleId);
        if (!sampleVafs) {
            sampleVafs = new Map();
            vafByTokenBySample.set(mutation.sampleId, sampleVafs);
        }
        const existingVaf = sampleVafs.get(token);
        if (existingVaf == null || vaf > existingVaf) {
            sampleVafs.set(token, vaf);
        }
    }

    for (const [sampleId, vafByToken] of vafByTokenBySample.entries()) {
        const mutations: Array<{ token: string; vaf: number }> = [];
        vafByToken.forEach((vaf, token) => {
            mutations.push({ token, vaf });
        });
        allMutsBySample.set(sampleId, mutations);
    }

    for (const muts of allMutsBySample.values()) {
        muts.sort((a, b) => b.vaf - a.vaf || a.token.localeCompare(b.token));
    }

    return { allMutsBySample, detailsBySample };
}

export function buildCnaBySample(
    rows: CnaApiRecord[],
    countRows: CnaCountRecord[] | null | undefined
): Map<string, CNADetail[]> {
    const cnaGeneByAlteration = new Map<string, CnaCountRecord>();
    for (const row of countRows ?? []) {
        cnaGeneByAlteration.set(`${row.entrezGeneId}:${row.alteration}`, row);
        cnaGeneByAlteration.set(
            `${row.hugoGeneSymbol}:${row.alteration}`,
            row
        );
    }

    const bySample = new Map<string, CNADetail[]>();
    const seenBySample = new Map<string, Set<string>>();
    for (const row of rows) {
        if (row.value === 0) continue;
        const gene = row.gene?.hugoGeneSymbol;
        if (!gene) continue;
        const entrezGeneId = row.gene?.entrezGeneId ?? row.entrezGeneId;
        const countRow =
            (entrezGeneId != null
                ? cnaGeneByAlteration.get(`${entrezGeneId}:${row.value}`)
                : undefined) ?? cnaGeneByAlteration.get(`${gene}:${row.value}`);
        const cohortProfiledCount = countRow?.numberOfProfiledCases;
        const cohortAlteredCount =
            countRow?.numberOfAlteredCases ?? countRow?.totalCount;
        const key = `${gene}:${row.value}:${row.sampleId}`;
        let sampleSeen = seenBySample.get(row.sampleId);
        if (!sampleSeen) {
            sampleSeen = new Set();
            seenBySample.set(row.sampleId, sampleSeen);
        }
        if (sampleSeen.has(key)) {
            continue;
        }
        sampleSeen.add(key);
        let sampleCnas = bySample.get(row.sampleId);
        if (!sampleCnas) {
            sampleCnas = [];
            bySample.set(row.sampleId, sampleCnas);
        }
        sampleCnas.push({
            gene,
            entrezGeneId,
            cnaValue: row.value,
            cytoband: countRow?.cytoband ?? row.gene?.cytoband,
            cohortAlteredCount,
            cohortProfiledCount,
            cohortFrequency:
                cohortAlteredCount != null && cohortProfiledCount
                    ? cohortAlteredCount / cohortProfiledCount
                    : undefined,
        });
    }

    for (const cnList of bySample.values()) {
        cnList.sort(
            (a, b) =>
                Math.abs(b.cnaValue) - Math.abs(a.cnaValue) ||
                a.gene.localeCompare(b.gene)
        );
    }

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

export function buildMutationFrequencyQuery(
    samples: Sample[]
): MutationFrequencyQuery[] {
    const posMap = new Map<string, MutationFrequencyQuery>();

    for (const sample of samples) {
        for (const detail of sample.oncogenic_mutation_details ?? []) {
            if (
                detail.entrezGeneId &&
                detail.proteinStart != null &&
                detail.proteinEnd != null
            ) {
                const key = `${detail.entrezGeneId}_${detail.proteinStart}_${detail.proteinEnd}`;
                posMap.set(key, {
                    entrezGeneId: detail.entrezGeneId,
                    proteinPosStart: detail.proteinStart,
                    proteinPosEnd: detail.proteinEnd,
                });
            }
        }
    }

    return [...posMap.values()];
}

export function applyMutationFrequencies(
    samples: Sample[],
    counts: Array<{
        entrezGeneId: number;
        proteinPosStart: number;
        proteinPosEnd: number;
        count: number;
    }>,
    totalSequencedSamples: number
): void {
    if (!totalSequencedSamples) return;

    const freqByKey = new Map<string, number>();
    for (const countRow of counts) {
        const key = `${countRow.entrezGeneId}_${countRow.proteinPosStart}_${countRow.proteinPosEnd}`;
        freqByKey.set(key, countRow.count / totalSequencedSamples);
    }

    for (const sample of samples) {
        for (const detail of sample.oncogenic_mutation_details ?? []) {
            if (
                detail.entrezGeneId &&
                detail.proteinStart != null &&
                detail.proteinEnd != null
            ) {
                const key = `${detail.entrezGeneId}_${detail.proteinStart}_${detail.proteinEnd}`;
                const frequency = freqByKey.get(key);
                if (frequency !== undefined) {
                    detail.cohortFrequency = frequency;
                }
            }
        }
    }
}
