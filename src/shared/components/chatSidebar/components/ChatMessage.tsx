import * as React from 'react';
import { observer } from 'mobx-react';
import { ChatMessage as ChatMessageType, MessagePart } from '../store/types';
import MarkdownMessage from './MarkdownMessage';
import ReasoningBlock from './ReasoningBlock';
import ToolCallDisplay from './ToolCallDisplay';
import styles from './ChatMessage.module.scss';

interface ChatMessageProps {
    message: ChatMessageType;
}

@observer
export default class ChatMessage extends React.Component<ChatMessageProps> {
    private renderPart(part: MessagePart, index: number): React.ReactNode {
        switch (part.type) {
            case 'text':
                return part.text ? (
                    <MarkdownMessage key={index} content={part.text} />
                ) : null;
            case 'reasoning':
                return part.text ? (
                    <ReasoningBlock
                        key={index}
                        text={part.text}
                        done={part.done}
                    />
                ) : null;
            case 'tool-call':
                return <ToolCallDisplay key={index} part={part} />;
            default:
                return null;
        }
    }

    // Whether the message has anything to display yet. step-start parts and
    // not-yet-streamed text/reasoning render nothing, so an assistant message
    // can exist with no visible content while we wait for the first tokens.
    private get hasVisibleContent(): boolean {
        return this.props.message.parts.some(
            part =>
                (part.type === 'text' && part.text.length > 0) ||
                (part.type === 'reasoning' && part.text.length > 0) ||
                part.type === 'tool-call'
        );
    }

    render() {
        const { message } = this.props;
        const isUser = message.role === 'user';
        const showThinking = !isUser && !this.hasVisibleContent;

        return (
            <div
                className={`${styles.message} ${
                    isUser ? styles.user : styles.assistant
                }`}
            >
                <div className={styles.bubble}>
                    {showThinking ? (
                        <span
                            className={styles.thinking}
                            aria-label="Assistant is thinking"
                            role="status"
                        >
                            <span className={styles.dot} />
                        </span>
                    ) : (
                        message.parts.map((part, i) => this.renderPart(part, i))
                    )}
                </div>
            </div>
        );
    }
}
