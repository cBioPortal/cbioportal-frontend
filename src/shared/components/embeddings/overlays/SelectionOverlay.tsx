import * as React from 'react';

export interface SelectionOutlineShape {
    id: number;
    color: string;
    /** Screen coordinates; the caller projects them. */
    path: Array<{ x: number; y: number }>;
}

export interface SelectionOverlayProps {
    isSelecting: boolean;
    selectionMode: 'none' | 'lasso';
    selectionPath: Array<{ x: number; y: number }>;
    /**
     * Lassos already committed to a selection, kept on the map so it stays
     * visible which region each selection was drawn around.
     */
    committedOutlines?: SelectionOutlineShape[];
}

const toPathData = (path: Array<{ x: number; y: number }>) =>
    `M ${path[0].x} ${path[0].y} ` +
    path
        .slice(1)
        .map(p => `L ${p.x} ${p.y}`)
        .join(' ') +
    ' Z';

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    isSelecting,
    selectionMode,
    selectionPath,
    committedOutlines,
}) => {
    const drawing =
        isSelecting && selectionMode === 'lasso' && selectionPath.length >= 2;
    const outlines = (committedOutlines || []).filter(o => o.path.length >= 3);
    if (!drawing && outlines.length === 0) {
        return null;
    }

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        >
            {outlines.map(outline => (
                <path
                    key={outline.id}
                    data-test="embeddings-selection-outline"
                    d={toPathData(outline.path)}
                    fill="none"
                    stroke={outline.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    opacity={0.85}
                />
            ))}
            {drawing && (
                <path
                    d={toPathData(selectionPath)}
                    fill="rgba(0, 123, 255, 0.1)"
                    stroke="#007bff"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                />
            )}
        </svg>
    );
};
