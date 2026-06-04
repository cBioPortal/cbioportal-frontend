import { observable, action, makeObservable, runInAction } from 'mobx';
import { ChatMessage, ChatStatus } from './types';
import { streamChat } from '../lib/streamingClient';
import { executeToolCall, isClientTool } from '../lib/toolExecutor';

let _msgCounter = 0;
function nextId() {
    return `msg-${++_msgCounter}`;
}

export class ChatStore {
    @observable messages: ChatMessage[] = [];
    @observable status: ChatStatus = 'idle';
    @observable errorMessage: string | null = null;
    @observable isOpen: boolean = false;

    private abortController: AbortController | null = null;

    // Maps a stream-scoped id (text/reasoning part id or tool call id) → index
    // within the current assistant message's parts array.
    private partIndexMap: Map<string, number> = new Map();
    private currentAssistantMsgIndex: number = -1;

    // Per-turn bookkeeping for the tool round-trip loop.
    private pendingToolExecutions: Promise<void>[] = [];
    private clientToolCallsThisTurn: Set<string> = new Set();

    // RAF-based delta buffer: accumulates text/reasoning deltas between frames
    // so MobX is only updated once per animation frame instead of once per chunk.
    private pendingTextDeltas: Map<string, string> = new Map();
    private pendingReasoningDeltas: Map<string, string> = new Map();
    private rafId: number | null = null;

    constructor() {
        makeObservable(this);
    }

    @action
    toggleSidebar() {
        this.isOpen = !this.isOpen;
    }

    @action
    openSidebar() {
        this.isOpen = true;
    }

    @action
    closeSidebar() {
        this.isOpen = false;
    }

    @action
    sendMessage(text: string) {
        if (this.status === 'streaming') return;

        const userMsg: ChatMessage = {
            id: nextId(),
            role: 'user',
            parts: [{ type: 'text', text }],
        };
        this.messages.push(userMsg);

        const assistantMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            parts: [],
        };
        this.messages.push(assistantMsg);
        this.currentAssistantMsgIndex = this.messages.length - 1;

        this.status = 'streaming';
        this.errorMessage = null;
        this.abortController = new AbortController();

