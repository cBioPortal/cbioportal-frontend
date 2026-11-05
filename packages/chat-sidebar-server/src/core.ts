import {
    streamText,
    generateText,
    convertToModelMessages,
    Output,
    stepCountIs,
    tool,
    CallSettings,
    ToolSet,
    UIMessage,
} from 'ai';
import { ServerResponse } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';
import { createMCPClient, MCPClient } from '@ai-sdk/mcp';
import { LangfuseClient } from '@langfuse/client';
import { resolveModels } from './models.js';

export { AVAILABLE_MODELS, DEFAULT_MODEL } from './models.js';

// The SDK's provider-agnostic reasoning setting, so one value maps to each
// provider's own knob (Anthropic `thinking`, Bedrock `reasoningConfig`,
// OpenAI `reasoningEffort`) — a provider-keyed `providerOptions` would
// silently no-op on the others.
type ReasoningEffort = NonNullable<CallSettings['reasoning']>;

const REASONING_EFFORT_VALUES: readonly ReasoningEffort[] = [
    'provider-default',
    'none',
    'minimal',
    'low',
    'medium',
    'high',
    'xhigh',
];

function getReasoningEffort(): ReasoningEffort {
    const configured = process.env.REASONING_EFFORT;
    if (!configured) return 'medium';
    if (!REASONING_EFFORT_VALUES.includes(configured as ReasoningEffort)) {
        throw new Error(
            `Invalid REASONING_EFFORT "${configured}" — expected one of: ${REASONING_EFFORT_VALUES.join(
                ', '
            )}.`
        );
    }
    return configured as ReasoningEffort;
}

const REASONING_EFFORT = getReasoningEffort();

// Fallback for the Langfuse prompt fetch, if it's unreachable.
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_SYSTEM_PROMPT_TEXT = readFileSync(
    join(__dirname, 'systemPrompt.md'),
    'utf-8'
);
const LOCAL_REPORT_PROMPT_TEXT = readFileSync(
    join(__dirname, 'reportPrompt.md'),
    'utf-8'
);
const LOCAL_FOLLOWUPS_PROMPT_TEXT = readFileSync(
    join(__dirname, 'followupsPrompt.md'),
    'utf-8'
);
// What the assistant can and can't do, so the follow-ups suggest only what it
// can deliver.
const CAPABILITIES_PROMPT_TEXT = readFileSync(
    join(__dirname, 'capabilitiesPrompt.md'),
    'utf-8'
);

// Accept LANGFUSE_HOST too — this deployment's shell env uses the older name.
const langfuse =
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY
        ? new LangfuseClient({
              baseUrl:
                  process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST,
          })
        : undefined;

async function getSystemPrompt(pageHref?: string): Promise<string> {
    const systemPrompt = langfuse
        ? // No label: Langfuse serves the version labelled `production`.
          (
              await langfuse.prompt.get('cBioChat Sidebar System Prompt', {
                  fallback: LOCAL_SYSTEM_PROMPT_TEXT,
              })
          ).prompt
        : LOCAL_SYSTEM_PROMPT_TEXT;
    return pageHref
        ? `${systemPrompt}\n\nThe user is currently viewing this cBioPortal page: ${pageHref}`
        : systemPrompt;
}

async function getReportPrompt(): Promise<string> {
    return LOCAL_REPORT_PROMPT_TEXT;
}

// Optional and independent — unset means that server's tools aren't offered
// (same pattern as the providers in models.ts).
interface McpServerConfig {
    name: string;
    url: string;
}
const MCP_SERVERS: McpServerConfig[] = [
    process.env.NAVIGATOR_MCP_URL && {
        name: 'navigator',
        url: process.env.NAVIGATOR_MCP_URL,
    },
    process.env.CBIOPORTAL_MCP_URL && {
        name: 'cbioportal-mcp',
        url: process.env.CBIOPORTAL_MCP_URL,
    },
].filter((s): s is McpServerConfig => Boolean(s));

function describeError(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms
        );
        promise.then(
            v => {
                clearTimeout(timer);
                resolve(v);
            },
            err => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
}

// Bounds a handshake that connects but never completes.
const MCP_CONNECT_TIMEOUT_MS = 10_000;

