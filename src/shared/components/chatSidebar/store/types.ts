export interface TextPart {
    type: 'text';
    text: string;
}

export interface ReasoningPart {
    type: 'reasoning';
    text: string;
    // false while the model is actively reasoning, true once the reasoning
    // block has completed (or the stream has finished).
    done: boolean;
}

export interface ToolCallPart {
    type: 'tool-call';
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    status: 'pending' | 'running' | 'done' | 'error';
    result?: unknown;
}

// Marks the boundary between LLM steps within a single assistant message.
// convertToModelMessages uses these to split the assistant turn into separate
// model messages so each step's tool calls are paired with their results.
export interface StepStartPart {
    type: 'step-start';
}

export type MessagePart =
    | TextPart
    | ReasoningPart
    | ToolCallPart
    | StepStartPart;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    parts: MessagePart[];
}

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface StreamCallbacks {
    onTextStart: (id: string) => void;
    onTextDelta: (id: string, delta: string) => void;
    onTextEnd: (id: string) => void;
    onReasoningStart: (id: string) => void;
    onReasoningDelta: (id: string, delta: string) => void;
    onReasoningEnd: (id: string) => void;
    // Marks the start of a new LLM step within the current assistant message.
    onStepStart: () => void;
    // Tool-call lifecycle, mirroring the AI SDK v5 UI message stream events.
    onToolInputStart: (toolCallId: string, toolName: string) => void;
    onToolInputAvailable: (
        toolCallId: string,
        toolName: string,
        input: Record<string, unknown>
    ) => void;
    // Emitted only for server-executed tools (e.g. MCP). Client-side tools
    // produce no output event — the frontend executes them and supplies the
    // result itself.
    onToolOutputAvailable: (toolCallId: string, output: unknown) => void;
    onUnauthorized: () => void;
    onFinish: () => void;
    onError: (err: Error) => void;
}
