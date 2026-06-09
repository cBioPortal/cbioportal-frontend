import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, runInAction } from 'mobx';
import { getChatServerBase } from './chatServerBase';
import { waitForNetworkIdle, waitForViewReady } from './screenshot';
import { scrapeInventory } from './inventory';
import { BeaconEngine, Beacon, AnnotationTarget } from './BeaconEngine';

// Server response shape for /api/chat/highlights. Placement, repositioning, and
// the tooltip now live in BeaconEngine; this component only fetches highlights,
// maps them to beacons, and renders the cost chip.
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

function toBeacons(highlights: Highlight[], paper: PaperInfo | null): Beacon[] {
    const sourceUrl = paper?.paperUrl ?? undefined;
    const sourceLabel = paper ? `From ${paper.studyName}` : undefined;
    const out: Beacon[] = [];
    for (const h of highlights) {
        let target: AnnotationTarget;
        if (h.type === 'alteration' && h.alterationType) {
            target = { type: 'alteration', alterationType: h.alterationType };
        } else if (h.type === 'gene' && h.gene) {
            target = { type: 'gene', gene: h.gene };
        } else if (h.type === 'tab' && h.tabHint) {
            target = { type: 'tab', tabHint: h.tabHint };
        } else {
            continue;
        }
        out.push({
            target,
            note: h.note,
            quote: h.quote,
            importance: h.importance,
            genes: h.genes,
            sourceUrl,
            sourceLabel,
        });
    }
    return out;
}

interface IAlterationBeaconsProps {
    studyId: string | undefined;
    genes?: string[];
    // Gateway slug picked by the user in the iframe dropdown. Undefined means
    // "use whatever the server default is" — for first render before the
    // iframe's modelChanged postMessage has arrived.
    model?: string;
}

@observer
export default class AlterationBeacons extends React.Component<
    IAlterationBeaconsProps
> {
    @observable loadError: string | null = null;
    @observable loading = false;
    // Cost of the last completed /api/chat/highlights call. We keep the bubble
    // visible after loading and replace the spinner copy with the model name +
    // price so you can compare beacon spend across models.
    @observable.ref lastCost: Cost | null = null;

    private engine = new BeaconEngine();
    private cancelled = false;

    constructor(props: IAlterationBeaconsProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.engine.start();
        this.loadHighlights();
    }

    componentDidUpdate(prev: IAlterationBeaconsProps) {
        const studyChanged = prev.studyId !== this.props.studyId;
        const genesChanged =
            (prev.genes ?? []).join(',') !== (this.props.genes ?? []).join(',');
        const modelChanged = prev.model !== this.props.model;
        if (studyChanged || genesChanged || modelChanged) {
            this.engine.clear();
            runInAction(() => {
                this.lastCost = null;
            });
            this.loadHighlights();
        }
    }

    componentWillUnmount() {
        this.cancelled = true;
        this.engine.destroy();
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
            const inventory = scrapeInventory(this.props.genes ?? []);
            const r = await fetch(
                `${getChatServerBase()}/api/chat/highlights`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studyId,
                        inventory,
                        model: this.props.model,
                    }),
                }
            );
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${r.status}`);
            }
            const data = await r.json();
            if (this.cancelled) return;
            this.engine.setBeacons(
                toBeacons(data.highlights ?? [], data.paper ?? null)
            );
            runInAction(() => {
                this.lastCost = data.cost ?? null;
                this.loadError = null;
            });
        } catch (err) {
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

    // While loading: animated dot + "Loading beacons…"
    // After load: static chip with model name and price so the user can see how
    // much each model costs to run beacons against this paper.
    // On error: red chip with a tooltip carrying the message so the user
    // doesn't stare at an empty bottom-left wondering what happened.
    render(): React.ReactNode {
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
                <span className="chat-sidebar-beacons-cost-label">Beacons</span>
                <span className="chat-sidebar-beacons-cost-model">
                    {shortModelName(cost.model)}
                </span>
                <span className="chat-sidebar-beacons-cost-price">
                    {formatBeaconCost(cost.total)}
                </span>
            </div>
        );
    }
}
