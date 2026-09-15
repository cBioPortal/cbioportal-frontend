import {
    FC,
    PropsWithChildren,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    UIMessage,
} from 'ai';
import {
    AssistantRuntimeProvider,
    AuiConfig,
    SimpleImageAttachmentAdapter,
    Suggestions,
    ToolCallMessagePartComponent,
    useAuiState,
} from '@assistant-ui/react';
import { useAISDKRuntime } from '@assistant-ui/ai-sdk';
import { FileTextIcon, LoaderIcon, TriangleAlertIcon } from 'lucide-react';
import {
    Thread,
    ThreadGroupPart,
} from '@/components/assistant-ui/elements/thread.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import {
    ToolGroupContent,
    ToolGroupRoot,
    ToolGroupTrigger,
} from '@/components/assistant-ui/elements/tool-group.aui';
import { Button } from '@/components/ui/button';
import { isPortalLink, notifyNavigate } from '@/lib/portal-link';
import { isFromParent, parentOrigin } from '@/lib/parent-origin';
import { downloadTextFile } from '@/lib/download';
import { appendScreenshotAppendix } from '@/lib/report';

interface ModelInfo {
    id: string;
    name: string;
}

const MODEL_STORAGE_KEY = 'chat-sidebar:selectedModel';
// Shared across tabs — the iframe origin is fixed, so history follows the
// user across hard navigations instead of resetting per tab.
const MESSAGES_STORAGE_KEY = 'chat-sidebar:messages';

const AUTH_ERROR_CONTENT: Record<
    401 | 403,
    { title: string; caption: ReactNode }
> = {
    401: {
        title: 'Session Expired',
        caption:
            'Your cBioPortal session has expired. Reload the page to sign in again.',
    },
    403: {
        title: 'Access Not Allowed',
        caption: (
            <>
                This chat assistant is an experimental feature, currently open
                to a small group of users. To request access, contact{' '}
                <a
                    className="underline underline-offset-2"
                    href="mailto:cbioportal@googlegroups.com"
                >
                    cbioportal@googlegroups.com
                </a>
                .
            </>
        ),
    },
};

class ChatAuthError extends Error {
    constructor(readonly status: 401 | 403) {
        super(AUTH_ERROR_CONTENT[status].title);
    }
}

function loadStoredMessages(): UIMessage[] {
    try {
        const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveMessages(messages: UIMessage[]) {
    try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch {
        /* quota exceeded or private mode — history just won't persist */
    }
}

// This iframe has no access to the host URL otherwise; null if standalone
// or no reply in time.
function requestPageHref(timeoutMs = 500): Promise<string | null> {
    return new Promise(resolve => {
        if (!window.parent || window.parent === window) {
            resolve(null);
            return;
        }
        const requestId = Math.random()
            .toString(36)
            .slice(2);
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            resolve(null);
        }, timeoutMs);
        function onMessage(e: MessageEvent) {
            if (
                !isFromParent(e) ||
                e.data?.type !== 'chat-sidebar:pageInfo' ||
                e.data.requestId !== requestId
            ) {
                return;
            }
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data.href ?? null);
        }
        window.addEventListener('message', onMessage);
        window.parent.postMessage(
            { type: 'chat-sidebar:requestPageInfo', requestId },
            parentOrigin()
        );
    });
}

// This iframe has no access to the live app store otherwise.
function requestPageDetails(timeoutMs = 2000): Promise<unknown> {
    return new Promise(resolve => {
        if (!window.parent || window.parent === window) {
            resolve({ available: false });
            return;
        }
        const requestId = Math.random()
            .toString(36)
            .slice(2);
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            resolve({ available: false });
        }, timeoutMs);
        function onMessage(e: MessageEvent) {
            if (
                !isFromParent(e) ||
                e.data?.type !== 'chat-sidebar:pageDetails' ||
                e.data.requestId !== requestId
            ) {
                return;
            }
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data.details ?? { available: false });
        }
        window.addEventListener('message', onMessage);
        window.parent.postMessage(
            { type: 'chat-sidebar:requestPageDetails', requestId },
            parentOrigin()
        );
    });
}

// Stateless — one instance for the app's lifetime rather than one per render.
const attachmentAdapter = new SimpleImageAttachmentAdapter();

