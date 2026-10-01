import * as React from 'react';
import {
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
} from 'cbioportal-ts-api-client';
import { WsiClinicalRow } from 'cbioportal-wsi-viewer';
import { getServerConfig } from 'config/config';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { getInternalClient } from 'shared/api/cbioportalInternalClientInstance';
import { clean } from 'pages/patientView/clinicalInformation/lib/clinicalAttributesUtil.js';
import {
    clinicalAttributeComparator,
    getPriorityByClinicalAttribute,
} from 'pages/studyView/StudyViewUtils';

/**
 * Smallest share of the study's samples with a value for an attribute to be
 * shown: sparsely populated attributes are mostly empty in the sidebar.
 */
export const WSI_CLINICAL_MIN_FREQUENCY = 0.5;

/**
 * Attributes left out of the Clinical section although the study shows them
 * by default: sequencing QC and administrative fields that say nothing about
 * the patient or the tissue on the slide.
 */
export const WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS: ReadonlySet<string> = new Set(
    [
        'GENE_PANEL',
        'INSTITUTE',
        'OTHER_PATIENT_ID',
        'SAMPLE_COVERAGE',
        'SOMATIC_STATUS',
    ]
);

/** Consent flags, e.g. PARTA_CONSENTED_12_245. */
const CONSENT_ATTRIBUTE = /CONSENTED/i;

function isExcludedClinicalAttribute(attributeId: string): boolean {
    return (
        WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS.has(attributeId) ||
        CONSENT_ATTRIBUTE.test(attributeId)
    );
}

/**
 * The study's default clinical attributes, as the study view picks its
 * default charts and Clinical Data columns: priority above 0 (with the
 * frontend priority overrides), highest priority first, at most
 * `studyview_clinical_attribute_chart_count`, without the
 * WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS and consent flags. When counts are
 * known, attributes populated for fewer than WSI_CLINICAL_MIN_FREQUENCY of
 * the study's samples are left out.
 */
export function selectWsiClinicalAttributes(
    attributes: ReadonlyArray<ClinicalAttribute>,
    counts: ReadonlyArray<ClinicalAttributeCount> | undefined,
    sampleCount: number | undefined,
    limit: number = getServerConfig().studyview_clinical_attribute_chart_count
): ClinicalAttribute[] {
    const countById = counts
        ? new Map(counts.map(c => [c.clinicalAttributeId, c.count]))
        : undefined;
    return attributes
        .map(attribute => ({
            ...attribute,
            priority: getPriorityByClinicalAttribute(attribute).toString(),
        }))
        .filter(attribute => (parseInt(attribute.priority) || 0) > 0)
        .filter(
            attribute =>
                !isExcludedClinicalAttribute(attribute.clinicalAttributeId)
        )
        .filter(
            attribute =>
                !countById ||
                !sampleCount ||
                (countById.get(attribute.clinicalAttributeId) || 0) /
                    sampleCount >=
                    WSI_CLINICAL_MIN_FREQUENCY
        )
        .sort(clinicalAttributeComparator)
        .slice(0, limit);
}

function cleanedValuesByEntity(
    clinicalData: ReadonlyArray<ClinicalData>,
    entityId: (datum: ClinicalData) => string
): Map<string, Record<string, string>> {
    const raw = new Map<string, Record<string, string>>();
    for (const datum of clinicalData) {
        if (datum.value == null) continue;
        const id = entityId(datum);
        const values = raw.get(id) || {};
        values[datum.clinicalAttributeId] = String(datum.value).trim();
        raw.set(id, values);
    }
    const cleaned = new Map<string, Record<string, string>>();
    raw.forEach((values, id) =>
        cleaned.set(id, clean(values) as Record<string, string>)
    );
    return cleaned;
}

/**
 * Sidebar rows for the selected attributes, in their order. Patient
 * attributes give one row; sample attributes one row per sample with a
 * value, tagged with its sample ID. Null-like values ("Not Available",
 * "unknown", ...) are dropped as in the patient header.
 */
