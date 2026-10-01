import * as React from 'react';
import { ClinicalData } from 'cbioportal-ts-api-client';
import { WsiClinicalRow } from 'cbioportal-wsi-viewer';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { clean } from 'pages/patientView/clinicalInformation/lib/clinicalAttributesUtil.js';

/**
 * Curated patient attributes shown in the viewer sidebar's Clinical section,
 * in display order. Each label lists attribute IDs in priority order; the
 * first one with a non-null value wins.
 */
export const WSI_CLINICAL_FIELDS: ReadonlyArray<{
    label: string;
    attributeIds: ReadonlyArray<string>;
}> = [
    { label: 'Age', attributeIds: ['AGE', 'AGE_AT_DIAGNOSIS'] },
    { label: 'Sex', attributeIds: ['SEX', 'GENDER'] },
    { label: 'Race', attributeIds: ['RACE'] },
    { label: 'Ethnicity', attributeIds: ['ETHNICITY'] },
    { label: 'Smoking history', attributeIds: ['SMOKING_HISTORY'] },
    {
        label: 'Stage',
        attributeIds: [
            'STAGE',
            'STAGE_HIGHEST_RECORDED',
            'AJCC_PATHOLOGIC_TUMOR_STAGE',
        ],
    },
    { label: 'OS status', attributeIds: ['OS_STATUS'] },
    { label: 'OS (months)', attributeIds: ['OS_MONTHS'] },
];

/**
 * Sidebar rows from patient clinical data. Null-like values ("Not
 * Available", "unknown", ...) are dropped and ages/months floored, as in the
 * patient header.
 */
export function buildWsiClinicalRows(
    clinicalData: ReadonlyArray<ClinicalData>
): WsiClinicalRow[] {
    const values: Record<string, string> = {};
    const displayNames: Record<string, string | undefined> = {};
    for (const datum of clinicalData) {
        if (datum.value == null) continue;
        values[datum.clinicalAttributeId] = String(datum.value).trim();
        displayNames[datum.clinicalAttributeId] =
            datum.clinicalAttribute?.displayName;
    }
    const cleaned = clean(values) as Record<string, string>;

    const rows: WsiClinicalRow[] = [];
    for (const field of WSI_CLINICAL_FIELDS) {
        const attributeId = field.attributeIds.find(
            id => cleaned[id] !== undefined
        );
        if (!attributeId) continue;
        const displayName = displayNames[attributeId];
        rows.push({
            label: field.label,
            value: String(cleaned[attributeId]),
            ...(displayName && displayName !== field.label
                ? { labelTip: displayName }
                : {}),
        });
    }
    return rows;
}

const clinicalRowsRequests = new Map<string, Promise<WsiClinicalRow[]>>();

function fetchWsiClinicalRows(
    studyId: string,
    patientId: string
): Promise<WsiClinicalRow[]> {
    const key = `${studyId}\u0000${patientId}`;
    let request = clinicalRowsRequests.get(key);
    if (!request) {
        request = getClient()
            .getAllClinicalDataOfPatientInStudyUsingGET({
                projection: 'DETAILED',
                studyId,
                patientId,
            })
            .then(buildWsiClinicalRows);
        // A failed request is retried the next time the patient is shown.
        request.catch(() => clinicalRowsRequests.delete(key));
        clinicalRowsRequests.set(key, request);
    }
    return request;
}

export function clearWsiClinicalRowsCache(): void {
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
