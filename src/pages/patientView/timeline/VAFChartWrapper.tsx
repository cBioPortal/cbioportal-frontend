import React from 'react';
import { observer } from 'mobx-react';
import {
    ClinicalEvent,
    ClinicalEventData,
    Sample,
} from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import { VAFChartControls } from './VAFChartControls';
import VAFChart, { IColorPoint } from 'pages/patientView/timeline/VAFChart';
import VAFChartWrapperStore from './VAFChartWrapperStore';
import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    Timeline,
    TimelineStore,
} from 'cbioportal-clinical-timeline';
import SampleManager, {
    clinicalValueToSamplesMap,
} from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { computed, makeObservable } from 'mobx';
import {
    ceil10,
    computeRenderData,
    floor10,
    getYAxisTickmarks,
    IPoint,
    numLeadingDecimalZeros,
    yValueScaleFunction,
    minimalDistinctTickStrings,
} from './VAFChartUtils';
import { VAFChartHeader } from './VAFChartHeader';
import {
    EllipsisTextTooltip,
    stringListToIndexSet,
} from 'cbioportal-frontend-commons';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { MultipleSampleMarker } from './SampleMarker';
import { downloadZippedTracks } from 'pages/patientView/timeline/timelineDataUtils';
import { CoverageInformation } from 'shared/lib/GenePanelUtils';
import { buildTimelineEventsSignature } from './pathologyTimelineUtils';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface IVAFChartWrapperProps {
    wrapperStore: VAFChartWrapperStore;
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    clinicalEventsSignature?: string;
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    coverageInformation: CoverageInformation;
    headerWidth?: number;
    timelineShowing?: boolean;
}

export function getSampleIconGroupKey(
    x: number,
    groupedSampleIds: string[]
): string {
    return `${x}:${groupedSampleIds.join('|')}`;
}

type ClinicalGroupingSummary = {
    clinicalValueToColor: { [clinicalValue: string]: string };
    clinicalValuesForGrouping: string[];
    groupIndexByClinicalValue: { [clinicalValue: string]: number };
};

type SampleGroupingSummary = {
    groupKeys: string[];
    numGroupByGroups: number;
    sampleGroups: { [groupIndex: number]: string[] };
};

type SampleEventPositionSummary = {
    samplePosition: { [sampleId: string]: number };
};

type LineDataRangeSummary = {
    maxYValue: number | undefined;
    minYValue: number | undefined;
};

type SampleIconMarkerSummary = {
    colors: string[];
    groupedSampleIds: string[];
    key: string;
    labels: string[];
    x: number;
};

type SampleIconLayoutSummary = {
    allSamples: SampleIconMarkerSummary[];
    byGroupIndex: { [groupIndex: number]: SampleIconMarkerSummary[] };
};

type ScaledLineDataSummary = {
    scaledAndColoredLineData: IColorPoint[][];
    yPosition: { [originalY: number]: number };
};

@observer
export default class VAFChartWrapper extends React.Component<
    IVAFChartWrapperProps,
    {}
