// Tells the sidebar's other tabs in this browser that the chat list changed —
// a chat created, renamed, archived, deleted, titled, or given a new reply —
// so they refetch it. A BroadcastChannel never delivers to the tab that
// posted, which is the one that already has the change.
const CHANNEL_NAME = 'chat-sidebar';
const THREADS_CHANGED = 'threads-changed';

const channel =
    typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel(CHANNEL_NAME);

export function notifyThreadsChanged(): void {
    channel?.postMessage(THREADS_CHANGED);
}

export function subscribeToThreadsChanged(listener: () => void): () => void {
    if (!channel) return () => {};
    const onMessage = (e: MessageEvent) => {
        if (e.data === THREADS_CHANGED) listener();
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
}
