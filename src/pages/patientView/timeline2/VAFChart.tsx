import React from 'react';
import { Observer, observer } from 'mobx-react';
import { action, computed } from 'mobx';
import autobind from 'autobind-decorator';
import { TimelineEvent, TimelineStore } from 'cbioportal-clinical-timeline';
import { Mutation } from 'cbioportal-ts-api-client';
import { IPoint } from './VAFChartUtils';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import _ from 'lodash';
import { Popover } from 'react-bootstrap';
import ComplexKeyMap from '../../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import classnames from 'classnames';
import { Portal } from 'react-portal';
import survivalStyles from '../../resultsView/survival/styles.module.scss';
import styles from '../mutation/styles.module.scss';
import {
    MutationStatus,
    mutationTooltip,
} from '../mutation/PatientViewMutationsTabUtils';
import SampleManager, { clinicalValueToSamplesMap } from '../SampleManager';
import {
    stringListToIndexSet,
    TruncatedText,
} from 'cbioportal-frontend-commons';
import { makeUniqueColorGetter } from '../../../shared/components/plots/PlotUtils';
import { GROUP_BY_NONE } from './VAFChartControls';

import TimelineWrapperStore from './TimelineWrapperStore';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { VAFChartHeader } from 'pages/patientView/timeline2/VAFChartHeader';
import { yValueScaleFunction } from 'pages/patientView/timeline2/VAFChartUtils';
import './styles.scss';

interface IVAFChartProps {
    dataStore: PatientViewMutationsDataStore;
    store: TimelineStore;
    wrapperStore: TimelineWrapperStore;
    scaleYValue: (value: number) => number;
    renderData: {
        lineData: IPoint[][];
        grayPoints: IPoint[];
    };
    groupColor: (s: string) => any;
    xPosition: { [sampleId: string]: number };
    sampleIdToYPosition: { [sampleId: string]: number };
    sampleIcon: (sampleId: string) => JSX.Element;
}

const HIGHLIGHT_LINE_STROKE_WIDTH = 6;
const HIGHLIGHT_COLOR = '#318ec4';
const SCATTER_DATA_POINT_SIZE = 3;

const VAFPoint: React.FunctionComponent<{
    x: number;
    y: number;
    color: string;
    tooltipDatum: {
        sampleId: string;
        vaf: number;
        mutationStatus: MutationStatus;
    } | null;
    mutation: Mutation;
    dataStore: PatientViewMutationsDataStore;
    wrapperStore: TimelineWrapperStore;
}> = function({
    x,
    y,
    color,
    tooltipDatum,
    mutation,
    dataStore,
    wrapperStore,
}) {
    const onMouseOverEvent = (mouseEvent: any) => {
        wrapperStore.setTooltipModel(tooltipDatum, mutation, mouseEvent, true);
        dataStore.setMouseOverMutation(mutation);
    };

    const onMouseOutEvent = (mouseEvent: any) => {
        wrapperStore.setTooltipModel(null, null, mouseEvent, true);
        dataStore.setMouseOverMutation(null);
    };

    const onMouseClickEvent = (mouseEvent: any) => {
        dataStore.toggleSelectedMutation(mutation);
    };

    const onMouseMoveEvent = (mouseEvent: any) => {
        mouseEvent.persist();
        wrapperStore.setTooltipModel(tooltipDatum, mutation, mouseEvent, true);
        dataStore.setMouseOverMutation(mutation);
    };

    return (
        <g>
            <path
                d={`M ${x}, ${y}
                            m -3, 0
                            a 3, 3 0 1,0 6,0
                            a 3, 3 0 1,0 -6,01`}
                role="presentation"
                shape-rendering="auto"
                style={{
                    stroke: `${color}`,
                    fill: 'white',
                    strokeWidth: 2,
                    opacity: 1,
                }}
                onMouseOver={onMouseOverEvent}
                onMouseOut={onMouseOutEvent}
                onClick={onMouseClickEvent}
                onMouseMove={onMouseMoveEvent}
            />
        </g>
    );
};

