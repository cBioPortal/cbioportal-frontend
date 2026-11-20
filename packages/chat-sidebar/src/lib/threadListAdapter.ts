import { RemoteThreadListAdapter, ThreadMessage } from '@assistant-ui/react';
import { createAssistantStream } from 'assistant-stream';
import { threadPath, threadsJson, threadsSend } from './chatApi';
import { getSelectedModel } from './chatSession';
import { useThreadHistoryAdapters } from './threadHistoryAdapter';
import { notifyThreadsChanged } from './threadSync';

type ThreadListResponse = Awaited<ReturnType<RemoteThreadListAdapter['list']>>;
type ThreadMetadata = Awaited<ReturnType<RemoteThreadListAdapter['fetch']>>;

// Titles are generated from the opening question alone, which is all the model
// needs for a few words and keeps the call cheap. Screenshots ride along as
// image parts and would be megabytes of base64, so only text is ever sent.
const MAX_TITLE_PROMPT_CHARS = 2000;

function firstUserText(messages: readonly ThreadMessage[]): string | null {
    const message = messages.find(m => m.role === 'user');
    if (!message) return null;
    const text = message.content
        .filter(part => part.type === 'text')
        .map(part => (part as { text: string }).text)
        .join('\n')
        .trim();
    return text ? text.slice(0, MAX_TITLE_PROMPT_CHARS) : null;
}

async function patchThread(
    remoteId: string,
    changes: { title?: string; status?: 'regular' | 'archived' }
): Promise<void> {
    await threadsSend(threadPath(remoteId), { method: 'PATCH', body: changes });
    notifyThreadsChanged();
}

// The chat list lives on the server, scoped to the signed-in user. A thread's
// remote id is the client's own id for it, so the id useChat sends with each
// message is the same before and after a reload.
//
// One instance for the app's lifetime: a new adapter reference tears the list
// down and reloads it. The runtime calls `unstable_useAdapters` once per
// mounted thread, background ones included, so each gets the history adapter.
export const threadListAdapter: RemoteThreadListAdapter = {
    list() {
        return threadsJson<ThreadListResponse>('');
    },

    // Races the chat's first message, which creates the thread too if it gets
    // there first; the server makes both idempotent.
    async initialize(threadId) {
        await threadsSend('', { method: 'POST', body: { id: threadId } });
        notifyThreadsChanged();
        return { remoteId: threadId, externalId: undefined };
    },

    rename(remoteId, title) {
        return patchThread(remoteId, { title });
    },

    archive(remoteId) {
        return patchThread(remoteId, { status: 'archived' });
    },

    unarchive(remoteId) {
        return patchThread(remoteId, { status: 'regular' });
    },

    async delete(remoteId) {
        await threadsSend(threadPath(remoteId), { method: 'DELETE' });
        notifyThreadsChanged();
    },

    // Rejects for a chat that is gone, which the runtime answers by opening a
    // new one instead.
    fetch(threadId) {
        return threadsJson<ThreadMetadata>(threadPath(threadId));
    },

    // The server generates the title and saves it, falling back to the start
    // of the question if the model is unreachable. If the request itself
    // fails, the chat stays untitled until the next load.
    async generateTitle(remoteId, messages) {
        const text = firstUserText(messages);
        if (!text) return createAssistantStream(() => {});
        try {
            const { title } = await threadsJson<{ title: string }>(
                threadPath(remoteId, 'title'),
                { method: 'POST', body: { text, model: getSelectedModel() } }
            );
            notifyThreadsChanged();
            return createAssistantStream(controller => {
                controller.appendText(title);
            });
        } catch (err) {
            console.warn('[chat-sidebar] title generation failed', err);
            return createAssistantStream(() => {});
        }
    },

    unstable_useAdapters: useThreadHistoryAdapters,
};
