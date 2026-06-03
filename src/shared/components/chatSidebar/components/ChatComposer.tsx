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
    constructor(props: ChatComposerProps) {
        super(props);
        this.state = { text: '' };
    }

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
        this.setState({ text: '' });
    };

    private handleCancel = () => {
        this.props.store.cancelStream();
    };

    render() {
        const { store } = this.props;
        const isStreaming = store.status === 'streaming';

        return (
            <div className={styles.composer}>
                <textarea
                    className={styles.textarea}
                    placeholder="Message the assistant… (Shift+Enter for newline)"
                    value={this.state.text}
                    disabled={isStreaming}
                    onChange={e => this.setState({ text: e.target.value })}
                    onKeyDown={this.handleKeyDown}
                    rows={3}
                />
                <div className={styles.actions}>
                    {isStreaming ? (
                        <button
                            className={styles.cancelBtn}
                            onClick={this.handleCancel}
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            className={styles.sendBtn}
                            disabled={!this.state.text.trim()}
                            onClick={this.handleSend}
                        >
                            Send
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
