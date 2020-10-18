import React from 'react';
import { observer } from 'mobx-react';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';
import { ClinicalEvent, Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import { VAFChartControls } from './VAFChartControls';
import VAFChart, { IColorPoint } from 'pages/patientView/timeline2/VAFChart';
import TimelineWrapperStore from 'pages/patientView/timeline2/TimelineWrapperStore';
import _ from 'lodash';
import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    Timeline,
    TimelineStore,
} from 'cbioportal-clinical-timeline';
import SampleManager, {
    clinicalValueToSamplesMap,
} from 'pages/patientView/SampleManager';
import { downloadZippedTracks } from 'pages/patientView/timeline/timelineTSV';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline2/helpers';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { computed } from 'mobx';
import {
    ceil10,
    computeRenderData,
    floor10,
    getYAxisTickmarks,
    IPoint,
    numLeadingDecimalZeros,
    yValueScaleFunction,
} from './VAFChartUtils';
import { VAFChartHeader } from './VAFChartHeader';
import autobind from 'autobind-decorator';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { MultipleSampleMarker } from './SampleMarker';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface IVAFChartWrapperProps {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    coverageInformation: CoverageInformation;
    headerWidth?: number;
}

@observer
export default class VAFChartWrapper extends React.Component<
    IVAFChartWrapperProps,
    {}
