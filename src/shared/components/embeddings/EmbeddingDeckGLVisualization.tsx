import * as React from 'react';
import { DeckGL } from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import {
    EmbeddingVisualizationProps,
    EmbeddingPoint,
    ViewState,
} from './EmbeddingTypes';

// Import modular components
import { ToolbarControls } from './controls/ToolbarControls';
import { SelectionControls } from './controls/SelectionControls';
import { LegendPanel } from './controls/LegendPanel';
import { TooltipDisplay } from './controls/TooltipDisplay';
import { AxisLabels } from './overlays/AxisLabels';
import { SelectionOverlay } from './overlays/SelectionOverlay';

// Import utility functions
import { dataToScreen, hexToRgb } from './utils/coordinateUtils';
import { calculateDataBounds } from './utils/dataUtils';
import { createScatterplotLayer } from './utils/layerUtils';
import { performRectangleSelection } from './utils/selectionUtils';

interface EmbeddingDeckGLVisualizationState {
    hoveredPoint: EmbeddingPoint | null;
    selectedPoints: EmbeddingPoint[];
    selectionMode: 'none' | 'rectangle';
    isSelecting: boolean;
    selectionBounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    selectionStart?: { x: number; y: number };
    selectionEnd?: { x: number; y: number };
    actualWidth: number;
    actualHeight: number;
}

/**
 * High-performance deck.gl-based visualization for embedding data
 * Uses WebGL ScatterplotLayer for efficient rendering of large datasets
 */
export class EmbeddingDeckGLVisualization extends React.Component<
    EmbeddingVisualizationProps,
    EmbeddingDeckGLVisualizationState
