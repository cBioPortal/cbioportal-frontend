/**
 * MCP Tool: build_study_url
 * Build URLs for Study View pages
 */

import { buildStudyUrl } from '../urlBuilders/index.js';
import { BuildStudyUrlInput } from '../types/index.js';

export const buildStudyUrlTool = {
    name: 'build_study_url',
    description: `Build a cBioPortal Study View URL.

This tool creates URLs that link to study overview pages in cBioPortal.

IMPORTANT: This tool expects valid study IDs. Use the backend MCP server to query
and validate study IDs before calling this tool.

Backend Query Example:
  queryDatabase("SELECT CANCER_STUDY_ID FROM cancer_study WHERE NAME LIKE '%tcga%'")

Input:
- studyIds: Single study ID or array of study IDs (e.g., "acc_tcga" or ["acc_tcga", "luad_tcga"])
- tab: Optional tab to navigate to (summary, clinicalData, heatmaps, plots, etc.)
- filters: Optional filters to apply to the study view

Output: A complete cBioPortal Study View URL

Example:
Input: { "studyIds": "acc_tcga" }
Output: "https://www.cbioportal.org/study?id=acc_tcga"

Multiple Studies:
Input: { "studyIds": ["acc_tcga", "luad_tcga"] }
Output: "https://www.cbioportal.org/study?id=acc_tcga,luad_tcga"`,
    inputSchema: {
        type: 'object',
        properties: {
            studyIds: {
                oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                ],
                description: 'Study ID(s) - validated study identifier(s)',
            },
            tab: {
                type: 'string',
                description:
                    'Optional tab to navigate to (e.g., summary, clinicalData, plots)',
            },
            filters: {
                type: 'object',
                description: 'Optional filters to apply',
            },
        },
        required: ['studyIds'],
    },
};

export async function handleBuildStudyUrl(
    input: BuildStudyUrlInput
): Promise<string> {
    let { studyIds, tab, filters } = input;

    // Handle case where studyIds is passed as a JSON string
    if (typeof studyIds === 'string' && studyIds.trim().startsWith('[')) {
        try {
            studyIds = JSON.parse(studyIds);
        } catch (e) {
            // If parsing fails, treat it as a single study ID
        }
    }

    // Normalize to array
    const studyIdArray = Array.isArray(studyIds) ? studyIds : [studyIds];

    // Validate input
    if (studyIdArray.length === 0) {
        throw new Error('At least one study ID is required');
    }

    // Build the URL
    const url = buildStudyUrl({
        studyIds: studyIdArray,
        tab,
        filters,
    });

    return url;
}
