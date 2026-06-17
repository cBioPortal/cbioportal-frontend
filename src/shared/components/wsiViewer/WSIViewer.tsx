import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as OpenSeadragonLib from 'openseadragon';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    Slide,
    Sample,
    PatientHierarchy,
    TileMetadata,
    MutationDetail,
    CNADetail,
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

// ---- shared style constants ----
const inlineIconStyle: React.CSSProperties = { verticalAlign: 'middle', display: 'inline-block' };
const ellipsisStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const sectionTitleStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.8px' };
/** Shared header/cell base styles for the compact sidebar tables. */
const compactThStyle: React.CSSProperties = { fontSize: 10, color: C.muted, fontWeight: 600, textAlign: 'left', paddingBottom: 4, userSelect: 'none' };
const compactTdBase: React.CSSProperties = { fontSize: 11, paddingTop: 3, paddingBottom: 3, verticalAlign: 'middle' };
const compactTableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8, tableLayout: 'fixed' };

// ---- shared utility functions ----

/** Derive patient ID from sample ID by stripping the tumour-aliquot suffix. */
function getPatientId(sampleId: string): string {
    return sampleId.replace(/-T\d+.*$/i, '');
}

/** Build a cBioPortal patient URL (without sample). */
function buildPatientUrl(studyId: string, sampleId: string): string {
    return `/patient?studyId=${encodeURIComponent(studyId)}&caseId=${encodeURIComponent(getPatientId(sampleId))}`;
}

/** Build a cBioPortal sample URL (patient URL + sampleId param). */
function buildSampleUrl(studyId: string, sampleId: string): string {
    return `${buildPatientUrl(studyId, sampleId)}&sampleId=${encodeURIComponent(sampleId)}`;
}

/** Build an OncoKB gene/variant URL. */
function buildOncoKbUrl(gene: string, variant?: string): string {
    return `https://www.oncokb.org/gene/${encodeURIComponent(gene)}${variant ? '/' + encodeURIComponent(variant) : ''}`;
}

/** Split a `"GENE variant"` mutation token into `{ gene, variant }`. */
function parseMutationToken(token: string): { gene: string; variant: string } {
    const spaceIdx = token.indexOf(' ');
    return spaceIdx > 0
        ? { gene: token.slice(0, spaceIdx), variant: token.slice(spaceIdx + 1) }
        : { gene: token, variant: '' };
}

/** Split a semicolon/comma-delimited mutation list into individual tokens. */
function parseMutationTokens(value: string | null | undefined): string[] {
    return (value ?? '').split(/[;,]\s*/).map(s => s.trim()).filter(Boolean);
}

/** Normalize block display label from raw block_label + block_number fields. */
function normalizeBlockLabel(label: string | null | undefined, number?: string | number | null): string {
    return (label || '').trim() || (number != null ? String(number) : '');
}

/**
 * POST a JSON body and return the parsed response, or null if the response is
 * not ok.  All fetch calls that use method:POST + JSON body share this helper.
 */
async function postJson<T>(url: string, body: unknown): Promise<T | null> {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<T>;
}

/**
 * Fetch the first molecular profile ID of a given alteration type for a study.
 * Returns null if no profile is found or the request fails.
 */
async function getFirstMolecularProfileId(
    base: string,
    studyId: string,
    alterationType: string
): Promise<string | null> {
    const resp = await fetch(
        `${base}/api/studies/${encodeURIComponent(studyId)}/molecular-profiles` +
        `?molecularAlterationType=${alterationType}&projection=SUMMARY`
    );
    if (!resp.ok) return null;
    const profiles: Array<{ molecularProfileId: string }> = await resp.json();
    return profiles[0]?.molecularProfileId ?? null;
}

/** Stain classification for a slide — single source of truth. */
function getStainKind(slide: { is_hne?: boolean; is_ihc?: boolean }): 'hne' | 'ihc' | 'other' {
    return slide.is_hne ? 'hne' : slide.is_ihc ? 'ihc' : 'other';
}

/** Human-readable stain badge label (e.g. "H&E", "IHC", ""). */
function getStainBadge(slide: { is_hne?: boolean; is_ihc?: boolean }): string {
    return slide.is_hne ? 'H&E' : slide.is_ihc ? 'IHC' : '';
}

