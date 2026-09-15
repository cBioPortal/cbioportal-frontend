import * as React from 'react';
import { observer } from 'mobx-react';
import {
    DEFAULT_COLOR,
    DEFAULT_LAYER,
    WsiAnnotationController,
    WsiAnnotationTool,
} from './wsiAnnotationController';
import { WsiAnnotation } from './wsiViewerTypes';

const colors = {
    blue: '#2986e2',
    border: '#ddd',
    muted: '#737373',
    text: '#333',
} as const;

const tools: Array<{
    name: Exclude<WsiAnnotationTool, null>;
    label: string;
    icon: string;
    hint: string;
}> = [
    {
        name: 'rectangle',
        label: 'Rect',
        icon: '◻',
        hint: 'Draw a rectangle — click and drag on the slide',
    },
    {
        name: 'ellipse',
        label: 'Ellipse',
        icon: '⬭',
        hint: 'Draw an ellipse — click and drag on the slide',
    },
    {
        name: 'circle',
        label: 'Circle',
        icon: '○',
        hint: 'Draw a circle — click and drag from center',
    },
    {
        name: 'line',
        label: 'Line',
        icon: '╱',
        hint: 'Draw a line — click and drag on the slide',
    },
    {
        name: 'polygon',
        label: 'Poly',
        icon: '⬡',
        hint: 'Draw a polygon — click to add points, double-click to close',
    },
];

export const WsiAnnotationToolbar = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        const [showAddColor, setShowAddColor] = React.useState(false);
        const [newColorName, setNewColorName] = React.useState('');
        const [newColorHex, setNewColorHex] = React.useState('#ff0000');

        if (!controller || !controller.visible) return null;

        const saveColor = () => {
            controller.addNamedColor(
                newColorName.trim() || newColorHex,
                newColorHex
            );
            setNewColorName('');
            setShowAddColor(false);
        };

        return (
            <div
                data-testid="wsi-annotation-toolbar"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    padding: '4px 10px 4px 44px',
                    background: 'rgba(250,250,250,0.92)',
                    borderBottom: `1px solid ${colors.border}`,
                    fontSize: 11,
                    backdropFilter: 'blur(2px)',
                    zIndex: 20,
                }}
            >
                {tools.map(tool => {
                    const active = controller.activeTool === tool.name;
                    return (
                        <button
                            key={tool.name}
                            data-testid={`annotation-tool-${tool.name}`}
                            title={active ? 'Cancel drawing (Esc)' : tool.hint}
                            aria-pressed={active}
                            onClick={() =>
                                controller.setTool(active ? null : tool.name)
                            }
                            style={{
                                padding: '2px 9px',
                                fontSize: 11,
                                cursor: 'pointer',
                                borderRadius: 3,
                                lineHeight: '18px',
                                border: `1px solid ${
                                    active ? '#c0392b' : colors.border
                                }`,
                                background: active ? '#fde8e8' : '#fff',
                                color: active ? '#c0392b' : colors.muted,
                                fontWeight: active ? 600 : 400,
                            }}
                        >
                            {active
                                ? '✕ Cancel draw'
                                : `${tool.icon} ${tool.label}`}
                        </button>
                    );
                })}
                <span
                    style={{
                        width: 1,
                        height: 16,
                        background: colors.border,
                        margin: '0 2px',
                    }}
                />
                <span
                    style={{
                        fontSize: 10,
                        color: colors.muted,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Color:
                </span>
                {controller.namedColors.map(color => {
                    const active =
                        controller.activeColor === color.hex &&
                        controller.activeColorName === color.name;
                    return (
                        <span
                            key={`${color.name}|${color.hex}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <button
                                data-testid={`annotation-color-${color.name ||
                                    color.hex}`}
                                title={`Color: ${color.name || color.hex}`}
                                aria-pressed={active}
                                onClick={() =>
                                    controller.setActiveNamedColor(
                                        color.name,
                                        color.hex
                                    )
                                }
                                style={{
                                    fontSize: 10,
                                    padding: '1px 7px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    background: active ? color.hex : '#fff',
                                    color: active ? '#fff' : color.hex,
                                    border: `1.5px solid ${color.hex}`,
                                    fontWeight: active ? 700 : 400,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {color.name || color.hex}
                            </button>
                            <button
                                title={`Remove "${color.name ||
                                    color.hex}" from palette`}
                                onClick={() =>
                                    controller.removeNamedColor(
                                        color.name,
                                        color.hex
                                    )
                                }
                                style={{
                                    fontSize: 8,
                                    padding: '0 2px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#bbb',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </span>
                    );
                })}
                {!showAddColor ? (
                    <button
                        data-testid="add-annotation-color"
                        title="Add new named color to palette"
                        onClick={() => setShowAddColor(true)}
                        style={{
                            fontSize: 12,
                            padding: '0 5px',
                            border: `1px dashed ${colors.border}`,
                            background: '#fff',
                            color: colors.muted,
                            borderRadius: 10,
                            cursor: 'pointer',
                        }}
                    >
                        +
                    </button>
                ) : (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '1px 5px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 10,
                            background: '#fff',
                        }}
                    >
                        <input
                            aria-label="Custom annotation color"
                            type="color"
                            value={newColorHex}
                            onChange={event =>
                                setNewColorHex(event.target.value)
                            }
                            style={{
                                width: 20,
                                height: 16,
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                            }}
                        />
                        <input
                            aria-label="Custom annotation color name"
                            value={newColorName}
                            placeholder="Name (optional)"
                            maxLength={20}
                            autoFocus
                            onChange={event =>
                                setNewColorName(event.target.value)
                            }
                            onKeyDown={event => {
                                if (event.key === 'Enter') saveColor();
                                if (event.key === 'Escape')
                                    setShowAddColor(false);
                            }}
                            style={{
                                width: 90,
                                border: 'none',
                                outline: 'none',
                                fontSize: 10,
                            }}
                        />
                        <button
                            data-testid="save-annotation-color"
                            title="Add color to palette"
                            onClick={saveColor}
                            style={{
                                border: `1px solid ${colors.blue}`,
                                borderRadius: 8,
                                background: colors.blue,
                                color: '#fff',
                                fontSize: 10,
                            }}
                        >
                            Add
                        </button>
                        <button
                            title="Cancel"
                            onClick={() => setShowAddColor(false)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: colors.muted,
                            }}
                        >
                            ✕
                        </button>
                    </span>
                )}
            </div>
        );
    }
);

