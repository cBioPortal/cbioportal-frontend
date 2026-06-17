import * as React from 'react';
import { observer } from 'mobx-react';
import { ChatStore } from './store/ChatStore';
import MessageList from './components/MessageList';
import ChatComposer from './components/ChatComposer';
import AccessKeyModal from './components/AccessKeyModal';
import styles from './ChatSidebar.module.scss';

interface ChatSidebarProps {
    store: ChatStore;
}

@observer
export default class ChatSidebar extends React.Component<ChatSidebarProps> {
    render() {
        const { store } = this.props;

        if (!store.isOpen) return null;

        if (store.needsKey) {
            return <AccessKeyModal store={store} />;
        }

        return (
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <span className={styles.title}>cBioPortal Assistant</span>
                    <button
                        className={styles.closeBtn}
                        onClick={() => store.closeSidebar()}
                        aria-label="Close assistant"
                    >
                        ✕
                    </button>
                </div>

                {store.errorMessage && (
                    <div className={styles.errorBanner}>
                        <span>{store.errorMessage}</span>
                        <button
                            className={styles.errorDismiss}
                            onClick={() => store.clearError()}
                        >
                            ✕
                        </button>
                    </div>
                )}

                <MessageList messages={store.messages} />

                <ChatComposer store={store} />
            </div>
        );
    }
}