        this.runTurn();
    }

    /**
     * Runs a single request/response turn against the chat API. After the
     * stream finishes, if the assistant issued client-side tool calls (which
     * the server cannot execute), their results are sent back in a follow-up
     * turn so the LLM loop continues — mirroring the AI SDK's
     * `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`.
     */
    private runTurn() {
        // Reset per-turn state. Tool-call parts already on the assistant
        // message are preserved so their results are replayed to the server.
        this.partIndexMap.clear();
        this.pendingToolExecutions = [];
        this.clientToolCallsThisTurn = new Set();
        this.cancelPendingFlush();

        const signal = this.abortController!.signal;

        streamChat(
            // Send all messages except the empty assistant placeholder when it
            // has not produced any parts yet; otherwise include it so prior
            // tool calls and results are part of the conversation.
            this.messagesForRequest(),
            {
                onTextStart: (id: string) => {
                    runInAction(() => {
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (!msg) return;
                        const idx = msg.parts.length;
                        msg.parts.push({ type: 'text', text: '' });
                        this.partIndexMap.set(id, idx);
                    });
                },
                onTextDelta: (id: string, delta: string) => {
                    this.pendingTextDeltas.set(
                        id,
                        (this.pendingTextDeltas.get(id) ?? '') + delta
                    );
                    this.scheduleFlush();
                },
                onTextEnd: (_id: string) => {},
                onReasoningStart: (id: string) => {
                    runInAction(() => {
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (!msg) return;
                        const idx = msg.parts.length;
                        msg.parts.push({
                            type: 'reasoning',
                            text: '',
                            done: false,
                        });
                        this.partIndexMap.set(id, idx);
                    });
                },
                onReasoningDelta: (id: string, delta: string) => {
                    this.pendingReasoningDeltas.set(
                        id,
                        (this.pendingReasoningDeltas.get(id) ?? '') + delta
                    );
                    this.scheduleFlush();
                },
                onReasoningEnd: (id: string) => {
                    runInAction(() => {
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (!msg) return;
                        const idx = this.partIndexMap.get(id);
                        if (idx === undefined) return;
                        const part = msg.parts[idx];
                        if (part?.type === 'reasoning') {
                            part.done = true;
                        }
                    });
                },
                onStepStart: () => {
                    runInAction(() => {
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (!msg) return;
                        msg.parts.push({ type: 'step-start' });
                    });
                },
                onToolInputStart: (toolCallId: string, toolName: string) => {
                    runInAction(() => {
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (!msg) return;
                        const idx = msg.parts.length;
                        msg.parts.push({
                            type: 'tool-call',
                            toolCallId,
                            toolName,
                            args: {},
                            status: 'running',
                        });
                        this.partIndexMap.set(toolCallId, idx);
                    });
                },
                onToolInputAvailable: (
                    toolCallId: string,
                    toolName: string,
                    input: Record<string, unknown>
                ) => {
                    runInAction(() => {
                        const part = this.toolPart(toolCallId);
                        if (part) {
                            part.args = input;
                            part.toolName = part.toolName || toolName;
                        }
                    });

                    // Server-executed tools (MCP) deliver their result via a
                    // tool-output-available event; do not run them here.
                    if (!isClientTool(toolName)) return;

                    this.clientToolCallsThisTurn.add(toolCallId);

                    const exec = executeToolCall(toolName, input)
                        .then(result => {
                            runInAction(() => {
                                const part = this.toolPart(toolCallId);
                                if (part) {
                                    part.status = 'done';
                                    part.result = result;
                                }
                            });
                        })
                        .catch(err => {
                            runInAction(() => {
                                const part = this.toolPart(toolCallId);
                                if (part) {
                                    part.status = 'error';
                                    part.result = {
                                        error:
                                            err instanceof Error
                                                ? err.message
                                                : String(err),
                                    };
                                }
                            });
                        });
                    this.pendingToolExecutions.push(exec);
                },
                onToolOutputAvailable: (
                    toolCallId: string,
                    output: unknown
                ) => {
                    runInAction(() => {
                        const part = this.toolPart(toolCallId);
                        if (part) {
                            part.status = 'done';
                            part.result = output;
                        }
                    });
                },
                onFinish: () => {
                    // Flush any deltas that arrived since the last RAF fired.
                    this.cancelPendingFlush();
                    this.flushDeltas();

                    // Wait for any in-flight client tool executions, then decide
                    // whether to continue the loop with a follow-up request.
                    const hadClientToolCalls =
                        this.clientToolCallsThisTurn.size > 0;
                    Promise.all(this.pendingToolExecutions).then(() => {
                        runInAction(() => {
                            // Bail if the stream was cancelled meanwhile.
                            if (this.status !== 'streaming') return;
                            if (hadClientToolCalls) {
                                this.runTurn();
                            } else {
                                this.finishStreaming();
                            }
                        });
                    });
                },
                onError: (err: Error) => {
                    runInAction(() => {
                        this.status = 'error';
                        this.errorMessage = err.message;
                        this.abortController = null;
                        this.partIndexMap.clear();
                        this.pendingToolExecutions = [];
                        this.clientToolCallsThisTurn = new Set();
                        // Remove empty assistant placeholder on error
                        const msg = this.messages[
                            this.currentAssistantMsgIndex
                        ];
                        if (msg && msg.parts.length === 0) {
                            this.messages.splice(
                                this.currentAssistantMsgIndex,
                                1
                            );
                        }
                    });
                },
            },
            signal
        );
    }

    // Messages to send to the API. Drops the trailing assistant placeholder
    // only while it is still empty (first turn); once it has parts it must be
    // included so tool calls/results are replayed.
    private messagesForRequest(): ChatMessage[] {
        const last = this.messages[this.currentAssistantMsgIndex];
        if (last && last.role === 'assistant' && last.parts.length === 0) {
            return this.messages.slice(0, this.currentAssistantMsgIndex);
        }
        return this.messages.slice();
    }

    private flushDeltas = () => {
        this.rafId = null;
        if (
            this.pendingTextDeltas.size === 0 &&
            this.pendingReasoningDeltas.size === 0
        )
            return;
        runInAction(() => {
            const msg = this.messages[this.currentAssistantMsgIndex];
            if (!msg) return;
            for (const [id, delta] of this.pendingTextDeltas) {
                const idx = this.partIndexMap.get(id);
                const part = idx !== undefined ? msg.parts[idx] : undefined;
                if (part?.type === 'text') part.text += delta;
            }
            for (const [id, delta] of this.pendingReasoningDeltas) {
                const idx = this.partIndexMap.get(id);
                const part = idx !== undefined ? msg.parts[idx] : undefined;
                if (part?.type === 'reasoning') part.text += delta;
            }
            this.pendingTextDeltas.clear();
            this.pendingReasoningDeltas.clear();
        });
    };

    private scheduleFlush() {
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(this.flushDeltas);
        }
    }

    private cancelPendingFlush() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.pendingTextDeltas.clear();
        this.pendingReasoningDeltas.clear();
    }

    private toolPart(toolCallId: string) {
        const msg = this.messages[this.currentAssistantMsgIndex];
        if (!msg) return undefined;
        const idx = this.partIndexMap.get(toolCallId);
        if (idx === undefined) return undefined;
        const part = msg.parts[idx];
        return part?.type === 'tool-call' ? part : undefined;
    }

    @action
    private finishStreaming() {
        // Safety net: a completed message should never read as still thinking,
        // even if a reasoning-end event was missed.
        const msg = this.messages[this.currentAssistantMsgIndex];
        msg?.parts.forEach(part => {
            if (part.type === 'reasoning') {
                part.done = true;
            }
        });
        this.status = 'idle';
        this.abortController = null;
        this.partIndexMap.clear();
        this.pendingToolExecutions = [];
        this.clientToolCallsThisTurn = new Set();
    }

    @action
    cancelStream() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.status = 'idle';
        this.partIndexMap.clear();
        this.pendingToolExecutions = [];
        this.clientToolCallsThisTurn = new Set();
        this.cancelPendingFlush();
    }

    @action
    clearError() {
        this.errorMessage = null;
        if (this.status === 'error') {
            this.status = 'idle';
        }
    }
}

export const chatStore = new ChatStore();