export const WsiAnnotationLayersPanel = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        const [showAddLayer, setShowAddLayer] = React.useState(false);
        const [newLayer, setNewLayer] = React.useState('');
        if (!controller || !controller.visible) return null;

        const reset = () => {
            setNewLayer('');
            setShowAddLayer(false);
        };
        const addLayer = () => {
            controller.addLayer(newLayer);
            reset();
        };

        return (
            <div data-testid="wsi-annotation-layers" style={{ marginTop: 6 }}>
                {controller.layerNames.map(layer => {
                    const hidden = controller.hiddenLayerNames.has(layer);
                    const active = controller.activeLayer === layer;
                    const count =
                        controller.annotationsByLayer.get(layer)?.length || 0;
                    return (
                        <div
                            key={layer}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 0',
                            }}
                        >
                            <button
                                data-testid={`layer-toggle-${layer}`}
                                aria-label={`${
                                    hidden ? 'Show' : 'Hide'
                                } ${layer} layer`}
                                title={
                                    hidden
                                        ? `Show layer "${layer}"`
                                        : `Hide layer "${layer}"`
                                }
                                onClick={() =>
                                    controller.toggleLayerVisibility(layer)
                                }
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: hidden ? colors.muted : colors.blue,
                                    cursor: 'pointer',
                                    padding: '0 2px',
                                    width: 18,
                                }}
                            >
                                <i
                                    className={`fa ${
                                        hidden ? 'fa-eye-slash' : 'fa-eye'
                                    }`}
                                />
                            </button>
                            <button
                                data-testid={`layer-select-${layer}`}
                                title={`Draw on layer "${layer}"`}
                                aria-pressed={active}
                                onClick={() => controller.setActiveLayer(layer)}
                                style={{
                                    flex: 1,
                                    textAlign: 'left',
                                    fontSize: 11,
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    border: `1.5px solid ${
                                        active ? colors.blue : colors.border
                                    }`,
                                    background: active
                                        ? colors.blue
                                        : 'transparent',
                                    color: active
                                        ? '#fff'
                                        : hidden
                                        ? colors.muted
                                        : colors.text,
                                    fontWeight: active ? 700 : 400,
                                    textDecoration: hidden
                                        ? 'line-through'
                                        : 'none',
                                    opacity: hidden ? 0.55 : 1,
                                }}
                            >
                                {layer}
                            </button>
                            <span
                                style={{
                                    minWidth: 14,
                                    textAlign: 'right',
                                    color: colors.muted,
                                    fontSize: 10,
                                }}
                            >
                                {count}
                            </span>
                            {layer !== DEFAULT_LAYER && (
                                <button
                                    data-testid={`delete-layer-${layer}`}
                                    title={`Delete layer "${layer}"`}
                                    onClick={() => {
                                        if (
                                            count > 0 &&
                                            !window.confirm(
                                                `Delete layer "${layer}" and ${count} associated annotation${
                                                    count === 1 ? '' : 's'
                                                }?`
                                            )
                                        ) {
                                            return;
                                        }
                                        void controller.deleteLayer(layer);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#c0392b',
                                        cursor: 'pointer',
                                        padding: '0 2px',
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}
                {!showAddLayer ? (
                    <button
                        data-testid="add-layer-btn"
                        title="Add new annotation layer"
                        onClick={() => setShowAddLayer(true)}
                        style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '1px 8px',
                            border: `1px dashed ${colors.border}`,
                            borderRadius: 3,
                            background: 'transparent',
                            color: colors.muted,
                            fontSize: 11,
                        }}
                    >
                        + Add layer
                    </button>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            marginTop: 4,
                        }}
                    >
                        <input
                            data-testid="add-layer-input"
                            value={newLayer}
                            placeholder="Layer name"
                            maxLength={30}
                            autoFocus
                            onChange={event => setNewLayer(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') addLayer();
                                if (event.key === 'Escape') reset();
                            }}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 11,
                                padding: '1px 5px',
                            }}
                        />
                        <button
                            data-testid="add-layer-confirm"
                            onClick={addLayer}
                            style={{
                                border: `1px solid ${colors.blue}`,
                                borderRadius: 3,
                                background: colors.blue,
                                color: '#fff',
                                fontSize: 11,
                            }}
                        >
                            Add
                        </button>
                        <button
                            title="Cancel"
                            onClick={reset}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: colors.muted,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

