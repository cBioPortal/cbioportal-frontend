import { useEffect, useMemo, useRef, useState } from 'react';
import {
    GenericThreadHistoryAdapter,
    MessageFormatAdapter,
    MessageFormatItem,
    MessageStorageEntry,
    ThreadHistoryAdapter,
    useAui,
} from '@assistant-ui/react';
import { messagesKey, storage } from './threadStorage';

// Per-thread message persistence. The thread list adapter ships one of these,
// but only with `load`/`append` — `useAISDKRuntime` requires `withFormat` and
// throws without it, because it persists AI SDK UIMessages through a format
// adapter rather than assistant-ui's own message shape. Modelled on
// AssistantCloudThreadHistoryAdapter, which is the reference implementation.

type Aui = ReturnType<typeof useAui>;
type ThreadListItem = Aui['threadListItem'];
type StoredRow = MessageStorageEntry<Record<string, unknown>>;

// Appends land one per message as a run settles, each a read-modify-write of
// the same key; without a queue two of them can read the same snapshot and the
// second write drops the first message.
class KeyedWriteQueue {
    private tails = new Map<string, Promise<void>>();

    run(key: string, write: () => Promise<void>): Promise<void> {
        const previous = this.tails.get(key) ?? Promise.resolve();
        const result = previous.then(write);
        const tail = result.then(
            () => undefined,
            () => undefined
        );
        this.tails.set(key, tail);
        tail.then(() => {
            if (this.tails.get(key) === tail) this.tails.delete(key);
        });
        return result;
    }
}

function parseRows(raw: string | null): StoredRow[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

class LocalStorageHistoryAdapter implements ThreadHistoryAdapter {
    private queue = new KeyedWriteQueue();

    constructor(private getAui: () => Aui) {}

    // Only the withFormat path is wired up here; a caller reaching these would
    // be persisting the wrong message shape, so fail loudly rather than
    // silently dropping history.
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
        const queue = this.queue;
        const getAui = this.getAui;

        // Pinned at the start of a run so its writes still land on the right
        // thread if the user switches away mid-stream.
        let pinned: ThreadListItem | undefined;
        const resolveItem = (): ThreadListItem =>
            pinned ?? getAui().threadListItem;

        const toRow = (item: MessageFormatItem<TMessage>): StoredRow => ({
            id: formatAdapter.getId(item.message),
            parent_id: item.parentId,
            format: formatAdapter.format,
            content: formatAdapter.encode(item),
        });

        return {
            pin() {
                pinned = getAui().threadListItem;
            },

            async load() {
                const remoteId = resolveItem().getState().remoteId;
                if (!remoteId) return { messages: [] };
                const rows = parseRows(
                    await storage.getItem(messagesKey(remoteId))
                );
                return {
                    messages: rows
                        .filter(row => row.format === formatAdapter.format)
                        .map(row =>
                            formatAdapter.decode(
                                row as MessageStorageEntry<TStorageFormat>
                            )
                        ),
                };
            },

            async append(item) {
                const { remoteId } = await resolveItem().initialize();
                const row = toRow(item);
                const key = messagesKey(remoteId);
                await queue.run(key, async () => {
                    const rows = parseRows(await storage.getItem(key));
                    // Upsert, not push: an id can be rewritten mid-run, and a
                    // write that failed on quota is retried on the next run.
                    const index = rows.findIndex(r => r.id === row.id);
                    if (index >= 0) rows[index] = row;
                    else rows.push(row);
                    await storage.setItem(key, JSON.stringify(rows));
                });
            },

            async update(item, localMessageId) {
                const remoteId = resolveItem().getState().remoteId;
                if (!remoteId) return;
                const row = toRow(item);
                const key = messagesKey(remoteId);
                await queue.run(key, async () => {
                    const rows = parseRows(await storage.getItem(key));
                    const index = rows.findIndex(
                        r => r.id === localMessageId || r.id === row.id
                    );
                    if (index >= 0) rows[index] = row;
                    else rows.push(row);
                    await storage.setItem(key, JSON.stringify(rows));
                });
            },

            async delete(items) {
                const remoteId = resolveItem().getState().remoteId;
                if (!remoteId) return;
                const ids = new Set(
                    items.map(item => formatAdapter.getId(item.message))
                );
                const key = messagesKey(remoteId);
                // Read inside the queue too: a stopped run deletes its prompt
                // while that run's appends may still be landing.
                await queue.run(key, async () => {
                    const rows = parseRows(await storage.getItem(key));
                    await storage.setItem(
                        key,
                        JSON.stringify(rows.filter(row => !ids.has(row.id)))
                    );
                });
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
        () => new LocalStorageHistoryAdapter(() => auiRef.current)
    );
    return useMemo(() => ({ history }), [history]);
}
