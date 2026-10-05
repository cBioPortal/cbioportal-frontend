'use client';

import {
    ComposerAttachments,
    UserMessageAttachments,
} from '@/components/assistant-ui/elements/attachment.aui';
import { ScreenshotButton } from '@/components/assistant-ui/elements/screenshot-button';
import { File } from '@/components/assistant-ui/elements/file';
import { ThreadFollowupSuggestions } from '@/components/assistant-ui/elements/follow-up-suggestions.aui';
import { Image } from '@/components/assistant-ui/elements/image';
import { MarkdownText } from '@/components/assistant-ui/elements/markdown-text';
import { Reasoning } from '@/components/assistant-ui/elements/reasoning.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import {
    ToolGroupContent,
    ToolGroupRoot,
    ToolGroupTrigger,
} from '@/components/assistant-ui/elements/tool-group.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPageType, PageType, subscribe } from '@/lib/page-events';
import { getStartersState, subscribeToStarters } from '@/lib/starters';
import { cn } from '@/lib/utils';
import {
    ActionBarMorePrimitive,
    ActionBarPrimitive,
    AuiIf,
    AssistantState,
    BranchPickerPrimitive,
    ComposerPrimitive,
    ErrorPrimitive,
    GroupByContext,
    groupPartByType,
    MessagePrimitive,
    PartState,
    SuggestionPrimitive,
    ThreadPrimitive,
    FileMessagePartComponent,
    ImageMessagePartComponent,
    ToolCallMessagePartComponent,
    useAuiState,
} from '@assistant-ui/react';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    BrainIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    DownloadIcon,
    LucideIcon,
    MessageCircleIcon,
    MicIcon,
    MoreHorizontalIcon,
    PencilIcon,
    RefreshCwIcon,
    SparklesIcon,
    SquareIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import {
    createContext,
    useContext,
    ComponentType,
    FC,
    PropsWithChildren,
    RefObject,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

export type ThreadGroupPart = MessagePrimitive.GroupedParts.GroupPart;

/**
 * Optional component overrides for the thread. `AssistantMessage` and
 * `Welcome` replace whole sections; `ToolFallback` overrides how the
 * assistant message renders tool calls. Tool UIs registered by name (toolkit
 * `render`, `useAssistantDataUI`) take precedence over `ToolFallback`.
 * `hiddenTools` names the tools `ToolFallback` renders nothing for, so the
 * work block's tool count leaves them out.
 */
export type ThreadComponents = {
    AssistantMessage?: ComponentType | undefined;
    Welcome?: ComponentType | undefined;
    ToolFallback?: ToolCallMessagePartComponent | undefined;
    hiddenTools?: ReadonlySet<string> | undefined;
};

export type ThreadProps = {
    components?: ThreadComponents | undefined;
    autoFocus?: boolean | undefined;
};

const EMPTY_COMPONENTS: ThreadComponents = {};

const ThreadComponentsContext = createContext<ThreadComponents>(
    EMPTY_COMPONENTS
);

// Startup exposes a loading placeholder thread; treat it as a new chat so
// the composer mounts centered. Loads after startup keep the docked layout.
const isNewChatView = (s: AssistantState) =>
    s.thread.messages.length === 0 &&
    (!s.thread.isLoading || s.threads.isLoading);

// A switched thread that is still fetching its history: skeleton, not welcome.
const isHistoryLoadingView = (s: AssistantState) =>
    s.thread.messages.length === 0 &&
    s.thread.isLoading &&
    !s.thread.isDisabled &&
    !s.threads.isLoading;

const ThreadHistorySkeleton: FC = () => (
    <div
        data-slot="aui_thread-history-skeleton"
        role="status"
        className="animate-in fade-in fill-mode-both flex flex-col gap-y-6 [animation-delay:150ms] [animation-duration:200ms]"
    >
        <span className="sr-only">Loading conversation</span>
        <Skeleton className="ml-auto h-9 w-2/5 rounded-xl motion-reduce:animate-none" />
        <div className="flex flex-col gap-y-2">
            <Skeleton className="h-4 w-11/12 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
        </div>
        <Skeleton className="ml-auto h-9 w-1/3 rounded-xl motion-reduce:animate-none" />
        <div className="flex flex-col gap-y-2">
            <Skeleton className="h-4 w-10/12 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
        </div>
    </div>
);

export const Thread: FC<ThreadProps> = ({
    components = EMPTY_COMPONENTS,
    autoFocus = true,
}) => {
    const isEmpty = useAuiState(isNewChatView);

    return (
        <ThreadComponentsContext.Provider value={components}>
            <ThreadRoot isEmpty={isEmpty} autoFocus={autoFocus} />
        </ThreadComponentsContext.Provider>
    );
};

const ThreadRoot: FC<{ isEmpty: boolean; autoFocus: boolean }> = ({
    isEmpty,
    autoFocus,
}) => {
    const { Welcome = ThreadWelcome } = useContext(ThreadComponentsContext);

    return (
        <ThreadPrimitive.Root
            className="aui-root aui-thread-root bg-background @container flex h-full flex-col"
            style={{
                ['--composer-bg' as string]: 'var(--color-card)',
                ['--composer-radius' as string]: 'calc(var(--radius) * 2)',
                ['--composer-padding' as string]: '8px',
            }}
        >
            <ThreadPrimitive.Viewport
                autoScroll
                data-slot="aui_thread-viewport"
                className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth"
            >
                <div
                    className={cn(
                        'flex w-full flex-1 flex-col px-4 pt-4',
                        isEmpty && 'justify-center'
                    )}
                >
                    <AuiIf condition={isNewChatView}>
                        <Welcome />
                    </AuiIf>
                    <AuiIf condition={isHistoryLoadingView}>
                        <ThreadHistorySkeleton />
                    </AuiIf>

                    <div
                        data-slot="aui_message-group"
                        className="mb-14 flex flex-col gap-y-6 empty:hidden"
                    >
                        <ThreadPrimitive.Messages>
                            {() => <ThreadMessage />}
                        </ThreadPrimitive.Messages>
                    </div>

                    {/* Docked, messages scroll behind the footer; the gradient
                        on its top edge fades them out rather than cutting
                        them off. A mask such as shadcn's scroll-fade can't do
                        this: the footer sticks inside the viewport, so
                        masking the viewport's edge would fade the footer. */}
                    <ThreadPrimitive.ViewportFooter
                        className={cn(
                            'aui-thread-viewport-footer bg-background flex flex-col gap-4 overflow-visible pb-4 md:pb-6',
                            !isEmpty &&
                                'before:from-background sticky bottom-0 mt-auto before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-16 before:bg-linear-to-t before:from-25% before:to-transparent'
                        )}
                    >
                        <ThreadScrollToBottom />
                        <Composer autoFocus={autoFocus} />
                    </ThreadPrimitive.ViewportFooter>
                </div>
            </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
    );
};

const ThreadMessage: FC = () => {
    const {
        AssistantMessage: AssistantMessageComponent = AssistantMessage,
    } = useContext(ThreadComponentsContext);
    const role = useAuiState(s => s.message.role);
    const isEditing = useAuiState(s => s.message.composer.isEditing);

    if (isEditing) return <EditComposer />;
    if (role === 'user') return <UserMessage />;
    return <AssistantMessageComponent />;
};

const ThreadScrollToBottom: FC = () => {
    return (
        <ThreadPrimitive.ScrollToBottom
            render={
                <TooltipIconButton
                    tooltip="Scroll to bottom"
                    variant="outline"
                    className="aui-thread-scroll-to-bottom dark:border-border dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible"
                />
            }
        >
            <ArrowDownIcon />
        </ThreadPrimitive.ScrollToBottom>
    );
};

const WELCOME_TITLES: Record<PageType, string> = {
    study: 'What would you like to know about this study?',
    results: "Let's dig into these results",
    patient: 'Questions about this patient?',
    groupComparison: 'Explore how these groups differ',
};

const DEFAULT_WELCOME_TITLE = 'Ask anything about cBioPortal';

const ThreadWelcome: FC = () => {
    const pageType = useSyncExternalStore(subscribe, getPageType, getPageType);
    const title = pageType ? WELCOME_TITLES[pageType] : DEFAULT_WELCOME_TITLE;
    return (
        <div className="aui-thread-welcome-root mb-6 flex flex-col items-center text-center">
            {/* Keyed so the fade-in replays when the page type changes. */}
            <h1
                key={title}
                className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-medium tracking-tight duration-200"
            >
                {title}
            </h1>
            <p className="text-muted-foreground fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-3 flex max-w-xs items-start gap-2 text-left text-xs leading-relaxed duration-200">
                <TriangleAlertIcon
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                />
                <span>
                    This assistant is experimental and under active development.
                    Chats are stored only in this browser's local storage.
                </span>
            </p>
        </div>
    );
};

// Rendered directly above the composer shell; the input placeholder continues
// the heading ("Or ask your own question…").
// Widths vary so the placeholders read as pills of different lengths.
const STARTER_SKELETON_WIDTHS = ['w-56', 'w-48', 'w-64'];

const ComposerSuggestions: FC<{
    inputRef: RefObject<HTMLTextAreaElement | null>;
}> = ({ inputRef }) => {
    const starters = useSyncExternalStore(
        subscribeToStarters,
        getStartersState,
        getStartersState
    );
    const loading = starters.status === 'loading';

    return (
        <div
            data-slot="aui_composer-suggestions"
            className="aui-composer-suggestions mb-3 flex flex-col items-start gap-1.5"
        >
            <p className="aui-composer-suggestions-heading text-muted-foreground flex items-center gap-1.5 px-2 pt-0.5 text-xs font-medium">
                Try an example
            </p>
            {loading ? (
                STARTER_SKELETON_WIDTHS.map(width => (
                    <Skeleton
                        key={width}
                        className={cn('h-8 max-w-full rounded-full', width)}
                    />
                ))
            ) : (
                <ThreadPrimitive.Suggestions>
                    {() => <ComposerSuggestionItem inputRef={inputRef} />}
                </ThreadPrimitive.Suggestions>
            )}
        </div>
    );
};

// Called from a suggestion's click, before it sets the composer text; the
// caret is placed after that text on the next frame.
const focusInputAtEnd = (inputRef: RefObject<HTMLTextAreaElement | null>) => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    requestAnimationFrame(() => {
        const end = input.value.length;
        input.setSelectionRange(end, end);
        input.scrollTop = input.scrollHeight;
    });
};

