import SampleManager from 'pages/patientView/SampleManager';
import type { ISampleMetaDeta } from './TimelineWrapper';

type CachedSampleManagerSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
    samplesRef: SampleManager['samples'];
};

type ClinicalDataEntry = {
    clinicalAttributeId?: string | null;
    value?: string | null;
};

type CachedClinicalDataSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
};

type CachedCaseMetaDataSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
};

const sampleManagerSignatureCache = new WeakMap<
    SampleManager,
    CachedSampleManagerSignatureEntry
>();
const clinicalDataSignatureCache = new WeakMap<
    ClinicalDataEntry[],
    CachedClinicalDataSignatureEntry
>();
const caseMetaDataSignatureCache = new WeakMap<
    ISampleMetaDeta,
    CachedCaseMetaDataSignatureEntry
>();

function buildClinicalDataSignature(
    clinicalData: ClinicalDataEntry[] = []
): string {
    const entries = new Array<string>(clinicalData.length);

    for (let index = 0; index < clinicalData.length; index += 1) {
        const item = clinicalData[index];
        entries[index] = `${item.clinicalAttributeId || ''}:${
            item.value || ''
        }`;
    }
    const orderedSnapshot = entries.join('|');

    const cached = clinicalDataSignatureCache.get(clinicalData);
    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    const signature = entries
        .filter(entry => entry.length > 0)
        .sort((left, right) => left.localeCompare(right))
        .join('|');

    clinicalDataSignatureCache.set(clinicalData, {
        orderedSnapshot,
        signature,
    });

    return signature;
}

export function buildTimelineSampleManagerSignature(
    sampleManager: SampleManager
): string {
    const samples = sampleManager.samples || [];
    const sampleEntries = new Array<string>(samples.length);

    for (let index = 0; index < samples.length; index += 1) {
        const sample = samples[index];
        sampleEntries[index] = `${sample.id || ''}::${buildClinicalDataSignature(
            sample.clinicalData
        )}`;
    }
    const orderedSnapshot = sampleEntries.join('||');

    const cached = sampleManagerSignatureCache.get(sampleManager);

    if (
        cached &&
        cached.samplesRef === sampleManager.samples &&
        cached.orderedSnapshot === orderedSnapshot
    ) {
        return cached.signature;
    }

    const signature = orderedSnapshot;

    sampleManagerSignatureCache.set(sampleManager, {
        orderedSnapshot,
        signature,
        samplesRef: sampleManager.samples,
    });

    return signature;
}

export function buildTimelineCaseMetaDataSignature(
    caseMetaData: ISampleMetaDeta
): string {
    const sampleIdSet = new Set<string>();
    const colorEntries = caseMetaData.color || {};
    for (const sampleId in colorEntries) {
        sampleIdSet.add(sampleId);
    }
    const indexEntries = caseMetaData.index || {};
    for (const sampleId in indexEntries) {
        sampleIdSet.add(sampleId);
    }
    const labelEntries = caseMetaData.label || {};
    for (const sampleId in labelEntries) {
        sampleIdSet.add(sampleId);
    }

    const sampleIds = Array.from(sampleIdSet);
    sampleIds.sort((left, right) => left.localeCompare(right));
    const entries = new Array<string>(sampleIds.length);

    for (let index = 0; index < sampleIds.length; index += 1) {
        const sampleId = sampleIds[index];
        entries[index] = `${sampleId}:${colorEntries[sampleId] || ''}:${
            indexEntries[sampleId] ?? ''
        }:${labelEntries[sampleId] || ''}`;
    }
    const orderedSnapshot = entries.join('|');

    const cached = caseMetaDataSignatureCache.get(caseMetaData);

    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    const signature = orderedSnapshot;

    caseMetaDataSignatureCache.set(caseMetaData, {
        orderedSnapshot,
        signature,
    });

    return signature;
}
