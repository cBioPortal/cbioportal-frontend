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
import { AuthErrorStatus, getSelectedModel, setAuthError } from './chatSession';
import { isPortalLink, notifyNavigate } from './portal-link';
import { requestPageDetails, requestPageHref } from './parent-bridge';

export class ChatAuthError extends Error {
    constructor(readonly status: AuthErrorStatus) {
        super(`the portal rejected the chat request (${status})`);
    }
}

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
                    if (response.status === 401 || response.status === 403) {
                        throw new ChatAuthError(response.status);
                    }
                    return response;
                },
                // Evaluated per request, so the model picker stays live even
                // though this hook never re-reads it.
                body: async () => ({
                    model: getSelectedModel(),
                    pageHref: await requestPageHref(),
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
        onError: error => {
            if (error instanceof ChatAuthError) setAuthError(error.status);
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });
    const { addToolOutput } = chat;

    return useAISDKRuntime(chat, {
        adapters: { attachments: attachmentAdapter },
    });
}
