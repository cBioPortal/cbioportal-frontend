// All providers with credentials configured are live simultaneously;
// getModel() picks one per request by the `model` id the caller sends.

import {
    streamText,
    convertToModelMessages,
    LanguageModel,
    UIMessage,
} from 'ai';
import { ServerResponse } from 'http';
import { anthropic } from '@ai-sdk/anthropic';
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createOpenResponses } from '@ai-sdk/open-responses';

const vertexAnthropic = createVertexAnthropic({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION || 'global',
});

const bedrock = createAmazonBedrock({
    region: process.env.AWS_REGION,
});

// Bedrock uses its own region-prefixed inference-profile ids, not
// Anthropic's model names — no default, must be set per account.
const BEDROCK_SONNET_MODEL_ID = process.env.BEDROCK_SONNET_MODEL_ID;

// LibreChat's Agents API speaks the Open Responses spec, not OpenAI's own
// Responses API — @ai-sdk/openai targets OpenAI's spec and doesn't work
// here; @ai-sdk/open-responses does. The agent has its own system prompt,
// so we don't send one.
const librechat = createOpenResponses({
    url: `${process.env.LIBRECHAT_BASE_URL}/responses`,
    name: 'librechat',
    apiKey: process.env.LIBRECHAT_API_KEY,
});
const LIBRECHAT_AGENT_ID = process.env.LIBRECHAT_AGENT_ID;

// Only Sonnet 5 — this account's Vertex/Bedrock access doesn't grant Opus 5
// or Haiku 4.5.
const CLAUDE_MODEL_ID = 'claude-sonnet-5';

// Ids are "<provider>:<model>", except "librechat" (one fixed agent).
function getModel(id: string): LanguageModel {
    if (id === 'librechat') {
        if (!LIBRECHAT_AGENT_ID) {
            throw new Error('LIBRECHAT_AGENT_ID is not set.');
        }
        return librechat(LIBRECHAT_AGENT_ID);
    }
    const [provider, modelId] = id.split(':');
    switch (provider) {
        case 'anthropic':
            return anthropic(modelId);
        case 'vertex':
            return vertexAnthropic(modelId);
        case 'bedrock':
            if (!BEDROCK_SONNET_MODEL_ID) {
                throw new Error('BEDROCK_SONNET_MODEL_ID is not set.');
            }
            return bedrock(BEDROCK_SONNET_MODEL_ID);
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
    BEDROCK_SONNET_MODEL_ID && {
        id: `bedrock:${CLAUDE_MODEL_ID}`,
        name: 'Claude Sonnet 5 (Bedrock)',
    },
    LIBRECHAT_AGENT_ID && { id: 'librechat', name: 'LibreChat' },
].filter((m): m is ModelInfo => Boolean(m));

export const MODEL = AVAILABLE_MODELS[0]?.id ?? '(none configured)';

export async function runChat(
    uiMessages: UIMessage[],
    res: ServerResponse,
    model?: string
): Promise<void> {
    const modelId = model || AVAILABLE_MODELS[0]?.id;
    if (!modelId) {
        throw new Error('No model available — see AVAILABLE_MODELS.');
    }
    const result = streamText({
        model: getModel(modelId),
        messages: await convertToModelMessages(uiMessages),
    });
    await result.pipeUIMessageStreamToResponse(res);
}
