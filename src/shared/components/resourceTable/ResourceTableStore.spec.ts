import { assert } from 'chai';
import { autorun, when } from 'mobx';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
    ResourceColumnFilter,
    fetchResourceTableData,
    fetchResourceTableMetadata,
    fetchResourceTableTabs,
} from 'shared/api/resourceTableClient';
import { ResourceTableStore } from './ResourceTableStore';

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
