import React from 'react';
import { Observer, observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { Mutation } from 'cbioportal-ts-api-client';
import { IPoint } from './VAFChartUtils';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import { Portal } from 'react-portal';
import survivalStyles from '../../resultsView/survival/styles.module.scss';
import styles from '../mutation/styles.module.scss';
import {
    MutationStatus,
    mutationTooltip,
} from '../mutation/PatientViewMutationsTabUtils';

export interface IColorPoint extends IPoint {
    color: string;
}

interface ILine {
    points: IColorPoint[];
}

type RenderPointSummary = {
    point: IColorPoint;
    tooltipDatum: TooltipDatum;
};

type VafChartRenderSummary = {
    mutationToLines: { [mutationKey: string]: ILine[] };
    renderLines: RenderPointSummary[][];
};

type HighlightSummary = {
    highlightedMutations: Mutation[];
};

export type TooltipDatum = {
    mutationStatus: MutationStatus | null;
    sampleId: string;
    vafReport: VAFReport | null;
};

type TooltipModel = {
    datum: TooltipDatum | null;
    mutation: Mutation | null;
    mouseEvent: React.MouseEvent<any> | null;
    tooltipOnPoint: boolean;
};
import VAFChartWrapperStore from './VAFChartWrapperStore';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { VAFChartHeader } from 'pages/patientView/timeline/VAFChartHeader';
import { yValueScaleFunction } from 'pages/patientView/timeline/VAFChartUtils';
import './styles.scss';
import { getVariantAlleleFrequency, VAFReport } from 'shared/lib/MutationUtils';

interface IVAFChartProps {
    mouseOverMutation: Readonly<Mutation> | null;
    onMutationMouseOver: (mutation: Mutation | null) => void;
    selectedMutations: Readonly<Mutation[]>;
    onMutationClick: (mutation: Mutation) => void;

    onlyShowSelectedInVAFChart: boolean | undefined;

    lineData: IColorPoint[][];

    height: number;
    width: number;
}

const HIGHLIGHT_LINE_STROKE_WIDTH = 6;
const HIGHLIGHT_COLOR = '#318ec4';
const SCATTER_DATA_POINT_SIZE = 3;

const VAFPoint: React.FunctionComponent<{
    x: number;
    y: number;
    color: string;
    datum: TooltipDatum | null;
    mutation: Mutation;
    onMutationClick: (mutation: Mutation) => void;
    setTooltipModel(tooltipModel: TooltipModel): void;
}> = function({
    x,
    y,
    color,
    datum,
    mutation,
    onMutationClick,
    setTooltipModel,
}) {
    const onMouseOverEvent = (mouseEvent: any) => {
        setTooltipModel({ datum, mutation, mouseEvent, tooltipOnPoint: true });
    };

    const onMouseOutEvent = (mouseEvent: any) => {
        setTooltipModel({
            datum: null,
            mutation: null,
            mouseEvent,
            tooltipOnPoint: true,
        });
    };

    const onMouseClickEvent = (mouseEvent: any) => {
        onMutationClick(mutation);
    };

    const onMouseMoveEvent = (mouseEvent: any) => {
        mouseEvent.persist();
        setTooltipModel({ datum, mutation, mouseEvent, tooltipOnPoint: true });
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
    datum: TooltipDatum | null;
    mutation: Mutation;
    onMutationClick: (mutation: Mutation) => void;
    setTooltipModel(tooltipModel: TooltipModel): void;
}> = function({
    x1,
    y1,
    x2,
    y2,
    color,
    datum,
    mutation,
    onMutationClick,
    setTooltipModel,
}) {
    const onMouseOverEvent = (mouseEvent: any) => {
        setTooltipModel({ datum, mutation, mouseEvent, tooltipOnPoint: true });
    };

    const onMouseOutEvent = (mouseEvent: any) => {
        setTooltipModel({
            datum: null,
            mutation: null,
            mouseEvent,
            tooltipOnPoint: false,
        });
    };

    const onMouseClickEvent = (mouseEvent: any) => {
        onMutationClick(mutation);
    };

    const onMouseMoveEvent = (mouseEvent: any) => {
        mouseEvent.persist();
        setTooltipModel({ datum, mutation, mouseEvent, tooltipOnPoint: true });
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

const LineHighlightSvg: React.FunctionComponent<{
    highlightedMutations: Mutation[];
    mutationLines: { [mutationKey: string]: ILine[] };
}> = function({ highlightedMutations, mutationLines }) {
    const highlightedElements: JSX.Element[] = [];

    for (let mutationIndex = 0; mutationIndex < highlightedMutations.length; mutationIndex++) {
        const highlightedMutation = highlightedMutations[mutationIndex];
        // getting the chart lines of a mutation (can be multiple lines when GroupBy is selected)
        const lines: ILine[] =
            mutationLines[
                highlightedMutation.proteinChange +
                    '_' +
                    highlightedMutation.gene.hugoGeneSymbol
            ];

        if (!lines) {
            highlightedElements.push(<g key={`highlight-empty-${mutationIndex}`} />);
            continue;
        }

        const linePath: JSX.Element[] = [];
        const pointPaths: JSX.Element[] = [];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            if (line.points.length > 1) {
                // more than one point -> we should render a path
                let d = `M ${line.points[0].x} ${line.points[0].y}`;
                for (let i = 1; i < line.points.length; i++) {
                    d = `${d} L ${line.points[i].x} ${line.points[i].y}`;
                }
                linePath.push(
                    <path
                        key={`highlight-line-${mutationIndex}-${lineIndex}`}
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

            for (let pointIndex = 0; pointIndex < line.points.length; pointIndex++) {
                const point = line.points[pointIndex];
                pointPaths.push(
                    <path
                        key={`highlight-point-${mutationIndex}-${lineIndex}-${pointIndex}`}
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
                );
            }
        }

        highlightedElements.push(
            <g key={`highlight-group-${mutationIndex}`}>
                {linePath}
                {pointPaths}
            </g>
        );
    }

    return (
        <>
            {highlightedElements}
        </>
    );
};

@observer
export default class VAFChart extends React.Component<IVAFChartProps, {}> {
    @observable.ref private tooltipModel: TooltipModel;

    constructor(props: IVAFChartProps) {
        super(props);
        makeObservable(this);
    }

    getMutationKey(mutation: Mutation) {
        return mutation.proteinChange + '_' + mutation.gene.hugoGeneSymbol;
    }

    @computed get highlightSummary(): HighlightSummary {
        const highlightedMutations: Mutation[] = [];
        const seen = new Set<string>();

        const addMutation = (mutation: Mutation | null | undefined) => {
            if (!mutation) {
                return;
            }

            const key = this.getMutationKey(mutation);
            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            highlightedMutations.push(mutation);
        };

        if (!this.props.onlyShowSelectedInVAFChart) {
            for (const mutation of this.props.selectedMutations) {
                addMutation(mutation as Mutation);
            }
        }

        addMutation(this.props.mouseOverMutation as Mutation | null);

        return {
            highlightedMutations,
        };
    }

    @computed get mutationToLines(): { [mutationKey: string]: ILine[] } {
        return this.renderSummary.mutationToLines;
    }

    @computed get renderSummary(): VafChartRenderSummary {
        const mutationToLines: { [mutation: string]: ILine[] } = {};
        const renderLines: RenderPointSummary[][] = [];
        const mutationVafReportCache = new WeakMap<Mutation, VAFReport | null>();
        const lineData = this.props.lineData;

        for (let index = 0; index < lineData.length; index++) {
            const points = lineData[index];
            const line: ILine = { points: points };
            const key = this.getMutationKey(points[0].mutation);
            if (!mutationToLines[key]) mutationToLines[key] = [];
            mutationToLines[key].push(line);

            const lineRenderPoints = new Array<RenderPointSummary>(points.length);
            for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
                const point = points[pointIndex];
                let vafReport = mutationVafReportCache.get(point.mutation);
                if (vafReport === undefined) {
                    vafReport = getVariantAlleleFrequency(point.mutation);
                    mutationVafReportCache.set(point.mutation, vafReport);
                }

                lineRenderPoints[pointIndex] = {
                    point,
                    tooltipDatum: {
                        mutationStatus: point.mutationStatus,
                        sampleId: point.sampleId,
                        vafReport,
                    },
                };
            }

            renderLines[index] = lineRenderPoints;
        }

        return {
            mutationToLines,
            renderLines,
        };
    }

    @computed get headerHeight() {
        return 20;
    }

    @autobind
    private getHighlights() {
        const highlightedMutations =
            this.highlightSummary.highlightedMutations;
        if (highlightedMutations.length > 0) {
            return (
                <g>
                    <LineHighlightSvg
                        highlightedMutations={highlightedMutations}
                        mutationLines={this.mutationToLines}
                    />
                </g>
            );
        } else {
            return <g />;
        }
    }

    @autobind
    private handleTooltipModelChange(model: TooltipModel) {
        this.tooltipModel = model;
        this.props.onMutationMouseOver(model.mutation);
    }

    private tooltipFunction(tooltipData: any) {
        return mutationTooltip(
            tooltipData.mutation,
            tooltipData.tooltipOnPoint
                ? {
                      mutationStatus: tooltipData.datum.mutationStatus,
                      sampleId: tooltipData.datum.sampleId,
                      vafReport: tooltipData.datum.vafReport,
                  }
                : undefined
        );
    }

    @autobind
    private getTooltipComponent(): JSX.Element {
        let mutationTooltip = this.tooltipModel;
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
        const renderLines = this.renderSummary.renderLines;
        let renderedLineCount = 0;
        for (let lineIndex = 0; lineIndex < renderLines.length; lineIndex += 1) {
            renderedLineCount += renderLines[lineIndex].length;
        }
        const renderedLines = new Array<JSX.Element>(renderedLineCount);
        let renderedLineIndex = 0;

        for (let lineIndex = 0; lineIndex < renderLines.length; lineIndex += 1) {
            const data = renderLines[lineIndex];
            for (let pointIndex = 0; pointIndex < data.length; pointIndex += 1) {
                const renderPoint = data[pointIndex];
                const d = renderPoint.point;
                const nextPoint = data[pointIndex + 1]?.point;
                const x1 = d.x;
                const y1 = d.y;
                const x2 = nextPoint?.x;
                const y2 = nextPoint?.y;
                const color = d.color;

                renderedLines[renderedLineIndex] = (
                    <g key={`${lineIndex}-${pointIndex}-${d.sampleId}`}>
                        {x2 !== undefined && y2 !== undefined && (
                            <VAFPointConnector
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                color={color}
                                datum={renderPoint.tooltipDatum}
                                mutation={d.mutation}
                                onMutationClick={this.props.onMutationClick}
                                setTooltipModel={this.handleTooltipModelChange}
                            />
                        )}
                        <VAFPoint
                            x={x1}
                            y={y1}
                            color={color}
                            datum={renderPoint.tooltipDatum}
                            mutation={d.mutation}
                            onMutationClick={this.props.onMutationClick}
                            setTooltipModel={this.handleTooltipModelChange}
                        />
                    </g>
                );
                renderedLineIndex += 1;
            }
        }

        return (
            <svg width={this.props.width} height={this.props.height}>
                {renderedLines}

                <Observer>{this.getHighlights}</Observer>
                <Observer>{this.getTooltipComponent}</Observer>
            </svg>
        );
    }
}
