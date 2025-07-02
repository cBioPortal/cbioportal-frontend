import { ScatterplotLayer } from '@deck.gl/layers';
import { EmbeddingPoint } from '../EmbeddingTypes';
import { hexToRgb } from './coordinateUtils';

/**
 * Create the scatterplot layer for the embedding visualization
 */
export function createScatterplotLayer(
    data: EmbeddingPoint[],
    selectedPoints: EmbeddingPoint[],
    selectedPatientIds: string[] = [],
    onHover: (info: any) => void,
    onClick: (info: any) => void
) {
    // Convert to Sets for O(1) lookup performance (computed once per layer creation)
    const localSelectedSet = new Set(selectedPoints.map(p => p.patientId));
    const externalSelectedSet = new Set(selectedPatientIds);
    const hasAnySelection =
        selectedPoints.length > 0 || selectedPatientIds.length > 0;

    return new ScatterplotLayer({
        id: 'embedding-scatter',
        data,
        getPosition: (d: EmbeddingPoint) => [d.x, d.y],
        getRadius: (d: EmbeddingPoint) => {
            const isSelected =
                localSelectedSet.has(d.patientId) ||
                externalSelectedSet.has(d.patientId);
            return isSelected ? 0.05 : 0.03;
        },
        getFillColor: (d: EmbeddingPoint) => {
            const isSelected =
                localSelectedSet.has(d.patientId) ||
                externalSelectedSet.has(d.patientId);

            // If there's an active selection and this point is not selected, make it light gray
            if (hasAnySelection && !isSelected) {
                return [200, 200, 200, 255]; // Light gray for ALL unselected
            }

            // Default: show actual color (keep the fill color)
            const color = d.color || '#CCCCCC';
            const rgb = hexToRgb(color);
            return [rgb[0], rgb[1], rgb[2], 255];
        },
        getLineColor: (d: EmbeddingPoint) => {
            const isSelected =
                localSelectedSet.has(d.patientId) ||
                externalSelectedSet.has(d.patientId);

            // If there's an active selection and this point is not selected, make it light gray
            if (hasAnySelection && !isSelected) {
                return [200, 200, 200]; // Light gray for ALL unselected
            }

            // Default: show actual stroke color or fill color
            const strokeColor = d.strokeColor || d.color || '#CCCCCC';
            return hexToRgb(strokeColor);
        },
        getLineWidth: (d: EmbeddingPoint) => {
            const isSelected =
                localSelectedSet.has(d.patientId) ||
                externalSelectedSet.has(d.patientId);

            if (isSelected) {
                return 0.01; // Thicker border for selected points
            }
            // Show border for amplified alterations or when strokeColor differs from fillColor
            return d.strokeColor && d.strokeColor !== d.color ? 0.005 : 0;
        },
        filled: true,
        stroked: true,
        pickable: true,
        onHover,
        onClick,
        updateTriggers: {
            getFillColor: [data, selectedPoints, selectedPatientIds],
            getLineColor: [data, selectedPoints, selectedPatientIds],
            getLineWidth: [data, selectedPoints, selectedPatientIds],
            getRadius: [selectedPoints, selectedPatientIds],
        },
    } as any);
}
