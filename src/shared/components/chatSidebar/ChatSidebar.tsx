import * as React from 'react';
import { observer } from 'mobx-react';
import {
    observable,
    makeObservable,
    action,
    runInAction,
    computed,
} from 'mobx';
import { getLoadConfig } from 'config/config';
import AlterationBeacons from './AlterationBeacons';
import { getChatServerBase } from './chatServerBase';
import {
    captureViewport,
    waitForNetworkIdle,
    waitForViewReady,
} from './screenshot';
import './ChatSidebar.scss';

interface IChatSidebarProps {
    studyIds: string[] | undefined;
    genes?: string[];
    tab?: string;
}

type DisabledReason = 'multi-study' | 'no-full-text';
type PaperSource = 'pmc' | 'abstract' | 'none';

interface PaperStatus {
    studyId: string;
    source: PaperSource;
    paperUrl: string | null;
    studyName: string;
}

const OPEN_STORAGE_KEY = 'chat-sidebar:open';

function readStoredOpen(): boolean {
    try {
        const v = localStorage.getItem(OPEN_STORAGE_KEY);
        if (v === 'true') return true;
        if (v === 'false') return false;
    } catch {
        /* localStorage may be unavailable */
    }
    return true;
}

@observer
export default class ChatSidebar extends React.Component<IChatSidebarProps, {}> {
    @observable open = readStoredOpen();
    // Mirrors the iframe's model dropdown selection. The iframe is the
    // source of truth (it owns localStorage); we just listen for its
    // `chat-sidebar:modelChanged` postMessage so AlterationBeacons can
    // re-fetch highlights through the same model the user picked.
    @observable selectedModel: string | undefined = undefined;
    // Paper-status fetch for the single study (when there is one). `null`
    // means "not yet resolved" — we render an idle placeholder until it
    // resolves so we don't flash the iframe and then yank it away.
    @observable.ref paperStatus: PaperStatus | null = null;
    @observable paperStatusLoading = false;

    constructor(props: IChatSidebarProps) {
        super(props);
        makeObservable(this);
    }

    private iframeRef = React.createRef<HTMLIFrameElement>();

    @action.bound
    toggle() {
        this.open = !this.open;
        try {
            localStorage.setItem(OPEN_STORAGE_KEY, String(this.open));
        } catch {
            /* ignore */
        }
        this.syncBodyClass();
    }

    private syncBodyClass() {
        document.body.classList.toggle('chat-sidebar-closed', !this.open);
    }

    @computed get singleStudyId(): string | undefined {
        const ids = this.props.studyIds;
        return ids && ids.length === 1 ? ids[0] : undefined;
    }

    @computed get disabledReason(): DisabledReason | null {
        const ids = this.props.studyIds;
        if (ids && ids.length > 1) return 'multi-study';
        // Wait for paperStatus to resolve before flagging no-full-text.
        if (
            this.singleStudyId &&
            this.paperStatus &&
            this.paperStatus.studyId === this.singleStudyId &&
            this.paperStatus.source !== 'pmc'
        ) {
            return 'no-full-text';
        }
        return null;
    }

