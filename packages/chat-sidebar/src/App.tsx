import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    UIMessage,
} from 'ai';
import {
    AssistantRuntimeProvider,
    SimpleImageAttachmentAdapter,
    ToolCallMessagePartComponent,
} from '@assistant-ui/react';
import { useAISDKRuntime } from '@assistant-ui/ai-sdk';
import { Thread } from '@/components/assistant-ui/elements/thread.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import { Button } from '@/components/ui/button';
import { isPortalLink, notifyNavigate } from '@/lib/portal-link';

interface ModelInfo {
    id: string;
    name: string;
}

const MODEL_STORAGE_KEY = 'chat-sidebar:selectedModel';
// Shared across tabs — the iframe origin is fixed, so history follows the
// user across hard navigations instead of resetting per tab.
const MESSAGES_STORAGE_KEY = 'chat-sidebar:messages';

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
                e.source !== window.parent ||
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
            '*'
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
                e.source !== window.parent ||
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
            '*'
        );
    });
}

// Stateless — one instance for the app's lifetime rather than one per render.
const attachmentAdapter = new SimpleImageAttachmentAdapter();

// go_to_page/get_page_details are internal plumbing, not something worth
// surfacing as a visible "used tool" card — everything else still does.
const SILENT_TOOLS = new Set(['go_to_page', 'get_page_details']);
const AppToolFallback: ToolCallMessagePartComponent = part => {
    if (SILENT_TOOLS.has(part.toolName)) return null;
    return <ToolFallback {...part} />;
};

export function App() {
    const [models, setModels] = useState<ModelInfo[]>([]);
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
            .then(r => r.json())
            .then((data: { models: ModelInfo[] }) => {
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
                <AssistantRuntimeProvider runtime={runtime}>
                    <Thread components={{ ToolFallback: AppToolFallback }} />
                </AssistantRuntimeProvider>
            </div>
        </div>
    );
}
