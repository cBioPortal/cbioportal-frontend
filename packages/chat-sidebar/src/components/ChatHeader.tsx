import { FC, useRef, useState, useSyncExternalStore } from 'react';
import { UIMessage } from 'ai';
import {
    getExternalStoreMessages,
    ThreadListPrimitive,
    useAui,
    useAuiState,
} from '@assistant-ui/react';
import {
    FileChartColumnIcon,
    LoaderIcon,
    MessagesSquareIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { buttonVariants } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    getSelectedModel,
    ModelInfo,
    setSelectedModel,
    subscribe,
} from '@/lib/chatSession';
import { downloadTextFile } from '@/lib/download';
import { appendScreenshotAppendix } from '@/lib/report';

// Lives inside the runtime provider: everything here acts on the chat the user
// is looking at.
export const ChatHeader: FC<{ models: ModelInfo[] }> = ({ models }) => {
    const aui = useAui();
    const selectedModel = useSyncExternalStore(
        subscribe,
        getSelectedModel,
        getSelectedModel
    );
    const isRunning = useAuiState(s => s.thread.isRunning);
    // A boolean, not the message list — the header would otherwise re-render
    // on every streamed token.
    const isEmpty = useAuiState(s => s.thread.messages.length === 0);
    const isOnNewThread = useAuiState(
        s => s.threads.newThreadId === s.threads.mainThreadId
    );

    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const reportErrorTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const onGenerateReport = async () => {
        clearTimeout(reportErrorTimeoutRef.current);
        setReportError(null);
        setGeneratingReport(true);
        // Read once, at click time: these are the AI SDK messages behind the
        // visible thread, which is what the endpoint and the appendix expect.
        const messages = aui.thread
            .getState()
            .messages.flatMap(m => getExternalStoreMessages<UIMessage>(m));
        try {
            const res = await fetch('/api/chat/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, model: selectedModel }),
            });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? 'report generation failed');
            }
            const { report } = await res.json();
            downloadTextFile(
                `cbioportal-research-report-${Date.now()}.md`,
                appendScreenshotAppendix(report, messages)
            );
        } catch (err) {
            console.error('report generation failed:', err);
            setReportError('Failed to generate the research report.');
            reportErrorTimeoutRef.current = setTimeout(
                () => setReportError(null),
                5000
            );
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <header className="flex items-center gap-2 border-b border-border bg-muted/40 pt-2 pb-2 pr-[38px] pl-4">
            <div className="min-w-0 flex-shrink truncate text-sm font-semibold leading-[22px]">
                cBioPortal Chat
            </div>
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                {models.length > 1 && (
                    <select
                        className="h-[22px] max-w-40 cursor-pointer rounded-[3px] border border-border bg-transparent px-1 text-[11px] leading-tight text-muted-foreground hover:text-foreground disabled:opacity-60"
                        value={selectedModel ?? ''}
                        onChange={e => setSelectedModel(e.target.value)}
                        disabled={isRunning}
                        aria-label="Model"
                    >
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                )}
                <Popover>
                    <PopoverTrigger
                        aria-label="Chats"
                        title="Chats"
                        className="flex size-[22px] items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    >
                        <MessagesSquareIcon className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                        <ThreadList />
                    </PopoverContent>
                </Popover>
                <TooltipIconButton
                    tooltip={
                        reportError ??
                        'Generate a research report of current chat'
                    }
                    side="bottom"
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={
                        reportError
                            ? 'text-destructive size-[22px] rounded-full'
                            : 'text-muted-foreground hover:text-foreground size-[22px] rounded-full'
                    }
                    aria-label="Generate a research report of current chat"
                    onClick={onGenerateReport}
                    disabled={isRunning || generatingReport || isEmpty}
                >
                    {generatingReport ? (
                        <LoaderIcon className="size-4 animate-spin" />
                    ) : reportError ? (
                        <TriangleAlertIcon className="size-4" />
                    ) : (
                        <FileChartColumnIcon className="size-4" />
                    )}
                </TooltipIconButton>
                {/* Not disabled while running — leaving a streaming chat for a
                    new one is the point of having several. */}
                <ThreadListPrimitive.New
                    disabled={isOnNewThread && isEmpty}
                    title="New chat"
                    className={buttonVariants({
                        variant: 'outline',
                        size: 'xs',
                        className: 'h-[22px]',
                    })}
                >
                    New chat
                </ThreadListPrimitive.New>
            </div>
        </header>
    );
};
