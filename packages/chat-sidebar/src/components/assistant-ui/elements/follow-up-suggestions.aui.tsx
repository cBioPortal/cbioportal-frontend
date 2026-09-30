'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getPendingFollowups,
    subscribeToPendingFollowups,
} from '@/lib/followups';
import { cn } from '@/lib/utils';
import {
    AuiIf,
    useAuiState,
    ThreadPrimitive,
    ThreadSuggestion,
} from '@assistant-ui/react';
import { SparklesIcon } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    FC,
} from 'react';

const FollowupSuggestionsRow: FC<{ onSelect: () => void }> = ({ onSelect }) => {
    const suggestions = useAuiState(s => s.thread.suggestions);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rtlRef = useRef<boolean | null>(null);
    const [fades, setFades] = useState({ left: false, right: false });

    const updateFades = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        // scrollLeft runs 0..-max in RTL; normalize to hidden width per physical edge.
        const fromStart = Math.abs(el.scrollLeft);
        // getComputedStyle forces a style recalc per scroll event; direction is stable, read it once.
        const rtl =
            rtlRef.current ??
            (rtlRef.current = getComputedStyle(el).direction === 'rtl');
        const [left, right] = rtl
            ? [maxScroll - fromStart, fromStart]
            : [fromStart, maxScroll - fromStart];
        setFades(prev => {
            const next = { left: left > 1, right: right > 1 };
            return prev.left === next.left && prev.right === next.right
                ? prev
                : next;
        });
    }, []);

    useEffect(() => {
        updateFades();
        const el = scrollRef.current;
        if (!el?.firstElementChild) return undefined;
        const observer = new ResizeObserver(updateFades);
        observer.observe(el);
        observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [updateFades]);

    const maskImage = `linear-gradient(to right, ${
        fades.left ? 'transparent, black 2rem' : 'black'
    }, ${fades.right ? 'black calc(100% - 2rem), transparent' : 'black'})`;

    return (
        <div
            ref={scrollRef}
            onScroll={updateFades}
            // overflow-x clips both axes; py-1/-my-1 gives focus rings vertical room without changing outer height.
            className="aui-thread-followup-suggestions -my-1 w-full overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage, WebkitMaskImage: maskImage }}
        >
            <div className="flex min-h-8 w-max items-center gap-2 px-0.5">
                {suggestions.map((suggestion, idx) => (
                    <FollowupSuggestionItem
                        key={idx}
                        suggestion={suggestion}
                        index={idx}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
};

// Behaves like the welcome starters: replaces the composer text with the
// prompt, for the user to edit or send, and is highlighted while the composer
// holds its prompt unedited.
const FollowupSuggestionItem: FC<{
    suggestion: ThreadSuggestion;
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
                        'aui-thread-followup-suggestion fade-in slide-in-from-bottom-1 animate-in fill-mode-both h-auto cursor-pointer gap-2 rounded-full px-3.5 py-1.5 font-normal whitespace-nowrap duration-200',
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
            <span className="text-foreground text-sm">
                {suggestion.title ?? suggestion.prompt}
            </span>
        </ThreadPrimitive.Suggestion>
    );
};

// Widths vary so the placeholders read as pills of different lengths.
const SKELETON_WIDTHS = ['w-40', 'w-48', 'w-36'];
const LOADING_MASK =
    'linear-gradient(to right, black calc(100% - 2rem), transparent)';

// A heading like the welcome starters' over the same row as the pills,
// clipped rather than scrollable. h-8.5 matches a pill's height.
const FollowupSuggestionsLoading: FC = () => (
    <div
        role="status"
        className="aui-thread-followup-suggestions-loading flex w-full flex-col items-start gap-1.5"
    >
        <p className="text-muted-foreground flex items-center gap-1.5 px-2 pt-0.5 text-xs font-medium">
            <SparklesIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="shimmer motion-reduce:animate-none">
                Thinking…
            </span>
        </p>
        <div
            className="w-full overflow-hidden"
            style={{
                maskImage: LOADING_MASK,
                WebkitMaskImage: LOADING_MASK,
            }}
        >
            <div className="flex min-h-8 w-max items-center gap-2 px-0.5">
                {SKELETON_WIDTHS.map(width => (
                    <Skeleton
                        key={width}
                        className={cn(
                            'h-8.5 rounded-full motion-reduce:animate-none',
                            width
                        )}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Rendered inside the composer, directly above its shell. `onSelect` runs
// before a pill sets the composer text.
export const ThreadFollowupSuggestions: FC<{ onSelect: () => void }> = ({
    onSelect,
}) => {
    const pending = useSyncExternalStore(
        subscribeToPendingFollowups,
        getPendingFollowups,
        getPendingFollowups
    );
    const lastMessageId = useAuiState(s => s.thread.messages.at(-1)?.id);
    const loading = lastMessageId != null && pending.has(lastMessageId);

    return (
        <AuiIf condition={s => !s.thread.isEmpty && !s.thread.isRunning}>
            {loading ? (
                <div className="mb-3">
                    <FollowupSuggestionsLoading />
                </div>
            ) : (
                <AuiIf condition={s => s.thread.suggestions.length > 0}>
                    <div className="mb-3">
                        <FollowupSuggestionsRow onSelect={onSelect} />
                    </div>
                </AuiIf>
            )}
        </AuiIf>
    );
};
