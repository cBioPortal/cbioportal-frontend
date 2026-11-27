import { useEffect, useMemo, useRef, useState } from 'react';
import {
    GenericThreadHistoryAdapter,
    MessageFormatAdapter,
    MessageStorageEntry,
    ThreadHistoryAdapter,
    useAui,
} from '@assistant-ui/react';
import { deleteStoredMessage, threadPath, threadsJson } from './chatApi';

// Per-thread message history. The server saves every message itself — the
// prompt when it arrives, the reply when it ends — so this side only reads it
// back, and deletes a prompt the runtime takes back. `useAISDKRuntime`
// requires `withFormat` and throws without it, because it handles AI SDK
// UIMessages through a format adapter rather than assistant-ui's own message
// shape; the server stores rows in that same format.

type Aui = ReturnType<typeof useAui>;
type ThreadListItem = Aui['threadListItem'];
type StoredRow = MessageStorageEntry<Record<string, unknown>>;

class ServerHistoryAdapter implements ThreadHistoryAdapter {
    constructor(private getAui: () => Aui) {}

    // Only the withFormat path is wired up here; a caller reaching these would
    // be handling the wrong message shape, so fail loudly rather than
    // silently showing an empty chat.
    async load(): Promise<never> {
        throw new Error(
            'chat-sidebar history adapter is AI SDK format only — use withFormat().'
        );
    }

    async append(): Promise<never> {
        throw new Error(
            'chat-sidebar history adapter is AI SDK format only — use withFormat().'
        );
    }

    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
        formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>
    ): GenericThreadHistoryAdapter<TMessage> {
        const getAui = this.getAui;

        // Pinned at the start of a run so a delete still reaches the right
        // thread if the user switches away mid-stream.
        let pinned: ThreadListItem | undefined;
        const resolveItem = (): ThreadListItem =>
            pinned ?? getAui().threadListItem;

        return {
            pin() {
                pinned = getAui().threadListItem;
            },

            // In creation order, which is what makes the runtime open the
            // newest branch: with no explicit head, it shows the one ending
            // at the last message.
            async load() {
                const remoteId = resolveItem().getState().remoteId;
                if (!remoteId) return { messages: [] };
                const { messages } = await threadsJson<{
                    messages: StoredRow[];
                }>(threadPath(remoteId, 'messages'));
                return {
                    messages: messages
                        .filter(row => row.format === formatAdapter.format)
                        .map(row =>
                            formatAdapter.decode(
                                row as MessageStorageEntry<TStorageFormat>
                            )
                        ),
                };
            },

            // Already saved by the server as part of the request or the reply.
            async append() {},

            // A run stopped before any reply puts its prompt back in the
            // composer. The chat endpoint removes it from the history
            // itself; this covers the runtime asking as well.
            async delete(items) {
                const remoteId = resolveItem().getState().remoteId;
                if (!remoteId) return;
                await Promise.all(
                    items.map(item =>
                        deleteStoredMessage(
                            remoteId,
                            formatAdapter.getId(item.message)
                        )
                    )
                );
            },
        };
    }
}

// The adapter resolves the live aui lazily, so it is created once and kept
// across renders; the returned object has to be memoized too, because the
// host republishes its adapters on every identity change.
export function useThreadHistoryAdapters() {
    const aui = useAui();
    const auiRef = useRef(aui);
    useEffect(() => {
        auiRef.current = aui;
    });
    const [history] = useState(
        () => new ServerHistoryAdapter(() => auiRef.current)
    );
    return useMemo(() => ({ history }), [history]);
}
