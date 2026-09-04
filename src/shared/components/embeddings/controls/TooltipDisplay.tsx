import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface TooltipFieldValueMaps {
    cancerTypeDetailedValueMap?: Map<string, string>;
    osMonthsValueMap?: Map<string, string>;
    osStatusValueMap?: Map<string, string>;
    sampleTypeValueMap?: Map<string, string>;
}

export interface TooltipDisplayProps {
    hoveredPoint: EmbeddingPoint | null;
    embeddingType?: 'patients' | 'samples';
    isPinned?: boolean;
    onUnpin?: () => void;
    selectedTooltipFields?: Set<string>;
    cancerTypeDetailedValueMap?: Map<string, string>;
    osMonthsValueMap?: Map<string, string>;
    osStatusValueMap?: Map<string, string>;
    sampleTypeValueMap?: Map<string, string>;
}

const fieldLabelMap: {
    [key: string]: {
        label: string;
        getValue: (
            point: EmbeddingPoint,
            valueMaps: TooltipFieldValueMaps
        ) => string;
    };
} = {
    patientId: {
        label: 'Patient ID',
        getValue: (point: EmbeddingPoint) => point.patientId || '',
    },
    sampleId: {
        label: 'Sample ID',
        getValue: (point: EmbeddingPoint) => point.sampleId || '',
    },
    position: {
        label: 'Position',
        getValue: (point: EmbeddingPoint) =>
            `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
    },
    category: {
        label: 'Category',
        getValue: (point: EmbeddingPoint) => point.displayLabel || '',
    },
    cancerTypeDetailed: {
        label: 'Cancer Type Detailed',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) =>
            valueMaps.cancerTypeDetailedValueMap?.get(point.patientId || '') ||
            '',
    },
    osMonths: {
        label: 'Overall Survival (Months)',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) => {
            const value = valueMaps.osMonthsValueMap?.get(
                point.patientId || ''
            );
            return value ? `${value} months` : '';
        },
    },
    osStatus: {
        label: 'Overall Survival Status',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) => {
            const value = valueMaps.osStatusValueMap?.get(
                point.patientId || ''
            );
            return value || '';
        },
    },
    sampleType: {
        label: 'Sample Type',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) => {
            const value = valueMaps.sampleTypeValueMap?.get(
                point.patientId || ''
            );
            return value || '';
        },
    },
};

export const TOOLTIP_FIELD_OPTIONS: {
    value: string;
    label: string;
}[] = Object.keys(fieldLabelMap).map(key => ({
    value: key,
    label: fieldLabelMap[key].label,
}));

export const TooltipDisplay: React.FC<TooltipDisplayProps> = ({
    hoveredPoint,
    isPinned,
    onUnpin,
    selectedTooltipFields,
    cancerTypeDetailedValueMap,
    osMonthsValueMap,
    osStatusValueMap,
    sampleTypeValueMap,
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!hoveredPoint) return null;

    const valueMaps: TooltipFieldValueMaps = {
        cancerTypeDetailedValueMap,
        osMonthsValueMap,
        osStatusValueMap,
        sampleTypeValueMap,
    };

    const fields: { label: string; value: string }[] = [];

    selectedTooltipFields?.forEach(field => {
        if (fieldLabelMap[field]) {
            const def = fieldLabelMap[field];
            if (!def) return;
            const value = def.getValue(hoveredPoint, valueMaps);
            if(value!== '') {
                fields.push({ label: def.label, value });
            }
        }
    });

    const handleCopy = () => {
        const text = fields.map(f => `${f.label}: ${f.value}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1,
                pointerEvents: isPinned ? 'auto' : 'none',
                left: '10px',
                bottom: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '320px',
                border: isPinned ? '1px solid rgba(255,255,255,0.4)' : 'none',
            }}
        >
            {isPinned && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '4px',
                        gap: '6px',
                    }}
                >
                    <button
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: copied ? '#4caf50' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontSize: '12px',
                            lineHeight: 1,
                        }}
                    >
                        {copied ? '✓' : '📋'}
                    </button>
                    <button
                        onClick={onUnpin}
                        title="Close"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontSize: '12px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            {fields.map((field, i) => (
                <div key={i}>
                    <strong>{field.label}:</strong> {field.value}
                </div>
            ))}
        </div>
    );
};
