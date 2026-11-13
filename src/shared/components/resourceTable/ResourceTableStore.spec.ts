import { assert } from 'chai';
import { autorun, when } from 'mobx';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
    ResourceColumnFilter,
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

    it('resets paging but keeps search and filters when the cohort changes', () => {
        // The table's search box and filter chips hold their own state and are not told about
        // a cohort change, so the store keeps the same search and filters they show.
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');
        const filters: ResourceColumnFilter[] = [
            {
                columnId: 'metadata:stain_group',
                operator: 'in',
                values: ['H&E'],
            },
        ];
        store.setSearchTerm('TCGA-A1');
        store.setFilters(filters);
        store.setPage(2);

        store.setCohort({
            ...cohort,
            studyViewFilter: { studyIds: ['study_a'] } as any,
        });

        assert.equal(store.pageNumber, 0);
        assert.equal(store.searchTerm, 'TCGA-A1');
        assert.deepEqual(store.filters, filters);
    });

    it('still clears search and filters when the resource changes', () => {
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');
        store.setSearchTerm('TCGA-A1');
        store.setFilters([
            { columnId: 'patientId', operator: 'in', values: ['P1'] },
        ]);

        store.setSelectedResourceId('OTHER');

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
        dispose();
    });
});

describe('resource table options', () => {
    const slides = {
        id: 'SLIDES',
        label: 'Slides',
        resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
    };

    it('lists a resource in a combined tab as long as that tab is not hidden', () => {
        const hideOwnSlideTabs = {
            combinedTabs: [slides],
            hideResource: (id: string) => id.startsWith('SLIDE_'),
        };
        assert.isTrue(
            isResourceListedInTable('SLIDE_PATIENT', hideOwnSlideTabs)
        );
        assert.isTrue(isResourceListedInTable('NOTES', hideOwnSlideTabs));
        assert.isTrue(isResourceListedInTable('REPORTS', {}));

        const hideSlidesTab = {
            combinedTabs: [slides],
            hideResource: (id: string) => id === 'SLIDES' || id === 'REPORTS',
        };
        assert.isFalse(isResourceListedInTable('SLIDE_SAMPLE', hideSlidesTab));
        assert.isFalse(isResourceListedInTable('REPORTS', hideSlidesTab));
        assert.isTrue(isResourceListedInTable('NOTES', hideSlidesTab));
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
            isComplete: true,
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

describe('combined tab configuration', () => {
    const tab = (
        resourceId: string,
        totalCount = 1,
        patientCount = 1,
        sampleCount = 1
    ) => ({
        resourceId,
        label: resourceId,
        totalCount,
        patientCount,
        sampleCount,
    });

    it('keeps a combined tab whose id is one of its members, at its first member', () => {
        const slides = {
            id: 'SLIDES',
            label: 'Slides',
            resourceIds: ['SLIDES', 'SLIDE_PATIENT'],
        };
        assert.deepEqual(
            buildResourceTableTabs(
                [tab('SLIDE_PATIENT'), tab('NOTES'), tab('SLIDES')],
                { combinedTabs: [slides] }
            ).map(t => [t.resourceId, t.label, t.resourceIds]),
            [
                ['SLIDES', 'Slides', ['SLIDE_PATIENT', 'SLIDES']],
                ['NOTES', 'NOTES', ['NOTES']],
            ]
        );
        // Only the member sharing the tab's id is present.
        assert.deepEqual(
            buildResourceTableTabs([tab('NOTES'), tab('SLIDES')], {
                combinedTabs: [slides],
            }).map(t => [t.resourceId, t.label, t.resourceIds]),
            [
                ['NOTES', 'NOTES', ['NOTES']],
                ['SLIDES', 'Slides', ['SLIDES']],
            ]
        );
        assert.isTrue(
            isResourceListedInTable('SLIDES', { combinedTabs: [slides] })
        );
    });

    it('does not list a resource that a combined tab with its id replaces', () => {
        assert.isFalse(
            isResourceListedInTable('SLIDES', {
                combinedTabs: [
                    { id: 'SLIDES', label: 'Slides', resourceIds: ['OTHER'] },
                ],
            })
        );
    });

    it('gives a resource two combined tabs list to the first, and warns once', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const options = {
                combinedTabs: [
                    { id: 'FIRST', label: 'First', resourceIds: ['A', 'B'] },
                    { id: 'SECOND', label: 'Second', resourceIds: ['B', 'C'] },
                ],
            };
            const fetched = [tab('A'), tab('B', 4), tab('C', 2)];
            const tabs = buildResourceTableTabs(fetched, options);
            buildResourceTableTabs(fetched, options);

            assert.deepEqual(
                tabs.map(t => [t.resourceId, t.resourceIds, t.totalCount]),
                [
                    ['FIRST', ['A', 'B'], 5],
                    ['SECOND', ['C'], 2],
                ]
            );
            assert.equal(warn.mock.calls.length, 1);
            assert.include(warn.mock.calls[0][0], 'B');

            // Listing agrees: B is listed through FIRST only.
            assert.isTrue(
                isResourceListedInTable('B', {
                    ...options,
                    hideResource: id => id === 'SECOND',
                })
            );
            assert.isFalse(
                isResourceListedInTable('B', {
                    ...options,
                    hideResource: id => id === 'FIRST',
                })
            );
        } finally {
            warn.mockRestore();
        }
    });

    it('counts zero-count members as zero, and skips a combined tab with no members', () => {
        const tabs = buildResourceTableTabs(
            [tab('EMPTY_A', 0, 0, 0), tab('EMPTY_B', 0, 0, 0), tab('NOTES')],
            {
                combinedTabs: [
                    {
                        id: 'EMPTY',
                        label: 'Empty',
                        resourceIds: ['EMPTY_A', 'EMPTY_B'],
                    },
                    { id: 'NONE', label: 'None', resourceIds: [] },
                ],
            }
        );
        assert.deepEqual(
            tabs.map(t => [
                t.resourceId,
                t.totalCount,
                t.patientCount,
                t.sampleCount,
            ]),
            [
                ['EMPTY', 0, 0, 0],
                ['NOTES', 1, 1, 1],
            ]
        );
    });
});

describe('ResourceTableStore selection across cohorts', () => {
    const tab = (resourceId: string) => ({
        resourceId,
        label: resourceId,
        totalCount: 1,
        patientCount: 1,
        sampleCount: 1,
    });
    const slides = {
        id: 'SLIDES',
        label: 'Slides',
        resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
    };
    const tabsByStudy: Record<string, ReturnType<typeof tab>[]> = {
        study_a: [tab('NOTES'), tab('SLIDE_SAMPLE'), tab('REPORTS')],
        study_b: [tab('NOTES')],
    };

    beforeEach(() => {
        fetchTabs
            .mockReset()
            .mockImplementation(
                async ({ studyIds }) => tabsByStudy[studyIds[0]]
            );
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

    // Keeps each store observed, as its mounted table does: a remoteData read outside a
    // reaction starts a new request, so it reports pending.
    const observers: (() => void)[] = [];
    afterEach(() => observers.splice(0).forEach(dispose => dispose()));

    /** Loads the table for a study, returning the resources its rows request read. */
    async function load(store: ResourceTableStore, studyId: string) {
        fetchData.mockClear();
        const tabsCalls = fetchTabs.mock.calls.length;
        store.setContext([studyId]);
        observers.push(
            autorun(() => {
                store.tableData.result;
                store.tableMetadata.result;
            })
        );
        await when(
            () =>
                fetchTabs.mock.calls.length > tabsCalls &&
                store.tabs.isComplete &&
                store.isTableReady
        );
        return fetchData.mock.calls.map(
            ([query]) => query.resourceIds || [query.resourceId]
        );
    }

    it('falls back to the first tab when a cohort change removes the selected tab', async () => {
        const store = new ResourceTableStore();
        await load(store, 'study_a');
        store.setSelectedResourceId('REPORTS');

        assert.deepEqual(await load(store, 'study_b'), [['NOTES']]);
        assert.equal(store.activeResourceId, 'NOTES');
        assert.deepEqual(store.activeResourceIds, ['NOTES']);
    });

    it('falls back the same way when the removed tab is a combined one', async () => {
        const store = new ResourceTableStore({ combinedTabs: [slides] });
        await load(store, 'study_a');
        store.setSelectedResourceId('SLIDES');
        assert.deepEqual(store.activeResourceIds, ['SLIDE_SAMPLE']);

        assert.deepEqual(await load(store, 'study_b'), [['NOTES']]);
        assert.equal(store.activeResourceId, 'NOTES');
    });

    it('reads nothing in a scoped store whose tab a cohort change removes', async () => {
        const single = new ResourceTableStore();
        single.scopeToResource('REPORTS');
        assert.deepEqual(await load(single, 'study_a'), [['REPORTS']]);
        assert.deepEqual(await load(single, 'study_b'), []);
        assert.equal(single.activeResourceId, 'REPORTS');
        assert.deepEqual(single.activeResourceIds, []);

        const combined = new ResourceTableStore({ combinedTabs: [slides] });
        combined.scopeToResource('SLIDES');
        assert.deepEqual(await load(combined, 'study_a'), [['SLIDE_SAMPLE']]);
        assert.deepEqual(await load(combined, 'study_b'), []);
        assert.deepEqual(combined.activeResourceIds, []);
    });

    it('never reads a combined member on its own, from a stale id', async () => {
        const store = new ResourceTableStore({ combinedTabs: [slides] });
        store.setSelectedResourceId('SLIDE_SAMPLE');
        assert.deepEqual(await load(store, 'study_a'), [['NOTES']]);
        assert.equal(store.activeResourceId, 'NOTES');

        const scoped = new ResourceTableStore({ combinedTabs: [slides] });
        scoped.scopeToResource('SLIDE_SAMPLE');
        assert.deepEqual(await load(scoped, 'study_a'), []);
    });

    it('never reads a hidden resource set as the selection', async () => {
        const store = new ResourceTableStore({
            hideResource: id => id === 'REPORTS',
        });
        store.setSelectedResourceId('REPORTS');
        assert.deepEqual(await load(store, 'study_a'), [['NOTES']]);
        assert.deepEqual(store.activeResourceIds, ['NOTES']);
    });

    it('downloads nothing while the tabs reload', async () => {
        const store = new ResourceTableStore();
        await load(store, 'study_a');
        store.setSelectedResourceId('REPORTS');

        fetchTabs.mockImplementation(() => new Promise(() => {}));
        store.setContext(['study_b']);
        await when(() => store.tabs.isPending);
        fetchData.mockClear();

        assert.deepEqual(await store.fetchAllRowsForDownload(), []);
        assert.equal(fetchData.mock.calls.length, 0);
    });
});
