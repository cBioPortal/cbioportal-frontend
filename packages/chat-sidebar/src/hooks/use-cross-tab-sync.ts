import { useEffect } from 'react';
import { AssistantRuntime } from '@assistant-ui/react';
import { subscribeToThreadsChanged } from '@/lib/threadSync';

// A reply and its title land within moments of each other, so react to the
// last of a burst rather than to each.
const DEBOUNCE_MS = 300;

// Keeps the chat list current with the sidebar's other tabs in this browser.
// Only the list: a chat open here is not refreshed when another tab adds to it.
export function useCrossTabSync(runtime: AssistantRuntime): void {
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        // Metadata only: running threads, composer state and streams are left
        // alone.
        const reloadList = () => {
            runtime.threads.reload().catch(() => {
                /* the next change or reload picks it up */
            });
        };
        const unsubscribe = subscribeToThreadsChanged(() => {
            clearTimeout(timer);
            timer = setTimeout(reloadList, DEBOUNCE_MS);
        });
        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, [runtime]);
}
