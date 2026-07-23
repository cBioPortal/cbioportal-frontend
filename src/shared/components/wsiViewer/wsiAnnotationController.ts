import { action, computed, makeObservable, observable } from 'mobx';
import { WsiAnnotation } from './wsiViewerTypes';
import { createOSDAnnotator, W3CImageFormat } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

export type WsiAnnotationTool =
    | 'rectangle'
    | 'ellipse'
    | 'circle'
    | 'line'
    | 'polygon'
    | null;

const DEFAULT_COLOR = '#3b82f6';
const DEFAULT_LAYER = 'Default';

function parseColor(value: unknown): { name: string; color: string } {
    if (typeof value !== 'string' || !value) {
        return { name: DEFAULT_COLOR, color: DEFAULT_COLOR };
    }
    const separator = value.indexOf('|');
    if (separator < 0) return { name: value, color: value };
    const name = value.slice(0, separator) || DEFAULT_COLOR;
    const color = value.slice(separator + 1) || DEFAULT_COLOR;
    return { name, color };
}

type TokenProvider = () => Promise<string>;

export class WsiAnnotationController {
    @observable annotations: WsiAnnotation[] = [];
    @observable loading = false;
    @observable error: string | null = null;
    @observable visible = true;
    @observable activeTool: WsiAnnotationTool = null;
    @observable activeColor = DEFAULT_COLOR;
    @observable activeLayer = DEFAULT_LAYER;
    @observable private customLayers: string[] = [DEFAULT_LAYER];

    private generation = 0;
    private abortController: AbortController | null = null;
    private annotorious: any = null;
    private osdViewer: any = null;
    private openSeadragon: any = null;
    private slideId: string | null = null;
    private pointerCleanup: (() => void) | null = null;
    private synchronizing = false;

    constructor(
        private readonly apiUrl: string | null | undefined,
        private readonly studyId: string | undefined,
        private readonly getToken: TokenProvider
    ) {
        makeObservable(this);
    }

    @computed get layerNames(): string[] {
        const names = new Set(this.customLayers);
        this.annotations.forEach(annotation =>
            names.add(annotation.layerName || DEFAULT_LAYER)
        );
        return Array.from(names);
    }

    @computed get annotationsByLayer(): Map<string, WsiAnnotation[]> {
        const grouped = new Map<string, WsiAnnotation[]>();
        this.annotations.forEach(annotation => {
            const layer = annotation.layerName || DEFAULT_LAYER;
            const entries = grouped.get(layer) || [];
            entries.push(annotation);
            grouped.set(layer, entries);
        });
        return grouped;
    }

    @action.bound
    beginSlide(slideId: string) {
        this.generation += 1;
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.slideId = slideId;
        this.annotations = [];
        this.error = null;
        this.loading = Boolean(this.apiUrl);
        this.destroyAnnotorious();
        if (this.apiUrl) {
            void this.loadAnnotations(slideId, this.generation);
        }
    }

    @action.bound
    attachViewer(viewer: any, openSeadragon: any, slideId: string) {
        if (!this.apiUrl || this.slideId !== slideId) return;
        this.destroyAnnotorious();
        this.osdViewer = viewer;
        this.openSeadragon = openSeadragon;
        this.annotorious = createOSDAnnotator(viewer, {
            drawingEnabled: false,
            drawingMode: 'drag',
            adapter: W3CImageFormat(slideId),
        });
        this.annotorious.on('createAnnotation', (annotation: WsiAnnotation) => {
            if (this.synchronizing) return;
            void this.createAnnotation(annotation);
        });
        this.annotorious.on('updateAnnotation', (annotation: WsiAnnotation) => {
            if (!this.synchronizing) void this.updateAnnotation(annotation);
        });
        this.annotorious.on('deleteAnnotation', (annotation: WsiAnnotation) => {
            if (!this.synchronizing) void this.deleteAnnotation(annotation.id);
        });
        this.annotorious.setVisible(this.visible);
        if (this.annotations.length) {
            this.annotorious.setAnnotations(this.annotations);
        }
        this.installCustomDrawingHandlers();
    }

    @action.bound
    detachViewer() {
        this.destroyAnnotorious();
    }

    @action.bound
    setTool(tool: WsiAnnotationTool) {
        this.activeTool = tool;
        if (!this.annotorious) return;
        const custom =
            tool === 'ellipse' || tool === 'circle' || tool === 'line';
        this.annotorious.cancelDrawing?.();
        this.annotorious.setDrawingEnabled?.(!custom && tool !== null);
        if (!custom && tool) {
            this.annotorious.setDrawingTool?.(tool);
            this.annotorious.setDrawingMode?.(
                tool === 'polygon' ? 'click' : 'drag'
            );
        }
        this.setCustomPointerEvents(custom);
    }

