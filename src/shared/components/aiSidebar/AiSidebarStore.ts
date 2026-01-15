import { action, observable, makeObservable, computed } from 'mobx';
import { librechatClient } from '../../api/librechatClient';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isStreaming?: boolean;
}

export interface Agent {
    id: string;
    name: string;
    description?: string;
    avatar?: { filepath?: string };
}

export interface Conversation {
    conversationId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    endpoint?: string;
}

export interface GroupedConversations {
    [key: string]: Conversation[];
}

export class AiSidebarStore {
    @observable messages: Message[] = [];
    @observable isLoading: boolean = false;
    @observable streamingMessage: string = '';
    @observable error: string | null = null;
    @observable agents: Agent[] = [];
    @observable selectedAgentId: string | null = null;

    // Conversation management
    @observable conversations: Conversation[] = [];
    @observable currentConversationId: string | null = null;
    @observable conversationsExpanded: boolean = false;
    @observable conversationsLoading: boolean = false;

    // Screenshot attachment
    @observable screenshotEnabled: boolean = false;

    constructor() {
        makeObservable(this);
        this.loadMessagesFromStorage();
        this.loadAgentSelectionFromStorage();
        this.loadCurrentConversationFromStorage();
        this.loadScreenshotPreference();
    }

    @computed get selectedAgent(): Agent | null {
        return this.agents.find(a => a.id === this.selectedAgentId) || null;
    }

    @computed get groupedConversations(): GroupedConversations {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today.getTime() - 86400000);
        const weekAgo = new Date(today.getTime() - 7 * 86400000);

        const groups: GroupedConversations = {
            Today: [],
            Yesterday: [],
            'Previous 7 Days': [],
            Older: [],
        };

        for (const convo of this.conversations) {
            const updatedAt = convo.updatedAt;
            if (updatedAt >= today) {
                groups['Today'].push(convo);
            } else if (updatedAt >= yesterday) {
                groups['Yesterday'].push(convo);
            } else if (updatedAt >= weekAgo) {
                groups['Previous 7 Days'].push(convo);
            } else {
                groups['Older'].push(convo);
            }
        }

