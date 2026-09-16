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
import {
    clampChatSidebarWidth,
    DEFAULT_CHAT_SIDEBAR_WIDTH,
    MIN_CHAT_SIDEBAR_WIDTH,
    readStoredChatSidebarWidth,
} from './chatSidebarWidth';
import './ChatSidebar.scss';

const OPEN_STORAGE_KEY = 'chat-sidebar:open';
const WIDTH_STORAGE_KEY = 'chat-sidebar:width';
const KEYBOARD_RESIZE_STEP = 20;

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
    @observable width = readStoredChatSidebarWidth(
        localStorage,
        WIDTH_STORAGE_KEY
    );
    @observable resizing = false;

    constructor(props: {}) {
        super(props);
        makeObservable(this);
    }

    private iframeRef = React.createRef<HTMLIFrameElement>();
    private webMcp = new PortalWebMcp();
    private resizeStartX = 0;
    private resizeStartWidth = DEFAULT_CHAT_SIDEBAR_WIDTH;

    private get maximumWidth() {
        return window.innerWidth;
    }

    private get minimumWidth() {
        return Math.min(MIN_CHAT_SIDEBAR_WIDTH, this.maximumWidth);
    }

    private clampWidth(width: number) {
        return clampChatSidebarWidth(width, this.maximumWidth);
    }

    private storeWidth() {
        try {
            localStorage.setItem(WIDTH_STORAGE_KEY, String(this.width));
        } catch {
            /* localStorage may be unavailable */
        }
    }

    @action.bound
    stopResizing() {
        if (!this.resizing) return;
        this.resizing = false;
        document.body.classList.remove('chat-sidebar-resizing');
        this.storeWidth();
    }

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
        window.addEventListener('resize', this.onWindowResize);
        this.onWindowResize();
        this.syncBodyClass();
        // Also registers go_to_page as a native WebMCP tool where supported;
        // no-op otherwise.
        this.webMcp.start();
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
        window.removeEventListener('resize', this.onWindowResize);
        document.body.classList.remove('chat-sidebar-closed');
        document.body.classList.remove('chat-sidebar-resizing');
        this.webMcp.stop();
    }

    @action.bound
    onWindowResize() {
        this.width = this.clampWidth(this.width);
    }

    @action.bound
    onResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (e.button !== 0) return;
        this.resizeStartX = e.clientX;
        this.resizeStartWidth = this.width;
        this.resizing = true;
        document.body.classList.add('chat-sidebar-resizing');
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
    }

    @action.bound
    onResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!this.resizing) return;
        this.width = this.clampWidth(
            this.resizeStartWidth + this.resizeStartX - e.clientX
        );
    }

    @action.bound
    onResizePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        this.stopResizing();
    }

    @action.bound
    onResizeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        let nextWidth = this.width;
        switch (e.key) {
            case 'ArrowLeft':
                nextWidth += KEYBOARD_RESIZE_STEP;
                break;
            case 'ArrowRight':
                nextWidth -= KEYBOARD_RESIZE_STEP;
                break;
            case 'Home':
                nextWidth = this.minimumWidth;
                break;
            case 'End':
                nextWidth = this.maximumWidth;
                break;
            default:
                return;
        }
        e.preventDefault();
        this.width = this.clampWidth(nextWidth);
        this.storeWidth();
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
                    className={`chat-sidebar-panel${
                        this.resizing ? ' chat-sidebar-panel-resizing' : ''
                    }`}
                    aria-label="Chat"
                    hidden={!this.open}
                    style={{ width: this.width }}
                >
                    <div
                        className="chat-sidebar-resize-handle"
                        role="separator"
                        aria-label="Resize chat sidebar"
                        aria-orientation="vertical"
                        aria-valuemin={this.minimumWidth}
                        aria-valuemax={this.maximumWidth}
                        aria-valuenow={this.width}
                        tabIndex={0}
                        onPointerDown={this.onResizePointerDown}
                        onPointerMove={this.onResizePointerMove}
                        onPointerUp={this.onResizePointerEnd}
                        onPointerCancel={this.onResizePointerEnd}
                        onLostPointerCapture={this.stopResizing}
                        onKeyDown={this.onResizeKeyDown}
                    />
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
