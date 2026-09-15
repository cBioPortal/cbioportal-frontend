import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
import { getChatServerBase, getChatOrigin } from './chatServerBase';
import { goToPage } from './navigateTool';
import { PortalWebMcp } from './portalWebMcp';
import { getCurrentPageDetails, getCurrentContextHref } from './pageDetails';
import {
    captureViewport,
    waitForNetworkIdle,
    waitForViewReady,
} from './screenshot';
import './ChatSidebar.scss';

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

// Mounted once globally in Container.tsx, outside routed content, so it
// survives page navigation.
@observer
export default class ChatSidebar extends React.Component<{}, {}> {
    @observable open = readStoredOpen();

    constructor(props: {}) {
        super(props);
        makeObservable(this);
    }

    private iframeRef = React.createRef<HTMLIFrameElement>();
    private webMcp = new PortalWebMcp();

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

    componentDidMount() {
        window.addEventListener('message', this.onMessage);
        this.syncBodyClass();
        // Also registers go_to_page as a native WebMCP tool where supported;
        // no-op otherwise.
        this.webMcp.start();
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
        document.body.classList.remove('chat-sidebar-closed');
        this.webMcp.stop();
    }

    // The iframe posts a URL here since it can't call routingStore itself.
    private handleNavigate(url: string) {
        goToPage(url);
    }

    onMessage = (e: MessageEvent) => {
        if (e.source !== this.iframeRef.current?.contentWindow) return;
        if (e.origin !== getChatOrigin()) return;
        if (e.data?.type === 'chat-sidebar:navigate') {
            this.handleNavigate(e.data.url);
            return;
        }
        if (e.data?.type === 'chat-sidebar:requestPageInfo') {
            const requestId = e.data.requestId;
            this.iframeRef.current?.contentWindow?.postMessage(
                {
                    type: 'chat-sidebar:pageInfo',
                    requestId,
                    href: getCurrentContextHref(),
                },
                getChatOrigin()
            );
            return;
        }
        if (e.data?.type === 'chat-sidebar:requestPageDetails') {
            const requestId = e.data.requestId;
            this.iframeRef.current?.contentWindow?.postMessage(
                {
                    type: 'chat-sidebar:pageDetails',
                    requestId,
                    details: getCurrentPageDetails(),
                },
                getChatOrigin()
            );
            return;
        }
        if (e.data?.type === 'chat-sidebar:requestScreenshot') {
            const requestId = e.data.requestId;
            this.captureAndRespond(requestId);
            return;
        }
    };

    private async captureAndRespond(requestId: string) {
        // Waits for the page to settle before capturing — a mid-fetch or
        // mid-paint screenshot is worse than a slightly slower one.
        await Promise.all([waitForNetworkIdle(), waitForViewReady()]);
        const dataUrl = await captureViewport();
        this.iframeRef.current?.contentWindow?.postMessage(
            {
                type: 'chat-sidebar:screenshot',
                requestId,
                dataUrl,
            },
            getChatOrigin()
        );
    }

    get iframeSrc(): string {
        const apiRoot = getLoadConfig().apiRoot || '/';
        const params = new URLSearchParams();
        params.set('apiRoot', apiRoot);
        params.set('parentOrigin', window.location.origin);
        return `${getChatServerBase()}/?${params.toString()}`;
    }

    render() {
        return (
            <>
                {!this.open && (
                    <button
                        type="button"
                        className="chat-sidebar-launcher"
                        onClick={this.toggle}
                        aria-label="Open chat"
                        title="Open chat"
                    >
                        💬
                    </button>
                )}
                <aside
                    className="chat-sidebar-panel"
                    aria-label="Chat"
                    hidden={!this.open}
                >
                    <button
                        type="button"
                        className="chat-sidebar-collapse"
                        onClick={this.toggle}
                        aria-label="Close chat"
                        title="Close chat"
                    >
                        ✕
                    </button>
                    <iframe
                        ref={this.iframeRef}
                        title="Chat"
                        src={this.iframeSrc}
                        className="chat-sidebar-iframe"
                        // navigator.clipboard is permission-policy gated, so a
                        // cross-origin chat server needs it delegated to copy.
                        allow="clipboard-write"
                    />
                </aside>
            </>
        );
    }
}
