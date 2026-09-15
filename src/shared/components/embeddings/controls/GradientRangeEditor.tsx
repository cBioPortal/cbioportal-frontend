import * as React from 'react';
import FontAwesome from 'react-fontawesome';
import { CirclePicker } from 'react-color';
import {
    OverlayTrigger as OverlayTriggerUntyped,
    Popover,
} from 'react-bootstrap';
// @types/react-bootstrap 0.32 OverlayTriggerProps has no `children` under @types/react 18.
const OverlayTrigger = OverlayTriggerUntyped as any;
import { ColorPickerIcon } from 'pages/groupComparison/comparisonGroupManager/ColorPickerIcon';
import { COLORS } from 'pages/studyView/StudyViewUtils';

export type RGB = [number, number, number];

// Ported from cbioportal-cell-explorer's colors.ts for visual parity.
export const COLOR_SCALES: Record<string, RGB[]> = {
    viridis: [
        [68, 1, 84],
        [72, 40, 120],
        [62, 74, 137],
        [49, 104, 142],
        [38, 130, 142],
        [31, 158, 137],
        [53, 183, 121],
        [109, 205, 89],
        [180, 222, 44],
        [253, 231, 37],
    ],
    magma: [
        [0, 0, 4],
        [28, 16, 68],
        [79, 18, 123],
        [129, 37, 129],
        [181, 54, 122],
        [229, 89, 100],
        [251, 135, 97],
        [254, 186, 118],
        [254, 227, 165],
        [252, 253, 191],
    ],
    plasma: [
        [13, 8, 135],
        [75, 3, 161],
        [125, 3, 168],
        [168, 34, 150],
        [203, 70, 121],
        [229, 107, 93],
        [248, 148, 65],
        [253, 195, 40],
        [240, 249, 33],
        [240, 249, 33],
    ],
    inferno: [
        [0, 0, 4],
        [22, 11, 57],
        [66, 10, 104],
        [106, 23, 110],
        [147, 38, 103],
        [188, 55, 84],
        [221, 81, 58],
        [243, 118, 27],
        [252, 166, 4],
        [252, 255, 164],
    ],
};

const SCALE_LABELS: Record<string, string> = {
    viridis: 'Viridis',
    magma: 'Magma',
    plasma: 'Plasma',
    inferno: 'Inferno',
};

export interface GradientOverride {
    min: number;
    max: number;
    // Pivot where low/high meet at 50% - a gamma-style skew.
    mid: number;
    lowColor: string;
    highColor: string;
    // Named multi-stop scale, takes precedence over lowColor/highColor.
    scaleName?: string;
}

const PRESETS: { name: string; low: string; high: string }[] = [
    { name: 'Blue - Red', low: '#3182bd', high: '#de2d26' },
    { name: 'Purple - Yellow', low: '#54278f', high: '#feb24c' },
    { name: 'Green - Red', low: '#1a9850', high: '#d73027' },
    { name: 'Grey - Orange', low: '#969696', high: '#e6550d' },
];

const COLOR_SWATCHES = COLORS.slice(0, 16);

