import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action, runInAction } from 'mobx';
import { getChatServerBase } from './chatServerBase';
import { waitForNetworkIdle, waitForViewReady } from './screenshot';

// Map canonical alteration_type keys to the legend_label strings rendered
// by oncoprintjs/geneticrules.ts. Prefix-matched because oncoprint sometimes
// appends qualifiers like " (putative driver)".
const LABEL_PREFIXES: Record<string, string[]> = {
    amplification: ['Amplification'],
    deep_deletion: ['Deep Deletion'],
    gain: ['Gain'],
    shallow_deletion: ['Shallow Deletion'],
    missense: ['Missense Mutation'],
    truncating: ['Truncating Mutation'],
    splice: ['Splice Mutation'],
    inframe: ['Inframe Mutation'],
    structural_variant: ['Structural Variant', 'Fusion'],
    mrna_high: ['mRNA High'],
    mrna_low: ['mRNA Low'],
    protein_high: ['Protein High'],
    protein_low: ['Protein Low'],
};

const BEACON_ATTR = 'data-chat-beacon';
const STYLE_ID = 'chat-beacon-styles';

type HighlightType = 'alteration' | 'gene' | 'tab';

interface Highlight {
    type: HighlightType;
    alterationType?: string;
    gene?: string;
    genes?: string[];
    tabHint?: string;
    note: string;
    quote: string;
    importance: 'high' | 'medium' | 'low';
}

function tooltipTitle(h: Highlight): string {
    switch (h.type) {
        case 'alteration':
            return (h.alterationType ?? '').replace(/_/g, ' ');
        case 'gene':
            return h.gene ?? 'Gene';
        case 'tab':
            return `Tab: ${h.tabHint ?? ''}`;
    }
}

function beaconColor(h: Highlight): string {
    if (h.importance === 'high') return '#f97316';
    if (h.importance === 'medium') return '#eab308';
    return '#94a3b8';
}

function ensureBeaconStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
        .chat-beacon-dot {
            position: absolute;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            z-index: 9990;
            box-shadow: 0 0 0 2px #fff, 0 0 6px rgba(0,0,0,0.25);
            will-change: transform, opacity;
        }
    `;
    (document.head || document.documentElement).appendChild(s);
}

interface PaperInfo {
    paperUrl: string | null;
    studyName: string;
}

interface Cost {
    total: number;
    tokens: {
        input: number;
        cacheWrite: number;
        cacheRead: number;
        output: number;
    };
    model: string;
}

function formatBeaconCost(n: number): string {
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(3)}`;
}

function shortModelName(slug: string): string {
    // anthropic/claude-sonnet-4.6 → claude-sonnet-4.6
    const i = slug.indexOf('/');
    return i >= 0 ? slug.slice(i + 1) : slug;
}

interface IAlterationBeaconsProps {
    studyId: string | undefined;
    genes?: string[];
    // Gateway slug picked by the user in the iframe dropdown. Undefined
    // means "use whatever the server default is" — for first render before
    // the iframe's modelChanged postMessage has arrived.
    model?: string;
}

const TAB_HINTS = [
    'oncoprint',
    'mutations',
    'cancerTypesSummary',
    'mutualExclusivity',
    'plots',
    'survival',
    'cnSegments',
    'coexpression',
    'comparison',
    'structuralVariants',
    'pathways',
] as const;

interface PlacedBeacon {
    el: HTMLDivElement;
    target: Element;
    highlight: Highlight;
}

@observer
export default class AlterationBeacons extends React.Component<
    IAlterationBeaconsProps
