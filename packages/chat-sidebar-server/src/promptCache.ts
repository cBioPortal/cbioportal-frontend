// Prompt caching for the chat. Each provider reads only the options under its
// own name, so one marker carries both the Anthropic and the Bedrock spelling
// and works whichever of them serves the request. OpenAI ignores both and
// caches repeated prompt prefixes by itself.

import { LanguageModelMiddleware, SystemModelMessage } from 'ai';

type ProviderOptions = NonNullable<SystemModelMessage['providerOptions']>;

// Ends a cached prefix: everything up to and including the marked message is
// cached, and a later request that starts with the same content reads it back.
export const CACHE_BREAKPOINT: ProviderOptions = {
    anthropic: { cacheControl: { type: 'ephemeral' } },
    bedrock: { cachePoint: { type: 'default' } },
};

function withBreakpoint(options?: ProviderOptions): ProviderOptions {
    const merged: ProviderOptions = { ...options };
    for (const [provider, value] of Object.entries(CACHE_BREAKPOINT)) {
        merged[provider] = { ...options?.[provider], ...value };
    }
    return merged;
}

// Marks the last message of every model call, so the next step of a reply and
// the user's next message read the conversation so far from cache. This is
// middleware rather than prepareStep because prepareStep's message changes
// carry over to later steps, which would leave a marker on every earlier step
// and exceed the 4 a request allows.
export const cacheConversationTail: LanguageModelMiddleware = {
    transformParams: async ({ params }) => {
        const last = params.prompt.at(-1);
        if (!last) return params;
        return {
            ...params,
            prompt: [
                ...params.prompt.slice(0, -1),
                {
                    ...last,
                    providerOptions: withBreakpoint(last.providerOptions),
                },
            ],
        };
    },
};
