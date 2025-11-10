/**
 * Patient/Sample View URL builders
 */

import { buildCBioPortalPageUrl, QueryParams } from './core.js';

export interface PatientUrlOptions {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    tab?: string;
    navIds?: Array<{ patientId: string; studyId: string }>;
}

/**
 * Build a Patient or Sample View URL
 */
export function buildPatientUrl(options: PatientUrlOptions): string {
    const { studyId, caseId, sampleId, tab, navIds } = options;

    if (!caseId && !sampleId) {
        throw new Error('Either caseId or sampleId must be provided');
    }

    const query: QueryParams = {
        studyId,
    };

    if (caseId) {
        query.caseId = caseId;
    } else if (sampleId) {
        query.sampleId = sampleId;
    }

    // Build hash for navigation if provided
    let hash: string | undefined;
    if (navIds && navIds.length > 0) {
        hash = `navCaseIds=${navIds
            .map(id => `${id.studyId}:${id.patientId}`)
            .join(',')}`;
    }

    // Build pathname with tab if specified
    const pathname = tab ? `/patient/${tab}` : '/patient';

    return buildCBioPortalPageUrl(pathname, query, hash);
}

/**
 * Get Patient View URL (convenience function)
 */
export function getPatientViewUrl(
    studyId: string,
    caseId: string,
    navIds?: Array<{ patientId: string; studyId: string }>
): string {
    return buildPatientUrl({ studyId, caseId, navIds });
}

/**
 * Get Sample View URL (convenience function)
 */
export function getSampleViewUrl(
    studyId: string,
    sampleId: string,
    navIds?: Array<{ patientId: string; studyId: string }>
): string {
    return buildPatientUrl({ studyId, sampleId, navIds });
}
