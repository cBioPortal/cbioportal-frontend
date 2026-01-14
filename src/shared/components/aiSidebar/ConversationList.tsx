import * as React from 'react';
import { observer } from 'mobx-react';
import { AiSidebarStore, Conversation } from './AiSidebarStore';
import './aiSidebar.scss';

interface IConversationListProps {
    store: AiSidebarStore;
}

@observer
export class ConversationList extends React.Component<IConversationListProps, {}> {
    handleToggleExpanded = () => {
        this.props.store.setConversationsExpanded(!this.props.store.conversationsExpanded);
    };

    handleSelectConversation = (conversationId: string) => {
        this.props.store.selectConversation(conversationId);
    };

    truncateTitle(title: string, maxLength: number = 30): string {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + '...';
    }

    renderConversationItem(conversation: Conversation) {
        const { currentConversationId } = this.props.store;
        const isActive = conversation.conversationId === currentConversationId;

        return (
            <div
                key={conversation.conversationId}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => this.handleSelectConversation(conversation.conversationId)}
                title={conversation.title}
            >
                <i className="fa-regular fa-message"></i>
                <span className="conversation-title">
                    {this.truncateTitle(conversation.title)}
                </span>
            </div>
        );
    }

    renderGroupedConversations() {
        const { groupedConversations } = this.props.store;
        const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

        return groupOrder.map(groupName => {
            const conversations = groupedConversations[groupName];
            if (!conversations || conversations.length === 0) return null;

            return (
                <div key={groupName} className="conversation-group">
                    <div className="conversation-group-header">{groupName}</div>
                    {conversations.map(convo => this.renderConversationItem(convo))}
                </div>
            );
        });
    }

    render() {
        const { conversationsExpanded, conversationsLoading, conversations } = this.props.store;

        return (
            <div className="conversation-list-container">
                <div
                    className="conversation-list-header"
                    onClick={this.handleToggleExpanded}
                >
                    <i className={`fa-solid fa-chevron-${conversationsExpanded ? 'down' : 'right'}`}></i>
                    <span>Conversations</span>
                    {conversations.length > 0 && (
                        <span className="conversation-count">({conversations.length})</span>
                    )}
                </div>

                {conversationsExpanded && (
                    <div className="conversation-list">
                        {conversationsLoading ? (
                            <div className="conversation-loading">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>Loading...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="conversation-empty">
                                No conversations yet
                            </div>
                        ) : (
                            this.renderGroupedConversations()
                        )}
                    </div>
                )}
            </div>
        );
    }
}
