import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import {
    AssistantRuntime,
    SimpleImageAttachmentAdapter,
    useAuiState,
} from '@assistant-ui/react';
import { useAISDKRuntime } from '@assistant-ui/ai-sdk';
import { throwIfUnauthorized } from './chatApi';
import { getSelectedModel } from './chatSession';
import { notifyNavigate, resolvePortalLink } from './portal-link';
import { getLatestPageEvents } from './page-events';
import { notifyThreadsChanged } from './threadSync';

// Stateless — one instance for the app's lifetime rather than one per thread.
const attachmentAdapter = new SimpleImageAttachmentAdapter();

// Runs once per thread the session has visited, each with its own chat and
// history, which is what lets a run keep streaming after the user switches
// away. Nothing app-wide belongs in here — a fetch would fire once per thread.
export function useChatThreadRuntime(): AssistantRuntime {
    const threadId = useAuiState(s => s.threadListItem.id);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat/message',
                // The portal proxies this endpoint and rejects it when the
                // session has lapsed or the user lacks the chat role.
                fetch: async (input, init) => {
                    const response = await fetch(input, init);
                    throwIfUnauthorized(response);
                    return response;
                },
                // The server keeps the history, so only the new message goes
                // up — the prompt, or after a client-side tool call the reply
                // carrying its output — with the parent it hangs off, which
                // places it in the tree when the user edits or regenerates.
                // Evaluated per request, so it carries the current model and
                // page even though this hook never re-reads them.
                prepareSendMessagesRequest: ({ id, messages }) => ({
                    body: {
                        id,
                        message: messages.at(-1),
                        parentId: messages.at(-2)?.id ?? null,
                        model: getSelectedModel(),
                        pageHref: getLatestPageEvents().snapshot?.href ?? null,
                    },
                }),
            }),
        []
    );

    const chat = useChat({
        id: threadId,
        transport,
        // Model decides whether to navigate now vs. just link — see
        // go_to_page guidance in the system prompt.
        onToolCall: async ({ toolCall }) => {
            if (toolCall.toolName === 'go_to_page') {
                const { url } = toolCall.input as { url: string };
                const path = resolvePortalLink(url)?.path;
                const navigated = Boolean(path);
                if (path) notifyNavigate(path);
                addToolOutput({
                    tool: 'go_to_page',
                    toolCallId: toolCall.toolCallId,
                    output: { navigated },
                });
                return;
            }
            if (toolCall.toolName === 'get_page_details') {
                // The latest rather than the latest settled one, which can be
                // a page the user has since left; pending says it's mid-load.
                const snapshot = getLatestPageEvents().snapshot;
                addToolOutput({
                    tool: 'get_page_details',
                    toolCallId: toolCall.toolCallId,
                    output: snapshot
                        ? { ...snapshot.details, pending: snapshot.pending }
                        : { available: false },
                });
                return;
            }
        },
        // The server has saved the reply, or dropped a prompt stopped before
        // any reply, and the chat has moved up the list.
        onFinish: () => notifyThreadsChanged(),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });
    const { addToolOutput } = chat;

    return useAISDKRuntime(chat, {
        adapters: { attachments: attachmentAdapter },
    });
}
