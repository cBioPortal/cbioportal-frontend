import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import { AppStore } from '../../../AppStore';
import { AiSidebarStore } from './AiSidebarStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { librechatClient } from '../../api/librechatClient';
import './aiDesignTokens.css';
import './aiSidebar.scss';

interface IAiSidebarProps {
    appStore?: AppStore;
}

@inject('appStore')
@observer
export class AiSidebar extends React.Component<IAiSidebarProps, {}> {
    @observable sidebarStore: AiSidebarStore;
    @observable isResizing: boolean = false;
    private startX: number = 0;
    private startWidth: number = 0;

    constructor(props: IAiSidebarProps) {
        super(props);
        makeObservable(this);
        this.sidebarStore = new AiSidebarStore();
    }

    async componentDidMount() {
        // Add mouse event listeners for resizing
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);

        // Start a new conversation (don't clear messages - they persist in localStorage)
        this.props.appStore!.setCurrentConversationId(null);

        // Initialize LibreChat authentication
        const authenticated = await librechatClient.initialize();
        if (!authenticated) {
            this.sidebarStore.setError(
                'Not authenticated. Please log in at chat.cbioportal.org'
            );
        } else {
            // Fetch available agents
            const agents = await librechatClient.getAgents();
            console.log('LibreChat agents:', agents);
            if (agents && agents.length > 0) {
                this.sidebarStore.setAgents(agents);
            }
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        librechatClient.closeSSE();
    }

    @autobind
    handleSendMessage(message: string) {
        // Add user message to store
        this.sidebarStore.addMessage({
            text: message,
            sender: 'user',
        });

        // Set loading state
        this.sidebarStore.setLoading(true);
        this.sidebarStore.setError(null);

        // Get selected agent
        const selectedAgent = this.sidebarStore.selectedAgent;
        if (!selectedAgent) {
            this.sidebarStore.setError('Please select an agent');
            this.sidebarStore.setLoading(false);
            return;
        }

        // Send to LibreChat API
        librechatClient.sendMessage(
            {
                text: message,
                conversationId: this.props.appStore!.currentConversationId || undefined,
                endpoint: 'agents',  // Always use agents endpoint
                agent_id: selectedAgent.id,
            },
            // On stream update
            (text: string) => {
                this.sidebarStore.updateStreamingMessage(text);
            },
            // On complete
            (response) => {
                this.sidebarStore.finalizeStreamingMessage();
                this.sidebarStore.setLoading(false);
                // Update conversation ID
                if (response.conversationId) {
                    this.props.appStore!.setCurrentConversationId(
                        response.conversationId
                    );
                }
            },
            // On error
            (error) => {
                this.sidebarStore.setLoading(false);
                this.sidebarStore.setError(error.message);
                console.error('LibreChat error:', error);
            }
        );
    }

    @autobind
    handleAgentChange(agentId: string) {
        this.sidebarStore.setSelectedAgentId(agentId);
    }

    @autobind
    handleClose() {
        this.props.appStore!.toggleAiSidebar();
    }

    @autobind
    handleClearChat() {
        if (
            confirm('Are you sure you want to clear this conversation?')
        ) {
            this.sidebarStore.clearMessages();
            this.props.appStore!.setCurrentConversationId(null);
        }
    }

    @autobind
    handleResizeStart(event: React.MouseEvent) {
        this.isResizing = true;
        this.startX = event.clientX;
        this.startWidth = this.props.appStore!.aiSidebarWidth;
        event.preventDefault();
    }

    @autobind
    handleMouseMove(event: MouseEvent) {
        if (!this.isResizing) return;

        const deltaX = this.startX - event.clientX;
        const newWidth = this.startWidth + deltaX;
        this.props.appStore!.setAiSidebarWidth(newWidth);
    }

    @autobind
    handleMouseUp() {
        this.isResizing = false;
    }

    render() {
        const { appStore } = this.props;
        if (!appStore || !appStore.aiSidebarVisible) {
            return null;
        }

        const sidebarWidth = appStore.aiSidebarWidth;

        return (
            <div
                className="ai-sidebar-container"
                style={{ width: `${sidebarWidth}px` }}
            >
                <div
                    className="resize-handle"
                    onMouseDown={this.handleResizeStart}
                />

                <div className="ai-sidebar-header">
                    <div className="header-title">
                        <i className="fa-solid fa-comments"></i>
                        <span>AI Assistant</span>
                    </div>
                    <AgentSelector
                        agents={this.sidebarStore.agents}
                        selectedAgentId={this.sidebarStore.selectedAgentId}
                        onAgentChange={this.handleAgentChange}
                        disabled={this.sidebarStore.isLoading}
                    />
                    <div className="header-actions">
                        <button
                            className="icon-button"
                            onClick={this.handleClearChat}
                            title="Clear conversation"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                        <button
                            className="icon-button"
                            onClick={this.handleClose}
                            title="Close sidebar (⌘J)"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>

                <div className="ai-sidebar-content">
                    {this.sidebarStore.error && (
                        <div className="error-message">
                            <i className="fa-solid fa-exclamation-triangle"></i>
                            <span>{this.sidebarStore.error}</span>
                        </div>
                    )}

                    <MessageList messages={this.sidebarStore.allMessages} />
                </div>

                <div className="ai-sidebar-footer">
                    <ChatInput
                        onSend={this.handleSendMessage}
                        isLoading={this.sidebarStore.isLoading}
                    />
                </div>
            </div>
        );
    }
}