> {
    private containerRef = React.createRef<HTMLDivElement>();
    private deckRef = React.createRef<DeckGL>();

    constructor(props: EmbeddingVisualizationProps) {
        super(props);

        this.state = {
            hoveredPoint: null,
            selectedPoints: [],
            selectionMode: 'none',
            isSelecting: false,
            actualWidth: props.width || 800,
            actualHeight: props.height || 600,
        };
    }

    componentDidMount() {
        this.measureContainer();
        window.addEventListener('resize', this.measureContainer);
    }

    componentDidUpdate(prevProps: EmbeddingVisualizationProps) {
        // Remeasure container when height or width props change
        // This handles tab switching where the container might have been hidden
        if (
            prevProps.height !== this.props.height ||
            prevProps.width !== this.props.width
        ) {
            this.measureContainer();
        }

        // Also remeasure after a short delay to handle tab visibility changes
        // When switching tabs, the container might be hidden (width=0) during the update
        // but visible shortly after, so we need to remeasure once layout is complete
        setTimeout(() => {
            this.measureContainer();
        }, 0);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.measureContainer);
    }

    private measureContainer = () => {
        if (this.containerRef.current) {
            const rect = this.containerRef.current.getBoundingClientRect();
            const newWidth = rect.width;
            const newHeight = rect.height || this.props.height || 600;

            if (
                newWidth !== this.state.actualWidth ||
                newHeight !== this.state.actualHeight
            ) {
                this.setState({
                    actualWidth: newWidth,
                    actualHeight: newHeight,
                });
            }
        }
    };

    private getLayers() {
        const { data } = this.props;
        const { selectedPoints } = this.state;

        if (!data || data.length === 0) return [];

        return [
            createScatterplotLayer(
                data,
                selectedPoints,
                this.props.selectedPatientIds || [],
                this.onHover,
                this.onClick
            ),
        ];
    }

    private onHover = (info: any) => {
        const { object } = info;
        this.setState({
            hoveredPoint: object || null,
        });
    };

    private onClick = (info: any) => {
        const { object } = info;
        if (object && this.props.onPointSelection) {
            // Don't allow selection of non-cohort samples
            if (object.isInCohort === false) {
                return;
            }
            this.props.onPointSelection([object]);
        }
    };

    private onViewStateChange = ({ viewState }: { viewState: any }) => {
        const newViewState = viewState.ortho || viewState;
        if (this.props.onViewStateChange) {
            this.props.onViewStateChange(newViewState);
        }
    };

    private renderTooltip() {
        return (
            <TooltipDisplay
                hoveredPoint={this.state.hoveredPoint}
                embeddingType={this.props.embeddingType}
            />
        );
    }

    private renderLegend() {
        return (
            <LegendPanel
                data={this.props.data}
                showLegend={this.props.showLegend}
                actualHeight={this.state.actualHeight}
                categoryCounts={this.props.categoryCounts}
                categoryColors={this.props.categoryColors}
                hiddenCategories={this.props.hiddenCategories}
                onToggleCategoryVisibility={
                    this.props.onToggleCategoryVisibility
                }
                onToggleAllCategories={this.props.onToggleAllCategories}
                visibleSampleCount={this.props.visibleSampleCount}
                totalSampleCount={this.props.totalSampleCount}
                visibleCategoryCount={this.props.visibleCategoryCount}
                totalCategoryCount={this.props.totalCategoryCount}
            />
        );
    }

    private renderAxisLabels() {
        return (
            <AxisLabels
                xAxisLabel={this.props.xAxisLabel}
                yAxisLabel={this.props.yAxisLabel}
                actualWidth={this.state.actualWidth}
                actualHeight={this.state.actualHeight}
            />
        );
    }

    private exportToPNG = () => {
        const { filename = 'embedding_plot' } = this.props;

        if (this.deckRef.current) {
            const canvas = this.deckRef.current.deck?.canvas;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
        }
    };

    private centerView = () => {
        const bounds = calculateDataBounds(this.props.data);
        const currentViewState = this.props.viewState || {
            target: [0, 0, 0],
            zoom: 0,
            minZoom: -5,
            maxZoom: 10,
        };

        if (this.props.onViewStateChange) {
            this.props.onViewStateChange({
                ...currentViewState,
                target: [bounds.centerX, bounds.centerY, 0],
                zoom: bounds.zoom,
            });
        }
    };

    private onSelectionModeChange = (mode: 'none' | 'rectangle') => {
        this.setState({
            selectionMode: mode,
            selectionBounds: undefined,
            isSelecting: false,
            selectionStart: undefined,
            selectionEnd: undefined,
        });
    };

    private handleMouseDown = (event: React.MouseEvent) => {
        if (this.state.selectionMode === 'none') return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.setState({
            isSelecting: true,
            selectionStart: { x, y },
            selectionEnd: { x, y },
        });
    };

    private handleMouseMove = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.state.selectionMode === 'none')
            return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.state.selectionMode === 'rectangle') {
            this.setState({ selectionEnd: { x, y } });
        }
    };

    private handleMouseUp = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.state.selectionMode === 'none')
            return;

        // Convert screen coordinates to data coordinates and perform selection
        this.performSelection();

        // Clear selection state and return to pan mode
        this.setState({
            isSelecting: false,
            selectionMode: 'none',
            selectionStart: undefined,
            selectionEnd: undefined,
        });
    };

    private performSelection = () => {
        const { selectionMode, selectionStart, selectionEnd } = this.state;

        if (selectionMode === 'rectangle') {
            this.performRectangleSelection();
        }
    };

    private performRectangleSelection = () => {
        const { selectionStart, selectionEnd } = this.state;

        if (!this.deckRef.current || !selectionStart || !selectionEnd) {
            return;
        }

        // Calculate rectangle bounds
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);

        try {
            // Access the underlying deck instance
            const deck = this.deckRef.current.deck as any;
            if (!deck) {
                console.warn('Deck instance not available');
                return;
            }

            // Use deck.gl's built-in picking for accurate selection
            // Try pickObjects first, fallback to pickMultipleObjects if needed
            let pickedObjects: any[] = [];

            if (typeof deck.pickObjects === 'function') {
                pickedObjects = deck.pickObjects({
                    x: left,
                    y: top,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else if (typeof deck.pickMultipleObjects === 'function') {
                pickedObjects = deck.pickMultipleObjects({
                    x: left,
                    y: top,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else {
                // Fallback: sample multiple points within the rectangle
                const samplePoints: any[] = [];
                const stepSize = 5; // Sample every 5 pixels
                for (let x = left; x < left + width; x += stepSize) {
                    for (let y = top; y < top + height; y += stepSize) {
                        if (typeof deck.pickObject === 'function') {
                            const picked = deck.pickObject({
                                x,
                                y,
                                layerIds: ['embedding-scatter'],
                            });
                            if (picked && picked.object) {
                                samplePoints.push(picked);
                            }
                        }
                    }
                }
                pickedObjects = samplePoints;
            }

            const selectedPoints: EmbeddingPoint[] = pickedObjects
                .map((info: any) => info.object)
                .filter((obj: any) => obj != null); // Filter out any null objects

            this.setState({ selectedPoints });

            // Notify parent component of selection
            if (this.props.onPointSelection && selectedPoints.length > 0) {
                this.props.onPointSelection(selectedPoints);
            }
        } catch (error) {
            console.warn('Rectangle selection failed:', error);
            // Fallback to empty selection
            this.setState({ selectedPoints: [] });
        }
    };

    private dataToScreen = (
        dataX: number,
        dataY: number
    ): { x: number; y: number } => {
        const { actualWidth, actualHeight } = this.state;
        const viewState = this.props.viewState || {
            target: [0, 0, 0],
            zoom: 0,
            minZoom: -5,
            maxZoom: 10,
        };

        return dataToScreen(dataX, dataY, viewState, actualWidth, actualHeight);
    };

    private renderControls() {
        const { selectionMode } = this.state;

        return (
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                <ToolbarControls
                    onExport={this.exportToPNG}
                    onCenter={this.centerView}
                />
                <SelectionControls
                    selectionMode={selectionMode}
                    onSelectionModeChange={this.onSelectionModeChange}
                />
            </div>
        );
    }

    private renderSelectionOverlay() {
        const {
            isSelecting,
            selectionMode,
            selectionStart,
            selectionEnd,
        } = this.state;

        return (
            <SelectionOverlay
                isSelecting={isSelecting}
                selectionMode={selectionMode}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
            />
        );
    }

    render() {
        const { actualWidth, actualHeight } = this.state;

        return (
            <div
                ref={this.containerRef}
                style={{ position: 'relative', width: '100%' }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: `${actualHeight}px`,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                    }}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                >
                    <DeckGL
                        ref={this.deckRef}
                        views={
                            new OrthographicView({
                                id: 'ortho',
                                controller: !this.state.isSelecting,
                            })
                        }
                        viewState={
                            this.props.viewState || {
                                target: [0, 0, 0],
                                zoom: 0,
                                minZoom: -5,
                                maxZoom: 10,
                            }
                        }
                        onViewStateChange={this.onViewStateChange}
                        layers={this.getLayers()}
                        width={actualWidth}
                        height={actualHeight}
                        style={{
                            backgroundColor: 'white',
                            cursor:
                                this.state.selectionMode === 'rectangle'
                                    ? 'crosshair'
                                    : 'grab',
                        }}
                    />

                    {this.renderTooltip()}
                    {this.renderLegend()}
                    {this.renderAxisLabels()}
                    {this.renderControls()}
                    {this.renderSelectionOverlay()}
                </div>
            </div>
        );
    }
}
