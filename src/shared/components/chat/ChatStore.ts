import { action, observable, makeObservable } from 'mobx';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';

// Prototype only: requests go through the dev server's proxy (see
// devServer.proxy in rspack.config.js) to the standalone cbioportal-chat-gateway
// service, so the browser only ever talks to same-origin https and doesn't
// hit mixed-content blocking. A relative path also means this works
// unchanged once the gateway is proxied the same way in a real deployment.
const CHAT_GATEWAY_URL = '';

export type ChatContentBlock = {
    type: string;
    text?: string;
    [key: string]: any;
};

export interface ChatMessage {
    role: 'user' | 'assistant' | 'tool' | 'system';
    content: string | ChatContentBlock[];
}

export function getDisplayText(message: ChatMessage): string {
    if (typeof message.content === 'string') {
        return message.content;
    }
    return message.content
        .filter(
            block => block.type === 'text' && typeof block.text === 'string'
        )
        .map(block => block.text)
        .join('');
}

export class ChatStore {
    @observable isOpen: boolean = false;
    @observable isStreaming: boolean = false;
    @observable.ref messages: ChatMessage[] = [];
    @observable pendingAssistantText: string = '';

    constructor(private routingStore: ExtendedRouterStore) {
        makeObservable(this);
    }

    @action
    open() {
        this.isOpen = true;
    }

    @action
    close() {
        this.isOpen = false;
    }

    @action
    toggle() {
        this.isOpen = !this.isOpen;
    }

    @action
    async sendMessage(text: string) {
        if (!text.trim() || this.isStreaming) {
            return;
        }

        this.open();
        this.messages = [...this.messages, { role: 'user', content: text }];
        this.isStreaming = true;
        this.pendingAssistantText = '';

        try {
            const response = await fetch(`${CHAT_GATEWAY_URL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.messages }),
            });

            if (!response.ok || !response.body) {
                throw new Error(
                    `Chat gateway responded with ${response.status}`
                );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true });

                let boundary;
                while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                    const rawEvent = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    this.handleSSEEvent(rawEvent);
                }
            }
        } catch (e) {
            this.appendAssistantError(
                e instanceof Error
                    ? e.message
                    : 'Unknown error contacting chat gateway'
            );
        } finally {
            this.isStreaming = false;
        }
    }

    @action
    private handleSSEEvent(rawEvent: string) {
        let eventType = 'message';
        let data = '';
        for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) {
                eventType = line.slice('event:'.length).trim();
            } else if (line.startsWith('data:')) {
                data += line.slice('data:'.length).trim();
            }
        }

        if (!data) {
            return;
        }

        const parsed = JSON.parse(data);

        switch (eventType) {
            case 'text_delta':
                this.pendingAssistantText += parsed.text;
                break;
            case 'navigate':
                this.navigateTo(parsed.url);
                break;
            case 'done':
                // parsed.messages is the full set of new messages generated
                // this turn (assistant tool-call message, tool-result
                // message(s), final assistant text message) — each keeps its
                // own role so the resent history stays valid next turn.
                this.messages = [...this.messages, ...parsed.messages];
                this.pendingAssistantText = '';
                break;
            case 'error':
                this.appendAssistantError(parsed.message);
                break;
        }
    }

    @action
    private appendAssistantError(message: string) {
        this.messages = [
            ...this.messages,
            { role: 'assistant', content: `⚠️ ${message}` },
        ];
        this.pendingAssistantText = '';
    }

    private navigateTo(url: string) {
        try {
            const parsedUrl = new URL(url);
            this.routingStore.updateRoute(
                Object.fromEntries(parsedUrl.searchParams.entries()),
                parsedUrl.pathname,
                /* clear */ true,
                /* replace */ false
            );
        } catch (e) {
            console.error(
                '[ChatStore] failed to navigate to url from AI response:',
                url,
                e
            );
        }
    }
}

export default ChatStore;
