import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface LegendPanelProps {
    data: EmbeddingPoint[];
    showLegend?: boolean;
    actualHeight: number;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({
    data,
    showLegend = true,
    actualHeight,
}) => {
    if (!showLegend || !data || data.length === 0) {
        return null;
    }

    // Group by cancer type to create legend with proper styling
    const legendItems = data.reduce((acc, point) => {
        if (point.cancerType && point.color) {
            acc[point.cancerType] = {
                fillColor: point.color,
                strokeColor: point.strokeColor || point.color,
                hasStroke: !!(
                    point.strokeColor && point.strokeColor !== point.color
                ),
            };
        }
        return acc;
    }, {} as Record<string, { fillColor: string; strokeColor: string; hasStroke: boolean }>);

    const legendEntries = Object.entries(legendItems);

    if (legendEntries.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '3px',
                padding: '8px',
                fontSize: '10px',
                maxHeight: `${actualHeight - 20}px`,
                overflowY: 'auto',
                minWidth: '120px',
            }}
        >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Legend
            </div>
            {legendEntries.map(([cancerType, styling]) => (
                <div
                    key={cancerType}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '2px',
                    }}
                >
                    <div
                        style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: styling.hasStroke
                                ? 'transparent'
                                : styling.fillColor,
                            marginRight: '6px',
                            borderRadius: '50%',
                            border: styling.hasStroke
                                ? `2px solid ${styling.strokeColor}`
                                : `1px solid ${styling.strokeColor}`,
                        }}
                    />
                    <span style={{ fontSize: '9px' }}>{cancerType}</span>
                </div>
            ))}
        </div>
    );
};
