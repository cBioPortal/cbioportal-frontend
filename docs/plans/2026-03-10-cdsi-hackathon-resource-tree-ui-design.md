# CDSI Hackathon: Resource Tree UI Design

## Context

cBioPortal's current resource data model stores resources (pathology slides, radiology images, reports, raw data files) as flat lists tied to `resource_definition` entries. The backend team has proposed a redesign that introduces a hierarchical `resource_node` table supporting parent-child relationships (GROUP folders + ITEM leaves). See the [full backend plan](https://github.com/dippindots/cbioportal/blob/a4e348369974751eead9fd03c8057bee6639e34c/plan.md).

This design covers the **frontend** portion of that work: a new tree UI component with metadata-driven filtering integrated into cBioPortal's study view chart system.

## Scope

- New standalone tree UI component for hierarchical resource display
- Local search and filtering within the tree (by `DISPLAY_NAME`, `TYPE`)
- Integration of `resource_node.METADATA` (JSON) with cBioPortal's study view chart/filter system via mocked API layer
- TSV flat file as data source, parsed client-side
- Test study: `coad_msk_2025` (H&E slides on cbioportal.mskcc.org)

## Out of Scope

- Backend changes (database, importer, persistence layer, REST API)
- Modifying existing resource tab behavior ("H&E Slides" tab and similar)
- Final decision on ITEM click behavior (iframe vs. new tab vs. download)

## Data Source

A local TSV flat file matching the proposed import format, extended with a `METADATA` JSON column:

```
PATIENT_ID	SAMPLE_ID	RESOURCE_ID	URL	DISPLAY_NAME	TYPE	GROUP_PATH	METADATA
P001	S001	pathology	https://viewer/1	H&E	H_AND_E	Block A - Primary Tumor	{"site": "colon", "stain_type": "H_AND_E", "magnification": "40x"}
P001	S001	pathology	https://viewer/2	IHC CD3	IHC	Block A - Primary Tumor	{"site": "colon", "stain_type": "IHC", "marker": "CD3"}
P001	S002	pathology	https://viewer/3	H&E	H_AND_E	Block B - Metastasis	{"site": "liver", "stain_type": "H_AND_E", "magnification": "20x"}
P001	S001	ct_scans	https://ohif/1	Axial T2	CT	CT 2023-01-15/Series 1	{"modality": "CT", "body_part": "abdomen"}
```

## Architecture

### End-to-End Data Flow

```
TSV flat file
  → parse TSV client-side
    → build tree structure from GROUP_PATH
      → render tree UI (accordion/collapsible)
    → extract metadata keys across all nodes
      → aggregate counts per key/value
        → mock API count endpoints
          → register as filterable charts in StudyViewPageStore
            → user applies filter → filter tree to matching nodes
```

### Approach: New Standalone Component + Study View Chart Integration

The existing resource tabs (e.g., "H&E Slides" in study/patient views) remain untouched. The new tree component is developed independently. Metadata-derived filters integrate with the existing study view chart system via a mock API layer.

### TSV Parsing Pipeline

1. Read TSV flat file
2. Parse rows into typed objects (`ResourceNodeRow`)
3. Group by `RESOURCE_ID` to get resource definitions
4. Build tree hierarchy from `GROUP_PATH` (split on `/`, upsert GROUP nodes)
5. Attach `METADATA` JSON (parsed) to each ITEM node
6. Extract all unique metadata keys across nodes → register as filterable attributes

### Component Structure

```
ResourceTreeContainer
├── SearchBar (filters tree by DISPLAY_NAME, TYPE)
├── ResourceTreeSection (one per resource_definition)
│   ├── SectionHeader (resource_definition.DISPLAY_NAME)
│   └── TreeNodeList
│       ├── GroupNode (collapsible, recursive)
│       │   └── TreeNodeList (children)
│       └── ItemNode (leaf, clickable)
```

### TypeScript Types

