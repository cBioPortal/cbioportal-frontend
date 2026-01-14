import * as React from 'react';
import { observer } from 'mobx-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './AiSidebarStore';
import { CodeBlock } from './CodeBlock';
import 'highlight.js/styles/atom-one-dark.css';
import './aiSidebar.scss';

interface IMessageListProps {
    messages: Message[];
}

@observer
export class MessageList extends React.Component<IMessageListProps, {}> {
    private messagesEndRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.messagesEndRef.current) {
            this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }

    formatTimestamp(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        return date.toLocaleDateString();
    }

    render() {
        const { messages } = this.props;

        if (messages.length === 0) {
            return (
                <div className="ai-message-list empty">
                    <div className="empty-state">
                        <i className="fa-solid fa-comments"></i>
                        <p>Start a conversation with the AI assistant</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="ai-message-list">
                {messages.map((message, index) => (
                    <div
                        key={message.id || index}
                        className={`ai-message ${message.sender} ${
                            message.isStreaming ? 'streaming' : ''
                        }`}
                    >
                        <div className="message-avatar">
                            {message.sender === 'user' ? (
                                <i className="fa-solid fa-user"></i>
                            ) : (
                                <i className="fa-solid fa-robot"></i>
                            )}
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-sender">
                                    {message.sender === 'user' ? 'You' : 'AI'}
                                </span>
                                <span className="message-timestamp">
                                    {this.formatTimestamp(message.timestamp)}
                                </span>
                            </div>
                            <div className={`message-text ${message.sender === 'ai' ? 'markdown-content' : ''}`}>
                                {message.sender === 'ai' ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code: CodeBlock as any,
                                            a: ({ href, children }) => (
                                                <a href={href} target="_blank" rel="noopener noreferrer">
                                                    {children}
                                                </a>
                                            ),
                                        }}
                                    >
                                        {message.text}
                                    </ReactMarkdown>
                                ) : (
                                    message.text
                                )}
                                {message.isStreaming && (
                                    <span className="streaming-cursor"></span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={this.messagesEndRef} />
            </div>
        );
    }
}