/** Sidebar nav dot colour for a slide. */
function getStainDotColor(slide: { is_hne?: boolean; is_ihc?: boolean }): string {
    return slide.is_hne ? C.blue : slide.is_ihc ? C.orange : '#aaa';
}

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
    /** True once OSD has drawn the first tile; used to show/hide the thumbnail
     *  underlay that covers the grey canvas while initial tiles are loading. */
    @observable private tilesReady = false;
    /** Separate flag that controls spinner visibility; set true on slide select,
     *  set false after viewerReady AND at least MIN_SPINNER_MS have elapsed.
     *  Decoupled from viewerReady so viewport setup isn't delayed. */
    @observable private spinnerVisible = false;
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
    /** Wall-clock time (ms) when the most recent selectSlide call started.
     *  Used to guarantee the loading spinner is visible for at least MIN_SPINNER_MS. */
    private loadingStart = 0;
    private static readonly MIN_SPINNER_MS = 250;
    /** Timer handle for the minimum-spinner-duration callback */
    private spinnerTimer: ReturnType<typeof setTimeout> | null = null;
    /** Debounce timer: delays mountOSD so rapid clicks only trigger one fetch */
    private selectSlideDebounce: ReturnType<typeof setTimeout> | null = null;

    /** Stable per-instance ID prefix for OSD custom nav button elements */
    private navId = `wsi-nav-${Math.random().toString(36).slice(2, 9)}`;

    constructor(props: Props) {
        super(props);
        makeObservable(this);
    }

    // ---- URL state helpers ----

    /**
     * Encode current viewer state into the URL hash so the view can be shared.
     * Hash format: #wsi:slide=<imageId>&x=<px>&y=<py>&z=<zoom>
     * Does not clobber unrelated hash fragments since we namespace with "wsi:".
     */
    private writeHashState() {
        if (typeof window === 'undefined' || !this.osdViewer?.viewport || !this.selectedSlide) return;
        try {
            const vp = this.osdViewer.viewport;
            const center = vp.viewportToImageCoordinates(vp.getCenter());
            const zoom = vp.getZoom();
            const params = new URLSearchParams({
                slide: this.selectedSlide.image_id,
                x: Math.round(center.x).toString(),
                y: Math.round(center.y).toString(),
                z: zoom.toFixed(6),
            });
            // Use replaceState so we don't fire a hashchange event (which could
            // interfere with cBioPortal's own hash-based navigation) and don't
            // pollute the browser history on every pan/zoom.
            const url = new URL(window.location.href);
            url.hash = `wsi:${params.toString()}`;
            window.history.replaceState(null, '', url.toString());
        } catch (_) { /* viewport not ready */ }
    }

    /** Parse the #wsi:... hash; returns null if not present or malformed. */
    private static readHashState(): { slideId: string; x: number; y: number; z: number } | null {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash;
        const prefix = '#wsi:';
        if (!hash.startsWith(prefix)) return null;
        try {
            const params = new URLSearchParams(hash.slice(prefix.length));
            const slideId = params.get('slide') ?? '';
            const x = parseFloat(params.get('x') ?? 'NaN');
            const y = parseFloat(params.get('y') ?? 'NaN');
            const z = parseFloat(params.get('z') ?? 'NaN');
            if (!slideId || !isFinite(x) || !isFinite(y) || !isFinite(z)) return null;
            return { slideId, x, y, z };
        } catch (_) {
            return null;
        }
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
        if (this.selectSlideDebounce !== null) {
            clearTimeout(this.selectSlideDebounce);
            this.selectSlideDebounce = null;
        }
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
        this.spinnerVisible = false;
        this.metaCache.clear();
        // Invalidate any in-flight mountOSD from a previous patient.
        this.mountSeq++;

        try {
            const base = this.tileServerBase;
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

            // Enrich sample metadata from cBioPortal in the background.
            // Overwrites Databricks-sourced clinical/sequencing fields (TMB, MSI,
            // tumor purity, oncogenic mutations, …) with authoritative cBioPortal
            // values.  Runs fire-and-forget; tile-server data is the fallback.
            if (this.props.studyId) {
                void this.enrichSamplesFromCbioportal();
            }

            // Auto-select first servable H&E slide, else first servable slide.
            // If the URL hash encodes a prior view, honour that slide instead.
            const allSlides = this.servableSlides;
            const hashState = WSIViewer.readHashState();
            const fromHash = hashState
                ? allSlides.find(s => s.slide.image_id === hashState.slideId)
                : undefined;
            const first = fromHash ?? allSlides.find(s => s.slide.is_hne) ?? allSlides[0];
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
     * first one), fetch metadata + thumbnail. Both endpoints cache results in
     * Redis so every subsequent user click is served instantly.
     *
     * Thumbnails are fired all at once (the server queues them across its workers)
     * so the Redis cache is populated as fast as possible. Metadata is fetched
     * serially to avoid overwhelming the S3/SVS pipeline. Warmup calls are
     * intentionally omitted — they load each SVS into every worker's in-process
     * cache simultaneously which causes OOM kills under the default 4 GiB limit.
     */
    private async prefetchSlideMetadata(skipImageId?: string) {
        const slides = this.servableSlides
            .map(s => s.slide)
            .filter(sl => sl.image_id !== skipImageId && !this.metaCache.has(sl.image_id));

        if (slides.length === 0) return;
        const base = this.tileServerBase;

        // Fire thumbnail fetches in small batches to avoid overwhelming the tile server.
        // Generates thumbnails in advance so the sidebar loads instantly on first click.
        // Batch size matches n_workers (4) so every worker handles exactly one thumbnail
        // at a time — enough to parallelize without creating a pile-up.
        const THUMB_BATCH = 4;
        for (let i = 0; i < slides.length; i += THUMB_BATCH) {
            if (!this.hierarchy) return;
            for (const sl of slides.slice(i, i + THUMB_BATCH)) {
                fetch(`${base}/tiles/${sl.image_id}/thumbnail`).catch(() => {});
            }
            if (i + THUMB_BATCH < slides.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        // Fetch metadata serially to keep the SVS pipeline pressure manageable.
        for (const sl of slides) {
            if (!this.hierarchy) return;
            await fetch(`${base}/tiles/${sl.image_id}/metadata`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then((meta: TileMetadata) => { this.metaCache.set(sl.image_id, meta); })
                .catch(() => {});
            // Brief pause to avoid S3 connection pile-up.
            await new Promise(r => setTimeout(r, 150));
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

    /**
     * Base URL for cBioPortal API calls.
     * When the viewer is embedded inside cBioPortal (PatientViewPageTabs), relative
     * paths work natively.  When the resource URL carries a `cbioUrl` query param
     * (ResourceTab / dev-test setup), we use that value instead.
     */
    @computed private get cbioApiBase(): string {
        try {
            const cbioUrl = new URL(this.props.url).searchParams.get('cbioUrl');
            if (cbioUrl) return cbioUrl;
        } catch {
            // props.url may not be a full URL in some test setups
        }
        return '';
    }

    /**
     * Enrich sample metadata (TMB, MSI, tumor purity, oncogenic mutations, …) from
     * cBioPortal's REST API so the sidebar reflects the same data shown elsewhere in
     * cBioPortal rather than a potentially-stale Databricks snapshot.
     *
     * Runs as a fire-and-forget background task after the tile-server hierarchy is
     * loaded.  If cBioPortal is unavailable, the tile-server data remains as-is.
     */
    @action.bound
    private async enrichSamplesFromCbioportal(): Promise<void> {
        const { studyId } = this.props;
        const hier = this.hierarchy;
        if (!studyId || !hier?.samples.length) return;

        const base = this.cbioApiBase;
        const sampleIdentifiers = hier.samples
            .filter(s => s.sample_id)
            .map(s => ({ studyId, sampleId: s.sample_id }));
        if (!sampleIdentifiers.length) return;

        try {
            // Run sequentially: clinical data must populate oncogenic_mutations first
            // so that fetchAndMergeMutations can attach type/VAF details to the
            // correct token list when building oncogenic_mutation_details.
            await this.fetchAndMergeClinicalData(base, studyId, sampleIdentifiers);
            await this.fetchAndMergeMutations(base, studyId, sampleIdentifiers);
            // OncoKB annotations run after mutations so mutation details are ready.
            // Errors are swallowed — the tooltip simply won't appear if OncoKB is unreachable.
            void this.fetchAndMergeOncoKbAnnotations();
            void this.fetchAndMergeMutationFrequency(base, studyId);
            await this.fetchAndMergeCNA(base, studyId, sampleIdentifiers);
        } catch {
            // Silently fall back to tile-server data
        }
    }

    /**
     * Fetch sample-level clinical attributes from cBioPortal and merge them into
     * the in-memory hierarchy samples.  Only attributes present in the response
     * are updated; missing attributes keep their tile-server values.
     */
    private async fetchAndMergeClinicalData(
        base: string,
        studyId: string,
        sampleIdentifiers: Array<{ studyId: string; sampleId: string }>
    ): Promise<void> {
        // cBioPortal v7+ uses "identifiers"/"entityId"; older versions used
        // "sampleIdentifiers"/"sampleId". Try v7 format first.
        const identifiers = sampleIdentifiers.map(s => ({
            studyId: s.studyId,
            entityId: s.sampleId,
        }));
        const resp = await fetch(
            `${base}/api/clinical-data/fetch?clinicalDataType=SAMPLE&projection=SUMMARY`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifiers }),
            }
        );
        if (!resp.ok) return;

        const text = await resp.text();
        if (!text) return;
        const data: Array<{ sampleId: string; clinicalAttributeId: string; value: string }> =
            JSON.parse(text);

        // Build lookup: sampleId → Map<attributeId, value>
        const byId = new Map<string, Map<string, string>>();
        for (const item of data) {
            if (!byId.has(item.sampleId)) byId.set(item.sampleId, new Map());
            byId.get(item.sampleId)!.set(item.clinicalAttributeId, item.value);
        }

        // Helper: try multiple attribute IDs and return first match
        const get = (attrs: Map<string, string>, ids: string[]): string | undefined =>
            ids.map(id => attrs.get(id)).find(v => v != null && v !== '');

        action(() => {
            for (const sample of this.hierarchy!.samples) {
                const attrs = byId.get(sample.sample_id);
                if (!attrs) continue;
                const set = <K extends keyof Sample>(
                    key: K,
                    ids: string[]
                ): void => {
                    const v = get(attrs, ids);
                    if (v !== undefined) (sample as Sample)[key] = v as Sample[K];
                };
                set('cancer_type',          ['CANCER_TYPE']);
                set('cancer_type_detailed', ['CANCER_TYPE_DETAILED']);
                set('oncotree_code',        ['ONCOTREE_CODE']);
                set('primary_site',         ['PRIMARY_SITE']);
                set('sample_type',          ['SAMPLE_TYPE']);
                set('metastatic_site',      ['METASTATIC_SITE']);
                set('tumor_purity',         ['TUMOR_PURITY', 'CVR_TUMOR_PURITY']);
                set('tmb_score',            ['CVR_TMB_SCORE', 'TMB_NONSYNONYMOUS', 'TMB_SCORE']);
                set('msi_type',             ['MSI_TYPE', 'MSI_SCORE', 'MSI_STATUS']);
                set('oncogenic_mutations',  ['ONCOGENIC_MUTATIONS', 'CVR_ONCOGENIC_MUTATIONS']);
                set('num_oncogenic_mutations', ['NUM_ONCOGENIC_MUTATIONS', 'CVR_NUM_ONCOGENIC_MUTATIONS']);
            }
        })();
    }

    /**
     * Fetch somatic mutations from cBioPortal mutations API.
     * Populates `oncogenic_mutations` (the display list) from ALL mutations returned by the
     * API — matching what cBioPortal's patient page shows — and sets `oncogenic_mutation_details`
     * (type, VAF per mutation) for tooltip display.  If the API returns no data, falls back to
     * whatever `fetchAndMergeClinicalData` already placed in `oncogenic_mutations`.
     */
    private async fetchAndMergeMutations(
        base: string,
        studyId: string,
        sampleIdentifiers: Array<{ studyId: string; sampleId: string }>
    ): Promise<void> {
        // Declare maps here so the finally block can always mark details as ready,
        // even when the function returns early due to an error or missing data.
        const allMutsBySample = new Map<string, Array<{ token: string; vaf: number }>>();
        const detailsBySample = new Map<string, Map<string, MutationDetail>>();
        try {
        // Find the MUTATION_EXTENDED molecular profile for this study
        const molecularProfileId = await getFirstMolecularProfileId(base, studyId, 'MUTATION_EXTENDED');
        if (!molecularProfileId) return;

        const sampleMolecularIdentifiers = sampleIdentifiers.map(s => ({
            molecularProfileId,
            sampleId: s.sampleId,
        }));

        const mutations: Array<{
            sampleId: string;
            entrezGeneId?: number;
            gene?: { hugoGeneSymbol: string; entrezGeneId?: number } | null;
            proteinChange: string;
            mutationType?: string;
            driverFilter?: string;
            driverFilterAnnotation?: string;
            tumorAltCount?: number;
            tumorRefCount?: number;
            proteinPosStart?: number;
            proteinPosEnd?: number;
        }> | null = await postJson(
            `${base}/api/mutations/fetch?projection=DETAILED`,
            { sampleMolecularIdentifiers }
        );
        if (!mutations) return;

        if (!mutations) return;

        // Build per-sample detail maps and mutation lists from ALL returned mutations.
        // Tokens use "GENE p.Variant" format (OncoKB convention); the API returns
        // proteinChange without the "p." prefix (e.g. "G13D"), so we normalise here.
        for (const m of mutations) {
            const geneSymbol = m.gene?.hugoGeneSymbol;
            if (!geneSymbol) continue;

            const pc = m.proteinChange.startsWith('p.') ? m.proteinChange : `p.${m.proteinChange}`;
            const token = `${geneSymbol} ${pc}`;
            const total = (m.tumorAltCount ?? 0) + (m.tumorRefCount ?? 0);
            const vaf = total > 0 ? Math.round(m.tumorAltCount! / total * 100) : 0;

            if (!detailsBySample.has(m.sampleId)) detailsBySample.set(m.sampleId, new Map());
            const detail: MutationDetail = {
                token,
                type: formatMutationType(m.mutationType ?? ''),
                vaf: total > 0 ? vaf : undefined,
                annotation: m.driverFilterAnnotation || undefined,
                entrezGeneId: m.gene?.entrezGeneId ?? m.entrezGeneId,
                consequence: m.mutationType,
                proteinStart: m.proteinPosStart,
                proteinEnd: m.proteinPosEnd,
            };
            detailsBySample.get(m.sampleId)!.set(token, detail);

            if (!allMutsBySample.has(m.sampleId)) allMutsBySample.set(m.sampleId, []);
            allMutsBySample.get(m.sampleId)!.push({ token, vaf });
        }

        // Sort each sample's list by VAF descending so the most clonal mutations appear first.
        for (const muts of allMutsBySample.values()) {
            muts.sort((a, b) => b.vaf - a.vaf);
        }

        } catch (e) {
            console.error('[WSIViewer] fetchAndMergeMutations failed:', e);
        } finally {
            // Always set oncogenic_mutation_details so buildSeqRows knows the fetch
            // completed and can safely render links (with or without tooltip data).
            action(() => {
                for (const sample of this.hierarchy!.samples) {
                    const apiMuts = allMutsBySample.get(sample.sample_id);
                    if (apiMuts?.length) {
                        // Use the full API list as the source of truth, matching cBioPortal's
                        // patient page.  CVR_ONCOGENIC_MUTATIONS (set by fetchAndMergeClinicalData)
                        // may be a curated subset; override it with the complete picture.
                        sample.oncogenic_mutations = apiMuts.map(m => m.token).join('; ');
                    }
                    if (sample.oncogenic_mutations) {
                        const sampleDetails = detailsBySample.get(sample.sample_id);
                        const tokens = parseMutationTokens(sample.oncogenic_mutations);
                        // Build detail list; fall back to token-only entry if API returned no data.
                        sample.oncogenic_mutation_details = tokens.map(t => sampleDetails?.get(t) ?? { token: t });
                    }
                }
            })();
        }
    }

    /**
     * Fetch OncoKB annotations for all mutations collected by fetchAndMergeMutations and
     * merge oncogenic / mutationEffect / hotspot / geneSummary / variantSummary into each
     * MutationDetail object in-place so that MutationTable can show rich tooltips.
     *
     * Routes through the tile server's /api/oncokb/annotate endpoint (same origin as the
     * viewer) to avoid CORS restrictions when calling the OncoKB API directly.
     *
     * Silently no-ops when the tile server doesn't have an OncoKB token configured
     * (endpoint returns 503) or when the hierarchy has no mutations with entrezGeneId.
     */
    private async fetchAndMergeOncoKbAnnotations(): Promise<void> {
        // Collect all MutationDetail objects that have enough data for an OncoKB query
        const allDetails: MutationDetail[] = [];
        for (const sample of this.hierarchy?.samples ?? []) {
            for (const d of sample.oncogenic_mutation_details ?? []) {
                if (d.entrezGeneId) allDetails.push(d);
            }
        }
        if (!allDetails.length) return;

        // Build the batch request body — one item per unique mutation id
        interface OncoKbItem {
            id: string;
            alteration: string;
            consequence?: string;
            gene: { entrezGeneId: number };
            proteinStart?: number;
            proteinEnd?: number;
            tumorType: null;
        }
        const seen = new Set<string>();
        const items: OncoKbItem[] = [];
        for (const d of allDetails) {
            // Strip the "p." prefix to get raw alteration (e.g. "G13D")
            const { variant: variantRaw } = parseMutationToken(d.token);
            const alteration = variantRaw.startsWith('p.') ? variantRaw.slice(2) : variantRaw;
            const id = `${d.entrezGeneId}_${alteration}_${d.consequence ?? ''}`;
            if (seen.has(id)) continue;
            seen.add(id);
            items.push({
                id,
                alteration,
                consequence: d.consequence,
                gene: { entrezGeneId: d.entrezGeneId! },
                proteinStart: d.proteinStart,
                proteinEnd: d.proteinEnd,
                tumorType: null,
            });
        }

        // Use origin (strip path/query) so we hit the tile server root, not a sub-path
        let tileOrigin: string;
        try {
            tileOrigin = new URL(this.props.url).origin;
        } catch {
            tileOrigin = this.tileServerBase;
        }
        if (!tileOrigin) return;

        let annotations: Array<{
            query: { id: string };
            oncogenic?: string;
            mutationEffect?: { knownEffect?: string };
            hotspot?: boolean;
            geneSummary?: string;
            variantSummary?: string;
        }>;
        try {
            annotations = await postJson<typeof annotations[0][]>(`${tileOrigin}/api/oncokb/annotate`, items) ?? [];
            if (!annotations.length) return;
        } catch {
            return;  // Network error — tooltip will simply not appear
        }

        const byId = new Map(annotations.map(a => [a.query.id, a]));

        action(() => {
            for (const d of allDetails) {
                const { variant: variantRaw2 } = parseMutationToken(d.token);
                const alteration = variantRaw2.startsWith('p.') ? variantRaw2.slice(2) : variantRaw2;
                const id = `${d.entrezGeneId}_${alteration}_${d.consequence ?? ''}`;
                const ann = byId.get(id);
                if (!ann) return;
                d.oncogenic = ann.oncogenic;
                d.mutationEffect = ann.mutationEffect?.knownEffect;
                d.hotspot = ann.hotspot;
                d.geneSummary = ann.geneSummary;
                d.variantSummary = ann.variantSummary;
            }
        })();
    }

    /**
     * Fetch significant discrete copy-number alterations (value ≠ 0) from cBioPortal
     * and merge them into each sample's `cna_alterations` field.
     */
    private async fetchAndMergeCNA(
        base: string,
        studyId: string,
        sampleIdentifiers: Array<{ studyId: string; sampleId: string }>
    ): Promise<void> {
        const profileId = await getFirstMolecularProfileId(base, studyId, 'COPY_NUMBER_ALTERATION');
        if (!profileId) return;

        const sampleIds = sampleIdentifiers.map(s => s.sampleId);
        const data: Array<{
            sampleId: string;
            value: number;
            gene?: { hugoGeneSymbol: string } | null;
        }> | null = await postJson(
            `${base}/api/molecular-profiles/${encodeURIComponent(profileId)}/molecular-data/fetch?projection=DETAILED`,
            { sampleIds }
        );
        if (!data) return;

        // Group by sample; keep only significant events (value ≠ 0)
        const bySample = new Map<string, CNADetail[]>();
        for (const d of data) {
            if (d.value === 0) continue;
            const gene = d.gene?.hugoGeneSymbol;
            if (!gene) continue;
            if (!bySample.has(d.sampleId)) bySample.set(d.sampleId, []);
            bySample.get(d.sampleId)!.push({ gene, cnaValue: d.value });
        }
        // Sort: deep events (|value| = 2) before shallow (|value| = 1); within tier by gene name
        for (const cnList of bySample.values()) {
            cnList.sort((a, b) => Math.abs(b.cnaValue) - Math.abs(a.cnaValue) || a.gene.localeCompare(b.gene));
        }

        action(() => {
            for (const sample of this.hierarchy!.samples) {
                const cnList = bySample.get(sample.sample_id);
                if (cnList?.length) sample.cna_alterations = cnList;
            }
        })();
    }

    /**
     * Fetch cohort mutation frequencies for all mutations and store as fraction (0–1)
     * in each MutationDetail's `cohortFrequency` field.
     * Uses /api/mutation-counts-by-position/fetch and the study's sequencedSampleCount.
     */
    private async fetchAndMergeMutationFrequency(base: string, studyId: string): Promise<void> {
        // Collect unique positions across all samples
        interface PosKey { entrezGeneId: number; proteinPosStart: number; proteinPosEnd: number; }
        const posMap = new Map<string, PosKey>();
        for (const sample of this.hierarchy?.samples ?? []) {
            for (const d of sample.oncogenic_mutation_details ?? []) {
                if (d.entrezGeneId && d.proteinStart != null && d.proteinEnd != null) {
                    const key = `${d.entrezGeneId}_${d.proteinStart}_${d.proteinEnd}`;
                    posMap.set(key, { entrezGeneId: d.entrezGeneId, proteinPosStart: d.proteinStart, proteinPosEnd: d.proteinEnd });
                }
            }
        }
        if (!posMap.size) return;

        try {
            const [studyResp, counts] = await Promise.all([
                fetch(`${base}/api/studies/${encodeURIComponent(studyId)}`),
                postJson<Array<{ entrezGeneId: number; proteinPosStart: number; proteinPosEnd: number; count: number }>>(
                    `${base}/api/mutation-counts-by-position/fetch`,
                    [...posMap.values()]
                ),
            ]);
            if (!studyResp.ok || !counts) return;

            const study: { sequencedSampleCount?: number } = await studyResp.json();
            const total = study.sequencedSampleCount ?? 0;
            if (!total) return;

            // Build lookup: posKey → fraction
            const freqByKey = new Map<string, number>();
            for (const c of counts) {
                const key = `${c.entrezGeneId}_${c.proteinPosStart}_${c.proteinPosEnd}`;
                freqByKey.set(key, c.count / total);
            }

            action(() => {
                for (const sample of this.hierarchy?.samples ?? []) {
                    for (const d of sample.oncogenic_mutation_details ?? []) {
                        if (d.entrezGeneId && d.proteinStart != null && d.proteinEnd != null) {
                            const key = `${d.entrezGeneId}_${d.proteinStart}_${d.proteinEnd}`;
                            const freq = freqByKey.get(key);
                            if (freq !== undefined) d.cohortFrequency = freq;
                        }
                    }
                }
            })();
        } catch {
            // Non-critical — cohort % simply won't appear
        }
    }

    // ---- slide selection ----

    /** How long to wait after the last click before actually mounting OSD.
     *  Prevents N concurrent metadata fetches when clicking through slides quickly. */
    private static readonly SELECT_DEBOUNCE_MS = 150;

    @action.bound
    selectSlide(slide: Slide, sample: Sample) {
        // Update UI state immediately for instant visual feedback.
        this.selectedSlide = slide;
        this.selectedSample = sample;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.tilesReady = false;
        this.spinnerVisible = true;
        this.error = null;
        this.loadingStart = Date.now();
        // Cancel any pending spinner-hide timer from the previous slide.
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        // Bump the sequence so any in-flight mountOSD call can detect it's stale.
        const seq = ++this.mountSeq;
        // Debounce: if the user clicks another slide within SELECT_DEBOUNCE_MS,
        // cancel this pending mount. Only the last-clicked slide triggers a fetch.
        if (this.selectSlideDebounce !== null) {
            clearTimeout(this.selectSlideDebounce);
        }
        this.selectSlideDebounce = setTimeout(() => {
            this.selectSlideDebounce = null;
            void this.mountOSD(slide, seq);
        }, WSIViewer.SELECT_DEBOUNCE_MS);
    }

    // ---- OpenSeadragon ----

    /** Navigate to image-pixel coordinates entered in the coordinate bar. */
    @action.bound
    goToCoordinates() {
        if (!this.osdViewer) return;
        let x = parseInt(this.coordInputX, 10);
        let y = parseInt(this.coordInputY, 10);
        if (!isFinite(x) || !isFinite(y)) return;
        // Clamp to image boundaries so the view stays within the slide.
        const dim = this.selectedMeta?.dimensions;
        if (dim) {
            x = Math.max(0, Math.min(x, dim.width  - 1));
            y = Math.max(0, Math.min(y, dim.height - 1));
            this.coordInputX = String(x);
            this.coordInputY = String(y);
        }
        const imgPoint = new (OpenSeadragon as any).Point(x, y);
        const vpPoint = this.osdViewer.viewport.imageToViewportCoordinates(imgPoint);
        this.osdViewer.viewport.panTo(vpPoint, false);
    }

    /** Download the current viewport as a JPEG image. */
    downloadView() {
        // OSD renders into drawer.canvas (CanvasDrawer) or a WebGL canvas.
        const canvas: HTMLCanvasElement | null =
            this.osdViewer?.drawer?.canvas ??
            this.osdViewer?.canvas ??
            null;
        if (!canvas) return;

        try {
            const vp = this.osdViewer.viewport;
            const center = vp.viewportToImageCoordinates(vp.getCenter());
            const x = Math.round(center.x);
            const y = Math.round(center.y);
            const patientId = this.hierarchy?.patient_id ?? 'patient';
            const slideId = this.selectedSlide?.image_id ?? 'slide';
            const filename = `wsi-${patientId}-${slideId}-x${x}-y${y}.jpg`;

            canvas.toBlob(blob => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.92);
        } catch (_) { /* canvas tainted or not ready */ }
    }

    /** Write current view to URL hash then copy the full URL to clipboard. */
    async copyViewLink() {
        this.writeHashState();
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
        } catch (_) {
            // Fallback for non-secure contexts (http, old browsers)
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
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
            // Fire thumbnail fetch in parallel so the tile server generates it
            // while we're waiting for metadata — by the time the sidebar img renders
            // the response will be in-flight or already cached by the browser.
            fetch(`${this.tileServerBase}/tiles/${slide.image_id}/thumbnail`).catch(() => {});
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
                // Use our custom Bootstrap-styled elements instead of OSD's default image buttons
                zoomInButton: `${this.navId}-zoom-in`,
                zoomOutButton: `${this.navId}-zoom-out`,
                homeButton: `${this.navId}-home`,
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

            // Restore viewport position from URL hash if present for this slide,
            // otherwise center on the middle of the image.
            //
            // IMPORTANT: read the hash BEFORE registering animation-finish, because
            // OSD may fire animation-finish for its initial fit animation, which would
            // overwrite the shared-link hash before we restore from it.
            const hashState = WSIViewer.readHashState();
            try {
                const vp = this.osdViewer.viewport;
                if (hashState && hashState.slideId === slide.image_id) {
                    const imgPt = new (OpenSeadragon as any).Point(hashState.x, hashState.y);
                    const vpPt = vp.imageToViewportCoordinates(imgPt);
                    vp.panTo(vpPt, true);   // immediately (no animation)
                    vp.zoomTo(hashState.z, undefined, true);
                } else {
                    // Pan to image center immediately so we don't start at (0,0).
                    // goHome() snaps to zoom-to-fit centered — pass true for no animation.
                    vp.goHome(true);
                }
                // Write hash now so the URL reflects the opened slide and position
                // (for fresh opens this writes the home position; for restores it
                // writes the restored position).
                this.writeHashState();
            } catch (_) { /* ignore — viewport not ready */ }

            // Register ongoing hash write AFTER the initial viewport setup so that
            // OSD's own initial-fit animation-finish event (if any) doesn't
            // overwrite the shared-link coordinates before we restore them.
            this.osdViewer.addHandler('animation-finish', () => {
                this.writeHashState();
            });

            // Keep the spinner visible until the first tile image is received from the
            // server (tile-loaded).  OSD 6 uses WebGL which does not fire tile-drawn,
            // but tile-loaded fires in all drawer backends as soon as the network
            // response arrives — which is the earliest signal that the slide is ready.
            // MIN_SPINNER_MS is still respected.  20s fallback covers tile errors.
            const hideSpinner = action(() => {
                if (seq !== this.mountSeq) return;
                if (this.spinnerTimer !== null) { clearTimeout(this.spinnerTimer); this.spinnerTimer = null; }
                this.spinnerVisible = false;
                this.tilesReady = true;
            });
            // Fallback: hide after 20s in case tile-loaded never fires (tile errors,
            // slow server).  open-failed is handled separately below.
            if (this.spinnerTimer !== null) clearTimeout(this.spinnerTimer);
            this.spinnerTimer = setTimeout(hideSpinner, 20_000);

            this.osdViewer.addOnceHandler('tile-loaded', () => {
                const remaining = Math.max(0, WSIViewer.MIN_SPINNER_MS - (Date.now() - this.loadingStart));
                if (remaining > 0) {
                    if (this.spinnerTimer !== null) clearTimeout(this.spinnerTimer);
                    this.spinnerTimer = setTimeout(hideSpinner, remaining);
                } else {
                    hideSpinner();
                }
            });
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
                    {/* Custom Bootstrap-styled OSD nav buttons — always in DOM so OSD can adopt them.
                        OSD wires zoom-in/zoom-out/home handlers onto these elements via the
                        zoomInButton/zoomOutButton/homeButton options in mountOSD. */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            zIndex: 100,
                        }}
                    >
                        <button
                            id={`${this.navId}-zoom-in`}
                            className="btn btn-default btn-sm"
                            title="Zoom in"
                            style={{ width: 28, padding: '3px 0', lineHeight: 1 }}
                        >
                            <i className="fa fa-plus" />
                        </button>
                        <button
                            id={`${this.navId}-zoom-out`}
                            className="btn btn-default btn-sm"
                            title="Zoom out"
                            style={{ width: 28, padding: '3px 0', lineHeight: 1 }}
                        >
                            <i className="fa fa-minus" />
                        </button>
                        <button
                            id={`${this.navId}-home`}
                            className="btn btn-default btn-sm"
                            title="Fit to view"
                            style={{ width: 28, padding: '3px 0', lineHeight: 1 }}
                        >
                            <i className="fa fa-home" />
                        </button>
                    </div>
                    {this.spinnerVisible && selectedSlide && (
                        <div data-testid="wsi-loading-spinner" style={{ ...overlayStyle, background: 'rgba(232,232,232,0.75)' }}>
                            <i className="fa fa-spinner fa-spin fa-3x" style={{ color: '#888' }} />
                        </div>
                    )}
                    {!selectedSlide && (
                        <div style={overlayStyle}>
                            <span style={{ color: C.muted, fontSize: 13 }}>No servable slides for this patient</span>
                        </div>
                    )}
                    {this.tilesReady && (
                        <CoordBar
                            inputX={this.coordInputX}
                            inputY={this.coordInputY}
                            cursorPos={this.cursorPos}
                            mpp={selectedMeta?.mpp}
                            onChangeX={action((v: string) => { this.coordInputX = v; })}
                            onChangeY={action((v: string) => { this.coordInputY = v; })}
                            onGo={this.goToCoordinates}
                            onCopyLink={() => this.copyViewLink()}
                            onDownload={() => this.downloadView()}
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
    position: 'absolute', inset: 0, zIndex: 10, display: 'flex',
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
    onCopyLink: () => void;
    onDownload: () => void;
}

function CoordBar({ inputX, inputY, cursorPos, mpp, onChangeX, onChangeY, onGo, onCopyLink, onDownload }: CoordBarProps) {
    const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') onGo(); };
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    let cursorLabel = '';
    if (cursorPos) {
        cursorLabel = `${cursorPos.x.toLocaleString()} × ${cursorPos.y.toLocaleString()} px`;
        if (mpp) {
            const umX = (cursorPos.x * mpp.x).toFixed(1);
            const umY = (cursorPos.y * mpp.y).toFixed(1);
            cursorLabel += `  (${umX} × ${umY} μm)`;
        }
    }

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
            <div className="input-group input-group-sm" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: C.muted }}>X</span>
                <input
                    type="number"
                    value={inputX}
                    placeholder="px"
                    className="form-control input-sm"
                    style={{ width: 88 }}
                    onChange={e => onChangeX(e.target.value)}
                    onKeyDown={handleKey}
                />
                <span style={{ color: C.muted }}>Y</span>
                <input
                    type="number"
                    value={inputY}
                    placeholder="px"
                    className="form-control input-sm"
                    style={{ width: 88 }}
                    onChange={e => onChangeY(e.target.value)}
                    onKeyDown={handleKey}
                />
            </div>
            <button className="btn btn-primary btn-sm" onClick={onGo}>
                Go
            </button>
            <DefaultTooltip
                trigger={['hover']}
                placement="top"
                overlay={<span>Copy a link to this exact view (slide, position, zoom)</span>}
            >
                <button
                    className={`btn btn-default btn-sm`}
                    data-testid="wsi-share-button"
                    onClick={handleCopy}
                >
                    {copied
                        ? <i className="fa fa-check" />
                        : <i className="fa fa-clipboard" />
                    }
                </button>
            </DefaultTooltip>
            <DefaultTooltip
                trigger={['hover']}
                placement="top"
                overlay={<span>Download current viewport as JPEG</span>}
            >
                <button className="btn btn-default btn-sm" data-testid="wsi-download-button" onClick={onDownload}>
                    <i className="fa fa-cloud-download" />
                </button>
            </DefaultTooltip>
            {cursorPos && (
                <span style={{ marginLeft: 'auto', color: C.muted, fontFamily: 'monospace', fontSize: 11 }}>
                    <i className="fa fa-crosshairs" style={{ marginRight: 3 }} />
                    {cursorLabel}
                </span>
            )}
        </div>
    );
}

function cleanStain(name: string): string {
    return (name || '').replace(/^DM\s+/i, '') || '—';
}

/**
 * Parse the section identifier out of a pathology barcode.
 * Barcode format: "<accession>;<section>;<lab>"  e.g. "S13-57848;S1;msk"
 * Returns the section field (e.g. "S1") or null if not parseable.
 */
function barcodeSection(barcode: string | null | undefined): string | null {
    if (!barcode) return null;
    const parts = barcode.split(';');
    return parts.length >= 2 ? (parts[1].trim() || null) : null;
}

/** Extract the surgical accession number from a barcode (the part before the first ";"). */
function barcodeAccession(barcode: string | null | undefined): string | null {
    if (!barcode) return null;
    const acc = barcode.split(';')[0].trim();
    return acc || null;
}

/**
 * Abbreviate a part_description to fit in the narrow sidebar label.
 * Truncates at the first "(", ";", comma-followed-by-whitespace, or at
 * MAX_LEN characters, whichever comes first.
 */
function abbreviatePartDesc(desc: string | null | undefined): string | null {
    if (!desc) return null;
    const MAX_LEN = 28;
    // Strip everything from the first parenthesis (e.g. "(fs)", "(MSK:...)")
    let s = desc.replace(/\s*[(\[;].*$/, '').trim();
    if (s.length <= MAX_LEN) return s || null;
    // Hard-truncate at a word boundary
    const cut = s.lastIndexOf(' ', MAX_LEN);
    return (cut > 10 ? s.slice(0, cut) : s.slice(0, MAX_LEN)).trim() + '…';
}

function fmtMB(bytes: string | number | null | undefined): string {
    const n = Number(bytes);
    if (!n) return '—';
    return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : (n / 1e6).toFixed(0) + ' MB';
}

/** Common pathology block letter codes → human-readable meaning. */
const BLOCK_CODE_MAP: Record<string, string> = {
    // Single-letter tissue region codes
    A:    'Apical',         B:    'Basal',          C:    'Central',
    D:    'Distal',         E:    'External',        F:    'Fragment',
    I:    'Inked Margin',   M:    'Margin',          N:    'Normal',
    P:    'Proximal',       R:    'Representative',  S:    'Section',
    T:    'Tumor',          U:    'Uninvolved',
    // Two-letter anatomical codes
    AC:   'Anterior/Caudal', BM:  'Bronchial Margin',
    DL:   'Distal Level',   DM:   'Deep Margin',
    GU:   'Genitourinary',  ML:   'Mesenteric Level',
    OM:   'Omental',        PL:   'Proximal Level',
    RM:   'Resection Margin', RS:  'Rep. Section',
    SM:   'Surgical Margin', ST:  'Stromal',
    TU:   'Tumor',
    // MSK pathology subspecialty/department codes
    // (block label uses dept code when tissue type is unambiguous within the case)
    BST:  'Bone/Soft Tissue',
    BRST: 'Breast',
    DERM: 'Dermatologic',
    GI:   'Gastrointestinal',
    GYN:  'Gynecologic',
    HEME: 'Hematologic',
    HN:   'Head & Neck',
    NEURO:'Neurologic',
    THOR: 'Thoracic',
    // Special processing codes
    ADD:  'Additional Section',
    FSC:  'Frozen Section',
    INK:  'Inked Margin',
    // Lymph node codes — spell out "Lymph Node" in full
    LN:   'Lymph Node',
    ALN:  'Axillary Lymph Node',  BLN:  'Bench Lymph Node',
    CLN:  'Central Lymph Node',   DLN:  'Distal Lymph Node',
    ILN:  'Inguinal Lymph Node',  LLN:  'Left Lymph Node',
    MLN:  'Mesenteric Lymph Node', NTLN: 'Non-Tumor Lymph Node',
    PLN:  'Pelvic Lymph Node',    RLN:  'Right Lymph Node',
    SLN:  'Sentinel Lymph Node',  SSLN: 'Sub-Site Lymph Node',
    TLN:  'Thoracic Lymph Node',
    // Other codes seen in MSK multi-site specimens
    RBL:  'Right Bowel Lumen',
};

/**
 * Decode the letter-code portion of a block label (e.g. "11 PL1" → "Proximal Level",
 * "9 M" → "Margin", "16 RLN" → "Right Lymph Node"). Returns null when unknown.
 */
function decodeBlockCode(label: string | null | undefined): string | null {
    if (!label) return null;
    const m = label.match(/^\d+\s+([A-Z]+)\d*$/);
    if (!m) return null;
    return BLOCK_CODE_MAP[m[1]] || null;
}

const BLOCK_LABEL_TIP =
    'Block label: number = block within case; letter code = tissue region (P=Proximal, D=Distal, M=Margin, RS=Rep. Section, LN=Lymph Node, RLN=Right Lymph Node, …)';


// ---- NavPanel ----

interface NavPanelProps {
    hierarchy: PatientHierarchy;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    onFilterChange: (f: 'all' | 'hne' | 'ihc') => void;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
}

function NavPanel({ hierarchy, selectedSlide, stainFilter, onFilterChange, onSelectSlide }: NavPanelProps) {
    const allSlides = hierarchy.samples.flatMap(s => s.parts.flatMap(p => p.blocks.flatMap(b => b.slides)));
    const counts = {
        all: allSlides.length,
        hne: allSlides.filter(s => s.is_hne).length,
        ihc: allSlides.filter(s => s.is_ihc).length,
    };
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
                <div style={sectionTitleStyle}>
                    Slides
                </div>
                <div className="btn-group btn-group-xs" style={{ marginTop: 7 }}>
                    {chips.map(chip => {
                        const count = counts[chip.key];
                        const disabled = chip.key !== 'all' && count === 0;
                        const active = stainFilter === chip.key;
                        return (
                            <button
                                key={chip.key}
                                className={`btn btn-xs ${active ? 'btn-primary' : 'btn-default'}`}
                                disabled={disabled}
                                onClick={() => onFilterChange(chip.key)}
                            >
                                {chip.key !== 'all' && (
                                    <i className="fa fa-circle" style={{ fontSize: 8, marginRight: 3, color: active ? undefined : chip.color, verticalAlign: 'middle' }} />
                                )}
                                {chip.key === 'hne' ? 'H&E' : chip.key === 'ihc' ? 'IHC' : 'All'}
                                {chip.key !== 'all' && <span style={{ marginLeft: 4, opacity: 0.8 }}>{count}</span>}
                            </button>
                        );
                    })}
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

    const DUMMY = new Set(['0', '']);
    const blockId = (b: { block_label: string; block_number: string }) =>
        normalizeBlockLabel(b.block_label, b.block_number);

    // Detect multi-part patient (part_description varies → show anatomical site per slide)
    const allPartDescs = new Set(
        sample.parts.flatMap(p => p.blocks.flatMap(b =>
            b.slides.map(sl => sl.part_description || '')
        )).filter(Boolean)
    );
    const multiPart = allPartDescs.size > 1;

    // Flatten + sort slides — block label is now the primary label for H&E, not a badge
    const sortedSlides: Array<{ slide: Slide; blockLabel: string | null }> = [];
    for (const part of sample.parts) {
        for (const b of part.blocks) {
            const lbl = blockId(b);
            const blockLabel = DUMMY.has(lbl) ? null : lbl;
            for (const sl of b.slides) sortedSlides.push({ slide: sl, blockLabel });
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
                    {sortedSlides.map(({ slide, blockLabel }) => {
                        const dc = getStainKind(slide);
                        const visible = stainFilter === 'all' || dc === stainFilter;
                        if (!visible) return null;
                        return (
                            <SlideItem
                                key={slide.image_id}
                                slide={slide}
                                sample={sample}
                                blockLabel={blockLabel}
                                multiPart={multiPart}
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
    blockLabel: string | null;
    multiPart: boolean;
    selected: boolean;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
}

/**
 * Short stain label for the sub-line of H&E slides.
 * Always returns something so the stain type is always visible.
 */
function stainQualifier(group: string | null | undefined): string {
    const g = (group || '').toLowerCase();
    if (g.includes('frozen')) return 'frozen';
    if (g.includes('initial')) return 'H&E';
    return 'H&E recut';
}

function SlideItem({ slide, sample, blockLabel, multiPart, selected, onSelectSlide }: SlideItemProps) {
    const [hovered, setHovered] = React.useState(false);
    const isHE = slide.is_hne || (slide.stain_group || '').toLowerCase().startsWith('h&e');
    const dotColor = getStainDotColor(slide);
    const mag = slide.magnification || '';
    const sz = fmtMB(slide.file_size_bytes);
    const section = barcodeSection(slide.barcode);
    const partDesc = multiPart ? abbreviatePartDesc(slide.part_description) : null;
    // Decoded block region meaning ("Proximal", "Margin", etc.) — shown when block code is known.
    const blockMeaning = !partDesc ? decodeBlockCode(blockLabel) : null;

    // Primary label: block region for H&E, stain name for IHC/special stains.
    const primaryLabel = isHE
        ? (blockLabel || section || cleanStain(slide.stain_name))
        : cleanStain(slide.stain_name);

    // LHS sub-label: section only for H&E (stain moves to RHS); block·section for IHC.
    const subTokens: string[] = [];
    if (!isHE && blockLabel) subTokens.push(blockLabel);
    if (section) subTokens.push(section);

    // RHS: stain qualifier (H&E slides only) / mag / size — gives the stain type back
    // without it dominating the primary label.
    const rhsStain = isHE ? stainQualifier(slide.stain_group) : null;

    // Tooltip: full metadata for pathologist context.
    const tooltipLines: string[] = [];
    if (!slide.can_serve_tiles) tooltipLines.push('⚠ Tiles not yet available');
    if (slide.barcode)          tooltipLines.push(`Barcode: ${slide.barcode}`);
    if (slide.stain_name)       tooltipLines.push(`Stain: ${slide.stain_name}`);
    if (blockLabel)             tooltipLines.push(`Block: ${blockLabel}`);
    if (slide.part_description) tooltipLines.push(`Part: ${slide.part_description}`);
    if (section)                tooltipLines.push(`Section: ${section}`);
    if (mag)                    tooltipLines.push(`Magnification: ${mag}`);
    if (sz !== '—')             tooltipLines.push(`Size: ${sz}`);
                                tooltipLines.push(`Image ID: ${slide.image_id}`);

    const bg = selected ? C.blueLight : hovered ? C.blueLight : 'transparent';
    const borderLeft = selected ? `2px solid ${C.blue}` : '2px solid transparent';

    return (
        <div
            data-testid={`wsi-slide-item-${slide.image_id}`}
            onClick={() => slide.can_serve_tiles && onSelectSlide(slide, sample)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={tooltipLines.join('\n')}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', margin: '1px 4px',
                borderRadius: 3, borderLeft,
                background: bg,
                cursor: slide.can_serve_tiles ? 'pointer' : 'help',
                opacity: slide.can_serve_tiles ? 1 : 0.55,
            }}
        >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
            {/* LHS: primary label + decoded block meaning + section */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {primaryLabel}
                </div>
                {partDesc && (
                    <div style={{ fontSize: 10, color: C.blue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>
                        {partDesc}
                    </div>
                )}
                {blockMeaning && (
                    <div style={{ fontSize: 10, color: C.blue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {blockMeaning}
                    </div>
                )}
                {subTokens.length > 0 && (
                    <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>
                        {subTokens.join(' · ')}
                    </div>
                )}
            </div>
            {/* RHS: stain type (H&E slides) / mag / size */}
            <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.5 }}>
                {rhsStain && <div style={{ fontSize: 10, fontWeight: 600, color: dotColor }}>{rhsStain}</div>}
                {mag && <div style={{ fontSize: 10, color: C.muted }}>{mag}</div>}
                <div style={{ fontSize: 10, color: C.muted }}>{sz}</div>
            </div>
        </div>
    );
}

// ---- SlideThumbnail ----

/** Initial timeout before first auto-retry. Subsequent failure shows manual retry UI. */
const THUMBNAIL_TIMEOUT_MS = 30_000;
const THUMBNAIL_MAX_AUTO_RETRIES = 1;

function SlideThumbnail({ src }: { src: string | null }) {
    const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
    // retryKey forces a fresh <img> mount (new network request) on retry.
    const [retryKey, setRetryKey] = React.useState(0);
    const autoRetriesRef = React.useRef(0);
    const imgRef = React.useRef<HTMLImageElement>(null);

    // useLayoutEffect runs synchronously after DOM mutations, before the browser
    // paints. When the image is in the browser HTTP cache the load event fires
    // synchronously DURING DOM insertion — before React attaches onLoad — so
    // onLoad never fires. By the time useLayoutEffect runs the img.complete flag
    // is already true, so we can transition immediately without waiting for the
    // event. The component is keyed by src in MetaSidebar so this effect only
    // needs to run once on mount (and again on retry).
    React.useLayoutEffect(() => {
        autoRetriesRef.current = 0;
        const img = imgRef.current;
        if (!img) return;
        if (img.complete) {
            setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
            return;
        }
        // If the tile server is busy or a worker was restarted, the request may
        // hang indefinitely. Auto-retry once before surfacing the error UI, since
        // the first attempt may have hit a cold-start queue and Redis is now warm.
        const timer = window.setTimeout(() => {
            if (autoRetriesRef.current < THUMBNAIL_MAX_AUTO_RETRIES) {
                autoRetriesRef.current += 1;
                setStatus('loading');
                setRetryKey(k => k + 1);
            } else {
                setStatus('error');
            }
        }, THUMBNAIL_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [retryKey]);

    if (!src) {
        return <span style={{ color: '#bbb', fontSize: 11, padding: 20, textAlign: 'center' }}>No slide selected</span>;
    }
    return (
        <>
            {status === 'loading' && (
                <span style={{ color: '#888', fontSize: 12 }}>
                    <i className="fa fa-spinner fa-spin" style={{ marginRight: 4 }} />
                    Loading…
                </span>
            )}
            <img
                key={retryKey}
                ref={imgRef}
                src={src}
                alt="slide thumbnail"
                style={{ maxWidth: '100%', maxHeight: 160, display: status === 'loaded' ? 'block' : 'none' }}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
            />
            {status === 'error' && (
                <span style={{ color: '#bbb', fontSize: 11 }}>
                    Thumbnail unavailable{' '}
                    <button
                        className="btn btn-link btn-sm"
                        style={{ padding: 0, fontSize: 11, verticalAlign: 'baseline' }}
                        onClick={() => { setStatus('loading'); setRetryKey(k => k + 1); }}
                    >
                        Retry
                    </button>
                </span>
            )}
        </>
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
    const sampleUrl = (studyId && sample?.sample_id)
        ? buildSampleUrl(studyId, sample.sample_id)
        : undefined;
    const seqRows = (slide && sample) ? buildSeqRows(sample, sampleUrl) : [];

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
                    <SlideThumbnail key={thumbSrc ?? 'none'} src={thumbSrc} />
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

            {/* MSK-IMPACT Sequencing — only when data is available */}
            {(seqRows.length > 0 || (sample?.oncogenic_mutations && sample?.oncogenic_mutation_details !== undefined) || sample?.cna_alterations?.length) && (
                <SbSection title="MSK-IMPACT">
                    {seqRows.length > 0 && <MetaTable rows={seqRows} />}
                    {sample && <MutationTable sample={sample} />}
                    {sample?.cna_alterations?.length ? <CnaTable sample={sample} /> : null}
                </SbSection>
            )}
        </div>
    );
}

function SbSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={sectionTitleStyle}>
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
                        <td title={row.valueTip} style={{ fontSize: 11, color: C.text, fontWeight: 500, wordBreak: 'break-word', verticalAlign: 'top', lineHeight: 1.5, cursor: row.valueTip ? 'help' : undefined }}>
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
    /** Tooltip shown on the value cell (plain text). */
    valueTip?: string;
}

function buildWsiRows(slide: Slide | null, meta: TileMetadata): MetaRow[] {
    const w = meta.dimensions.width, h = meta.dimensions.height;
    const mppX = meta.mpp?.x || 0, mppY = meta.mpp?.y || 0;
    const mpp = (mppX && mppY) ? (mppX + mppY) / 2 : 0;
    const objNum = meta.objective_power || (mpp ? Math.round(10 / mpp) : 0);

    // Build a tooltip with technical scanner details for the Dimensions row.
    const techParts: string[] = [];
    if (mpp) techParts.push(`MPP: ${mpp.toFixed(4)} µm/px`);
    if (objNum) techParts.push(`Objective: ${objNum}×`);
    techParts.push(`Zoom levels: ${meta.max_zoom + 1}`);
    techParts.push(`Tile size: ${meta.tile_size} px`);
    const dimTip = techParts.join('\n');

    const rows: MetaRow[] = [
        {
            label: 'Dimensions',
            labelTip: 'Width × height at full resolution — hover for scanner details',
            value: `${w.toLocaleString()} × ${h.toLocaleString()} px`,
            valueTip: dimTip,
        },
    ];
    if (slide?.file_size_bytes) rows.push({ label: 'File size', value: fmtMB(slide.file_size_bytes) });
    return rows;
}

function buildPathRows(slide: Slide, sample: Sample, studyId?: string): MetaRow[] {
    const stainBadge = getStainBadge(slide);
    const oncotreeUrl = sample.oncotree_code ? 'https://oncotree.mskcc.org/' : undefined;
    const patientUrl = (studyId && sample.sample_id)
        ? buildPatientUrl(studyId, sample.sample_id)
        : undefined;
    const sampleUrl = (studyId && sample.sample_id)
        ? buildSampleUrl(studyId, sample.sample_id)
        : undefined;
    const studyUrl = studyId ? `/study/summary?id=${encodeURIComponent(studyId)}` : undefined;
    const cancerTypeUrl = (studyId && (sample.cancer_type_detailed || sample.cancer_type))
        ? `/results?cancer_study_list=${encodeURIComponent(studyId)}&cancer_type=${encodeURIComponent((sample.cancer_type_detailed || sample.cancer_type || '').toLowerCase().replace(/\s+/g, '_'))}`
        : undefined;
    const accession = barcodeAccession(slide.barcode);
    const blockLbl = normalizeBlockLabel(slide.block_label, slide.block_number);
    // Build a tooltip for the sample value cell: accession + block if available
    const sampleTipParts: string[] = [];
    if (accession) sampleTipParts.push(`Accession: ${accession}`);
    if (blockLbl) sampleTipParts.push(`Block: ${blockLbl}`);
    if (sample.sample_type) sampleTipParts.push(`Type: ${sample.sample_type}`);
    const sampleTip = sampleTipParts.length ? sampleTipParts.join('\n') : undefined;

    const pathDxTitle = slide.path_dx_title
        ? slide.path_dx_title.charAt(0).toUpperCase() + slide.path_dx_title.slice(1).toLowerCase()
        : null;
    const partDesc = slide.part_description || null;

    const rows: MetaRow[] = [
        { label: 'Stain', labelTip: 'Staining protocol used for this slide', value: stainBadge ? `${stainBadge} — ${cleanStain(slide.stain_name)}` : cleanStain(slide.stain_name) },
        { label: 'Patient', labelTip: 'Click to open cBioPortal patient page', value: getPatientId(sample.sample_id) || '—', href: patientUrl },
        { label: 'Sample', labelTip: sampleTip ? 'Click for cBioPortal sample view — hover for accession/block info' : 'Tumor sample identifier', value: sample.sample_id || '—', href: sampleUrl, valueTip: sampleTip },
    ];
    if (studyId) rows.push({ label: 'Study', labelTip: 'Click to open cBioPortal study summary', value: studyId, href: studyUrl });
    if (sample.cancer_type_detailed || sample.cancer_type) rows.push({ label: 'Cancer type', value: sample.cancer_type_detailed || sample.cancer_type || '', href: cancerTypeUrl });
    if (sample.oncotree_code) rows.push({ label: 'OncoTree', labelTip: 'OncoTree cancer classification code — click to view on oncotree.mskcc.org', value: sample.oncotree_code, href: oncotreeUrl });
    if (sample.primary_site) rows.push({ label: 'Primary site', value: sample.primary_site });
    if (partDesc) rows.push({ label: 'Anatomical site', labelTip: 'Pathology part description — which anatomical specimen this slide was cut from', value: partDesc });
    // Show path_dx_title only when it adds information beyond part_description
    if (pathDxTitle && pathDxTitle.toLowerCase() !== (partDesc || '').toLowerCase()) {
        rows.push({ label: 'Path Dx', labelTip: 'Pathological diagnosis title for this anatomical part', value: pathDxTitle });
    }
    return rows;
}

/**
 * Convert cBioPortal mutation type string to a short human-readable label.
 * e.g. "Missense_Mutation" → "Missense", "Frame_Shift_Del" → "Frameshift del"
 */
function formatMutationType(t: string): string {
    if (!t) return '';
    const map: Record<string, string> = {
        Missense_Mutation: 'Missense',
        Nonsense_Mutation: 'Nonsense',
        Frame_Shift_Del: 'Frameshift del',
        Frame_Shift_Ins: 'Frameshift ins',
        In_Frame_Del: 'In-frame del',
        In_Frame_Ins: 'In-frame ins',
        Splice_Site: 'Splice site',
        Translation_Start_Site: 'Start site',
        Nonstop_Mutation: 'Nonstop',
        Silent: 'Silent',
    };
    return map[t] ?? t.replace(/_/g, ' ');
}

function shortMutationType(type: string | undefined): string {
    if (!type) return '—';
    if (type === 'Missense') return 'MS';
    if (type === 'Nonsense') return 'NS';
    if (type === 'Frameshift del') return 'FSdel';
    if (type === 'Frameshift ins') return 'FSins';
    if (type === 'In-frame del') return 'IFdel';
    if (type === 'In-frame ins') return 'IFins';
    if (type === 'Splice site') return 'Splice';
    if (type === 'Start site') return 'Start';
    return type.slice(0, 6);
}

/**
 * Compact table rendering mutations — one row per variant with columns:
 * Gene | Variant (hover: VAF, copy #, cohort %) | Annot (icons) | Type.
 * Only rendered after `oncogenic_mutation_details` is populated so that
 * all cells have data on first paint.
 */
/** Map oncogenicity string → circle color (matches oncokb-styles icons.svg sprite). */
function oncokbCircleColor(oncogenic?: string): { stroke: string; rings: 3 | 1 } {
    const level = (oncogenic || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (['oncogenic', 'likely-oncogenic', 'resistance'].includes(level)) return { stroke: '#0968C3', rings: 3 };
    if (['neutral', 'likely-neutral'].includes(level)) return { stroke: '#696969', rings: 3 };
    if (level === 'inconclusive') return { stroke: '#aaa', rings: 3 };
    if (level === 'vus') return { stroke: '#696969', rings: 1 };
    return { stroke: '#ccc', rings: 1 }; // unknown / no data
}

/**
 * OncoKB concentric-circles icon — color reflects oncogenicity level,
 * exactly matching cBioPortal's oncokb-styles icons.svg sprite.
 */
const OncoKbIcon = ({ oncogenic }: { oncogenic?: string }) => {
    const { stroke, rings } = oncokbCircleColor(oncogenic);
    return (
        <svg width="14" height="14" viewBox="-9 -9 18 18" style={inlineIconStyle}>
            <circle r="7" fill="none" strokeWidth="2" stroke={stroke} />
            {rings === 3 && (
                <>
                    <circle r="4" fill="none" strokeWidth="2" stroke={stroke} />
                    <circle r="2" fill={stroke} />
                </>
            )}
        </svg>
    );
};

/** CIViC logo image — matches cBioPortal's annotation column CIViC badge. */
const CivicIcon = () => (
    <img
        src={require('../../../../rootImages/civic-logo.png')}
        width={14} height={14}
        style={inlineIconStyle}
        alt="CIViC"
    />
);

/**
 * Cancer Hotspots flame icon — exact path from rootImages/cancer-hotspots.svg,
 * matching cBioPortal's hotspot annotation icon.
 */
const HotspotIcon = () => (
    <svg width="12" height="12" viewBox="0 0 1024 1024" style={inlineIconStyle}>
        <path fill="#ff9900" d="M321.008 1045.333c-68.245-142.008-31.901-223.379 20.551-300.044 57.44-83.956 72.244-167.065 72.244-167.065s45.153 58.7 27.092 150.508c79.772-88.8 94.824-230.28 82.783-284.464 180.315 126.012 257.376 398.856 153.523 601.065 552.372-312.532 137.399-780.172 65.155-832.851 24.081 52.676 28.648 141.851-20 185.127-82.352-312.276-285.972-376.276-285.972-376.276 24.083 161.044-87.296 337.144-194.696 468.731-3.775-64.216-7.783-108.528-41.549-169.98-7.58 116.656-96.732 211.748-120.873 328.628-32.701 158.287 24.496 274.18 241.748 396.623z"/>
    </svg>
);

function MutationTable({ sample }: { sample: Sample }): React.ReactElement | null {
    const muts = parseMutationTokens(sample.oncogenic_mutations);
    const details = sample.oncogenic_mutation_details;
    if (!muts.length || details === undefined) return null;

    // Tooltip state: index of the hovered row and fixed-position coords
    const [tooltip, setTooltip] = React.useState<{ idx: number; x: number; y: number } | null>(null);
    // Close tooltip when mouse leaves the icon area
    const hideTooltip = () => setTooltip(null);

    const thStyle = compactThStyle;
    const tdBase = compactTdBase;

    // Oncogenicity badge colours — mirrors cBioPortal's palette
    function oncogenicStyle(level: string | undefined): React.CSSProperties {
        if (!level) return {};
        const l = level.toLowerCase();
        if (l.includes('likely neutral') || l.includes('inconclusive')) return { color: '#888' };
        if (l.includes('oncogenic') || l === 'resistance') return { color: '#007bff', fontWeight: 700 };
        return { color: '#555' };
    }

    return (
        <div style={{ position: 'relative' }}>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '18%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={thStyle}>Gene</th>
                        <th style={thStyle}>Variant ⓘ</th>
                        <th style={thStyle}>Annot</th>
                        <th style={thStyle}>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {muts.map((mut, i) => {
                        const { gene, variant } = parseMutationToken(mut);
                        const oncoKbUrl = buildOncoKbUrl(gene, variant);
                        const civicUrl = `https://civicdb.org/genes/${encodeURIComponent(gene)}/summary`;
                        const d = details?.[i];
                        const shortType = shortMutationType(d?.type);
                        // Use d.hotspot when available (from OncoKB), fall back to annotation text
                        const isHotspot = d?.hotspot === true || !!(d?.annotation?.toLowerCase().includes('hotspot'));
                        const hasOncoKbData = !!(d?.oncogenic || d?.mutationEffect);
                        // Build variant cell title: VAF + copy # + cohort %
                        const cnaForGene = sample.cna_alterations?.find(c => c.gene === gene);
                        const variantTitleParts: string[] = [];
                        if (d?.vaf != null) variantTitleParts.push(`VAF: ${d.vaf}%`);
                        if (cnaForGene) variantTitleParts.push(`Copy #: ${cnaLabel(cnaForGene.cnaValue)}`);
                        if (d?.cohortFrequency != null) variantTitleParts.push(`Cohort: ${(d.cohortFrequency * 100).toFixed(1)}%`);
                        const variantTitle = variantTitleParts.join(' | ') || undefined;
                        return (
                            <tr key={mut} style={{ borderTop: `1px solid ${C.border}` }}>
                                <td style={{ ...tdBase, paddingRight: 4, ...ellipsisStyle, fontWeight: 600, color: C.text }}>
                                    {gene}
                                </td>
                                <td title={variantTitle}
                                    style={{ ...tdBase, paddingRight: 4, ...ellipsisStyle, fontFamily: 'monospace', fontSize: 10.5, cursor: variantTitle ? 'help' : undefined }}>
                                    {(variant.startsWith('p.') ? variant.slice(2) : variant) || '—'}
                                </td>
                                <td style={{ ...tdBase, paddingRight: 2, whiteSpace: 'nowrap' }}>
                                    {/* OncoKB icon — shows rich tooltip on hover */}
                                    <a href={oncoKbUrl} target="_blank" rel="noopener noreferrer"
                                       style={{ marginRight: 3, textDecoration: 'none', display: 'inline-block', cursor: hasOncoKbData ? 'pointer' : 'pointer' }}
                                       onMouseEnter={e => {
                                           const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                           setTooltip({ idx: i, x: r.left, y: r.bottom + 4 });
                                       }}
                                       onMouseLeave={hideTooltip}
                                       onClick={e => e.stopPropagation()}>
                                        <OncoKbIcon oncogenic={d?.oncogenic} />
                                    </a>
                                    <a href={civicUrl} target="_blank" rel="noopener noreferrer"
                                       title={`CIViC: ${gene}`}
                                       style={{ marginRight: isHotspot ? 3 : 0, textDecoration: 'none', display: 'inline-block' }}>
                                        <CivicIcon />
                                    </a>
                                    {isHotspot && (
                                        <a href={`https://www.cancerhotspots.org/#/gene/${encodeURIComponent(gene)}`}
                                           target="_blank" rel="noopener noreferrer"
                                           title="Recurrent hotspot"
                                           style={{ textDecoration: 'none', display: 'inline-block' }}>
                                            <HotspotIcon />
                                        </a>
                                    )}
                                </td>
                                <td title={d?.type} style={{ ...tdBase, paddingRight: 4, ...ellipsisStyle, color: C.muted }}>
                                    {shortType}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Rich OncoKB tooltip — rendered as a fixed-position overlay so it isn't clipped by sidebar overflow */}
            {tooltip !== null && (() => {
                const d = details?.[tooltip.idx];
                if (!d?.oncogenic && !d?.mutationEffect && !d?.geneSummary && !d?.variantSummary) return null;
                const { gene, variant } = parseMutationToken(muts[tooltip.idx] ?? '');
                const oncoKbUrl = buildOncoKbUrl(gene, variant || undefined);
                return (
                    <div
                        onMouseEnter={() => setTooltip(t => t)}
                        onMouseLeave={hideTooltip}
                        style={{
                            position: 'fixed',
                            left: Math.min(tooltip.x, window.innerWidth - 340),
                            top: tooltip.y,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid #d4d4d4',
                            borderRadius: 4,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                            padding: '10px 14px',
                            maxWidth: 320,
                            fontSize: 11.5,
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: 1.45,
                            color: '#333',
                            pointerEvents: 'auto',
                        }}
                    >
                        {/* Header row */}
                        <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 5 }}>
                            <span>{gene}</span>
                            {variant && <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{variant}</span>}
                        </div>
                        {/* Oncogenic + mutation effect badges */}
                        {(d.oncogenic || d.mutationEffect) && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                {d.oncogenic && (
                                    <span style={{
                                        display: 'inline-block', fontSize: 10.5, fontWeight: 700,
                                        padding: '1px 6px', borderRadius: 3,
                                        background: d.oncogenic.toLowerCase().includes('oncogenic') ? '#e6f0ff' : '#f5f5f5',
                                        ...oncogenicStyle(d.oncogenic),
                                    }}>
                                        {d.oncogenic}
                                    </span>
                                )}
                                {d.mutationEffect && (
                                    <span style={{
                                        display: 'inline-block', fontSize: 10.5,
                                        padding: '1px 6px', borderRadius: 3,
                                        background: '#f9f2e8', color: '#7a5c00',
                                    }}>
                                        {d.mutationEffect}
                                    </span>
                                )}
                            </div>
                        )}
                        {/* Gene summary */}
                        {d.geneSummary && (
                            <p style={{ margin: '0 0 5px', color: '#444', fontSize: 11 }}>{d.geneSummary}</p>
                        )}
                        {/* Variant summary */}
                        {d.variantSummary && (
                            <p style={{ margin: '0 0 5px', color: '#555', fontSize: 11, fontStyle: 'italic' }}>{d.variantSummary}</p>
                        )}
                        {/* Footer link */}
                        <div style={{ marginTop: 6, borderTop: '1px solid #eee', paddingTop: 5 }}>
                            <a href={oncoKbUrl} target="_blank" rel="noopener noreferrer"
                               style={{ color: '#0968C3', fontSize: 10.5, textDecoration: 'none' }}>
                                View on OncoKB →
                            </a>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

/** Rows derived from MSK-IMPACT sequencing — shown in their own sidebar section. */
function buildSeqRows(sample: Sample, sampleUrl?: string): MetaRow[] {
    const rows: MetaRow[] = [];
    if (sample.tumor_purity) rows.push({ label: 'Tumor purity', labelTip: 'Estimated fraction of tumor cells in this sample', value: `${sample.tumor_purity}%` });
    if (sample.tmb_score) rows.push({ label: 'TMB', labelTip: 'Tumor mutational burden — click to view mutations in cBioPortal', value: `${sample.tmb_score} mut/Mb`, href: sampleUrl });
    // MSI status — no external link needed
    if (sample.msi_type) rows.push({ label: 'MSI', labelTip: 'Microsatellite instability status', value: sample.msi_type });
    if (sample.metastatic_site && sample.metastatic_site.toLowerCase() !== 'not applicable') {
        rows.push({ label: 'Metastatic site', value: sample.metastatic_site });
    }
    // Mutations are rendered separately as a MutationTable below the MetaTable.
    return rows;
}

/** Labels for discrete CNA values (GISTIC encoding). */
function cnaLabel(value: number): string {
    if (value === -2) return 'Deep del';
    if (value === -1) return 'Shallow del';
    if (value === 1) return 'Gain';
    if (value === 2) return 'Amplification';
    return String(value);
}

/**
 * Compact table of copy-number alterations — one row per gene with columns:
 * Gene (OncoKB link) | CNA type.
 */
function CnaTable({ sample }: { sample: Sample }): React.ReactElement | null {
    const cnas = sample.cna_alterations;
    if (!cnas?.length) return null;

    const thStyle = compactThStyle;
    const tdBase = compactTdBase;

    return (
        <table style={compactTableStyle}>
            <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '55%' }} />
            </colgroup>
            <thead>
                <tr>
                    <th style={thStyle}>Gene</th>
                    <th style={thStyle}>CNA</th>
                </tr>
            </thead>
            <tbody>
                {cnas.map(cna => {
                    const href = buildOncoKbUrl(cna.gene);
                    const label = cnaLabel(cna.cnaValue);
                    const color = cna.cnaValue <= -2 ? '#b22222' : cna.cnaValue === -1 ? '#cc6600' : cna.cnaValue >= 2 ? '#1a5c1a' : C.muted;
                    return (
                        <tr key={cna.gene} style={{ borderTop: `1px solid ${C.border}` }}>
                            <td style={{ ...tdBase, paddingRight: 4, ...ellipsisStyle }}>
                                <a href={href} target="_blank" rel="noopener noreferrer"
                                   style={{ color: C.blue, fontWeight: 600, textDecoration: 'none' }}
                                   onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                                   onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}>
                                    {cna.gene}
                                </a>
                            </td>
                            <td style={{ ...tdBase, color, fontWeight: 500 }}>
                                {label}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