// Replaces the composer text with the prompt, for the user to edit or send,
// and moves focus to the input. Highlighted while the composer holds its
// prompt unedited.
const ComposerSuggestionItem: FC<{
    inputRef: RefObject<HTMLTextAreaElement | null>;
}> = ({ inputRef }) => {
    const selected = useAuiState(
        s => s.composer.text !== '' && s.composer.text === s.suggestion.prompt
    );

    return (
        <SuggestionPrimitive.Trigger
            onClick={() => focusInputAtEnd(inputRef)}
            aria-pressed={selected}
            render={
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        'aui-composer-suggestion fade-in slide-in-from-bottom-1 animate-in fill-mode-both h-auto max-w-full cursor-pointer justify-start gap-2 rounded-full px-3.5 py-1.5 text-left font-normal duration-200',
                        selected
                            ? 'border-primary/60 bg-accent hover:bg-accent dark:hover:bg-accent'
                            : 'border-border hover:border-muted-foreground/40 bg-(--composer-bg) dark:border-muted-foreground/20'
                    )}
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
            <SuggestionPrimitive.Title className="aui-composer-suggestion-title text-foreground min-w-0 truncate text-sm" />
        </SuggestionPrimitive.Trigger>
    );
};

const Composer: FC<{ autoFocus: boolean }> = ({ autoFocus }) => {
    // On a new chat the placeholder continues the starter suggestions shown
    // above it.
    const showsSuggestions = useAuiState(isNewChatView);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
            <AuiIf condition={isNewChatView}>
                <ComposerSuggestions inputRef={inputRef} />
            </AuiIf>
            <ThreadFollowupSuggestions
                onSelect={() => focusInputAtEnd(inputRef)}
            />
            <div
                data-slot="aui_composer-shell"
                className="border-border focus-within:border-muted-foreground/40 dark:border-muted-foreground/15 dark:focus-within:border-muted-foreground/30 flex w-full cursor-text flex-col gap-2 rounded-(--composer-radius) border bg-(--composer-bg) p-(--composer-padding) transition-[border-color]"
            >
                <ComposerAttachments />
                <ComposerPrimitive.Input
                    ref={inputRef}
                    placeholder={
                        showsSuggestions
                            ? 'Or ask your own question…'
                            : 'Ask anything about cBioPortal…'
                    }
                    className="aui-composer-input caret-primary placeholder:text-muted-foreground/60 max-h-48 min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base leading-6 outline-none"
                    rows={1}
                    autoFocus={autoFocus}
                    enterKeyHint="send"
                    aria-label="Message input"
                />
                <ComposerAction />
            </div>
        </ComposerPrimitive.Root>
    );
};

