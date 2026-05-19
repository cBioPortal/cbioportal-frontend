import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable, action } from 'mobx';
import { getLoadConfig } from 'config/config';
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
        return `/chat-sidebar/index.html?${params.toString()}`;
    }

    render() {
        return (
            <>
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
