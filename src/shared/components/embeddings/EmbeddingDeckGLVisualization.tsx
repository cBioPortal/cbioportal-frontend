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
import { dataToScreen, colorToRgb } from './utils/coordinateUtils';
import { calculateDataBounds } from './utils/dataUtils';
import { createScatterplotLayer } from './utils/layerUtils';

// The layer's updateTriggers compare this by identity, so a caller that passes
// no patient selection must get the same array every render or deck recomputes
// every point's color, radius and outline on each frame.
const NO_SELECTED_PATIENT_IDS: string[] = [];

interface EmbeddingDeckGLVisualizationState {
    hoveredPoint: EmbeddingPoint | null;
    selectedPoints: EmbeddingPoint[];
    selectionMode: 'none' | 'lasso';
    isSelecting: boolean;
    // A middle-button drag in progress, which pans in either mode.
    isMiddlePanning: boolean;
    selectionPath: Array<{ x: number; y: number }>;
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
    // Memoized so DeckGL sees a stable view identity across renders,
    // recreated only when isSelecting flips.
    private cachedView?: OrthographicView;
    private cachedViewIsSelecting?: boolean;
    private cachedViewport?: {
        viewState: ViewState;
        width: number;
        height: number;
        viewport: any;
    };

    constructor(props: EmbeddingVisualizationProps) {
        super(props);

        this.state = {
            hoveredPoint: null,
            selectedPoints: [],
            selectionMode: 'none',
            isSelecting: false,
            isMiddlePanning: false,
            selectionPath: [],
            actualWidth: props.width || 800,
            actualHeight: props.height || 600,
        };
    }

    componentDidMount() {
        this.measureContainer();
        window.addEventListener('resize', this.measureContainer);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    componentDidUpdate(prevProps: EmbeddingVisualizationProps) {
        // Every point outside a selection is drawn grey, so picks left behind
        // after the owner drops its selections would grey the whole map.
        if (
            this.props.selectionCount === 0 &&
            prevProps.selectionCount !== 0 &&
            this.state.selectedPoints.length > 0
        ) {
            this.setState({ selectedPoints: [] });
        }

        // actualHeight drives the container's own height, so measuring it
        // back is circular - apply an incoming height prop directly.
        if (
            prevProps.height !== this.props.height &&
            this.props.height !== undefined &&
            this.props.height !== this.state.actualHeight
        ) {
            this.setState({ actualHeight: this.props.height });
        }

        if (prevProps.width !== this.props.width) {
            this.measureContainer();
        }

        // Remeasure after tab switches, where the container may have
        // been hidden (width=0) during the update.
        setTimeout(() => {
            this.measureContainer();
        }, 0);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.measureContainer);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('mouseup', this.endMiddlePan);
    }

    // On the window, since the button can be released outside the map.
    private endMiddlePan = (event: MouseEvent) => {
        if (event.button !== 1) {
            return;
        }
        window.removeEventListener('mouseup', this.endMiddlePan);
        this.setState({ isMiddlePanning: false });
    };

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

    private getView(): OrthographicView {
        if (
            !this.cachedView ||
            this.cachedViewIsSelecting !== this.state.isSelecting
        ) {
            this.cachedView = new OrthographicView({
                id: 'ortho',
                controller: !this.state.isSelecting,
            });
            this.cachedViewIsSelecting = this.state.isSelecting;
        }
        return this.cachedView;
    }

    private getLayers() {
        const { data } = this.props;
        const { selectedPoints } = this.state;

        if (!data || data.length === 0) return [];

        return [
            createScatterplotLayer(
                data,
                selectedPoints,
                this.props.selectedPatientIds || NO_SELECTED_PATIENT_IDS,
                this.onHover,
                this.onClick,
                this.props.pointScale,
                this.props.contextPointBoost
            ),
        ];
    }

    private hasReportedHover = false;

    private onHover = (info: any) => {
        const { object } = info;
        if (object && !this.hasReportedHover) {
            this.hasReportedHover = true;
            this.props.onPointHovered?.();
        }
        this.setState({
            hoveredPoint: object || null,
        });
    };

