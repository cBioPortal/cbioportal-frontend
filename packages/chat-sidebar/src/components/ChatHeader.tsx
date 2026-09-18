import { FC, useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { UIMessage } from 'ai';
import {
    getExternalStoreMessages,
    useAui,
    useAuiState,
} from '@assistant-ui/react';
import {
    ChevronDownIcon,
    FileChartColumnIcon,
    LoaderIcon,
    PlusIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
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

    const [chatsOpen, setChatsOpen] = useState(false);
    // Switching chats or starting one takes the user out of the list; deleting
    // does not, so the list stays open for a second delete.
    const closeChats = useCallback(() => setChatsOpen(false), []);

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
            <div className="min-w-0 flex-shrink truncate text-sm font-semibold leading-7">
                cBioPortal Chat
            </div>
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                {models.length > 1 && (
                    <select
                        className="h-7 max-w-40 cursor-pointer rounded-[3px] border border-border bg-transparent px-1 text-[11px] leading-tight text-muted-foreground hover:text-foreground disabled:opacity-60"
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
                <TooltipIconButton
                    tooltip={
                        reportError ??
                        'Generate a research report of current chat'
                    }
                    side="bottom"
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className={reportError ? 'text-destructive' : ''}
                    aria-label="Generate a research report of current chat"
                    onClick={onGenerateReport}
                    disabled={isRunning || generatingReport || isEmpty}
                >
                    {generatingReport ? (
                        <LoaderIcon className="animate-spin" />
                    ) : reportError ? (
                        <TriangleAlertIcon />
                    ) : (
                        <FileChartColumnIcon />
                    )}
                </TooltipIconButton>
                <ButtonGroup>
                    <Button
                        variant="outline"
                        size="sm"
                        title="New chat"
                        onClick={() => aui.threads.switchToNewThread()}
                    >
                        <PlusIcon />
                        New chat
                    </Button>
                    <Popover open={chatsOpen} onOpenChange={setChatsOpen}>
                        <PopoverTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Open chats"
                                    title="Chats"
                                >
                                    <ChevronDownIcon />
                                </Button>
                            }
                        />
                        <PopoverContent className="w-80 p-2">
                            <ThreadList onNavigate={closeChats} />
                        </PopoverContent>
                    </Popover>
                </ButtonGroup>
            </div>
        </header>
    );
};
