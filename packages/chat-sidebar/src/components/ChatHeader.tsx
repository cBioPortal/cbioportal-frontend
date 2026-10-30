import { FC, useCallback, useState, useSyncExternalStore } from 'react';
import { useAui, useAuiState } from '@assistant-ui/react';
import {
    ChevronDownIcon,
    FileChartColumnIcon,
    PanelRightIcon,
    PlusIcon,
} from 'lucide-react';
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui';
import { ReportDialog } from '@/components/ReportDialog';
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
import { embedded } from '@/lib/parent-origin';
import { requestSidebarMode } from '@/lib/sidebar-mode';

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

    const [reportOpen, setReportOpen] = useState(false);

    return (
        <header className="@container flex items-center gap-2 border-b border-border bg-muted/40 pt-2 pb-2 px-4">
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
                {/* The label drops before it would squeeze the title further. */}
                <Button
                    variant="outline"
                    size="sm"
                    title="Generate a research report of current chat"
                    aria-label="Generate a research report of current chat"
                    onClick={() => setReportOpen(true)}
                    disabled={isRunning || isEmpty}
                >
                    <FileChartColumnIcon />
                    <span
                        className={
                            models.length > 1
                                ? 'hidden @[28rem]:inline'
                                : 'hidden @[22rem]:inline'
                        }
                    >
                        Report
                    </span>
                </Button>
                <ReportDialog
                    open={reportOpen}
                    onOpenChange={setReportOpen}
                    model={selectedModel ?? undefined}
                />
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
                {embedded && (
                    <TooltipIconButton
                        tooltip="Collapse chat"
                        side="bottom"
                        type="button"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label="Collapse chat"
                        onClick={() => requestSidebarMode('rail')}
                    >
                        <PanelRightIcon />
                    </TooltipIconButton>
                )}
            </div>
        </header>
    );
};