const ComposerAction: FC = () => {
    return (
        <div className="aui-composer-action-wrapper relative flex items-center justify-between">
            <ScreenshotButton />
            <div className="flex items-center gap-1.5">
                <AuiIf condition={s => s.thread.capabilities.dictation}>
                    <AuiIf condition={s => s.composer.dictation == null}>
                        <ComposerPrimitive.Dictate
                            render={
                                <TooltipIconButton
                                    tooltip="Voice input"
                                    side="bottom"
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="aui-composer-dictate text-muted-foreground hover:text-foreground size-7 rounded-full"
                                    aria-label="Start voice input"
                                />
                            }
                        >
                            <MicIcon className="aui-composer-dictate-icon size-4" />
                        </ComposerPrimitive.Dictate>
                    </AuiIf>
                    <AuiIf condition={s => s.composer.dictation != null}>
                        <ComposerPrimitive.StopDictation
                            render={
                                <TooltipIconButton
                                    tooltip="Stop dictation"
                                    side="bottom"
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="aui-composer-stop-dictation text-destructive size-7 rounded-full"
                                    aria-label="Stop voice input"
                                />
                            }
                        >
                            <SquareIcon className="aui-composer-stop-dictation-icon size-3.5 animate-pulse fill-current" />
                        </ComposerPrimitive.StopDictation>
                    </AuiIf>
                </AuiIf>
                <AuiIf condition={s => !s.thread.isRunning}>
                    <ComposerPrimitive.Send
                        render={
                            <TooltipIconButton
                                tooltip="Send message"
                                side="bottom"
                                type="button"
                                variant="default"
                                size="icon"
                                className="aui-composer-send size-7 rounded-full"
                                aria-label="Send message"
                            />
                        }
                    >
                        <ArrowUpIcon className="aui-composer-send-icon size-4" />
                    </ComposerPrimitive.Send>
                </AuiIf>
                <AuiIf condition={s => s.thread.isRunning}>
                    <ComposerPrimitive.Cancel
                        render={
                            <Button
                                type="button"
                                variant="default"
                                size="icon"
                                className="aui-composer-cancel size-7 rounded-full"
                                aria-label="Stop generating"
                            />
                        }
                    >
                        <SquareIcon className="aui-composer-cancel-icon size-3.5 fill-current" />
                    </ComposerPrimitive.Cancel>
                </AuiIf>
            </div>
        </div>
    );
};

