/**
 * Created by aaronlisman on 3/2/17.
 */
import {
    buildCohortIdsFromNavCaseIds,
    filterMutationsByProfiledGene,
    getUniqueStudyIds,
    handlePathologyReportCheckResponse,
    PatientViewPageStore,
} from './PatientViewPageStore';
import { assert } from 'chai';
import sinon from 'sinon';
import { AppStore } from '../../../AppStore';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';

describe('PatientViewPageStore', () => {
    let store: PatientViewPageStore;
    let urlWrapper: PatientViewUrlWrapper;

    beforeAll(() => {
        store = new PatientViewPageStore(
            new AppStore(),
            urlWrapper,
            'someId',
            ''
        );
    });

    it('if there are pdf items in response and their name starts with a given patientId, return collection, otherwise returns empty array', () => {
        let result = handlePathologyReportCheckResponse('some', {
            total_count: 1,
            items: [{ url: 'someUrl', name: 'someName' }],
        });
        assert.deepEqual(result, [{ url: 'someUrl', name: 'someName' }]);

        result = handlePathologyReportCheckResponse('some', {
            total_count: 0,
        });
        assert.deepEqual(result, []);
    });

    it('if there are pdf items in response and their name starts with the wrong patientId, return empty array', () => {
        let result = handlePathologyReportCheckResponse('xxx', {
            total_count: 1,
            items: [{ url: 'someUrl', name: 'someName' }],
        });
        assert.deepEqual(result, []);
    });

    it('deduplicates unique study ids while preserving first-seen order', () => {
        assert.deepEqual(
            getUniqueStudyIds([
                'studyA:P-1',
                'studyB:P-2',
                'studyA:P-3',
                'studyC:P-4',
            ]),
            ['studyA', 'studyB', 'studyC']
        );
    });

    it('builds cohort ids from nav case ids in order', () => {
        assert.deepEqual(
            buildCohortIdsFromNavCaseIds([
                { studyId: 'studyA', patientId: 'P-1' },
                { studyId: 'studyB', patientId: 'P-2' },
            ]),
            ['studyA:P-1', 'studyB:P-2']
        );
    });

    it('filters mutation rows to genes profiled in every sample', () => {
        const profiledStub = sinon.stub(
            TumorColumnFormatter,
            'getProfiledSamplesForGene'
        );
        profiledStub.onCall(0).returns({
            'S-1': true,
            'S-2': true,
        });
        profiledStub.onCall(1).returns({
            'S-1': true,
            'S-2': false,
        });

        const mutationRows = [
            [{ gene: { entrezGeneId: 1 } }],
            [{ gene: { entrezGeneId: 2 } }],
        ] as any;

        const result = filterMutationsByProfiledGene(
            mutationRows,
            ['S-1', 'S-2'],
            {} as any,
            {} as any
        );

        assert.deepEqual(result, [mutationRows[0]]);
        profiledStub.restore();
    });

    it('sets page title to patient if theres a patient id and sample if sample id, patient id winning out', () => {
        assert.equal(store.pageTitle, 'Patient: ');

        store.setPatientId('1234');
        assert.equal(store.pageTitle, 'Patient: 1234');

        store.setSampleId('1234');
        assert.equal(store.pageTitle, 'Sample: 1234');

        store.setPatientId('1234');
        assert.equal(store.pageTitle, 'Patient: 1234');
    });
});
