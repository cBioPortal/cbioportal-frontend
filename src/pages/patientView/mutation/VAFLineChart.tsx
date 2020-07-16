import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLine,
    VictoryScatter,
} from 'victory';
import CBIOPORTAL_VICTORY_THEME from '../../../shared/theme/cBioPoralTheme';
import { action, computed, observable } from 'mobx';
import { Sample } from 'cbioportal-ts-api-client';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import WindowStore from '../../../shared/components/window/WindowStore';
import TruncatedTextWithTooltipSVG from '../../../shared/components/TruncatedTextWithTooltipSVG';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import survivalStyles from '../../resultsView/survival/styles.module.scss';
import styles from './styles.module.scss';
import autobind from 'autobind-decorator';
import { Portal } from 'react-portal';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';
import SampleLabelSVG from '../../../shared/components/sampleLabel/SampleLabel';
import SampleManager from '../SampleManager';
import PatientViewMutationsDataStore from './PatientViewMutationsDataStore';
import $ from 'jquery';
import ComplexKeyMap from '../../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import invertIncreasingFunction, {
    invertDecreasingFunction,
} from '../../../shared/lib/invertIncreasingFunction';
import { mutationTooltip } from './PatientViewMutationsTabUtils';
import { tickFormatNumeral } from '../../../shared/components/plots/TickUtils';
import { computeRenderData, IPoint } from './VAFLineChartUtils';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { makeUniqueColorGetter } from '../../../shared/components/plots/PlotUtils';

export interface IVAFLineChartProps {
    samples: Sample[];
    coverageInformation: CoverageInformation;
    mutationProfileId: string;
    sampleManager: SampleManager | null;
    dataStore: PatientViewMutationsDataStore;
    svgRef: (elt: SVGElement | null) => void;
    logScale: boolean;
    zeroToOneAxis: boolean;
    vafTimeline: boolean;
    store: PatientViewPageStore;
}

export const SHOW_ONLY_SELECTED_LABEL = 'Show only selected mutations';

const LINE_COLOR = '#000000';
const HIGHLIGHT_LINE_STROKE_WIDTH = 6;
const HIGHLIGHT_COLOR = '#318ec4';
const DRAG_COVER_CLASSNAME = 'draggingCover';
const MIN_LOG_ARG = 0.001;
const SCATTER_DATA_POINT_SIZE = 3;

const THEME: any = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
THEME.axis.style.grid.strokeOpacity = 1;

class ScaleCapturer extends React.Component<any, any> {
    render() {
        this.props.scaleCallback(this.props.scale);

        return <g />;
    }
}

class Tick extends React.Component<any, any> {
    render() {
        let { sampleIdOrder, sampleManager, text: index, ...rest } = this.props;
        const sampleId = sampleIdOrder[index];
        return (
            <g transform={`rotate(50, ${rest.x}, ${rest.y})`}>
                <SampleLabelSVG
                    label={index + 1}
                    color={
                        sampleManager
                            ? sampleManager.getColorForSample(sampleId)
                            : 'black'
                    }
                    x={rest.x + 10}
                    y={rest.y - 5}
                    r={6}
                    textDy={-1}
                />
                <TruncatedTextWithTooltipSVG
                    text={sampleId}
                    {...rest}
                    verticalAnchor="start"
                    textAnchor="start"
                    maxWidth={50}
                    dx={20}
                />
            </g>
        );
    }
}

class SamplePoint extends React.Component<any, any> {
    render() {
        let { sampleIdOrder, sampleManager, index, ...rest } = this.props;
        const sampleId = sampleIdOrder[index];
        return (
            <g>
                <SampleLabelSVG
                    label={index + 1}
                    color={
                        sampleManager
                            ? sampleManager.getColorForSample(sampleId)
                            : 'black'
                    }
                    x={rest.x}
                    y={rest.y}
                    r={6}
                    textDy={-1}
                />
                <TruncatedTextWithTooltipSVG
                    {...rest}
                    verticalAnchor="start"
                    textAnchor="start"
                    maxWidth={50}
                    dx={10}
                    dy={5}
                />
            </g>
        );
    }
}