const MessageError: FC = () => {
    return (
        <MessagePrimitive.Error>
            <ErrorPrimitive.Root className="aui-message-error-root border-destructive bg-destructive/10 text-destructive dark:bg-destructive/5 mt-2 rounded-md border p-3 text-sm dark:text-red-200">
                <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
            </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
    );
};

type WorkGroupKey =
    | 'group-chainOfThought'
    | 'group-thought'
    | 'group-narration';

const groupWorkByType = groupPartByType<WorkGroupKey>({
    reasoning: ['group-chainOfThought', 'group-thought'],
    'tool-call': ['group-chainOfThought'],
    'standalone-tool-call': [],
});

const NARRATION_PATH: readonly WorkGroupKey[] = [
    'group-chainOfThought',
    'group-narration',
];

// Everything before the reply's answer goes into one work block: reasoning,
// tool calls, and text that has more reasoning or tool calls after it (the
// model narrating its steps). Text after the last of those is the answer and
// stays outside. GroupedParts passes groupBy the same part objects as
// s.message.parts, which carry no index, so narration is looked up by object.
const useWorkGroupBy = () => {
    const parts = useAuiState(s => s.message.parts);
    return useMemo(() => {
        let lastWork = -1;
        parts.forEach((part, index) => {
            if (part.type === 'reasoning' || part.type === 'tool-call') {
                lastWork = index;
            }
        });
        const narration = new Set(
            parts.filter(
                (part, index) => part.type === 'text' && index < lastWork
            )
        );
        return (part: PartState, context: GroupByContext) =>
            narration.has(part)
                ? NARRATION_PATH
                : groupWorkByType(part, context);
    }, [parts]);
};