const mcpClientPromises = new Map<string, Promise<MCPClient>>();
function getMcpClient(server: McpServerConfig): Promise<MCPClient> {
    let promise = mcpClientPromises.get(server.name);
    if (!promise) {
        promise = withTimeout(
            createMCPClient({ transport: { type: 'http', url: server.url } }),
            MCP_CONNECT_TIMEOUT_MS,
            `${server.name} MCP connect`
        );
        // Evict on failure so later calls retry instead of awaiting the same rejection.
        promise.catch(() => {
            if (mcpClientPromises.get(server.name) === promise) {
                mcpClientPromises.delete(server.name);
            }
        });
        mcpClientPromises.set(server.name, promise);
    }
    return promise;
}

// Tool lists rarely change — avoid a round trip per message.
const MCP_TOOLS_CACHE_MS = 5 * 60 * 1000;
const mcpToolsCache = new Map<string, { tools: ToolSet; fetchedAt: number }>();

async function fetchToolsFrom(server: McpServerConfig): Promise<ToolSet> {
    const cached = mcpToolsCache.get(server.name);
    if (cached && Date.now() - cached.fetchedAt < MCP_TOOLS_CACHE_MS) {
        return cached.tools;
    }
    let client: MCPClient | undefined;
    try {
        client = await getMcpClient(server);
        const tools = await client.tools();
        mcpToolsCache.set(server.name, { tools, fetchedAt: Date.now() });
        return tools;
    } catch (err) {
        console.error(`${server.name} MCP unavailable:`, describeError(err));
        mcpClientPromises.delete(server.name);
        // Connect succeeded but tools() failed — close the orphaned client.
        client?.close().catch(() => {});
        // Degrade to the last known-good tools rather than dropping them.
        return cached?.tools ?? {};
    }
}

// A server being unreachable shouldn't fail the whole chat.
async function getMcpTools(): Promise<ToolSet> {
    const toolSets = await Promise.all(MCP_SERVERS.map(fetchToolsFrom));
    const merged: ToolSet = {};
    MCP_SERVERS.forEach((server, i) => {
        for (const [name, tool] of Object.entries(toolSets[i])) {
            if (name in merged) {
                console.error(
                    `MCP tool name collision on "${name}" from ${server.name} — keeping the first one registered`
                );
                continue;
            }
            merged[name] = tool;
        }
    });
    return merged;
}

// No `execute` — client-side tool; the browser navigates and reports back
// via addToolOutput.
const goToPageTool = tool({
    description: `Immediately navigates the user's browser to a cBioPortal URL — the user is taken there right away, with no confirmation step. Once the navigate_to_* tools have produced URL(s), call this yourself, without waiting to be asked, with the main one: the page that most directly answers the user's request. Call it at most once per reply. Still include that URL and any others as markdown links in your reply, so the user can open them manually if navigation fails. Don't call it when the user is already on that page or is asking about the page they're on. Resolve the correct URL first (e.g. via resolve_and_route / navigate_to_* tools) if you don't already have it.`,
    inputSchema: z.object({
        url: z
            .string()
            .describe(
                'A cBioPortal path, e.g. "/study?id=brca_tcga_pan_can_atlas_2018" or "/results/oncoprint?...".'
            ),
    }),
});

// Also client-side — only the browser has the live page store.
const getPageDetailsTool = tool({
    description:
        "Returns a snapshot of what the user's current cBioPortal page is actually showing right now — e.g. the size and makeup of their currently filtered cohort — reflecting their on-screen filters exactly, not a re-derivation of them. Takes no input. May return { available: false } if the current page type isn't supported yet.",
    inputSchema: z.object({}),
});

export async function runChat(
    uiMessages: UIMessage[],
    res: ServerResponse,
    abortSignal: AbortSignal,
    model?: string,
    pageHref?: string
): Promise<void> {
    const { chat } = resolveModels(model);
    const [system, mcpTools] = await Promise.all([
        getSystemPrompt(pageHref),
        getMcpTools(),
    ]);
    const tools: ToolSet = {
        ...mcpTools,
        go_to_page: goToPageTool,
        get_page_details: getPageDetailsTool,
    };

    const result = streamText({
        model: chat,
        system,
        tools,
        reasoning: REASONING_EFFORT,
        stopWhen: stepCountIs(30),
        // A reply stopped mid-tool leaves a call with no result, which the
        // model API rejects on every later turn; drop such calls.
        messages: await convertToModelMessages(uiMessages, {
            ignoreIncompleteToolCalls: true,
        }),
        abortSignal,
    });
    await result.pipeUIMessageStreamToResponse(res);
}