        return groups;
    }

    @computed get allMessages(): Message[] {
        const messages = [...this.messages];
        if (this.streamingMessage) {
            messages.push({
                id: 'streaming',
                text: this.streamingMessage,
                sender: 'ai',
                timestamp: new Date(),
                isStreaming: true,
            });
        }
        return messages;
    }

    @action
    public addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
        const newMessage: Message = {
            ...message,
            id: `msg_${Date.now()}_${Math.random()}`,
            timestamp: new Date(),
        };
        this.messages.push(newMessage);
        this.saveMessagesToStorage();
    }

    @action
    public updateStreamingMessage(text: string) {
        this.streamingMessage = text;
    }

    @action
    public finalizeStreamingMessage() {
        if (this.streamingMessage) {
            this.addMessage({
                text: this.streamingMessage,
                sender: 'ai',
            });
            this.streamingMessage = '';
        }
    }

    @action
    public setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    @action
    public setError(error: string | null) {
        this.error = error;
    }

    @action
    public clearMessages() {
        this.messages = [];
        this.streamingMessage = '';
        this.saveMessagesToStorage();
    }

    @action
    public setAgents(agents: Agent[]) {
        this.agents = agents;
        // Auto-select first agent if none selected
        if (!this.selectedAgentId && agents.length > 0) {
            this.selectedAgentId = agents[0].id;
        }
    }

    @action
    public setSelectedAgentId(agentId: string) {
        this.selectedAgentId = agentId;
        this.saveAgentSelectionToStorage();
    }

    // Screenshot toggle
    @action
    public setScreenshotEnabled(enabled: boolean) {
        this.screenshotEnabled = enabled;
        this.saveScreenshotPreference();
    }

    // Conversation management actions
    @action
    public setConversationsExpanded(expanded: boolean) {
        this.conversationsExpanded = expanded;
    }

    @action
    public setCurrentConversationId(conversationId: string | null) {
        this.currentConversationId = conversationId;
        this.saveCurrentConversationToStorage();
    }

    @action
    public async loadConversations() {
        this.conversationsLoading = true;
        try {
            const convos = await librechatClient.getConversations();
            this.conversations = (convos || [])
                .map((c: any) => ({
                    conversationId: c.conversationId,
                    title: c.title || 'New Chat',
                    createdAt: new Date(c.createdAt),
                    updatedAt: new Date(c.updatedAt),
                    endpoint: c.endpoint,
                }))
                .sort(
                    (a: Conversation, b: Conversation) =>
                        b.updatedAt.getTime() - a.updatedAt.getTime()
                );
        } catch (e) {
            console.error('Failed to load conversations', e);
        } finally {
            this.conversationsLoading = false;
        }
    }

    @action
    public async selectConversation(conversationId: string) {
        this.setCurrentConversationId(conversationId);
        this.isLoading = true;
        this.messages = [];

        try {
            const messagesData = await librechatClient.getMessages(
                conversationId
            );
            if (Array.isArray(messagesData)) {
                this.messages = messagesData.map((m: any) => {
                    // Extract text - check direct text field first, then content array
                    let text = m.text || '';
                    if (!text && Array.isArray(m.content)) {
                        // LibreChat AI responses store text in content array
                        // Format: [{type: "text", text: "..."}, {type: "think", think: "..."}]
                        const textParts = m.content
                            .filter((c: any) => c.type === 'text' && c.text)
                            .map((c: any) => c.text);
                        text = textParts.join('\n');
                    }
                    return {
                        id: m.messageId || `msg_${Date.now()}_${Math.random()}`,
                        text,
                        sender: m.isCreatedByUser ? 'user' : 'ai',
                        timestamp: new Date(m.createdAt || Date.now()),
                    };
                });
            }
        } catch (e) {
            console.error('Failed to load messages for conversation', e);
            this.error = 'Failed to load conversation messages';
        } finally {
            this.isLoading = false;
        }
    }

    @action
    public startNewConversation() {
        this.currentConversationId = null;
        this.messages = [];
        this.streamingMessage = '';
        this.error = null;
        this.saveCurrentConversationToStorage();
    }

    private saveMessagesToStorage() {
        try {
            localStorage.setItem(
                'aiSidebarMessages',
                JSON.stringify(
                    this.messages.map(m => ({
                        ...m,
                        timestamp: m.timestamp.toISOString(),
                    }))
                )
            );
        } catch (e) {
            console.error('Failed to save messages to localStorage', e);
        }
    }

    private loadMessagesFromStorage() {
        try {
            const stored = localStorage.getItem('aiSidebarMessages');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.messages = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                }));
            }
        } catch (e) {
            console.error('Failed to load messages from localStorage', e);
        }
    }

    private saveAgentSelectionToStorage() {
        try {
            if (this.selectedAgentId) {
                localStorage.setItem(
                    'aiSidebarSelectedAgentId',
                    this.selectedAgentId
                );
            }
        } catch (e) {
            console.error('Failed to save agent selection to localStorage', e);
        }
    }

    private loadAgentSelectionFromStorage() {
        try {
            const stored = localStorage.getItem('aiSidebarSelectedAgentId');
            if (stored) {
                this.selectedAgentId = stored;
            }
        } catch (e) {
            console.error(
                'Failed to load agent selection from localStorage',
                e
            );
        }
    }

    private saveCurrentConversationToStorage() {
        try {
            if (this.currentConversationId) {
                localStorage.setItem(
                    'aiSidebarCurrentConversationId',
                    this.currentConversationId
                );
            } else {
                localStorage.removeItem('aiSidebarCurrentConversationId');
            }
        } catch (e) {
            console.error(
                'Failed to save current conversation to localStorage',
                e
            );
        }
    }

    private loadCurrentConversationFromStorage() {
        try {
            const stored = localStorage.getItem(
                'aiSidebarCurrentConversationId'
            );
            if (stored) {
                this.currentConversationId = stored;
            }
        } catch (e) {
            console.error(
                'Failed to load current conversation from localStorage',
                e
            );
        }
    }

    private saveScreenshotPreference() {
        try {
            localStorage.setItem(
                'aiSidebarScreenshotEnabled',
                String(this.screenshotEnabled)
            );
        } catch (e) {
            console.error(
                'Failed to save screenshot preference to localStorage',
                e
            );
        }
    }

    private loadScreenshotPreference() {
        try {
            const stored = localStorage.getItem('aiSidebarScreenshotEnabled');
            if (stored === 'true') {
                this.screenshotEnabled = true;
            }
        } catch (e) {
            console.error(
                'Failed to load screenshot preference from localStorage',
                e
            );
        }
    }
}
