import React from 'react';
import TestRenderer from 'react-test-renderer';
import { assert } from 'chai';
import { sortTracks } from 'pages/patientView/timeline/timeline_helpers';
import * as SampleManagerModule from 'pages/patientView/SampleManager';
import { TimelineStore } from 'cbioportal-clinical-timeline';
import { autorun } from 'mobx';

const timelineMountTracker = {
    mounts: 0,
    unmounts: 0,
};
const timelineMock = jest.fn<null, [Record<string, unknown>]>(() => null);

jest.mock('cbioportal-clinical-timeline', () => ({
    __esModule: true,
    configureTracks: jest.fn(),
    Timeline: (props: Record<string, unknown>) => {
        React.useEffect(() => {
            timelineMountTracker.mounts += 1;
            return () => {
                timelineMountTracker.unmounts += 1;
            };
        }, []);
        return timelineMock(props);
    },
    TimelineStore: jest.fn().mockImplementation(() => ({
        pixelWidth: 1000,
        viewPortWidth: 1000,
        sampleEvents: [],
        getPosition: jest.fn(),
    })),
}));

jest.mock('pages/patientView/timeline/timeline_helpers', () => ({
    buildBaseConfig: jest.fn(() => ({
        trackEventRenderers: [],
    })),
    configureGenieTimeline: jest.fn(),
    sortTracks: jest.fn(() => []),
}));

jest.mock('pages/patientView/timeline/timelineDataUtils', () => ({
    downloadZippedTracks: jest.fn(),
}));

jest.mock('./VAFChartControls', () => ({
    VAFChartControls: () => null,
}));

import VAFChartWrapper, { getSampleIconGroupKey } from './VAFChartWrapper';

