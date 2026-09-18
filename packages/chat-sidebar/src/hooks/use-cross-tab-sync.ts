import { useEffect } from 'react';
import { AssistantRuntime } from '@assistant-ui/react';
import { messagesKey, THREADS_KEY } from '@/lib/threadStorage';

// A burst of writes lands per run (one append per message), so react to the
// last one rather than every one.
const DEBOUNCE_MS = 300;

// `storage` fires only in OTHER same-origin tabs, never the one that wrote it —
// exactly what's needed to pick up a chat continued elsewhere. Both tabs
// restore the same chat on load, so this is the common case, not a corner one.
export function useCrossTabSync(runtime: AssistantRuntime): void {
    useEffect(() => {
        let listTimer: ReturnType<typeof setTimeout> | undefined;
        let messagesTimer: ReturnType<typeof setTimeout> | undefined;

        const reloadList = () => {
            // Metadata only: running threads, composer state and streams are
            // left alone.
            runtime.threads.reload().catch(() => {
                /* the next write or reload picks it up */
            });
        };

        const reloadOpenThread = () => {
            // This remounts the thread, which would end a run and discard an
            // unsent draft — so only when there is neither.
            if (runtime.thread.getState().isRunning) return;
            if (runtime.thread.composer.getState().text.trim()) return;
            runtime.threads.reloadMainThread().catch(() => {
                /* the next switch or reload picks it up */
            });
        };

        function onStorage(e: StorageEvent) {
            if (e.key === THREADS_KEY) {
                clearTimeout(listTimer);
                listTimer = setTimeout(reloadList, DEBOUNCE_MS);
                return;
            }
            const remoteId = runtime.threads.mainItem.getState().remoteId;
            if (remoteId && e.key === messagesKey(remoteId)) {
                clearTimeout(messagesTimer);
                messagesTimer = setTimeout(reloadOpenThread, DEBOUNCE_MS);
            }
        }

        window.addEventListener('storage', onStorage);
        return () => {
            clearTimeout(listTimer);
            clearTimeout(messagesTimer);
            window.removeEventListener('storage', onStorage);
        };
    }, [runtime]);
}
