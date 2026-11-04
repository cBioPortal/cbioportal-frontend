import { assert } from 'chai';
import { autorun, when } from 'mobx';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
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
    const sample = (studyId: string, patientId: string, sampleId: string) => ({
        studyId,
        patientId,
        sampleId,
    });

    const allSamples = [
        sample('study_a', 'patient_1', 'sample_1'),
        sample('study_a', 'patient_1', 'sample_2'),
        sample('study_a', 'patient_2', 'sample_3'),
    ];

    it('sends no case identifiers when the whole study is selected', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples, allSamples, true);

        assert.deepEqual(store.studyIds, ['study_a']);
        assert.deepEqual(store.patientIdentifiers, []);
        assert.deepEqual(store.sampleIdentifiers, []);
    });

    it('sends the selection when it is a subset of the study', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples.slice(0, 2), allSamples);

        assert.deepEqual(store.studyIds, ['study_a']);
        assert.deepEqual(store.patientIdentifiers, [
            { studyId: 'study_a', patientId: 'patient_1' },
        ]);
        assert.deepEqual(store.sampleIdentifiers, [
            { studyId: 'study_a', sampleId: 'sample_1' },
            { studyId: 'study_a', sampleId: 'sample_2' },
        ]);
    });

    it('sends the selection while the full sample set is still loading', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples, undefined);

        assert.deepEqual(store.sampleIdentifiers, [
            { studyId: 'study_a', sampleId: 'sample_1' },
            { studyId: 'study_a', sampleId: 'sample_2' },
            { studyId: 'study_a', sampleId: 'sample_3' },
        ]);
    });

    it('keeps every study of a fully selected multi-study cohort', () => {
        const store = new ResourceTableStore();
        const samples = [
            sample('study_a', 'patient_1', 'sample_1'),
            sample('study_b', 'patient_1', 'sample_1'),
        ];

        store.setContextFromSelection(samples, samples, true);

        assert.deepEqual(store.studyIds, ['study_a', 'study_b']);
        assert.deepEqual(store.sampleIdentifiers, []);
    });

    it('sends the selection when the query does not cover the whole study', () => {
        // A virtual study or case list queries a subset, so `all` is that subset too and the
        // lengths match while the cohorts do not. Taking the shortcut here would widen the
        // request to every sample of the physical study.
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples, allSamples, false);

        assert.deepEqual(store.studyIds, ['study_a']);
        assert.deepEqual(store.sampleIdentifiers, [
            { studyId: 'study_a', sampleId: 'sample_1' },
            { studyId: 'study_a', sampleId: 'sample_2' },
            { studyId: 'study_a', sampleId: 'sample_3' },
        ]);
    });

    it('keeps the selected resource when the cohort changes', () => {
        // A scoped store gets its resource before its cohort. If the cohort reset cleared the
        // selection, activeResourceId falls back to the first tab and the tab fetches and
        // renders another resource's rows.
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');

        store.setContextFromSelection(allSamples, allSamples, true);

        // Asserts on the selection, not activeResourceId: that getter's fallback reads
        // this.tabs, which starts a request.
        assert.equal(store.selectedResourceId, 'PATHOLOGY_SLIDE');
    });

    it('resets paging, search and filters when the cohort changes', () => {
        const store = new ResourceTableStore();
        store.setSelectedResourceId('PATHOLOGY_SLIDE');
        store.setPage(2);
        store.setSearchTerm('TCGA-A1');

        store.setContextFromSelection(allSamples, allSamples, true);

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
