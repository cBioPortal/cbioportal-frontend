import { registerTelemetry } from 'ai';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { LangfuseVercelAiSdkIntegration } from '@langfuse/vercel-ai-sdk';
import { Attributes } from '@opentelemetry/api';
import { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

// Langfuse is used when both keys are set: it serves the system prompt
// (core.ts) and receives a trace of every model call. The base URL is passed
// explicitly because the span processor reads only LANGFUSE_BASE_URL, and this
// deployment's shell env uses the older LANGFUSE_HOST.
export const langfuseConfig =
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY
        ? {
              publicKey: process.env.LANGFUSE_PUBLIC_KEY,
              secretKey: process.env.LANGFUSE_SECRET_KEY,
              baseUrl:
                  process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST,
          }
        : undefined;

// Langfuse's own rule for environment names.
const ENVIRONMENT_PATTERN = /^(?!langfuse)[a-z0-9_-]{1,40}$/;

// Each deployment traces into its own environment, so one that forgot to set
// it is refused rather than left to mix into Langfuse's `default`. `pnpm dev`
// (NODE_ENV=development) traces into `dev` unless told otherwise.
function getEnvironment(): string {
    const configured =
        process.env.LANGFUSE_TRACING_ENVIRONMENT ||
        (process.env.NODE_ENV === 'development' ? 'dev' : '');
    if (!ENVIRONMENT_PATTERN.test(configured)) {
        throw new Error(
            `LANGFUSE_TRACING_ENVIRONMENT must be set when Langfuse is configured — lowercase letters, digits, - and _, at most 40 characters, not starting with "langfuse"; got "${configured}". See .env.example.`
        );
    }
    return configured;
}

// The AI SDK records an image attachment, such as a screenshot, as a `uri`
// part holding a data URL, but LangfuseSpanProcessor moves only `blob` parts
// into Langfuse media. Anything else stays inline in the trace, and in every
// later turn's trace too, as each one replays the history. Registered before
// it, this rewrites those parts as blobs.
const MESSAGE_ATTRIBUTES = ['gen_ai.input.messages', 'gen_ai.output.messages'];

interface MessagePart {
    type?: string;
    uri?: unknown;
    content?: unknown;
}

const dataUrlsAsBlobs: SpanProcessor = {
    onStart() {},
    onEnd(span: ReadableSpan) {
        for (const key of MESSAGE_ATTRIBUTES) {
            const value = span.attributes[key];
            if (typeof value !== 'string' || !value.includes('"uri":"data:')) {
                continue;
            }
            try {
                const messages: { parts?: MessagePart[] }[] = JSON.parse(value);
                for (const part of messages.flatMap(m => m.parts ?? [])) {
                    if (
                        part.type === 'uri' &&
                        typeof part.uri === 'string' &&
                        part.uri.startsWith('data:')
                    ) {
                        part.type = 'blob';
                        part.content = part.uri;
                        delete part.uri;
                    }
                }
                (span.attributes as Attributes)[key] = JSON.stringify(messages);
            } catch (err) {
                console.error(`rewriting ${key} for Langfuse failed:`, err);
            }
        }
    },
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
};

if (langfuseConfig) {
    const provider = new NodeTracerProvider({
        spanProcessors: [
            dataUrlsAsBlobs,
            new LangfuseSpanProcessor({
                ...langfuseConfig,
                environment: getEnvironment(),
            }),
        ],
    });
    // Also installs the async context that carries the trace attributes set
    // with propagateAttributes down to the model calls.
    provider.register();
    registerTelemetry(new LangfuseVercelAiSdkIntegration());

    // Spans are exported in batches; send the last one before exiting, as on
    // the SIGTERM of a rollout.
    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
        process.once(signal, () => {
            provider
                .shutdown()
                .catch(err => console.error('flushing traces failed:', err))
                .finally(() => process.exit(0));
        });
    }
}
