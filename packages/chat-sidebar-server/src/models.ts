// The models the sidebar runs on, configured from the env. Each enabled
// provider exposes two aliases: `chat` for conversations and reports, and
// `utility` for titles and follow-ups. There is no fallback provider, so any
// other model id a client sends throws NoSuchModelError rather than being
// billed.

import {
    createProviderRegistry,
    customProvider,
    defaultSettingsMiddleware,
    wrapLanguageModel,
} from 'ai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

type Model = ReturnType<typeof wrapLanguageModel>;
type ModelSettings = Parameters<
    typeof defaultSettingsMiddleware
>[0]['settings'];

// Settings passed at the call site still win over these.
function withDefaults(model: Model, settings: ModelSettings): Model {
    return wrapLanguageModel({
        model,
        middleware: defaultSettingsMiddleware({ settings }),
    });
}

interface ProviderConfig {
    id: string;
    label: string;
    chatModelId: string;
    chat: Model;
    utility: Model;
}

function configureBedrock(): ProviderConfig | undefined {
    // Credentials come from the AWS default chain, or AWS_BEARER_TOKEN_BEDROCK,
    // and only resolve on first use — so the model id is what turns Bedrock on.
    const chatModelId = process.env.BEDROCK_CHAT_MODEL;
    if (!chatModelId) return undefined;
    const bedrock = createAmazonBedrock({
        region: process.env.AWS_REGION,
        credentialProvider: defaultProvider(),
    });
    const chat = bedrock(chatModelId);
    return {
        id: 'bedrock',
        label: 'Amazon Bedrock',
        chatModelId,
        // The generic reasoning setting leaves Bedrock's `display` unset for
        // Claude, where the other providers ask for summarized thinking;
        // without it the sidebar's reasoning disclosure would stay empty. The
        // option is Claude-specific, so other models Bedrock hosts don't get it.
        chat: chatModelId.includes('anthropic.')
            ? withDefaults(chat, {
                  providerOptions: {
                      bedrock: { reasoningConfig: { display: 'summarized' } },
                  },
              })
            : chat,
        utility: bedrock(
            process.env.BEDROCK_UTILITY_MODEL ||
                'us.anthropic.claude-haiku-4-5-20251001-v1:0'
        ),
    };
}

function configureAnthropic(): ProviderConfig | undefined {
    if (!process.env.ANTHROPIC_API_KEY) return undefined;
    const chatModelId = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-5';
    return {
        id: 'anthropic',
        label: 'Anthropic',
        chatModelId,
        chat: anthropic(chatModelId),
        utility: anthropic(
            process.env.ANTHROPIC_UTILITY_MODEL || 'claude-haiku-4-5'
        ),
    };
}

function configureOpenAI(): ProviderConfig | undefined {
    if (!process.env.OPENAI_API_KEY) return undefined;
    const chatModelId = process.env.OPENAI_CHAT_MODEL || 'gpt-6.1-sol';
    return {
        id: 'openai',
        label: 'OpenAI',
        chatModelId,
        // OpenAI only returns reasoning summaries when asked; without them the
        // sidebar's reasoning disclosure would stay empty.
        chat: withDefaults(openai(chatModelId), {
            providerOptions: { openai: { reasoningSummary: 'auto' } },
        }),
        utility: openai(process.env.OPENAI_UTILITY_MODEL || 'gpt-6-luna'),
    };
}

// The first one configured is the default.
const PROVIDERS = [
    configureBedrock(),
    configureAnthropic(),
    configureOpenAI(),
].filter((p): p is ProviderConfig => Boolean(p));

const registry = createProviderRegistry(
    Object.fromEntries(
        PROVIDERS.map(p => [
            p.id,
            customProvider({
                languageModels: { chat: p.chat, utility: p.utility },
            }),
        ])
    )
);

export interface ModelInfo {
    id: string;
    name: string;
}

export const AVAILABLE_MODELS: readonly ModelInfo[] = PROVIDERS.map(p => ({
    id: `${p.id}:chat`,
    name: `${p.chatModelId} (${p.label})`,
}));

export const DEFAULT_MODEL: string | undefined = AVAILABLE_MODELS[0]?.id;

// Takes an id from AVAILABLE_MODELS, or the default when none is given. The
// utility model comes from the same provider, so whichever provider serves a
// chat also serves its titles and follow-ups.
export function resolveModels(
    requested?: string
): { chat: Model; utility: Model } {
    const id = requested || DEFAULT_MODEL;
    if (!id) {
        throw new Error('No model configured — see .env.example.');
    }
    const chat = registry.languageModel(
        id as Parameters<typeof registry.languageModel>[0]
    );
    const providerId = id.slice(0, id.indexOf(':'));
    return {
        chat,
        utility: registry.languageModel(`${providerId}:utility`),
    };
}
