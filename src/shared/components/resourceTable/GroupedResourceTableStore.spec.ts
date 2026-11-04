import { assert } from 'chai';
import { autorun, when } from 'mobx';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
    fetchResourceTableGroups,
    fetchResourceTableMetadata,
    ResourceTableGroupPage,
    ResourceTableQuery,
} from 'shared/api/resourceTableClient';
import {
    buildResourceTableGroupsMetadataQuery,
    buildResourceTableGroupsQuery,
    GroupedResourceTableStore,
    ResourceTableGroupsState,
} from './GroupedResourceTableStore';

jest.mock('shared/api/resourceTableClient', () => ({
    ...jest.requireActual('shared/api/resourceTableClient'),
    fetchResourceTableGroups: jest.fn(),
    fetchResourceTableMetadata: jest.fn(),
}));

const fetchGroups = fetchResourceTableGroups as jest.MockedFunction<
    typeof fetchResourceTableGroups
>;
const fetchMetadata = fetchResourceTableMetadata as jest.MockedFunction<
    typeof fetchResourceTableMetadata
>;

const filter = ({ studyIds: ['study_a'] } as any) as StudyViewFilter;

const baseState: ResourceTableGroupsState = {
    cohort: {
        studyIds: ['study_a'],
        patientIdentifiers: [],
        sampleIdentifiers: [],
    },
    resourceIds: ['PATHOLOGY_SLIDE'],
    groupBy: 'patient',
    groupCounts: [],
    search: '',
    filters: [],
    direction: 'asc',
    pageNumber: 0,
    pageSize: 50,
};

describe('buildResourceTableGroupsQuery', () => {
    it('builds a patient-grouped page with counts', () => {
        const query = buildResourceTableGroupsQuery({
            ...baseState,
            groupCounts: ['metadata:stain_group', 'resourceId'],
            sortBy: 'rowCount',
            direction: 'desc',
            pageNumber: 2,
            pageSize: 20,
        });

        assert.deepEqual(JSON.parse(JSON.stringify(query)), {
            studyIds: ['study_a'],
            patientIdentifiers: [],
            sampleIdentifiers: [],
            resourceId: 'PATHOLOGY_SLIDE',
            groupBy: 'patient',
            groupCounts: ['metadata:stain_group', 'resourceId'],
            sortBy: 'rowCount',
            direction: 'desc',
            pageNumber: 2,
            pageSize: 20,
        });
    });

    it('sends the study-view filter in place of identifiers', () => {
        const query = buildResourceTableGroupsQuery({
            ...baseState,
            cohort: {
                ...baseState.cohort,
                sampleIdentifiers: [
                    { studyId: 'study_a', sampleId: 'sample_1' },
                ],
                studyViewFilter: filter,
            },
        })!;

        assert.deepEqual(query.studyViewFilter, filter);
        assert.isUndefined(query.sampleIdentifiers);
        assert.isUndefined(query.patientIdentifiers);
    });

    it('reads several resources together through resourceIds', () => {
        const query = buildResourceTableGroupsQuery({
            ...baseState,
            resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
        })!;

        assert.isUndefined(query.resourceId);
        assert.deepEqual(query.resourceIds, ['SLIDE_SAMPLE', 'SLIDE_PATIENT']);
    });

    it('passes search and filters, which apply to rows before grouping', () => {
        const filters = [
            {
                columnId: 'metadata:stain',
                operator: 'in',
                values: ['H&E'],
            },
        ];
        const query = buildResourceTableGroupsQuery({
            ...baseState,
            search: 'TCGA',
            filters,
        })!;

        assert.equal(query.search, 'TCGA');
        assert.deepEqual(query.filters, filters);
    });

    it('sends a locator holding the id the grouping keys on', () => {
        const locate = { studyId: 'study_a', patientId: 'patient_1' };

        assert.deepEqual(
            buildResourceTableGroupsQuery({ ...baseState, locate })!.locate,
            locate
        );
        // Sample grouping keys on the sample id, which this locator lacks.
        assert.isUndefined(
            buildResourceTableGroupsQuery({
                ...baseState,
                groupBy: 'sample',
                locate,
            })!.locate
        );
    });

    it('leaves out a sort the grouping cannot order by', () => {
        const query = buildResourceTableGroupsQuery({
            ...baseState,
            sortBy: 'sampleId',
        })!;

        assert.isUndefined(query.sortBy);
        assert.equal(
            buildResourceTableGroupsQuery({
                ...baseState,
                groupBy: 'sample',
                sortBy: 'sampleId',
            })!.sortBy,
            'sampleId'
        );
    });

    it('builds nothing without a study or a resource', () => {
        assert.isUndefined(
            buildResourceTableGroupsQuery({ ...baseState, resourceIds: [] })
        );
        assert.isUndefined(
            buildResourceTableGroupsQuery({
                ...baseState,
                cohort: { ...baseState.cohort, studyIds: [] },
            })
        );
    });

    it('keeps paging, sort, counts and locate out of the metadata request', () => {
        const query = buildResourceTableGroupsMetadataQuery({
            ...baseState,
            groupBy: 'sample',
            groupCounts: ['resourceId'],
            sortBy: 'rowCount',
            pageNumber: 3,
            locate: { studyId: 'study_a', sampleId: 'sample_1' },
        })!;

        assert.equal(query.groupBy, 'sample');
        assert.equal(query.pageNumber, 0);
        assert.isUndefined(query.groupCounts);
        assert.isUndefined(query.sortBy);
        assert.isUndefined(query.locate);
    });
});

