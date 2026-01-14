import { action, observable, makeObservable, computed } from 'mobx';

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

export class AiSidebarStore {
    @observable messages: Message[] = [];
    @observable isLoading: boolean = false;
    @observable streamingMessage: string = '';
    @observable error: string | null = null;
    @observable agents: Agent[] = [];
    @observable selectedAgentId: string | null = null;

    constructor() {
        makeObservable(this);
        this.loadMessagesFromStorage();
        this.loadAgentSelectionFromStorage();
    }

    @computed get selectedAgent(): Agent | null {
        return this.agents.find(a => a.id === this.selectedAgentId) || null;
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
                localStorage.setItem('aiSidebarSelectedAgentId', this.selectedAgentId);
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
            console.error('Failed to load agent selection from localStorage', e);
        }
    }
}
