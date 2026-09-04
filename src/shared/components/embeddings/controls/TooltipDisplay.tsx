import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface TooltipFieldValueMaps {
    // Keyed by clinical attribute id (e.g. 'CANCER_TYPE', 'OS_MONTHS').
    clinicalAttributeValueMaps?: Map<string, Map<string, string>>;
    // Keyed by embedding data field name, values keyed by patientId or
    // sampleId depending on the embedding type.
    mapAttributeValueMaps?: Map<string, Map<string, string>>;
    // Keyed by entrez gene id, values keyed by patientId.
    geneValueMaps?: Map<number, Map<string, string>>;
}

export interface TooltipDisplayProps {
    hoveredPoint: EmbeddingPoint | null;
    embeddingType?: 'patients' | 'samples';
    isPinned?: boolean;
    onUnpin?: () => void;
    selectedTooltipFields?: Set<string>;
    colorByLabel?: string;
    // Labels for the fields the user picked from the tooltip fields dropdown
    // (value formats: `clinical_<id>`, `mapattr_<fieldName>`, `gene_<entrezGeneId>`).
    tooltipFieldOptions?: { value: string; label: string }[];
    clinicalAttributeValueMaps?: Map<string, Map<string, string>>;
    mapAttributeValueMaps?: Map<string, Map<string, string>>;
    geneValueMaps?: Map<number, Map<string, string>>;
}

const CLINICAL_ATTRIBUTE_FIELD_PREFIX = 'clinical_';
const MAP_ATTRIBUTE_FIELD_PREFIX = 'mapattr_';
const GENE_FIELD_PREFIX = 'gene_';

const clinicalAttributeValue = (
    clinicalAttributeId: string,
    point: EmbeddingPoint,
    valueMaps: TooltipFieldValueMaps
): string =>
    valueMaps.clinicalAttributeValueMaps
        ?.get(clinicalAttributeId)
        ?.get(point.patientId || '') || '';

// Resolves the value for a dynamically selected (non-fixed) tooltip field,
// dispatching on its value prefix. Returns '' when there's no data.
const dynamicFieldValue = (
    field: string,
    point: EmbeddingPoint,
    embeddingType: 'patients' | 'samples' | undefined,
    valueMaps: TooltipFieldValueMaps
): string => {
    if (field.startsWith(CLINICAL_ATTRIBUTE_FIELD_PREFIX)) {
        return clinicalAttributeValue(
            field.slice(CLINICAL_ATTRIBUTE_FIELD_PREFIX.length),
            point,
            valueMaps
        );
    }
    if (field.startsWith(MAP_ATTRIBUTE_FIELD_PREFIX)) {
        const key = field.slice(MAP_ATTRIBUTE_FIELD_PREFIX.length);
        const id =
            embeddingType === 'samples' ? point.sampleId : point.patientId;
        return valueMaps.mapAttributeValueMaps?.get(key)?.get(id || '') || '';
    }
    if (field.startsWith(GENE_FIELD_PREFIX)) {
        const entrezGeneId = parseInt(
            field.slice(GENE_FIELD_PREFIX.length),
            10
        );
        return (
            valueMaps.geneValueMaps
                ?.get(entrezGeneId)
                ?.get(point.patientId || '') || ''
        );
    }
    return '';
};

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
    cancerType: {
        label: 'Cancer Type',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) =>
            clinicalAttributeValue('CANCER_TYPE', point, valueMaps),
    },
    cancerTypeDetailed: {
        label: 'Cancer Type Detailed',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) =>
            clinicalAttributeValue('CANCER_TYPE_DETAILED', point, valueMaps),
    },
    sampleType: {
        label: 'Sample Type',
        getValue: (point: EmbeddingPoint, valueMaps: TooltipFieldValueMaps) =>
            clinicalAttributeValue('SAMPLE_TYPE', point, valueMaps),
    },
};

// Always shown based on embedding type, not user-toggleable.
const FIXED_FIELD_KEYS = [
    'patientId',
    'sampleId',
    'position',
    'category',
    'cancerType',
    'cancerTypeDetailed',
    'sampleType',
];

export const TooltipDisplay: React.FC<TooltipDisplayProps> = ({
    hoveredPoint,
    embeddingType,
    isPinned,
    onUnpin,
    selectedTooltipFields,
    colorByLabel,
    tooltipFieldOptions,
    clinicalAttributeValueMaps,
    mapAttributeValueMaps,
    geneValueMaps,
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!hoveredPoint) return null;

    const valueMaps: TooltipFieldValueMaps = {
        clinicalAttributeValueMaps,
        mapAttributeValueMaps,
        geneValueMaps,
    };

    const isSampleEmbedding = embeddingType === 'samples';
    // Points outside the queried cohort only carry an id and position - no
    // clinical data exists for them, so don't show fields that would imply
    // otherwise (and drop the id that's just a copy-of-id-as-fallback).
    const isOutOfCohort = hoveredPoint.isInCohort === false;
    const fixedFieldKeys = isOutOfCohort
        ? [isSampleEmbedding ? 'sampleId' : 'patientId', 'position']
        : [
              'patientId',
              ...(isSampleEmbedding ? ['sampleId'] : []),
              'position',
              'category',
              ...(isSampleEmbedding ? ['sampleType'] : []),
              'cancerType',
              'cancerTypeDetailed',
          ];

    const allFields: { label: string; value: string }[] = [];

    fixedFieldKeys.forEach(field => {
        const def = fieldLabelMap[field];
        if (!def) return;
        const value = def.getValue(hoveredPoint, valueMaps);
        if (value !== '') {
            const label =
                field === 'category' && colorByLabel ? colorByLabel : def.label;
            allFields.push({ label, value });
        }
    });

    selectedTooltipFields?.forEach(field => {
        if (isOutOfCohort) return;
        if (FIXED_FIELD_KEYS.includes(field)) return;

        const value = dynamicFieldValue(
            field,
            hoveredPoint,
            embeddingType,
            valueMaps
        );
        if (value !== '') {
            const label =
                tooltipFieldOptions?.find(opt => opt.value === field)?.label ||
                field;
            allFields.push({ label, value });
        }
    });

    // Drop rows that duplicate an earlier one, e.g. "Category" renamed to
    // "Cancer Type Detailed" when that field is also selected separately.
    const seen = new Set<string>();
    const fields = allFields.filter(f => {
        const key = `${f.label}|${f.value}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
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
                maxWidth: '420px',
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
