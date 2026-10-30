import {
    CLINICAL_DATA_FETCH_SIZE,
    CLINICAL_DATA_DOWNLOAD_BATCH_SIZE,
    CLINICAL_DATA_PAGE_SIZE,
    fetchClinicalDataForStudyViewClinicalDataTabDownload,
    getClinicalDataLastPage,
    getClinicalDataLastPageForResult,
    getClinicalDataPageRange,
    shouldShowClinicalDataResultLimit,
} from './ClinicalDataTab';
import { autorun, observable, runInAction } from 'mobx';
import { mobxPromiseResolve } from 'cbioportal-frontend-commons';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import sinon from 'sinon';
import { ClinicalDataTab } from './ClinicalDataTab';
import * as React from 'react';
import { shallow } from 'enzyme';

describe('Clinical Data pagination', () => {
    it('calculates the final page beyond the old 500-row limit', () => {
        expect(CLINICAL_DATA_FETCH_SIZE).toBe(500);
        expect(getClinicalDataLastPage(501, CLINICAL_DATA_PAGE_SIZE)).toBe(25);
        expect(getClinicalDataLastPage(500, CLINICAL_DATA_PAGE_SIZE)).toBe(24);
        expect(getClinicalDataLastPage(0, CLINICAL_DATA_PAGE_SIZE)).toBe(0);
    });

    it('calculates the displayed range for full and partial pages', () => {
        expect(
            getClinicalDataPageRange(0, CLINICAL_DATA_PAGE_SIZE, 501, 20)
        ).toEqual({
            first: 1,
            last: 20,
        });
        expect(
            getClinicalDataPageRange(25, CLINICAL_DATA_PAGE_SIZE, 501, 1)
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

    it('uses the rows available from legacy responses for the final page', () => {
        const legacyResult = {
            totalItems: 501,
            supportsServerPagination: false,
            availableItems: 480,
            data: Array(20).fill({}),
        };
        const serverResult = {
            totalItems: 501,
            supportsServerPagination: true,
            availableItems: 20,
            data: Array(20).fill({}),
        };

        expect(
            getClinicalDataLastPageForResult(
                legacyResult,
                CLINICAL_DATA_PAGE_SIZE
            )
        ).toBe(23);
        expect(
            getClinicalDataLastPageForResult(
                serverResult,
                CLINICAL_DATA_PAGE_SIZE
            )
        ).toBe(25);
        expect(
            shouldShowClinicalDataResultLimit(
                legacyResult,
                0,
                CLINICAL_DATA_PAGE_SIZE
            )
        ).toBe(false);
        expect(
            shouldShowClinicalDataResultLimit(
                legacyResult,
                23,
                CLINICAL_DATA_PAGE_SIZE
            )
        ).toBe(true);
    });

    it('downloads all clinical-data batches as TSV', async () => {
        const sampleSetByKey = {
            'sample-1': {
                studyId: 'study',
                sampleId: 'sample-1',
                patientId: 'patient-1',
            },
            'sample-2': {
                studyId: 'study',
                sampleId: 'sample-2',
                patientId: 'patient-2',
            },
            'sample-3': {
                studyId: 'study',
                sampleId: 'sample-3',
                patientId: 'patient-3',
            },
        };
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        const progress: Array<{
            completedRows: number;
            totalRows?: number;
        }> = [];
        fetchStub.onFirstCall().resolves({
            body: {
                byUniqueSampleKey: {
                    'sample-1': [],
                    'sample-2': [],
                },
                orderedSampleKeys: ['sample-1', 'sample-2'],
            },
            header: { 'total-count': '3' },
        } as any);
        fetchStub.onSecondCall().resolves({
            body: {
                byUniqueSampleKey: { 'sample-3': [] },
                orderedSampleKeys: ['sample-3'],
            },
            header: { 'total-count': '3' },
        } as any);

        try {
            const output = await fetchClinicalDataForStudyViewClinicalDataTabDownload(
                { studyIds: ['study'] } as any,
                sampleSetByKey as any,
                undefined,
                undefined,
                undefined,
                [
                    {
                        name: 'Patient ID',
                        render: () => React.createElement('span'),
                        download: row => row.patientId,
                    },
                    {
                        name: 'Sample ID',
                        render: () => React.createElement('span'),
                        download: row => row.sampleId,
                    },
                ],
                value => progress.push(value)
            );

            expect(fetchStub.callCount).toBe(2);
            expect(fetchStub.firstCall.args[0].pageSize).toBe(
                CLINICAL_DATA_DOWNLOAD_BATCH_SIZE
            );
            expect(fetchStub.secondCall.args[0].pageNumber).toBe(1);
            expect(progress).toEqual([
                { completedRows: 2, totalRows: 3 },
                { completedRows: 3, totalRows: 3 },
            ]);
            const outputText = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error);
                reader.readAsText(output);
            });
            expect(outputText).toBe(
                'Patient ID\tSample ID\r\n' +
                    'patient-1\tsample-1\r\n' +
                    'patient-2\tsample-2\r\n' +
                    'patient-3\tsample-3\r\n'
            );
        } finally {
            fetchStub.restore();
        }
    });

    it('cancels a clinical-data download before the request completes', async () => {
        let resolvePage: (value: any) => void = () => undefined;
        const pendingPage = new Promise(resolve => {
            resolvePage = resolve;
        });
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        fetchStub.returns(pendingPage as any);

        try {
            const download = fetchClinicalDataForStudyViewClinicalDataTabDownload(
                { studyIds: ['study'] } as any,
                {
                    'sample-1': {
                        studyId: 'study',
                        sampleId: 'sample-1',
                        patientId: 'patient-1',
                    },
                } as any,
                undefined,
                undefined,
                undefined,
                []
            );

            download.cancel?.();
            resolvePage({
                body: {
                    byUniqueSampleKey: { 'sample-1': [] },
                    orderedSampleKeys: ['sample-1'],
                },
                header: { 'total-count': '1' },
            });

            let error: Error | undefined;
            try {
                await download;
            } catch (caughtError) {
                error = caughtError as Error;
            }
            expect(error?.message).toBe('Clinical data download cancelled');
        } finally {
            fetchStub.restore();
        }
    });

    it('invalidates block cache entries when the query changes', async () => {
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        fetchStub.resolves({
            body: { byUniqueSampleKey: {}, orderedSampleKeys: [] },
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
                tab.clinicalDataPage = 24;
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(1);

            runInAction(() => {
                tab.clinicalDataPage = 25;
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(2);
            expect(fetchStub.lastCall.args[0].pageSize).toBe(500);
            expect(fetchStub.lastCall.args[0].pageNumber).toBe(1);

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

    it('keeps the last successful page visible when a block request fails', async () => {
        const sampleSetByKey = Object.fromEntries(
            Array.from({ length: 20 }, (_, index) => [
                `sample-${index}`,
                {
                    studyId: 'study',
                    sampleId: `sample-${index}`,
                    patientId: `patient-${index}`,
                    uniqueSampleKey: `sample-${index}`,
                },
            ])
        );
        const block = {
            byUniqueSampleKey: Object.fromEntries(
                Object.keys(sampleSetByKey).map(key => [key, []])
            ),
            orderedSampleKeys: Object.keys(sampleSetByKey),
        };
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        fetchStub.onFirstCall().resolves({
            body: block,
            header: { 'total-count': '501' },
        } as any);
        fetchStub
            .onSecondCall()
            .callsFake(
                () =>
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error('Temporary failure')),
                            10
                        )
                    )
            );
        fetchStub.onThirdCall().resolves({
            body: block,
            header: { 'total-count': '501' },
        } as any);

        const store = observable({
            filters: { studyIds: ['study'] },
            clinicalAttributes: mobxPromiseResolve([]),
            selectedSamples: mobxPromiseResolve(Object.values(sampleSetByKey)),
            sampleSetByKey: mobxPromiseResolve(sampleSetByKey),
            clinicalAttributeDisplayNameToClinicalAttribute: mobxPromiseResolve(
                {}
            ),
        });
        const tab = new ClinicalDataTab({ store: store as any });
        const dispose = autorun(() => tab.getDataForClinicalDataTab.result);
        const waitForRemoteData = () =>
            new Promise(resolve => setTimeout(resolve, 50));

        try {
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(1);
            expect((tab as any).clinicalDataDisplayedResult.data).toHaveLength(
                20
            );

            runInAction(() => {
                tab.clinicalDataPage = 25;
            });
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(2);
            expect(tab.clinicalDataPage).toBe(25);
            expect((tab as any).clinicalDataDisplayedResult.data).toHaveLength(
                20
            );
            expect(tab.getDataForClinicalDataTab.isError).toBe(true);

            (tab as any).retryClinicalDataPage();
            await waitForRemoteData();
            expect(fetchStub.callCount).toBe(3);
            expect(fetchStub.lastCall.args[0].pageNumber).toBe(1);
            expect(tab.clinicalDataPage).toBe(25);
            expect((tab as any).clinicalDataDisplayedPage).toBe(25);
        } finally {
            dispose();
            tab.componentWillUnmount();
            fetchStub.restore();
        }
    });

    it('renders the table for selections larger than the old product limit', () => {
        const fetchStub = sinon.stub(
            internalClient,
            'fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo'
        );
        fetchStub.resolves({
            body: { byUniqueSampleKey: {}, orderedSampleKeys: [] },
            header: { 'total-count': '171347' },
        } as any);

        const store = {
            filters: { studyIds: ['study'] },
            clinicalAttributes: mobxPromiseResolve(Array(71).fill({})),
            selectedSamples: mobxPromiseResolve(Array(171347).fill({})),
            sampleSetByKey: mobxPromiseResolve({}),
            clinicalAttributeDisplayNameToClinicalAttribute: mobxPromiseResolve(
                {}
            ),
            visibleAttributes: [{}],
            visibleAttributesForClinicalData: [],
        };
        const wrapper = shallow(
            React.createElement(ClinicalDataTab, { store: store as any })
        );

        try {
            expect(wrapper.find('ClinicalDataTabTableComponent')).toHaveLength(
                1
            );
            expect(wrapper.text()).not.toContain('Too many samples selected');
        } finally {
            wrapper.unmount();
            fetchStub.restore();
        }
    });
});