> {
    store: TimelineStore;
    wrapperStore: TimelineWrapperStore;

    constructor(props: IVAFChartWrapperProps) {
        super(props);

        var isGenieBpcStudy = window.location.href.includes('genie_bpc');

        const baseConfig: any = buildBaseConfig(
            props.sampleManager,
            props.caseMetaData
        );

        if (isGenieBpcStudy) {
            configureGenieTimeline(baseConfig);
        }

        const trackSpecifications = sortTracks(baseConfig, this.props.data);

        configureTracks(trackSpecifications, baseConfig.trackEventRenderers);

        // we can consider perhaps moving store into Timeline component
        // not sure if/why it needs to be out here
        this.store = new TimelineStore(trackSpecifications);

        const wrapperStore = new TimelineWrapperStore();

        this.wrapperStore = new TimelineWrapperStore();

        (window as any).store = this.store;
    }

    /** ticks dependencies **/

    @computed get maxYTickmarkValue() {
        if (
            !this.wrapperStore.vafChartYAxisToDataRange ||
            this.maxYValue === undefined
        )
            return 1;
        return ceil10(
            this.maxYValue,
            -numLeadingDecimalZeros(this.maxYValue) - 1
        );
    }

    @computed get minYTickmarkValue() {
        if (
            !this.wrapperStore.vafChartYAxisToDataRange ||
            this.minYValue === undefined
        )
            return 0;
        return floor10(
            this.minYValue,
            -numLeadingDecimalZeros(this.minYValue) - 1
        );
    }

    @computed get ticks(): { label: string; value: number; offset: number }[] {
        const tickmarkValues = getYAxisTickmarks(
            this.minYTickmarkValue,
            this.maxYTickmarkValue
        );
        const numDecimals = numLeadingDecimalZeros(this.minYTickmarkValue) + 1;
        return _.map(tickmarkValues, (v: number) => {
            return {
                label: v.toFixed(numDecimals),
                value: v,
                offset: this.scaleYValue(v),
            };
        });
    }

    @computed get yPosition() {
        let scaledY: { [originalY: number]: number } = {};
        this.lineData.forEach((data: IPoint[], index: number) => {
            data.forEach((d: IPoint, i: number) => {
                scaledY[d.y] = this.scaleYValue(d.y);
            });
        });
        return scaledY;
    }

    // returns function for scaling svg y-axis coordinate system
    @computed get scaleYValue() {
        return yValueScaleFunction(
            this.minYTickmarkValue,
            this.maxYTickmarkValue,
            this.wrapperStore.dataHeight,
            this.wrapperStore.vafChartLogScale
        );
    }

    @computed get mutations() {
        if (this.wrapperStore.onlyShowSelectedInVAFChart) {
            return this.props.dataStore.allData.filter(m =>
                this.props.dataStore.isMutationSelected(m[0])
            );
        } else {
            return this.props.dataStore.allData;
        }
    }

    @computed get lineData() {
        return computeRenderData(
            this.props.samples,
            this.mutations,
            this.props.sampleManager.sampleIdToIndexMap,
            this.props.mutationProfileId,
            this.props.coverageInformation,
            this.wrapperStore.groupByOption!,
            this.sampleIdToClinicalValue
        ).lineData;
    }

    @computed get scaledAndColoredLineData(): IColorPoint[][] {
        let scaledData: IColorPoint[][] = [];
        this.lineData.map((dataPoints: IPoint[], index: number) => {
            scaledData[index] = [];
            dataPoints.map((dataPoint: IPoint, i: number) => {
                scaledData[index].push({
                    x: this.xPosition[dataPoint.sampleId],
                    y: this.yPosition[dataPoint.y],
                    sampleId: dataPoint.sampleId,
                    mutation: dataPoint.mutation,
                    mutationStatus: dataPoint.mutationStatus,
                    color: this.groupColor(dataPoint.sampleId),
                });
            });
        });
        return scaledData;
    }

    @computed get minYValue() {
        return _(this.lineData)
            .flatten()
            .map((d: IPoint) => d.y)
            .min();
    }

    @computed get maxYValue() {
        return _(this.lineData)
            .flatten()
            .map((d: IPoint) => d.y)
            .max();
    }

    @computed get sampleIdToClinicalValue() {
        let sampleIdToClinicalValue: { [sampleId: string]: string } = {};
        if (this.wrapperStore.groupingByIsSelected) {
            this.props.sampleManager.samples.forEach((sample, i) => {
                sampleIdToClinicalValue[
                    sample.id
                ] = SampleManager!.getClinicalAttributeInSample(
                    sample,
                    this.wrapperStore.groupByOption!
                )!.value;
            });
        }
        return sampleIdToClinicalValue;
    }

    @computed get sampleIconsTracks() {
        const tracks: CustomTrackSpecification[] = [];
        if (this.wrapperStore.groupingByIsSelected) {
            _.forIn(this.sampleGroups, (sampleIds: string[], key: string) => {
                const index = parseInt(key);
                tracks.push({
                    renderHeader: () => this.groupByTrackLabel(index),
                    renderTrack: () => this.sampleIcons(sampleIds),
                    height: () => 20,
                    labelForExport: this.clinicalValuesForGrouping[index],
                });
            });
        } else {
            tracks.push({
                renderHeader: () => '',
                renderTrack: () => this.sampleIcons(this.store.sampleIds),
                height: () => 20,
                labelForExport: 'VAF Samples',
            });
        }
        return tracks;
    }

    @computed get xPosition() {
        let positionList: { [sampleId: string]: number } = {};
        let sequentialDistance: number = 0;
        let sequentialPadding: number = 20;
        if (this.wrapperStore.showSequentialMode) {
            sequentialDistance =
                (this.store.pixelWidth - sequentialPadding * 2) /
                (this.store.sampleEvents.length - 1);
        }

        this.store.sampleEvents.forEach((sample, i) => {
            sample.event.attributes.forEach((attribute: any, i: number) => {
                if (attribute.key === 'SAMPLE_ID') {
                    positionList[attribute.value] = this.wrapperStore
                        .showSequentialMode
                        ? this.sampleIdOrder[attribute.value] *
                              sequentialDistance +
                          sequentialPadding
                        : this.store.getPosition(sample)!.pixelLeft;
                }
            });
        });
        return positionList;
    }

    @computed get sampleIdOrder() {
        return stringListToIndexSet(
            this.props.sampleManager.getSampleIdsInOrder()
        );
    }

    groupColor(sampleId: string) {
        return this.wrapperStore.groupingByIsSelected &&
            this.numGroupByGroups > 1
            ? this.groupColorBySampleId(sampleId)
            : 'rgb(0,0,0)';
    }

    @autobind
    groupColorBySampleId(sampleId: string) {
        return this.clinicalValueToColor[
            this.sampleIdToClinicalValue[sampleId]
        ];
    }

    @computed get clinicalValueToColor() {
        let clinicalValueToColor: { [clinicalValue: string]: string } = {};
        const uniqueColorGetter = makeUniqueColorGetter();
        const map = clinicalValueToSamplesMap(
            this.props.sampleManager.samples,
            this.wrapperStore.groupByOption!
        );
        map.forEach((sampleList: string[], clinicalValue: any) => {
            clinicalValueToColor[clinicalValue] = uniqueColorGetter();
        });
        return clinicalValueToColor;
    }

    @autobind
    sampleIcons(sampleIds: string[]) {
        const sampleidsByXCoordinate = _.groupBy(
            sampleIds,
            sampleId => this.xPosition[sampleId]
        );
        const sampleIcons = Object.values(sampleidsByXCoordinate).map(
            groupedSampleIds => {
                const firstSampleId = groupedSampleIds[0];
                const x = this.xPosition[firstSampleId];
                const y = 10;

                const colors = groupedSampleIds.map(
                    sampleId => this.props.caseMetaData.color[sampleId]
                ) || ['#333333'];
                const labels = groupedSampleIds.map(
                    sampleId => this.props.caseMetaData.label[sampleId]
                ) || ['-'];
                return (
                    <g transform={`translate(${x})`}>
                        <MultipleSampleMarker
                            colors={colors}
                            labels={labels}
                            y={y}
                        />
                    </g>
                );
            }
        );
        return <g>{sampleIcons}</g>;
    }

    @autobind
    groupByTrackLabel(groupIndex: number) {
        return (
            <text style={{ color: this.groupColorByGroupIndex(groupIndex) }}>
                {this.clinicalValuesForGrouping[groupIndex]}
            </text>
        );
    }

    @autobind
    groupColorByGroupIndex(groupIndex: number) {
        return this.wrapperStore.groupingByIsSelected &&
            this.numGroupByGroups > 1
            ? this.clinicalValueToColor[
                  this.clinicalValuesForGrouping[groupIndex]
              ]
            : 'rgb(0,0,0)';
    }

    @computed get numGroupByGroups() {
        return this.wrapperStore.groupingByIsSelected
            ? _.keys(this.sampleGroups).length
            : 0;
    }

    @computed get sampleGroups() {
        let sampleGroups: { [groupIndex: number]: string[] } = {};
        this.store.sampleIds.forEach((sampleId, i) => {
            // check the group value of this sample id
            console.info(
                'Sample id ' +
                    sampleId +
                    ' is in group ' +
                    this.sampleIdToClinicalValue[sampleId]
            );
            if (
                sampleGroups[
                    this.clinicalValuesForGrouping.indexOf(
                        this.sampleIdToClinicalValue[sampleId]
                    )
                ] == undefined
            )
                sampleGroups[
                    this.clinicalValuesForGrouping.indexOf(
                        this.sampleIdToClinicalValue[sampleId]
                    )
                ] = [];
            sampleGroups[
                this.clinicalValuesForGrouping.indexOf(
                    this.sampleIdToClinicalValue[sampleId]
                )
            ].push(sampleId);
        });
        return sampleGroups;
    }

    @computed get clinicalValuesForGrouping() {
        let clinicalValuesForGrouping: string[] = [];
        const map = clinicalValueToSamplesMap(
            this.props.sampleManager.samples,
            this.wrapperStore.groupByOption!
        );
        map.forEach((sampleList: string[], clinicalValue: any) => {
            clinicalValuesForGrouping.push(clinicalValue);
        });
        return clinicalValuesForGrouping;
    }

    @computed get vafChartHeight() {
        let footerHeight: number = 20;
        return _.sum([this.wrapperStore.dataHeight, footerHeight]);
    }

    render() {
        if (!this.store || !this.wrapperStore) return null;

        const mouseOverMutation = this.props.dataStore.mouseOverMutation;
        const selectedMutations = this.props.dataStore.selectedMutations;

        const vafPlotTrack = {
            renderHeader: (store: TimelineStore) => (
                <VAFChartHeader
                    ticks={this.ticks}
                    legendHeight={this.vafChartHeight}
                />
            ),
            renderTrack: (store: TimelineStore) => (
                <VAFChart
                    mouseOverMutation={mouseOverMutation}
                    onMutationMouseOver={m =>
                        this.props.dataStore.setMouseOverMutation(m)
                    }
                    selectedMutations={selectedMutations}
                    onMutationClick={m =>
                        this.props.dataStore.toggleSelectedMutation(m)
                    }
                    onlyShowSelectedInVAFChart={
                        this.wrapperStore.onlyShowSelectedInVAFChart
                    }
                    lineData={this.scaledAndColoredLineData}
                    height={this.vafChartHeight}
                    width={this.store.pixelWidth}
                />
            ),
            disableHover: true,
            height: (store: TimelineStore) => this.vafChartHeight,
            labelForExport: 'VAF',
        } as CustomTrackSpecification;

        let customTracks = [vafPlotTrack].concat(this.sampleIconsTracks);

        return (
            <>
                <div style={{ marginTop: 20 }} data-test={'VAFChartWrapper'}>
                    <VAFChartControls
                        wrapperStore={this.wrapperStore}
                        sampleManager={this.props.sampleManager}
                    />
                    <Timeline
                        key={headerWidth}
                        store={stores[0]}
                        width={width}
                        onClickDownload={() => downloadZippedTracks(data)}
                        store={this.store}
                        width={this.props.width}
                        onClickDownload={() =>
                            downloadZippedTracks(this.props.data)
                        }
                        hideLabels={false}
                        hideXAxis={this.wrapperStore.showSequentialMode}
                        visibleTracks={[]}
                        customTracks={customTracks}
                        headerWidth={
                            wrapperStore.groupByTracks.length
                                ? 150
                                : headerWidth
                        }
                    />
                </div>
            </>
        );
    }
}
