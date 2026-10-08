import * as React from 'react';
import {
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
} from 'cbioportal-ts-api-client';
import { WsiClinicalRow } from 'cbioportal-wsi-viewer';
import { getServerConfig } from 'config/config';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { clean } from 'pages/patientView/clinicalInformation/lib/clinicalAttributesUtil.js';
import {
    clinicalAttributeComparator,
    getPriorityByClinicalAttribute,
} from 'pages/studyView/StudyViewUtils';

/** A patient's clinical data, as the patient view has already loaded it. */
export interface WsiPatientClinicalData {
    /** The study's clinical attributes. */
    attributes: ReadonlyArray<ClinicalAttribute>;
    patientData: ReadonlyArray<ClinicalData>;
    /** Data of every sample of the patient. */
    sampleData: ReadonlyArray<ClinicalData>;
}

/**
 * Attributes left out of the Clinical section: sequencing QC and
 * administrative fields that say nothing about the patient or the tissue on
 * the slide, PATH_SLIDE_EXISTS, which the viewer itself already answers, and
 * MSK_SLIDE_ID, whose values are source image identifiers the viewer keeps
 * out of the browser.
 */
export const WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS: ReadonlySet<string> = new Set(
    [
        'GENE_PANEL',
        'INSTITUTE',
        'MSK_SLIDE_ID',
        'OTHER_PATIENT_ID',
        'PATH_SLIDE_EXISTS',
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

function cleanedPatientValues(
    patientData: ReadonlyArray<ClinicalData>
): Record<string, string> {
    return cleanedValuesByEntity(patientData, () => '').get('') || {};
}

function cleanedSampleValues(
    sampleData: ReadonlyArray<ClinicalData>
): Map<string, Record<string, string>> {
    return cleanedValuesByEntity(sampleData, datum => datum.sampleId);
}

/**
 * The study's clinical attributes that have a value for this patient, with
 * the frontend priority overrides applied, highest priority first. Leaves out
 * hidden attributes (priority below 0), the WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS
 * and consent flags. Null-like values ("Not Available", "unknown", ...) count
 * as missing.
 */
function populatedWsiClinicalAttributes(
    attributes: ReadonlyArray<ClinicalAttribute>,
    patientData: ReadonlyArray<ClinicalData>,
    sampleData: ReadonlyArray<ClinicalData>
): ClinicalAttribute[] {
    const patientValues = cleanedPatientValues(patientData);
    const sampleValues = Array.from(cleanedSampleValues(sampleData).values());
    const hasValue = (attribute: ClinicalAttribute) => {
        const id = attribute.clinicalAttributeId;
        return attribute.patientAttribute
            ? patientValues[id] !== undefined
            : sampleValues.some(values => values[id] !== undefined);
    };
    return attributes
        .map(attribute => ({
            ...attribute,
            priority: getPriorityByClinicalAttribute(attribute).toString(),
        }))
        .filter(attribute => (parseInt(attribute.priority) || 0) >= 0)
        .filter(
            attribute =>
                !isExcludedClinicalAttribute(attribute.clinicalAttributeId)
        )
        .filter(hasValue)
        .sort(clinicalAttributeComparator);
}

function isDefaultClinicalAttribute(attribute: ClinicalAttribute): boolean {
    return (parseInt(attribute.priority) || 0) > 0;
}

/**
 * The study's default clinical attributes that have a value for this
 * patient, as the study view picks its default charts and Clinical Data
 * columns: priority above 0 (with the frontend priority overrides), highest
 * priority first, at most `studyview_clinical_attribute_chart_count`,
 * without the WSI_CLINICAL_EXCLUDED_ATTRIBUTE_IDS and consent flags.
 * Null-like values ("Not Available", "unknown", ...) count as missing.
 */
export function selectWsiClinicalAttributes(
    attributes: ReadonlyArray<ClinicalAttribute>,
    patientData: ReadonlyArray<ClinicalData>,
    sampleData: ReadonlyArray<ClinicalData>,
    limit: number = getServerConfig().studyview_clinical_attribute_chart_count
): ClinicalAttribute[] {
    return populatedWsiClinicalAttributes(attributes, patientData, sampleData)
        .filter(isDefaultClinicalAttribute)
        .slice(0, limit);
}

/**
 * The patient's other populated attributes, for "Show more": those past the
 * chart count and those the study does not show by default (priority 0),
 * highest priority first, then by name.
 */
export function selectWsiMoreClinicalAttributes(
    attributes: ReadonlyArray<ClinicalAttribute>,
    patientData: ReadonlyArray<ClinicalData>,
    sampleData: ReadonlyArray<ClinicalData>,
    limit: number = getServerConfig().studyview_clinical_attribute_chart_count
): ClinicalAttribute[] {
    const shown = new Set(
        selectWsiClinicalAttributes(
            attributes,
            patientData,
            sampleData,
            limit
        ).map(attribute => attribute.clinicalAttributeId)
    );
    return populatedWsiClinicalAttributes(
        attributes,
        patientData,
        sampleData
    ).filter(attribute => !shown.has(attribute.clinicalAttributeId));
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
    const patientValues = cleanedPatientValues(patientData);
    const sampleValues = cleanedSampleValues(sampleData);

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

/**
 * Sidebar rows for the patient's default, populated attributes, followed by
 * the rows of their other populated attributes, marked `more`.
 */
export function buildWsiPatientClinicalRows({
    attributes,
    patientData,
    sampleData,
}: WsiPatientClinicalData): WsiClinicalRow[] {
    return [
        ...buildWsiClinicalRows(
            selectWsiClinicalAttributes(attributes, patientData, sampleData),
            patientData,
            sampleData
        ),
        ...buildWsiClinicalRows(
            selectWsiMoreClinicalAttributes(
                attributes,
                patientData,
                sampleData
            ),
            patientData,
            sampleData
        ).map(row => ({ ...row, more: true })),
    ];
}

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

function fetchWsiClinicalRows(
    studyId: string,
    patientId: string
): Promise<WsiClinicalRow[]> {
    return cached(
        clinicalRowsRequests,
        `${studyId}\u0000${patientId}`,
        async () => {
            const [attributes, patientData, samples] = await Promise.all([
                getClient().getAllClinicalAttributesInStudyUsingGET({
                    studyId,
                }),
                getClient().getAllClinicalDataOfPatientInStudyUsingGET({
                    studyId,
                    patientId,
                }),
                getClient().getAllSamplesOfPatientInStudyUsingGET({
                    studyId,
                    patientId,
                }),
            ]);
            const sampleData =
                samples.length > 0
                    ? await getClient().fetchClinicalDataUsingPOST({
                          clinicalDataType: 'SAMPLE',
                          clinicalDataMultiStudyFilter: {
                              identifiers: samples.map(sample => ({
                                  studyId,
                                  entityId: sample.sampleId,
                              })),
                          } as ClinicalDataMultiStudyFilter,
                      })
                    : [];
            return buildWsiPatientClinicalRows({
                attributes,
                patientData,
                sampleData,
            });
        }
    );
}

export function clearWsiClinicalRowsCache(): void {
    clinicalRowsRequests.clear();
}

/**
 * The patient's Clinical rows; undefined while loading or after a failed
 * request, which hides the section. Rows come from `clinicalData` when the
 * host has loaded it (`null` while it is still loading); when it is unset
 * the patient's data is fetched here.
 */
export function useWsiClinicalRows(
    studyId: string,
    patientId: string,
    clinicalData?: WsiPatientClinicalData | null
): WsiClinicalRow[] | undefined {
    const [state, setState] = React.useState<{
        key: string;
        rows: WsiClinicalRow[];
    }>();
    const key = `${studyId}\u0000${patientId}`;
    const hostLoads = clinicalData !== undefined;
    const hostRows = React.useMemo(
        () =>
            clinicalData
                ? buildWsiPatientClinicalRows(clinicalData)
                : undefined,
        [
            clinicalData?.attributes,
            clinicalData?.patientData,
            clinicalData?.sampleData,
        ]
    );

    React.useEffect(() => {
        if (hostLoads || !studyId || !patientId) return;
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
    }, [key, hostLoads]);

    if (hostLoads) return hostRows;
    return state?.key === key ? state.rows : undefined;
}
