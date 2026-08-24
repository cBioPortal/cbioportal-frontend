import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';

interface ModelInfo {
    id: string;
    name: string;
}

const MODEL_STORAGE_KEY = 'chat-sidebar:selectedModel';

// cBioPortal page paths — clicking these should navigate the host page, not
// this iframe (checked by path only since href may be relative or absolute).
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

// Ask the host page to navigate — this iframe can't call its router directly.
function notifyNavigate(url: string) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'chat-sidebar:navigate', url }, '*');
    }
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
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat/message',
                body: () => ({ model: selectedModelRef.current }),
            }),
        []
    );

    const { messages, sendMessage, status, error } = useChat({ transport });
    const busy = status === 'submitted' || status === 'streaming';

    const submitInput = () => {
        const text = input.trim();
        if (!text || busy) return;
        setInput('');
        textareaRef.current?.blur();
        sendMessage({ text });
    };

    return (
        <div className="chat-shell">
            <header className="chat-header">
                {models.length > 0 && (
                    <div className="header-controls">
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
                    </div>
                )}
                <div className="chat-title">cBioPortal Chat</div>
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
                            <ReactMarkdown components={markdownComponents}>
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
