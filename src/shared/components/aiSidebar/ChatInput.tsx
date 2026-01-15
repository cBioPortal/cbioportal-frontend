import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { capturePageScreenshot } from './captureScreenshot';
import './aiSidebar.scss';

export interface ChatMessageData {
    text: string;
    imageData?: string;
}

interface IChatInputProps {
    onSend: (data: ChatMessageData) => void;
    isLoading: boolean;
    placeholder?: string;
    screenshotEnabled: boolean;
    onScreenshotToggle: (enabled: boolean) => void;
}

interface IChatInputState {
    message: string;
    isFocused: boolean;
    isCapturing: boolean;
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
            isCapturing: false,
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
    async handleSend() {
        const message = this.state.message.trim();
        if (message && !this.props.isLoading && !this.state.isCapturing) {
            let imageData: string | undefined;

            // Capture screenshot if enabled
            if (this.props.screenshotEnabled) {
                try {
                    this.setState({ isCapturing: true });
                    imageData = await capturePageScreenshot();
                } catch (e) {
                    console.error('Failed to capture screenshot:', e);
                } finally {
                    this.setState({ isCapturing: false });
                }
            }

            this.props.onSend({ text: message, imageData });
            this.setState({ message: '' });
            // Reset textarea height
            if (this.textareaRef.current) {
                this.textareaRef.current.style.height = 'auto';
            }
        }
    }

    @autobind
    handleScreenshotToggle() {
        this.props.onScreenshotToggle(!this.props.screenshotEnabled);
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
        const { isLoading, placeholder, screenshotEnabled } = this.props;
        const { message, isFocused, isCapturing } = this.state;
        const isBusy = isLoading || isCapturing;

        return (
            <div className="ai-chat-input">
                <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
                    <textarea
                        ref={this.textareaRef}
                        className="message-textarea scrollbar-hover"
                        value={message}
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        onFocus={this.handleFocus}
                        onBlur={this.handleBlur}
                        placeholder={placeholder || 'Message AI...'}
                        disabled={isBusy}
                        rows={1}
                    />
                    <div className="input-actions">
                        <button
                            className={`screenshot-toggle ${
                                screenshotEnabled ? 'active' : ''
                            }`}
                            onClick={this.handleScreenshotToggle}
                            title={
                                screenshotEnabled
                                    ? 'Screenshot enabled - click to disable'
                                    : 'Attach screenshot of page'
                            }
                            disabled={isBusy}
                        >
                            <i className="fa-solid fa-camera"></i>
                        </button>
                        <button
                            className="send-button"
                            onClick={this.handleSend}
                            disabled={!message.trim() || isBusy}
                            title="Send message"
                        >
                            {isBusy ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fa-solid fa-arrow-up"></i>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