export const WsiAnnotationPanel = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        if (!controller || !controller.visible) return null;
        if (controller.loading) {
            return (
                <span style={{ color: '#999', fontSize: 11 }}>Loading…</span>
            );
        }
        if (controller.error && !controller.annotations.length) {
            return (
                <span style={{ color: '#a00', fontSize: 11 }}>
                    {controller.error}
                </span>
            );
        }
        if (!controller.annotations.length) {
            return (
                <span style={{ color: '#999', fontSize: 11 }}>
                    No annotations yet. Draw on the slide to create one.
                </span>
            );
        }
        return (
            <div
                data-testid="wsi-annotation-panel"
                style={{ maxHeight: 260, overflowY: 'auto', marginTop: 6 }}
            >
                {controller.annotations.map(annotation =>
                    controller.hiddenLayerNames.has(
                        annotation.layerName || DEFAULT_LAYER
                    ) ? null : (
                        <AnnotationRow
                            key={annotation.id}
                            controller={controller}
                            annotation={annotation}
                        />
                    )
                )}
            </div>
        );
    }
);

const AnnotationRow = observer(
    ({
        controller,
        annotation,
    }: {
        controller: WsiAnnotationController;
        annotation: WsiAnnotation;
    }) => {
        const [editing, setEditing] = React.useState(false);
        const [label, setLabel] = React.useState(
            annotation.body?.[0]?.value || ''
        );
        const rawLabel = annotation.body?.[0]?.value || '';
        const layer = annotation.layerName || DEFAULT_LAYER;
        const dotColor = annotation.color || DEFAULT_COLOR;
        const creator = annotation.creator || '';
        const created = annotation.created
            ? new Date(annotation.created).toLocaleDateString()
            : '';

        const save = () => {
            void controller.renameAnnotation(annotation.id, label);
            setEditing(false);
        };

        return (
            <div
                data-testid={`annotation-row-${annotation.id}`}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '4px 0',
                    borderBottom: `1px solid ${colors.border}`,
                }}
            >
                <span
                    aria-label="Annotation color"
                    data-annotation-color={dotColor}
                    data-annotation-layer={layer}
                    style={{
                        width: 8,
                        height: 8,
                        marginTop: 4,
                        borderRadius: '50%',
                        background: dotColor,
                        flexShrink: 0,
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    {editing ? (
                        <div style={{ display: 'flex', gap: 3 }}>
                            <input
                                data-testid={`annotation-label-input-${annotation.id}`}
                                autoFocus
                                value={label}
                                maxLength={200}
                                onChange={event => setLabel(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') save();
                                    if (event.key === 'Escape')
                                        setEditing(false);
                                }}
                                style={{ flex: 1, minWidth: 0, fontSize: 11 }}
                            />
                            <button
                                title="Save annotation label"
                                onClick={save}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#2a7a2a',
                                }}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                title={rawLabel || '(unlabeled)'}
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: colors.text,
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {rawLabel || '(unlabeled)'}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 3,
                                    marginTop: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <AnnotationBadge label={layer} />
                                {annotation.colorName && (
                                    <AnnotationBadge
                                        label={annotation.colorName}
                                        background={dotColor}
                                        color="#fff"
                                    />
                                )}
                            </div>
                            {(creator || created) && (
                                <div
                                    style={{
                                        color: colors.muted,
                                        fontSize: 10,
                                    }}
                                >
                                    {creator}
                                    {creator && created ? ' · ' : ''}
                                    {created}
                                </div>
                            )}
                        </>
                    )}
                </div>
                {!editing && (
                    <button
                        data-testid={`edit-label-${annotation.id}`}
                        title="Edit label"
                        onClick={() => {
                            setLabel(rawLabel);
                            setEditing(true);
                        }}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: colors.muted,
                            padding: '0 2px',
                        }}
                    >
                        ✎
                    </button>
                )}
                <button
                    data-testid={`delete-annotation-${annotation.id}`}
                    title="Delete annotation"
                    onClick={() =>
                        void controller.removeAnnotation(annotation.id)
                    }
                    style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#c0392b',
                        padding: '0 2px',
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }
);

