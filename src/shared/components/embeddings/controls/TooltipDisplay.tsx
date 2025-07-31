import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface TooltipDisplayProps {
    hoveredPoint: EmbeddingPoint | null;
    embeddingType?: 'patients' | 'samples';
}

export const TooltipDisplay: React.FC<TooltipDisplayProps> = ({
    hoveredPoint,
    embeddingType,
}) => {
    if (!hoveredPoint) return null;

    // Show appropriate ID based on embedding type
    const idLabel = embeddingType === 'samples' ? 'Sample ID' : 'Patient ID';
    const idValue =
        embeddingType === 'samples'
            ? hoveredPoint.sampleId
            : hoveredPoint.patientId;

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
                <strong>{idLabel}:</strong> {idValue}
            </div>
            <div>
                <strong>Position:</strong> ({hoveredPoint.x.toFixed(2)},{' '}
                {hoveredPoint.y.toFixed(2)})
            </div>
            {hoveredPoint.displayLabel && (
                <div>
                    <strong>Category:</strong> {hoveredPoint.displayLabel}
                </div>
            )}
        </div>
    );
};
