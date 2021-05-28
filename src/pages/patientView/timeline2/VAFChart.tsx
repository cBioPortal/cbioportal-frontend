import React from 'react';
import { Observer, observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { Mutation } from 'cbioportal-ts-api-client';
import { IPoint } from './VAFChartUtils';
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

export interface IColorPoint extends IPoint {
    color: string;
}

type Datum = {
    mutationStatus: MutationStatus | null;
    sampleId: string;
    vaf: number;
};

type TooltipModel = {
    datum: Datum | null;
    mutation: Mutation | null;
    mouseEvent: React.MouseEvent<any> | null;
    tooltipOnPoint: boolean;
};
import VAFChartWrapperStore from './VAFChartWrapperStore';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { VAFChartHeader } from 'pages/patientView/timeline2/VAFChartHeader';
import { yValueScaleFunction } from 'pages/patientView/timeline2/VAFChartUtils';
import './styles.scss';

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
    datum: Datum | null;
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
    datum: Datum | null;
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

@observer
export default class VAFChart extends React.Component<IVAFChartProps, {}> {
    @observable.ref private tooltipModel: TooltipModel;

    constructor(props: IVAFChartProps) {
        super(props);
        makeObservable(this);
    }

    @computed get headerHeight() {
        return 20;
    }

    @computed get mutationToDataPoints() {
        const map = new ComplexKeyMap<IColorPoint[]>();
        for (const lineData of this.props.lineData) {
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

    @autobind
    private getHighlights() {
        const highlightedMutations = [];
        if (!this.props.onlyShowSelectedInVAFChart) {
            // dont bold highlighted mutations if we're only showing highlighted mutations
            highlightedMutations.push(...this.props.selectedMutations);
        }
        // Using old functionality to get mouseOverMUtation from PatientsViewMutationDataStore
        // so highlighting a mutation in the VAF chart will highlight it also in the mutation table.
        // Also if multiple VAF charts are present in the page all will share the highlighting.
        // If this is not desired, comment the following line and uncomment the next.
        const mouseOverMutation = this.props.mouseOverMutation;
        /*const mouseOverMutation = this.props.wrapperStore.tooltipModel
            ? this.props.wrapperStore.tooltipModel.mutation
            : null;*/

        if (mouseOverMutation) {
            highlightedMutations.push(mouseOverMutation);
        }
        if (highlightedMutations.length > 0) {
            return (
                <>
                    {highlightedMutations.map(highlightedMutation => {
                        const points = this.mutationToDataPoints.get({
                            proteinChange: highlightedMutation.proteinChange,
                            hugoGeneSymbol:
                                highlightedMutation.gene.hugoGeneSymbol,
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
                    })}
                </>
            );
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
        return (
            <svg width={this.props.width} height={this.props.height}>
                {this.props.lineData.map(
                    (data: IColorPoint[], index: number) => {
                        return data.map((d: IColorPoint, i: number) => {
                            let x1 = d.x,
                                x2;
                            let y1 = d.y,
                                y2;

                            const nextPoint: IColorPoint = data[i + 1];
                            if (nextPoint) {
                                x2 = nextPoint.x;
                                y2 = nextPoint.y;
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

                            const color = d.color;

                            return (
                                <g>
                                    {x2 && y2 && (
                                        <VAFPointConnector
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            color={color}
                                            datum={tooltipDatum}
                                            mutation={d.mutation}
                                            onMutationClick={
                                                this.props.onMutationClick
                                            }
                                            setTooltipModel={model => {
                                                this.tooltipModel = model;
                                                this.props.onMutationMouseOver(
                                                    model.mutation
                                                );
                                            }}
                                        />
                                    )}
                                    <VAFPoint
                                        x={x1}
                                        y={y1}
                                        color={color}
                                        datum={tooltipDatum}
                                        mutation={d.mutation}
                                        onMutationClick={
                                            this.props.onMutationClick
                                        }
                                        setTooltipModel={model => {
                                            this.tooltipModel = model;
                                            this.props.onMutationMouseOver(
                                                model.mutation
                                            );
                                        }}
                                    />
                                </g>
                            );
                        });
                    }
                )}

                <Observer>{this.getHighlights}</Observer>
                <Observer>{this.getTooltipComponent}</Observer>
            </svg>
        );
    }
}