const VAFPointConnector: React.FunctionComponent<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    tooltipDatum: {
        sampleId: string;
        vaf: number;
        mutationStatus: MutationStatus;
    } | null;
    mutation: Mutation;
    dataStore: PatientViewMutationsDataStore;
    wrapperStore: TimelineWrapperStore;
}> = function({
    x1,
    y1,
    x2,
    y2,
    color,
    tooltipDatum,
    mutation,
    dataStore,
    wrapperStore,
}) {
    const onMouseOverEvent = (mouseEvent: any) => {
        wrapperStore.setTooltipModel(tooltipDatum, mutation, mouseEvent, false);
        dataStore.setMouseOverMutation(mutation);
    };

    const onMouseOutEvent = (mouseEvent: any) => {
        wrapperStore.setTooltipModel(null, null, mouseEvent, false);
        dataStore.setMouseOverMutation(null);
    };

    const onMouseClickEvent = (mouseEvent: any) => {
        dataStore.toggleSelectedMutation(mutation);
    };

    const onMouseMoveEvent = (mouseEvent: any) => {
        mouseEvent.persist();
        wrapperStore.setTooltipModel(tooltipDatum, mutation, mouseEvent, false);
        dataStore.setMouseOverMutation(mutation);
    };

    return (
        <g>
            <path
                d={`M${x1},${y1}L${x2},${y2}`}
                role="presentation"
                shape-rendering="auto"
                style={{
                    fill: `white`,
                    stroke: `${color}`,
                    strokeOpacity: 0.5,
                    opacity: 1,
                    strokeWidth: 2,
                }}
                onMouseOver={onMouseOverEvent}
                onMouseOut={onMouseOutEvent}
                onClick={onMouseClickEvent}
                onMouseMove={onMouseMoveEvent}
            ></path>
        </g>
    );
};

@observer
export default class VAFChart extends React.Component<IVAFChartProps, {}> {
    @computed get headerHeight() {
        return 20;
    }

    @action
    recalculateTotalHeight() {
        let footerHeight: number = 0;
        let yPosition = this.props.sampleIdToYPosition;
        for (let index in yPosition) {
            if (yPosition[index] > footerHeight)
                footerHeight = yPosition[index];
        }
        footerHeight = footerHeight + 20;

        this.props.wrapperStore.setVafChartHeight(
            _.sum([this.props.wrapperStore.dataHeight, footerHeight])
        );

        return _.sum([this.props.wrapperStore.dataHeight, footerHeight]);
    }

    @computed get lineData() {
        let scaledData: IPoint[][] = [];
        this.props.renderData.lineData.map(
            (dataPoints: IPoint[], index: number) => {
                scaledData[index] = [];
                dataPoints.map((dataPoint: IPoint, i: number) => {
                    scaledData[index].push({
                        x: this.props.xPosition[dataPoint.sampleId],
                        y: this.yPosition[dataPoint.y],
                        sampleId: dataPoint.sampleId,
                        mutation: dataPoint.mutation,
                        mutationStatus: dataPoint.mutationStatus,
                    });
                });
            }
        );
        return scaledData;
    }

    @computed get mutationToDataPoints() {
        const map = new ComplexKeyMap<IPoint[]>();
        for (const lineData of this.lineData) {
            map.set(
                {
                    hugoGeneSymbol: lineData[0].mutation.gene.hugoGeneSymbol,
                    proteinChange: lineData[0].mutation.proteinChange,
                },
                lineData
            );
        }
        return map;
    }

    @computed get yPosition() {
        let scaledY: { [originalY: number]: number } = {};
        this.props.renderData.lineData.forEach(
            (data: IPoint[], index: number) => {
                data.forEach((d: IPoint, i: number) => {
                    scaledY[d.y] = this.props.scaleYValue(d.y);
                });
            }
        );
        return scaledY;
    }

