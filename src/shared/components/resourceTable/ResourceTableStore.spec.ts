import { assert } from 'chai';
import { autorun, when } from 'mobx';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
    fetchResourceTableData,
    fetchResourceTableMetadata,
    fetchResourceTableTabs,
} from 'shared/api/resourceTableClient';
import { isResourceListedInTable } from 'shared/lib/ResourceTableUtils';
import {
    buildResourceTableTabs,
    ResourceTableStore,
} from './ResourceTableStore';

jest.mock('shared/api/resourceTableClient', () => ({
    ...jest.requireActual('shared/api/resourceTableClient'),
    fetchResourceTableTabs: jest.fn(),
    fetchResourceTableData: jest.fn(),
    fetchResourceTableMetadata: jest.fn(),
}));

const fetchTabs = fetchResourceTableTabs as jest.Mock;
const fetchData = fetchResourceTableData as jest.Mock;
const fetchMetadata = fetchResourceTableMetadata as jest.Mock;

describe('ResourceTableStore cohort context', () => {
    const cohort = {
        studyIds: ['study_a'],
        patientIdentifiers: [],
        sampleIdentifiers: [],
    };

    it('keeps the selected resource when the cohort changes', () => {
        // A scoped store gets its resource before its cohort. If the cohort reset cleared the
        // selection, activeResourceId falls back to the first tab and the tab fetches and
        // renders another resource's rows.
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');

        store.setCohort(cohort);

        // Asserts on the selection, not activeResourceId: that getter's fallback reads
        // this.tabs, which starts a request.
        assert.equal(store.selectedResourceId, 'PATHOLOGY_SLIDE');
    });

    it('resets paging, search and filters when the cohort changes', () => {
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');
        store.setPage(2);
        store.setSearchTerm('TCGA-A1');

        store.setCohort(cohort);

        assert.equal(store.pageNumber, 0);
        assert.equal(store.searchTerm, '');
        assert.deepEqual(store.filters, []);
    });
});

describe('ResourceTableStore requests', () => {
    const filter = ({
        studyIds: ['study_a'],
        clinicalDataFilters: [
            { attributeId: 'CANCER_TYPE', values: [{ value: 'Breast' }] },
        ],
    } as any) as StudyViewFilter;
    const patientIdentifiers = [{ studyId: 'study_a', patientId: 'patient_1' }];
    const sampleIdentifiers = [{ studyId: 'study_a', sampleId: 'sample_1' }];

    beforeEach(() => {
        fetchTabs.mockReset().mockResolvedValue([
            {
                resourceId: 'PATHOLOGY_SLIDE',
                label: 'Slides',
                totalCount: 1,
                patientCount: 1,
                sampleCount: 1,
            },
        ]);
        fetchData.mockReset().mockResolvedValue([]);
        fetchMetadata.mockReset().mockResolvedValue({
            columns: [],
            totalRowCount: 0,
            filteredPatientCount: 0,
            filteredSampleCount: 0,
            facets: {},
            facetRanges: {},
            distinctValueCounts: {},
        });
    });

    async function loadTable(store: ResourceTableStore) {
        const dispose = autorun(() => {
            store.tableData.result;
            store.tableMetadata.result;
        });
        await when(() => store.isTableReady && fetchData.mock.calls.length > 0);
        dispose();
    }

    it('sends a study-view cohort as the filter, without identifiers', async () => {
        const store = new ResourceTableStore();
        store.setCohort({
            studyIds: ['study_a'],
            patientIdentifiers,
            sampleIdentifiers,
            studyViewFilter: filter,
        });

        await loadTable(store);

        for (const query of [
            fetchData.mock.calls[0][0],
            fetchMetadata.mock.calls[0][0],
        ]) {
            assert.deepEqual(query.studyViewFilter, filter);
            assert.notProperty(query, 'patientIdentifiers');
            assert.notProperty(query, 'sampleIdentifiers');
        }
        // tabs/fetch takes no filter, so it keeps the identifier lists.
        assert.deepEqual(fetchTabs.mock.calls[0][0], {
            studyIds: ['study_a'],
            patientIdentifiers,
            sampleIdentifiers,
        });
    });

    it('sends identifier lists for an explicit cohort', async () => {
        const store = new ResourceTableStore();
        store.setContext(['study_a'], patientIdentifiers, sampleIdentifiers);

        await loadTable(store);

        const query = fetchData.mock.calls[0][0];
        assert.deepEqual(query.patientIdentifiers, patientIdentifiers);
        assert.deepEqual(query.sampleIdentifiers, sampleIdentifiers);
        assert.notProperty(query, 'studyViewFilter');
        assert.equal(query.resourceId, 'PATHOLOGY_SLIDE');
    });

    it('drops a previous filter when given an explicit cohort', () => {
        const store = new ResourceTableStore();
        store.setCohort({
            studyIds: ['study_a'],
            patientIdentifiers: [],
            sampleIdentifiers: [],
            studyViewFilter: filter,
        });

        store.setContext(['study_a'], patientIdentifiers, sampleIdentifiers);

        assert.isUndefined(store.studyViewFilter);
    });
});

