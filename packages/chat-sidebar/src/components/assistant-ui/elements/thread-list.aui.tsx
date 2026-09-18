'use client';

import { FC, useSyncExternalStore } from 'react';
import {
    ThreadListItemPrimitive,
    ThreadListPrimitive,
    useAuiState,
} from '@assistant-ui/react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
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

const ThreadListItem: FC = () => {
    const isActive = useAuiState(
        s => s.threads.mainThreadId === s.threadListItem.id
    );
    return (
        <ThreadListItemPrimitive.Root
            data-slot="aui_thread-list-item"
            className={cn(
                'group flex items-center gap-1 rounded-md pl-2 pr-1 text-sm transition-colors hover:bg-muted',
                isActive && 'bg-muted'
            )}
        >
            <ThreadListItemPrimitive.Trigger
                data-slot="aui_thread-list-item-trigger"
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

// Stable so the primitive's memoized item list isn't rebuilt on every render.
const renderItem = () => <ThreadListItem />;

export const ThreadList: FC = () => {
    return (
        <ThreadListPrimitive.Root
            data-slot="aui_thread-list"
            className="flex flex-col"
        >
            <ThreadListPrimitive.New
                data-slot="aui_thread-list-new"
                className="mb-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium outline-none hover:bg-muted focus-visible:bg-muted"
            >
                <PlusIcon className="size-3.5" />
                New chat
            </ThreadListPrimitive.New>

            <div className="-mr-1 max-h-72 overflow-y-auto pr-1">
                <ThreadListPrimitive.Items>
                    {renderItem}
                </ThreadListPrimitive.Items>
            </div>

            <StorageNotice />
        </ThreadListPrimitive.Root>
    );
};