    @autobind
    private getHighlights() {
        const highlightedMutations = [];
        if (!this.props.wrapperStore.onlyShowSelectedInVAFChart) {
            // dont bold highlighted mutations if we're only showing highlighted mutations
            highlightedMutations.push(
                ...this.props.dataStore.selectedMutations
            );
        }
        // Using old functionality to get mouseOverMUtation from PatientsViewMutationDataStore
        // so highlighting a mutation in the VAF chart will highlight it also in the mutation table.
        // Also if multiple VAF charts are present in the page all will share the highlighting.
        // If this is not desired, comment the following line and uncomment the next.
        const mouseOverMutation = this.props.dataStore.getMouseOverMutation();
        /*const mouseOverMutation = this.props.wrapperStore.tooltipModel
            ? this.props.wrapperStore.tooltipModel.mutation
            : null;*/

        if (mouseOverMutation) {
            highlightedMutations.push(mouseOverMutation);
        }
        if (highlightedMutations.length > 0) {
            return highlightedMutations.map(highlightedMutation => {
                const points = this.mutationToDataPoints.get({
                    proteinChange: highlightedMutation.proteinChange,
                    hugoGeneSymbol: highlightedMutation.gene.hugoGeneSymbol,
                });

                if (!points) {
                    return <g />;
                }
                let linePath = null;
                if (points.length > 1) {
                    // more than one point -> we should render a path
                    let d = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 1; i < points.length; i++) {
                        d = `${d} L ${points[i].x} ${points[i].y}`;
                    }
                    linePath = (
                        <path
                            style={{
                                stroke: HIGHLIGHT_COLOR,
                                strokeOpacity: 1,
                                strokeWidth: HIGHLIGHT_LINE_STROKE_WIDTH,
                                fillOpacity: 0,
                                pointerEvents: 'none',
                            }}
                            d={d}
                        />
                    );
                }
                const pointPaths = points.map(point => (
                    <path
                        d={`M ${point.x} ${point.y}
                            m -${SCATTER_DATA_POINT_SIZE}, 0
                            a ${SCATTER_DATA_POINT_SIZE}, ${SCATTER_DATA_POINT_SIZE} 0 1,0 ${2 *
                            SCATTER_DATA_POINT_SIZE},0
                            a ${SCATTER_DATA_POINT_SIZE}, ${SCATTER_DATA_POINT_SIZE} 0 1,0 ${-2 *
                            SCATTER_DATA_POINT_SIZE},0
                            `}
                        style={{
                            stroke: HIGHLIGHT_COLOR,
                            fill: 'white',
                            strokeWidth: 2,
                            opacity: 1,
                            pointerEvents: 'none',
                        }}
                    />
                ));

                return (
                    <g>
                        {linePath}
                        {pointPaths}
                    </g>
                );
            });
        } else {
            return <g />;
        }
    }

    private tooltipFunction(tooltipData: any) {
        return mutationTooltip(
            tooltipData.mutation,
            tooltipData.tooltipOnPoint
                ? {
                      mutationStatus: tooltipData.datum.mutationStatus,
                      sampleId: tooltipData.datum.sampleId,
                      vaf: tooltipData.datum.vaf,
                  }
                : undefined
        );
    }

    @autobind
    private getTooltipComponent() {
        let mutationTooltip = this.props.wrapperStore.tooltipModel;
        if (
            !mutationTooltip ||
            mutationTooltip.mouseEvent == null ||
            mutationTooltip.mutation == null ||
            mutationTooltip.datum == null
        ) {
            return <span />;
        } else {
            let tooltipPlacement =
                mutationTooltip.mouseEvent.clientY < 250 ? 'bottom' : 'top';
            return (
                <Portal isOpened={true} node={document.body}>
                    <Popover
                        className={classnames(
                            'cbioportal-frontend',
                            'cbioTooltip',
                            survivalStyles.Tooltip,
                            styles.Tooltip
                        )}
                        positionLeft={mutationTooltip.mouseEvent.pageX}
                        positionTop={
                            mutationTooltip.mouseEvent.pageY +
                            (tooltipPlacement === 'top' ? -7 : 7)
                        }
                        style={{
                            transform:
                                tooltipPlacement === 'top'
                                    ? 'translate(-50%,-100%)'
                                    : 'translate(-50%,0%)',
                            maxWidth: 400,
                        }}
                        placement={tooltipPlacement}
                    >
                        {this.tooltipFunction(mutationTooltip)}
                    </Popover>
                </Portal>
            );
        }
    }

    render() {
        return (
            <svg
                width={this.props.store.pixelWidth}
                height={this.recalculateTotalHeight()}
            >
                {this.props.renderData.lineData.map(
                    (data: IPoint[], index: number) => {
                        return data.map((d: IPoint, i: number) => {
                            let x1 = this.props.xPosition[d.sampleId],
                                x2;
                            let y1 = this.yPosition[d.y],
                                y2;

                            const nextPoint: IPoint = data[i + 1];
                            if (nextPoint) {
                                x2 = this.props.xPosition[nextPoint.sampleId];
                                y2 = this.yPosition[nextPoint.y];
                            }

                            let tooltipDatum: {
                                mutationStatus: MutationStatus;
                                sampleId: string;
                                vaf: number;
                            } = {
                                mutationStatus: d.mutationStatus,
                                sampleId: d.sampleId,
                                vaf: d.y,
                            };

                            const color = this.props.groupColor(d.sampleId);

                            return (
                                <g>
                                    {x2 && y2 && (
                                        <VAFPointConnector
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            color={color}
                                            tooltipDatum={tooltipDatum}
                                            mutation={d.mutation}
                                            dataStore={this.props.dataStore}
                                            wrapperStore={
                                                this.props.wrapperStore
                                            }
                                        />
                                    )}
                                    <VAFPoint
                                        x={x1}
                                        y={y1}
                                        color={color}
                                        tooltipDatum={tooltipDatum}
                                        mutation={d.mutation}
                                        dataStore={this.props.dataStore}
                                        wrapperStore={this.props.wrapperStore}
                                    />
                                </g>
                            );
                        });
                    }
                )}

                {!this.props.wrapperStore.groupingByIsSelected &&
                    this.sampleIcons()}
                <Observer>{this.getHighlights}</Observer>
                <Observer>{this.getTooltipComponent}</Observer>
            </svg>
        );
    }

    @autobind
    sampleIcons() {
        const svg = (
            <g transform={`translate(0,${this.props.wrapperStore.dataHeight})`}>
                {this.props.store.sampleEvents.map(
                    (event: TimelineEvent, i: number) => {
                        const sampleId = event.event!.attributes.find(
                            (att: any) => att.key === 'SAMPLE_ID'
                        );
                        return this.props.sampleIcon(sampleId.value);
                    }
                )}
            </g>
        );
        return svg;
    }
}
