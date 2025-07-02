/**
 * Common types and interfaces for embedding visualizations
 */

export interface EmbeddingData {
    studyId: string;
    title: string;
    description: string;
    totalPatients: number;
    sampleSize: number;
    data: { patientId: string; x: number; y: number }[];
}

export interface EmbeddingDataOption {
    value: string;
    label: string;
    data: EmbeddingData;
}

export interface EmbeddingPoint {
    x: number;
    y: number;
    patientId: string;
    color?: string;
    strokeColor?: string;
    cancerType?: string;
    [key: string]: any; // Allow additional properties for extensibility
}

export interface ViewState {
    target: [number, number, number];
    zoom: number;
    minZoom: number;
    maxZoom: number;
}

export interface EmbeddingVisualizationProps {
    data: EmbeddingPoint[];
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    width?: number;
    height?: number;
    onPointSelection?: (selectedPoints: EmbeddingPoint[]) => void;
    selectedPatientIds?: string[];
    showLegend?: boolean;
    filename?: string;
    viewState?: ViewState;
    onViewStateChange?: (viewState: ViewState) => void;
}

export interface EmbeddingControlsProps {
    embeddingOptions: EmbeddingDataOption[];
    selectedEmbedding: string;
    onEmbeddingChange: (value: string) => void;
    coloringComponent?: React.ReactNode;
}
