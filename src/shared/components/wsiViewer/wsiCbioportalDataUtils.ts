import {
    buildCnaBySample,
    buildMutationFrequencyQuery,
    buildMutationMaps,
    buildStructuralVariantBySample,
    MutationFrequencyQuery,
    SampleIdentifier,
} from './wsiDataMergeUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
} from './wsiViewerTypes';

type ClinicalEventRecord = {
    eventType: string;
    startNumberOfDaysSinceDiagnosis: number;
    attributes: Array<{ key: string; value: string }>;
};

type ClinicalDataRecord = {
    sampleId: string;
    clinicalAttributeId: string;
    value: string;
};

type MutationCountRecord = {
    entrezGeneId: number;
    proteinPosStart: number;
    proteinPosEnd: number;
    count: number;
};

export async function postJson<T>(
    url: string,
    body: unknown
): Promise<T | null> {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<T>;
}

async function getFirstMolecularProfileId(
    base: string,
    studyId: string,
    alterationType: string
): Promise<string | null> {
    const resp = await fetch(
        `${base}/api/studies/${encodeURIComponent(
            studyId
        )}/molecular-profiles` +
            `?molecularAlterationType=${alterationType}&projection=SUMMARY`
    );
    if (!resp.ok) return null;
    const profiles: Array<{
        molecularProfileId: string;
        molecularAlterationType?: string;
    }> = await resp.json();
    return (
        profiles.find(p => p.molecularAlterationType === alterationType)
            ?.molecularProfileId ??
        profiles[0]?.molecularProfileId ??
        null
    );
}

export async function fetchSampleTimepointMaps(
    base: string,
    studyId: string,
    patientId: string
): Promise<{
    acquisitionBySample: Map<string, number>;
    sequencingBySample: Map<string, number>;
} | null> {
    const resp = await fetch(
        `${base}/api/studies/${encodeURIComponent(
            studyId
        )}/patients/${encodeURIComponent(
            patientId
        )}/clinical-events?projection=DETAILED`
    );
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text) return null;
    const events: ClinicalEventRecord[] = JSON.parse(text);
    const acquisitionBySample = new Map<string, number>();
    const sequencingBySample = new Map<string, number>();

    const setMin = (
        target: Map<string, number>,
        sampleId: string,
        day: number
    ) => {
        const prev = target.get(sampleId);
        if (prev == null || day < prev) target.set(sampleId, day);
    };

    for (const event of events) {
        const day = event.startNumberOfDaysSinceDiagnosis;
        if (!Number.isFinite(day)) continue;
        const sampleId = event.attributes.find(
            attr =>
                attr.value &&
                (attr.key === 'SAMPLE_ID' ||
                    attr.key === 'SpecimenReferenceNumber' ||
                    attr.key === 'SPECIMEN_REFERENCE_NUMBER')
        )?.value;
        if (!sampleId) continue;

        const eventType = (event.eventType || '').trim().toLowerCase();
        if (eventType.includes('sequencing')) {
            setMin(sequencingBySample, sampleId, day);
        } else if (
            eventType.includes('sample acquisition') ||
            eventType.includes('specimen')
        ) {
            setMin(acquisitionBySample, sampleId, day);
        }
    }

    return { acquisitionBySample, sequencingBySample };
}

export async function fetchClinicalDataRecords(
    base: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<ClinicalDataRecord[] | null> {
    const identifiers = sampleIdentifiers.map(s => ({
        studyId: s.studyId,
        entityId: s.sampleId,
    }));
    const resp = await fetch(
        `${base}/api/clinical-data/fetch?clinicalDataType=SAMPLE&projection=SUMMARY`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifiers }),
        }
    );
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text) return null;
    return JSON.parse(text) as ClinicalDataRecord[];
}

export async function fetchMutationData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<{
    allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>;
    detailsBySample: Map<string, Map<string, MutationDetail>>;
} | null> {
    const molecularProfileId = await getFirstMolecularProfileId(
        base,
        studyId,
        'MUTATION_EXTENDED'
    );
    if (!molecularProfileId) return null;

    const sampleMolecularIdentifiers = sampleIdentifiers.map(s => ({
        molecularProfileId,
        sampleId: s.sampleId,
    }));

    const mutations: Array<{
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
    }> | null = await postJson(
        `${base}/api/mutations/fetch?projection=DETAILED`,
        { sampleMolecularIdentifiers }
    );
    if (!mutations) return null;

    return buildMutationMaps(mutations);
}

export async function fetchCnaData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, CNADetail[]> | null> {
    const profileId = await getFirstMolecularProfileId(
        base,
        studyId,
        'COPY_NUMBER_ALTERATION'
    );
    if (!profileId) return null;

    const sampleIds = sampleIdentifiers.map(s => s.sampleId);
    const data: Array<{
        sampleId: string;
        value: number;
        entrezGeneId?: number;
        gene?: {
            entrezGeneId?: number;
            hugoGeneSymbol: string;
            cytoband?: string;
        } | null;
    }> | null = await postJson(
        `${base}/api/molecular-profiles/${encodeURIComponent(
            profileId
        )}/molecular-data/fetch?projection=DETAILED`,
        { sampleIds }
    );
    if (!data) return null;

    const countRows: Array<{
        alteration: number;
        cytoband?: string;
        entrezGeneId: number;
        hugoGeneSymbol: string;
        numberOfAlteredCases?: number;
        numberOfProfiledCases?: number;
        totalCount?: number;
    }> | null = await postJson(`${base}/api/cna-genes/fetch`, {
        studyIds: [studyId],
        alterationFilter: {
            copyNumberAlterationEventTypes: {
                AMP: true,
                HOMDEL: true,
                GAIN: true,
                HETLOSS: true,
            },
        },
    });

    return buildCnaBySample(data, countRows);
}

export async function fetchStructuralVariantData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, StructuralVariantDetail[]> | null> {
    const profileId = await getFirstMolecularProfileId(
        base,
        studyId,
        'STRUCTURAL_VARIANT'
    );
    if (!profileId) return null;

    const rows: Array<{
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
    }> | null = await postJson(`${base}/api/structural-variant/fetch`, {
        sampleMolecularIdentifiers: sampleIdentifiers.map(({ sampleId }) => ({
            molecularProfileId: profileId,
            sampleId,
        })),
    });
    if (!rows) return null;

    return buildStructuralVariantBySample(rows);
}

export async function fetchMutationFrequencyData(
    base: string,
    studyId: string,
    samples: Sample[]
): Promise<{ counts: MutationCountRecord[]; total: number } | null> {
    const query: MutationFrequencyQuery[] = buildMutationFrequencyQuery(samples);
    if (!query.length) return null;

    const [studyResp, counts] = await Promise.all([
        fetch(`${base}/api/studies/${encodeURIComponent(studyId)}`),
        postJson<MutationCountRecord[]>(
            `${base}/api/mutation-counts-by-position/fetch`,
            query
        ),
    ]);
    if (!studyResp.ok || !counts) return null;

    const study: { sequencedSampleCount?: number } = await studyResp.json();
    const total = study.sequencedSampleCount ?? 0;
    if (!total) return null;

    return { counts, total };
}
