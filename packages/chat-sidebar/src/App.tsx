import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    UIMessage,
} from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

// Portal paths navigate the host page, not this iframe (path-only check —
// href may be relative or absolute).
const PORTAL_PATHS = [
    '/study',
    '/results',
    '/patient',
    '/comparison',
    '/index.do',
];

function isPortalLink(href: string | undefined): boolean {
    if (!href) return false;
    try {
        const url = new URL(href, 'http://portal-link.invalid');
        return PORTAL_PATHS.some(
            p => url.pathname === p || url.pathname.startsWith(p + '/')
        );
    } catch {
        return false;
    }
}

// This iframe can't call the router directly.
function notifyNavigate(url: string) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'chat-sidebar:navigate', url }, '*');
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

const markdownComponents = {
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p style={{ margin: 0 }} {...props} />
    ),
    a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        if (isPortalLink(href)) {
            return (
                <a
                    href={href}
                    onClick={e => {
                        e.preventDefault();
                        notifyNavigate(href!);
                    }}
                >
                    {children}
                </a>
            );
        }
        return (
            <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        );
    },
    // Scrolls horizontally instead of squishing into the narrow msg bubble.
    table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
        <div className="md-table-wrap">
            <table {...props} />
        </div>
    ),
};

function displayText(message: UIMessage): string {
    return message.parts
        .filter(p => p.type === 'text')
        .map(p => (p as { text: string }).text)
        .join('');
}

export function App() {
    const [input, setInput] = useState('');
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | null>(() => {
        try {
            return localStorage.getItem(MODEL_STORAGE_KEY);
        } catch {
            return null;
        }
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const pageHrefRef = useRef<string | null>(null);
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat/message',
                body: () => ({
                    model: selectedModelRef.current,
                    pageHref: pageHrefRef.current,
                }),
            }),
        []
    );

    const [initialMessages] = useState(loadStoredMessages);
    const {
        messages,
        sendMessage,
        status,
        error,
        addToolOutput,
        setMessages,
    } = useChat({
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
    const busy = status === 'submitted' || status === 'streaming';

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

    const sendingRef = useRef(false);
    const submitInput = async () => {
        const text = input.trim();
        if (!text || busy || sendingRef.current) return;
        sendingRef.current = true;
        setInput('');
        textareaRef.current?.blur();
        try {
            pageHrefRef.current = await requestPageHref();
            sendMessage({ text });
        } finally {
            sendingRef.current = false;
        }
    };

    return (
        <div className="chat-shell">
            <header className="chat-header">
                <div className="chat-title">cBioPortal Chat</div>
                <div className="header-controls">
                    {models.length > 1 && (
                        <>
                            <select
                                className="model-select"
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
                            <span className="header-divider" aria-hidden="true">
                                |
                            </span>
                        </>
                    )}
                    <button
                        type="button"
                        className="new-chat-btn"
                        onClick={clearChat}
                        disabled={busy || messages.length === 0}
                        title="New chat"
                        aria-label="New chat"
                    >
                        New chat
                    </button>
                </div>
            </header>

            <div className="chat-messages">
                {messages.map(message => {
                    const text = displayText(message);
                    if (!text) return null;
                    return (
                        <div
                            key={message.id}
                            className={
                                message.role === 'user'
                                    ? 'msg msg-user'
                                    : 'msg msg-assistant'
                            }
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {text}
                            </ReactMarkdown>
                        </div>
                    );
                })}

                {busy && (
                    <div className="msg msg-assistant msg-loading muted">
                        Thinking…
                    </div>
                )}

                {error && <div className="error">{error.message}</div>}
            </div>

            <form
                className="chat-input"
                onSubmit={e => {
                    e.preventDefault();
                    submitInput();
                }}
            >
                <textarea
                    ref={textareaRef}
                    className="chat-input-textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitInput();
                        }
                    }}
                    placeholder="Ask anything about cBioPortal…"
                />
                <button type="submit" disabled={!input.trim() || busy}>
                    Send
                </button>
            </form>
        </div>
    );
}
