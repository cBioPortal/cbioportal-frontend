// All configured providers are live; getModel() picks one per request.

import {
    streamText,
    convertToModelMessages,
    stepCountIs,
    tool,
    LanguageModel,
    ToolSet,
    UIMessage,
} from 'ai';
import { ServerResponse } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createMCPClient, MCPClient } from '@ai-sdk/mcp';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { LangfuseClient } from '@langfuse/client';

const vertexAnthropic = createVertexAnthropic({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION || 'global',
});

const bedrock = createAmazonBedrock({
    region: process.env.AWS_REGION,
    credentialProvider: defaultProvider(),
});

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;

// Direct Anthropic and Vertex access currently use Sonnet 5.
const CLAUDE_MODEL_ID = 'claude-sonnet-5';

// Fallback for the Langfuse prompt fetch, if it's unreachable.
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_SYSTEM_PROMPT_TEXT = readFileSync(
    join(__dirname, 'systemPrompt.md'),
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
        ? (
              await langfuse.prompt.get('cBioChat Sidebar System Prompt', {
                  label: 'latest',
                  fallback: LOCAL_SYSTEM_PROMPT_TEXT,
              })
          ).prompt
        : LOCAL_SYSTEM_PROMPT_TEXT;
    return pageHref
        ? `${systemPrompt}\n\nThe user is currently viewing this cBioPortal page: ${pageHref}`
        : systemPrompt;
}

// Optional and independent — unset means that server's tools aren't offered
// (same pattern as AVAILABLE_MODELS below).
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
    description: `Immediately navigates the user's browser to a cBioPortal URL — the user is taken there right away, with no confirmation step. Only call this when the user has clearly asked to go somewhere. If you're only mentioning a study, patient, or page as context, write it as a normal markdown link in your reply instead and don't call this tool. Resolve the correct URL first (e.g. via resolve_and_route / navigate_to_* tools) if you don't already have it.`,
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

// Ids are "<provider>:<model>".
function getModel(id: string): LanguageModel {
    const separatorIndex = id.indexOf(':');
    const provider = id.slice(0, separatorIndex);
    const modelId = id.slice(separatorIndex + 1);
    switch (provider) {
        case 'anthropic':
            return anthropic(modelId);
        case 'vertex':
            return vertexAnthropic(modelId);
        case 'bedrock':
            if (!BEDROCK_MODEL_ID || modelId !== BEDROCK_MODEL_ID) {
                throw new Error(`Unknown Bedrock model id: "${modelId}"`);
            }
            return bedrock(BEDROCK_MODEL_ID);
        default:
            throw new Error(`Unknown model id: "${id}"`);
    }
}

export interface ModelInfo {
    id: string;
    name: string;
}

// Only listed if its credentials are configured.
export const AVAILABLE_MODELS: readonly ModelInfo[] = [
    process.env.ANTHROPIC_API_KEY && {
        id: `anthropic:${CLAUDE_MODEL_ID}`,
        name: 'Claude Sonnet 5 (Anthropic)',
    },
    process.env.GOOGLE_VERTEX_PROJECT && {
        id: `vertex:${CLAUDE_MODEL_ID}`,
        name: 'Claude Sonnet 5 (Vertex)',
    },
    BEDROCK_MODEL_ID && {
        id: `bedrock:${BEDROCK_MODEL_ID}`,
        name: `${BEDROCK_MODEL_ID} (Amazon Bedrock)`,
    },
].filter((m): m is ModelInfo => Boolean(m));

export const MODEL = AVAILABLE_MODELS[0]?.id ?? '(none configured)';

export async function runChat(
    uiMessages: UIMessage[],
    res: ServerResponse,
    model?: string,
    pageHref?: string
): Promise<void> {
    const modelId = model || AVAILABLE_MODELS[0]?.id;
    if (!modelId) {
        throw new Error('No model available — see AVAILABLE_MODELS.');
    }
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
        model: getModel(modelId),
        system,
        tools,
        stopWhen: stepCountIs(30),
        messages: await convertToModelMessages(uiMessages),
    });
    await result.pipeUIMessageStreamToResponse(res);
}
