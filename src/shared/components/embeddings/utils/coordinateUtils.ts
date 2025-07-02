import { ViewState } from '../EmbeddingTypes';

/**
 * Converts data coordinates to screen coordinates
 */
export function dataToScreen(
    dataX: number,
    dataY: number,
    viewState: ViewState,
    width: number,
    height: number
): { x: number; y: number } {
    const scale = Math.pow(2, viewState.zoom);
    const centerX = width / 2;
    const centerY = height / 2;

    const screenX = centerX + (dataX - viewState.target[0]) * scale;
    const screenY = centerY - (dataY - viewState.target[1]) * scale; // Y is flipped

    return { x: screenX, y: screenY };
}

/**
 * Converts hex color to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16),
          ]
        : [204, 204, 204]; // Default gray
}
