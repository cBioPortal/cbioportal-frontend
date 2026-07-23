import * as React from 'react';
import { observer } from 'mobx-react';
import {
    WsiAnnotationController,
    WsiAnnotationTool,
} from './wsiAnnotationController';

const tools: Array<{
    name: Exclude<WsiAnnotationTool, null>;
    label: string;
}> = [
    { name: 'rectangle', label: 'Rectangle' },
    { name: 'ellipse', label: 'Ellipse' },
    { name: 'circle', label: 'Circle' },
    { name: 'line', label: 'Line' },
    { name: 'polygon', label: 'Polygon' },
];

export const WsiAnnotationToolbar = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        if (!controller) return null;
        return (
            <div
                data-testid="wsi-annotation-toolbar"
                style={{
                    position: 'absolute',
                    bottom: 38,
                    left: 8,
                    display: 'flex',
                    gap: 4,
                    padding: 4,
                    background: 'rgba(250,250,250,0.95)',
                    border: '1px solid #ddd',
                    borderRadius: 3,
                    zIndex: 20,
                }}
            >
                {tools.map(tool => (
                    <button
                        key={tool.name}
                        className="btn btn-default btn-xs"
                        title={`Draw a ${tool.label.toLowerCase()}`}
                        aria-pressed={controller.activeTool === tool.name}
                        onClick={() =>
                            controller.setTool(
                                controller.activeTool === tool.name
                                    ? null
                                    : tool.name
                            )
                        }
                    >
                        {tool.label}
                    </button>
                ))}
                {controller.activeTool && (
                    <button
                        className="btn btn-link btn-xs"
                        title="Cancel drawing"
                        onClick={() => controller.cancelDrawing()}
                    >
                        ✕ Cancel
                    </button>
                )}
                <label
                    style={{
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    Color
                    <input
                        aria-label="Annotation color"
                        type="color"
                        value={controller.activeColor}
                        onChange={event =>
                            controller.setActiveColor(event.target.value)
                        }
                    />
                </label>
                <select
                    aria-label="Annotation layer"
                    value={controller.activeLayer}
                    onChange={event =>
                        controller.setActiveLayer(event.target.value)
                    }
                >
                    {controller.layerNames.map(layer => (
                        <option key={layer} value={layer}>
                            {layer}
                        </option>
                    ))}
                </select>
                <button
                    className="btn btn-default btn-xs"
                    title={
                        controller.visible
                            ? 'Hide annotations'
                            : 'Show annotations'
                    }
                    onClick={() => controller.toggleVisible()}
                >
                    {controller.visible
                        ? 'Hide annotations'
                        : 'Show annotations'}
                </button>
            </div>
        );
    }
);

export const WsiAnnotationPanel = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        if (!controller || !controller.visible) return null;
        return (
            <div data-testid="wsi-annotation-panel" style={{ marginTop: 8 }}>
                <div
                    style={{ fontSize: 10, fontWeight: 700, color: '#737373' }}
                >
                    ANNOTATIONS{' '}
                    {controller.annotations.length
                        ? `(${controller.annotations.length})`
                        : ''}
                </div>
                {controller.loading && (
                    <div style={{ fontSize: 11 }}>Loading…</div>
                )}
                {controller.error && (
                    <div style={{ color: '#a00', fontSize: 11 }}>
                        {controller.error}
                    </div>
                )}
                {!controller.loading && !controller.annotations.length && (
                    <div style={{ color: '#999', fontSize: 11 }}>
                        No annotations yet.
                    </div>
                )}
                {controller.annotations.map(annotation => (
                    <AnnotationRow
                        key={annotation.id}
                        controller={controller}
                        annotation={annotation}
                    />
                ))}
                <LayerEditor controller={controller} />
            </div>
        );
    }
);

const LayerEditor = observer(
    ({ controller }: { controller: WsiAnnotationController }) => {
        const [layer, setLayer] = React.useState('');
        return (
            <form
                onSubmit={event => {
                    event.preventDefault();
                    controller.addLayer(layer);
                    setLayer('');
                }}
                style={{ display: 'flex', gap: 4, marginTop: 6 }}
            >
                <input
                    aria-label="New annotation layer"
                    placeholder="New layer"
                    value={layer}
                    onChange={event => setLayer(event.target.value)}
                />
                <button type="submit" className="btn btn-default btn-xs">
                    Add
                </button>
            </form>
        );
    }
);

const AnnotationRow = observer(
    ({
        controller,
        annotation,
    }: {
        controller: WsiAnnotationController;
        annotation: {
            id: string;
            body: Array<{ value: string }>;
            version?: number;
        };
    }) => {
        const [editing, setEditing] = React.useState(false);
        const [label, setLabel] = React.useState(
            annotation.body?.[0]?.value || ''
        );
        return (
            <div
                data-testid={`annotation-row-${annotation.id}`}
                style={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    marginTop: 4,
                }}
            >
                {editing ? (
                    <>
                        <input
                            data-testid={`annotation-label-input-${annotation.id}`}
                            value={label}
                            onChange={event => setLabel(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    void controller.renameAnnotation(
                                        annotation.id,
                                        label
                                    );
                                    setEditing(false);
                                }
                            }}
                        />
                        <button
                            title="Save annotation label"
                            onClick={() => {
                                void controller.renameAnnotation(
                                    annotation.id,
                                    label
                                );
                                setEditing(false);
                            }}
                        >
                            ✓
                        </button>
                    </>
                ) : (
                    <>
                        <span style={{ flex: 1, fontSize: 11 }}>
                            {annotation.body?.[0]?.value || 'Annotation'}
                        </span>
                        <button
                            data-testid={`edit-label-${annotation.id}`}
                            title="Edit annotation label"
                            onClick={() => setEditing(true)}
                        >
                            ✎
                        </button>
                    </>
                )}
            </div>
        );
    }
);