    private async fetchPaperStatus(studyId: string) {
        runInAction(() => {
            this.paperStatusLoading = true;
        });
        try {
            const r = await fetch(
                `${getChatServerBase()}/api/chat/paper-status?studyId=${encodeURIComponent(studyId)}`
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data: PaperStatus = await r.json();
            // Ignore stale responses if the study changed mid-flight.
            if (this.singleStudyId !== studyId) return;
            runInAction(() => {
                this.paperStatus = data;
            });
        } catch (err) {
            // On error, assume full text isn't available — better to show
            // the explanatory message than to silently let the user chat
            // with degraded grounding.
            if (this.singleStudyId !== studyId) return;
            runInAction(() => {
                this.paperStatus = {
                    studyId,
                    source: 'none',
                    paperUrl: null,
                    studyName: '',
                };
            });
        } finally {
            runInAction(() => {
                this.paperStatusLoading = false;
            });
        }
    }

    componentDidMount() {
        window.addEventListener('message', this.onMessage);
        this.syncBodyClass();
        if (this.singleStudyId) this.fetchPaperStatus(this.singleStudyId);
    }

    componentDidUpdate(prev: IChatSidebarProps) {
        const prevSingle =
            prev.studyIds && prev.studyIds.length === 1
                ? prev.studyIds[0]
                : undefined;
        if (prevSingle !== this.singleStudyId) {
            runInAction(() => {
                this.paperStatus = null;
            });
            if (this.singleStudyId) {
                this.fetchPaperStatus(this.singleStudyId);
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
        document.body.classList.remove('chat-sidebar-closed');
    }

    onMessage = async (e: MessageEvent) => {
        if (e.source !== this.iframeRef.current?.contentWindow) return;
        // Track which model the user picked in the iframe so beacons use
        // the same one. Iframe sends this on mount (from localStorage) and
        // on every dropdown change.
        if (e.data?.type === 'chat-sidebar:modelChanged') {
            runInAction(() => {
                this.selectedModel = e.data.model;
            });
            return;
        }
        // Screenshot handshake: iframe asks for a snapshot before each
        // preset request so the model sees what the user is looking at.
        if (e.data?.type === 'chat-sidebar:requestScreenshot') {
            const requestId = e.data.requestId;
            await waitForNetworkIdle(1000);
            await waitForViewReady();
            const dataUrl = await captureViewport();
            this.iframeRef.current?.contentWindow?.postMessage(
                { type: 'chat-sidebar:screenshot', requestId, dataUrl },
                '*'
            );
            return;
        }
    };

    get iframeSrc(): string {
        const apiRoot = getLoadConfig().apiRoot || '/';
        const params = new URLSearchParams();
        if (this.singleStudyId) params.set('studyId', this.singleStudyId);
        if (this.props.tab) params.set('tab', this.props.tab);
        if (this.props.genes && this.props.genes.length > 0) {
            params.set('genes', this.props.genes.join(','));
        }
        params.set('apiRoot', apiRoot);
        return `${getChatServerBase()}/?${params.toString()}`;
    }

    private renderDisabledMessage(reason: DisabledReason) {
        const title =
            reason === 'multi-study'
                ? 'Multi-study queries are not supported'
                : 'No full-text paper available';
        const body =
            reason === 'multi-study'
                ? 'The chat sidebar grounds every response in a single study’s primary publication. Run a query against just one study to enable it.'
                : 'This study’s primary publication is not available as full text in PMC (only the abstract, or nothing at all). The sidebar requires full text to ground its responses reliably, so it stays disabled for this study.';
        return (
            <div className="chat-sidebar-disabled" role="status">
                <div className="chat-sidebar-disabled-title">{title}</div>
                <div className="chat-sidebar-disabled-body">{body}</div>
            </div>
        );
    }

    render() {
        const disabledReason = this.disabledReason;
        const beaconsEnabled =
            this.open &&
            disabledReason === null &&
            this.singleStudyId !== undefined &&
            // Hold beacons until paper-status has resolved so we don't fire
            // a highlights call against a study we'd otherwise disable.
            this.paperStatus !== null;
        return (
            <>
                {beaconsEnabled && (
                    <AlterationBeacons
                        studyId={this.singleStudyId}
                        genes={this.props.genes}
                        model={this.selectedModel}
                    />
                )}
                {!this.open && (
                    <button
                        type="button"
                        className="chat-sidebar-launcher"
                        onClick={this.toggle}
                        aria-label="Open study chat"
                        title="Open study chat"
                    >
                        💬
                    </button>
                )}
                <aside
                    className="chat-sidebar-panel"
                    aria-label="Study chat"
                    hidden={!this.open}
                >
                    <button
                        type="button"
                        className="chat-sidebar-collapse"
                        onClick={this.toggle}
                        aria-label="Close study chat"
                        title="Close study chat"
                    >
                        ✕
                    </button>
                    {disabledReason !== null ? (
                        this.renderDisabledMessage(disabledReason)
                    ) : this.singleStudyId && this.paperStatus === null ? (
                        // Paper status still in flight — render a quiet
                        // placeholder rather than the iframe (which would
                        // immediately fire a suggest call we'd then have
                        // to discard if we end up disabling).
                        <div className="chat-sidebar-disabled" role="status">
                            <div className="chat-sidebar-disabled-body">
                                Checking paper availability…
                            </div>
                        </div>
                    ) : (
                        <iframe
                            ref={this.iframeRef}
                            title="Study chat"
                            src={this.iframeSrc}
                            className="chat-sidebar-iframe"
                        />
                    )}
                </aside>
            </>
        );
    }
}
