/**
 * Type definitions for MCP server
 */

// Re-export URL builder types
import { QueryParams, BuildUrlParams } from '../urlBuilders/core.js';
import { StudyUrlOptions } from '../urlBuilders/study.js';
import { PatientUrlOptions } from '../urlBuilders/patient.js';
import { ResultsUrlOptions } from '../urlBuilders/results.js';

export { QueryParams, BuildUrlParams };
export { StudyUrlOptions };
export { PatientUrlOptions };
export { ResultsUrlOptions };

// Tool input types
export interface BuildStudyUrlInput {
    studyIds: string | string[];
    tab?: string;
    filters?: Record<string, any>;
}

export interface BuildPatientUrlInput {
    studyId: string;
    patientId?: string;
    sampleId?: string;
    tab?: string;
}

export interface BuildResultsUrlInput {
    studies: string | string[];
    genes: string | string[];
    caseSelection: {
        type: 'all' | 'case_set' | 'custom';
        caseSetId?: string;
        caseIds?: string | string[];
    };
    tab?: string;
    options?: Record<string, any>;
}