// go_to_page/get_page_details are internal plumbing, not something worth
// surfacing as a visible "used tool" card — everything else still does.
const SILENT_TOOLS = new Set(['go_to_page', 'get_page_details']);

// Stands in for the whole thread, composer included: there is nothing to type
// into until the user has access or a fresh session. Mirrors ThreadWelcome's
// heading so it reads as the same screen.
const AuthErrorScreen: FC<{ status: 401 | 403 }> = ({ status }) => {
    const { title, caption } = AUTH_ERROR_CONTENT[status];
    return (
        <div
            role="alert"
            className="flex h-full flex-col items-center justify-center px-6 text-center"
        >
            <h1 className="text-destructive fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-medium tracking-tight duration-200">
                {title}
            </h1>
            <p className="text-muted-foreground fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-3 max-w-xs text-sm leading-relaxed duration-200">
                {caption}
            </p>
        </div>
    );
};

const AppToolFallback: ToolCallMessagePartComponent = part => {
    if (SILENT_TOOLS.has(part.toolName)) return null;
    return <ToolFallback {...part} />;
};

// Welcome-screen starters. The title labels the category; `label` renders the
// prompt itself as a second line, so the card shows what will be sent.
const WELCOME_CONFIG = AuiConfig({
    suggestions: Suggestions([
        {
            title: 'Explore Data',
            label:
                'Which cBioPortal studies include lung adenocarcinoma samples with mutation and copy-number data?',
            prompt:
                'Which cBioPortal studies include lung adenocarcinoma samples with mutation and copy-number data?',
        },
        {
            title: 'Navigate cBioPortal',
            label:
                'Give me an OncoPrint for EGFR and KRAS in TCGA lung adenocarcinoma.',
            prompt:
                'Give me an OncoPrint for EGFR and KRAS in TCGA lung adenocarcinoma.',
        },
        {
            title: 'Analyze Data',
            label: 'Compare low grade glioma by molecular subtype.',
            prompt: 'Compare low grade glioma by molecular subtype.',
        },
    ]),
});

const AppToolGroup = ({
    group,
    children,
}: PropsWithChildren<{ group: ThreadGroupPart }>) => {
    const visibleToolCount = useAuiState(state =>
        group.indices.reduce((count, index) => {
            const part = state.message.parts[index];
            return (
                count +
                (part?.type === 'tool-call' && !SILENT_TOOLS.has(part.toolName)
                    ? 1
                    : 0)
            );
        }, 0)
    );

    if (visibleToolCount === 0) return null;

    return (
        <ToolGroupRoot variant="ghost">
            <ToolGroupTrigger
                count={visibleToolCount}
                active={group.status.type === 'running'}
            />
            <ToolGroupContent>{children}</ToolGroupContent>
        </ToolGroupRoot>
    );
};

