/**
 * Study View URL builders
 */

import { buildCBioPortalPageUrl, QueryParams } from './core.js';

export interface StudyUrlOptions {
    studyIds: string | string[];
    tab?: string;
    filters?: Record<string, any>;
}

/**
 * Build a Study View URL
 */
export function buildStudyUrl(options: StudyUrlOptions): string {
    const { studyIds, tab, filters } = options;

    const studyIdArray = Array.isArray(studyIds) ? studyIds : [studyIds];
    const query: QueryParams = {
        id: studyIdArray.join(','),
    };

    // Add filters if provided
    if (filters) {
        Object.assign(query, filters);
    }

    // Build pathname with tab if specified
    const pathname = tab ? `/study/${tab}` : '/study';

    return buildCBioPortalPageUrl(pathname, query);
}

/**
 * Get Study Summary URL (convenience function)
 */
export function getStudySummaryUrl(studyIds: string | string[]): string {
    return buildStudyUrl({ studyIds });
}
