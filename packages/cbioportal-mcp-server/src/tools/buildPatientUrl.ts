/**
 * MCP Tool: build_patient_url
 * Build URLs for Patient/Sample View pages
 */

import { buildPatientUrl } from '../urlBuilders/index.js';
import { BuildPatientUrlInput } from '../types/index.js';

export const buildPatientUrlTool = {
    name: 'build_patient_url',
    description: `Build a cBioPortal Patient or Sample View URL.

This tool creates URLs that link to individual patient or sample detail pages in cBioPortal.

IMPORTANT: This tool expects validated IDs. Use the backend MCP server to query
and validate study and patient/sample IDs before calling this tool.

Backend Query Examples:
  - Get study: queryDatabase("SELECT CANCER_STUDY_ID FROM cancer_study WHERE CANCER_STUDY_ID = 'acc_tcga'")
  - Get patient: queryDatabase("SELECT PATIENT_ID FROM patient WHERE STABLE_ID = 'TCGA-OR-A5J1'")
  - Get sample: queryDatabase("SELECT STABLE_ID FROM sample WHERE STABLE_ID = 'TCGA-OR-A5J1-01'")

Input:
- studyId: Valid study identifier
- patientId or sampleId: Patient or sample identifier (provide one)
- tab: Optional tab to navigate to (summary, clinicalData, genomicEvolution, etc.)

Output: A complete cBioPortal Patient/Sample View URL

Examples:
Patient View:
  Input: { "studyId": "acc_tcga", "patientId": "TCGA-OR-A5J1" }
  Output: "https://www.cbioportal.org/patient?studyId=acc_tcga&caseId=TCGA-OR-A5J1"

Sample View:
  Input: { "studyId": "acc_tcga", "sampleId": "TCGA-OR-A5J1-01" }
  Output: "https://www.cbioportal.org/patient?studyId=acc_tcga&sampleId=TCGA-OR-A5J1-01"`,
    inputSchema: {
        type: 'object',
        properties: {
            studyId: {
                type: 'string',
                description: 'Valid study identifier',
            },
            patientId: {
                type: 'string',
                description: 'Patient identifier (use this OR sampleId)',
            },
            sampleId: {
                type: 'string',
                description: 'Sample identifier (use this OR patientId)',
            },
            tab: {
                type: 'string',
                description: 'Optional tab to navigate to',
            },
        },
        required: ['studyId'],
    },
};

export async function handleBuildPatientUrl(
    input: BuildPatientUrlInput
): Promise<string> {
    const { studyId, patientId, sampleId, tab } = input;

    // Validate that we have either patient or sample ID
    if (!patientId && !sampleId) {
        throw new Error('Either patientId or sampleId must be provided');
    }

    if (patientId && sampleId) {
        throw new Error('Provide either patientId or sampleId, not both');
    }

    // Build the URL
    return buildPatientUrl({
        studyId,
        caseId: patientId,
        sampleId: sampleId,
        tab,
    });
}
