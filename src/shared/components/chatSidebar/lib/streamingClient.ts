import { ChatMessage, MessagePart, StreamCallbacks } from '../store/types';

// TODO: make configurable via server config
const ASSISTANT_API_URL = 'http://localhost:3001';

// Convert an internal ChatMessage part into an AI SDK UIMessage part so the
// server can rebuild the conversation (including prior tool calls and their
// results) via convertToModelMessages. Returns null for parts that should not
// be sent back (e.g. empty text, reasoning).
function serializePart(part: MessagePart): Record<string, unknown> | null {
    switch (part.type) {
        case 'text':
            return part.text ? { type: 'text', text: part.text } : null;
        case 'step-start':
            return { type: 'step-start' };
        case 'tool-call': {
            // Only completed tool calls carry meaningful state for the model.
            const base = {
                type: `tool-${part.toolName}`,
                toolCallId: part.toolCallId,
                input: part.args,
            };
            if (part.status === 'error') {
                return {
                    ...base,
                    state: 'output-error',
                    errorText:
                        typeof part.result === 'string'
                            ? part.result
                            : JSON.stringify(
                                  part.result ?? 'Tool execution failed'
                              ),
                };
            }
            return {
                ...base,
                state: 'output-available',
                output: part.result ?? null,
            };
        }
        case 'reasoning':
        default:
            // Reasoning is not replayed to the model (provider signatures are
            // not retained), and unknown parts are dropped.
            return null;
    }
}

function toUIMessages(messages: ChatMessage[]) {
    return messages.map(msg => ({
        role: msg.role,
        parts: msg.parts
            .map(serializePart)
            .filter((p): p is Record<string, unknown> => p !== null),
    }));
}

export async function streamChat(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal: AbortSignal,
    accessKey: string | null
): Promise<void> {
    const uiMessages = toUIMessages(messages);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (accessKey) {
        headers['Authorization'] = `Bearer ${accessKey}`;
    }

    let response: Response;
    try {
        response = await fetch(`${ASSISTANT_API_URL}/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ messages: uiMessages }),
            signal,
        });
    } catch (err) {
        if (err.name === 'AbortError') return;
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
        return;
    }

    if (response.status === 401) {
        callbacks.onUnauthorized();
        return;
    }

    if (!response.ok) {
        callbacks.onError(
            new Error(`API returned ${response.status}: ${response.statusText}`)
        );
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        callbacks.onError(new Error('No response body'));
        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let streamDone = false;

    try {
        while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') {
                    streamDone = true;
                    break;
                }
                try {
                    dispatchEvent(JSON.parse(payload), callbacks);
                } catch {
                    // Ignore malformed JSON lines
                }
            }
        }
        // onFinish fires exactly once, after the stream is fully consumed.
        callbacks.onFinish();
    } catch (err) {
        if (err.name === 'AbortError') return;
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
        reader.releaseLock();
    }
}

function dispatchEvent(
    event: Record<string, any>,
    callbacks: StreamCallbacks
): void {
    switch (event.type) {
        case 'text-start':
            callbacks.onTextStart(event.id);
            break;
        case 'text-delta':
            callbacks.onTextDelta(event.id, event.delta ?? '');
            break;
        case 'text-end':
            callbacks.onTextEnd(event.id);
            break;
        case 'reasoning-start':
            callbacks.onReasoningStart(event.id);
            break;
        case 'reasoning-delta':
            callbacks.onReasoningDelta(event.id, event.delta ?? '');
            break;
        case 'reasoning-end':
            callbacks.onReasoningEnd(event.id);
            break;
        case 'start-step':
            callbacks.onStepStart();
            break;
        case 'tool-input-start':
            callbacks.onToolInputStart(event.toolCallId, event.toolName ?? '');
            break;
        case 'tool-input-available':
            callbacks.onToolInputAvailable(
                event.toolCallId,
                event.toolName ?? '',
                event.input ?? {}
            );
            break;
        case 'tool-output-available':
            callbacks.onToolOutputAvailable(event.toolCallId, event.output);
            break;
        default:
            // start, finish-step, finish, etc. are not needed here; stream
            // completion is handled by the read loop.
            break;
    }
}
