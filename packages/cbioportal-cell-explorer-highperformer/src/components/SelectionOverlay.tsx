import * as React from 'react';
import { useRef, useCallback, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { simplifyPolygon } from '../utils/selectionGeometry';

interface SelectionOverlayProps {
    deckRef: React.RefObject<any>;
}

const LASSO_MIN_DISTANCE_SQ = 25; // 5px squared

export default function SelectionOverlay({ deckRef }: SelectionOverlayProps) {
    const selectionTool = useAppStore(s => s.selectionTool);
    const commitSelection = useAppStore(s => s.commitSelection);

    const selectionRectRef = useRef<HTMLDivElement>(null);
    const lassoSvgRef = useRef<SVGSVGElement>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragEndRef = useRef<{ x: number; y: number } | null>(null);
    const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);

    const updateSelectionRect = useCallback(() => {
        const el = selectionRectRef.current;
        const start = dragStartRef.current;
        const end = dragEndRef.current;
        if (!el || !start || !end) {
            if (el) el.style.display = 'none';
            return;
        }
        el.style.display = 'block';
        el.style.left = `${Math.min(start.x, end.x)}px`;
        el.style.top = `${Math.min(start.y, end.y)}px`;
        el.style.width = `${Math.abs(end.x - start.x)}px`;
        el.style.height = `${Math.abs(end.y - start.y)}px`;
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (selectionTool === 'pan') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            if (selectionTool === 'rectangle') {
                dragStartRef.current = pos;
                dragEndRef.current = pos;
                updateSelectionRect();
            } else if (selectionTool === 'lasso') {
                lassoPointsRef.current = [pos];
                const svg = lassoSvgRef.current;
                if (svg) {
                    svg.style.display = 'block';
                    svg.querySelector('polyline')?.setAttribute(
                        'points',
                        `${pos.x},${pos.y}`
                    );
                }
            }
        },
        [selectionTool, updateSelectionRect]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (selectionTool === 'pan') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            if (selectionTool === 'rectangle') {
                if (!dragStartRef.current) return;
                dragEndRef.current = pos;
                updateSelectionRect();
            } else if (selectionTool === 'lasso') {
                if (lassoPointsRef.current.length === 0) return;
                const last =
                    lassoPointsRef.current[lassoPointsRef.current.length - 1];
                if (
                    (pos.x - last.x) ** 2 + (pos.y - last.y) ** 2 <
                    LASSO_MIN_DISTANCE_SQ
                )
                    return;
                lassoPointsRef.current.push(pos);
                const svg = lassoSvgRef.current;
                if (svg) {
                    const pointsStr = lassoPointsRef.current
                        .map(p => `${p.x},${p.y}`)
                        .join(' ');
                    svg.querySelector('polyline')?.setAttribute(
                        'points',
                        pointsStr
                    );
                }
            }
        },
        [selectionTool, updateSelectionRect]
    );

    const handleMouseUp = useCallback(() => {
        if (selectionTool === 'pan') return;

        // Access viewport for screen -> data coordinate conversion
        const deck = deckRef.current?.deck;
        const viewport = deck?.getViewports()?.[0];
        if (!viewport) return;

        if (selectionTool === 'rectangle') {
            if (!dragStartRef.current || !dragEndRef.current) return;
            const start = dragStartRef.current;
            const end = dragEndRef.current;
            const [wx1, wy1] = viewport.unproject([start.x, start.y]);
            const [wx2, wy2] = viewport.unproject([end.x, end.y]);
            const minWx = Math.min(wx1, wx2);
            const maxWx = Math.max(wx1, wx2);
            const minWy = Math.min(wy1, wy2);
            const maxWy = Math.max(wy1, wy2);
            const polygon: [number, number][] = [
                [minWx, minWy],
                [maxWx, minWy],
                [maxWx, maxWy],
                [minWx, maxWy],
            ];
            commitSelection(polygon, 'rectangle');
            dragStartRef.current = null;
            dragEndRef.current = null;
            updateSelectionRect();
        } else if (selectionTool === 'lasso') {
            const lassoPoints = lassoPointsRef.current;
            if (lassoPoints.length < 3) {
                lassoPointsRef.current = [];
                const svg = lassoSvgRef.current;
                if (svg) svg.style.display = 'none';
                return;
            }
            const worldPolygon = lassoPoints.map(
                p => viewport.unproject([p.x, p.y]) as [number, number]
            );
            commitSelection(simplifyPolygon(worldPolygon), 'lasso');
            lassoPointsRef.current = [];
            const svg = lassoSvgRef.current;
            if (svg) svg.style.display = 'none';
        }
    }, [selectionTool, deckRef, commitSelection, updateSelectionRect]);

    // Escape key returns to pan mode
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                useAppStore.getState().setSelectionTool('pan');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    if (selectionTool === 'pan') return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                cursor: 'crosshair',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Rectangle overlay */}
            <div
                ref={selectionRectRef}
                style={{
                    display: 'none',
                    position: 'absolute',
                    backgroundColor: 'rgba(24, 144, 255, 0.15)',
                    border: '1px solid rgba(24, 144, 255, 0.6)',
                    pointerEvents: 'none',
                }}
            />
            {/* Lasso SVG overlay */}
            <svg
                ref={lassoSvgRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    display: 'none',
                }}
            >
                <polyline
                    fill="rgba(24, 144, 255, 0.15)"
                    stroke="rgba(24, 144, 255, 0.6)"
                    strokeWidth="1"
                    points=""
                />
            </svg>
        </div>
    );
}
