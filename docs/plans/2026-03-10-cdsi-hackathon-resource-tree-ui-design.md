# CDSI Hackathon: Resource Tree UI Design

## Context

cBioPortal's current resource data model stores resources (pathology slides, radiology images, reports, raw data files) as flat lists tied to `resource_definition` entries. The backend team has proposed a redesign that introduces a hierarchical `resource_node` table supporting parent-child relationships (GROUP folders + ITEM leaves). See the [full backend plan](https://github.com/dippindots/cbioportal/blob/a4e348369974751eead9fd03c8057bee6639e34c/plan.md).

This design covers the **frontend** portion of that work: a new tree UI component, local search/filtering, and exploration of integration with cBioPortal's existing study view filter system.

## Scope

- New standalone tree UI component for hierarchical resource display
- Local search and filtering within the tree (by `DISPLAY_NAME`, `TYPE`)
- Exploration of whether `resource_node.METADATA` (JSON) can integrate with cBioPortal's study view filters and clinical attribute filters
- Mock data via static JSON file (tree-structured API response shape)
- Test study: `coad_msk_2025` (H&E slides on cbioportal.mskcc.org)

## Out of Scope

- Backend changes (database, importer, persistence layer, REST API)
- Modifying existing resource tab behavior ("H&E Slides" tab and similar)
- Final decision on ITEM click behavior (iframe vs. new tab vs. download)

## Architecture

### Approach: New Standalone Component

The existing resource tabs (e.g., "H&E Slides" in study/patient views) remain untouched. The new tree component is developed independently and can be mounted alongside or as a replacement in the future.

This avoids risk to existing functionality while allowing rapid iteration during the hackathon.

### Data Flow

```
Static JSON mock file
  → ResourceTreeStore (MobX)
    → ResourceTree component (React)
      → Accordion/collapsible tree rendering
      → Local search/filter bar
      → onItemClick callback (behavior TBD)
```

### Mock Data Shape

The mock JSON mirrors the proposed tree-structured API response from the `resource_node` table:

```json
{
  "resourceDefinitions": [
    {
      "resourceId": "pathology",
      "displayName": "Pathology",
      "resourceType": "PATIENT",
      "nodes": [
        {
          "id": 1,
          "nodeType": "GROUP",
          "displayName": "Block A - Primary Tumor",
          "children": [
            {
              "id": 2,
              "nodeType": "ITEM",
              "displayName": "H&E",
              "type": "H_AND_E",
              "url": "https://viewer/1",
              "metadata": {}
            },
            {
              "id": 3,
              "nodeType": "ITEM",
              "displayName": "IHC CD3",
              "type": "IHC",
              "url": "https://viewer/2",
              "metadata": {}
            }
          ]
        }
      ]
    }
  ]
}
```

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
└── FilterIntegrationExplorer (hackathon exploration area)
```

### TypeScript Types

```typescript
interface ResourceNodeBase {
  id: number;
  displayName: string;
  metadata?: Record<string, any>;
  priority?: number;
}

interface ResourceGroupNode extends ResourceNodeBase {
  nodeType: 'GROUP';
  children: ResourceNode[];
}

interface ResourceItemNode extends ResourceNodeBase {
  nodeType: 'ITEM';
  url: string;
  type?: string; // free-text: H_AND_E, IHC, CT, BAM, PDF, etc.
}

type ResourceNode = ResourceGroupNode | ResourceItemNode;

interface ResourceTreeDefinition {
  resourceId: string;
  displayName: string;
  resourceType: 'STUDY' | 'PATIENT' | 'SAMPLE';
  nodes: ResourceNode[];
}

interface ResourceTreeResponse {
  resourceDefinitions: ResourceTreeDefinition[];
}
```

## Search and Filtering

### Local Tree Search

- Text input filters the tree by `displayName` and `type`
- Matching nodes are highlighted; their ancestor GROUP nodes auto-expand
- Non-matching branches collapse/hide
- Debounced input for performance

### cBioPortal Filter Integration (Investigation Results)

Key question: Can the `METADATA` JSON field on `resource_node` integrate with cBioPortal's existing filter system?

#### Existing Filter Types in Study View

The study view (`StudyViewPageStore`) manages 5 filter types, each stored in its own observable map and composed into a single `StudyViewFilter` object sent to the backend:

| Filter Type             | Structure                                      | Use Case                        |
| ----------------------- | ---------------------------------------------- | ------------------------------- |
| `ClinicalDataFilter`    | `attributeId` + `values[]`                     | Standard clinical attributes    |
| `CustomDataFilter`      | Same as ClinicalDataFilter (user-uploaded)      | Dynamic user-defined data       |
| `NamespaceDataFilter`   | `outerKey` + `innerKey` + `values[][]`          | Hierarchical key-value metadata |
| `GenericAssayDataFilter` | `stableId` + `profileType` + `values[]`        | Molecular profile data          |
| `GenomicDataFilter`     | Gene-specific                                  | Genomic alterations             |

#### Recommended Approach: NamespaceDataFilter Pattern

The `NamespaceDataFilter` is the best fit for JSON metadata integration:

- **`outerKey`**: maps to a metadata namespace (e.g., `"resource_metadata"`)
- **`innerKey`**: maps to a metadata field name (e.g., `"stain_type"`, `"site"`)
- **`values[][]`**: 2D array supporting union/intersection filtering

Example: resource metadata `{"site": "Primary", "stain_type": "H&E", "year": 2023}` becomes:

```
outerKey: "resource_metadata"
innerKey: "site"         → values: [["Primary"], ["Metastasis"]]
innerKey: "stain_type"   → values: [["H_AND_E"], ["IHC"]]
```

This pattern is already implemented for variant annotations in the codebase (`StudyViewPageStore.ts` lines 3222-3248).

#### Existing Extension Point

`ResourceDefinition` already has an **unused** `customMetaData: string` field in the API types. This could store JSON metadata without backend schema changes — useful for prototyping.

#### Integration Strategy (Two Directions)

**Direction A: Resource metadata filters sample selection (metadata → filters)**
- Extract metadata keys from resource nodes across all patients/samples
- Register them as filterable charts (like namespace attributes)
- User filters by metadata values → narrows visible patients/samples
- Requires: client-side metadata aggregation, chart registration

**Direction B: Study view filters narrow visible resources (filters → resources)**
- Active study view filters (clinical attributes, etc.) determine which patients/samples are selected
- Resource tree only shows resources belonging to selected patients/samples
- Requires: resource tree listens to `StudyViewPageStore.selectedSamples`

Both directions can work together. Direction B is simpler to implement first.

#### Key Files

- `StudyViewPageStore.ts` — filter state management (11,000+ lines)
- `StudyViewUtils.tsx` — `getChartMetaSet()` shows how data types become filterable charts
- `CBioPortalAPIInternal.ts` — all filter and count API type definitions
- `StudyViewConfig.ts` — chart type configuration and defaults

## Open Questions

- **ITEM click behavior**: iframe, new tab, download, or configurable per TYPE?
- **Direction A feasibility**: can we aggregate metadata keys client-side from mock data and register them as filterable charts without backend changes?
- **Tree state persistence**: should expanded/collapsed state persist across navigation?
- **Performance**: how does the tree handle studies with thousands of resource nodes?

## Test Plan

- [ ] Tree renders correctly from mock JSON data
- [ ] GROUP nodes expand/collapse
- [ ] Local search filters and highlights matching nodes
- [ ] Existing resource tabs ("H&E Slides" etc.) remain unaffected
- [ ] Component works in study view context
- [ ] Explore METADATA integration with cBioPortal filters
