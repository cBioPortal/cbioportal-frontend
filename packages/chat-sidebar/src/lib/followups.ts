import { SuggestionAdapter, ThreadSuggestion } from '@assistant-ui/react';

// Follow-up suggestions shown above the composer once an assistant reply
// finishes. The runtime calls `generate` after each completed run and clears
// the result when the next one starts.

// Placeholder set until they are generated from the conversation.
const HARDCODED_FOLLOWUPS: readonly ThreadSuggestion[] = [
    {
        title: 'Show survival differences',
        prompt:
            'Compare overall survival between the altered and unaltered groups, and tell me whether the difference is statistically significant.',
    },
    {
        title: 'Most frequently co-altered genes',
        prompt:
            'Which genes are most frequently co-altered with the ones we just discussed, and are any of those co-occurrences significant?',
    },
    {
        title: 'Summarize in a table',
        prompt:
            'Summarize the key findings from your last answer in a compact table.',
    },
];

// Stands in for the generation request's latency.
const SIMULATED_DELAY_MS = 2000;

// The runtime exposes the suggestions but not whether they are still being
// generated, so that is tracked here: the ids of assistant messages whose
// follow-ups are in flight. Keyed by message because every visited thread
// keeps its runtime, and a background one may be generating too.
let pending: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();

export function subscribeToPendingFollowups(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getPendingFollowups(): ReadonlySet<string> {
    return pending;
}

function setPending(messageId: string, isPending: boolean): void {
    const next = new Set(pending);
    if (isPending) next.add(messageId);
    else next.delete(messageId);
    pending = next;
    for (const listener of listeners) listener();
}

function delay(ms: number, signal: AbortSignal | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                reject(signal.reason);
            },
            { once: true }
        );
    });
}

// Stateless apart from the pending set — one instance shared by every
// thread's runtime. Aborted when the user sends before it resolves.
export const followupSuggestionAdapter: SuggestionAdapter = {
    generate: async ({ messages, signal }) => {
        const messageId = messages.at(-1)?.id;
        if (!messageId) return [];
        setPending(messageId, true);
        try {
            await delay(SIMULATED_DELAY_MS, signal);
            return HARDCODED_FOLLOWUPS;
        } finally {
            setPending(messageId, false);
        }
    },
};
