import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
import AlterationBeacons from './AlterationBeacons';
import './ChatSidebar.scss';

interface IChatSidebarProps {
    studyId: string | undefined;
}

@observer
export default class ChatSidebar extends React.Component<IChatSidebarProps, {}> {
    @observable open = false;

    constructor(props: IChatSidebarProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    toggle() {
        this.open = !this.open;
    }

    get iframeSrc(): string {
        const apiRoot = getLoadConfig().apiRoot || '/';
        const params = new URLSearchParams();
        if (this.props.studyId) params.set('studyId', this.props.studyId);
        params.set('apiRoot', apiRoot);
        const host =
            typeof window !== 'undefined' ? window.location.hostname : '';
        const base = host.endsWith('cbioportal.org')
            ? 'https://cbioportal-frontend-sidebar.vercel.app/'
            : 'https://vps-870e202d.tailf02841.ts.net:5174/';
        return `${base}?${params.toString()}`;
    }

    render() {
        return (
            <>
                <AlterationBeacons studyId={this.props.studyId} />
                <button
                    type="button"
                    className="chat-sidebar-launcher"
                    onClick={this.toggle}
                    aria-label={
                        this.open ? 'Close study chat' : 'Open study chat'
                    }
                    title={this.open ? 'Close study chat' : 'Open study chat'}
                >
                    {this.open ? '✕' : '💬'}
                </button>
                {this.open && (
                    <aside className="chat-sidebar-panel" aria-label="Study chat">
                        <iframe
                            title="Study chat"
                            src={this.iframeSrc}
                            className="chat-sidebar-iframe"
                        />
                    </aside>
                )}
            </>
        );
    }
}