function AnnotationBadge({
    label,
    background = '#e8e8e8',
    color = '#555',
}: {
    label: string;
    background?: string;
    color?: string;
}) {
    return (
        <span
            style={{
                padding: '0 4px',
                borderRadius: 2,
                background,
                color,
                fontSize: 9,
                lineHeight: '14px',
            }}
        >
            {label}
        </span>
    );
}

export const WsiAnnotationTooltip = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        const tooltip = controller.annotationTooltip;
        if (!tooltip) return null;
        return (
            <div
                data-testid="annotation-tooltip"
                onClick={controller.dismissAnnotationTooltip}
                style={{
                    position: 'fixed',
                    left: tooltip.x + 12,
                    top: tooltip.y - 8,
                    maxWidth: 260,
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: 'rgba(30,30,30,0.9)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    pointerEvents: 'auto',
                    zIndex: 9999,
                }}
            >
                {tooltip.text}
                {tooltip.layerName && (
                    <div style={{ marginTop: 2, fontSize: 10, opacity: 0.7 }}>
                        Layer: {tooltip.layerName}
                    </div>
                )}
            </div>
        );
    }
);

export const WsiAnnotationDrawPreview = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        const preview = controller.customDrawPreview;
        if (!preview) return null;

        const x1 = preview.start.x;
        const y1 = preview.start.y;
        const x2 = preview.current.x;
        const y2 = preview.current.y;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rawRx = Math.abs(x2 - x1) / 2;
        const rawRy = Math.abs(y2 - y1) / 2;
        const radius = Math.min(rawRx, rawRy);
        const rx = preview.tool === 'circle' ? radius : rawRx;
        const ry = preview.tool === 'circle' ? radius : rawRy;
        const polygonPoints = preview.points
            ?.map(point => `${point.x},${point.y}`)
            .join(' ');
        const polygonPreviewPoints = [
            ...(polygonPoints ? [polygonPoints] : []),
            `${x2},${y2}`,
        ].join(' ');

        return (
            <svg
                data-testid="annotation-draw-preview"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 19,
                }}
            >
                {preview.tool === 'polygon' ? (
                    <polyline
                        points={polygonPreviewPoints}
                        stroke={controller.activeColor}
                        strokeWidth={2}
                        fill={controller.activeColor}
                        fillOpacity={0.15}
                    />
                ) : preview.tool === 'rectangle' ? (
                    <rect
                        x={Math.min(x1, x2)}
                        y={Math.min(y1, y2)}
                        width={Math.abs(x2 - x1)}
                        height={Math.abs(y2 - y1)}
                        stroke={controller.activeColor}
                        strokeWidth={2}
                        fill={controller.activeColor}
                        fillOpacity={0.2}
                    />
                ) : preview.tool === 'line' ? (
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={controller.activeColor}
                        strokeWidth={2}
                    />
                ) : (
                    <ellipse
                        cx={cx}
                        cy={cy}
                        rx={rx}
                        ry={ry}
                        stroke={controller.activeColor}
                        strokeWidth={2}
                        fill={controller.activeColor}
                        fillOpacity={0.2}
                    />
                )}
            </svg>
        );
    }
);
