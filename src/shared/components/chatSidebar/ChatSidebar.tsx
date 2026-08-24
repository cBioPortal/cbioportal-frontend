import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { getChatServerBase } from './chatServerBase';
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

// Mounted once, globally, in Container.tsx, outside routed page content, so
// it survives navigation between pages.
@observer
export default class ChatSidebar extends React.Component<{}, {}> {
    @observable open = readStoredOpen();

    constructor(props: {}) {
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

    componentDidMount() {
        window.addEventListener('message', this.onMessage);
        this.syncBodyClass();
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
        document.body.classList.remove('chat-sidebar-closed');
    }

    // The iframe posts a URL here since it can't call routingStore itself.
    private handleNavigate(url: string) {
        try {
            const parsed = new URL(url, window.location.origin);
            getBrowserWindow().routingStore.updateRoute(
                Object.fromEntries(parsed.searchParams.entries()),
                parsed.pathname,
                /* clear */ true,
                /* replace */ false
            );
        } catch (err) {
            console.error(
                '[ChatSidebar] failed to navigate to url from chat:',
                url,
                err
            );
        }
    }

    onMessage = async (e: MessageEvent) => {
        if (e.source !== this.iframeRef.current?.contentWindow) return;
        if (e.data?.type === 'chat-sidebar:navigate') {
            this.handleNavigate(e.data.url);
            return;
        }
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
        params.set('apiRoot', apiRoot);
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
                    />
                </aside>
            </>
        );
    }
}
