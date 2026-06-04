import * as React from 'react';
import { observer } from 'mobx-react';
import { ChatStore } from '../store/ChatStore';
import styles from './ChatComposer.module.scss';

interface ChatComposerProps {
    store: ChatStore;
}

interface ChatComposerState {
    text: string;
}

@observer
export default class ChatComposer extends React.Component<
    ChatComposerProps,
    ChatComposerState
> {
    private textareaRef = React.createRef<HTMLTextAreaElement>();

    constructor(props: ChatComposerProps) {
        super(props);
        this.state = { text: '' };
    }

    // Grow the textarea with its content (up to the CSS max-height, after which
    // it scrolls). Reset to auto first so it can also shrink as lines are
    // removed.
    private autoResize = () => {
        const el = this.textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    private handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ text: e.target.value }, this.autoResize);
    };

    private handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    };

    private handleSend = () => {
        const text = this.state.text.trim();
        if (!text || this.props.store.status === 'streaming') return;
        this.props.store.sendMessage(text);
        this.setState({ text: '' }, this.autoResize);
    };

    private handleCancel = () => {
        this.props.store.cancelStream();
    };

    render() {
        const { store } = this.props;
        const isStreaming = store.status === 'streaming';
        const canSend = !!this.state.text.trim();

        return (
            <div className={styles.composer}>
                <textarea
                    ref={this.textareaRef}
                    className={styles.textarea}
                    placeholder="Send a message…"
                    value={this.state.text}
                    autoFocus
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    rows={1}
                />
                {isStreaming ? (
                    <button
                        className={`${styles.iconBtn} ${styles.stopBtn}`}
                        onClick={this.handleCancel}
                        aria-label="Stop generating"
                    >
                        <StopIcon />
                    </button>
                ) : (
                    <button
                        className={`${styles.iconBtn} ${styles.sendBtn}`}
                        disabled={!canSend}
                        onClick={this.handleSend}
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                )}
            </div>
        );
    }
}

const SendIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
    </svg>
);

const StopIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
);