// One step on the work block's timeline: a thought or a bit of narration.
const WorkStep: FC<PropsWithChildren<{
    icon: LucideIcon;
    className?: string;
}>> = ({ icon: Icon, className, children }) => (
    <div className={cn('flex gap-2 text-sm', className)}>
        <Icon className="mt-1 size-3.5 shrink-0 opacity-70" aria-hidden />
        <div className="min-w-0 flex-1">{children}</div>
    </div>
);

// The work behind a reply, collapsed to one line above the answer. Open while
// the reply streams and collapsed once it's done, unless the user has toggled
// it.
const WorkBlock: FC<PropsWithChildren<{ group: ThreadGroupPart }>> = ({
    group,
    children,
}) => {
    const { hiddenTools } = useContext(ThreadComponentsContext);
    const active = useAuiState(s => s.message.status?.type === 'running');
    const [userOpen, setUserOpen] = useState<boolean>();
    const toolCount = useAuiState(s =>
        group.indices.reduce((count, index) => {
            const part = s.message.parts[index];
            return part?.type === 'tool-call' &&
                !hiddenTools?.has(part.toolName)
                ? count + 1
                : count;
        }, 0)
    );
    const hasProse = useAuiState(s =>
        group.indices.some(index => {
            const type = s.message.parts[index]?.type;
            return type === 'reasoning' || type === 'text';
        })
    );

    // Only hidden tools, such as a lone get_page_details: nothing to show.
    if (toolCount === 0 && !hasProse) return null;

    const tools =
        toolCount > 0
            ? ` · ${toolCount} tool ${toolCount === 1 ? 'call' : 'calls'}`
            : '';

    return (
        <ToolGroupRoot
            variant="ghost"
            open={userOpen ?? active}
            onOpenChange={setUserOpen}
            className="mb-2"
        >
            <ToolGroupTrigger
                active={active}
                icon={<BrainIcon className="size-3 shrink-0" aria-hidden />}
                label={active ? `Thinking…${tools}` : `Done thinking${tools}`}
            />
            <ToolGroupContent>
                <div className="ml-1.5 flex flex-col gap-2 border-l ps-4">
                    {children}
                </div>
            </ToolGroupContent>
        </ToolGroupRoot>
    );
};