function hexToRgb(hex: string): RGB {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbCss([r, g, b]: RGB): string {
    return `rgb(${r}, ${g}, ${b})`;
}

// Normalizes a CSS color (e.g. d3's "rgb(...)") to hex, since GradientOverride's colors are always hex.
function cssColorToHex(css: string): string {
    if (css.startsWith('#')) return css;
    const match = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return css;
    const toHex = (n: string) =>
        parseInt(n, 10)
            .toString(16)
            .padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

// Reuses the existing override's colors, or samples the auto scheme, so dragging a handle doesn't silently switch schemes.
export function seedLowHighColors(
    override: GradientOverride | undefined,
    autoColorFn: ((x: number) => string) | undefined,
    autoMin: number,
    autoMax: number
): { lowColor: string; highColor: string } {
    return {
        lowColor:
            override?.lowColor ||
            (autoColorFn ? cssColorToHex(autoColorFn(autoMin)) : DEFAULT_LOW),
        highColor:
            override?.highColor ||
            (autoColorFn ? cssColorToHex(autoColorFn(autoMax)) : DEFAULT_HIGH),
    };
}

// The [min, max] window for a percentile clip (e.g. (5, 95) discards the bottom/top 5%); undefined if it collapses.
export function pickPercentileRange(
    values: number[],
    lowPercentile: number,
    highPercentile: number
): [number, number] | undefined {
    if (values.length === 0) {
        return undefined;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const pick = (p: number) => {
        const idx = Math.min(
            sorted.length - 1,
            Math.max(0, Math.round((p / 100) * (sorted.length - 1)))
        );
        return sorted[idx];
    };
    const min = pick(lowPercentile);
    const max = pick(highPercentile);
    if (min >= max) {
        return undefined;
    }
    return [min, max];
}

export function getGradientStops(override: GradientOverride): RGB[] {
    if (override.scaleName && COLOR_SCALES[override.scaleName]) {
        return COLOR_SCALES[override.scaleName];
    }
    return [hexToRgb(override.lowColor), hexToRgb(override.highColor)];
}

export function gradientCssFromStops(stops: RGB[]): string {
    const css = stops
        .map((stop, i) => {
            const pct = (i / (stops.length - 1 || 1)) * 100;
            return `${rgbCss(stop)} ${pct.toFixed(0)}%`;
        })
        .join(', ');
    return `linear-gradient(to right, ${css})`;
}

// Preview of the auto (no-override) coloring, sampled from its color function since it isn't necessarily a simple 2-color gradient.
export function gradientCssFromColorFn(
    colorFn: (x: number) => string,
    min: number,
    max: number,
    steps: number = 8
): string {
    const css = Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        const value = min + t * (max - min);
        return `${colorFn(value)} ${(t * 100).toFixed(0)}%`;
    }).join(', ');
    return `linear-gradient(to right, ${css})`;
}

function clamp01(t: number): number {
    return Math.max(0, Math.min(1, t));
}

// 0-1 position along the color axis, with `mid` pinned at 0.5.
function axisPosition(
    x: number,
    min: number,
    mid: number,
    max: number
): number {
    if (x <= mid) {
        const halfRange = mid - min || 1;
        return 0.5 * clamp01((x - min) / halfRange);
    }
    const halfRange = max - mid || 1;
    return 0.5 + 0.5 * clamp01((x - mid) / halfRange);
}

function interpolateStops(t: number, stops: RGB[]): string {
    const clampedT = clamp01(t);
    const idx = clampedT * (stops.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.min(lower + 1, stops.length - 1);
    const frac = idx - lower;
    const r = Math.round(
        stops[lower][0] + (stops[upper][0] - stops[lower][0]) * frac
    );
    const g = Math.round(
        stops[lower][1] + (stops[upper][1] - stops[lower][1]) * frac
    );
    const b = Math.round(
        stops[lower][2] + (stops[upper][2] - stops[lower][2]) * frac
    );
    return `rgb(${r}, ${g}, ${b})`;
}

export function makeGradientColorFn(
    min: number,
    mid: number,
    max: number,
    stops: RGB[]
): (x: number) => string {
    return (x: number) => {
        const t = axisPosition(x, min, mid, max);
        return interpolateStops(t, stops);
    };
}

type HandleKey = 'min' | 'mid' | 'max';

export interface GradientBarHandlesProps {
    autoMin: number;
    autoMax: number;
    min: number;
    mid: number;
    max: number;
    onChange: (next: { min: number; mid: number; max: number }) => void;
}

type RangeValues = { min: number; mid: number; max: number };

export const GradientBarHandles: React.FC<GradientBarHandlesProps> = ({
    autoMin,
    autoMax,
    min,
    mid,
    max,
    onChange,
}) => {
    const layerRef = React.useRef<HTMLDivElement>(null);
    const draggingRef = React.useRef<HandleKey | null>(null);
    const valuesRef = React.useRef<RangeValues>({ min, mid, max });
    // Avoids calling a stale onChange from a memoized closure.
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    // Tracks the pointer instantly; the (debounced) commit lags behind it.
    const [liveValues, setLiveValues] = React.useState<RangeValues>({
        min,
        mid,
        max,
    });
    const [activeHandle, setActiveHandle] = React.useState<HandleKey | null>(
        null
    );
    const [isBusy, setIsBusy] = React.useState(false);
    React.useEffect(() => {
        if (!draggingRef.current) {
            valuesRef.current = { min, mid, max };
            setLiveValues({ min, mid, max });
        }
    }, [min, mid, max]);

    const autoRange = autoMax - autoMin || 1;
    const toPct = (v: number) => clamp01((v - autoMin) / autoRange) * 100;

    const valueAtClientX = (clientX: number): number => {
        const layer = layerRef.current;
        if (!layer) return autoMin;
        const rect = layer.getBoundingClientRect();
        const t = clamp01((clientX - rect.left) / rect.width);
        return autoMin + t * autoRange;
    };

    // Debounce commits during drag - a full-plot recolor is too expensive on every pointermove.
    const COMMIT_DEBOUNCE_MS = 150;
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = React.useRef<RangeValues | null>(null);

    const commitNow = React.useCallback((next: RangeValues) => {
        pendingRef.current = null;
        onChangeRef.current(next);
        // Let the re-render paint before clearing the busy indicator.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setIsBusy(false))
        );
    }, []);

    const scheduleCommit = React.useCallback(
        (next: RangeValues) => {
            pendingRef.current = next;
            setIsBusy(true);
            if (timeoutRef.current != null) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                if (pendingRef.current) {
                    commitNow(pendingRef.current);
                }
            }, COMMIT_DEBOUNCE_MS);
        },
        [commitNow]
    );

    const onPointerMove = React.useCallback((e: PointerEvent) => {
        const handle = draggingRef.current;
        if (!handle) return;
        const value = valueAtClientX(e.clientX);
        const current = valuesRef.current;
        const next = { ...current };
        if (handle === 'min') {
            next.min = Math.min(value, current.mid);
        } else if (handle === 'max') {
            next.max = Math.max(value, current.mid);
        } else {
            next.mid = Math.max(current.min, Math.min(current.max, value));
        }
        valuesRef.current = next;
        setLiveValues(next);
        scheduleCommit(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopDragging = React.useCallback(() => {
        draggingRef.current = null;
        setActiveHandle(null);
        if (timeoutRef.current != null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (pendingRef.current) {
            commitNow(pendingRef.current);
        } else {
            setIsBusy(false);
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stopDragging);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onPointerMove]);

    const startDragging = (handle: HandleKey) => (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        draggingRef.current = handle;
        setActiveHandle(handle);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', stopDragging);
    };

    React.useEffect(() => {
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', stopDragging);
            if (timeoutRef.current != null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [onPointerMove, stopDragging]);

    const handleStyle = (pct: number): React.CSSProperties => ({
        position: 'absolute',
        left: `${pct}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        border: '1px solid #666',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
        cursor: 'ew-resize',
        touchAction: 'none',
        pointerEvents: 'auto',
    });

    const valueLabel = (pct: number, value: number) => (
        <div
            style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '-16px',
                transform: 'translateX(-50%)',
                background: '#333',
                color: '#fff',
                fontSize: '10px',
                lineHeight: 1,
                padding: '2px 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
            }}
        >
            {value.toFixed(2)}
        </div>
    );

    return (
        <div
            ref={layerRef}
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            {isBusy && (
                <div
                    title="Updating colors..."
                    style={{
                        position: 'absolute',
                        right: '-16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '10px',
                        color: '#666',
                    }}
                >
                    <FontAwesome name="spinner" spin />
                </div>
            )}
            {activeHandle &&
                valueLabel(
                    toPct(liveValues[activeHandle]),
                    liveValues[activeHandle]
                )}
            <div
                title={`Min: ${liveValues.min.toFixed(2)}`}
                onPointerDown={startDragging('min')}
                style={handleStyle(toPct(liveValues.min))}
            />
            <div
                title={`Center: ${liveValues.mid.toFixed(2)}`}
                onPointerDown={startDragging('mid')}
                style={{
                    ...handleStyle(toPct(liveValues.mid)),
                    width: '8px',
                    height: '8px',
                    background: '#333',
                    border: '1px solid #333',
                }}
            />
            <div
                title={`Max: ${liveValues.max.toFixed(2)}`}
                onPointerDown={startDragging('max')}
                style={handleStyle(toPct(liveValues.max))}
            />
        </div>
    );
};

export interface GradientRangeEditorProps {
    autoMin: number;
    autoMax: number;
    override: GradientOverride | undefined;
    onChange: (override: GradientOverride) => void;
    onReset: () => void;
    onClipToPercentile: (lowPercentile: number, highPercentile: number) => void;
    // Shown when no override is active, so seed colors for customizing match it exactly.
    autoColorFn?: (x: number) => string;
    // The draggable bar + histogram, rendered at the top of the popover.
    children?: React.ReactNode;
}

export const DEFAULT_LOW = '#3182bd';
export const DEFAULT_HIGH = '#de2d26';

const ColorSwatchPicker: React.FC<{
    label: string;
    color: string;
    onChange: (hex: string) => void;
}> = ({ label, color, onChange }) => {
    const popover = (
        <Popover id={`gradient-color-popover-${label}`}>
            <CirclePicker
                colors={COLOR_SWATCHES}
                circleSize={20}
                circleSpacing={3}
                width="140px"
                color={color}
                onChangeComplete={(c: { hex: string }) => onChange(c.hex)}
            />
        </Popover>
    );
    return (
        <div>
            <div
                style={{ fontSize: '11px', marginBottom: '3px', color: '#666' }}
            >
                {label}
            </div>
            <OverlayTrigger
                trigger="click"
                placement="left"
                overlay={popover}
                rootClose={true}
            >
                <span
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                >
                    <ColorPickerIcon color={color} />
                </span>
            </OverlayTrigger>
        </div>
    );
};

const popoverDivider: React.CSSProperties = {
    height: '1px',
    background: '#eee',
    margin: '10px 0',
};

export const GradientRangeEditor: React.FC<GradientRangeEditorProps> = ({
    autoMin,
    autoMax,
    override,
    onChange,
    onReset,
    onClipToPercentile,
    autoColorFn,
    children,
}) => {
    const { lowColor: low, highColor: high } = seedLowHighColors(
        override,
        autoColorFn,
        autoMin,
        autoMax
    );
    const min = override?.min ?? autoMin;
    const max = override?.max ?? autoMax;
    const mid = override?.mid ?? (autoMin + autoMax) / 2;

    const popover = (
        <Popover
            id="embedding-gradient-range-popover"
            style={{ maxWidth: 'none' }}
        >
            <div style={{ width: '220px', padding: '2px' }}>
                <ClipControls
                    override={override}
                    onClipToPercentile={onClipToPercentile}
                    onReset={onReset}
                />
                <div style={popoverDivider} />
                {children}
                <div style={popoverDivider} />
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '10px',
                    }}
                >
                    <ColorSwatchPicker
                        label="Low color"
                        color={low}
                        onChange={hex =>
                            onChange({
                                min,
                                mid,
                                max,
                                lowColor: hex,
                                highColor: high,
                                scaleName: undefined,
                            })
                        }
                    />
                    <ColorSwatchPicker
                        label="High color"
                        color={high}
                        onChange={hex =>
                            onChange({
                                min,
                                mid,
                                max,
                                lowColor: low,
                                highColor: hex,
                                scaleName: undefined,
                            })
                        }
                    />
                </div>

                <div
                    style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '4px',
                    }}
                >
                    Presets
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '10px',
                    }}
                >
                    {PRESETS.map(preset => (
                        <div
                            key={preset.name}
                            onClick={() =>
                                onChange({
                                    min,
                                    mid,
                                    max,
                                    lowColor: preset.low,
                                    highColor: preset.high,
                                    scaleName: undefined,
                                })
                            }
                            title={preset.name}
                            style={{
                                height: '16px',
                                borderRadius: '3px',
                                border: '1px solid #ddd',
                                cursor: 'pointer',
                                background: gradientCssFromStops([
                                    hexToRgb(preset.low),
                                    hexToRgb(preset.high),
                                ]),
                            }}
                        />
                    ))}
                </div>

                <div
                    style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '4px',
                    }}
                >
                    Perceptual scales
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '10px',
                    }}
                >
                    {Object.keys(COLOR_SCALES).map(scaleName => (
                        <div
                            key={scaleName}
                            onClick={() =>
                                onChange({
                                    min,
                                    mid,
                                    max,
                                    lowColor: low,
                                    highColor: high,
                                    scaleName,
                                })
                            }
                            title={SCALE_LABELS[scaleName] || scaleName}
                            style={{
                                height: '16px',
                                borderRadius: '3px',
                                border:
                                    override?.scaleName === scaleName
                                        ? '2px solid #333'
                                        : '1px solid #ddd',
                                cursor: 'pointer',
                                background: gradientCssFromStops(
                                    COLOR_SCALES[scaleName]
                                ),
                            }}
                        />
                    ))}
                </div>

                {override && (
                    <button
                        onClick={onReset}
                        style={{
                            width: '100%',
                            fontSize: '11px',
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            background: '#f8f9fa',
                            cursor: 'pointer',
                        }}
                    >
                        Reset to auto range
                    </button>
                )}
            </div>
        </Popover>
    );

    return (
        <OverlayTrigger
            trigger="click"
            placement="left"
            overlay={popover}
            rootClose={true}
        >
            <span
                title="Edit color range"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    marginLeft: '6px',
                    borderRadius: '3px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    background: override ? '#e9ecef' : '#f8f9fa',
                    color: '#666',
                    fontSize: '10px',
                    flexShrink: 0,
                }}
            >
                <FontAwesome name="cog" />
            </span>
        </OverlayTrigger>
    );
};

export interface ClipControlsProps {
    override: GradientOverride | undefined;
    onClipToPercentile: (lowPercentile: number, highPercentile: number) => void;
    onReset: () => void;
}

const clipButtonStyle: React.CSSProperties = {
    fontSize: '11px',
    padding: '2px 6px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    background: '#f8f9fa',
    color: '#666',
    cursor: 'pointer',
};

const clipInputStyle: React.CSSProperties = {
    width: '44px',
    fontSize: '11px',
    padding: '1px 3px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    boxSizing: 'border-box',
};

export const ClipControls: React.FC<ClipControlsProps> = ({
    override,
    onClipToPercentile,
    onReset,
}) => {
    const [lowPct, setLowPct] = React.useState('1');
    const [highPct, setHighPct] = React.useState('99');

    const applyCustom = () => {
        const low = parseFloat(lowPct);
        const high = parseFloat(highPct);
        if (
            !isNaN(low) &&
            !isNaN(high) &&
            low < high &&
            low >= 0 &&
            high <= 100
        ) {
            onClipToPercentile(low, high);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginLeft: '8px',
                marginBottom: '6px',
            }}
        >
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={onReset}
                    title="Show the full data range"
                    style={clipButtonStyle}
                >
                    Full range
                </button>
                <button
                    onClick={() => onClipToPercentile(1, 99)}
                    title="Clip outliers by setting the range to this percentile of the actual data"
                    style={clipButtonStyle}
                >
                    Clip 1-99%
                </button>
                <button
                    onClick={() => onClipToPercentile(5, 95)}
                    title="Clip outliers by setting the range to this percentile of the actual data"
                    style={clipButtonStyle}
                >
                    Clip 5-95%
                </button>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#666',
                }}
            >
                <span>Custom:</span>
                <input
                    type="number"
                    min={0}
                    max={100}
                    value={lowPct}
                    onChange={e => setLowPct(e.target.value)}
                    onBlur={applyCustom}
                    onKeyDown={e => e.key === 'Enter' && applyCustom()}
                    style={clipInputStyle}
                />
                <span>-</span>
                <input
                    type="number"
                    min={0}
                    max={100}
                    value={highPct}
                    onChange={e => setHighPct(e.target.value)}
                    onBlur={applyCustom}
                    onKeyDown={e => e.key === 'Enter' && applyCustom()}
                    style={clipInputStyle}
                />
                <span>%</span>
                {override && (
                    <span style={{ marginLeft: '4px' }}>
                        ({override.min.toFixed(2)} - {override.max.toFixed(2)})
                    </span>
                )}
            </div>
        </div>
    );
};

export default GradientRangeEditor;
