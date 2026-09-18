import {
    FC,
    PropsWithChildren,
    ReactNode,
    useEffect,
    useState,
    useSyncExternalStore,
} from 'react';
import {
    AssistantRuntimeProvider,
    AuiConfig,
    Suggestions,
    ToolCallMessagePartComponent,
    useAuiState,
    useRemoteThreadListRuntime,
} from '@assistant-ui/react';
import {
    Thread,
    ThreadGroupPart,
} from '@/components/assistant-ui/elements/thread.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import {
    ToolGroupContent,
    ToolGroupRoot,
    ToolGroupTrigger,
} from '@/components/assistant-ui/elements/tool-group.aui';
import { ChatHeader } from '@/components/ChatHeader';
import { useCrossTabSync } from '@/hooks/use-cross-tab-sync';
import {
    AuthErrorStatus,
    getAuthError,
    getSelectedModel,
    ModelInfo,
    setAuthError,
    setSelectedModel,
    subscribe,
} from '@/lib/chatSession';
import { threadListAdapter } from '@/lib/threadListAdapter';
import {
    readLastThreadId,
    removeLegacyChatStorage,
    saveLastThreadId,
} from '@/lib/threadStorage';
import { useChatThreadRuntime } from '@/lib/useChatThreadRuntime';

const AUTH_ERROR_CONTENT: Record<
    AuthErrorStatus,
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

// go_to_page/get_page_details are internal plumbing, not something worth
// surfacing as a visible "used tool" card — everything else still does.
const SILENT_TOOLS = new Set(['go_to_page', 'get_page_details']);

// Stands in for the whole sidebar, header and chat list included: there is
// nothing to do until the user has access or a fresh session. Mirrors
// ThreadWelcome's heading so it reads as the same screen.
const AuthErrorScreen: FC<{ status: AuthErrorStatus }> = ({ status }) => {
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

const THREAD_COMPONENTS = {
    ToolFallback: AppToolFallback,
    ToolGroup: AppToolGroup,
};

export function App() {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const authError = useSyncExternalStore(
        subscribe,
        getAuthError,
        getAuthError
    );

    useEffect(() => {
        removeLegacyChatStorage();
    }, []);

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
                const selected = getSelectedModel();
                if (!selected || !data.models.some(m => m.id === selected)) {
                    setSelectedModel(data.models[0]?.id ?? null);
                }
            })
            .catch(() => {
                /* dropdown will just stay empty */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // The iframe reloads on every portal navigation, including the ones the
    // go_to_page tool triggers, so the open chat has to be restored or the
    // user lands in a blank one mid-conversation. Read once: the runtime
    // freezes this on its first render.
    const [initialThreadId] = useState(readLastThreadId);

    const runtime = useRemoteThreadListRuntime({
        adapter: threadListAdapter,
        runtimeHook: useChatThreadRuntime,
        initialThreadId,
        onThreadIdChange: saveLastThreadId,
    });

    useCrossTabSync(runtime);

    return (
        <div className="flex h-full flex-col">
            <AssistantRuntimeProvider runtime={runtime} config={WELCOME_CONFIG}>
                {authError ? (
                    <div className="min-h-0 flex-1">
                        <AuthErrorScreen status={authError} />
                    </div>
                ) : (
                    <>
                        <ChatHeader models={models} />
                        <div className="min-h-0 flex-1">
                            <Thread components={THREAD_COMPONENTS} />
                        </div>
                    </>
                )}
            </AssistantRuntimeProvider>
        </div>
    );
}
