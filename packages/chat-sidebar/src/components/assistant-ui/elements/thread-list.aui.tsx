'use client';

import { FC, useCallback, useSyncExternalStore } from 'react';
import {
    ThreadListItemPrimitive,
    ThreadListPrimitive,
    useAuiState,
} from '@assistant-ui/react';
import { Trash2Icon } from 'lucide-react';
import { cn } from 'cn';
import {
    getStorageNotice,
    subscribeToStorageNotice,
} from '@/lib/threadStorage';

const STORAGE_NOTICE_TEXT = {
    pruned: 'Storage was full — the oldest chat was removed.',
    full: 'Storage is full. Delete a chat to keep saving new messages.',
};

const StorageNotice: FC = () => {
    const notice = useSyncExternalStore(
        subscribeToStorageNotice,
        getStorageNotice,
        getStorageNotice
    );
    if (!notice) return null;
    return (
        <p
            data-slot="aui_thread-list-notice"
            className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground"
        >
            {STORAGE_NOTICE_TEXT[notice]}
        </p>
    );
};

const ThreadListItem: FC<{ onNavigate?: (() => void) | undefined }> = ({
    onNavigate,
}) => {
    const isActive = useAuiState(
        s => s.threads.mainThreadId === s.threadListItem.id
    );
    return (
        <ThreadListItemPrimitive.Root
            data-slot="aui_thread-list-item"
            className={cn(
                'group flex items-center gap-8 rounded-md px-2  text-sm transition-colors hover:bg-muted',
                isActive && 'bg-muted'
            )}
        >
            <ThreadListItemPrimitive.Trigger
                data-slot="aui_thread-list-item-trigger"
                onClick={onNavigate}
                className="min-w-0 flex-1 truncate py-1.5 text-left outline-none focus-visible:underline"
            >
                <ThreadListItemPrimitive.Title fallback="New chat" />
            </ThreadListItemPrimitive.Trigger>

            <ThreadListItemPrimitive.Delete
                data-slot="aui_thread-list-item-delete"
                aria-label="Delete chat"
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            >
                <Trash2Icon className="size-3.5" />
            </ThreadListItemPrimitive.Delete>
        </ThreadListItemPrimitive.Root>
    );
};

export const ThreadList: FC<{ onNavigate?: (() => void) | undefined }> = ({
    onNavigate,
}) => {
    // Stable per onNavigate, so the primitive's memoized item list isn't
    // rebuilt on every render.
    const renderItem = useCallback(
        () => <ThreadListItem onNavigate={onNavigate} />,
        [onNavigate]
    );

    // Only initialized chats are listed, so a session that has not sent
    // anything yet has nothing to show.
    const isEmpty = useAuiState(s => s.threads.threadIds.length === 0);

    return (
        <ThreadListPrimitive.Root
            data-slot="aui_thread-list"
            className="flex flex-col"
        >
            <h2
                data-slot="aui_thread-list-title"
                className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
                Recent chats
            </h2>

            {isEmpty && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No saved chats yet.
                </p>
            )}

            <div className="-mr-1 max-h-72 overflow-y-auto pr-1">
                <ThreadListPrimitive.Items>
                    {renderItem}
                </ThreadListPrimitive.Items>
            </div>

            <StorageNotice />
        </ThreadListPrimitive.Root>
    );
};
