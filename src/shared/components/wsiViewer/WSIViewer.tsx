import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as OpenSeadragonLib from 'openseadragon';
import {
    Slide,
    Sample,
    PatientHierarchy,
    TileMetadata,
} from './wsiViewerTypes';

// ---- design tokens (matches iframe viewer) ----
const C = {
    blue: '#2986e2',
    blueDark: '#1a6cc4',
    blueLight: '#e8f1fb',
    orange: '#f5a623',
    text: '#333',
    muted: '#737373',
    border: '#ddd',
    navBg: '#fafafa',
    sidebarBg: '#f5f5f5',
} as const;

const NAV_W = 252;
const SIDEBAR_W = 220;

// OpenSeadragon is a CommonJS module; handle both CJS and ESM bundle shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OpenSeadragon: typeof import('openseadragon') =
    (OpenSeadragonLib as any).default ?? (OpenSeadragonLib as any);

interface Props {
    /** URL of the form https://tile-server/patient/{patient_id} */
    url: string;
    height: number;
    /** cBioPortal study ID — used to build sample links in the sidebar */
    studyId?: string;
}

@observer
export default class WSIViewer extends React.Component<Props, {}> {
    @observable private hierarchy: PatientHierarchy | null = null;
    @observable private selectedSlide: Slide | null = null;
    @observable private selectedSample: Sample | null = null;
    @observable private selectedMeta: TileMetadata | null = null;
    @observable private loading = true;
    @observable private error: string | null = null;
    @observable private viewerReady = false;
    @observable private stainFilter: 'all' | 'hne' | 'ihc' = 'all';
    /** Coordinate bar — input field values */
    @observable coordInputX = '';
    @observable coordInputY = '';
    /** Current cursor position in image pixels (null when viewer not ready or cursor outside) */
    @observable cursorPos: { x: number; y: number } | null = null;

    private viewerContainerRef = React.createRef<HTMLDivElement>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdViewer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdMouseTracker: any = null;
    /** In-memory cache of prefetched slide metadata keyed by image_id */
    private metaCache = new Map<string, TileMetadata>();
    /** Monotonically-increasing counter; each mountOSD call captures its value
     *  and bails if a newer call has started by the time an async step resumes. */
    private mountSeq = 0;

    /** Number of gunicorn workers on the tile server (used to fire warmup N times) */
    private nWorkers = 4;

