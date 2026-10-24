import { observable, runInAction, toJS } from 'mobx';
import { remoteData, toPromise } from 'cbioportal-frontend-commons';
import {
    ClinicalDataBin,
    ClinicalDataBinFilter,
    ClinicalDataFilter,
    Sample,
} from 'cbioportal-ts-api-client';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import { StudyViewPageStore } from './StudyViewPageStore';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    convertClinicalDataBinsToDataBins,
} from './StudyViewUtils';

describe('numerical custom data restoration', () => {
    const chartId = 'saved-numerical-chart';
    const chart: ChartMeta = {
        uniqueKey: chartId,
        displayName: 'Custom score',
        description: 'Custom score',
        dataType: ChartMetaDataTypeEnum.CUSTOM_DATA,
        patientAttribute: false,
        renderWhenDataChange: false,
        priority: 0,
        clinicalAttribute: {
            clinicalAttributeId: chartId,
            datatype: 'NUMBER',
            displayName: 'Custom score',
            description: 'Custom score',
            patientAttribute: false,
            priority: '0',
            studyId: 'study',
        },
    };
    const customData = [
        {
            studyId: 'study',
            sampleId: 'sample-1',
            patientId: 'patient-1',
            value: '2',
        },
        {
            studyId: 'study',
            sampleId: 'sample-2',
            patientId: 'patient-2',
            value: '8',
        },
    ];
    const bins = ([
        { attributeId: chartId, start: -10, end: 0, count: 0 },
        { attributeId: chartId, start: 0, end: 10, count: 2 },
        { attributeId: chartId, specialValue: 'NA', count: 1 },
    ] as unknown) as ClinicalDataBin[];

    function createStore(response: ClinicalDataBin[] = bins) {
        const fetchBins = jest.fn().mockResolvedValue(response);
        const sampleIds = observable.array([
            'sample-1',
            'sample-2',
            'sample-without-data',
        ]);
        const store = Object.assign(
            Object.create(StudyViewPageStore.prototype),
            {
                customChartSet: observable.map(),
                _customCharts: observable.map(),
                _customChartsSelectedCases: observable.map(),
                _newlyCreatedCustomChartSet: observable.map(),
                _customDataFilterSet: observable.map<
                    string,
                    ClinicalDataFilter
                >(),
                _customDataBinFilterSet: observable.map<
                    string,
                    ClinicalDataBinFilter
                >(),
                chartsType: observable.map(),
                chartsDimension: observable.map(),
                newlyAddedCharts: observable.array<string>(),
                sharedCustomChartSet: {},
                customDataBinPromises: {},
                internalClient: {
                    fetchCustomDataBinCountsUsingPOST: fetchBins,
                },
                selectedSamples: remoteData({
                    invoke: async () =>
                        sampleIds.map(
                            sampleId =>
                                ({ studyId: 'study', sampleId } as Sample)
                        ),
                }),
                changeChartVisibility: jest.fn(),
            }
        ) as StudyViewPageStore;
        Object.defineProperties(store, {
            chartMetaSet: {
                get: () => Object.fromEntries(store.customChartSet),
            },
            studyIds: { value: ['study'] },
            filters: {
                get: () => ({
                    studyIds: ['study'],
                    ...(store.customDataFilters.length
                        ? { customDataFilters: toJS(store.customDataFilters) }
                        : {}),
                }),
            },
        });
        return { store, fetchBins, sampleIds };
    }

    function restoreChart(store: StudyViewPageStore, shared: boolean = false) {
        store.updateCustomDataList(
            [{ ...chart, data: customData, isSharedChart: shared }],
            !shared,
            shared
        );
    }

    async function loadBins(store: StudyViewPageStore) {
        await toPromise(store.selectedSamples);
        return toPromise(
            store.getCustomDataNumerical(store.customChartSet.get(chartId)!)
        );
    }

    it.each([false, true])(
        'does not select samples when initializing a restored chart (shared=%s)',
        async shared => {
            const { store, fetchBins } = createStore();
            restoreChart(store, shared);
            expect(store.customDataFilters).toEqual([]);

            await loadBins(store);

            expect(store.customDataFilters).toEqual([]);
            expect(store.filters.customDataFilters).toBeUndefined();
            expect(fetchBins).toHaveBeenCalledWith({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: [
                        {
                            attributeId: chartId,
                            disableLogScale: false,
                            showNA: false,
                        },
                    ],
                    studyViewFilter: { studyIds: ['study'] },
                },
            });
        }
    );

    it.each(
        [
            [{ start: 2, end: 4 }],
            [{ start: 0, end: 0 }],
            [{ value: 'NA' }],
            [{ start: 2, end: 4 }, { value: 'NA' }],
        ].map(values => [values])
    )('preserves restored filter values %j', async values => {
        const { store } = createStore();
        const filter = ({
            attributeId: chartId,
            values,
        } as unknown) as ClinicalDataFilter;
        store.updateStoreByFilters({ customDataFilters: [filter] });
        restoreChart(store, true);

        await loadBins(store);

        expect(toJS(store.customDataFilters)).toEqual([filter]);
    });

    it('returns initialized bins including zero boundaries and missing data', async () => {
        const { store } = createStore();
        restoreChart(store);

        expect(await loadBins(store)).toEqual(
            convertClinicalDataBinsToDataBins(bins)
        );
        expect(store.isShowNAToggleVisible(await loadBins(store))).toBe(true);
    });

    it('keeps an empty numerical chart unfiltered', async () => {
        const { store } = createStore([]);
        restoreChart(store);

        expect(await loadBins(store)).toEqual([]);
        expect(store.customDataFilters).toEqual([]);
    });

    it('refreshes restored unfiltered bins after the selected samples change', async () => {
        const { store, fetchBins, sampleIds } = createStore();
        restoreChart(store);
        await loadBins(store);
        fetchBins.mockResolvedValue([
            { attributeId: chartId, start: 0, end: 10, count: 1 },
        ]);

        runInAction(() => sampleIds.replace(['sample-1']));
        const refreshedBins = await loadBins(store);

        expect(
            store.selectedSamples.result!.map(sample => sample.sampleId)
        ).toEqual(['sample-1']);
        expect(refreshedBins).toEqual([
            { id: chartId, start: 0, end: 10, count: 1 },
        ]);
        expect(store.customDataFilters).toEqual([]);
    });

    it('handles an empty selection and resumes fetching when samples return', async () => {
        const { store, fetchBins, sampleIds } = createStore();
        restoreChart(store);
        await loadBins(store);
        fetchBins.mockClear();

        runInAction(() => sampleIds.clear());
        expect(await loadBins(store)).toEqual([]);
        expect(store.selectedSamples.result).toEqual([]);
        expect(fetchBins).not.toHaveBeenCalled();

        runInAction(() => sampleIds.replace(['sample-1', 'sample-2']));
        expect(await loadBins(store)).toEqual(
            convertClinicalDataBinsToDataBins(bins)
        );
        expect(fetchBins).toHaveBeenCalled();
        expect(store.customDataFilters).toEqual([]);
    });

    it('does not recreate a numerical selection after clearing its filter', async () => {
        const { store, fetchBins, sampleIds } = createStore();
        store.updateStoreByFilters({
            customDataFilters: [
                { attributeId: chartId, values: [{ start: 2, end: 4 }] },
            ],
        } as any);
        restoreChart(store);
        await loadBins(store);

        store.setCustomChartNumericalFilters(chartId, []);
        runInAction(() => sampleIds.replace(['sample-1', 'sample-2']));
        await loadBins(store);

        expect(store.customDataFilters).toEqual([]);
        expect(
            fetchBins.mock.calls[fetchBins.mock.calls.length - 1][0]
                .clinicalDataBinCountFilter.studyViewFilter.customDataFilters
        ).toBeUndefined();
    });

    it.each([
        { values: ['2', '8'], initialRange: { start: 1, end: 8 } },
        { values: ['-3', '0', '8'], initialRange: { start: 0, end: 8 } },
        { values: ['0'], initialRange: { start: 0, end: 0 } },
    ])(
        'keeps the existing new-upload selection for $values',
        async ({ values, initialRange }) => {
            const saveCustomData = jest
                .spyOn(sessionServiceClient, 'saveCustomData')
                .mockResolvedValue({ id: chartId } as any);
            try {
                const { store, fetchBins } = createStore();
                const uploadedData = values.map((value, index) => ({
                    studyId: 'study',
                    sampleId: `sample-${index + 1}`,
                    patientId: `patient-${index + 1}`,
                    value,
                }));
                await store.addCustomChart({
                    origin: ['study'],
                    displayName: 'Custom score',
                    description: 'Custom score',
                    datatype: 'NUMBER',
                    patientAttribute: false,
                    priority: 0,
                    data: uploadedData,
                });
                const initialFilters = toJS(store.customDataFilters);
                expect(initialFilters).toEqual([
                    { attributeId: chartId, values: [initialRange] },
                ]);

                await loadBins(store);

                expect(
                    fetchBins.mock.calls[0][0].clinicalDataBinCountFilter
                        .studyViewFilter.customDataFilters
                ).toEqual(initialFilters);
                expect(store.customChartSet.get(chartId)!.data).toEqual(
                    uploadedData
                );
                expect(toJS(store.customDataFilters)).toEqual([
                    {
                        attributeId: chartId,
                        values: [
                            { start: -10, end: undefined },
                            { start: undefined, end: 10 },
                        ],
                    },
                ]);
                expect(store.isNewlyAdded(chartId)).toBe(true);
            } finally {
                saveCustomData.mockRestore();
            }
        }
    );
});
