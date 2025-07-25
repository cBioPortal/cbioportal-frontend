import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface TooltipDisplayProps {
    hoveredPoint: EmbeddingPoint | null;
}

export const TooltipDisplay: React.FC<TooltipDisplayProps> = ({
    hoveredPoint,
}) => {
    if (!hoveredPoint) return null;

    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1,
                pointerEvents: 'none',
                left: '10px',
                bottom: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '200px',
            }}
        >
            <div>
                <strong>Patient ID:</strong> {hoveredPoint.patientId}
            </div>
            <div>
                <strong>Position:</strong> ({hoveredPoint.x.toFixed(2)},{' '}
                {hoveredPoint.y.toFixed(2)})
            </div>
            {hoveredPoint.cancerType && (
                <div>
                    <strong>Cancer Type:</strong> {hoveredPoint.cancerType}
                </div>
            )}
        </div>
    );
};
