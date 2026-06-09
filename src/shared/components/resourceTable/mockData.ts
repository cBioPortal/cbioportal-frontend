/**
 * Mock data for ResourceDataTable development and manual testing.
 *
 * Covers all cases:
 *   - 3 resource tabs: HE_SLIDE (SAMPLE, 25 rows), CT_SCAN (PATIENT, 8 rows), FIGURES (STUDY, 3 rows)
 *   - Builtin columns: patientId, sampleId, url, displayName, type, priority
 *   - Metadata columns per tab (HE_SLIDE: stain, magnification; FIGURES: pages)
 *   - Pagination: 25 rows on HE_SLIDE tab exercises the 20-per-page default
 *   - Search / sort on all builtin + metadata fields
 *   - Mix of null patientId/sampleId (STUDY rows) and populated ones
 */

import {
    ResourceTableTab,
    ResourceColumnInfo,
    ResourceTableRow,
    ResourceTableResult,
} from './../../api/resourceTableClient';

// ── Tabs ──────────────────────────────────────────────────────────────────────

export const MOCK_TABS: ResourceTableTab[] = [
    {
        resourceId: 'HE_SLIDE',
        label: 'H&E Slide',
        totalCount: 25,
        patientCount: 10,
        sampleCount: 25,
    },
    {
        resourceId: 'CT_SCAN',
        label: 'CT Scan',
        totalCount: 8,
        patientCount: 8,
        sampleCount: 0,
    },
    {
        resourceId: 'FIGURES',
        label: 'Study Figures',
        totalCount: 3,
        patientCount: 0,
        sampleCount: 0,
    },
];

// ── Columns ───────────────────────────────────────────────────────────────────

const BUILTIN_COLUMNS: ResourceColumnInfo[] = [
    { id: 'patientId',   label: 'Patient',     source: 'builtin',   dataType: 'STRING',  filterable: true,  sortable: true,  visibleByDefault: true  },
    { id: 'sampleId',    label: 'Sample',      source: 'builtin',   dataType: 'STRING',  filterable: true,  sortable: true,  visibleByDefault: true  },
    { id: 'displayName', label: 'Name',        source: 'builtin',   dataType: 'STRING',  filterable: true,  sortable: true,  visibleByDefault: true  },
    { id: 'type',        label: 'Type',        source: 'builtin',   dataType: 'STRING',  filterable: true,  sortable: true,  visibleByDefault: true  },
    { id: 'priority',    label: 'Priority',    source: 'builtin',   dataType: 'NUMBER',  filterable: false, sortable: true,  visibleByDefault: false },
    { id: 'url',         label: 'Link',        source: 'builtin',   dataType: 'STRING',  filterable: false, sortable: false, visibleByDefault: true  },
];

export const MOCK_COLUMNS: Record<string, ResourceColumnInfo[]> = {
    HE_SLIDE: [
        ...BUILTIN_COLUMNS,
        { id: 'stain',         label: 'Stain',         source: 'metadata', dataType: 'STRING', filterable: true,  sortable: true,  visibleByDefault: true  },
        { id: 'magnification', label: 'Magnification', source: 'metadata', dataType: 'STRING', filterable: true,  sortable: true,  visibleByDefault: true  },
    ],
    CT_SCAN: BUILTIN_COLUMNS.filter(c => c.id !== 'sampleId'),
    FIGURES: [
        ...BUILTIN_COLUMNS.filter(c => !['patientId', 'sampleId'].includes(c.id)),
        { id: 'pages', label: 'Pages', source: 'metadata', dataType: 'NUMBER', filterable: false, sortable: true, visibleByDefault: true },
    ],
};

// ── Row generators ─────────────────────────────────────────────────────────────

function heRow(i: number): ResourceTableRow {
    const patientIdx = Math.ceil(i / 2.5);  // ~2-3 samples per patient
    return {
        studyId: 'study_tcga_brca',
        resourceId: 'HE_SLIDE',
        resourceDisplayName: 'H&E Slide',
        resourceType: 'SAMPLE',
        patientId: `tcga-a1-p${String(patientIdx).padStart(2, '0')}`,
        sampleId: `tcga-a1-p${String(patientIdx).padStart(2, '0')}-s${String(i).padStart(2, '0')}`,
        url: `https://pathology.example.com/he/${i}.svs`,
        displayName: `H&E Slide ${i}`,
        type: 'IMAGE',
        priority: 1,
        metadata: {
            stain: i % 3 === 0 ? 'PAS' : i % 3 === 1 ? 'H&E' : 'IHC',
            magnification: i % 2 === 0 ? '40x' : '20x',
        },
    };
}

function ctRow(i: number): ResourceTableRow {
    return {
        studyId: 'study_tcga_brca',
        resourceId: 'CT_SCAN',
        resourceDisplayName: 'CT Scan',
        resourceType: 'PATIENT',
        patientId: `tcga-a1-p${String(i).padStart(2, '0')}`,
        sampleId: null,
        url: `https://dicom.example.com/ct/patient${i}.dcm`,
        displayName: `CT Scan Patient ${i}`,
        type: 'LINK',
        priority: 2,
        metadata: {},
    };
}

function figRow(i: number): ResourceTableRow {
    return {
        studyId: 'study_tcga_brca',
        resourceId: 'FIGURES',
        resourceDisplayName: 'Study Figures',
        resourceType: 'STUDY',
        patientId: null,
        sampleId: null,
        url: `https://publications.example.com/brca/fig${i}.pdf`,
        displayName: `Figure ${i}`,
        type: 'PDF',
        priority: 3,
        metadata: { pages: i * 4 },
    };
}

// ── All rows ───────────────────────────────────────────────────────────────────

export const MOCK_ALL_ROWS: ResourceTableRow[] = [
    ...Array.from({ length: 25 }, (_, i) => heRow(i + 1)),
    ...Array.from({ length: 8 },  (_, i) => ctRow(i + 1)),
    ...Array.from({ length: 3 },  (_, i) => figRow(i + 1)),
];

// ── Pre-built paginated results (first page of each tab, pageSize=20) ─────────

function buildResult(
    resourceId: string,
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    sortDir: 'asc' | 'desc' = 'asc'
): ResourceTableResult {
    let rows = MOCK_ALL_ROWS.filter(r => r.resourceId === resourceId);

    if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(r =>
            JSON.stringify(r).toLowerCase().includes(q)
        );
    }

    if (sortBy) {
        rows = [...rows].sort((a, b) => {
            const av = String((a as any)[sortBy] ?? (a.metadata as any)?.[sortBy] ?? '');
            const bv = String((b as any)[sortBy] ?? (b.metadata as any)?.[sortBy] ?? '');
            const cmp = av.localeCompare(bv, undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }

    const start = page * pageSize;
    return {
        tabs: MOCK_TABS,
        columns: MOCK_COLUMNS[resourceId] ?? [],
        rows: rows.slice(start, start + pageSize),
        totalRowCount: rows.length,
        filteredPatientCount: new Set(rows.map(r => r.patientId).filter(Boolean)).size,
        filteredSampleCount: rows.filter(r => r.sampleId != null).length,
        facets: {},
    };
}

export { buildResult as buildMockResult };