    @action.bound
    cancelDrawing() {
        this.activeTool = null;
        this.annotorious?.cancelDrawing?.();
        this.annotorious?.setDrawingEnabled?.(false);
        this.setCustomPointerEvents(false);
    }

    @action.bound
    toggleVisible() {
        this.visible = !this.visible;
        this.annotorious?.setVisible?.(this.visible);
    }

    @action.bound
    setActiveColor(color: string) {
        this.activeColor = color || DEFAULT_COLOR;
    }

    @action.bound
    setActiveLayer(layer: string) {
        this.activeLayer = layer;
        if (!this.customLayers.includes(layer)) this.customLayers.push(layer);
    }

    @action.bound
    addLayer(layer: string) {
        const normalized = layer.trim();
        if (!normalized || this.customLayers.includes(normalized)) return;
        this.customLayers.push(normalized);
        this.activeLayer = normalized;
    }

    @action.bound
    async renameAnnotation(id: string, label: string) {
        const annotation = this.annotations.find(item => item.id === id);
        if (!annotation) return;
        const updated = {
            ...annotation,
            body: [
                {
                    type: 'TextualBody' as const,
                    value: label,
                    purpose: 'commenting' as const,
                },
            ],
        };
        await this.updateAnnotation(updated);
    }

    private async request(path: string, init: RequestInit = {}) {
        const token = await this.getToken();
        const headers = new Headers(init.headers);
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${token}`);
        return fetch(`${this.apiUrl}${path}`, {
            ...init,
            headers,
            signal: this.abortController?.signal,
        });
    }

    private async loadAnnotations(slideId: string, generation: number) {
        try {
            const response = await this.request(
                `/annotations?slide_id=${encodeURIComponent(
                    slideId
                )}&study_id=${encodeURIComponent(this.studyId || '')}`
            );
            if (!response.ok)
                throw new Error(`Annotation load failed (${response.status})`);
            const raw = (await response.json()) as any[];
            if (generation !== this.generation || this.slideId !== slideId)
                return;
            const annotations = raw.map(item => this.fromApi(item, slideId));
            action(() => {
                this.annotations = annotations;
                this.loading = false;
                this.error = null;
                this.annotorious?.setAnnotations?.(annotations);
            })();
        } catch (error) {
            if (
                generation !== this.generation ||
                (error as Error).name === 'AbortError'
            )
                return;
            action(() => {
                this.loading = false;
                this.error = 'Unable to load annotations.';
            })();
        }
    }

    private async createAnnotation(annotation: WsiAnnotation) {
        if (!this.slideId) return;
        const payload = {
            slide_id: this.slideId,
            study_id: this.studyId || '',
            body: {
                label: annotation.body?.[0]?.value || '',
                comment: this.activeLayer,
                type: this.activeColor,
            },
            target: { selector: annotation.target.selector },
            visible_to: [],
        };
        try {
            const response = await this.request('/annotations', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok)
                throw new Error(
                    `Annotation create failed (${response.status})`
                );
            const saved = this.fromApi(await response.json(), this.slideId);
            this.synchronizing = true;
            try {
                this.annotations = [
                    ...this.annotations.filter(
                        item => item.id !== annotation.id
                    ),
                    saved,
                ];
                this.annotorious?.setAnnotations?.(this.annotations);
            } finally {
                this.synchronizing = false;
            }
        } catch (_) {
            this.removeAnnotationLocally(annotation.id);
            this.error = 'Unable to save annotation.';
        }
    }

    private async updateAnnotation(annotation: WsiAnnotation) {
        try {
            const response = await this.request(
                `/annotations/${encodeURIComponent(annotation.id)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        body: {
                            label: annotation.body?.[0]?.value || '',
                            comment: annotation.layerName || this.activeLayer,
                            type: annotation.color || this.activeColor,
                        },
                        target: { selector: annotation.target.selector },
                        version: annotation.version || 1,
                    }),
                }
            );
            if (response.status === 409) {
                await this.reloadCurrentSlide(
                    'Annotation changed elsewhere; reloaded latest data.'
                );
                return;
            }
            if (!response.ok)
                throw new Error(
                    `Annotation update failed (${response.status})`
                );
            this.replaceAnnotation(
                annotation.id,
                this.fromApi(await response.json(), this.slideId || '')
            );
        } catch (_) {
            await this.reloadCurrentSlide('Unable to update annotation.');
        }
    }

    private async deleteAnnotation(id: string) {
        try {
            const response = await this.request(
                `/annotations/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE',
                }
            );
            if (!response.ok && response.status !== 404)
                throw new Error(
                    `Annotation delete failed (${response.status})`
                );
            this.removeAnnotationLocally(id);
        } catch (_) {
            await this.reloadCurrentSlide('Unable to delete annotation.');
        }
    }

    private async reloadCurrentSlide(message: string) {
        if (!this.slideId) return;
        const slideId = this.slideId;
        const generation = ++this.generation;
        this.abortController?.abort();
        this.abortController = new AbortController();
        await this.loadAnnotations(slideId, generation);
        this.error = message;
    }

    private replaceAnnotation(oldId: string, replacement: WsiAnnotation) {
        const next = this.annotations.map(item =>
            item.id === oldId ? replacement : item
        );
        this.synchronizing = true;
        try {
            this.annotorious?.setAnnotations?.(next);
        } finally {
            this.synchronizing = false;
        }
        this.annotations = next;
    }

    private removeAnnotationLocally(id: string) {
        this.annotations = this.annotations.filter(item => item.id !== id);
        this.annotorious?.setAnnotations?.(this.annotations);
    }

    private fromApi(item: any, slideId: string): WsiAnnotation {
        const parsedColor = parseColor(item.body?.type);
        return {
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            type: 'Annotation',
            id: item.id,
            body: item.body?.label
                ? [
                      {
                          type: 'TextualBody',
                          value: item.body.label,
                          purpose: 'commenting',
                      },
                  ]
                : [],
            target: {
                source: slideId,
                selector: item.target?.selector || item.target,
            },
            created: item.created_at,
            creator: item.created_by,
            version: item.version,
            color: parsedColor.color,
            colorName: parsedColor.name,
            layerName: item.body?.comment || DEFAULT_LAYER,
        };
    }

    private installCustomDrawingHandlers() {
        const element = this.osdViewer?.element as HTMLElement | undefined;
        if (!element) return;
        const down = (event: PointerEvent) => {
            if (
                !this.activeTool ||
                !['ellipse', 'circle', 'line'].includes(this.activeTool)
            )
                return;
            (element as any).__wsiAnnotationStart = {
                x: event.clientX,
                y: event.clientY,
            };
            event.preventDefault();
            event.stopPropagation();
        };
        const up = (event: PointerEvent) => {
            const start = (element as any).__wsiAnnotationStart;
            if (!start || !this.activeTool) return;
            delete (element as any).__wsiAnnotationStart;
            const rect = element.getBoundingClientRect();
            const startPoint = this.imagePoint(
                start.x - rect.left,
                start.y - rect.top
            );
            const endPoint = this.imagePoint(
                event.clientX - rect.left,
                event.clientY - rect.top
            );
            if (startPoint && endPoint) {
                void this.createCustomShape(
                    startPoint,
                    endPoint,
                    this.activeTool
                );
            }
            event.preventDefault();
            event.stopPropagation();
        };
        element.addEventListener('pointerdown', down, true);
        element.addEventListener('pointerup', up, true);
        this.pointerCleanup = () => {
            element.removeEventListener('pointerdown', down, true);
            element.removeEventListener('pointerup', up, true);
        };
    }

    private setCustomPointerEvents(enabled: boolean) {
        const element = this.osdViewer?.element as HTMLElement | undefined;
        if (element) element.style.cursor = enabled ? 'crosshair' : '';
    }

    private imagePoint(x: number, y: number): { x: number; y: number } | null {
        if (!this.osdViewer?.viewport || !this.openSeadragon) return null;
        const point = this.osdViewer.viewport.pointFromPixel(
            new this.openSeadragon.Point(x, y)
        );
        const imagePoint = this.osdViewer.viewport.viewportToImageCoordinates(
            point
        );
        return { x: imagePoint.x, y: imagePoint.y };
    }

    private async createCustomShape(
        start: { x: number; y: number },
        end: { x: number; y: number },
        tool: WsiAnnotationTool
    ) {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const selector =
            tool === 'line'
                ? `<svg><line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" /></svg>`
                : `<svg><ellipse cx="${cx}" cy="${cy}" rx="${
                      tool === 'circle' ? Math.max(rx, ry) : rx
                  }" ry="${ry}" /></svg>`;
        const annotation: WsiAnnotation = {
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            type: 'Annotation',
            id: `client-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,
            body: [{ type: 'TextualBody', value: '', purpose: 'commenting' }],
            target: {
                source: this.slideId || '',
                selector: { type: 'SvgSelector', value: selector },
            },
            color: this.activeColor,
            colorName: this.activeColor,
            layerName: this.activeLayer,
        };
        await this.createAnnotation(annotation);
        this.cancelDrawing();
    }

    private destroyAnnotorious() {
        this.pointerCleanup?.();
        this.pointerCleanup = null;
        this.setCustomPointerEvents(false);
        try {
            this.annotorious?.destroy?.();
        } catch (_) {
            /* best effort */
        }
        this.annotorious = null;
        this.osdViewer = null;
        this.openSeadragon = null;
        this.activeTool = null;
    }
}