> {
    @observable.ref highlights: Highlight[] = [];
    @observable.ref paper: PaperInfo | null = null;
    @observable.ref activeHighlight: Highlight | null = null;
    @observable.ref activeAnchor: DOMRect | null = null;
    @observable loadError: string | null = null;
    @observable loading = false;
    // Cost of the last completed /api/chat/highlights call. We keep the
    // bubble visible after loading and replace the spinner copy with the
    // model name + price so you can compare beacon spend across models.
    @observable.ref lastCost: Cost | null = null;

    private placed: PlacedBeacon[] = [];
    private observer: MutationObserver | null = null;
    private scheduled = false;
    private rafId: number | null = null;
    private cancelled = false;

    constructor(props: IAlterationBeaconsProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        ensureBeaconStyles();
        this.loadHighlights();
        this.observer = new MutationObserver(() => this.scheduleScan());
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        window.addEventListener('scroll', this.scheduleReposition, true);
        window.addEventListener('resize', this.scheduleReposition);
        document.addEventListener('keydown', this.onKeyDown);
        this.startRepositionLoop();
    }

    componentDidUpdate(prev: IAlterationBeaconsProps) {
        const studyChanged = prev.studyId !== this.props.studyId;
        const genesChanged =
            (prev.genes ?? []).join(',') !== (this.props.genes ?? []).join(',');
        const modelChanged = prev.model !== this.props.model;
        if (studyChanged || genesChanged || modelChanged) {
            this.clearBeacons();
            runInAction(() => {
                this.highlights = [];
                this.paper = null;
                this.activeHighlight = null;
                this.activeAnchor = null;
                this.lastCost = null;
            });
            this.loadHighlights();
        }
    }

    private buildInventory(): {
        alterations: string[];
        genes: string[];
        tabs: string[];
    } {
        // Which canonical alteration buckets have visible legend labels.
        const presentAlterations = new Set<string>();
        const textNodes = document.querySelectorAll<SVGTextElement>('svg text');
        for (const t of Array.from(textNodes)) {
            const txt = (t.textContent || '').trim();
            if (!txt) continue;
            for (const [altType, prefixes] of Object.entries(LABEL_PREFIXES)) {
                if (prefixes.some(p => txt.startsWith(p))) {
                    presentAlterations.add(altType);
                    break;
                }
            }
        }
        // Tabs: which tab anchors exist on the page right now.
        const tabs = TAB_HINTS.filter(h =>
            document.querySelector(`.tabAnchor_${h}`)
        );
        return {
            alterations: Array.from(presentAlterations),
            genes: this.props.genes ?? [],
            tabs,
        };
    }

    componentWillUnmount() {
        this.cancelled = true;
        this.observer?.disconnect();
        window.removeEventListener('scroll', this.scheduleReposition, true);
        window.removeEventListener('resize', this.scheduleReposition);
        document.removeEventListener('keydown', this.onKeyDown);
        if (this.rafId != null) cancelAnimationFrame(this.rafId);
        this.clearBeacons();
    }

    private async loadHighlights() {
        const { studyId } = this.props;
        if (!studyId) return;
        runInAction(() => {
            this.loading = true;
        });
        try {
            // Wait until the page settles so the inventory reflects what the
            // user actually sees, not a half-rendered shell.
            await waitForNetworkIdle(1000);
            await waitForViewReady();
            if (this.cancelled) return;
            const inventory = this.buildInventory();
            const r = await fetch(`${getChatServerBase()}/api/chat/highlights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studyId,
                    inventory,
                    model: this.props.model,
                }),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${r.status}`);
            }
            const data = await r.json();
            if (this.cancelled) return;
            runInAction(() => {
                this.highlights = data.highlights ?? [];
                this.paper = data.paper ?? null;
                this.lastCost = data.cost ?? null;
                this.loadError = null;
            });
            this.scheduleScan();
        } catch (err: any) {
            if (this.cancelled) return;
            runInAction(() => {
                this.loadError = String(err.message ?? err);
            });
        } finally {
            if (!this.cancelled) {
                runInAction(() => {
                    this.loading = false;
                });
            }
        }
    }

    @action.bound
    private onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && this.activeHighlight) {
            this.activeHighlight = null;
            this.activeAnchor = null;
        }
    }

    private scheduleScan = () => {
        if (this.scheduled || this.cancelled) return;
        this.scheduled = true;
        requestAnimationFrame(() => {
            this.scheduled = false;
            if (this.cancelled) return;
            this.scanAndPlace();
        });
    };

    // Continuously reposition placed beacons. Cheap for ~10 elements.
    private startRepositionLoop() {
        const tick = () => {
            this.repositionAll();
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    }

    private scheduleReposition = () => {
        // No-op — the rAF loop already runs every frame.
    };

    private findAlterationHighlightForLabel(text: string): Highlight | null {
        for (const h of this.highlights) {
            if (h.type !== 'alteration' || !h.alterationType) continue;
            const prefixes = LABEL_PREFIXES[h.alterationType] ?? [];
            for (const p of prefixes) {
                if (text.startsWith(p)) return h;
            }
        }
        return null;
    }

    private findGeneHighlightForLabel(text: string): Highlight | null {
        for (const h of this.highlights) {
            if (h.type !== 'gene' || !h.gene) continue;
            if (text === h.gene) return h;
            if (text.startsWith(h.gene + ' ')) return h;
            if (text.startsWith(h.gene + '\t')) return h;
        }
        return null;
    }

    private clearBeacons() {
        for (const p of this.placed) p.el.remove();
        this.placed = [];
    }

    private scanAndPlace() {
        if (this.highlights.length === 0) return;
        this.clearBeacons();
        this.scanSvgTexts();
        this.scanHtmlTabs();
        this.repositionAll();
    }

    private scanSvgTexts() {
        const textNodes = document.querySelectorAll<SVGTextElement>('svg text');
        const claimed = new Set<string>();
        for (const t of Array.from(textNodes)) {
            const txt = (t.textContent || '').trim();
            if (!txt) continue;
            const altH = this.findAlterationHighlightForLabel(txt);
            if (altH) {
                const key = `alteration|${altH.alterationType}|${(altH.genes ?? []).join(',')}`;
                if (!claimed.has(key)) {
                    claimed.add(key);
                    this.placeBeacon(t, altH);
                }
                continue;
            }
            const geneH = this.findGeneHighlightForLabel(txt);
            if (geneH) {
                const key = `gene|${geneH.gene}`;
                if (!claimed.has(key)) {
                    claimed.add(key);
                    this.placeBeacon(t, geneH);
                }
            }
        }
    }

    private scanHtmlTabs() {
        const claimed = new Set<string>();
        for (const h of this.highlights) {
            if (h.type !== 'tab' || !h.tabHint) continue;
            const key = `tab|${h.tabHint}`;
            if (claimed.has(key)) continue;
            const anchor = document.querySelector<HTMLElement>(
                `.tabAnchor_${h.tabHint}`
            );
            if (!anchor) continue;
            claimed.add(key);
            // Target the <a> itself; repositionAll uses a Range to measure
            // just the inline text content so the beacon snugs up to the
            // last character, not the padded edge of the <a> or its <li>.
            this.placeBeacon(anchor, h);
        }
    }

    private placeBeacon(target: Element, h: Highlight) {
        const div = document.createElement('div');
        div.setAttribute(BEACON_ATTR, h.type);
        div.className = 'chat-beacon-dot';
        div.style.background = beaconColor(h);
        const noteShort =
            h.note.length > 160 ? h.note.slice(0, 160) + '…' : h.note;
        div.title = `${tooltipTitle(h)}: ${noteShort}\n(click for details)`;
        const handler = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            this.onBeaconClick(div, h);
        };
        div.addEventListener('click', handler);
        div.addEventListener('mousedown', handler);
        document.body.appendChild(div);
        this.placed.push({ el: div, target, highlight: h });
    }

    // For HTML targets, measure the inline text content via Range so the
    // beacon sits flush with the last character (ignoring padding/borders on
    // the wrapping element). For SVG <text>, getBoundingClientRect already IS
    // the text-only rect.
    private getTargetTextRect(target: Element): DOMRect | null {
        if (target instanceof SVGElement) {
            return target.getBoundingClientRect();
        }
        try {
            const range = document.createRange();
            range.selectNodeContents(target);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) return rect;
        } catch {
            /* fall through */
        }
        return target.getBoundingClientRect();
    }

    private repositionAll() {
        if (this.placed.length === 0) return;
        // Manual pulse driven by the rAF loop — bypasses CSS @keyframes and
        // the Web Animations API entirely. If beacons follow their targets at
        // all, they MUST also pulse, because both use the same loop.
        const now = performance.now();
        const phase = (now % 1400) / 1400;
        const wave = (1 - Math.cos(phase * 2 * Math.PI)) / 2; // 0..1..0
        const scale = 1 + 0.6 * wave;
        const opacity = 1 - 0.7 * wave;
        for (const p of this.placed) {
            if (!p.target.isConnected) {
                p.el.style.display = 'none';
                continue;
            }
            const rect = this.getTargetTextRect(p.target);
            if (!rect || (rect.width === 0 && rect.height === 0)) {
                p.el.style.display = 'none';
                continue;
            }
            p.el.style.display = 'block';
            const top = rect.top + window.scrollY + rect.height / 2 - 7;
            // Pull the beacon back so it overlaps the end of the word —
            // center of the 14px dot lands a few px past the last character.
            const left = rect.right + window.scrollX - 8;
            p.el.style.top = `${top}px`;
            p.el.style.left = `${left}px`;
            p.el.style.transform = `scale(${scale})`;
            p.el.style.opacity = `${opacity}`;
        }
    }

    @action.bound
    private onBeaconClick(el: Element, h: Highlight) {
        const rect = el.getBoundingClientRect();
        this.activeHighlight = h;
        this.activeAnchor = rect;
    }

    @action.bound
    private dismissTooltip() {
        this.activeHighlight = null;
        this.activeAnchor = null;
    }

    // While loading: animated dot + "Loading beacons…"
    // After load: static chip with model name and price so the user can
    // see how much each model costs to run beacons against this paper.
    // On error: red chip with a tooltip carrying the message so the user
    // doesn't stare at an empty bottom-left wondering what happened.
    private renderBeaconChip(): React.ReactNode {
        if (this.loading) {
            return (
                <div className="chat-sidebar-beacons-loader">
                    <span className="chat-sidebar-beacons-dot" />
                    Loading beacons…
                </div>
            );
        }
        if (this.loadError) {
            return (
                <div
                    className="chat-sidebar-beacons-loader chat-sidebar-beacons-error"
                    title={this.loadError}
                >
                    <span className="chat-sidebar-beacons-cost-label">
                        Beacons
                    </span>
                    <span className="chat-sidebar-beacons-cost-price">
                        failed
                    </span>
                </div>
            );
        }
        const cost = this.lastCost;
        if (!cost) return null;
        const t = cost.tokens;
        const tokensTooltip = `input ${t.input} · cache-write ${t.cacheWrite} · cache-read ${t.cacheRead} · output ${t.output} tokens`;
        return (
            <div
                className="chat-sidebar-beacons-loader chat-sidebar-beacons-cost"
                title={tokensTooltip}
            >
                <span className="chat-sidebar-beacons-cost-label">
                    Beacons
                </span>
                <span className="chat-sidebar-beacons-cost-model">
                    {shortModelName(cost.model)}
                </span>
                <span className="chat-sidebar-beacons-cost-price">
                    {formatBeaconCost(cost.total)}
                </span>
            </div>
        );
    }

    render() {
        const h = this.activeHighlight;
        const anchor = this.activeAnchor;
        const chip = this.renderBeaconChip();
        if (!h || !anchor) return chip;
        const top = anchor.bottom + window.scrollY + 8;
        const left = Math.min(
            anchor.left + window.scrollX,
            window.innerWidth - 360
        );
        return (
            <>
                {chip}
                <div
                    onClick={this.dismissTooltip}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top,
                        left,
                        width: 340,
                        background: '#ffffff',
                        border: '1px solid #e5e5e7',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 13,
                        lineHeight: 1.4,
                        color: '#1f2328',
                        zIndex: 9999,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: 6,
                            textTransform: 'capitalize',
                        }}
                    >
                        {tooltipTitle(h)}
                        {h.type === 'alteration' &&
                            h.genes &&
                            h.genes.length > 0 && (
                                <span
                                    style={{
                                        fontWeight: 400,
                                        color: '#6e7681',
                                        marginLeft: 6,
                                    }}
                                >
                                    — {h.genes.join(', ')}
                                </span>
                            )}
                    </div>
                    <div style={{ marginBottom: 8 }}>{h.note}</div>
                    <blockquote
                        style={{
                            margin: 0,
                            padding: '6px 10px',
                            borderLeft: '3px solid #cbd5e1',
                            background: '#f8fafc',
                            fontStyle: 'italic',
                            fontSize: 12,
                            color: '#475569',
                        }}
                    >
                        "{h.quote}"
                    </blockquote>
                    {this.paper?.paperUrl && (
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                            <a
                                href={this.paper.paperUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                style={{
                                    color: '#3786C2',
                                    textDecoration: 'none',
                                }}
                            >
                                From {this.paper.studyName} ↗
                            </a>
                        </div>
                    )}
                </div>
            </>
        );
    }
}
