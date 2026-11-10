import {
    FC,
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
    useRemoteThreadListRuntime,
} from '@assistant-ui/react';
import { Thread } from '@/components/assistant-ui/elements/thread.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import { ChatHeader } from '@/components/ChatHeader';
import { SidebarRail } from '@/components/SidebarRail';
import { useCrossTabSync } from '@/hooks/use-cross-tab-sync';
import {
    AuthErrorStatus,
    getAuthError,
    ModelInfo,
    readLastThreadId,
    saveLastThreadId,
    setAuthError,
    setModels,
    subscribe,
} from '@/lib/chatSession';
import { setPortalLinkAliases } from '@/lib/portal-link';
import { getSidebarMode, subscribeToSidebarMode } from '@/lib/sidebar-mode';
import { threadListAdapter } from '@/lib/threadListAdapter';
import { useChatThreadRuntime } from '@/lib/useChatThreadRuntime';
import {
    FALLBACK_STARTERS,
    getStartersState,
    subscribeToStarters,
} from '@/lib/starters';

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
// nothing to do until the user has access or a fresh session.
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

const THREAD_COMPONENTS = {
    ToolFallback: AppToolFallback,
    hiddenTools: SILENT_TOOLS,
};

// The chat itself: its runtime and the list sync.
const ChatRuntime: FC<{
    initialThreadId: string | undefined;
    authError: AuthErrorStatus | null;
}> = ({ initialThreadId, authError }) => {
    const runtime = useRemoteThreadListRuntime({
        adapter: threadListAdapter,
        runtimeHook: useChatThreadRuntime,
        initialThreadId,
        onThreadIdChange: saveLastThreadId,
    });

    useCrossTabSync(runtime);

    // While loading, the composer shows skeletons instead of this list.
    const starters = useSyncExternalStore(
        subscribeToStarters,
        getStartersState
    );
    const config = AuiConfig({
        // `label` is required by the type but unused.
        suggestions: Suggestions(
            (starters.suggestions ?? FALLBACK_STARTERS).map(s => ({
                ...s,
                label: '',
            }))
        ),
    });

    return (
        <AssistantRuntimeProvider runtime={runtime} config={config}>
            {authError ? (
                <div className="min-h-0 flex-1">
                    <AuthErrorScreen status={authError} />
                </div>
            ) : (
                <>
                    <ChatHeader />
                    <div className="min-h-0 flex-1">
                        <Thread components={THREAD_COMPONENTS} />
                    </div>
                </>
            )}
        </AssistantRuntimeProvider>
    );
};

export function App() {
    const authError = useSyncExternalStore(
        subscribe,
        getAuthError,
        getAuthError
    );
    const sidebarMode = useSyncExternalStore(
        subscribeToSidebarMode,
        getSidebarMode,
        getSidebarMode
    );

    useEffect(() => {
        fetch('/api/chat/config')
            .then(r => {
                // Surfaces the reason on load rather than on first message.
                if (r.status === 401 || r.status === 403) {
                    setAuthError(r.status);
                    return null;
                }
                return r.ok ? r.json() : null;
            })
            .then((data: { portalLinkAliases?: string[] } | null) => {
                if (Array.isArray(data?.portalLinkAliases)) {
                    setPortalLinkAliases(data.portalLinkAliases);
                }
            })
            .catch(() => {
                /* links keep the default aliases */
            });
    }, []);

    useEffect(() => {
        fetch('/api/chat/models')
            .then(r => (r.ok ? r.json() : null))
            .then((data: { models?: ModelInfo[] } | null) => {
                if (Array.isArray(data?.models)) setModels(data.models);
            })
            .catch(() => {
                /* no selector; requests use the server's default model */
            });
    }, []);

    // The iframe reloads with the portal page on a full page load (a refresh,
    // or a link the portal doesn't route itself), so the open chat is restored
    // rather than leaving the user in a blank one. Read once: the runtime
    // freezes this on its first render.
    const [initialThreadId] = useState(readLastThreadId);

    // The chat stays mounted in the rail, only hidden, so a reply keeps
    // streaming and the draft survives a collapse. In the hidden mode the host
    // hides the whole frame, so the chat is left as it is, ready to reopen.
    const chatVisible = sidebarMode === 'expanded' || sidebarMode === 'hidden';

    return (
        <>
            {sidebarMode === 'rail' && <SidebarRail />}
            <div
                className={`h-full flex-col ${chatVisible ? 'flex' : 'hidden'}`}
            >
                <ChatRuntime
                    initialThreadId={initialThreadId}
                    authError={authError}
                />
            </div>
        </>
    );
}
