import * as React from 'react';
import * as Plotly from 'plotly.js';
import { EmbeddingVisualizationProps, EmbeddingPoint } from './EmbeddingTypes';

/**
 * Reusable Plotly-based visualization component for embedding data
 * Can be used for UMAP, t-SNE, PCA, or any 2D embedding visualization
 */
export class EmbeddingPlotlyVisualization extends React.Component<EmbeddingVisualizationProps> {
    private plotRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.createPlot();
    }

    componentDidUpdate(prevProps: EmbeddingVisualizationProps) {
        // Re-create plot if data changes
        if (prevProps.data !== this.props.data) {
            this.createPlot();
        }
    }

    componentWillUnmount() {
        if (this.plotRef.current) {
            Plotly.purge(this.plotRef.current);
        }
    }

    private createPlot = () => {
        if (!this.plotRef.current || !this.props.data || this.props.data.length === 0) {
            return;
        }

        // Clear any existing plot
        Plotly.purge(this.plotRef.current);

        const {
            data,
            title = 'Embedding Visualization',
            xAxisLabel = 'Dimension 1',
            yAxisLabel = 'Dimension 2',
            width = 800,
            height = 600,
            showLegend = true,
            filename = 'embedding_plot',
            onPointSelection
        } = this.props;

        // Group by appearance to minimize traces and improve performance
        const appearanceGroups = new Map<string, EmbeddingPoint[]>();
        
        data.forEach(point => {
            const appearanceKey = `${point.color || '#CCCCCC'}|${point.strokeColor || '#CCCCCC'}|${point.cancerType || 'Unknown'}`;
            if (!appearanceGroups.has(appearanceKey)) {
                appearanceGroups.set(appearanceKey, []);
            }
            appearanceGroups.get(appearanceKey)!.push(point);
        });

        const traces: any[] = [];

        // Create data traces
        appearanceGroups.forEach((points, appearanceKey) => {
            const [fillColor, strokeColor, cancerType] = appearanceKey.split('|');
            
            traces.push({
                x: points.map(d => d.x),
                y: points.map(d => d.y),
                mode: 'markers' as const,
                type: 'scattergl' as const,
                name: cancerType,
                showlegend: false, // Legend will be handled separately
                marker: {
                    color: fillColor,
                    size: 8,
                    opacity: 0.8,
                    line: {
                        color: strokeColor,
                        width: strokeColor !== fillColor ? 2 : 0,
                    },
                },
                text: points.map(d => `Patient: ${d.patientId}<br>Type: ${d.cancerType || 'Unknown'}`),
                hovertemplate: '%{text}<extra></extra>',
                customdata: points.map(d => d.patientId), // For selection events
            });
        });

        // Create legend traces if showLegend is true
        if (showLegend) {
            const categoryToAppearance = new Map<string, { color: string; strokeColor: string }>();
            data.forEach(point => {
                if (point.cancerType && point.cancerType !== 'Unknown') {
                    categoryToAppearance.set(point.cancerType, {
                        color: point.color || '#CCCCCC',
                        strokeColor: point.strokeColor || '#CCCCCC'
                    });
                }
            });

            categoryToAppearance.forEach((appearance, category) => {
                let marker: any = { size: 8, opacity: 0.8 };
                
                // Use border-only styling for CNAs and SVs (same as backup file)
                if (category.includes('Amplification') || category.includes('Gain') || 
                    category.includes('Diploid') || category.includes('Deletion') ||
                    category.includes('Structural')) {
                    // Border-only for CNAs and SVs
                    marker.color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill
                    marker.line = {
                        color: appearance.strokeColor,
                        width: 2,
                    };
                } else {
                    // Filled dots for mutations and "no alterations"
                    marker.color = appearance.color;
                    marker.line = { width: 0 };
                }
                
                traces.push({
                    x: [NaN],
                    y: [NaN],
                    mode: 'markers' as const,
                    type: 'scattergl' as const,
                    name: category,
                    marker: marker,
                    showlegend: true,
                    hovertemplate: '<extra></extra>',
                });
            });
        }

        const layout: Partial<Plotly.Layout> = {
            title: { text: title },
            xaxis: { title: { text: xAxisLabel } },
            yaxis: { title: { text: yAxisLabel } },
            autosize: true, // Let plot fill container
            margin: { l: 60, r: showLegend ? 150 : 60, t: 60, b: 60 },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
        };

        const config: Partial<Plotly.Config> = {
            displayModeBar: true,
            displaylogo: false,
            responsive: true, // Make plot responsive
            toImageButtonOptions: {
                format: 'png' as const,
                filename,
                height: height || 600,
                width: width || 800,
                scale: 2,
            },
        };

        Plotly.newPlot(this.plotRef.current, traces, layout, config);

        // Add selection event handler if callback is provided
        if (onPointSelection && this.plotRef.current) {
            (this.plotRef.current as any).on('plotly_selected', (eventData: any) => {
                if (eventData && eventData.points && eventData.points.length > 0) {
                    const selectedPoints = eventData.points.map((point: any) => {
                        const patientId = point.customdata;
                        return data.find(d => d.patientId === patientId);
                    }).filter(Boolean);
                    onPointSelection(selectedPoints);
                }
            });
        }
    };

    render() {
        return (
            <div>
                <div
                    ref={this.plotRef}
                    style={{ width: '100%', height: `${this.props.height || 600}px` }}
                />
            </div>
        );
    }
}