    private onClick = (info: any) => {
        const { object } = info;
        if (object) {
            if (object.isInCohort === false) {
                return;
            }
            // Pin the tooltip via parent state (survives component remount)
            if (this.props.onPinPoint) {
                this.props.onPinPoint({ ...object });
            }
            // Also trigger selection
            if (this.props.onPointSelection) {
                this.props.onPointSelection([object]);
            }
        }
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.props.pinnedPoint) {
            if (this.props.onUnpinPoint) {
                this.props.onUnpinPoint();
            }
        }
    };

    private onUnpin = () => {
        if (this.props.onUnpinPoint) {
            this.props.onUnpinPoint();
        }
    };

    private onViewStateChange = ({ viewState }: { viewState: any }) => {
        const newViewState = viewState.ortho || viewState;
        if (this.props.onViewStateChange) {
            this.props.onViewStateChange(newViewState);
        }
    };

    private renderTooltip() {
        const pinnedPoint = this.props.pinnedPoint;
        const { hoveredPoint } = this.state;
        const isPinned = !!pinnedPoint;
        const displayedPoint = pinnedPoint || hoveredPoint;
        return (
            <TooltipDisplay
                hoveredPoint={displayedPoint}
                embeddingType={this.props.embeddingType}
                isPinned={isPinned}
                onUnpin={this.onUnpin}
                selectedTooltipFields={this.props.selectedTooltipFields}
                colorByLabel={this.props.colorByLabel}
                tooltipFieldOptions={this.props.tooltipFieldOptions}
                clinicalAttributeValueMaps={
                    this.props.clinicalAttributeValueMaps
                }
                mapAttributeValueMaps={this.props.mapAttributeValueMaps}
                geneValueMaps={this.props.geneValueMaps}
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
                visibleCategoryCounts={this.props.visibleCategoryCounts}
                categoryColors={this.props.categoryColors}
                hiddenCategories={this.props.hiddenCategories}
                onToggleCategoryVisibility={
                    this.props.onToggleCategoryVisibility
                }
                selectedCategories={this.props.selectedCategories}
                onToggleCategorySelected={this.props.onToggleCategorySelected}
                onToggleAllCategories={this.props.onToggleAllCategories}
                hiddenQcCategories={this.props.hiddenQcCategories}
                onToggleQcCategoryVisibility={
                    this.props.onToggleQcCategoryVisibility
                }
                showHeaderAndConfiguration={
                    this.props.showLegendHeaderAndConfiguration
                }
                isCollapsed={this.props.legendCollapsed}
                onCollapsedChange={this.props.onLegendCollapsedChange}
                visibleSampleCount={this.props.visibleSampleCount}
                totalSampleCount={this.props.totalSampleCount}
                visibleCategoryCount={this.props.visibleCategoryCount}
                totalCategoryCount={this.props.totalCategoryCount}
                isNumericAttribute={this.props.isNumericAttribute}
                numericalValueRange={this.props.numericalValueRange}
                numericalValueToColor={this.props.numericalValueToColor}
                autoNumericalValueRange={this.props.autoNumericalValueRange}
                numericalHistogramBins={this.props.numericalHistogramBins}
                gradientOverride={this.props.gradientOverride}
                onGradientOverrideChange={this.props.onGradientOverrideChange}
                onGradientOverrideReset={this.props.onGradientOverrideReset}
                onClipToPercentile={this.props.onClipToPercentile}
                isFilterActive={this.props.isFilterActive}
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

    // Controlled by the parent when supplied, else purely local.
    private get selectionMode(): 'none' | 'lasso' {
        return this.props.selectionMode !== undefined
            ? this.props.selectionMode
            : this.state.selectionMode;
    }

    // deck.gl writes its own cursor onto the canvas, which wins over the
    // wrapper's style, so the lasso's crosshair has to come from here.
    private getCursor = ({
        isDragging,
        isHovering,
    }: {
        isDragging: boolean;
        isHovering: boolean;
    }): string => {
        // Ahead of the lasso's crosshair: a middle-button drag pans in Select
        // mode too, and should look like it.
        if (this.state.isMiddlePanning) {
            return 'grabbing';
        }
        if (this.selectionMode === 'lasso') {
            return 'crosshair';
        }
        if (isDragging) {
            return 'grabbing';
        }
        return isHovering ? 'pointer' : 'grab';
    };

    private setSelectionMode = (mode: 'none' | 'lasso') => {
        if (this.props.onSelectionModeChange) {
            this.props.onSelectionModeChange(mode);
        } else {
            this.setState({ selectionMode: mode });
        }
    };

    private onSelectionModeChange = (mode: 'none' | 'lasso') => {
        this.setSelectionMode(mode);
        this.setState({
            isSelecting: false,
            selectionPath: [],
        });
    };

    private handleMouseDown = (event: React.MouseEvent) => {
        // A middle-button drag pans the map; without this, browsers that
        // autoscroll on a middle click would scroll the page as well.
        if (event.button === 1) {
            event.preventDefault();
            window.addEventListener('mouseup', this.endMiddlePan);
            this.setState({ isMiddlePanning: true });
        }
        if (this.selectionMode === 'none') return;
        // Only the left button draws a lasso; the others are left to the
        // map's controller, so a middle-button drag pans in Select mode too.
        if (event.button !== 0) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.setState({
            isSelecting: true,
            selectionPath: [{ x, y }],
        });
    };

    private handleMouseMove = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.selectionMode === 'none') return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Throttle point collection - only add if moved at least 3 pixels
        const lastPoint = this.state.selectionPath[
            this.state.selectionPath.length - 1
        ];
        if (lastPoint) {
            const dx = x - lastPoint.x;
            const dy = y - lastPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 3) return;
        }

        this.setState(prevState => ({
            selectionPath: [...prevState.selectionPath, { x, y }],
        }));
    };

    private handleMouseUp = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.selectionMode === 'none') return;

        this.performLassoSelection();

        // Select stays armed: each draw adds a selection of its own, and
        // several are what a comparison is made of.
        this.setState({
            isSelecting: false,
            selectionPath: [],
        });
    };

    /**
     * Point-in-polygon test using ray casting algorithm
     */
    private isPointInPolygon(
        point: { x: number; y: number },
        polygon: Array<{ x: number; y: number }>
    ): boolean {
        if (polygon.length < 3) return false;

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x,
                yi = polygon[i].y;
            const xj = polygon[j].x,
                yj = polygon[j].y;

            if (
                yi > point.y !== yj > point.y &&
                point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
            ) {
                inside = !inside;
            }
        }
        return inside;
    }

    private performLassoSelection = () => {
        const { selectionPath } = this.state;

        if (!this.deckRef.current || selectionPath.length < 3) {
            return;
        }

        // Calculate bounding box of the lasso path for initial filtering
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        for (const point of selectionPath) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }

        const width = maxX - minX;
        const height = maxY - minY;

        try {
            const deck = this.deckRef.current.deck as any;
            if (!deck) {
                return;
            }

            // Use deck.gl's built-in picking to get objects in bounding box
            let pickedObjects: any[] = [];

            if (typeof deck.pickObjects === 'function') {
                pickedObjects = deck.pickObjects({
                    x: minX,
                    y: minY,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else if (typeof deck.pickMultipleObjects === 'function') {
                pickedObjects = deck.pickMultipleObjects({
                    x: minX,
                    y: minY,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else {
                // Fallback: sample multiple points within the bounding box
                const samplePoints: any[] = [];
                const stepSize = 5;
                for (let x = minX; x < maxX; x += stepSize) {
                    for (let y = minY; y < maxY; y += stepSize) {
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

            // Get the viewport for coordinate projection
            const viewports = deck.getViewports();
            const viewport = viewports && viewports[0];

            // Filter picked objects using point-in-polygon test
            const selectedPoints: EmbeddingPoint[] = pickedObjects
                .filter((info: any) => {
                    if (!info || !info.object) return false;
                    const point = info.object as EmbeddingPoint;

                    // Use viewport.project for accurate screen coordinates
                    let screenPoint;
                    if (viewport && viewport.project) {
                        const projected = viewport.project([
                            point.x,
                            point.y,
                            0,
                        ]);
                        screenPoint = { x: projected[0], y: projected[1] };
                    } else {
                        screenPoint = this.dataToScreen(point.x, point.y);
                    }

                    return this.isPointInPolygon(screenPoint, selectionPath);
                })
                .map((info: any) => info.object);

            // Remove duplicates (in case same point picked multiple times)
            const uniquePoints = Array.from(
                new Map(
                    selectedPoints.map(p => [p.patientId || p.sampleId, p])
                ).values()
            );

            this.setState({ selectedPoints: uniquePoints });

            // Notify parent component of selection
            if (this.props.onPointSelection && uniquePoints.length > 0) {
                const dataPath = selectionPath
                    .map(p => this.screenToData(p.x, p.y))
                    .filter(p => p !== null) as Array<{
                    x: number;
                    y: number;
                }>;
                this.props.onPointSelection(
                    uniquePoints,
                    dataPath.length === selectionPath.length
                        ? dataPath
                        : undefined
                );
            }
        } catch (error) {
            this.setState({ selectedPoints: [] });
        }
    };

    /**
     * Where a data point sits on screen.
     *
     * Projects through a viewport built from the view state this render is
     * drawing, so an overlay moves in the same frame as the points under it.
     * Deck's own viewports describe the frame it last drew, which during a
     * drag or a zoom is the frame before this one.
     */
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

        try {
            const cached = this.cachedViewport;
            if (
                !cached ||
                cached.viewState !== viewState ||
                cached.width !== actualWidth ||
                cached.height !== actualHeight
            ) {
                this.cachedViewport = {
                    viewState,
                    width: actualWidth,
                    height: actualHeight,
                    viewport: (this.getView() as any).makeViewport({
                        width: actualWidth,
                        height: actualHeight,
                        viewState: viewState as any,
                    }),
                };
            }
            const [x, y] = this.cachedViewport!.viewport.project([
                dataX,
                dataY,
            ]);
            if (Number.isFinite(x) && Number.isFinite(y)) {
                return { x, y };
            }
        } catch (e) {
            // Deck asserts rather than returning nothing on a view state it
            // cannot make a viewport from; the arithmetic below covers that.
        }

        return dataToScreen(dataX, dataY, viewState, actualWidth, actualHeight);
    };

    /** The inverse of dataToScreen, through the same viewport. */
    private screenToData = (
        screenX: number,
        screenY: number
    ): { x: number; y: number } | null => {
        try {
            // dataToScreen builds and caches the viewport for this view state.
            this.dataToScreen(0, 0);
            const viewport = this.cachedViewport?.viewport;
            const [x, y] = viewport.unproject([screenX, screenY]);
            if (Number.isFinite(x) && Number.isFinite(y)) {
                return { x, y };
            }
        } catch (e) {
            // No viewport to invert through yet.
        }
        return null;
    };

    private renderControls() {
        const selectionMode = this.selectionMode;

        if (this.props.renderControls) {
            return this.props.renderControls({
                onExport: this.exportToPNG,
                selectionMode,
                onSelectionModeChange: this.onSelectionModeChange,
            });
        }

        return (
            <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
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
        const { isSelecting, selectionPath } = this.state;
        const selectionMode = this.selectionMode;

        const committedOutlines = (this.props.selectionOutlines || []).map(
            outline => ({
                id: outline.id,
                color: outline.color,
                path: outline.path.map(p => this.dataToScreen(p.x, p.y)),
            })
        );

        return (
            <SelectionOverlay
                isSelecting={isSelecting}
                selectionMode={selectionMode}
                selectionPath={selectionPath}
                committedOutlines={committedOutlines}
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
                    }}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                >
                    <DeckGL
                        ref={this.deckRef}
                        views={this.getView()}
                        viewState={
                            this.props.viewState || {
                                target: [0, 0, 0],
                                zoom: 0,
                                minZoom: -5,
                                maxZoom: 10,
                            }
                        }
                        onViewStateChange={this.onViewStateChange}
                        getCursor={this.getCursor}
                        layers={this.getLayers()}
                        width={actualWidth}
                        height={actualHeight}
                        style={{
                            backgroundColor: 'white',
                            cursor:
                                this.selectionMode === 'lasso'
                                    ? 'crosshair'
                                    : 'grab',
                        }}
                    />

                    {this.props.renderOverlay && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                // Keeps a mark whose point has been panned out
                                // of the plot from drawing over the page.
                                overflow: 'hidden',
                            }}
                        >
                            {this.props.renderOverlay(
                                this.dataToScreen,
                                this.props.overlayEmbedding
                            )}
                        </div>
                    )}
                    {this.renderTooltip()}
                    <div
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            zIndex: 2,
                        }}
                    >
                        {this.renderControls()}
                    </div>
                    {/* Higher z-index than the controls above so the legend
                        (which can grow wide with long category names) draws
                        on top if the two ever overlap at narrow widths. */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            zIndex: 3,
                        }}
                    >
                        {this.renderLegend()}
                    </div>
                    {this.renderAxisLabels()}
                    {this.renderSelectionOverlay()}

                    {/* Show message when no points are visible */}
                    {this.props.data.length === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#666',
                                fontSize: '14px',
                                textAlign: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            No points selected for display
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