    constructor(props: Props) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        void this.loadHierarchy();
    }

    componentDidUpdate(prev: Props) {
        if (prev.url !== this.props.url) {
            this.destroyViewer();
            void this.loadHierarchy();
        }
    }

    componentWillUnmount() {
        this.hierarchy = null; // stops the prefetchSlideMetadata loop
        this.destroyViewer();
    }

    // ---- data loading ----

    @action.bound
    private async loadHierarchy() {
        this.loading = true;
        this.error = null;
        this.hierarchy = null;
        this.selectedSlide = null;
        this.selectedSample = null;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.metaCache.clear();
        // Invalidate any in-flight mountOSD from a previous patient.
        this.mountSeq++;

        try {
            // Read n_workers from the health endpoint so warmup fires the right
            // number of times to prime every gunicorn worker's SlideCache.
            const base = this.tileServerBase;
            fetch(`${base}/health`)
                .then(r => r.ok ? r.json() : null)
                .then((d: any) => { if (d?.n_workers) this.nWorkers = d.n_workers; })
                .catch(() => { /* leave default of 4 */ });

            const resp = await fetch(this.props.url);
            if (!resp.ok) {
                throw new Error(`Server returned ${resp.status}`);
            }
            const data: PatientHierarchy = await resp.json();

            // Set loading=false BEFORE selectSlide so the viewer container div
            // is rendered into the DOM before mountOSD runs.
            action(() => {
                this.hierarchy = data;
                this.loading = false;
            })();

            // Auto-select first servable H&E slide, else first servable slide
            const allSlides = this.servableSlides;
            const first = allSlides.find(s => s.slide.is_hne) ?? allSlides[0];
            if (first) {
                await this.selectSlide(first.slide, first.sample);
            }

            // Prefetch metadata for remaining slides in the background so
            // subsequent slide selections don't pay the S3 cold-open cost (~4s).
            void this.prefetchSlideMetadata(first?.slide.image_id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            action(() => {
                this.error = msg;
                this.loading = false;
            })();
        }
    }

    /**
     * Background prefetch: for each servable slide (except the already-loaded
     * first one), fetch metadata + thumbnail concurrently. Both endpoints cache
     * results in Redis so every subsequent user click is served instantly.
     *
     * Also fires the /warmup endpoint nWorkers times per slide so every gunicorn
     * worker's SlideCache gets primed (round-robin routing means N calls ≈ N workers).
     * Runs serially (one slide at a time) to keep workers free for user requests.
     */
    private async prefetchSlideMetadata(skipImageId?: string) {
        const slides = this.servableSlides
            .map(s => s.slide)
            .filter(sl => sl.image_id !== skipImageId && !this.metaCache.has(sl.image_id));

        for (const sl of slides) {
            if (!this.hierarchy) return;
            const base = this.tileServerBase;
            const warmupCalls = Array.from({ length: this.nWorkers }, () =>
                fetch(`${base}/tiles/${sl.image_id}/warmup`).catch(() => {})
            );
            await Promise.allSettled([
                fetch(`${base}/tiles/${sl.image_id}/metadata`)
                    .then(r => r.ok ? r.json() : Promise.reject(r.status))
                    .then((meta: TileMetadata) => { this.metaCache.set(sl.image_id, meta); }),
                // Thumbnail fetch warms the Redis cache so the sidebar img is
                // served from Redis (no SVS open) on the first user click.
                fetch(`${base}/tiles/${sl.image_id}/thumbnail`),
                ...warmupCalls,
            ]);
            // Brief pause between slides to avoid S3 connection pile-up.
            await new Promise(r => setTimeout(r, 200));
        }
    }

    @computed get servableSlides(): Array<{ slide: Slide; sample: Sample }> {        if (!this.hierarchy) return [];
        const result: Array<{ slide: Slide; sample: Sample }> = [];
        for (const sample of this.hierarchy.samples) {
            for (const part of sample.parts) {
                for (const block of part.blocks) {
                    for (const slide of block.slides) {
                        if (slide.can_serve_tiles) result.push({ slide, sample });
                    }
                }
            }
        }
        return result;
    }

    @computed get tileServerBase(): string {
        return this.props.url.replace(/\/patient\/[^/]+\/?$/, '');
    }

    // ---- slide selection ----

    @action.bound
    async selectSlide(slide: Slide, sample: Sample) {
        this.selectedSlide = slide;
        this.selectedSample = sample;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.error = null;
        // Bump the sequence so any in-flight mountOSD call can detect it's stale.
        const seq = ++this.mountSeq;
        await this.mountOSD(slide, seq);
    }

    // ---- OpenSeadragon ----

    /** Navigate to image-pixel coordinates entered in the coordinate bar. */
    @action.bound
    goToCoordinates() {
        if (!this.osdViewer) return;
        const x = parseInt(this.coordInputX, 10);
        const y = parseInt(this.coordInputY, 10);
        if (!isFinite(x) || !isFinite(y)) return;
        const imgPoint = new (OpenSeadragon as any).Point(x, y);
        const vpPoint = this.osdViewer.viewport.imageToViewportCoordinates(imgPoint);
        this.osdViewer.viewport.panTo(vpPoint, false);
    }

    private destroyViewer() {
        if (this.osdMouseTracker) {
            try { this.osdMouseTracker.destroy(); } catch (_) { /* ignore */ }
            this.osdMouseTracker = null;
        }
        if (this.osdViewer) {
            try {
                this.osdViewer.destroy();
            } catch (_) {
                // ignore
            }
            this.osdViewer = null;
        }
        action(() => { this.cursorPos = null; })();
    }

    private async mountOSD(slide: Slide, seq: number) {
        // Use prefetched metadata if available, otherwise fetch now
        let meta = this.metaCache.get(slide.image_id);
        if (!meta) {
            const metaUrl = `${this.tileServerBase}/tiles/${slide.image_id}/metadata`;
            try {
                const resp = await fetch(metaUrl);
                if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
                meta = await resp.json() as TileMetadata;
                this.metaCache.set(slide.image_id, meta);
            } catch (err) {
                if (seq !== this.mountSeq) return; // superseded
                // eslint-disable-next-line no-console
                console.error('[WSIViewer] metadata fetch failed', err);
                action(() => { this.error = `Failed to load slide metadata: ${err}`; })();
                return;
            }
        }

        // Bail if a newer selectSlide call has started while we were fetching.
        if (seq !== this.mountSeq) return;

        action(() => { this.selectedMeta = meta!; })();

        // Two animation frames: first lets MobX/React commit, second
        // confirms layout dimensions are set on the container div.
        await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

        if (seq !== this.mountSeq) return;

        const containerEl = this.viewerContainerRef.current;
        if (!containerEl) return;

        this.destroyViewer();

        const baseUrl = this.tileServerBase;
        const imageId = slide.image_id;
        const maxZoom = meta.max_zoom;
        const tileSize = meta.tile_size;

        try {
            this.osdViewer = OpenSeadragon({
                element: containerEl,
                showNavigationControl: true,
                showNavigator: true,
                navigatorPosition: 'BOTTOM_RIGHT',
                crossOriginPolicy: 'Anonymous',
                prefixUrl: '/reactapp/osd-images/',
                showFullPageControl: false,
                gestureSettingsMouse: { clickToZoom: false },
                timeout: 90000,
                imageLoaderLimit: 6,
                tileSources: {
                    // OSD level 0 = most zoomed out (1 tile covers whole image)
                    // OSD level maxZoom = full resolution
                    // Server /zxy/{z}/{x}/{y} uses the same convention
                    width: meta.dimensions.width,
                    height: meta.dimensions.height,
                    tileSize,
                    tileOverlap: 0,
                    maxLevel: maxZoom,
                    minLevel: 0,
                    getTileUrl(level: number, x: number, y: number): string {
                        return `${baseUrl}/tiles/${imageId}/zxy/${level}/${x}/${y}`;
                    },
                },
            });
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] OSD init error:', err);
            action(() => { this.error = `OSD init error: ${err}`; })();
            return;
        }

        if (seq !== this.mountSeq) {
            this.destroyViewer();
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.osdViewer.addOnceHandler('open', () => {
            if (seq !== this.mountSeq) return;
            action(() => { this.viewerReady = true; })();
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.osdViewer.addOnceHandler('open-failed', (e: any) => {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] OSD open-failed', e);
            action(() => {
                this.error = `OSD open failed: ${e?.message ?? JSON.stringify(e)}`;
                this.viewerReady = false;
            })();
        });
        this.osdViewer.addHandler('tile-load-failed', (e: any) => {
            // eslint-disable-next-line no-console
            console.warn('[WSIViewer] tile-load-failed', e?.tile?.url);
        });

        // Track cursor position and convert to image coordinates for the coord bar.
        const viewer = this.osdViewer;
        this.osdMouseTracker = new (OpenSeadragon as any).MouseTracker({
            element: containerEl,
            moveHandler: action((event: any) => {
                if (!viewer.viewport) return;
                try {
                    const vpPoint = viewer.viewport.pointFromPixel(event.position);
                    const imgPoint = viewer.viewport.viewportToImageCoordinates(vpPoint);
                    this.cursorPos = { x: Math.round(imgPoint.x), y: Math.round(imgPoint.y) };
                } catch (_) { /* ignore during init */ }
            }),
            exitHandler: action(() => { this.cursorPos = null; }),
        });
    }

    // ---- render ----

    render() {
        const { height } = this.props;
        const { loading, error, hierarchy, selectedSlide, selectedSample, selectedMeta, stainFilter } = this;

        if (loading) {
            return (
                <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LoadingIndicator isLoading={true} center={true} size="big" />
                </div>
            );
        }

        if (error || !hierarchy) {
            return (
                <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c00' }}>
                    {error || 'No data'}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', height, overflow: 'hidden', fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize: 13, color: C.text }}>
                {/* Left nav panel */}
                <NavPanel
                    hierarchy={hierarchy}
                    selectedSlide={selectedSlide}
                    stainFilter={stainFilter}
                    onFilterChange={action((f: 'all'|'hne'|'ihc') => { this.stainFilter = f; })}
                    onSelectSlide={(slide, sample) => this.selectSlide(slide, sample)}
                />

                {/* OSD viewer */}
                <div style={{ flex: 1, position: 'relative', background: '#e8e8e8' }}>
                    <div ref={this.viewerContainerRef} style={{ width: '100%', height: '100%' }} />
                    {!this.viewerReady && selectedSlide && (
                        <div style={overlayStyle}>
                            <LoadingIndicator isLoading={true} center={true} size="big" />
                        </div>
                    )}
                    {!selectedSlide && (
                        <div style={overlayStyle}>
                            <span style={{ color: C.muted, fontSize: 13 }}>No servable slides for this patient</span>
                        </div>
                    )}
                    {this.viewerReady && (
                        <CoordBar
                            inputX={this.coordInputX}
                            inputY={this.coordInputY}
                            cursorPos={this.cursorPos}
                            mpp={selectedMeta?.mpp}
                            onChangeX={action((v: string) => { this.coordInputX = v; })}
                            onChangeY={action((v: string) => { this.coordInputY = v; })}
                            onGo={this.goToCoordinates}
                        />
                    )}
                </div>

                {/* Right metadata sidebar */}
                <MetaSidebar
                    slide={selectedSlide}
                    sample={selectedSample}
                    meta={selectedMeta}
                    tileServerBase={this.tileServerBase}
                    studyId={this.props.studyId}
                />
            </div>
        );
    }
}

// ---- helpers ----

const overlayStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
};

// ---- CoordBar ----

interface CoordBarProps {
    inputX: string;
    inputY: string;
    cursorPos: { x: number; y: number } | null;
    mpp?: { x: number; y: number };
    onChangeX: (v: string) => void;
    onChangeY: (v: string) => void;
    onGo: () => void;
}

function CoordBar({ inputX, inputY, cursorPos, mpp, onChangeX, onChangeY, onGo }: CoordBarProps) {
    const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') onGo(); };

    let cursorLabel = '';
    if (cursorPos) {
        cursorLabel = `${cursorPos.x.toLocaleString()} × ${cursorPos.y.toLocaleString()} px`;
        if (mpp) {
            const umX = (cursorPos.x * mpp.x).toFixed(1);
            const umY = (cursorPos.y * mpp.y).toFixed(1);
            cursorLabel += `  (${umX} × ${umY} μm)`;
        }
    }

    const inputStyle: React.CSSProperties = {
        width: 72, padding: '2px 5px', fontSize: 11, border: `1px solid ${C.border}`,
        borderRadius: 3, background: '#fff', color: C.text, outline: 'none',
    };

    return (
        <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(250,250,250,0.92)',
            borderTop: `1px solid ${C.border}`,
            fontSize: 11, color: C.muted,
            backdropFilter: 'blur(2px)',
            zIndex: 10,
        }}>
            <span style={{ fontWeight: 600, color: C.text, marginRight: 2 }}>Go to:</span>
            <span style={{ color: C.muted }}>X</span>
            <input
                type="number"
                value={inputX}
                placeholder="px"
                style={inputStyle}
                onChange={e => onChangeX(e.target.value)}
                onKeyDown={handleKey}
            />
            <span style={{ color: C.muted }}>Y</span>
            <input
                type="number"
                value={inputY}
                placeholder="px"
                style={inputStyle}
                onChange={e => onChangeY(e.target.value)}
                onKeyDown={handleKey}
            />
            <button
                onClick={onGo}
                style={{
                    padding: '2px 9px', fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${C.blue}`, borderRadius: 3,
                    background: C.blue, color: '#fff',
                }}
            >
                Go
            </button>
            {cursorPos && (
                <span style={{ marginLeft: 'auto', color: C.muted, fontFamily: 'monospace', fontSize: 11 }}>
                    📍 {cursorLabel}
                </span>
            )}
        </div>
    );
}

function cleanStain(name: string): string {
    return (name || '').replace(/^DM\s+/i, '') || '—';
}

function fmtMB(bytes: string | number | null | undefined): string {
    const n = Number(bytes);
    if (!n) return '—';
    return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : (n / 1e6).toFixed(0) + ' MB';
}

const BLOCK_LABEL_TIP =
    'Block label: number = block within case; T\u202f=\u202ftumor, N\u202f=\u202funinvolved, L\u202f=\u202flymph node';


// ---- NavPanel ----

interface NavPanelProps {
    hierarchy: PatientHierarchy;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    onFilterChange: (f: 'all' | 'hne' | 'ihc') => void;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
}

function NavPanel({ hierarchy, selectedSlide, stainFilter, onFilterChange, onSelectSlide }: NavPanelProps) {
    const chips: Array<{ key: 'all' | 'hne' | 'ihc'; label: string; color?: string }> = [
        { key: 'all', label: 'All' },
        { key: 'hne', label: '● H&E', color: C.blue },
        { key: 'ihc', label: '● IHC', color: C.orange },
    ];

    return (
        <div style={{
            width: NAV_W, minWidth: NAV_W, display: 'flex', flexDirection: 'column',
            background: C.navBg, borderRight: `1px solid ${C.border}`, overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ padding: '9px 12px 7px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.8px' }}>
                    Slides
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                    {chips.map(chip => (
                        <span
                            key={chip.key}
                            onClick={() => onFilterChange(chip.key)}
                            style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                border: `1px solid ${stainFilter === chip.key ? '#c2d9f5' : C.border}`,
                                background: stainFilter === chip.key ? C.blueLight : '#fff',
                                color: stainFilter === chip.key ? C.blue : (chip.color || C.muted),
                                fontWeight: stainFilter === chip.key ? 600 : 400,
                                cursor: 'pointer', userSelect: 'none',
                            }}
                        >
                            {chip.label}
                        </span>
                    ))}
                </div>
            </div>
            {/* Tree */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {hierarchy.samples.map(sample => (
                    <SampleNode
                        key={sample.sample_id}
                        sample={sample}
                        selectedSlide={selectedSlide}
                        stainFilter={stainFilter}
                        onSelectSlide={onSelectSlide}
                    />
                ))}
            </div>
        </div>
    );
}

// ---- SampleNode ----

interface SampleNodeProps {
    sample: Sample;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    onSelectSlide: (slide: Slide, sample: Sample) => void;
}

function SampleNode({ sample, selectedSlide, stainFilter, onSelectSlide }: SampleNodeProps) {
    const [open, setOpen] = React.useState(true);

    const allSlides = sample.parts.flatMap(p => p.blocks.flatMap(b => b.slides));
    const totSlides = allSlides.length;
    const servableSlides = allSlides.filter(s => s.can_serve_tiles).length;

    const stLower = (sample.sample_type || '').toLowerCase();
    const stClass = stLower === 'primary' ? C.blue
        : (stLower.includes('metastas') || stLower === 'local recurrence') ? '#c05000'
        : C.muted;
    const stBg = stLower === 'primary' ? C.blueLight
        : (stLower.includes('metastas') || stLower === 'local recurrence') ? '#fef0e8'
        : '#f0f0f0';

    // Determine block badge visibility
    const DUMMY = new Set(['0', '']);
    const blockId = (b: { block_label: string; block_number: string }) =>
        (b.block_label || '').trim() || String(b.block_number ?? '');
    const allLabels = new Set(
        sample.parts.flatMap(p => p.blocks.map(b => {
            const l = blockId(b); return DUMMY.has(l) ? null : l;
        }).filter(Boolean))
    );
    const showBlock = allLabels.size > 1;

    // Flatten + sort slides
    const sortedSlides: Array<{ slide: Slide; badge: string | null }> = [];
    for (const part of sample.parts) {
        for (const b of part.blocks) {
            const lbl = blockId(b);
            const badge = (showBlock && !DUMMY.has(lbl)) ? lbl : null;
            for (const sl of b.slides) sortedSlides.push({ slide: sl, badge });
        }
    }
    // Sort purely chronologically by block_number
    sortedSlides.sort((a, b) => {
        const na = Number(a.slide.block_number) || 0;
        const nb = Number(b.slide.block_number) || 0;
        if (na !== nb) return na - nb;
        return (a.slide.stain_name || '').localeCompare(b.slide.stain_name || '');
    });

    return (
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
            {/* Sample header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                    padding: '8px 12px 7px', cursor: 'pointer', userSelect: 'none',
                }}
            >
                <span style={{ fontSize: 10, color: C.muted, marginTop: 2, flexShrink: 0, width: 10 }}>
                    {open ? '▾' : '▸'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sample.sample_id || '—'}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                        {sample.sample_type && (
                            <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', padding: '1px 5px', borderRadius: 3, background: stBg, color: stClass, marginRight: 4 }}>
                                {sample.sample_type}
                            </span>
                        )}
                        {sample.oncotree_code && (
                            <a
                                href="https://oncotree.mskcc.org/"
                                target="_blank" rel="noopener noreferrer"
                                title={`${sample.oncotree_code}${sample.cancer_type_detailed ? ` — ${sample.cancer_type_detailed}` : ''}\nView OncoTree`}
                                onClick={e => e.stopPropagation()}
                                style={{ display: 'inline-block', background: '#f0f0f0', border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontWeight: 700, padding: '0 4px', color: C.text, marginRight: 4, textDecoration: 'none' }}
                            >
                                {sample.oncotree_code}
                            </a>
                        )}
                        {sample.cancer_type_detailed || sample.cancer_type || ''}
                    </div>
                    {sample.primary_site && (
                        <div style={{ fontSize: 10, color: '#aaa' }}>{sample.primary_site}</div>
                    )}
                </div>
                <div title="Tile-servable slides / total slides" style={{ fontSize: 9, color: '#bbb', flexShrink: 0, textAlign: 'right', lineHeight: 1.4, cursor: 'help' }}>
                    <span style={{ color: C.blue, fontWeight: 600 }}>{servableSlides}</span>/{totSlides}
                </div>
            </div>

            {/* Slide list */}
            {open && (
                <div style={{ paddingBottom: 4 }}>
                    {sortedSlides.map(({ slide, badge }) => {
                        const dc = slide.is_hne ? 'hne' : (slide.is_ihc ? 'ihc' : 'other');
                        const visible = stainFilter === 'all' || dc === stainFilter;
                        if (!visible) return null;
                        return (
                            <SlideItem
                                key={slide.image_id}
                                slide={slide}
                                sample={sample}
                                blockBadge={badge}
                                selected={selectedSlide?.image_id === slide.image_id}
                                onSelectSlide={onSelectSlide}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ---- SlideItem ----

interface SlideItemProps {
    slide: Slide;
    sample: Sample;
    blockBadge: string | null;
    selected: boolean;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
}

function SlideItem({ slide, sample, blockBadge, selected, onSelectSlide }: SlideItemProps) {
    const [hovered, setHovered] = React.useState(false);
    const dc = slide.is_hne ? 'hne' : (slide.is_ihc ? 'ihc' : 'other');
    const dotColor = dc === 'hne' ? C.blue : (dc === 'ihc' ? C.orange : '#aaa');
    const mag = slide.magnification || '';
    const sz = fmtMB(slide.file_size_bytes);

    const bg = selected ? C.blueLight : hovered ? C.blueLight : 'transparent';
    const borderLeft = selected ? `2px solid ${C.blue}` : '2px solid transparent';

    return (
        <div
            onClick={() => slide.can_serve_tiles && onSelectSlide(slide, sample)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={slide.can_serve_tiles ? undefined : 'Tiles not yet available'}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px 4px 8px', margin: '1px 4px',
                borderRadius: 3, borderLeft,
                background: bg,
                cursor: slide.can_serve_tiles ? 'pointer' : 'help',
                opacity: slide.can_serve_tiles ? 1 : 0.55,
            }}
        >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cleanStain(slide.stain_name)}
                    {blockBadge && (
                        <span title={BLOCK_LABEL_TIP} style={{ fontSize: 9, color: C.muted, background: '#f0f0f0', borderRadius: 3, padding: '0 4px', marginLeft: 4 }}>
                            {blockBadge}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 9, color: C.muted, whiteSpace: 'nowrap' }}>
                    {mag && <span title="Objective lens magnification">{mag} · </span>}
                    <span title="File size on disk">{sz}</span>
                    {slide.can_serve_tiles ? '' : ' · no tiles'}
                </div>
            </div>
        </div>
    );
}

// ---- MetaSidebar ----

interface MetaSidebarProps {
    slide: Slide | null;
    sample: Sample | null;
    meta: TileMetadata | null;
    tileServerBase: string;
    studyId?: string;
}

function MetaSidebar({ slide, sample, meta, tileServerBase, studyId }: MetaSidebarProps) {
    const thumbSrc = slide ? `${tileServerBase}/tiles/${slide.image_id}/thumbnail` : null;

    return (
        <div style={{
            width: SIDEBAR_W, minWidth: SIDEBAR_W, background: C.sidebarBg,
            borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
            overflowY: 'auto', flexShrink: 0,
        }}>
            {/* Thumbnail */}
            <SbSection title="Thumbnail">
                <div style={{
                    background: '#fff', border: `1px solid ${C.border}`, borderRadius: 3,
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 90, marginTop: 8,
                }}>
                    {thumbSrc ? (
                        <img
                            key={thumbSrc}
                            src={thumbSrc}
                            alt="slide thumbnail"
                            style={{ maxWidth: '100%', maxHeight: 160, display: 'block' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        <span style={{ color: '#bbb', fontSize: 11, padding: 20, textAlign: 'center' }}>No slide selected</span>
                    )}
                </div>
            </SbSection>

            {/* Image Properties */}
            <SbSection title="Image Properties">
                {meta ? (
                    <MetaTable rows={buildWsiRows(slide, meta)} />
                ) : (
                    <span style={{ color: '#bbb', fontSize: 11 }}>—</span>
                )}
            </SbSection>

            {/* Pathology */}
            <SbSection title="Pathology">
                {slide && sample ? (
                    <MetaTable rows={buildPathRows(slide, sample, studyId)} />
                ) : (
                    <span style={{ color: '#bbb', fontSize: 11 }}>—</span>
                )}
            </SbSection>
        </div>
    );
}

function SbSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.8px' }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function MetaTable({ rows }: { rows: MetaRow[] }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
            <tbody>
                {rows.map(row => (
                    <tr key={row.label}>
                        <td title={row.labelTip} style={{
                            fontSize: 11, color: C.muted, width: '50%', paddingRight: 5, paddingTop: 2,
                            paddingBottom: 2, verticalAlign: 'top', lineHeight: 1.5,
                            cursor: row.labelTip ? 'help' : undefined,
                            borderBottom: row.labelTip ? `1px dotted ${C.border}` : undefined,
                        }}>
                            {row.label}
                        </td>
                        <td style={{ fontSize: 11, color: C.text, fontWeight: 500, wordBreak: 'break-word', verticalAlign: 'top', lineHeight: 1.5 }}>
                            {row.href ? (
                                <a href={row.href} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'none' }}
                                   onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                                   onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}>
                                    {row.value || '—'}
                                </a>
                            ) : (
                                row.value || '—'
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

interface MetaRow {
    label: string;
    labelTip?: string;
    value: React.ReactNode;
    href?: string;
}

function buildWsiRows(slide: Slide | null, meta: TileMetadata): MetaRow[] {
    const w = meta.dimensions.width, h = meta.dimensions.height;
    const mppX = meta.mpp?.x || 0, mppY = meta.mpp?.y || 0;
    const mpp = (mppX && mppY) ? (mppX + mppY) / 2 : 0;
    const objNum = meta.objective_power || (mpp ? Math.round(10 / mpp) : 0);
    const rows: MetaRow[] = [
        { label: 'Dimensions', labelTip: 'Width × height in pixels at full resolution', value: `${w.toLocaleString()} × ${h.toLocaleString()} px` },
    ];
    if (mpp) rows.push({ label: 'MPP', labelTip: 'Microns per pixel — physical size of one pixel at full resolution', value: `${mpp.toFixed(4)} µm/px` });
    if (objNum) rows.push({ label: 'Objective', labelTip: 'Objective lens magnification used to capture the slide', value: `${objNum}×` });
    rows.push({ label: 'Zoom levels', labelTip: 'Number of resolution tiers in the pyramidal image', value: String(meta.max_zoom + 1) });
    rows.push({ label: 'Tile size', labelTip: 'Tile dimensions (px) streamed to the viewer', value: `${meta.tile_size} px` });
    if (slide?.file_size_bytes) rows.push({ label: 'File size', value: fmtMB(slide.file_size_bytes) });
    return rows;
}

function buildPathRows(slide: Slide, sample: Sample, studyId?: string): MetaRow[] {
    const stainBadge = slide.is_hne ? 'H&E' : (slide.is_ihc ? 'IHC' : '');
    const oncotreeUrl = sample.oncotree_code ? 'https://oncotree.mskcc.org/' : undefined;
    const sampleUrl = (studyId && sample.sample_id)
        ? `/patient?studyId=${encodeURIComponent(studyId)}&caseId=${encodeURIComponent(sample.sample_id.replace(/-T\d+.*$/i, ''))}&sampleId=${encodeURIComponent(sample.sample_id)}`
        : undefined;
    const rows: MetaRow[] = [
        { label: 'Stain', labelTip: 'Staining protocol used for this slide', value: stainBadge ? `${stainBadge} — ${cleanStain(slide.stain_name)}` : cleanStain(slide.stain_name) },
        { label: 'Sample', labelTip: 'Tumor sample identifier', value: sample.sample_id || '—', href: sampleUrl },
    ];
    if (sample.cancer_type_detailed || sample.cancer_type) rows.push({ label: 'Cancer type', value: sample.cancer_type_detailed || sample.cancer_type || '' });
    if (sample.oncotree_code) rows.push({ label: 'OncoTree', labelTip: 'OncoTree cancer classification code — click to view on oncotree.mskcc.org', value: sample.oncotree_code, href: oncotreeUrl });
    if (sample.primary_site) rows.push({ label: 'Primary site', value: sample.primary_site });
    if (slide.magnification) rows.push({ label: 'Magnification', labelTip: 'Objective lens magnification', value: slide.magnification });
    const blockLbl = (slide.block_label || '').trim() || (slide.block_number ? String(slide.block_number) : '');
    if (blockLbl) rows.push({ label: 'Block', labelTip: BLOCK_LABEL_TIP, value: blockLbl });
    return rows;
}