const AssistantMessage: FC = () => {
    const { ToolFallback: ToolFallbackComponent = ToolFallback } = useContext(
        ThreadComponentsContext
    );
    const groupBy = useWorkGroupBy();

    const ACTION_BAR_PT = 'pt-1.5';
    // Keep the action bar inside the contained root's paint box, then cancel its reserved space in flow.
    const ACTION_BAR_HEIGHT = `min-h-7.5 ${ACTION_BAR_PT}`;

    return (
        <MessagePrimitive.Root
            data-slot="aui_assistant-message-root"
            data-role="assistant"
            className="fade-in slide-in-from-bottom-1 animate-in relative -mb-7.5 pb-7.5 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
        >
            <div
                data-slot="aui_assistant-message-content"
                className="text-foreground px-2 leading-relaxed wrap-break-word"
            >
                <MessagePrimitive.GroupedParts groupBy={groupBy}>
                    {({ part, children }) => {
                        switch (part.type) {
                            case 'group-chainOfThought':
                                return (
                                    <WorkBlock group={part}>
                                        {children}
                                    </WorkBlock>
                                );
                            case 'group-thought':
                                return (
                                    <WorkStep
                                        icon={BrainIcon}
                                        className="text-muted-foreground"
                                    >
                                        {children}
                                    </WorkStep>
                                );
                            case 'group-narration':
                                return (
                                    <WorkStep
                                        icon={MessageCircleIcon}
                                        className="text-foreground/80"
                                    >
                                        {children}
                                    </WorkStep>
                                );
                            case 'text':
                                return <MarkdownText />;
                            case 'reasoning':
                                return <Reasoning {...part} />;
                            case 'tool-call':
                                return (
                                    part.toolUI ?? (
                                        <ToolFallbackComponent {...part} />
                                    )
                                );
                            case 'data':
                                return part.dataRendererUI;
                            case 'file':
                                return (
                                    <div
                                        data-slot="aui_assistant-message-file"
                                        className="py-1"
                                    >
                                        <File {...part} />
                                    </div>
                                );
                            case 'image':
                                return (
                                    <div
                                        data-slot="aui_assistant-message-image"
                                        className="py-1"
                                    >
                                        <Image {...part} />
                                    </div>
                                );
                            case 'indicator':
                                return (
                                    <span
                                        data-slot="aui_assistant-message-indicator"
                                        className="animate-pulse font-sans"
                                        aria-label="Assistant is working"
                                    >
                                        {'●'}
                                    </span>
                                );
                            default:
                                return null;
                        }
                    }}
                </MessagePrimitive.GroupedParts>
                <MessageError />
            </div>

            <div
                data-slot="aui_assistant-message-footer"
                className={cn('ms-2 flex items-center', ACTION_BAR_HEIGHT)}
            >
                <BranchPicker />
                <AssistantActionBar />
            </div>
        </MessagePrimitive.Root>
    );
};

const AssistantActionBar: FC = () => {
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="aui-assistant-action-bar-root text-muted-foreground animate-in fade-in col-start-3 row-start-2 -ms-1 flex gap-1 duration-200"
        >
            <ActionBarPrimitive.Copy
                render={<TooltipIconButton tooltip="Copy" />}
            >
                <AuiIf condition={s => s.message.isCopied}>
                    <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
                </AuiIf>
                <AuiIf condition={s => !s.message.isCopied}>
                    <CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />
                </AuiIf>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload
                render={<TooltipIconButton tooltip="Refresh" />}
            >
                <RefreshCwIcon />
            </ActionBarPrimitive.Reload>
            <ActionBarMorePrimitive.Root>
                <ActionBarMorePrimitive.Trigger
                    render={
                        <TooltipIconButton
                            tooltip="More"
                            className="data-[state=open]:bg-accent"
                        />
                    }
                >
                    <MoreHorizontalIcon />
                </ActionBarMorePrimitive.Trigger>
                <ActionBarMorePrimitive.Content
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="aui-action-bar-more-content bg-popover text-popover-foreground data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1.5"
                >
                    <ActionBarPrimitive.ExportMarkdown
                        render={
                            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none" />
                        }
                    >
                        <DownloadIcon className="size-4" />
                        Export as Markdown
                    </ActionBarPrimitive.ExportMarkdown>
                </ActionBarMorePrimitive.Content>
            </ActionBarMorePrimitive.Root>
        </ActionBarPrimitive.Root>
    );
};