type VictoryScale = { x: (_x: number) => number; y: (_y: number) => number };

@observer
export default class VAFLineChart extends React.Component<
    IVAFLineChartProps,
    {}
> {
    @observable.ref private tooltipDatum: any | null = null;
    @observable private tooltipOnPoint = false;

    private mouseEvents = this.makeMouseEvents();
    @observable.ref mouseEvent: React.MouseEvent<any> | null = null;
    @observable.ref private scale: VictoryScale | null = null;

    @observable dragRect = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
    };
    @observable dragging = false;

    @autobind
    private scaleCallback(scale: VictoryScale) {
        this.scale = scale;
    }

    private makeMouseEvents() {
        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: 'data',
                                mutation: action((props: any) => {
                                    let datum;
                                    if (props.datum) {
                                        // mouse over point
                                        datum = props.datum;
                                        this.tooltipOnPoint = true;
                                    } else if (props.data.length > 0) {
                                        // mouse over line
                                        datum = props.data[0];
                                        this.tooltipOnPoint = false;
                                    }
                                    this.tooltipDatum = datum;
                                    this.props.dataStore.setMouseOverMutation(
                                        this.tooltipDatum.mutation
                                    );
                                    return null;
                                }),
                            },
                        ];
                    },
                    onMouseOut: () => {
                        return [
                            {
                                target: 'data',
                                mutation: action(() => {
                                    this.tooltipDatum = null;
                                    this.tooltipOnPoint = false;
                                    this.props.dataStore.setMouseOverMutation(
                                        null
                                    );
                                    return null;
                                }),
                            },
                        ];
                    },
                    onClick: () => {
                        return [
                            {
                                target: 'data',
                                mutation: action((props: any) => {
                                    let datum;
                                    if (props.datum) {
                                        // click on point
                                        datum = props.datum;
                                    } else if (props.data.length > 0) {
                                        // click on line
                                        datum = props.data[0];
                                    }
                                    this.props.dataStore.toggleSelectedMutation(
                                        datum.mutation
                                    );
                                }),
                            },
                        ];
                    },
                },
            },
        ];
    }

    @computed get mutations() {
        if (this.props.dataStore.onlyShowSelectedInVAFChart) {
            return this.props.dataStore.allData.filter(m =>
                this.props.dataStore.isMutationSelected(m[0])
            );
        } else {
            return this.props.dataStore.allData;
        }
    }

    @action
    private selectPointsInDragRect() {
        if (this.scale) {
            const points = this.renderData.grayPoints.concat(
                _.flatten(this.renderData.lineData)
            );

            const rectBoundsSvgSpace = {
                x: [
                    Math.min(this.dragRect.startX, this.dragRect.currentX),
                    Math.max(this.dragRect.startX, this.dragRect.currentX),
                ],
                // y inverted because svg y goes top to bottom
                y: [
                    Math.max(this.dragRect.startY, this.dragRect.currentY),
                    Math.min(this.dragRect.startY, this.dragRect.currentY),
                ],
            };

            const rectBoundsDataSpace = {
                x: rectBoundsSvgSpace.x.map(v =>
                    invertIncreasingFunction(this.scale!.x, v)
                ),
                y: rectBoundsSvgSpace.y.map(v =>
                    invertDecreasingFunction(this.scale!.y, v)
                ), // y is decreasing function because svg y goes top to bottom
            };

            const selectedPoints = points.filter(p => {
                return (
                    p.x >= rectBoundsDataSpace.x[0] &&
                    p.x <= rectBoundsDataSpace.x[1] &&
                    p.y >= rectBoundsDataSpace.y[0] &&
                    p.y <= rectBoundsDataSpace.y[1]
                );
            });

            this.props.dataStore.setSelectedMutations(
                selectedPoints.map(p => p.mutation)
            );
        }
    }

    @autobind
    @action
    private onMouseMove(e: React.MouseEvent<any>) {
        e.persist();
        this.mouseEvent = e;

        if (
            this.dragging &&
            (e.target as SVGElement).classList.contains(DRAG_COVER_CLASSNAME)
        ) {
            // only update drag coordinates based on SVG events
            const offset = $(e.target).offset()!;
            this.dragRect.currentX = e.pageX - offset.left;
            this.dragRect.currentY = e.pageY - offset.top;
        }
    }

    @autobind
    @action
    private onMouseDown(e: React.MouseEvent<any>) {
        if ((e.target as SVGElement).nodeName.toLowerCase() === 'svg') {
            // start drag if clicking on background
            this.dragging = true;

            const offset = $(e.target).offset()!;
            this.dragRect.startX = e.pageX - offset.left;
            this.dragRect.startY = e.pageY - offset.top;
            this.dragRect.currentX = this.dragRect.startX;
            this.dragRect.currentY = this.dragRect.startY;
        }
    }

    @autobind
    @action
    private onMouseUp(e: React.MouseEvent<any>) {
        // finish drag
        if (this.dragging) {
            this.dragging = false;

            this.selectPointsInDragRect();
        }
    }

    @computed get chartWidth() {
        return Math.min(
            this.props.samples.length * 100 + 100,
            WindowStore.size.width - 100
        );
    }

    @computed get chartHeight() {
        return 300;
    }

    @computed get svgWidth() {
        return this.chartWidth + 35; // give room for labels
    }

    @computed get svgHeight() {
        let chartHeightIncrease = 0;
        if (this.props.vafTimeline === true) {
            const yPos = Math.abs(Math.min(...this.sampleTimelineYPosition));
            if (yPos > 0.5) chartHeightIncrease = yPos * 50;
        }

        return this.chartHeight + chartHeightIncrease + 35; // give room for labels
    }

    @computed get sampleIdOrder() {
        let order: string[];
        if (this.props.sampleManager) {
            order = this.props.sampleManager.getSampleIdsInOrder();
        } else {
            order = this.props.samples.map(s => s.sampleId);
        }
        return order;
    }

    @computed get sampleIdIndex() {
        return stringListToIndexSet(this.sampleIdOrder);
    }

    @computed get sampleTimelineXPosition() {
        const events = this.props.store.clinicalEvents.result;
        let xpositions: number[] = [];

        events.forEach((event, i) => {
            event.attributes.forEach((attribute, i) => {
                if (attribute.key === 'SAMPLE_ID') {
                    // calculate x on the timeline axis for each sample
                    const xposition =
                        event.startNumberOfDaysSinceDiagnosis / 365 + 1;
                    const sampleIndex = this.sampleIdOrder.findIndex(
                        element => element === attribute.value
                    );
                    xpositions[sampleIndex] = xposition;
                }
            });
        });
        return xpositions;
    }

    @computed get sampleTimelineYPosition() {
        let sampleUniqueX = new Map();
        let ypositions: number[] = [];
        let startYPosition = -0.23;

        if (
            !(
                this.props.store.groupById === undefined ||
                this.props.store.groupById === 'None'
            )
        ) {
            let clinicalAttributeSamplesMap = this.props.sampleManager.getClinicalAttributeSampleList(
                this.props.sampleManager.samples,
                this.props.store.groupById
            );
            clinicalAttributeSamplesMap.forEach(
                (sampleList: string[], clinicalValue) => {
                    sampleList.forEach((sampleId, i) => {
                        const sampleIndex = this.sampleIdOrder.findIndex(
                            element => element === sampleId
                        );
                        let yposition = startYPosition;
                        let xposition = this.sampleTimelineXPosition[
                            sampleIndex
                        ];
                        if (sampleUniqueX.get(xposition) > 0) {
                            yposition =
                                startYPosition -
                                0.08 * sampleUniqueX.get(xposition);
                            sampleUniqueX.set(
                                xposition,
                                sampleUniqueX.get(xposition) + 1
                            );
                        } else sampleUniqueX.set(xposition, 1);
                        ypositions[sampleIndex] = yposition;
                    });
                    startYPosition =
                        startYPosition -
                        0.08 * (Math.max(...sampleUniqueX.values()) + 1);
                }
            );
        } else {
            this.sampleTimelineXPosition.forEach((xPosition, sampleIndex) => {
                let yposition = startYPosition;
                if (sampleUniqueX.get(xPosition) > 0) {
                    yposition =
                        startYPosition - 0.08 * sampleUniqueX.get(xPosition);
                    sampleUniqueX.set(
                        xPosition,
                        sampleUniqueX.get(xPosition) + 1
                    );
                } else sampleUniqueX.set(xPosition, 1);

                ypositions[sampleIndex] = yposition;
            });
        }
        return ypositions;
    }

    @computed get sampleXYData() {
        let data: Array<object> = [];

        this.sampleIdOrder.forEach((sampleId, sampleIndex) => {
            let dataObj = {};
            if (this.props.vafTimeline === true) {
                dataObj = {
                    x: this.sampleTimelineXPosition[sampleIndex],
                    y: this.sampleTimelineYPosition[sampleIndex],
                };
            } else if (
                this.props.store.groupById != undefined ||
                this.props.store.groupById != 'None'
            ) {
                dataObj = {
                    x: sampleIndex,
                    y: this.sampleGroupByYPosition[sampleIndex],
                };
            }
            data[sampleIndex] = dataObj;
        });

        return data;
    }

    @computed get sampleGroupByYPosition() {
        let ypositions: number[] = [];
        let startYPosition = -0.23;

        if (
            !(
                this.props.store.groupById === undefined ||
                this.props.store.groupById === 'None'
            )
        ) {
            let clinicalAttributeSamplesMap = this.props.sampleManager.getClinicalAttributeSampleList(
                this.props.sampleManager.samples,
                this.props.store.groupById
            );
            clinicalAttributeSamplesMap.forEach(
                (sampleList: string[], clinicalValue) => {
                    sampleList.forEach((sampleId, i) => {
                        const sampleIndex = this.sampleIdOrder.findIndex(
                            element => element === sampleId
                        );
                        let yposition = startYPosition;
                        ypositions[sampleIndex] = yposition;
                    });
                    startYPosition = startYPosition - 0.16;
                }
            );
        }
        return ypositions;
    }

    @computed get sampleGroupByLabelData() {
        let data: string = '';
        let dataMap = new Map();

        if (
            !(
                this.props.store.groupById === undefined ||
                this.props.store.groupById === 'None'
            )
        ) {
            let clinicalAttributeSamplesMap = this.props.sampleManager.getClinicalAttributeSampleList(
                this.props.sampleManager.samples,
                this.props.store.groupById
            );
            clinicalAttributeSamplesMap.forEach(
                (sampleList: string[], clinicalValue) => {
                    const sampleIndex = this.sampleIdOrder.findIndex(
                        element => element === sampleList[0]
                    );
                    let yposition =
                        this.props.vafTimeline === true
                            ? this.sampleTimelineYPosition[sampleIndex]
                            : this.sampleGroupByYPosition[sampleIndex];
                    dataMap.set(clinicalValue, yposition);
                }
            );
        }
        return dataMap;
    }

    @computed get sampleGroupByValue() {
        let groupByValue: { [s: string]: string } = {};
        if (
            this.props.store.groupById === undefined ||
            this.props.store.groupById === 'None'
        )
            return {};
        this.props.sampleManager.samples.forEach((sample, i) => {
            groupByValue[
                sample.id
            ] = SampleManager.getClinicalAttributeInSample(
                sample,
                this.props.store.groupById
            ).value;
        });

        return groupByValue;
    }

    @computed get sampleGroupByColor() {
        let groupByColors: { [s: string]: string } = {};
        const uniqueColorGetter = makeUniqueColorGetter();
        const clinicalAttributeSamplesMap = this.props.sampleManager.getClinicalAttributeSampleList(
            this.props.sampleManager.samples,
            this.props.store.groupById
        );
        clinicalAttributeSamplesMap.forEach(
            (sampleList: string[], clinicalValue) => {
                groupByColors[clinicalValue] = uniqueColorGetter();
            }
        );
        return groupByColors;
    }

    @computed get renderData() {
        return computeRenderData(
            this.props.samples,
            this.mutations,
            this.sampleIdIndex,
            this.props.mutationProfileId,
            this.props.coverageInformation,
            this.props.vafTimeline,
            this.sampleTimelineXPosition,
            this.props.store.groupById,
            this.sampleGroupByValue
        );
    }

    @computed get mutationToDataPoints() {
        const map = new ComplexKeyMap<IPoint[]>();
        for (const lineData of this.renderData.lineData) {
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

    private tooltipFunction(datum: any) {
        return mutationTooltip(
            datum.mutation,
            this.tooltipOnPoint
                ? {
                      mutationStatus: datum.mutationStatus,
                      sampleId: datum.sampleId,
                      vaf: datum.y,
                  }
                : undefined
        );
    }

    @autobind
    private getTooltipComponent() {
        if (!this.tooltipDatum || !this.mouseEvent) {
            return <span />;
        } else {
            let tooltipPlacement =
                this.mouseEvent.clientY < 250 ? 'bottom' : 'top';
            return (
                <Portal isOpened={true} node={document.body}>
                    <Popover
                        className={classnames(
                            'cbioportal-frontend',
                            'cbioTooltip',
                            survivalStyles.Tooltip,
                            styles.Tooltip
                        )}
                        positionLeft={this.mouseEvent.pageX}
                        positionTop={
                            this.mouseEvent.pageY +
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
                        {this.tooltipFunction(this.tooltipDatum)}
                    </Popover>
                </Portal>
            );
        }
    }

    @autobind
    private getHighlights() {
        // we have to render the highlights separately because victory rerendering is too inefficient for mouse interactions

        const highlightedMutations = [];
        if (!this.props.dataStore.onlyShowSelectedInVAFChart) {
            // dont bold highlighted mutations if we're only showing highlighted mutations
            highlightedMutations.push(
                ...this.props.dataStore.selectedMutations
            );
        }
        const mouseOverMutation = this.props.dataStore.getMouseOverMutation();
        if (mouseOverMutation) {
            highlightedMutations.push(mouseOverMutation);
        }
        if (highlightedMutations.length > 0 && this.scale !== null) {
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
                    let d = `M ${this.scale!.x(points[0].x)} ${this.scale!.y(
                        this.y(points[0])
                    )}`;
                    for (let i = 1; i < points.length; i++) {
                        d = `${d} L ${this.scale!.x(
                            points[i].x
                        )} ${this.scale!.y(this.y(points[i]))}`;
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
                        d={`M ${this.scale!.x(point.x)} ${this.scale!.y(
                            this.y(point)
                        )}
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

    @autobind
    private getDragRect() {
        if (this.dragging) {
            const x = Math.min(this.dragRect.startX, this.dragRect.currentX);
            const y = Math.min(this.dragRect.startY, this.dragRect.currentY);
            const width = Math.abs(
                this.dragRect.startX - this.dragRect.currentX
            );
            const height = Math.abs(
                this.dragRect.startY - this.dragRect.currentY
            );

            return [
                <rect
                    fill="black"
                    fillOpacity="0"
                    x={0}
                    y={0}
                    width={this.svgWidth}
                    height={this.svgHeight}
                    className={DRAG_COVER_CLASSNAME}
                />, // cover svg so text doesnt get selected during drag
                <rect
                    style={{ pointerEvents: 'none' }}
                    fill="red"
                    fillOpacity="0.5"
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                />,
            ];
        } else {
            return <g />;
        }
    }

    @autobind
    private y(d: IPoint) {
        if (this.props.logScale) {
            return Math.log10(Math.max(MIN_LOG_ARG, d.y));
        } else {
            return d.y;
        }
    }

    @computed get yDomain() {
        let domain;

        // determine true domain
        if (this.props.zeroToOneAxis) {
            domain = [0, 1];
        } else {
            let min = Number.POSITIVE_INFINITY;
            let max = Number.NEGATIVE_INFINITY;
            for (const singleLineData of this.renderData.lineData) {
                for (const d of singleLineData) {
                    min = Math.min(d.y, min);
                    max = Math.max(d.y, max);
                }
            }
            domain = [min, max];
        }

        // log-transform if necessary
        if (this.props.logScale) {
            domain = domain.map(x => Math.log10(Math.max(x, MIN_LOG_ARG)));
        }

        return domain;
    }

    @autobind
    private tickFormatY(t: number, tickIndex: number, tickValues: number[]) {
        if (this.props.logScale) {
            const realValue = tickFormatNumeral(t, tickValues, t =>
                Math.pow(10, t)
            );
            if (tickIndex === 0 && t <= MIN_LOG_ARG && t > 0) {
                // bottom tick - if its greater than 0, show less-than-or-equal sign since data is floored at MIN_LOG_ARG
                return `≤ ${realValue}`;
            } else {
                return realValue;
            }
        } else {
            return tickFormatNumeral(t, tickValues);
        }
    }

    @computed private get timelineTickValues() {
        // get clinical events array
        const events = this.props.store.clinicalEvents.result;
        // get the start date of each event
        const startDays = events.map(
            event => event.startNumberOfDaysSinceDiagnosis
        );
        // find the max start date to calculate the years
        const maxStartDay = Math.max.apply(Math, startDays);
        const endYear = Math.floor(maxStartDay / 365) + 2;
        const yearIndexes = Array.from(Array(endYear).keys());

        return yearIndexes.map((v, i) => v + 'y');
    }

    render() {
        if (this.renderData.lineData.length > 0) {
            return (
                <>
                    <svg
                        data-test="VAFLineChart"
                        ref={this.props.svgRef}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: 'all',
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                        onMouseMove={this.onMouseMove}
                        onMouseDown={this.onMouseDown}
                        onMouseUp={this.onMouseUp}
                    >
                        <VictoryChart
                            theme={THEME}
                            standalone={false}
                            domain={{ y: this.yDomain }}
                            width={this.chartWidth}
                            height={this.chartHeight}
                            domainPadding={20}
                            singleQuadrantDomainPadding={false}
                            style={{
                                parent: {
                                    backgroundColor: 'white',
                                },
                            }}
                        >
                            <VictoryAxis
                                dependentAxis
                                label="Allele Freq"
                                axisLabelComponent={<VictoryLabel dy={-28} />}
                                crossAxis={false}
                                offsetX={50}
                                tickFormat={this.tickFormatY}
                                orientation="left"
                            />
                            <VictoryAxis
                                style={{
                                    grid: {
                                        strokeOpacity: (
                                            t: number,
                                            i: number
                                        ) => {
                                            return i === 0 ? 0 : 1;
                                        },
                                    },
                                }}
                                tickValues={
                                    this.props.vafTimeline === false
                                        ? this.props.samples.map((s, i) => i)
                                        : this.timelineTickValues.map(
                                              (v, i) => v
                                          )
                                }
                                tickLabelComponent={
                                    this.props.vafTimeline === false &&
                                    (this.props.store.groupById === undefined ||
                                        this.props.store.groupById ===
                                            'None') ? (
                                        <Tick
                                            sampleIdOrder={this.sampleIdOrder}
                                            sampleManager={
                                                this.props.sampleManager
                                            }
                                        />
                                    ) : (
                                        <VictoryLabel dy={-24} />
                                    )
                                }
                                crossAxis={false}
                                offsetY={50}
                                orientation="bottom"
                                padding={{ left: 40 }}
                            />
                            {this.props.vafTimeline === false &&
                            (this.props.store.groupById === undefined ||
                                this.props.store.groupById === 'None') ? (
                                <VictoryScatter data={[]} />
                            ) : (
                                <VictoryScatter
                                    data={this.sampleXYData}
                                    dataComponent={
                                        <SamplePoint
                                            sampleIdOrder={this.sampleIdOrder}
                                            sampleManager={
                                                this.props.sampleManager
                                            }
                                        />
                                    }
                                />
                            )}
                            {[...this.sampleGroupByLabelData.keys()].map(
                                clinicalValue => (
                                    <VictoryLabel
                                        text={clinicalValue}
                                        datum={{
                                            x:
                                                this.props.vafTimeline === true
                                                    ? 1
                                                    : 0,
                                            y: this.sampleGroupByLabelData.get(
                                                clinicalValue
                                            ),
                                        }}
                                        style={[
                                            {
                                                fill: this.sampleGroupByColor[
                                                    clinicalValue
                                                ],
                                                fontSize: 12,
                                            },
                                        ]}
                                        textAnchor="right"
                                        dx={-70}
                                    />
                                )
                            )}
                            {this.renderData.lineData.map(dataForSingleLine => {
                                if (dataForSingleLine.length > 1) {
                                    const color = this.sampleGroupByColor[
                                        this.sampleGroupByValue[
                                            dataForSingleLine[0].sampleId
                                        ]
                                    ];
                                    // cant show line with only 1 point - causes error in svg to pdf conversion
                                    return [
                                        <VictoryLine
                                            style={{
                                                data: {
                                                    stroke: color,
                                                    strokeOpacity: 0.5,
                                                    pointerEvents: 'none',
                                                },
                                            }}
                                            data={dataForSingleLine}
                                            y={this.y}
                                        />,
                                        <VictoryLine
                                            style={{
                                                data: {
                                                    strokeOpacity: 0,
                                                    pointerEvents: 'stroke',
                                                    strokeWidth: HIGHLIGHT_LINE_STROKE_WIDTH,
                                                },
                                            }}
                                            data={dataForSingleLine}
                                            events={this.mouseEvents}
                                            y={this.y}
                                        />,
                                    ];
                                } else {
                                    return null;
                                }
                            })}
                            <ScaleCapturer scaleCallback={this.scaleCallback} />
                            {this.renderData.grayPoints.length > 0 && (
                                <VictoryScatter
                                    style={{
                                        data: {
                                            stroke: 'gray',
                                            fill: 'white',
                                            strokeWidth: 2,
                                        },
                                    }}
                                    size={2.5}
                                    data={this.renderData.grayPoints}
                                    events={this.mouseEvents}
                                    y={this.y}
                                />
                            )}
                            {this.renderData.lineData.length > 0 && (
                                <VictoryScatter
                                    style={{
                                        data: {
                                            stroke: LINE_COLOR,
                                            fill: 'white',
                                            strokeWidth: 2,
                                        },
                                    }}
                                    size={SCATTER_DATA_POINT_SIZE}
                                    data={_.flatten(this.renderData.lineData)}
                                    events={this.mouseEvents}
                                    y={this.y}
                                />
                            )}
                        </VictoryChart>
                        <Observer>{this.getHighlights}</Observer>
                        <Observer>{this.getDragRect}</Observer>
                    </svg>
                    <Observer>{this.getTooltipComponent}</Observer>
                </>
            );
        } else {
            return (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: this.svgHeight,
                        width: '100%',
                    }}
                >
                    No VAF data to show. Select mutations below or un-check the
                    "{SHOW_ONLY_SELECTED_LABEL}" filter above.
                </div>
            );
        }
    }
}