// No tools — everything the report needs (query results, page-state
// snapshots, navigation URLs) is already in the given history.
export async function runReport(
    uiMessages: UIMessage[],
    abortSignal: AbortSignal,
    model?: string
): Promise<string> {
    const { chat } = resolveModels(model);
    const system = await getReportPrompt();
    // Claude rejects a request whose messages end on 'assistant' (treats it
    // as an unsupported prefill) — the session's history ends there whenever
    // the last turn was a reply, so append an explicit trigger turn.
    // Reasoning is left out: the report runs without thinking and needs only
    // what was said and what the tools returned. Replaying it would have to
    // be exact — Claude rejects a latest assistant turn whose thinking blocks
    // differ from the original response, and the Bedrock provider drops
    // reasoning parts that carry no signature.
    const messages = await convertToModelMessages(
        uiMessages
            .map(message => ({
                ...message,
                parts: message.parts.filter(part => part.type !== 'reasoning'),
            }))
            .filter(message => message.parts.length > 0),
        { ignoreIncompleteToolCalls: true }
    );
    const { text } = await generateText({
        model: chat,
        system,
        messages: [
            ...messages,
            {
                role: 'user',
                content: 'Compile the research report for this session now.',
            },
        ],
        abortSignal,
    });
    return text;
}

// Titles come from the opening question alone — enough for a few words, and it
// keeps the call small. No tools, no history, no reasoning.
const TITLE_PROMPT = `Write a title for a cBioPortal research chat that opens with the message below.
Rules: at most six words, no quotes, no trailing punctuation, no filler like "chat about". Reply with the title only.`;

const MAX_TITLE_CHARS = 60;

export async function runTitle(
    text: string,
    abortSignal: AbortSignal,
    model?: string
): Promise<string> {
    const { text: title } = await generateText({
        model: resolveModels(model).utility,
        system: TITLE_PROMPT,
        messages: [{ role: 'user', content: text }],
        reasoning: 'none',
        abortSignal,
    });
    return title.trim().slice(0, MAX_TITLE_CHARS);
}

const SuggestionSchema = z.object({ title: z.string(), prompt: z.string() });

export type Suggestion = z.infer<typeof SuggestionSchema>;

// The page the user is on, appended to the follow-ups system prompt.
function formatPageSection(href: string, details: unknown): string {
    return `## Current page\n\nURL: ${href}\n\nDetails (JSON):\n${JSON.stringify(
        details,
        null,
        2
    )}`;
}

const FOLLOWUP_COUNT = 3;

export interface FollowupsInput {
    question: string;
    answer: string;
    href: string;
    details: unknown;
}

// Follow-ups for the latest exchange on the page the user is on, yielded one
// at a time as each is complete. No tools, no reasoning, and only the
// exchange the client sends, so the call stays fast and cheap.
export async function* runFollowups(
    { question, answer, href, details }: FollowupsInput,
    abortSignal: AbortSignal,
    model?: string
): AsyncGenerator<Suggestion> {
    const { utility } = resolveModels(model);
    const system = `${LOCAL_FOLLOWUPS_PROMPT_TEXT}\n\n${CAPABILITIES_PROMPT_TEXT}\n\n${formatPageSection(
        href,
        details
    )}`;
    // streamText reports failures here rather than throwing.
    let error: unknown;
    const result = streamText({
        model: utility,
        system,
        messages: [
            {
                role: 'user',
                content: `## Latest exchange\n\nUser:\n${question}\n\nAssistant:\n${answer}\n\nSuggest follow-ups.`,
            },
        ],
        output: Output.array({ element: SuggestionSchema }),
        reasoning: 'none',
        abortSignal,
        onError: event => {
            error = event.error;
        },
    });
    let count = 0;
    for await (const suggestion of result.elementStream) {
        yield suggestion;
        if (++count === FOLLOWUP_COUNT) return;
    }
    if (error !== undefined) throw error;
}
