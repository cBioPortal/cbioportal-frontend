/**
 * MCP Tool: build_results_url
 * Build URLs for Results View pages (query/analysis results)
 */

import { buildResultsUrl } from '../urlBuilders/index.js';
import { BuildResultsUrlInput } from '../types/index.js';

export const buildResultsUrlTool = {
    name: 'build_results_url',
    description: `Build a cBioPortal Results View URL for genomic analysis.

This tool creates URLs for query results pages, including oncoprint visualizations,
mutation analysis, survival plots, and more.

IMPORTANT: This tool expects validated data. Use the backend MCP server to:
1. Query and validate study IDs
2. Validate gene symbols
3. Get available case sets

Backend Query Examples:
  - Find studies: queryDatabase("SELECT CANCER_STUDY_ID FROM cancer_study WHERE NAME LIKE '%lung%'")
  - Validate genes: queryDatabase("SELECT HUGO_GENE_SYMBOL FROM gene WHERE HUGO_GENE_SYMBOL IN ('TP53', 'KRAS')")
  - Get case sets: queryDatabase("SELECT CASE_LIST_ID FROM case_list WHERE CANCER_STUDY_ID = 'acc_tcga'")

Input:
- studies: Array of validated study IDs
- genes: Array of validated gene symbols (e.g., ["TP53", "KRAS"])
- caseSelection: How to select cases:
  - type: "all" | "case_set" | "custom"
  - caseSetId: For case_set type (e.g., "acc_tcga_all")
  - caseIds: For custom type (array of case IDs)
- tab: Optional tab (oncoprint, mutations, plots, coexpression, etc.)
- options: Optional advanced settings:
  - zScoreThreshold: Z-score threshold for expression data
  - rppaScoreThreshold: RPPA score threshold
  - profileFilter: Profile filter setting
  - excludeGermlineMutations: Boolean
  - sortBy: Oncoprint sorting configuration
  - plotsHorzSelection: Plots horizontal axis configuration
  - plotsVertSelection: Plots vertical axis configuration
  - And many more...

Output: A complete cBioPortal Results View URL

Example:
Input: {
  "studies": ["acc_tcga"],
  "genes": ["TP53", "KRAS"],
  "caseSelection": { "type": "case_set", "caseSetId": "acc_tcga_all" }
}
Output: "https://www.cbioportal.org/results?cancer_study_list=acc_tcga&gene_list=TP53%20KRAS&case_set_id=acc_tcga_all"

Advanced Example with Plots:
Input: {
  "studies": ["acc_tcga"],
  "genes": ["TP53", "KRAS"],
  "caseSelection": { "type": "case_set", "caseSetId": "acc_tcga_all" },
  "tab": "plots",
  "options": {
    "plotsHorzSelection": { "selectedGeneOption": "TP53", "dataType": "mrna" },
    "plotsVertSelection": { "selectedGeneOption": "KRAS", "dataType": "mrna" }
  }
}`,
    inputSchema: {
        type: 'object',
        properties: {
            studies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of validated study IDs',
            },
            genes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of validated gene symbols',
            },
            caseSelection: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['all', 'case_set', 'custom'],
                    },
                    caseSetId: { type: 'string' },
                    caseIds: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                required: ['type'],
                description: 'Case/sample selection strategy',
            },
            tab: {
                type: 'string',
                description: 'Optional tab (oncoprint, mutations, plots, etc.)',
            },
            options: {
                type: 'object',
                description: 'Optional advanced query settings',
            },
        },
        required: ['studies', 'genes', 'caseSelection'],
    },
};

export async function handleBuildResultsUrl(
    input: BuildResultsUrlInput
): Promise<string> {
    const { studies, genes, caseSelection, tab, options } = input;

    // Parse and normalize studies
    let studiesArray: string[];
    if (typeof studies === 'string') {
        if (studies.trim().startsWith('[')) {
            try {
                studiesArray = JSON.parse(studies) as string[];
            } catch (e) {
                studiesArray = [studies];
            }
        } else {
            studiesArray = [studies];
        }
    } else {
        studiesArray = studies;
    }

    // Parse and normalize genes
    let genesArray: string[];
    if (typeof genes === 'string') {
        if (genes.trim().startsWith('[')) {
            try {
                genesArray = JSON.parse(genes) as string[];
            } catch (e) {
                genesArray = [genes];
            }
        } else {
            genesArray = [genes];
        }
    } else {
        genesArray = genes;
    }

    // Parse and normalize caseIds
    let caseIdsArray: string[] | undefined;
    if (caseSelection?.caseIds) {
        if (typeof caseSelection.caseIds === 'string') {
            if (caseSelection.caseIds.trim().startsWith('[')) {
                try {
                    caseIdsArray = JSON.parse(
                        caseSelection.caseIds
                    ) as string[];
                } catch (e) {
                    caseIdsArray = [caseSelection.caseIds];
                }
            } else {
                caseIdsArray = [caseSelection.caseIds];
            }
        } else {
            caseIdsArray = caseSelection.caseIds;
        }
    }
    const normalizedCaseSelection = {
        ...caseSelection,
        caseIds: caseIdsArray,
    };

    // Validate input
    if (studiesArray.length === 0) {
        throw new Error('At least one study is required');
    }

    if (genesArray.length === 0) {
        throw new Error('At least one gene is required');
    }

    if (!normalizedCaseSelection || !normalizedCaseSelection.type) {
        throw new Error('Case selection type is required');
    }

    // Validate case selection based on type
    if (
        normalizedCaseSelection.type === 'case_set' &&
        !normalizedCaseSelection.caseSetId
    ) {
        throw new Error('caseSetId is required when type is "case_set"');
    }

    if (
        normalizedCaseSelection.type === 'custom' &&
        (!normalizedCaseSelection.caseIds ||
            normalizedCaseSelection.caseIds.length === 0)
    ) {
        throw new Error('caseIds array is required when type is "custom"');
    }

    // Build the URL
    const url = buildResultsUrl({
        studies: studiesArray,
        genes: genesArray,
        caseSelection: normalizedCaseSelection,
        tab,
        options,
    });

    return url;
}