describe('VAFChartWrapper', () => {
    beforeEach(() => {
        timelineMountTracker.mounts = 0;
        timelineMountTracker.unmounts = 0;
        timelineMock.mockClear();
        jest.clearAllMocks();
    });

    it('builds stable sample icon group keys from x coordinate and grouped sample ids', () => {
        assert.equal(
            getSampleIconGroupKey(125, ['S-2', 'S-4']),
            '125:S-2|S-4'
        );
    });

    it('changes sample icon group keys when the grouped sample ids change', () => {
        assert.notEqual(
            getSampleIconGroupKey(125, ['S-2', 'S-4']),
            getSampleIconGroupKey(125, ['S-2', 'S-5'])
        );
    });

    it('does not remount the inner timeline when sequential mode changes', () => {
        const wrapperStore = {
            groupingByIsSelected: false,
            showSequentialMode: false,
            onlyShowSelectedInVAFChart: false,
            groupByOption: null,
            dataHeight: 200,
            vafChartYAxisToDataRange: false,
            vafChartLogScale: false,
        };
        const props = {
            wrapperStore,
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111' },
                index: { 'S-1': 0 },
                label: { 'S-1': '1' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1'],
            },
            width: 800,
            samples: [
                {
                    sampleId: 'S-1',
                },
            ],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(<VAFChartWrapper {...props} />);
        });

        expect(timelineMountTracker.mounts).toBe(1);
        expect(timelineMountTracker.unmounts).toBe(0);

        const updatedProps = {
            ...props,
            wrapperStore: {
                ...wrapperStore,
                showSequentialMode: true,
            },
        };

        TestRenderer.act(() => {
            renderer!.update(<VAFChartWrapper {...updatedProps} />);
        });

        expect(timelineMountTracker.mounts).toBe(1);
        expect(timelineMountTracker.unmounts).toBe(0);
        expect(timelineMock).toHaveBeenCalledTimes(2);
    });

    it('uses a caller-provided clinical-events signature for track setup', () => {
        const props = {
            wrapperStore: {
                groupingByIsSelected: false,
                showSequentialMode: false,
                onlyShowSelectedInVAFChart: false,
                groupByOption: null,
                dataHeight: 200,
                vafChartYAxisToDataRange: false,
                vafChartLogScale: false,
            },
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            clinicalEventsSignature: 'provided-signature',
            caseMetaData: {
                color: { 'S-1': '#111111' },
                index: { 'S-1': 0 },
                label: { 'S-1': '1' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1'],
            },
            width: 800,
            samples: [
                {
                    sampleId: 'S-1',
                },
            ],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        TestRenderer.act(() => {
            TestRenderer.create(<VAFChartWrapper {...props} />);
        });

        expect(sortTracks).toHaveBeenCalledWith(
            expect.anything(),
            props.data,
            'provided-signature'
        );
    });

    it('reuses one grouped clinical-value snapshot across derived grouping getters', () => {
        const clinicalValueToSamplesMapSpy = jest.spyOn(
            SampleManagerModule,
            'clinicalValueToSamplesMap'
        );
        const wrapperStore = {
            groupingByIsSelected: true,
            showSequentialMode: false,
            onlyShowSelectedInVAFChart: false,
            groupByOption: 'CANCER_TYPE',
            dataHeight: 200,
            vafChartYAxisToDataRange: false,
            vafChartLogScale: false,
        };
        const props = {
            wrapperStore,
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111', 'S-2': '#222222' },
                index: { 'S-1': 0, 'S-2': 1 },
                label: { 'S-1': '1', 'S-2': '2' },
            },
            sampleManager: {
                samples: [
                    {
                        id: 'S-1',
                        clinicalData: [
                            {
                                clinicalAttributeId: 'CANCER_TYPE',
                                value: 'Breast Cancer',
                            },
                        ],
                    },
                    {
                        id: 'S-2',
                        clinicalData: [
                            {
                                clinicalAttributeId: 'CANCER_TYPE',
                                value: 'Lung Cancer',
                            },
                        ],
                    },
                ],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1', 'S-2'],
            },
            width: 800,
            samples: [{ sampleId: 'S-1' }, { sampleId: 'S-2' }],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(<VAFChartWrapper {...props} />);
        });

        const instance = renderer.getInstance() as any;
        expect(instance.clinicalValuesForGrouping).toEqual([
            'Breast Cancer',
            'Lung Cancer',
        ]);
        expect(instance.groupIndexByClinicalValue).toEqual({
            'Breast Cancer': 0,
            'Lung Cancer': 1,
        });
        expect(Object.keys(instance.clinicalValueToColor)).toEqual([
            'Breast Cancer',
            'Lung Cancer',
        ]);
        expect(instance.sampleGroups).toEqual({
            0: ['S-1'],
            1: ['S-2'],
        });
        expect(clinicalValueToSamplesMapSpy).toHaveBeenCalledTimes(1);
    });

    it('reuses one sample-event position snapshot across repeated non-sequential x-position reads', () => {
        const getPosition = jest.fn((sample: any) => ({
            pixelLeft:
                sample.event.attributes[0].value === 'S-1' ? 125 : 250,
        }));
        (TimelineStore as jest.Mock).mockImplementationOnce(() => ({
            pixelWidth: 1000,
            viewPortWidth: 1000,
            sampleEvents: [
                {
                    event: {
                        attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                    },
                },
                {
                    event: {
                        attributes: [{ key: 'SAMPLE_ID', value: 'S-2' }],
                    },
                },
            ],
            getPosition,
        }));
        const props = {
            wrapperStore: {
                groupingByIsSelected: false,
                showSequentialMode: false,
                onlyShowSelectedInVAFChart: false,
                groupByOption: null,
                dataHeight: 200,
                vafChartYAxisToDataRange: false,
                vafChartLogScale: false,
            },
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111', 'S-2': '#222222' },
                index: { 'S-1': 0, 'S-2': 1 },
                label: { 'S-1': '1', 'S-2': '2' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1', 'S-2'],
            },
            width: 800,
            samples: [{ sampleId: 'S-1' }, { sampleId: 'S-2' }],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        const instance = new (VAFChartWrapper as any)(props);
        const dispose = autorun(() => {
            expect(instance.sampleEventPositionSummary.samplePosition).toEqual({
                'S-1': 125,
                'S-2': 250,
            });
            expect(instance.xPosition).toEqual({
                'S-1': 125,
                'S-2': 250,
            });
        });

        expect(getPosition).toHaveBeenCalledTimes(2);
        dispose();
    });

    it('reuses one line-data range snapshot across repeated min/max reads', () => {
        const props = {
            wrapperStore: {
                groupingByIsSelected: false,
                showSequentialMode: false,
                onlyShowSelectedInVAFChart: false,
                groupByOption: null,
                dataHeight: 200,
                vafChartYAxisToDataRange: false,
                vafChartLogScale: false,
            },
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111', 'S-2': '#222222' },
                index: { 'S-1': 0, 'S-2': 1 },
                label: { 'S-1': '1', 'S-2': '2' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1', 'S-2'],
            },
            width: 800,
            samples: [{ sampleId: 'S-1' }, { sampleId: 'S-2' }],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        const instance = new (VAFChartWrapper as any)(props);
        const lineData = [
            [
                { y: 0.25 },
                { y: 0.5 },
            ],
            [
                { y: 0.1 },
                { y: 0.9 },
            ],
        ];
        const lineDataGetter = jest
            .spyOn(instance, 'lineData', 'get')
            .mockReturnValue(lineData);

        const dispose = autorun(() => {
            expect(instance.lineDataRangeSummary).toEqual({
                maxYValue: 0.9,
                minYValue: 0.1,
            });
            expect(instance.minYValue).toBe(0.1);
            expect(instance.maxYValue).toBe(0.9);
        });

        expect(lineDataGetter).toHaveBeenCalledTimes(1);
        lineDataGetter.mockRestore();
        dispose();
    });

    it('reuses one sample-icon layout snapshot across repeated track reads', () => {
        const props = {
            wrapperStore: {
                groupingByIsSelected: false,
                showSequentialMode: false,
                onlyShowSelectedInVAFChart: false,
                groupByOption: null,
                dataHeight: 200,
                vafChartYAxisToDataRange: false,
                vafChartLogScale: false,
            },
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111', 'S-2': '#222222' },
                index: { 'S-1': 0, 'S-2': 1 },
                label: { 'S-1': '1', 'S-2': '2' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1', 'S-2'],
            },
            width: 800,
            samples: [{ sampleId: 'S-1' }, { sampleId: 'S-2' }],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        const instance = new (VAFChartWrapper as any)(props);
        jest.spyOn(instance, 'xPosition', 'get').mockReturnValue({
            'S-1': 125,
            'S-2': 250,
        });
        const buildSampleIconMarkerSummaries = jest.spyOn(
            instance as any,
            'buildSampleIconMarkerSummaries'
        );

        const dispose = autorun(() => {
            expect(instance.sampleIconLayoutSummary).toEqual({
                allSamples: [
                    {
                        colors: ['#111111'],
                        groupedSampleIds: ['S-1'],
                        key: '125:S-1',
                        labels: ['1'],
                        x: 125,
                    },
                    {
                        colors: ['#222222'],
                        groupedSampleIds: ['S-2'],
                        key: '250:S-2',
                        labels: ['2'],
                        x: 250,
                    },
                ],
                byGroupIndex: {},
            });
            expect(instance.sampleIconsTracks).toHaveLength(1);
            expect(
                instance.sampleIconsTracks[0].renderTrack()
            ).toBeTruthy();
        });

        expect(buildSampleIconMarkerSummaries).toHaveBeenCalledTimes(1);
        buildSampleIconMarkerSummaries.mockRestore();
        dispose();
    });

    it('reuses one scaled line-data snapshot across repeated y-position and point reads', () => {
        const props = {
            wrapperStore: {
                groupingByIsSelected: false,
                showSequentialMode: false,
                onlyShowSelectedInVAFChart: false,
                groupByOption: null,
                dataHeight: 200,
                vafChartYAxisToDataRange: false,
                vafChartLogScale: false,
            },
            dataStore: {
                mouseOverMutation: null,
                selectedMutations: [],
                setMouseOverMutation: jest.fn(),
                toggleSelectedMutation: jest.fn(),
                allData: [],
            },
            data: [],
            caseMetaData: {
                color: { 'S-1': '#111111', 'S-2': '#222222' },
                index: { 'S-1': 0, 'S-2': 1 },
                label: { 'S-1': '1', 'S-2': '2' },
            },
            sampleManager: {
                samples: [],
                sampleIdToIndexMap: {},
                getSampleIdsInOrder: () => ['S-1', 'S-2'],
            },
            width: 800,
            samples: [{ sampleId: 'S-1' }, { sampleId: 'S-2' }],
            mutationProfileId: 'profile',
            coverageInformation: {
                samples: {},
            },
            headerWidth: 50,
        } as any;

        const instance = new (VAFChartWrapper as any)(props);
        jest.spyOn(instance, 'xPosition', 'get').mockReturnValue({
            'S-1': 125,
            'S-2': 250,
        });
        jest.spyOn(instance, 'groupColor', 'get').mockReturnValue(
            (sampleId: string) =>
                sampleId === 'S-1' ? '#111111' : '#222222'
        );
        jest.spyOn(instance, 'scaleYValue', 'get').mockReturnValue(
            (value: number) => value * 100
        );
        const lineDataGetter = jest.spyOn(instance, 'lineData', 'get').mockReturnValue([
            [
                {
                    sampleId: 'S-1',
                    y: 0.25,
                    mutation: 'M1',
                    mutationStatus: 'Present',
                },
                {
                    sampleId: 'S-2',
                    y: 0.25,
                    mutation: 'M2',
                    mutationStatus: 'Present',
                },
            ],
        ]);

        const dispose = autorun(() => {
            expect(instance.yPosition).toEqual({
                0.25: 25,
            });
            expect(instance.scaledAndColoredLineData).toEqual([
                [
                    {
                        x: 125,
                        y: 25,
                        sampleId: 'S-1',
                        mutation: 'M1',
                        mutationStatus: 'Present',
                        color: '#111111',
                    },
                    {
                        x: 250,
                        y: 25,
                        sampleId: 'S-2',
                        mutation: 'M2',
                        mutationStatus: 'Present',
                        color: '#222222',
                    },
                ],
            ]);
        });

        expect(lineDataGetter).toHaveBeenCalledTimes(1);
        lineDataGetter.mockRestore();
        dispose();
    });
});