export function buildWsiClinicalRows(
    attributes: ReadonlyArray<ClinicalAttribute>,
    patientData: ReadonlyArray<ClinicalData>,
    sampleData: ReadonlyArray<ClinicalData>
): WsiClinicalRow[] {
    const patientValues =
        cleanedValuesByEntity(patientData, () => '').get('') || {};
    const sampleValues = cleanedValuesByEntity(
        sampleData,
        datum => datum.sampleId
    );

    const rows: WsiClinicalRow[] = [];
    for (const attribute of attributes) {
        const id = attribute.clinicalAttributeId;
        const labelTip =
            attribute.description &&
            attribute.description !== attribute.displayName
                ? attribute.description
                : undefined;
        const row = (value: string, sampleId?: string): WsiClinicalRow => ({
            label: attribute.displayName,
            value,
            ...(labelTip ? { labelTip } : {}),
            ...(sampleId ? { sampleId } : {}),
        });
        if (attribute.patientAttribute) {
            if (patientValues[id] !== undefined) {
                rows.push(row(patientValues[id]));
            }
        } else {
            sampleValues.forEach((values, sampleId) => {
                if (values[id] !== undefined) {
                    rows.push(row(values[id], sampleId));
                }
            });
        }
    }
    return rows;
}

const studyAttributeRequests = new Map<string, Promise<ClinicalAttribute[]>>();
const clinicalRowsRequests = new Map<string, Promise<WsiClinicalRow[]>>();

function cached<T>(
    cache: Map<string, Promise<T>>,
    key: string,
    load: () => Promise<T>
): Promise<T> {
    let request = cache.get(key);
    if (!request) {
        request = load();
        // A failed request is retried the next time it is needed.
        request.catch(() => cache.delete(key));
        cache.set(key, request);
    }
    return request;
}

function fetchStudyClinicalAttributes(
    studyId: string
): Promise<ClinicalAttribute[]> {
    return cached(studyAttributeRequests, studyId, async () => {
        const [attributes, study, counts] = await Promise.all([
            getClient().getAllClinicalAttributesInStudyUsingGET({ studyId }),
            getClient().getStudyUsingGET({ studyId }),
            // Frequencies are optional: without an "all" sample list every
            // default attribute is kept.
            getInternalClient()
                .getClinicalAttributeCountsUsingPOST({
                    clinicalAttributeCountFilter: {
                        sampleListId: `${studyId}_all`,
                    } as ClinicalAttributeCountFilter,
                })
                .catch(() => undefined),
        ]);
        return selectWsiClinicalAttributes(
            attributes,
            counts,
            study.allSampleCount
        );
    });
}

function fetchWsiClinicalRows(
    studyId: string,
    patientId: string
): Promise<WsiClinicalRow[]> {
    return cached(
        clinicalRowsRequests,
        `${studyId}\u0000${patientId}`,
        async () => {
            const [attributes, patientData, samples] = await Promise.all([
                fetchStudyClinicalAttributes(studyId),
                getClient().getAllClinicalDataOfPatientInStudyUsingGET({
                    studyId,
                    patientId,
                }),
                getClient().getAllSamplesOfPatientInStudyUsingGET({
                    studyId,
                    patientId,
                }),
            ]);
            const sampleAttributeIds = attributes
                .filter(attribute => !attribute.patientAttribute)
                .map(attribute => attribute.clinicalAttributeId);
            const sampleData =
                samples.length > 0 && sampleAttributeIds.length > 0
                    ? await getClient().fetchClinicalDataUsingPOST({
                          clinicalDataType: 'SAMPLE',
                          clinicalDataMultiStudyFilter: {
                              attributeIds: sampleAttributeIds,
                              identifiers: samples.map(sample => ({
                                  studyId,
                                  entityId: sample.sampleId,
                              })),
                          },
                      })
                    : [];
            return buildWsiClinicalRows(attributes, patientData, sampleData);
        }
    );
}

export function clearWsiClinicalRowsCache(): void {
    studyAttributeRequests.clear();
    clinicalRowsRequests.clear();
}

/**
 * The patient's Clinical rows; undefined while loading or after a failed
 * request, which hides the section.
 */
export function useWsiClinicalRows(
    studyId: string,
    patientId: string
): WsiClinicalRow[] | undefined {
    const [state, setState] = React.useState<{
        key: string;
        rows: WsiClinicalRow[];
    }>();
    const key = `${studyId}\u0000${patientId}`;

    React.useEffect(() => {
        if (!studyId || !patientId) return;
        let cancelled = false;
        fetchWsiClinicalRows(studyId, patientId).then(
            rows => {
                if (!cancelled) setState({ key, rows });
            },
            error => {
                console.error(
                    '[WSI] patient clinical data fetch failed',
                    error
                );
            }
        );
        return () => {
            cancelled = true;
        };
    }, [key]);

    return state?.key === key ? state.rows : undefined;
}
