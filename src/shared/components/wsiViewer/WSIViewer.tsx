import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    Slide,
    PatientHierarchy,
    TileMetadata,
} from './wsiViewerTypes';

interface Props {
    /** URL of the form https://tile-server/patient/{patient_id} */
    url: string;
    height: number;
}

@observer
export default class WSIViewer extends React.Component<Props, {}> {
    @observable private hierarchy: PatientHierarchy | null = null;
    @observable private selectedSlide: Slide | null = null;
    @observable private loading = true;
    @observable private error: string | null = null;
    @observable private viewerReady = false;

    private viewerContainerRef = React.createRef<HTMLDivElement>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdViewer: any = null;

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
        this.destroyViewer();
    }

    // ---- data loading ----

    @action.bound
    private async loadHierarchy() {
        this.loading = true;
        this.error = null;
        this.hierarchy = null;
        this.selectedSlide = null;
        this.viewerReady = false;

        try {
            const resp = await fetch(this.props.url);
            if (!resp.ok) {
                throw new Error(`Server returned ${resp.status}`);
            }
            const data: PatientHierarchy = await resp.json();
            this.hierarchy = data;

            // Auto-select first servable slide
            const first = this.servableSlides[0];
            if (first) {
                await this.selectSlide(first);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            this.error = msg;
        } finally {
            this.loading = false;
        }
    }

    @computed get servableSlides(): Slide[] {
        if (!this.hierarchy) return [];
        return this.hierarchy.samples.flatMap(s =>
            s.parts.flatMap(p => p.blocks.flatMap(b => b.slides))
        ).filter(s => s.can_serve_tiles);
    }

    @computed get tileServerBase(): string {
        return this.props.url.replace(/\/patient\/[^/]+$/, '');
    }

    // ---- slide selection ----

    @action.bound
    async selectSlide(slide: Slide) {
        this.selectedSlide = slide;
        this.viewerReady = false;
        await this.mountOSD(slide);
    }

    // ---- OpenSeadragon ----

    private destroyViewer() {
        if (this.osdViewer) {
            try {
                this.osdViewer.destroy();
            } catch (_) {
                // ignore
            }
            this.osdViewer = null;
        }
    }

    private async mountOSD(slide: Slide) {
        const meta: TileMetadata = await fetch(
            `${this.tileServerBase}/tiles/${slide.image_id}/metadata`
        ).then(r => r.json());

        // Lazy-import so OSD (large library) is only bundled when needed.
        // Dynamic require() is handled by rspack at build time; the ES6
        // tsconfig target doesn't support import() syntax so we cast.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const OpenSeadragon = ((await new Promise<any>(resolve =>
            // @ts-ignore
            require.ensure([], (require: any) => resolve(require('openseadragon')), 'openseadragon')
        ))) as typeof import('openseadragon');

        // Container might have unmounted while we were awaiting
        if (!this.viewerContainerRef.current) return;

        this.destroyViewer();

        const baseUrl = this.tileServerBase;
        const imageId = slide.image_id;
        const maxZoom = meta.max_zoom;
        const tileSize = meta.tile_size;

        this.osdViewer = OpenSeadragon({
            element: this.viewerContainerRef.current,
            showNavigationControl: true,
            showNavigator: true,
            navigatorPosition: 'BOTTOM_RIGHT',
            crossOriginPolicy: 'Anonymous',
            prefixUrl: '', // prevents OSD looking for button images
            showFullPageControl: false,
            gestureSettingsMouse: { clickToZoom: false },
            tileSources: {
                // OSD level 0 = most zoomed out (1 tile)
                // OSD level maxZoom = full resolution
                // Our /zxy/{z}/{x}/{y} uses the same XYZ convention
                width: meta.dimensions.width,
                height: meta.dimensions.height,
                tileWidth: tileSize,
                tileHeight: tileSize,
                maxLevel: maxZoom,
                minLevel: 0,
                getTileUrl(level: number, x: number, y: number): string {
                    return `${baseUrl}/tiles/${imageId}/zxy/${level}/${x}/${y}`;
                },
            },
        });

        action(() => {
            this.viewerReady = true;
        })();
    }

    // ---- render ----

    render() {
        const { height } = this.props;
        const { loading, error, hierarchy, selectedSlide } = this;

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
            <div style={{ display: 'flex', height, overflow: 'hidden' }}>
                <SlideSidebar
                    hierarchy={hierarchy}
                    selectedSlide={selectedSlide}
                    onSelectSlide={this.selectSlide}
                />
                <div style={{ flex: 1, position: 'relative', background: '#1a1a1a' }}>
                    {/* OSD mounts into this div */}
                    <div
                        ref={this.viewerContainerRef}
                        style={{ width: '100%', height: '100%' }}
                    />
                    {!this.viewerReady && selectedSlide && (
                        <div style={overlayStyle}>
                            <LoadingIndicator isLoading={true} center={true} size="big" />
                        </div>
                    )}
                    {!selectedSlide && (
                        <div style={overlayStyle}>
                            <span style={{ color: '#888' }}>No servable slides for this patient</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

// ---- sub-components ----

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
};

interface SidebarProps {
    hierarchy: PatientHierarchy;
    selectedSlide: Slide | null;
    onSelectSlide: (slide: Slide) => void;
}

function SlideSidebar({ hierarchy, selectedSlide, onSelectSlide }: SidebarProps) {
    return (
        <div
            style={{
                width: 230,
                minWidth: 230,
                overflowY: 'auto',
                borderRight: '1px solid #ddd',
                background: '#fafafa',
                padding: '8px 6px',
                fontSize: 12,
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#333' }}>
                {hierarchy.patient_id}
            </div>
            {hierarchy.samples.map(sample => (
                <div key={sample.sample_id} style={{ marginBottom: 10 }}>
                    <div style={{ color: '#666', fontSize: 11, marginBottom: 4, borderBottom: '1px solid #e8e8e8', paddingBottom: 3 }}>
                        {sample.sample_id}
                        {sample.cancer_type && ` · ${sample.cancer_type}`}
                    </div>
                    {sample.parts.map(part =>
                        part.blocks.map(block =>
                            block.slides.map(slide => (
                                <SlideItem
                                    key={slide.image_id}
                                    slide={slide}
                                    selected={selectedSlide?.image_id === slide.image_id}
                                    onClick={() => slide.can_serve_tiles && onSelectSlide(slide)}
                                />
                            ))
                        )
                    )}
                </div>
            ))}
        </div>
    );
}

function SlideItem({
    slide,
    selected,
    onClick,
}: {
    slide: Slide;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            title={slide.can_serve_tiles ? undefined : 'Tiles not available'}
            style={{
                padding: '4px 8px',
                marginBottom: 2,
                borderRadius: 3,
                cursor: slide.can_serve_tiles ? 'pointer' : 'default',
                background: selected ? '#0d6efd' : 'transparent',
                color: selected ? '#fff' : '#333',
                opacity: slide.can_serve_tiles ? 1 : 0.45,
                transition: 'background 0.1s',
            }}
        >
            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slide.stain_name}
            </div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>
                {slide.magnification && `${slide.magnification} · `}#{slide.image_id}
            </div>
        </div>
    );
}