const UserFilePart: FileMessagePartComponent = part => (
    <div data-slot="aui_user-message-file" className="py-1">
        <File {...part} />
    </div>
);

const UserImagePart: ImageMessagePartComponent = part => (
    <div data-slot="aui_user-message-image" className="py-1">
        <Image {...part} />
    </div>
);

const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root
            data-slot="aui_user-message-root"
            className="fade-in slide-in-from-bottom-1 animate-in grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto] [&:where(>*)]:col-start-2"
            data-role="user"
        >
            <UserMessageAttachments />

            <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
                <div className="aui-user-message-content peer bg-muted text-foreground rounded-xl px-4 py-2 wrap-break-word empty:hidden">
                    <MessagePrimitive.Parts
                        components={{
                            File: UserFilePart,
                            Image: UserImagePart,
                        }}
                    />
                </div>
                <div className="aui-user-action-bar-wrapper absolute start-0 top-1/2 -translate-x-full -translate-y-1/2 pe-2 peer-empty:hidden rtl:translate-x-full">
                    <UserActionBar />
                </div>
            </div>

            <BranchPicker
                data-slot="aui_user-branch-picker"
                className="col-span-full col-start-1 row-start-3 -me-1 justify-end"
            />
        </MessagePrimitive.Root>
    );
};

const UserActionBar: FC = () => {
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="aui-user-action-bar-root flex flex-col items-end"
        >
            <ActionBarPrimitive.Edit
                render={
                    <TooltipIconButton
                        tooltip="Edit"
                        className="aui-user-action-edit"
                    />
                }
            >
                <PencilIcon />
            </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
    );
};

const EditComposer: FC = () => {
    return (
        <MessagePrimitive.Root
            data-slot="aui_edit-composer-wrapper"
            className="flex flex-col px-2 [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
        >
            <ComposerPrimitive.Root className="aui-edit-composer-root border-border dark:border-muted-foreground/15 ms-auto flex w-full max-w-[85%] cursor-text flex-col rounded-(--composer-radius) border bg-(--composer-bg)">
                <ComposerPrimitive.Input
                    className="aui-edit-composer-input text-foreground min-h-14 w-full resize-none bg-transparent px-4 pt-3 pb-1 text-base outline-none"
                    autoFocus
                />
                <div className="aui-edit-composer-footer mx-2.5 mb-2.5 flex items-center gap-1.5 self-end">
                    <ComposerPrimitive.Cancel
                        render={
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-md px-3.5"
                            />
                        }
                    >
                        Cancel
                    </ComposerPrimitive.Cancel>
                    <ComposerPrimitive.Send
                        render={
                            <Button
                                size="sm"
                                className="h-8 rounded-md px-3.5"
                            />
                        }
                    >
                        Update
                    </ComposerPrimitive.Send>
                </div>
            </ComposerPrimitive.Root>
        </MessagePrimitive.Root>
    );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
    className,
    ...rest
}) => {
    return (
        <BranchPickerPrimitive.Root
            hideWhenSingleBranch
            className={cn(
                'aui-branch-picker-root text-muted-foreground -ms-2 me-2 inline-flex items-center text-xs',
                className
            )}
            {...rest}
        >
            <BranchPickerPrimitive.Previous
                render={<TooltipIconButton tooltip="Previous" />}
            >
                <ChevronLeftIcon />
            </BranchPickerPrimitive.Previous>
            <span className="aui-branch-picker-state font-medium">
                <BranchPickerPrimitive.Number /> /{' '}
                <BranchPickerPrimitive.Count />
            </span>
            <BranchPickerPrimitive.Next
                render={<TooltipIconButton tooltip="Next" />}
            >
                <ChevronRightIcon />
            </BranchPickerPrimitive.Next>
        </BranchPickerPrimitive.Root>
    );
};
