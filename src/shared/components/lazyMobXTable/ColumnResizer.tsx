import React, { useCallback, useEffect, useRef } from 'react';

export interface IColumnResizerProps {
    className?: string;
    minWidth?: number;
}

interface IDragState {
    startX: number;
    prev: HTMLElement;
    next: HTMLElement;
    prevStartWidth: number;
    nextStartWidth: number;
}

const DEFAULT_MIN_WIDTH = 0;

const resizerStyle: React.CSSProperties = {
    cursor: 'ew-resize',
    userSelect: 'none',
};

function pointerX(event: MouseEvent | TouchEvent): number | undefined {
    if ('touches' in event) {
        const touch = event.touches[0] || event.changedTouches[0];
        return touch ? touch.clientX : undefined;
    }
    return event.clientX;
}

/**
 * A thin table cell placed between two sibling cells. Dragging it
 * horizontally moves width from one neighbour to the other, keeping
 * both at or above minWidth.
 */
const ColumnResizer: React.FunctionComponent<IColumnResizerProps> = ({
    className,
    minWidth = DEFAULT_MIN_WIDTH,
}) => {
    const cellRef = useRef<HTMLTableCellElement>(null);
    const dragRef = useRef<IDragState | null>(null);
    const minWidthRef = useRef(minWidth);
    minWidthRef.current = minWidth;

    const onMove = useCallback((event: MouseEvent | TouchEvent) => {
        const drag = dragRef.current;
        const x = pointerX(event);
        if (!drag || x === undefined) {
            return;
        }
        if (event.cancelable) {
            event.preventDefault();
        }
        const min = minWidthRef.current;
        const delta = Math.min(
            Math.max(x - drag.startX, min - drag.prevStartWidth),
            drag.nextStartWidth - min
        );
        drag.prev.style.width = `${Math.max(
            min,
            drag.prevStartWidth + delta
        )}px`;
        drag.next.style.width = `${Math.max(
            min,
            drag.nextStartWidth - delta
        )}px`;
    }, []);

    const endDrag = useCallback(() => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('touchcancel', endDrag);
    }, [onMove]);

    const startDrag = useCallback(
        (x: number) => {
            const cell = cellRef.current;
            const prev = cell?.previousElementSibling as HTMLElement | null;
            const next = cell?.nextElementSibling as HTMLElement | null;
            if (!prev || !next) {
                return;
            }
            endDrag();
            dragRef.current = {
                startX: x,
                prev,
                next,
                prevStartWidth: prev.clientWidth,
                nextStartWidth: next.clientWidth,
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
            document.addEventListener('touchcancel', endDrag);
        },
        [onMove, endDrag]
    );

    useEffect(() => endDrag, [endDrag]);

    const onMouseDown = useCallback(
        (event: React.MouseEvent<HTMLTableCellElement>) => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            startDrag(event.clientX);
        },
        [startDrag]
    );

    const onTouchStart = useCallback(
        (event: React.TouchEvent<HTMLTableCellElement>) => {
            const touch = event.touches[0];
            if (touch) {
                startDrag(touch.clientX);
            }
        },
        [startDrag]
    );

    return (
        <td
            ref={cellRef}
            className={className}
            style={resizerStyle}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        />
    );
};

export default ColumnResizer;
