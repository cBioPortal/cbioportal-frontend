import * as React from 'react';
import { observer } from 'mobx-react';
import ChatStore, { getDisplayText } from './ChatStore';

export interface IChatSidebarProps {
    store: ChatStore;
}

const ChatSidebar: React.FunctionComponent<IChatSidebarProps> = observer(
    function ChatSidebar({ store }) {
        const [draft, setDraft] = React.useState('');

        if (!store.isOpen) {
            return null;
        }

        const submit = () => {
            const text = draft;
            setDraft('');
            store.sendMessage(text);
        };

        return (
            <div style={styles.sidebar}>
                <div style={styles.header}>
                    <span>cBioPortal Assistant</span>
                    <button style={styles.closeButton} onClick={store.close}>
                        ×
                    </button>
                </div>
                <div style={styles.messages}>
                    {store.messages.map((message, i) => {
                        const text = getDisplayText(message);
                        // Tool-call/tool-result messages carry no display
                        // text (only tool_use/tool_result blocks) — they're
                        // kept in history for the next request but not shown
                        // as chat bubbles.
                        if (!text) {
                            return null;
                        }
                        return (
                            <div
                                key={i}
                                style={
                                    message.role === 'user'
                                        ? styles.userBubble
                                        : styles.assistantBubble
                                }
                            >
                                {text}
                            </div>
                        );
                    })}
                    {store.isStreaming && (
                        <div style={styles.assistantBubble}>
                            {store.pendingAssistantText || '...'}
                        </div>
                    )}
                </div>
                <div style={styles.inputRow}>
                    <textarea
                        style={styles.textarea}
                        value={draft}
                        placeholder="Ask about a study, gene, or patient..."
                        disabled={store.isStreaming}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                    />
                    <button
                        style={styles.sendButton}
                        disabled={store.isStreaming || !draft.trim()}
                        onClick={submit}
                    >
                        Send
                    </button>
                </div>
            </div>
        );
    }
);

const styles: { [key: string]: React.CSSProperties } = {
    sidebar: {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: '#fff',
        borderLeft: '1px solid #ddd',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1050,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid #eee',
        fontWeight: 600,
    },
    closeButton: {
        border: 'none',
        background: 'none',
        fontSize: 20,
        cursor: 'pointer',
        lineHeight: 1,
    },
    messages: {
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    userBubble: {
        alignSelf: 'flex-end',
        background: '#2b6cb0',
        color: '#fff',
        borderRadius: 10,
        padding: '8px 12px',
        maxWidth: '85%',
        whiteSpace: 'pre-wrap',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        background: '#f0f0f0',
        color: '#222',
        borderRadius: 10,
        padding: '8px 12px',
        maxWidth: '85%',
        whiteSpace: 'pre-wrap',
    },
    inputRow: {
        display: 'flex',
        gap: 8,
        padding: 12,
        borderTop: '1px solid #eee',
    },
    textarea: {
        flex: 1,
        resize: 'none',
        height: 40,
        padding: 8,
        borderRadius: 6,
        border: '1px solid #ccc',
    },
    sendButton: {
        border: 'none',
        borderRadius: 6,
        background: '#2b6cb0',
        color: '#fff',
        padding: '0 16px',
        cursor: 'pointer',
    },
};

export default ChatSidebar;
