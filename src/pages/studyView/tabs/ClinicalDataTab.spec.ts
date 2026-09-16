import {
    CLINICAL_DATA_FETCH_SIZE,
    CLINICAL_DATA_PAGE_SIZE,
    getClinicalDataLastPage,
    getClinicalDataPageRange,
} from './ClinicalDataTab';
import { autorun, observable, runInAction } from 'mobx';
import { mobxPromiseResolve } from 'cbioportal-frontend-commons';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import sinon from 'sinon';
import { ClinicalDataTab } from './ClinicalDataTab';

describe('Clinical Data pagination', () => {
    it('calculates the final page beyond the old 500-row limit', () => {
        expect(CLINICAL_DATA_FETCH_SIZE).toBe(500);
        expect(getClinicalDataLastPage(501, CLINICAL_DATA_PAGE_SIZE)).toBe(50);
        expect(getClinicalDataLastPage(500, CLINICAL_DATA_PAGE_SIZE)).toBe(49);
        expect(getClinicalDataLastPage(0, CLINICAL_DATA_PAGE_SIZE)).toBe(0);
    });

    it('calculates the displayed range for full and partial pages', () => {
        expect(
            getClinicalDataPageRange(0, CLINICAL_DATA_PAGE_SIZE, 501, 10)
        ).toEqual({
            first: 1,
            last: 10,
        });
        expect(
            getClinicalDataPageRange(50, CLINICAL_DATA_PAGE_SIZE, 501, 1)
        ).toEqual({
            first: 501,
            last: 501,
        });
        expect(
            getClinicalDataPageRange(0, CLINICAL_DATA_PAGE_SIZE, 0, 0)
        ).toEqual({
            first: 0,
            last: 0,
        });
    });

    it('invalidates block cache entries when the query changes', async () => {
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        fetchStub.resolves({
            body: { byUniqueSampleKey: {} },
            header: { 'total-count': '1000' },
        } as any);

        const store = observable({
            filters: { studyIds: ['study'] },
            clinicalAttributes: mobxPromiseResolve([]),
            selectedSamples: mobxPromiseResolve([{}]),
            sampleSetByKey: mobxPromiseResolve({}),
            clinicalAttributeDisplayNameToClinicalAttribute: mobxPromiseResolve(
                {}
            ),
        });
        const tab = new ClinicalDataTab({ store: store as any });
        const dispose = autorun(() => tab.getDataForClinicalDataTab.result);
        const waitForRemoteData = () =>
            new Promise(resolve => setTimeout(resolve, 30));

        try {
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(1);

            runInAction(() => {
                tab.clinicalDataPage = 50;
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(2);

            runInAction(() => {
                tab.clinicalDataPage = 0;
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(2);

            runInAction(() => {
                tab.clinicalDataTabSearchTerm = 'new-search';
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(3);
            expect(fetchStub.lastCall.args[0].searchTerm).toBe('new-search');
        } finally {
            dispose();
            tab.componentWillUnmount();
            fetchStub.restore();
        }
    });
});