describe('combined resource tabs', () => {
    const tab = (
        resourceId: string,
        totalCount: number,
        patientCount: number,
        sampleCount: number
    ) => ({
        resourceId,
        label: resourceId,
        totalCount,
        patientCount,
        sampleCount,
    });
    const slides = {
        id: 'SLIDES',
        label: 'Slides',
        resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
    };

    it('replaces its resources tabs with one, where the first of them was', () => {
        const tabs = buildResourceTableTabs(
            [
                tab('NOTES', 3, 3, 0),
                tab('SLIDE_PATIENT', 2, 2, 0),
                tab('REPORTS', 1, 1, 1),
                tab('SLIDE_SAMPLE', 5, 4, 5),
            ],
            { combinedTabs: [slides] }
        );

        assert.deepEqual(
            tabs.map(t => [t.resourceId, t.resourceIds]),
            [
                ['NOTES', ['NOTES']],
                ['SLIDES', ['SLIDE_PATIENT', 'SLIDE_SAMPLE']],
                ['REPORTS', ['REPORTS']],
            ]
        );
        const combined = tabs[1];
        assert.equal(combined.label, 'Slides');
        assert.equal(combined.totalCount, 7);
        // Two resources can share a case, so the case counts are a lower bound.
        assert.equal(combined.patientCount, 4);
        assert.equal(combined.sampleCount, 5);
    });

    it('reads only the resources the cohort has, and is absent without any', () => {
        assert.deepEqual(
            buildResourceTableTabs([tab('SLIDE_SAMPLE', 5, 4, 5)], {
                combinedTabs: [slides],
            }).map(t => t.resourceIds),
            [['SLIDE_SAMPLE']]
        );
        assert.deepEqual(
            buildResourceTableTabs([tab('NOTES', 3, 3, 0)], {
                combinedTabs: [slides],
            }).map(t => t.resourceId),
            ['NOTES']
        );
    });

    it('takes the place of a fetched resource with its id, and can be hidden', () => {
        const fetched = [tab('SLIDES', 9, 9, 9), tab('SLIDE_SAMPLE', 5, 4, 5)];
        assert.deepEqual(
            buildResourceTableTabs(fetched, {
                combinedTabs: [slides],
            }).map(t => [t.resourceId, t.totalCount]),
            [['SLIDES', 5]]
        );
        assert.deepEqual(
            buildResourceTableTabs(fetched, {
                combinedTabs: [slides],
                hideResource: id => id === 'SLIDES',
            }),
            []
        );
    });

    it('requests a combined tab with resourceIds, rows and download alike', async () => {
        fetchTabs
            .mockReset()
            .mockResolvedValue([
                tab('SLIDE_SAMPLE', 5, 4, 5),
                tab('SLIDE_PATIENT', 2, 2, 0),
            ]);
        fetchData.mockReset().mockResolvedValue([]);
        fetchMetadata.mockReset().mockResolvedValue({
            columns: [],
            totalRowCount: 7,
            filteredPatientCount: 4,
            filteredSampleCount: 5,
            facets: {},
            facetRanges: {},
            distinctValueCounts: {},
        });
        const store = new ResourceTableStore({ combinedTabs: [slides] });
        store.setSelectedResourceId('SLIDES');
        store.setContext(['study_a']);

        const dispose = autorun(() => {
            store.tableData.result;
            store.tableMetadata.result;
        });
        await when(() => store.isTableReady && fetchData.mock.calls.length > 0);
        dispose();

        assert.deepEqual(store.activeResourceIds, [
            'SLIDE_SAMPLE',
            'SLIDE_PATIENT',
        ]);
        assert.equal(store.activeResourceLabel, 'Slides');
        for (const query of [
            fetchData.mock.calls[0][0],
            fetchMetadata.mock.calls[0][0],
        ]) {
            assert.deepEqual(query.resourceIds, [
                'SLIDE_SAMPLE',
                'SLIDE_PATIENT',
            ]);
            assert.notProperty(query, 'resourceId');
        }

        await store.fetchAllRowsForDownload();
        const download =
            fetchData.mock.calls[fetchData.mock.calls.length - 1][0];
        assert.deepEqual(download.resourceIds, [
            'SLIDE_SAMPLE',
            'SLIDE_PATIENT',
        ]);
        assert.equal(download.pageSize, 7);
    });
});

describe('resource table options', () => {
    const slides = {
        id: 'SLIDES',
        label: 'Slides',
        resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
    };

    it('lists a resource in a combined tab even when its own tab is hidden', () => {
        const options = {
            combinedTabs: [slides],
            hideResource: (id: string) => id !== 'NOTES',
        };
        assert.isTrue(isResourceListedInTable('SLIDE_PATIENT', options));
        assert.isTrue(isResourceListedInTable('NOTES', options));
        assert.isFalse(isResourceListedInTable('REPORTS', options));
        assert.isTrue(isResourceListedInTable('REPORTS', {}));
    });

    it('offers every fetched resource as its own tab without options', () => {
        const tabs = [
            {
                resourceId: 'NOTES',
                label: 'Notes',
                totalCount: 1,
                patientCount: 1,
                sampleCount: 0,
            },
        ];
        assert.deepEqual(buildResourceTableTabs(tabs, {}), [
            { ...tabs[0], resourceIds: ['NOTES'] },
        ]);
    });

    it("asks hideMetadataKey about the active tab's resources", () => {
        const asked: string[][] = [];
        const store = new ResourceTableStore({
            combinedTabs: [slides],
            hideMetadataKey: (resourceIds, key) => {
                asked.push([...resourceIds]);
                return key === 'internal';
            },
        });
        (store as any).tabs = {
            result: [
                {
                    resourceId: 'SLIDE_PATIENT',
                    label: 'Unmatched',
                    totalCount: 1,
                    patientCount: 1,
                    sampleCount: 0,
                },
            ],
        };

        assert.isTrue(store.isMetadataKeyHidden('internal'));
        assert.isFalse(store.isMetadataKeyHidden('score'));
        assert.deepEqual(asked[0], ['SLIDE_PATIENT']);
        assert.isFalse(
            new ResourceTableStore().isMetadataKeyHidden('internal')
        );
    });
});
