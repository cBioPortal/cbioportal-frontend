import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
import AlterationBeacons from './AlterationBeacons';
import { getChatServerBase } from './chatServerBase';
import './ChatSidebar.scss';

interface IChatSidebarProps {
    studyId: string | undefined;
    genes?: string[];
    tab?: string;
}

@observer
export default class ChatSidebar extends React.Component<IChatSidebarProps, {}> {
    @observable open = true;

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
                <aside
                    className="chat-sidebar-panel"
                    aria-label="Study chat"
                    hidden={!this.open}
                >
                    <iframe
                        title="Study chat"
                        src={this.iframeSrc}
                        className="chat-sidebar-iframe"
                    />
                </aside>
            </>
        );
    }
}