> {
    store: TimelineStore;
    wrapperStore: VAFChartWrapperStore;

    constructor(props: IVAFChartWrapperProps) {
        super(props);

        makeObservable(this);

        var isGenieBpcStudy = window.location.href.includes('genie_bpc');

        const baseConfig: any = buildBaseConfig(
            props.sampleManager,
            props.caseMetaData
        );

        if (isGenieBpcStudy) {
            configureGenieTimeline(baseConfig);
        }

        const trackSpecifications = sortTracks(
            baseConfig,
            this.props.data,
            this.props.clinicalEventsSignature ||
                buildTimelineEventsSignature(this.props.data)
        );

        configureTracks(trackSpecifications, baseConfig.trackEventRenderers);

        // we can consider perhaps moving store into Timeline component
        // not sure if/why it needs to be out here
        this.store = new TimelineStore(trackSpecifications);
    }

    /** ticks dependencies **/

    @computed get maxYTickmarkValue() {
        if (
            !this.props.wrapperStore.vafChartYAxisToDataRange ||
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
            !this.props.wrapperStore.vafChartYAxisToDataRange ||
            this.minYValue === undefined
        )
            return 0;
        return floor10(
            this.minYValue,
            -numLeadingDecimalZeros(this.minYValue) - 1
        );
    }

    @computed get ticks(): { label: string; value: number; offset: number }[] {
        let tickmarkValues = getYAxisTickmarks(
            this.minYTickmarkValue,
            this.maxYTickmarkValue
        );
        const labels = minimalDistinctTickStrings(tickmarkValues);
        const ticksHasDuplicates = tickmarkValues.length !== labels.length;
        if (ticksHasDuplicates) {
            tickmarkValues = new Array(labels.length);
            for (let index = 0; index < labels.length; index += 1) {
                tickmarkValues[index] = Number(labels[index]);
            }
        }

        const ticks = new Array(tickmarkValues.length);
        for (let index = 0; index < tickmarkValues.length; index += 1) {
            const value = tickmarkValues[index];
            ticks[index] = {
                label: labels[index],
                value,
                offset: this.scaleYValue(value),
            };
        }

        return ticks;
    }

    @computed get yPosition() {
        return this.scaledLineDataSummary.yPosition;
    }

    // returns function for scaling svg y-axis coordinate system
    @computed get scaleYValue() {
        return yValueScaleFunction(
            this.minYTickmarkValue,
            this.maxYTickmarkValue,
            this.props.wrapperStore.dataHeight,
            this.props.wrapperStore.vafChartLogScale
        );
    }

    @computed get mutations() {
        if (this.props.wrapperStore.onlyShowSelectedInVAFChart) {
            const selectedMutations = [];
            for (const mutation of this.props.dataStore.allData) {
                if (this.props.dataStore.isMutationSelected(mutation[0])) {
                    selectedMutations.push(mutation);
                }
            }
            return selectedMutations;
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
            this.props.wrapperStore.groupByOption!,
            this.sampleIdToClinicalValue
        ).lineData;
    }

    @computed get scaledAndColoredLineData(): IColorPoint[][] {
        return this.scaledLineDataSummary.scaledAndColoredLineData;
    }

    @computed get scaledLineDataSummary(): ScaledLineDataSummary {
        const lineData = this.lineData;
        const scaledAndColoredLineData: IColorPoint[][] = new Array(
            lineData.length
        );
        const yPosition: { [originalY: number]: number } = {};

        for (let index = 0; index < lineData.length; index += 1) {
            const dataPoints = lineData[index];
            const scaledPoints: IColorPoint[] = new Array(dataPoints.length);
            scaledAndColoredLineData[index] = scaledPoints;

            for (let pointIndex = 0; pointIndex < dataPoints.length; pointIndex += 1) {
                const dataPoint = dataPoints[pointIndex];
                const scaledY =
                    yPosition[dataPoint.y] ?? this.scaleYValue(dataPoint.y);
                yPosition[dataPoint.y] = scaledY;
                scaledPoints[pointIndex] = {
                    x: this.xPosition[dataPoint.sampleId],
                    y: scaledY,
                    sampleId: dataPoint.sampleId,
                    mutation: dataPoint.mutation,
                    mutationStatus: dataPoint.mutationStatus,
                    color: this.groupColor(dataPoint.sampleId),
                };
            }
        }

        return {
            scaledAndColoredLineData,
            yPosition,
        };
    }

    @computed get minYValue() {
        return this.lineDataRangeSummary.minYValue;
    }

    @computed get maxYValue() {
        return this.lineDataRangeSummary.maxYValue;
    }

    @computed get lineDataRangeSummary(): LineDataRangeSummary {
        let minYValue: number | undefined = undefined;
        let maxYValue: number | undefined = undefined;

        for (const dataPoints of this.lineData) {
            for (const dataPoint of dataPoints) {
                if (minYValue === undefined || dataPoint.y < minYValue) {
                    minYValue = dataPoint.y;
                }

                if (maxYValue === undefined || dataPoint.y > maxYValue) {
                    maxYValue = dataPoint.y;
                }
            }
        }

        return {
            maxYValue,
            minYValue,
        };
    }

    @computed get sampleIdToClinicalValue() {
        const sampleIdToClinicalValue: { [sampleId: string]: string } = {};
        if (this.props.wrapperStore.groupingByIsSelected) {
            for (
                let index = 0;
                index < this.props.sampleManager.samples.length;
                index += 1
            ) {
                const sample = this.props.sampleManager.samples[index];
                const clinicalData = SampleManager!.getClinicalAttributeInSample(
                    sample,
                    this.props.wrapperStore.groupByOption!
                );
                sampleIdToClinicalValue[sample.id] =
                    clinicalData != undefined
                        ? clinicalData.value
                        : 'undefined-group';
            }
        }
        return sampleIdToClinicalValue;
    }

    @computed get sampleIconsTracks() {
        const tracks: CustomTrackSpecification[] = [];
        if (this.props.wrapperStore.groupingByIsSelected) {
            const { groupKeys } = this.sampleGroupingSummary;
            for (let keyIndex = 0; keyIndex < groupKeys.length; keyIndex += 1) {
                const key = groupKeys[keyIndex];
                const index = parseInt(key);
                tracks.push({
                    uid: `vaf-samples-group-${index}`,
                    renderHeader: () => this.groupByTrackLabel(index),
                    renderTrack: () =>
                        this.renderSampleIcons(
                            this.sampleIconLayoutSummary.byGroupIndex[index] || []
                    ),
                    height: () => 20,
                    labelForExport: this.clinicalValuesForGrouping[index],
                });
            }
        } else {
            tracks.push({
                uid: 'vaf-samples',
                renderHeader: () => '',
                renderTrack: () =>
                    this.renderSampleIcons(
                        this.sampleIconLayoutSummary.allSamples
                    ),
                height: () => 20,
                labelForExport: 'VAF Samples',
            });
        }
        return tracks;
    }

    @computed get xPosition() {
        let sequentialDistance: number = 0;
        let sequentialPadding: number = 20;
        let samplePosition: { [sampleId: string]: number };
        if (this.props.wrapperStore.showSequentialMode) {
            // if in sequential mode, compute x coordinates using samples array,
            //  since we may not have sample event data
            sequentialDistance =
                (this.store.pixelWidth - sequentialPadding * 2) /
                (this.props.samples.length - 1);

            samplePosition = {};
            for (let index = 0; index < this.props.samples.length; index += 1) {
                const sample = this.props.samples[index];
                samplePosition[sample.sampleId] =
                    this.sampleIdOrder[sample.sampleId] * sequentialDistance +
                    sequentialPadding;
            }
        } else {
            samplePosition = this.sampleEventPositionSummary.samplePosition;
        }
        return samplePosition;
    }

    @computed get sampleEventPositionSummary(): SampleEventPositionSummary {
        const samplePosition: { [sampleId: string]: number } = {};

        for (let sampleIndex = 0; sampleIndex < this.store.sampleEvents.length; sampleIndex += 1) {
            const sample = this.store.sampleEvents[sampleIndex];
            let sampleId: string | undefined;
            for (
                let attributeIndex = 0;
                attributeIndex < sample.event.attributes.length;
                attributeIndex += 1
            ) {
                const attribute = sample.event.attributes[attributeIndex];
                if (attribute.key === 'SAMPLE_ID') {
                    sampleId = attribute.value;
                    break;
                }
            }

            if (sampleId) {
                samplePosition[sampleId] = this.store.getPosition(sample)!
                    .pixelLeft;
            }
        }

        return { samplePosition };
    }

    @computed get sampleIdOrder() {
        return stringListToIndexSet(
            this.props.sampleManager.getSampleIdsInOrder()
        );
    }

    @computed get groupColor() {
        return (sampleId: string) => {
            const color = this.clinicalValueToColor[
                this.sampleIdToClinicalValue[sampleId]
            ];
            return this.props.wrapperStore.groupingByIsSelected &&
                this.numGroupByGroups > 1 &&
                color != undefined
                ? color
                : 'rgb(0,0,0)';
        };
    }

    @computed get clinicalValueToColor() {
        return this.clinicalGroupingSummary.clinicalValueToColor;
    }

    renderSampleIcons(sampleIcons: SampleIconMarkerSummary[]) {
        const iconGroups = new Array<JSX.Element>(sampleIcons.length);
        for (let index = 0; index < sampleIcons.length; index += 1) {
            const { colors, key, labels, x } = sampleIcons[index];
            iconGroups[index] = (
                <g key={key} transform={`translate(${x})`}>
                    <MultipleSampleMarker colors={colors} labels={labels} y={10} />
                </g>
            );
        }
        return (
            <g>
                {iconGroups}
            </g>
        );
    }

    groupByTrackLabel(groupIndex: number) {
        return (
            <EllipsisTextTooltip
                text={this.clinicalValuesForGrouping[groupIndex]}
                style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    color: this.groupColorByGroupIndex(groupIndex),
                }}
            />
        );
    }

    groupColorByGroupIndex(groupIndex: number) {
        const groupColor = this.clinicalValueToColor[
            this.clinicalValuesForGrouping[groupIndex]
        ];
        return this.props.wrapperStore.groupingByIsSelected &&
            this.numGroupByGroups > 1 &&
            groupColor != undefined
            ? groupColor
            : 'rgb(0,0,0)';
    }

    @computed get numGroupByGroups() {
        return this.sampleGroupingSummary.numGroupByGroups;
    }

    @computed get sampleIds() {
        const sampleIds = new Array<string>(this.props.samples.length);
        for (let index = 0; index < this.props.samples.length; index += 1) {
            sampleIds[index] = this.props.samples[index].sampleId;
        }
        return sampleIds;
    }

    @computed get sampleGroups() {
        return this.sampleGroupingSummary.sampleGroups;
    }

    @computed get sampleGroupingSummary(): SampleGroupingSummary {
        const sampleGroups: { [groupIndex: number]: string[] } = {};
        const groupKeys: string[] = [];
        for (let index = 0; index < this.sampleIds.length; index += 1) {
            const sampleId = this.sampleIds[index];
            const groupIndex =
                this.groupIndexByClinicalValue[
                    this.sampleIdToClinicalValue[sampleId]
                ];
            // check the group value of this sample id
            if (sampleGroups[groupIndex] == undefined) {
                sampleGroups[groupIndex] = [];
                groupKeys.push(String(groupIndex));
            }
            sampleGroups[groupIndex].push(sampleId);
        }
        return {
            groupKeys,
            numGroupByGroups: this.props.wrapperStore.groupingByIsSelected
                ? groupKeys.length
                : 0,
            sampleGroups,
        };
    }

    @computed get clinicalValuesForGrouping() {
        return this.clinicalGroupingSummary.clinicalValuesForGrouping;
    }

    @computed get groupIndexByClinicalValue() {
        return this.clinicalGroupingSummary.groupIndexByClinicalValue;
    }

    @computed get clinicalGroupingSummary(): ClinicalGroupingSummary {
        const clinicalValuesForGrouping: string[] = [];
        const groupIndexByClinicalValue: { [clinicalValue: string]: number } = {};
        const clinicalValueToColor: { [clinicalValue: string]: string } = {};
        const uniqueColorGetter = makeUniqueColorGetter();
        const map = clinicalValueToSamplesMap(
            this.props.sampleManager.samples,
            this.props.wrapperStore.groupByOption!
        );
        for (const clinicalValue of map.keys()) {
            groupIndexByClinicalValue[clinicalValue] =
                clinicalValuesForGrouping.length;
            clinicalValuesForGrouping.push(clinicalValue);
            clinicalValueToColor[clinicalValue] = uniqueColorGetter();
        }
        return {
            clinicalValueToColor,
            clinicalValuesForGrouping,
            groupIndexByClinicalValue,
        };
    }

    @computed get sampleIconLayoutSummary(): SampleIconLayoutSummary {
        const byGroupIndex: { [groupIndex: number]: SampleIconMarkerSummary[] } =
            {};
        if (this.props.wrapperStore.groupingByIsSelected) {
            const { groupKeys, sampleGroups } = this.sampleGroupingSummary;
            for (let keyIndex = 0; keyIndex < groupKeys.length; keyIndex += 1) {
                const key = groupKeys[keyIndex];
                byGroupIndex[Number(key)] =
                    this.buildSampleIconMarkerSummaries(
                        sampleGroups[Number(key)]
                    );
            }
        }

        return {
            allSamples: this.buildSampleIconMarkerSummaries(this.sampleIds),
            byGroupIndex,
        };
    }

    private buildSampleIconMarkerSummaries(
        sampleIds: string[]
    ): SampleIconMarkerSummary[] {
        const groupedSampleIdsByXCoordinate: {
            [xCoordinate: string]: string[];
        } = {};
        const orderedXCoordinates: string[] = [];

        for (let index = 0; index < sampleIds.length; index += 1) {
            const sampleId = sampleIds[index];
            const xCoordinate = String(this.xPosition[sampleId]);
            if (!groupedSampleIdsByXCoordinate[xCoordinate]) {
                groupedSampleIdsByXCoordinate[xCoordinate] = [];
                orderedXCoordinates.push(xCoordinate);
            }
            groupedSampleIdsByXCoordinate[xCoordinate].push(sampleId);
        }

        const markers = new Array<SampleIconMarkerSummary>(orderedXCoordinates.length);
        for (let coordinateIndex = 0; coordinateIndex < orderedXCoordinates.length; coordinateIndex += 1) {
            const xCoordinate = orderedXCoordinates[coordinateIndex];
            const groupedSampleIds = groupedSampleIdsByXCoordinate[xCoordinate];
            const x = Number(xCoordinate);
            const colors: string[] = [];
            const labels: string[] = [];

            for (let sampleIndex = 0; sampleIndex < groupedSampleIds.length; sampleIndex += 1) {
                const sampleId = groupedSampleIds[sampleIndex];
                colors.push(this.props.caseMetaData.color[sampleId] || '#333333');
                labels.push(this.props.caseMetaData.label[sampleId] || '-');
            }

            markers[coordinateIndex] = {
                colors,
                groupedSampleIds,
                key: getSampleIconGroupKey(x, groupedSampleIds),
                labels,
                x,
            };
        }
        return markers;
    }

    @computed get vafChartHeight() {
        const footerHeight = 20;
        return this.props.wrapperStore.dataHeight + footerHeight;
    }

    @computed get customTracks() {
        const mouseOverMutation = this.props.dataStore.mouseOverMutation;
        const selectedMutations = this.props.dataStore.selectedMutations;
        const lineData = this.scaledAndColoredLineData;
        const height = this.vafChartHeight;
        const headerWidth =
            this.numGroupByGroups > 0 ? 150 : this.props.headerWidth;

        const vafPlotTrack = {
            uid: 'vaf-plot',
            renderHeader: (store: TimelineStore) => (
                <div className={'positionAbsolute'} style={{ right: -6 }}>
                    <VAFChartHeader
                        ticks={this.ticks}
                        legendHeight={this.vafChartHeight}
                    />
                </div>
            ),
            renderTrack: (store: TimelineStore) => {
                return (
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
                            this.props.wrapperStore.onlyShowSelectedInVAFChart
                        }
                        lineData={lineData}
                        height={height}
                        width={this.store.viewPortWidth}
                    />
                );
            },
            disableHover: true,
            height: (store: TimelineStore) => height,
            labelForExport: 'VAF',
        } as CustomTrackSpecification;

        return [vafPlotTrack].concat(this.sampleIconsTracks);
    }

    render() {
        if (!this.store || !this.props.wrapperStore) return null;

        return (
            <>
                <div style={{ marginTop: 20 }} data-test={'VAFChartWrapper'}>
                    <VAFChartControls
                        wrapperStore={this.props.wrapperStore}
                        sampleManager={this.props.sampleManager}
                    />
                    <Timeline
                        store={this.store}
                        onClickDownload={() =>
                            downloadZippedTracks(this.props.data)
                        }
                        width={this.props.width}
                        hideLabels={false}
                        hideXAxis={this.props.wrapperStore.showSequentialMode}
                        visibleTracks={[]}
                        disableZoom={true}
                        customTracks={this.customTracks}
                        headerWidth={
                            this.numGroupByGroups > 0
                                ? 150
                                : this.props.headerWidth
                        }
                    />
                </div>
            </>
        );
    }
}
