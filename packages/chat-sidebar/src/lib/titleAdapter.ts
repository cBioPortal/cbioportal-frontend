import {
    createSimpleTitleAdapter,
    TitleGenerationAdapter,
} from '@assistant-ui/core/react';
import { ThreadMessage } from '@assistant-ui/react';
import { getSelectedModel } from './chatSession';

// Titles are generated from the opening question alone, which is all the model
// needs for a few words and keeps the call cheap. Screenshots ride along as
// image parts and would be megabytes of base64, so only text is ever sent.
const MAX_PROMPT_CHARS = 2000;

// Falls back to the first message truncated, so a chat is never left untitled
// when the endpoint is unreachable.
const fallback = createSimpleTitleAdapter();

function firstUserText(messages: readonly ThreadMessage[]): string | null {
    const message = messages.find(m => m.role === 'user');
    if (!message) return null;
    const text = message.content
        .filter(part => part.type === 'text')
        .map(part => (part as { text: string }).text)
        .join('\n')
        .trim();
    return text ? text.slice(0, MAX_PROMPT_CHARS) : null;
}

export const titleAdapter: TitleGenerationAdapter = {
    async generateTitle(messages) {
        const text = firstUserText(messages);
        if (!text) return fallback.generateTitle(messages);
        try {
            const response = await fetch('/api/chat/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, model: getSelectedModel() }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const { title } = await response.json();
            if (typeof title === 'string' && title.trim()) return title.trim();
        } catch (err) {
            console.warn('[chat-sidebar] title generation failed', err);
        }
        return fallback.generateTitle(messages);
    },
};
