import * as React from 'react';

export interface SelectionOverlayProps {
    isSelecting: boolean;
    selectionMode: 'none' | 'rectangle';
    selectionStart?: { x: number; y: number };
    selectionEnd?: { x: number; y: number };
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    isSelecting,
    selectionMode,
    selectionStart,
    selectionEnd,
}) => {
    if (
        !isSelecting ||
        selectionMode !== 'rectangle' ||
        !selectionStart ||
        !selectionEnd
    ) {
        return null;
    }

    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return (
        <div
            style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: '2px dashed #007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        />
    );
};
