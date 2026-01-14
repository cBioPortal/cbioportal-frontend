import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import './aiSidebar.scss';

interface IChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
}

interface IChatInputState {
    message: string;
    isFocused: boolean;
}

@observer
export class ChatInput extends React.Component<
    IChatInputProps,
    IChatInputState
> {
    private textareaRef = React.createRef<HTMLTextAreaElement>();

    constructor(props: IChatInputProps) {
        super(props);
        this.state = {
            message: '',
            isFocused: false,
        };
    }

    @autobind
    handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        // Send on Enter, new line on Shift+Enter
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }

    @autobind
    handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        this.setState({ message: event.target.value });
        this.adjustTextareaHeight();
    }

    @autobind
    handleSend() {
        const message = this.state.message.trim();
        if (message && !this.props.isLoading) {
            this.props.onSend(message);
            this.setState({ message: '' });
            // Reset textarea height
            if (this.textareaRef.current) {
                this.textareaRef.current.style.height = 'auto';
            }
        }
    }

    adjustTextareaHeight() {
        if (this.textareaRef.current) {
            this.textareaRef.current.style.height = 'auto';
            this.textareaRef.current.style.height = `${Math.min(
                this.textareaRef.current.scrollHeight,
                200
            )}px`;
        }
    }

    @autobind
    handleFocus() {
        this.setState({ isFocused: true });
    }

    @autobind
    handleBlur() {
        this.setState({ isFocused: false });
    }

    componentDidMount() {
        this.adjustTextareaHeight();
    }

    render() {
        const { isLoading, placeholder } = this.props;
        const { message, isFocused } = this.state;

        return (
            <div className="ai-chat-input">
                <div
                    className={`input-wrapper ${isFocused ? 'focused' : ''}`}
                >
                    <textarea
                        ref={this.textareaRef}
                        className="message-textarea scrollbar-hover"
                        value={message}
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        onFocus={this.handleFocus}
                        onBlur={this.handleBlur}
                        placeholder={placeholder || 'Message AI...'}
                        disabled={isLoading}
                        rows={1}
                    />
                    <button
                        className="send-button"
                        onClick={this.handleSend}
                        disabled={!message.trim() || isLoading}
                        title="Send message"
                    >
                        {isLoading ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fa-solid fa-arrow-up"></i>
                        )}
                    </button>
                </div>
            </div>
        );
    }
}
