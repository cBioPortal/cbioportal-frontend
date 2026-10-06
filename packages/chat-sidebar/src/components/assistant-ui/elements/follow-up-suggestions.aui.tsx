'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Followup,
    getFollowupsState,
    setFollowupsTarget,
    subscribeToFollowups,
} from '@/lib/followups';
import { latestExchange } from '@/lib/followupsInput';
import { cn } from '@/lib/utils';
import {
    AuiIf,
    useAui,
    useAuiState,
    ThreadPrimitive,
} from '@assistant-ui/react';
import { SparklesIcon } from 'lucide-react';
import { useEffect, useSyncExternalStore, FC } from 'react';

// Widths vary so the placeholders read as pills of different lengths.
const SKELETON_WIDTHS = ['w-40', 'w-48', 'w-36'];

// While loading, the pills received so far are followed by placeholders for
// the rest, in the same list so an arriving pill takes a placeholder's place
// without the others moving or remounting.
const FollowupSuggestionsList: FC<{
    suggestions: readonly Followup[];
    loading: boolean;
    onSelect: () => void;
}> = ({ suggestions, loading, onSelect }) => (
    <div className="aui-thread-followup-suggestions flex w-full flex-col items-start gap-2 px-0.5">
        {suggestions.map((suggestion, idx) => (
            <FollowupSuggestionItem
                key={idx}
                suggestion={suggestion}
                index={idx}
                onSelect={onSelect}
            />
        ))}
        {loading &&
            SKELETON_WIDTHS.slice(suggestions.length).map(width => (
                <Skeleton
                    key={width}
                    className={cn(
                        'h-8.5 rounded-full motion-reduce:animate-none',
                        width
                    )}
                />
            ))}
    </div>
);

// Behaves like the welcome starters: replaces the composer text with the
// prompt, for the user to edit or send, and is highlighted while the composer
// holds its prompt unedited. A title too long for the panel wraps; the 17px
// radius is a full pill at one line and stays moderate past it.
const FollowupSuggestionItem: FC<{
    suggestion: Followup;
    index: number;
    onSelect: () => void;
}> = ({ suggestion, index, onSelect }) => {
    const selected = useAuiState(
        s => s.composer.text !== '' && s.composer.text === suggestion.prompt
    );

    return (
        <ThreadPrimitive.Suggestion
            prompt={suggestion.prompt}
            onClick={onSelect}
            aria-pressed={selected}
            render={
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        'aui-thread-followup-suggestion fade-in slide-in-from-bottom-1 animate-in fill-mode-both h-auto max-w-full cursor-pointer gap-2 rounded-[17px] px-3.5 py-1.5 text-left font-normal whitespace-normal duration-200',
                        selected
                            ? 'border-primary/60 bg-accent hover:bg-accent dark:hover:bg-accent'
                            : 'border-border hover:border-muted-foreground/40 bg-(--composer-bg) dark:border-muted-foreground/20'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                />
            }
        >
            <SparklesIcon
                className={cn(
                    'size-3.5 shrink-0',
                    selected ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden
            />
            <span className="text-foreground text-sm">{suggestion.title}</span>
        </ThreadPrimitive.Suggestion>
    );
};

// The "Thinking…" heading, like the welcome starters', stays over the list
// until the last suggestion arrives.
const FollowupSuggestions: FC<{
    suggestions: readonly Followup[];
    loading: boolean;
    onSelect: () => void;
}> = ({ suggestions, loading, onSelect }) => (
    <div
        role={loading ? 'status' : undefined}
        className="aui-thread-followup-suggestions-root flex w-full flex-col items-start gap-1.5"
    >
        {loading && (
            <p className="text-muted-foreground flex items-center gap-1.5 px-2 pt-0.5 text-xs font-medium">
                <SparklesIcon className="size-3.5 shrink-0" aria-hidden />
                <span className="shimmer motion-reduce:animate-none">
                    Thinking…
                </span>
            </p>
        )}
        <FollowupSuggestionsList
            suggestions={suggestions}
            loading={loading}
            onSelect={onSelect}
        />
    </div>
);

// Rendered inside the composer, directly above its shell. `onSelect` runs
// before a pill sets the composer text.
export const ThreadFollowupSuggestions: FC<{ onSelect: () => void }> = ({
    onSelect,
}) => {
    const aui = useAui();
    const isRunning = useAuiState(s => s.thread.isRunning);
    const lastMessageId = useAuiState(s => s.thread.messages.at(-1)?.id);
    const lastStatus = useAuiState(s => s.thread.messages.at(-1)?.status?.type);

    // Tells the store which exchange the pills are for. Keyed on the last
    // message's id and status rather than the messages themselves, which
    // change on every streamed token.
    useEffect(() => {
        setFollowupsTarget(
            isRunning
                ? null
                : latestExchange(aui.thread.getState().messages) ?? null
        );
    }, [aui, isRunning, lastMessageId, lastStatus]);
    useEffect(() => () => setFollowupsTarget(null), []);

    const followups = useSyncExternalStore(
        subscribeToFollowups,
        getFollowupsState,
        getFollowupsState
    );
    if (followups.status !== 'loading' && followups.status !== 'ready') {
        return null;
    }

    return (
        <AuiIf condition={s => !s.thread.isEmpty && !s.thread.isRunning}>
            <div className="mb-3">
                <FollowupSuggestions
                    suggestions={followups.suggestions}
                    loading={followups.status === 'loading'}
                    onSelect={onSelect}
                />
            </div>
        </AuiIf>
    );
};