describe('GroupedResourceTableStore', () => {
    const group = (patientId: string) => ({
        studyId: 'study_a',
        patientId,
        rowCount: 1,
        counts: {},
    });

    const page = (
        totalGroups: number,
        locatedIndex: number | null
    ): ResourceTableGroupPage => ({
        totalGroups,
        totalRows: totalGroups * 2,
        locatedIndex,
        groups: [group('patient_1')],
    });

    let dispose: (() => void) | undefined;

    beforeEach(() => {
        fetchGroups.mockReset();
        fetchMetadata.mockReset();
    });

    afterEach(() => {
        if (dispose) dispose();
        dispose = undefined;
    });

    function newStore() {
        const store = new GroupedResourceTableStore();
        store.setCohort(baseState.cohort);
        store.setResourceIds(['PATHOLOGY_SLIDE']);
        dispose = autorun(() => store.groups.result);
        return store;
    }

    const lastQuery = (): ResourceTableQuery =>
        fetchGroups.mock.calls[fetchGroups.mock.calls.length - 1][0];

    it('fetches a page of groups and reports the totals', async () => {
        fetchGroups.mockResolvedValue(page(120, null));
        const store = newStore();
        store.setPageSize(25);
        store.setPage(1);

        await when(() => store.groups.isComplete && store.totalGroups > 0);

        assert.equal(lastQuery().pageNumber, 1);
        assert.equal(lastQuery().pageSize, 25);
        assert.equal(store.totalGroups, 120);
        assert.equal(store.totalRows, 240);
        assert.equal(store.pageCount, 5);
        assert.isNull(store.locatedIndex);
        assert.lengthOf(store.groupsForDisplay, 1);
    });

    it('moves to the page holding a located group, once', async () => {
        fetchGroups.mockResolvedValue(page(120, 57));
        const store = newStore();
        store.setPageSize(25);

        store.locateGroup({ studyId: 'study_a', patientId: 'patient_58' });
        await when(() => store.pageNumber === 2 && store.groups.isComplete);

        assert.deepEqual(lastQuery().locate, {
            studyId: 'study_a',
            patientId: 'patient_58',
        });
        assert.equal(lastQuery().pageNumber, 2);
        assert.equal(store.locatedIndex, 57);

        // Paging away afterwards stays put.
        store.setPage(0);
        await when(
            () => store.groups.isComplete && lastQuery().pageNumber === 0
        );
        assert.equal(store.pageNumber, 0);
        assert.equal(store.locatedIndex, 57);
    });

    it('stays on its page when the located group is filtered out', async () => {
        fetchGroups.mockResolvedValue(page(10, null));
        const store = newStore();
        store.setPage(0);

        store.locateGroup({ studyId: 'study_a', patientId: 'gone' });
        await when(
            () => store.groups.isComplete && lastQuery().locate !== undefined
        );

        assert.equal(store.pageNumber, 0);
        assert.isNull(store.locatedIndex);
    });

    it('resets paging when search, filters or grouping change', () => {
        const store = new GroupedResourceTableStore();
        store.setPage(3);
        store.setSearchTerm('TCGA');
        assert.equal(store.pageNumber, 0);

        store.setPage(3);
        store.setFilters([
            { columnId: 'metadata:stain', operator: 'in', values: ['H&E'] },
        ]);
        assert.equal(store.pageNumber, 0);

        store.setPage(3);
        store.setGroupBy('sample');
        assert.equal(store.pageNumber, 0);
    });

    it('drops a sample sort when grouping by patient', () => {
        const store = new GroupedResourceTableStore();
        store.setGroupBy('sample');
        store.setSort('sampleId', 'desc');

        store.setGroupBy('patient');

        assert.isUndefined(store.sortBy);
        assert.throws(() => store.setSort('sampleId', 'asc'));
    });

    it('clamps the page size to what the endpoint accepts', () => {
        const store = new GroupedResourceTableStore();
        store.setPageSize(5000);
        assert.equal(store.pageSize, 1000);
        store.setPageSize(0);
        assert.equal(store.pageSize, 1);
    });

    it('rejects more group counts than the endpoint accepts', () => {
        const store = new GroupedResourceTableStore();
        const columns = Array.from({ length: 11 }, (_, i) => `metadata:k${i}`);
        assert.throws(() => store.setGroupCounts(columns));
    });

    it('resets search and filters with the cohort', () => {
        const store = new GroupedResourceTableStore();
        store.setResourceIds(['PATHOLOGY_SLIDE']);
        store.setSearchTerm('TCGA');
        store.setPage(2);

        store.setCohort({ ...baseState.cohort, studyViewFilter: filter });

        assert.equal(store.searchTerm, '');
        assert.equal(store.pageNumber, 0);
        assert.deepEqual(store.groupsQuery!.studyViewFilter, filter);
    });

    it('fetches metadata with groupBy, independent of paging', async () => {
        fetchMetadata.mockResolvedValue({
            columns: [],
            totalRowCount: 4,
            filteredPatientCount: 2,
            filteredSampleCount: 3,
            facets: {},
            facetRanges: {},
            distinctValueCounts: {},
        });
        const store = newStore();
        const disposeMetadata = autorun(() => store.metadata.result);

        await when(() => store.metadata.isComplete);
        store.setPage(4);
        await when(() => store.metadata.isComplete);
        disposeMetadata();

        assert.equal(fetchMetadata.mock.calls.length, 1);
        assert.equal(fetchMetadata.mock.calls[0][0].groupBy, 'patient');
    });
});
