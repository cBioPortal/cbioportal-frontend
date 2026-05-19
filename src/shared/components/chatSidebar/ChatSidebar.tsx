import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
import AlterationBeacons from './AlterationBeacons';
import { getChatServerBase } from './chatServerBase';
import { captureViewport, waitForViewReady } from './screenshot';
import './ChatSidebar.scss';

interface IChatSidebarProps {
    studyId: string | undefined;
    genes?: string[];
    tab?: string;
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
    }

    componentDidMount() {
        window.addEventListener('message', this.onMessage);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
    }

    onMessage = async (e: MessageEvent) => {
        // The iframe asks for a screenshot before each preset request so the
        // model sees what the user is actually looking at.
        if (
            e.source !== this.iframeRef.current?.contentWindow ||
            e.data?.type !== 'chat-sidebar:requestScreenshot'
        ) {
            return;
        }
        const requestId = e.data.requestId;
        await waitForViewReady();
        const dataUrl = await captureViewport();
        this.iframeRef.current?.contentWindow?.postMessage(
            { type: 'chat-sidebar:screenshot', requestId, dataUrl },
            '*'
        );
    };

    get iframeSrc(): string {
        const apiRoot = getLoadConfig().apiRoot || '/';
        const params = new URLSearchParams();
        if (this.props.studyId) params.set('studyId', this.props.studyId);
        if (this.props.tab) params.set('tab', this.props.tab);
        if (this.props.genes && this.props.genes.length > 0) {
            params.set('genes', this.props.genes.join(','));
        }
        params.set('apiRoot', apiRoot);
        return `${getChatServerBase()}/?${params.toString()}`;
    }

    render() {
        return (
            <>
                {this.open && (
                    <AlterationBeacons studyId={this.props.studyId} />
                )}
                <button
                    type="button"
                    className={
                        'chat-sidebar-launcher' +
                        (this.open ? ' is-open' : '')
                    }
                    onClick={this.toggle}
                    aria-label={
                        this.open ? 'Close study chat' : 'Open study chat'
                    }
                    title={this.open ? 'Close study chat' : 'Open study chat'}
                >
                    {this.open ? '✕' : '💬'}
                </button>
                <aside
                    className="chat-sidebar-panel"
                    aria-label="Study chat"
                    hidden={!this.open}
                >
                    <iframe
                        ref={this.iframeRef}
                        title="Study chat"
                        src={this.iframeSrc}
                        className="chat-sidebar-iframe"
                    />
                </aside>
            </>
        );
    }
}