export function App() {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [authError, setAuthError] = useState<401 | 403 | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(() => {
        try {
            return localStorage.getItem(MODEL_STORAGE_KEY);
        } catch {
            return null;
        }
    });

    useEffect(() => {
        let cancelled = false;
        fetch('/api/chat/models')
            .then(r => {
                // Surfaces the reason on load rather than on first message.
                if (r.status === 401 || r.status === 403) {
                    setAuthError(r.status);
                    return null;
                }
                return r.json();
            })
            .then((data: { models: ModelInfo[] } | null) => {
                if (!data) return;
                if (cancelled) return;
                setModels(data.models);
                if (
                    !selectedModel ||
                    !data.models.some(m => m.id === selectedModel)
                ) {
                    setSelectedModel(data.models[0]?.id ?? null);
                }
            })
            .catch(() => {
                /* dropdown will just stay empty */
            });
        return () => {
            cancelled = true;
        };
        // Run once — selectedModel is read but not a dep on purpose.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSelectModel = (id: string) => {
        setSelectedModel(id);
        try {
            localStorage.setItem(MODEL_STORAGE_KEY, id);
        } catch {
            /* private mode etc — selection just doesn't persist */
        }
    };

    const selectedModelRef = useRef(selectedModel);
    selectedModelRef.current = selectedModel;
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat/message',
                // The portal proxies this endpoint and rejects it when the
                // session has lapsed or the user lacks the chat role.
                fetch: async (input, init) => {
                    const response = await fetch(input, init);
                    if (response.status === 401 || response.status === 403) {
                        throw new ChatAuthError(response.status);
                    }
                    return response;
                },
                body: async () => ({
                    model: selectedModelRef.current,
                    pageHref: await requestPageHref(),
                }),
            }),
        []
    );

    const [initialMessages] = useState(loadStoredMessages);
    const chat = useChat({
        messages: initialMessages,
        transport,
        // Model decides whether to navigate now vs. just link — see
        // go_to_page guidance in the system prompt.
        onToolCall: async ({ toolCall }) => {
            if (toolCall.toolName === 'go_to_page') {
                const { url } = toolCall.input as { url: string };
                const navigated = isPortalLink(url);
                if (navigated) notifyNavigate(url);
                addToolOutput({
                    tool: 'go_to_page',
                    toolCallId: toolCall.toolCallId,
                    output: { navigated },
                });
                return;
            }
            if (toolCall.toolName === 'get_page_details') {
                const details = await requestPageDetails();
                addToolOutput({
                    tool: 'get_page_details',
                    toolCallId: toolCall.toolCallId,
                    output: details,
                });
                return;
            }
        },
        onFinish: ({ messages }) => saveMessages(messages),
        onError: error => {
            if (error instanceof ChatAuthError) setAuthError(error.status);
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });
    const { messages, status, addToolOutput, setMessages } = chat;
    const busy = status === 'submitted' || status === 'streaming';
    const runtime = useAISDKRuntime(chat, {
        adapters: { attachments: attachmentAdapter },
    });

    const clearChat = () => {
        setMessages([]);
        try {
            localStorage.removeItem(MESSAGES_STORAGE_KEY);
        } catch {
            /* ignore */
        }
    };

    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const reportErrorTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const onGenerateReport = async () => {
        clearTimeout(reportErrorTimeoutRef.current);
        setReportError(null);
        setGeneratingReport(true);
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

    // storage only fires in OTHER same-origin tabs, never the one that wrote
    // it — exactly what's needed to pick up a conversation continued elsewhere.
    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== MESSAGES_STORAGE_KEY || busy) return;
            try {
                setMessages(e.newValue ? JSON.parse(e.newValue) : []);
            } catch {
                /* ignore malformed value */
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [busy, setMessages]);

    return (
        <div className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b border-border bg-muted/40 pt-2 pb-2 pr-[38px] pl-4">
                <div className="min-w-0 flex-shrink truncate text-sm font-semibold leading-[22px]">
                    cBioPortal Chat
                </div>
                <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                    {models.length > 1 && (
                        <select
                            className="h-[22px] max-w-40 cursor-pointer rounded-[3px] border border-border bg-transparent px-1 text-[11px] leading-tight text-muted-foreground hover:text-foreground disabled:opacity-60"
                            value={selectedModel ?? ''}
                            onChange={e => onSelectModel(e.target.value)}
                            disabled={busy}
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
                        tooltip={reportError ?? 'Research report'}
                        side="bottom"
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={
                            reportError
                                ? 'text-destructive size-[22px] rounded-full'
                                : 'text-muted-foreground hover:text-foreground size-[22px] rounded-full'
                        }
                        aria-label="Generate research report"
                        onClick={onGenerateReport}
                        disabled={
                            busy || generatingReport || messages.length === 0
                        }
                    >
                        {generatingReport ? (
                            <LoaderIcon className="size-4 animate-spin" />
                        ) : reportError ? (
                            <TriangleAlertIcon className="size-4" />
                        ) : (
                            <FileTextIcon className="size-4" />
                        )}
                    </TooltipIconButton>
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-[22px]"
                        onClick={clearChat}
                        disabled={busy || messages.length === 0}
                        title="New chat"
                    >
                        New chat
                    </Button>
                </div>
            </header>

            <div className="min-h-0 flex-1">
                {authError ? (
                    <AuthErrorScreen status={authError} />
                ) : (
                    <AssistantRuntimeProvider
                        runtime={runtime}
                        config={WELCOME_CONFIG}
                    >
                        <Thread
                            components={{
                                ToolFallback: AppToolFallback,
                                ToolGroup: AppToolGroup,
                            }}
                        />
                    </AssistantRuntimeProvider>
                )}
            </div>
        </div>
    );
}
