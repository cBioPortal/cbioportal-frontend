import * as React from 'react';
import { MapSelectionSummary } from '../state/MapSelection';

export interface SelectionListProps {
    selections: MapSelectionSummary[];
    onRemove: (id: number) => void;
    onClear: () => void;
    /**
     * Absent where the page cannot open a group comparison. Enabled from two
     * selections, which is the fewest a comparison can be made of.
     */
    onCompare?: () => void;
    isComparing?: boolean;
    /** Shown in place of the chips while a lasso has yet to be drawn. */
    emptyHint?: string;
}

const BOX_STYLE: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

/** The status bar's colours for a live selection, so the two read as one state. */
const ACTIVE_BOX_STYLE: React.CSSProperties = {
    ...BOX_STYLE,
    backgroundColor: '#fff8e1',
    border: '1px solid #ffe082',
};

const ROW_LABEL_STYLE: React.CSSProperties = {
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#888',
    lineHeight: '12px',
};

export const SelectionList: React.FC<SelectionListProps> = ({
    selections,
    onRemove,
    onClear,
    onCompare,
    isComparing,
    emptyHint,
}) => {
    if (selections.length === 0) {
        return emptyHint ? (
            <div style={{ width: '190px' }}>
                <span style={{ ...ROW_LABEL_STYLE, paddingLeft: '2px' }}>
                    Selections
                </span>
                <div
                    data-test="embeddings-selection-hint"
                    style={{
                        ...BOX_STYLE,
                        marginTop: '2px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        color: '#888',
                    }}
                >
                    {emptyHint}
                </div>
            </div>
        ) : null;
    }

    const canCompare = !!onCompare && selections.length > 1;
    return (
        <div style={{ width: '190px' }}>
            <span style={{ ...ROW_LABEL_STYLE, paddingLeft: '2px' }}>
                Selections
            </span>
            <div
                data-test="embeddings-selection-list"
                style={{
                    ...ACTIVE_BOX_STYLE,
                    marginTop: '2px',
                    padding: '4px',
                }}
            >
                {selections.map(selection => (
                    <div
                        key={selection.id}
                        data-test="embeddings-selection-chip"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '2px 2px 2px 4px',
                            fontSize: '11px',
                        }}
                    >
                        <span
                            style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '2px',
                                backgroundColor: selection.color,
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                            title={selection.name}
                        >
                            {selection.name}
                        </span>
                        <span style={{ color: '#888' }}>
                            {selection.count.toLocaleString()}
                        </span>
                        <button
                            data-test="embeddings-selection-remove"
                            onClick={() => onRemove(selection.id)}
                            title={`Remove ${selection.name}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '0 2px',
                                lineHeight: 1,
                                fontSize: '13px',
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                    <button
                        data-test="embeddings-selection-clear"
                        onClick={onClear}
                        title="Remove every selection on this map"
                        style={{
                            ...BOX_STYLE,
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                        }}
                    >
                        Clear
                    </button>
                    {onCompare && (
                        <button
                            data-test="embeddings-selection-compare"
                            onClick={onCompare}
                            disabled={!canCompare || isComparing}
                            title={
                                canCompare
                                    ? 'Compare these selections as groups'
                                    : 'Draw a second selection to compare'
                            }
                            style={{
                                ...BOX_STYLE,
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '11px',
                                cursor:
                                    canCompare && !isComparing
                                        ? 'pointer'
                                        : 'default',
                                color: canCompare ? '#333' : '#aaa',
                            }}
                        >
                            {isComparing ? 'Opening…' : 'Compare'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