```typescript
// TSV row after parsing
interface ResourceNodeRow {
  patientId: string;
  sampleId: string;
  resourceId: string;
  url: string;
  displayName: string;
  type?: string;
  groupPath?: string;
  metadata?: Record<string, any>;
}

// Tree node types
interface ResourceNodeBase {
  id: number;
  displayName: string;
  metadata?: Record<string, any>;
  priority?: number;
}

interface ResourceGroupNode extends ResourceNodeBase {
  nodeType: "GROUP";
  children: ResourceNode[];
}

interface ResourceItemNode extends ResourceNodeBase {
  nodeType: "ITEM";
  url: string;
  type?: string;
  patientId: string;
  sampleId: string;
}

type ResourceNode = ResourceGroupNode | ResourceItemNode;

interface ResourceTreeDefinition {
  resourceId: string;
  displayName: string;
  resourceType: "STUDY" | "PATIENT" | "SAMPLE";
  nodes: ResourceNode[];
}
```

## Search and Filtering

### Local Tree Search

- Text input filters the tree by `displayName` and `type`
- Matching nodes are highlighted; their ancestor GROUP nodes auto-expand
- Non-matching branches collapse/hide
- Debounced input for performance

### Study View Chart/Filter Integration

#### Strategy: Mock API Layer

cBioPortal's study view charts all fetch counts from backend API endpoints (`fetchClinicalDataCountsUsingPOST`, `fetchNamespaceDataCountsUsingPOST`, etc.). There is no pure client-side chart rendering path.

To integrate metadata as filterable charts without backend changes:

1. **Aggregate metadata** — scan all ITEM nodes, collect unique keys and value counts
   - e.g., `stain_type: {H_AND_E: 12, IHC: 8}`, `site: {colon: 15, liver: 5}`
2. **Mock count endpoints** — intercept the API calls that generate chart data, returning pre-computed counts from the parsed metadata
3. **Register charts** — create `ChartMeta` entries for each metadata key and register them via `StudyViewPageStore`
4. **Filter callback** — when user selects values in a chart, filter the resource tree to show only matching nodes

#### Recommended Pattern: NamespaceDataFilter

The `NamespaceDataFilter` is the best fit for JSON metadata:

- **`outerKey`**: metadata namespace (e.g., `"resource_metadata"`)
- **`innerKey`**: metadata field name (e.g., `"stain_type"`, `"site"`)
- **`values[][]`**: 2D array supporting union/intersection filtering

This pattern is already implemented for variant annotations in the codebase.

#### Mock Layer Responsibilities

| Real API Call                           | Mock Replacement                                               |
| --------------------------------------- | -------------------------------------------------------------- |
| `fetchNamespaceDataCountsUsingPOST()`   | Return counts aggregated from parsed TSV metadata              |
| Chart data promise for namespace charts | Return `MultiSelectionTableRow[]` computed from metadata       |
| Filter application                      | Client-side: filter tree nodes by selected metadata values     |

### Existing Extension Points

- `ResourceDefinition.customMetaData: string` — unused field in the API, could store JSON metadata
- `NamespaceAttribute` (`outerKey`/`innerKey`) — maps naturally to JSON metadata keys
- `updateCustomDataList()` — accepts pre-formed custom charts with data in one call

### Key Files

- `StudyViewPageStore.ts` — filter state management, chart registration
- `StudyViewUtils.tsx` — `getChartMetaSet()` assembles all chart metadata
- `SummaryTab.tsx` — binds chart type + data type to data promises
- `ChartContainer.tsx` — renders charts based on type enum
- `CBioPortalAPIInternal.ts` — filter and count API type definitions

## Open Questions

- **ITEM click behavior**: iframe, new tab, download, or configurable per TYPE?
- **Mock layer granularity**: intercept at API client level or at MobxPromise level?
- **Tree state persistence**: should expanded/collapsed state persist across navigation?
- **Performance**: how does the tree handle studies with thousands of resource nodes?

## Test Plan

- [ ] TSV flat file parses correctly into tree structure
- [ ] GROUP_PATH builds correct hierarchy (nested groups, root-level items)
- [ ] Tree renders with expand/collapse behavior
- [ ] Local search filters and highlights matching nodes
- [ ] Metadata keys are extracted and aggregated into counts
- [ ] Mock API layer returns correct counts for chart rendering
- [ ] Charts appear in study view and respond to filter selection
- [ ] Filter selection narrows visible tree nodes
- [ ] Existing resource tabs ("H&E Slides" etc.) remain unaffected
